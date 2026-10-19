import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAiJson,buildProgram,buildPrompt} from '../workout.mjs';

const opts={series:{id:'669966f7-6563-4367-8fdc-1f8c034038b3'},userId:'00000000-0000-4000-8000-000000000099',fingerprint:'observed-back-workout'};
const observed={title:'BACK WORKOUT ( lats ) | BEGINNER 1',duration_days:null,days:[
 {day:null,title:'Lat Pulldown',exercises:[{name:'Lat Pulldown',name_kn:'',equipment:'gym',primary:['chest'],secondary:[],stabilisers:[],cues:[],tempo:null,sets:null,reps:null,rest_seconds:null,each_side:null,reps_in_reserve:null,set_details:[{kg:10,reps:14,rest_seconds:60},{kg:15,reps:12,rest_seconds:60},{kg:15,reps:10,rest_seconds:60}]}]},
 {day:null,title:'T Bar Chest Supported Row',exercises:[{name:'T Bar Chest Supported Row',name_kn:'',equipment:'gym',primary:['chest'],secondary:[],stabilisers:[],cues:[],tempo:null,sets:null,reps:null,rest_seconds:null,each_side:null,reps_in_reserve:null,set_details:[{kg:5,reps:14,rest_seconds:60},{kg:7.5,reps:12,rest_seconds:60},{kg:7.5,reps:10,rest_seconds:60}]}]}
]};
const preamble='The image shows a screenshot of a workout plan on a mobile device, with the title "BACK WORKOUT ( lats ) | BEGINNER 1" at the top. The plan is divided into two sections: "Lat Pulldown" and "T Bar Chest Supported Row".\n\n**Lat Pulldown**\n\n*   **SET**: 1, 2, 3\n*   **KG**: 10, 15, 15\n*   **REPS**: 14, 12, 10\n*   **REST**: 01:00, 01:00, 01:00\n\n**T Bar Chest Supported Row**\n\n*   **SET**: 1, 2, 3\n*   **KG**: 5, 7.5, 7.5\n*   **REPS**: 14, 12, 10\n*   **REST**: 01:00, 01:00, 01:00\n\nThe workout plan includes three sets for each exercise, with varying weights, reps, and rest times. The plan is designed for a beginner and focuses on lat pulldowns and T bar chest supported rows.\n\n';

test('the exact observed 1578-character NVIDIA answer parses without changing any source field',()=>{
 const raw=preamble+'**Answer**: '+JSON.stringify(observed);
 assert.equal(raw.length,1578);
 assert.deepEqual(parseAiJson(raw),observed);
 assert.equal(parseAiJson(raw).days[1].exercises[0].set_details[1].kg,7.5);
});

test('explicit answer wrappers support nested objects and quoted braces while staying strict',()=>{
 const object={title:'Quoted {braces} and \\"escape',days:[{x:{n:0,missing:null,each_side:false}}]};
 for(const label of ['**Answer**','Answer'])assert.deepEqual(parseAiJson('Description.\n\n'+label+': '+JSON.stringify(object)),object);
 assert.deepEqual(parseAiJson('Answer: {"x":0}'),{x:0});
 assert.deepEqual(parseAiJson('```json\n{"x":0}\n```'),{x:0});
});

test('ambiguous prefixes, multiple answers, trailing objects, arrays and incomplete JSON stay rejected',()=>{
 for(const raw of [
  'prefix {"x":1}',
  '{"earlier":1}\n**Answer**: {"x":2}',
  '**Answer**: {"x":1}{"x":2}',
  '**Answer**: {"x":1}\nAnswer: {"x":2}',
  'Description.\n**Answer**: {"kg":7.5',
  '**Answer**: []',
  '**Answer**: {"kg":7.5,}',
  '**Answer**: {"kg":7.5}\nExplanation follows.',
  '<think>text</think>{"kg":7.5}'
 ])assert.throws(()=>parseAiJson(raw),e=>e.code==='ai_json_invalid',raw);
});

test('the observed two exercise cards cannot silently become two workout days',()=>{
 const before=structuredClone(observed);
 assert.throws(()=>buildProgram(observed,opts),e=>e.code==='needs_review'&&e.message.includes('Exercise cards'));
 assert.deepEqual(observed,before);
});

test('one correctly grouped source workout retains both exercises and all six numeric rows',()=>{
 const ai=structuredClone(observed),exercises=ai.days.flatMap(d=>d.exercises);
 for(const e of exercises)e.primary=[];
 ai.days=[{day:null,source_day_label:null,title:ai.title,exercises}];
 const r=buildProgram(ai,opts),sessions=r.program.content.workout.sessions.filter(s=>s.kind==='strength');
 assert.equal(sessions.length,1);
 assert.equal(r.exerciseCount,2);
 assert.equal(r.program.duration_days,1);
 assert.deepEqual(sessions[0].exercises.map(e=>e.set_details),exercises.map(e=>e.set_details));
 assert.ok(sessions[0].exercises.every(e=>e.custom.muscles.primary.length===0));
 assert.equal(sessions[0].exercises[1].set_details[2].kg,7.5);
});

test('explicit source day labels and weekdays retain multiple sessions without merging',()=>{
 for(const mode of ['labels','weekdays']){
  const ai=structuredClone(observed);
  ai.days.forEach((d,i)=>{if(mode==='labels')d.source_day_label='Day '+(i+1);else d.day=i*2;});
  const p=buildProgram(ai,opts).program;
  assert.equal(p.content.workout.sessions.filter(s=>s.kind==='strength').length,2);
  assert.equal(p.duration_days,7);
 }
});

test('prompt no longer seeds chest tags and explicitly distinguishes exercise cards from sessions',()=>{
 const p=buildPrompt();
 assert.ok(!p.includes('"primary":["chest"]'));
 assert.ok(p.includes('"primary":[]'));
 assert.ok(p.includes('ONE days entry containing ALL exercises'));
 assert.ok(p.includes('source_day_label'));
 assert.ok(p.includes('only when the source explicitly identifies it'));
});
