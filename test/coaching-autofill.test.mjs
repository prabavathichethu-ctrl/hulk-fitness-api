import test from 'node:test';
import assert from 'node:assert/strict';
import {COACHING_PROFILES,lookupCoaching,autofillCoaching,fillWorkoutCoaching,coachingMatchesCurrent,clearCoachingAutofill,applyCoachDefaults} from '../import-ui/coaching-autofill.mjs';
import {MUSCLE_IDS,buildProgram} from '../workout.mjs';
const fresh=name=>({name,name_kn:'',equipment:'gym',primary:[],secondary:[],stabilisers:[],cues:[],tempo:null,reps_in_reserve:null,each_side:null,set_details:[{kg:7.5,reps:12,rest_seconds:60}]});
const workout=exercises=>({title:'Back and biceps',duration_days:null,days:[{day:null,title:'Back and biceps',exercises}]});
const build=w=>buildProgram(w,{series:{id:'669966f7-6563-4367-8fdc-1f8c034038b3'},userId:'00000000-0000-4000-8000-000000000099',fingerprint:'coach-defaults-test'}).program.content.workout.sessions[0].exercises;
test('all six names from the supplied workout match without substituting the deadlift variation',()=>{
 const names=['Lat Pulldown','Cable V Bar Seated Row','Cable Face Pull','Dumbbell Deadlift','Barbell Bicep Curl','Dumbbell Hammer Curl'];
 const w=workout(names.map(fresh)),before=w.days[0].exercises.map(e=>structuredClone(e.set_details));
 assert.equal(fillWorkoutCoaching(w),6);
 assert.ok(w.days[0].exercises.every(e=>e.name_kn&&e.cues.length===2));
 assert.deepEqual(w.days[0].exercises.map(e=>e.set_details),before);
 assert.deepEqual(w.days[0].exercises[3].primary,[]);
 assert.notEqual(lookupCoaching('Dumbbell Deadlift').profile.id,lookupCoaching('Dumbbell Romanian deadlift').profile.id);
 assert.equal(lookupCoaching('Incline Dumbbell Hammer Curl',{ocr:true}),null);
});
test('coach defaults fill only missing fields and preserve weights, reps, rest and side flags',()=>{
 const a=fresh('Lat Pulldown'),b={...fresh('Cable Face Pull'),tempo:'4-0-1-0',reps_in_reserve:3,each_side:false},w=workout([a,b]);
 const before=structuredClone(w.days[0].exercises.map(e=>({sets:e.set_details,each_side:e.each_side})));
 assert.deepEqual(applyCoachDefaults(w,{tempo:'3-1-1-0',reps_in_reserve:2}),{exercisesUpdated:1,tempoFilled:1,rirFilled:1,skipped:0});
 assert.equal(a.tempo,'3-1-1-0');assert.equal(a.reps_in_reserve,2);assert.equal(b.tempo,'4-0-1-0');assert.equal(b.reps_in_reserve,3);
 assert.deepEqual(w.days[0].exercises.map(e=>({sets:e.set_details,each_side:e.each_side})),before);
 assert.deepEqual(applyCoachDefaults(w,{tempo:'3-1-1-0',reps_in_reserve:2}),{exercisesUpdated:0,tempoFilled:0,rirFilled:0,skipped:0});
});
test('invalid coach defaults are rejected before any exercise is changed',()=>{
 for(const options of [{},{reps_in_reserve:0},{reps_in_reserve:5},{reps_in_reserve:2.5},{reps_in_reserve:'bad'},{tempo:'x'.repeat(61)}]){
  const w=workout([fresh('Lat Pulldown')]),before=structuredClone(w);assert.throws(()=>applyCoachDefaults(w,options),RangeError);assert.deepEqual(w,before);
 }
});
test('default provenance survives draft building without calling coach-selected values source transcription',()=>{
 const w=workout([fresh('Lat Pulldown')]);fillWorkoutCoaching(w);applyCoachDefaults(w,{tempo:'3-1-1-0',reps_in_reserve:2});
 const [e]=build(w);assert.equal(e.reps_in_reserve,2);assert.ok(e.custom.cues.en.includes('Coach default tempo: 3-1-1-0'));assert.ok(e.custom.cues.en.includes('Coach default RIR: 2'));assert.ok(!e.custom.cues.en.some(x=>x.startsWith('Source tempo:')));
 w.days[0].exercises[0].tempo='2-0-1-0';w.days[0].exercises[0].reps_in_reserve=3;
 const [changed]=build(w);assert.ok(changed.custom.cues.en.includes('Tempo: 2-0-1-0'));assert.ok(!changed.custom.cues.en.some(x=>x.startsWith('Coach default RIR:')));
});
test('defaults respect the Studio note limit and allow a coach to apply tempo or RIR separately',()=>{
 const a={...fresh('Lat Pulldown'),cues:Array.from({length:6},(_,i)=>'Source note '+i)},b=fresh('Cable Face Pull');const w=workout([a,b]);
 assert.equal(applyCoachDefaults(w,{tempo:'3-1-1-0',reps_in_reserve:2}).skipped,1);assert.equal(a.tempo,null);assert.equal(a.reps_in_reserve,null);
 const onlyTempo=workout([fresh('Lat Pulldown')]);applyCoachDefaults(onlyTempo,{tempo:'2-0-1-0'});assert.equal(onlyTempo.days[0].exercises[0].reps_in_reserve,null);
 const onlyRir=workout([fresh('Lat Pulldown')]);applyCoachDefaults(onlyRir,{reps_in_reserve:'2'});assert.equal(onlyRir.days[0].exercises[0].tempo,null);
});
test('four supplied row exercise names match explicit profiles including bounded OCR decoration',()=>{
 const names=['(>| Lat Pulldown ds','a T Bar Chest Supported Row oer','5 Dumbbell Single Arm Row asi','Er Cable V Bar Seated Row sos'];
 for(const name of names){const e={...fresh(name),ocr_rows_complete:true},before=structuredClone(e),r=autofillCoaching(e);assert.equal(r.matched,true);assert.ok(e.name_kn.length>1);assert.ok(e.primary.length);assert.equal(e.cues.length,2);assert.deepEqual(e.set_details,before.set_details);assert.equal(e.tempo,null);assert.equal(e.reps_in_reserve,null);assert.equal(e.each_side,null);assert.equal(e.name,name);assert.equal(e.equipment,'gym');assert.ok(coachingMatchesCurrent(e));}
 assert.equal(lookupCoaching('Dumbbell Single Arm Row').profile.equipment,'dumbbell');
});
test('unsupported variations and ambiguous words never inherit a generic profile',()=>{
 for(const name of ['Wide Grip Lat Pulldown','Reverse Lat Pulldown','not Lat Pulldown','low Lat Pulldown','Lat Pulldown behind neck','single Dumbbell row','unknown row','T Bar Row','Lat Pulldown or Dumbbell row']){assert.equal(lookupCoaching(name,{ocr:true}),null);const e=fresh(name);assert.deepEqual(autofillCoaching(e),{matched:false,filled:[]});assert.deepEqual(e,fresh(name));}
 assert.equal(lookupCoaching('a T Bar Chest Supported Row oer'),null);
});
test('manual and source values survive autofill and repeat calls do not duplicate notes',()=>{
 const e=fresh('Lat pulldown');Object.assign(e,{name_kn:'ಕೋಚ್ ಹೆಸರು',equipment:'band',primary:['chest'],secondary:[],stabilisers:[],cues:['Source note.'],tempo:'3-1-1',reps_in_reserve:2,each_side:false});
 const before=structuredClone(e);autofillCoaching(e);for(const key of Object.keys(before))assert.deepEqual(e[key],before[key]);
 const b=fresh('Lat pulldown');autofillCoaching(b);const once=structuredClone(b);autofillCoaching(b);assert.deepEqual(b,once);
});
test('a name change marks old suggestions stale; clearing preserves owner edits',()=>{
 const e=fresh('Lat pulldown');autofillCoaching(e);e.name='Dumbbell Single Arm Row';e.name_kn='ಕೋಚ್ ಬದಲಾವಣೆ';assert.equal(coachingMatchesCurrent(e),false);clearCoachingAutofill(e);assert.equal(e.name_kn,'ಕೋಚ್ ಬದಲಾವಣೆ');assert.deepEqual(e.primary,[]);assert.deepEqual(e.cues,[]);assert.equal(e.coaching_autofill,undefined);autofillCoaching(e);assert.equal(coachingMatchesCurrent(e),true);assert.deepEqual(e.primary,['lats','upper_back']);assert.equal(e.name_kn,'ಕೋಚ್ ಬದಲಾವಣೆ');
});
test('all library muscle groups are valid and disjoint; autofilled metadata survives canonical draft building',()=>{
 for(const p of COACHING_PROFILES){const all=[...p.primary,...p.secondary,...p.stabilisers];assert.equal(all.length,new Set(all).size);assert.ok(all.every(m=>MUSCLE_IDS.includes(m)));assert.ok(p.cues.every(s=>s.length<=300));}
 const w={title:'Back workout',duration_days:null,days:[{day:null,title:'',exercises:['Lat pulldown','T Bar Chest Supported Row','Dumbbell Single Arm Row','Cable V Bar Seated Row'].map(fresh)}]};assert.equal(fillWorkoutCoaching(w),4);
 const result=buildProgram(w,{series:{id:'669966f7-6563-4367-8fdc-1f8c034038b3'},userId:'00000000-0000-4000-8000-000000000099',fingerprint:'coaching-test'});const xs=result.program.content.workout.sessions[0].exercises;
 assert.ok(xs.every(e=>e.custom.kn&&e.custom.muscles.primary.length&&e.custom.cues.en.length===2));assert.ok(xs.every(e=>e.reps_in_reserve===null&&e.set_details[0].kg===7.5));
});

