import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {mergeBulkWorkouts} from '../bulk-workout.mjs';
import {createApp,configFromEnv} from '../server.js';
const owner='00000000-0000-4000-8000-000000000099',series={id:'669966f7-6563-4367-8fdc-1f8c034038b3',code:'hulk_fit',title:'HULK FIT',status:'draft'};
const page=(i=0,name)=>({status:'ready',review:{title:'CHEST | BEGINNER 1',duration_days:null,days:[{day:null,title:'CHEST | BEGINNER 1',exercises:[{name:name||['Flat dumbbell chest press','Pec Deck','Incline chest press','Decline dumbbell press'][i],equipment:'gym',each_side:null,set_details:[{kg:5+i,reps:14,rest_seconds:60},{kg:7.5+i,reps:12,rest_seconds:60},{kg:7.5+i,reps:10,rest_seconds:60}]}]}]}});
test('four single-image results retain all four exercises and twelve exact rows in source order',()=>{
 const pages=[0,1,2,3].map(i=>page(i)),before=structuredClone(pages),r=mergeBulkWorkouts(pages,{pageCount:4});
 assert.equal(r.review.days.length,1);const es=r.review.days[0].exercises;assert.equal(es.length,4);assert.deepEqual(es.map(e=>e.set_details),before.map(p=>p.review.days[0].exercises[0].set_details));assert.deepEqual(es.map(e=>e.source_images),[[1],[2],[3],[4]]);assert.deepEqual(pages,before);
});
test('overlapping exercises are flagged and retained without guessing set concatenation or dropping rows',()=>{
 const pages=[page(0,'Lat Pulldown'),page(1,'Lat pull-down')];pages[1].review.days[0].exercises[0].set_details[1].kg=99;
 const r=mergeBulkWorkouts(pages,{pageCount:2});assert.equal(r.batchReview.repeatedExercises.length,1);assert.equal(r.review.days[0].exercises.length,2);assert.equal(r.review.days[0].exercises[1].set_details[1].kg,99);
});
test('failed or malformed pages create visible empty placeholders rather than a partial-success import',()=>{
 for(const failed of [{status:'failed',error:'NVIDIA HTTP 400'},{status:'ready',review:{days:[]}}]){const r=mergeBulkWorkouts([page(0),failed,page(2),page(3)],{pageCount:4});assert.deepEqual(r.batchReview.failedPages,[2]);assert.equal(r.review.days[0].exercises.length,4);assert.equal(r.review.days[0].exercises[1].set_details.length,0);assert.deepEqual(r.review.days[0].exercises[1].source_images,[2]);}
});
test('separate-session mode and conflicting explicit day labels never silently merge days',()=>{
 const pages=[page(0),page(1)];assert.equal(mergeBulkWorkouts(pages,{pageCount:2,mode:'preserve_sessions'}).review.days.length,2);
 pages.forEach((p,i)=>p.review.days[0].source_day_label='Day '+(i+1));const r=mergeBulkWorkouts(pages,{pageCount:2});assert.equal(r.review.days.length,2);assert.ok(r.batchReview.warnings.some(s=>s.includes('Different source day labels')));
});
test('a result is required for every source; invalid mode/count is rejected',()=>{
 for(const opts of [{pageCount:4},{pageCount:1},{pageCount:2,mode:'guess'}])assert.throws(()=>mergeBulkWorkouts([page(0),page(1)],opts),e=>e.code==='batch_invalid');
});
test('consistent explicit source duration is preserved; conflicts retain both values for review',()=>{
 const pages=[page(0),page(1)];pages[0].review.duration_days=84;assert.equal(mergeBulkWorkouts(pages,{pageCount:2}).review.duration_days,84);
 pages[1].review.duration_days=7;const r=mergeBulkWorkouts(pages,{pageCount:2});assert.equal(r.review.duration_days,null);assert.deepEqual(r.batchReview.sourceDurations,[{page:1,value:84},{page:2,value:7}]);assert.ok(r.batchReview.warnings.some(w=>w.includes('durations conflict')));
});
test('different source headings are retained and flagged when same-workout grouping was chosen',()=>{
 const pages=[page(0),page(1)];pages[1].review.title='BACK BEGINNER 1';const r=mergeBulkWorkouts(pages,{pageCount:2});assert.equal(r.batchReview.sourceTitles.length,2);assert.ok(r.batchReview.warnings.some(w=>w.includes('Source titles differ')));
});

