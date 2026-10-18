import test from 'node:test';
import assert from 'node:assert/strict';
import {buildProgram} from '../workout.mjs';
const opts={series:{id:'669966f7-6563-4367-8fdc-1f8c034038b3'},userId:'00000000-0000-4000-8000-000000000099',fingerprint:'proof'};
const ai=()=>({title:'Source Routine',days:[{title:'Source day',exercises:[{name:'Manual exercise',equipment:'band',primary:[],secondary:[],sets:2,reps:12,each_side:null,rest_seconds:null}]}]});
test('incomplete source metadata can remain a draft without inventing muscle choices or rest',()=>{const p=buildProgram(ai(),opts).program,e=p.content.workout.sessions[0].exercises[0];assert.deepEqual(e.custom.muscles.primary,[]);assert.equal(e.custom.equipment,'band');assert.equal(e.sets,2);assert.equal(e.set_details[0].rest_seconds,null);});
test('extra source days/exercises and oversized names are rejected rather than dropped or shortened',()=>{let a=ai();a.days=Array(8).fill(a.days[0]);assert.throws(()=>buildProgram(a,opts),/1–7/);a=ai();a.days[0].exercises=Array(13).fill(a.days[0].exercises[0]);assert.throws(()=>buildProgram(a,opts),/1–12/);a=ai();a.days[0].exercises[0].name='x'.repeat(121);assert.throws(()=>buildProgram(a,opts),/120/);});
test('source-wide rest is not substituted for an explicitly unknown individual rest',()=>{const a=ai(),e=a.days[0].exercises[0];e.rest_seconds=60;e.set_details=[{kg:null,reps:12,rest_seconds:null},{kg:null,reps:12,rest_seconds:0}];const p=buildProgram(a,opts).program;assert.deepEqual(p.content.workout.sessions[0].exercises[0].set_details.map(s=>s.rest_seconds),[null,0]);});
