import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {createApp,configFromEnv} from '../server.js';
import {countSourceTables,compareCoverage,requireReviewedCoverage} from '../source-coverage.mjs';

const owner='00000000-0000-4000-8000-000000000099';
const series={id:'669966f7-6563-4367-8fdc-1f8c034038b3',code:'hulk_fit',title:'HULK FIT',status:'draft'};
const ocr='BACK WORKOUT\nLat Pulldown\nSET KG REPS REST\n1 10 14 01:00\n2 15 12 01:00\n3 15 10 01:00\nEach Side Tempo + Add Set\nT Bar Chest Supported Row\nSET KG REPS REST\n1 5 14 01:00\n2 Wie) 12 01:00\n3 7.5 10 01:00';
const source=countSourceTables(ocr);
function workout(){return {title:'BACK WORKOUT ( lats ) | BEGINNER 1',duration_days:null,days:[{day:null,title:'BACK WORKOUT ( lats ) | BEGINNER 1',exercises:[
 {name:'Lat Pulldown',equipment:'gym',each_side:true,primary:[],set_details:[{kg:10,reps:14,rest_seconds:60},{kg:15,reps:12,rest_seconds:60},{kg:15,reps:10,rest_seconds:60}]},
 {name:'T Bar Chest Supported Row',equipment:'gym',each_side:null,primary:[],set_details:[{kg:5,reps:14,rest_seconds:60},{kg:7.5,reps:12,rest_seconds:60},{kg:7.5,reps:10,rest_seconds:60}]}
 ]}]};}
const incomplete=()=>{const w=workout();w.title='Lat Pulldown';w.days[0].exercises=w.days[0].exercises.slice(0,1);w.days[0].exercises[0].set_details=[{kg:10,reps:14,rest_seconds:null}];return w;};

test('independent source inventory counts two tables and six rows even when OCR misreads a weight',()=>{
 assert.equal(source.status,'counted');assert.deepEqual(source.tables.map(t=>t.sets),[3,3]);assert.deepEqual(source.tables.map(t=>t.restRows),[3,3]);
 assert.equal(compareCoverage(source,incomplete()).status,'mismatch');assert.equal(compareCoverage(source,workout()).status,'counts_match');
});
test('unrecognized layouts, skipped set ordinals and partially read rows stay unverified',()=>{
 for(const text of ['A workout with three sets',ocr.replace('2 15 12','4 15 12'),ocr.replace('3 15 10 01:00','3 15 10')])assert.equal(countSourceTables(text).status,'unverified');
});
test('equal counts cannot mask missing source rest values',()=>{const w=workout();w.days[0].exercises[0].set_details[1].rest_seconds=null;assert.equal(compareCoverage(source,w).status,'mismatch');});
test('human review and explicit manual counts are required; count overrides need a reason',()=>{
 assert.throws(()=>requireReviewedCoverage(source,workout(),{}),e=>e.code==='review_required');
 assert.throws(()=>requireReviewedCoverage(source,incomplete(),{reviewConfirmed:true}),e=>e.code==='source_mismatch');
 assert.throws(()=>requireReviewedCoverage(source,incomplete(),{reviewConfirmed:true,sourceCountOverride:'x',sourceSetCounts:[1]}),e=>e.code==='source_override_reason');
 const corrected=requireReviewedCoverage(source,incomplete(),{reviewConfirmed:true,sourceCountOverride:'The source table count needs manual correction.',sourceSetCounts:[1]});assert.equal(corrected.status,'owner_confirmed');
 const unknown={status:'unverified',tables:[],message:'Unrecognized layout.'};
 assert.throws(()=>requireReviewedCoverage(unknown,workout(),{reviewConfirmed:true,sourceSetCounts:[3]}),e=>e.code==='source_counts_required');
 assert.equal(requireReviewedCoverage(unknown,workout(),{reviewConfirmed:true,sourceSetCounts:[3,3]}).status,'owner_confirmed');
});

