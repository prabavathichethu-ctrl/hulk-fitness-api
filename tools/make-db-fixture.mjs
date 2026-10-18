import fs from 'node:fs';
import {buildProgram} from '../workout.mjs';
const ai={title:'Synthetic Render import',days:[{title:'Synthetic session',exercises:[{name:'Synthetic press',equipment:'dumbbell',primary:['chest'],secondary:['front_delts','triceps'],sets:3,each_side:true,set_details:[{kg:5,reps:16,rest_seconds:null},{kg:5,reps:14,rest_seconds:0},{kg:7.5,reps:12,rest_seconds:null}]}]}]};
const {program}=buildProgram(ai,{series:{id:'669966f7-6563-4367-8fdc-1f8c034038b3'},userId:'00000000-0000-4000-8000-000000000099',fingerprint:'synthetic'});
fs.writeFileSync('test/canonical-fixture.json',JSON.stringify(program,null,2)+'\n');
