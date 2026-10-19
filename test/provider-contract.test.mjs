import test from 'node:test';
import assert from 'node:assert/strict';
import {askNvidia,configFromEnv} from '../server.js';
const config=()=>configFromEnv({SUPABASE_URL:'https://db.invalid',SUPABASE_ANON_KEY:'public-test-key',NVIDIA_API_KEY:'provider-secret-test',NVIDIA_MODEL:'meta/llama-3.2-11b-vision-instruct'});
const image={jpeg:Buffer.from('fixture JPEG bytes')};
test('vision instructions follow the image in the NVIDIA content array',async()=>{
 let body;const out=await askNvidia({images:[image],text:'source',config:config(),fetcher:async(_url,init)=>{body=JSON.parse(init.body);return Response.json({choices:[{finish_reason:'stop',message:{content:'{"title":"source"}'}}]});}});
 assert.equal(out.title,'source');const content=body.messages[0].content;assert.equal(content[0].type,'image_url');assert.equal(content[1].type,'text');assert.match(content[1].text,/Return ONLY a complete JSON object/);assert.ok(content[0].image_url.url.endsWith(image.jpeg.toString('base64')));
});
test('Llama multi-image extraction is blocked without dropping images or calling the provider',async()=>{
 let calls=0;await assert.rejects(()=>askNvidia({images:[image,image],text:'source',config:config(),fetcher:async()=>{calls++;throw Error();}}),e=>e.code==='model_image_count'&&e.status===422);assert.equal(calls,0);
});
test('provider rejection details are only shown for explicit owner preview diagnostics and mask credentials/data',async()=>{
 for(const diagnostics of [false,'true',true]){
  const message='Only one image supported; provider-secret-test public-test-key nvapi-sensitive sk-sensitive sb_secret_sensitive Bearer owner-token data:image/jpeg;base64,'+'A'.repeat(400);
  await assert.rejects(()=>askNvidia({images:[image],text:'source',config:config(),diagnostics,fetcher:async()=>Response.json({error:{message}},{status:400})}),e=>{
   assert.equal(e.code,'ai_provider_error');assert.equal(Boolean(e.extra.providerDiagnostic),diagnostics===true);
   if(diagnostics===true){assert.match(e.message,/Only one image supported/);assert.equal(e.extra.providerDiagnostic.imageCount,1);for(const secret of ['provider-secret-test','public-test-key','nvapi-sensitive','sk-sensitive','sb_secret_sensitive','owner-token','AAAAA'])assert.ok(!JSON.stringify(e.extra).includes(secret));}
   else assert.ok(!e.message.includes('Only one image supported'));
   return true;
  });
 }
});
test('empty, non-JSON and oversized error bodies remain bounded and never become a successful response',async()=>{
 for(const body of ['','not JSON',JSON.stringify({detail:'x'.repeat(25000)}),JSON.stringify({detail:'validation problem'})])await assert.rejects(()=>askNvidia({images:[image],text:'source',config:config(),diagnostics:true,fetcher:async()=>new Response(body,{status:400})}),e=>e.code==='ai_provider_error'&&e.message.length<1300);
});