async function serve(options,fn){
 const rows=new Map(),counts={ai:0},cfg=configFromEnv({SUPABASE_URL:'https://db.invalid',SUPABASE_ANON_KEY:'sb_publishable_test',NVIDIA_API_KEY:options.noAi?'':'test-secret',NVIDIA_MODEL:'meta/llama-3.2-11b-vision-instruct'});
 const fetcher=async(url,init={})=>{
  if(url.endsWith('/auth/v1/user'))return Response.json({id:owner,is_anonymous:false});if(url.endsWith('/rpc/my_role'))return Response.json(options.role||'owner');if(url.includes('/training_series?'))return Response.json([series]);
  if(url.includes('/training_programs?')){if(init.method==='POST'){const p=JSON.parse(init.body);rows.set(p.id,p);return Response.json([p],{status:201});}const id=url.split('id=eq.')[1];return Response.json(rows.has(id)?[rows.get(id)]:[]);}throw Error('Unexpected URL');
 };
 const app=createApp({config:cfg,fetcher,logger:{info(){},error(){}},inspect:async({images})=>images.length===1?{status:'counted',tables:[{sets:3,restRows:3}],message:'counts'}:{status:'unverified',tables:[],pageCounts:images.map(()=>[3]),message:'Check overlaps and combined counts.'},extract:async({images})=>{assert.equal(images.length,1);const p=page(counts.ai++%4);return p.review;}});
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
 const images=[];for(let i=0;i<4;i++)images.push((await sharp({create:{width:20+i,height:30,channels:3,background:'#fff'}}).png().toBuffer()).toString('base64'));
 const send=async(body,authorized=true)=>{const r=await fetch(base+'/extract-workout',{method:'POST',headers:{'Content-Type':'application/json',...(authorized?{Authorization:'Bearer owner-jwt'}:{})},body:JSON.stringify({seriesCode:'hulk_fit',...body})});return {status:r.status,data:await r.json()};};
 try{await fn({send,images,rows,counts});}finally{await new Promise(r=>server.close(r));}
}
test('four page previews plus merged preview save nothing; reviewed save uses no additional AI call',async()=>serve({},async({send,images,rows,counts})=>{
 const results=[];for(const image of images){const r=await send({action:'preview',images:[image]});assert.equal(r.status,200);results.push({status:'ready',review:r.data.review});}
 assert.equal(counts.ai,4);assert.equal(rows.size,0);
 const merged=await send({action:'preview_bulk',images,pageResults:results,batchMode:'same_workout'});assert.equal(merged.status,200);assert.equal(merged.data.exerciseCount,4);assert.equal(merged.data.sourceCheck.status,'unverified');assert.equal(rows.size,0);assert.equal(counts.ai,4);
 const body={action:'save_reviewed',images,reviewedWorkout:merged.data.review,reviewConfirmed:true,sourceSetCounts:[3,3,3,3]};
 assert.equal((await send(body)).data.code,'batch_review_required');assert.equal(rows.size,0);
 const saved=await send({...body,batchReviewConfirmed:true});assert.equal(saved.status,201);assert.equal(rows.size,1);assert.equal(counts.ai,4);assert.equal([...rows.values()][0].content.workout.sessions[0].exercises.reduce((n,e)=>n+e.set_details.length,0),12);
}));
test('failed-page merged review remains editable and unsavable until its rows are completed',async()=>serve({},async({send,images,rows,counts})=>{
 const results=[page(0),{status:'failed',error:'Source 2 timed out'},page(2),page(3)];const r=await send({action:'preview_bulk',images,pageResults:results});assert.equal(r.status,422);assert.equal(r.data.code,'needs_review');assert.deepEqual(r.data.batchReview.failedPages,[2]);assert.equal(r.data.review.days[0].exercises[1].set_details.length,0);assert.equal(rows.size,0);assert.equal(counts.ai,0);
 const save=await send({action:'save_reviewed',images,reviewedWorkout:r.data.review,reviewConfirmed:true,batchReviewConfirmed:true,sourceSetCounts:[3,3,3,3]});assert.equal(save.status,422);assert.equal(rows.size,0);
}));
test('merging a batch requires owner access but no AI configuration or extra provider credits',async()=>{
 await serve({noAi:true},async({send,images,counts})=>{assert.equal((await send({action:'preview_bulk',images,pageResults:[0,1,2,3].map(i=>page(i))})).status,200);assert.equal(counts.ai,0);});
 await serve({role:'member'},async({send,images,counts})=>{assert.equal((await send({action:'preview_bulk',images,pageResults:[0,1,2,3].map(i=>page(i))})).status,403);assert.equal(counts.ai,0);});
});
