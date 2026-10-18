import {EXERCISES} from './exercise-catalog.mjs';

export const CUSTOM_EXERCISE_VERSION='hulk-coach-exercise-1.0.0';
export const CUSTOM_ID=/^custom_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const MUSCLE_IDS=Object.freeze(['chest','front_delts','side_delts','rear_delts','lats','upper_back','lower_back','biceps','triceps','forearms','rotator_cuff','core','obliques','serratus','quads','hamstrings','glutes','adductors','calves','hip_flexors']);
export const EQUIPMENT=Object.freeze(['gym','dumbbell','band','bodyweight']);
const roles=['primary','secondary','stabilisers'];
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const text=(v,min,max)=>typeof v==='string'&&v.trim().length>=min&&v.length<=max;
function fail(){const e=new Error('custom_exercise_fields');e.code=e.message;throw e;}
export function newCustomDefinition(){return {version:CUSTOM_EXERCISE_VERSION,en:'',kn:'',equipment:'',cues:{en:[],kn:[]},muscles:{primary:[],secondary:[],stabilisers:[]}};}
export function validateExerciseDefinition(entry,strict=true){
 if(!object(entry))fail();
 if(Object.hasOwn(EXERCISES,entry.id)){if(entry.custom!==undefined)fail();return EXERCISES[entry.id];}
 if(!CUSTOM_ID.test(entry.id||'')||!object(entry.custom))fail();
 const c=entry.custom;
 if(c.version!==CUSTOM_EXERCISE_VERSION||!text(c.en,strict?2:0,120)||!text(c.kn,0,120)||(!EQUIPMENT.includes(c.equipment)&&(strict||c.equipment!=='')))fail();
 if(Object.keys(c).some(k=>!['version','en','kn','equipment','cues','muscles'].includes(k))||!object(c.cues)||!object(c.muscles))fail();
 for(const lang of ['en','kn'])if(!Array.isArray(c.cues[lang])||c.cues[lang].length>6||c.cues[lang].some(s=>!text(s,1,300)))fail();
 for(const role of roles){const group=c.muscles[role];if(!Array.isArray(group)||group.length>6||(strict&&role==='primary'&&!group.length)||group.some(k=>!MUSCLE_IDS.includes(k)))fail();}
 const all=roles.flatMap(role=>c.muscles[role]);if(new Set(all).size!==all.length)fail();
 if(JSON.stringify(c).length>8000)fail();
 return c;
}
export function copyCustomDefinition(c){return {version:CUSTOM_EXERCISE_VERSION,en:c.en.trim(),kn:c.kn.trim(),equipment:c.equipment,cues:{en:[...c.cues.en],kn:[...c.cues.kn]},muscles:Object.fromEntries(roles.map(role=>[role,[...c.muscles[role]]]))};}
export function definitionForView(entry){
 if(Object.hasOwn(EXERCISES,entry?.id))return EXERCISES[entry.id];
 try{return validateExerciseDefinition(entry,true);}catch{return {en:'Exercise · coach review needed',kn:'ವ್ಯಾಯಾಮ · ಕೋಚ್ ಪರಿಶೀಲನೆ ಬೇಕು',equipment:'',cues:{en:[],kn:[]}};}
}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function muscleLabel(id,lang){const labels=globalThis.HULK_MUSCLES?.labels?.[id];return labels?labels[lang==='kn'?1:0]:id.replaceAll('_',' ');}
export function exerciseMuscleCards(entry,lang){
 const api=globalThis.HULK_MUSCLES;
 if(Object.hasOwn(EXERCISES,entry?.id))return api?.cards(entry.id,lang)||'';
 const groups=entry?.custom?.muscles;
 const safe=role=>Array.isArray(groups?.[role])?[...new Set(groups[role].filter(k=>MUSCLE_IDS.includes(k)))].slice(0,6):[];
 const primary=safe('primary'),secondary=safe('secondary'),stabilisers=safe('stabilisers');
 if(!primary.length||!api?.svg)return '<p class="hf-muscle-note">'+escape(lang==='kn'?'ಸ್ನಾಯು ಚಿತ್ರಕ್ಕಾಗಿ ಮುಖ್ಯ ಸ್ನಾಯು ಆಯ್ಕೆ ಮಾಡಿ.':'Choose a primary muscle to show its muscle picture.')+'</p>';
 const names=xs=>xs.map(k=>escape(muscleLabel(k,lang))).join(' · ');
 const figures=(xs,role)=>'<div class="hf-muscle-picture">'+['front','back'].map(view=>'<div class="hf-muscle-view">'+api.svg(view,xs,role)+'<span>'+escape(lang==='kn'?(view==='front'?'ಮುಂಭಾಗ':'ಹಿಂಭಾಗ'):(view==='front'?'Front':'Back'))+'</span></div>').join('')+'</div>';
 const card=(xs,role)=>'<article class="hf-muscle-card '+(role==='secondary'?'hf-muscle-secondary':'')+'">'+(xs.length?figures(xs,role):'<div class="hf-muscle-empty" aria-hidden="true">—</div>')+'<span class="hf-muscle-role"><i class="hf-muscle-dot"></i>'+escape(lang==='kn'?(role==='primary'?'ಮುಖ್ಯ ಸ್ನಾಯುಗಳು':'ಸಹಾಯಕ ಸ್ನಾಯುಗಳು'):(role==='primary'?'Primary':'Secondary'))+'</span><h4>'+(xs.length?names(xs):escape(lang==='kn'?'ಸಹಾಯಕ ಸ್ನಾಯು ಸೂಚಿಸಿಲ್ಲ':'No secondary group listed'))+'</h4>'+(role==='secondary'&&stabilisers.length?'<p class="hf-muscle-support">'+escape(lang==='kn'?'ಸ್ಥಿರತೆ ನೀಡುವ ಸ್ನಾಯುಗಳು':'Stabilisers')+': '+names(stabilisers)+'</p>':'')+'</article>';
 return '<section class="hf-muscle-map" data-muscle-map="'+escape(entry.id)+'"><div class="hf-muscle-grid">'+card(primary,'primary')+card(secondary,'secondary')+'</div><p class="hf-muscle-note">'+escape(lang==='kn'?'ಕೋಚ್ ಆಯ್ಕೆ ಮಾಡಿದ ಸ್ನಾಯು ಪ್ರದೇಶಗಳು. ಫಾರ್ಮ್ ಮತ್ತು ಚಲನೆಯ ವ್ಯಾಪ್ತಿಯಿಂದ ಒತ್ತು ಬದಲಾಗುತ್ತದೆ.':'Muscle regions selected by the coach. Emphasis varies with technique and range.')+'</p></section>';
}