async function harness(options,fn){
 const rows=new Map(),counts={extract:0,inspect:0,writes:0},cfg=configFromEnv({SUPABASE_URL:'https://db.invalid',SUPABASE_ANON_KEY:'sb_publishable_test',NVIDIA_API_KEY:'secret-provider-key',NVIDIA_MODEL:'test-model',RENDER_EXTERNAL_URL:'https://hulk-fitness-api.onrender.com'});
 if(options.noAi)cfg.nvidiaKey='';
 const fetcher=async(url,init={})=>{
  if(url.endsWith('/auth/v1/user'))return Response.json({id:owner,is_anonymous:false});
  if(url.endsWith('/rpc/my_role'))return Response.json(options.role||'owner');
  if(url.includes('/training_series?'))return Response.json([series]);
  if(url.includes('/training_programs?')){
   if(init.method==='POST'){counts.writes++;const p=JSON.parse(init.body);assert.equal(p.created_by,owner);assert.equal(p.status,'draft');assert.equal(init.headers.Authorization,'Bearer owner-jwt');rows.set(p.id,p);return Response.json([p],{status:201});}
   const id=url.split('id=eq.')[1];return Response.json(rows.has(id)?[rows.get(id)]:[]);
  }
  throw Error('Unexpected URL');
 };
 const app=createApp({config:cfg,fetcher,logger:{info(){},error(){}},inspect:async({images})=>{counts.inspect++;assert.equal(images.length,1);return options.source||structuredClone(source);},extract:async({images})=>{counts.extract++;assert.equal(images.length,1);assert.equal((await sharp(images[0].jpeg).metadata()).format,'jpeg');if(options.extractError)throw options.extractError;return options.incomplete?incomplete():workout();}});
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
 const image=(await sharp({create:{width:30,height:40,channels:3,background:'#fff'}}).png().toBuffer()).toString('base64');
 const send=async(body={},auth=true)=>{const response=await fetch(base+'/extract-workout',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://hulk-fitness-api.onrender.com',...(auth?{Authorization:'Bearer owner-jwt'}:{})},body:JSON.stringify({seriesCode:'hulk_fit',images:[image],action:'preview',...body})});return {status:response.status,data:await response.json()};};
 try{await fn({send,base,rows,counts,cfg});}finally{await new Promise(r=>server.close(r));}
}
test('the observed one-exercise/one-row preview is rejected with editable data and zero writes',async()=>harness({incomplete:true},async({send,rows,counts})=>{const {status,data}=await send();assert.equal(status,422);assert.equal(data.code,'source_mismatch');assert.equal(data.sourceCheck.status,'mismatch');assert.equal(data.review.days[0].exercises[0].set_details.length,1);assert.equal(rows.size,0);assert.equal(counts.extract,1);}));
test('a full preview remains unsaved and returns original tri-state fields for review',async()=>harness({},async({send,rows})=>{const {status,data}=await send();assert.equal(status,200);assert.equal(data.reviewRequired,true);assert.equal(data.sourceCheck.status,'counts_match');assert.equal(data.review.days[0].exercises[1].each_side,null);assert.equal(rows.size,0);}));
test('reviewed save uses edited values without another AI call; retries never overwrite',async()=>harness({incomplete:true},async({send,rows,counts})=>{
 await send();const w=workout(),body={action:'save_reviewed',reviewedWorkout:w,reviewConfirmed:true,status:'published',created_by:'forged'};
 const result=await send(body);assert.equal(result.status,201);assert.equal(result.data.status,'draft');assert.equal(result.data.exerciseCount,2);assert.equal(counts.extract,1);assert.equal(counts.writes,1);
 const saved=[...rows.values()][0];assert.deepEqual(saved.content.workout.sessions[0].exercises.map(e=>e.set_details),w.days[0].exercises.map(e=>e.set_details));assert.equal(saved.content.workout.sessions[0].exercises[0].load_each_side,true);
 w.days[0].exercises[0].set_details[0].kg=999;const retry=await send(body);assert.equal(retry.data.duplicate,true);assert.equal(counts.extract,1);assert.equal(counts.writes,1);assert.equal(saved.content.workout.sessions[0].exercises[0].set_details[0].kg,10);
}));
test('manual reviewed save works with no NVIDIA configuration and performs zero AI calls',async()=>harness({noAi:true},async({send,counts})=>{const r=await send({action:'save_reviewed',reviewedWorkout:workout(),reviewConfirmed:true});assert.equal(r.status,201);assert.equal(counts.extract,0);}));
test('missing confirmation, incomplete rows, invalid numbers and unresolved counts cannot save',async()=>{
 for(const body of [{reviewedWorkout:workout()},{reviewedWorkout:incomplete(),reviewConfirmed:true},{reviewedWorkout:{title:'empty'},reviewConfirmed:true},{reviewedWorkout:{...workout(),duration_days:'guess'},reviewConfirmed:true}])await harness({},async({send,rows,counts})=>{const result=await send({action:'save_reviewed',...body});assert.equal(result.status,422);assert.equal(rows.size,0);assert.equal(counts.extract,0);});
});
test('an unverified source requires explicit owner counts and records their provenance',async()=>harness({source:{status:'unverified',tables:[],message:'Overlapping screenshots.'}},async({send,rows})=>{
 let r=await send({action:'save_reviewed',reviewedWorkout:workout(),reviewConfirmed:true});assert.equal(r.status,422);assert.equal(r.data.code,'source_counts_required');
 r=await send({action:'save_reviewed',reviewedWorkout:workout(),reviewConfirmed:true,sourceSetCounts:[3,3]});assert.equal(r.status,201);assert.match([...rows.values()][0].content.workout.note,/Manual source counts: 3, 3/);
}));
test('missing auth and non-owner access cannot inspect, extract or save',async()=>{for(const role of ['member','trainer'])await harness({role},async({send,counts})=>{assert.equal((await send()).status,403);assert.equal(counts.inspect,0);assert.equal(counts.extract,0);});await harness({},async({send,counts})=>{assert.equal((await send({},false)).status,401);assert.equal(counts.inspect,0);});});
test('review page serves local assets, CSP and only the public sign-in key; session needs owner auth',async()=>harness({},async({base})=>{
 const r=await fetch(base+'/workout-import');assert.equal(r.status,200);assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.match(await r.text(),/Save reviewed draft/);
 for(const path of ['/import-assets/app.js','/import-assets/style.css','/import-assets/supabase.js'])assert.equal((await fetch(base+path)).status,200);
 const c=await(await fetch(base+'/import-config')).json();assert.equal(c.supabasePublishableKey,'sb_publishable_test');assert.ok(!JSON.stringify(c).includes('secret-provider-key'));assert.equal((await fetch(base+'/import-session')).status,401);
 const session=await fetch(base+'/import-session',{headers:{Authorization:'Bearer owner-jwt'}});assert.equal(session.status,200);assert.equal((await session.json()).series[0].code,'hulk_fit');
}));
test('owner page configuration never exposes a service-role or secret Supabase key',async()=>harness({},async({base,cfg})=>{
 for(const key of ['sb_secret_never_expose', 'header.'+Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')+'.signature']){
  cfg.supabaseKey=key;const r=await fetch(base+'/import-config'),text=await r.text();assert.equal(r.status,503);assert.ok(!text.includes(key));
 }
}));
test('Render and an explicitly configured custom review origin are both exact and deduplicated',()=>{
 const c=configFromEnv({RENDER_EXTERNAL_URL:'https://hulk-fitness-api.onrender.com',IMPORT_APP_ORIGIN:'https://coach.example.invalid',ALLOWED_ORIGINS:'https://hulk-fitness-api.onrender.com'});
 assert.deepEqual(c.origins,['https://hulk-fitness-api.onrender.com','https://coach.example.invalid']);
 for(const url of ['*','javascript:alert(1)','https://coach.invalid/path'])assert.throws(()=>configFromEnv({IMPORT_APP_ORIGIN:url}));
});
