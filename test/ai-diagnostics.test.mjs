import test from 'node:test';
import assert from 'node:assert/strict';
import {askNvidia,configFromEnv,createApp} from '../server.js';

const config=()=>configFromEnv({SUPABASE_URL:'https://db.invalid',SUPABASE_ANON_KEY:'public-test-key',NVIDIA_API_KEY:'provider-secret-test',NVIDIA_MODEL:'test-vision-model',ALLOWED_ORIGINS:'https://hulkfitnessarena.in'});
const owner='00000000-0000-4000-8000-000000000099';
const series={id:'669966f7-6563-4367-8fdc-1f8c034038b3',code:'hulk_fit',title:'HULK FIT',status:'draft'};
const provider=output=>new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:output}}]}));

test('invalid JSON remains rejected and diagnostics require an explicit preview flag',async()=>{
 for(const diagnostics of [undefined,false,'true',true]){
  await assert.rejects(()=>askNvidia({images:[],text:'source',config:config(),diagnostics,fetcher:async()=>provider('Here is the workout: {"kg":7.5}')}),e=>{
   assert.equal(e.code,'ai_json_invalid');
   assert.equal(Boolean(e.extra.aiDiagnostic),diagnostics===true);
   if(diagnostics===true)assert.equal(e.extra.aiDiagnostic.outputPreview,'Here is the workout: {"kg":7.5}');
   return true;
  });
 }
});

test('diagnostic output is bounded and masks configured credentials and bearer tokens',async()=>{
 const output='provider-secret-test public-test-key nvapi-secret123 sk-secret456 Bearer owner-jwt\n'+ 'x'.repeat(15000);
 await assert.rejects(()=>askNvidia({images:[],text:'source',config:config(),diagnostics:true,fetcher:async()=>provider(output)}),e=>{
  const d=e.extra.aiDiagnostic;
  assert.equal(d.outputCharacters,output.length);
  assert.equal(d.outputPreview.length,12000);
  assert.equal(d.previewTruncated,true);
  for(const secret of ['provider-secret-test','public-test-key','nvapi-secret123','sk-secret456','owner-jwt'])assert.ok(!d.outputPreview.includes(secret));
  return true;
 });
});

test('diagnostics do not change complete JSON or bypass rejection of truncated/multiple objects',async()=>{
 const out=await askNvidia({images:[],text:'source',config:config(),diagnostics:true,fetcher:async()=>provider('{"kg":7.5,"reps":10,"rest_seconds":null}')});
 assert.deepEqual(out,{kg:7.5,reps:10,rest_seconds:null});
 for(const output of ['{"kg":7.5','{"kg":7.5}{"kg":5}','[]'])await assert.rejects(()=>askNvidia({images:[],text:'source',config:config(),diagnostics:true,fetcher:async()=>provider(output)}),e=>e.code==='ai_json_invalid');
});

async function request({action='preview',role='owner',authorized=true}={}){
 const logs=[],calls=[];
 const fetcher=async(url,init={})=>{
  calls.push({url,method:init.method});
  if(url.endsWith('/auth/v1/user'))return Response.json({id:owner,is_anonymous:false});
  if(url.endsWith('/rpc/my_role'))return Response.json(role);
  if(url.includes('/training_series?'))return Response.json([series]);
  if(url.includes('/training_programs?')&&init.method==='GET')return Response.json([]);
  if(url===config().endpoint)return provider('Workout result: {"kg":7.5}');
  throw Error('Unexpected request');
 };
 const app=createApp({config:config(),fetcher,logger:{info:v=>logs.push(v),error:v=>logs.push(v)}});
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 try{
  const response=await fetch('http://127.0.0.1:'+server.address().port+'/extract-workout',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://hulkfitnessarena.in',...(authorized?{Authorization:'Bearer test-owner-jwt'}:{})},body:JSON.stringify({seriesCode:'hulk_fit',workoutText:'source',action})});
  return {status:response.status,body:await response.json(),cache:response.headers.get('cache-control'),calls,logs};
 }finally{await new Promise(r=>server.close(r));}
}

test('only an authenticated owner preview receives output; logs and database contain none',async()=>{
 const preview=await request();
 assert.equal(preview.status,502);
 assert.equal(preview.body.code,'ai_json_invalid');
 assert.equal(preview.body.aiDiagnostic.outputPreview,'Workout result: {"kg":7.5}');
 assert.equal(preview.cache,'no-store');
 assert.ok(preview.body.requestId);
 assert.ok(!preview.logs.join('\n').includes('Workout result'));
 assert.ok(!preview.calls.some(c=>c.url.includes('/training_programs?')&&c.method==='POST'));
 const importing=await request({action:'import'});
 assert.equal(importing.status,502);
 assert.equal(importing.body.aiDiagnostic,undefined);
 assert.ok(!importing.calls.some(c=>c.url.includes('/training_programs?')&&c.method==='POST'));
 for(const options of [{authorized:false},{role:'trainer'},{role:'member'}]){
  const denied=await request(options);
  assert.ok([401,403].includes(denied.status));
  assert.equal(denied.body.aiDiagnostic,undefined);
  assert.ok(!denied.calls.some(c=>c.url===config().endpoint));
 }
});
