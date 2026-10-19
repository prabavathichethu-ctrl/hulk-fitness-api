import test from 'node:test';
import assert from 'node:assert/strict';
import {countSourceTables,tablePreview,compareCoverage,requireReviewedCoverage} from '../source-coverage.mjs';
import {mergeBulkWorkouts} from '../bulk-workout.mjs';
import {createApp,configFromEnv} from '../server.js';

// OCR strings observed on the supplied originals. No model-authored fixture rows.
const first='x BACK WORKOUT (Hats) | a\n(>| Lat Pulldown ds\nSET KG REPS REST\n1 10 14 01:00\n2 15 12 01:00\n3 15 10 01:00\nEach Side Tempo + Add Set\nAdd note..\na T Bar Chest Supported Row oer\nSET KG REPS REST\n1 5 14 01:00\n2 7.5 12 01:00\n3 7.5 10 01:00';
const third='x er Ge\n1 10 14 01:00\n2 15 12 01:00\n3 15 10 01:00\nEach Side Tempo + Add Set\nAdd note..\n(CD)\n5 Dumbbell Single Arm Row asi\nSET KG REPS REST\n1 5 14 01:00\n2 5 12 01:00\n3 7.5 10 01:00\nEach Side Tempo + Add Set';
const fourth='x ener Go\n1 5 14 01:00\n2 7.5 12 01:00\n3 7.5 10 01:00\nEach Side Tempo + Add Set\nAdd note..\ncD\nEr Cable V Bar Seated Row sos\nSET KG REPS REST\n1 10 14 01:00\n2 15 12 01:00\n3 15 10 01:00\nEach Side Tempo + Add Set';
const texts=[first,first,third,fourth];
const rows=w=>w.days[0].exercises.map(e=>e.set_details);
const expected=[[[10,14,60],[15,12,60],[15,10,60]],[[5,14,60],[7.5,12,60],[7.5,10,60]],[[5,14,60],[5,12,60],[7.5,10,60]],[[10,14,60],[15,12,60],[15,10,60]]].map(ex=>ex.map(([kg,reps,rest_seconds])=>({kg,reps,rest_seconds})));
const pages=()=>texts.map(text=>({status:'ready',review:tablePreview(countSourceTables(text))}));

test('observed cropped sources retain headerless rows, with no invented exercise name',()=>{
 const source=countSourceTables(third);assert.equal(source.status,'unverified');assert.deepEqual(source.tables.map(t=>t.sets),[3,3]);assert.equal(source.tables[0].header,false);
 const w=tablePreview(source);assert.equal(w.days[0].exercises[0].name,'');assert.equal(w.days[0].exercises[0].ocr_unlabelled,true);assert.deepEqual(rows(w),[expected[0],expected[2]]);assert.ok(w.days[0].exercises.every(e=>e.each_side===null));
});
test('four supplied page readings produce four unique tables and twelve unchanged rows',()=>{
 const r=mergeBulkWorkouts(pages(),{pageCount:4,duplicatePages:{2:1},resolveTableOverlaps:true});
 assert.deepEqual(rows(r.review),expected);assert.equal(r.review.title,'');assert.equal(r.batchReview.pages[1].status,'duplicate');assert.equal(r.batchReview.resolvedOverlaps.length,2);
 assert.deepEqual(r.review.days[0].exercises.map(e=>e.source_images),[[1,2,3],[1,2,4],[3],[4]]);assert.equal(r.batchReview.failedPages.length,0);
});
test('matching numbers alone never collapse named exercises or ambiguous unnamed crops',()=>{
 const p=pages();p[0].review.days[0].exercises[1].set_details=structuredClone(expected[0]);
 let r=mergeBulkWorkouts([p[0],p[2]],{pageCount:2,resolveTableOverlaps:true});assert.equal(r.review.days[0].exercises.length,4);assert.equal(r.batchReview.resolvedOverlaps.length,0);assert.equal(r.review.days[0].exercises[2].name,'');
 r=mergeBulkWorkouts([p[0],p[0]],{pageCount:2,resolveTableOverlaps:true});assert.equal(r.review.days[0].exercises.length,4);
 r=mergeBulkWorkouts(pages(),{pageCount:4,mode:'preserve_sessions',duplicatePages:{2:1},resolveTableOverlaps:true});assert.equal(r.review.days.length,4);assert.equal(r.batchReview.resolvedOverlaps.length,0);
});
test('wrong rest or KG is a mismatch even when exercise and set counts match',()=>{
 const s=countSourceTables(first),w=tablePreview(s);w.days[0].exercises[0].set_details[0].rest_seconds=1;
 assert.equal(compareCoverage(s,w).status,'mismatch');assert.throws(()=>requireReviewedCoverage(s,w,{reviewConfirmed:true}),e=>e.code==='source_mismatch');
 w.days[0].exercises[0].set_details[0].rest_seconds=60;w.days[0].exercises[1].set_details[1].kg=75;assert.equal(compareCoverage(s,w).status,'mismatch');
});
test('damaged weight and unsupported table formats are never repaired into guessed numbers',()=>{
 const s=countSourceTables(first.replace('2 7.5 12','2 Wie) 12'));const w=tablePreview(s);assert.equal(w.days[0].exercises[1].set_details[1].kg,null);assert.equal(w.days[0].exercises[1].ocr_rows_complete,false);
 assert.throws(()=>tablePreview(countSourceTables('Workout: three sets of 8–12 reps')),e=>e.code==='table_layout_unknown');
});
test('owner table preview works without provider configuration, with no AI calls or database writes',async()=>{
 const owner='00000000-0000-4000-8000-000000000099',series={id:'669966f7-6563-4367-8fdc-1f8c034038b3',code:'hulk_fit',title:'HULK FIT',status:'draft'};let inspect=0;
 const app=createApp({config:configFromEnv({SUPABASE_URL:'https://db.invalid',SUPABASE_ANON_KEY:'sb_publishable_test'}),logger:{info(){},error(){}},inspect:async()=>{inspect++;return countSourceTables(first);},extract:async()=>{throw Error('AI must not be called');},fetcher:async url=>{
  if(url.endsWith('/auth/v1/user'))return Response.json({id:owner,is_anonymous:false});if(url.endsWith('/rpc/my_role'))return Response.json('owner');if(url.includes('/training_series?'))return Response.json([series]);throw Error('No provider or DB writes expected');
 }});const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 try{const url='http://127.0.0.1:'+server.address().port+'/extract-workout';
  const send=async auth=>{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer owner-jwt'}:{})},body:JSON.stringify({seriesCode:'hulk_fit',action:'preview_tables',workoutText:first})});return {status:r.status,data:await r.json()};};
  assert.equal((await send(false)).status,401);assert.equal(inspect,0);const r=await send(true);assert.equal(r.status,422);assert.equal(r.data.code,'needs_review');assert.deepEqual(rows(r.data.review),expected.slice(0,2));assert.equal(r.data.sourceCheck.status,'counts_match');assert.equal(inspect,1);
 }finally{await new Promise(r=>server.close(r));}
});