// Optional exact prescriptions; absent means the existing range-based format.
export function setRepsSummary(rows){const ns=rows.map(s=>s.reps);if(ns.some(n=>!Number.isInteger(n)))return '';const lo=Math.min(...ns),hi=Math.max(...ns);return lo===hi?String(lo):lo+'–'+hi;}
export function syncSetSummary(e){e.sets=e.set_details.length;e.reps=setRepsSummary(e.set_details);e.rest_seconds=null;}
export function validateSetDetails(e){
 const fail=()=>{const error=new Error('set_details_fields');error.code=error.message;throw error;};
 const rows=e.set_details;
 if(!Array.isArray(rows)||rows.length<1||rows.length>6||e.sets!==rows.length||typeof e.load_each_side!=='boolean'||e.rest_seconds!==null)fail();
 for(const s of rows){
  if(!object(s)||Object.keys(s).some(k=>!['kg','reps','rest_seconds'].includes(k))||!(s.kg===null||(typeof s.kg==='number'&&Number.isFinite(s.kg)&&s.kg>=0&&s.kg<=1000))||!Number.isInteger(s.reps)||s.reps<1||s.reps>60||!(s.rest_seconds===null||(Number.isInteger(s.rest_seconds)&&s.rest_seconds>=0&&s.rest_seconds<=300)))fail();
 }
 if(e.reps!==setRepsSummary(rows)||!(e.reps_in_reserve===null||(Number.isInteger(e.reps_in_reserve)&&e.reps_in_reserve>=1&&e.reps_in_reserve<=4)))fail();
 return rows;
}
export function copySetDetails(e){return {load_each_side:e.load_each_side,set_details:validateSetDetails(e).map(s=>({kg:s.kg,reps:s.reps,rest_seconds:s.rest_seconds}))};}
export function restClock(seconds){return seconds===null?'—':String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}
