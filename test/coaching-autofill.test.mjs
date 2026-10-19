import test from 'node:test';
import assert from 'node:assert/strict';
import {COACHING_PROFILES,lookupCoaching,autofillCoaching,fillWorkoutCoaching,coachingMatchesCurrent,clearCoachingAutofill} from '../import-ui/coaching-autofill.mjs';
import {MUSCLE_IDS,buildProgram} from '../workout.mjs';
const fresh=name=>({name,name_kn:'',equipment:'gym',primary:[],secondary:[],stabilisers:[],cues:[],tempo:null,reps_in_reserve:null,each_side:null,set_details:[{kg:7.5,reps:12,rest_seconds:60}]});
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
