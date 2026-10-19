import {ImportError} from './workout.mjs';
const label=v=>typeof v==='string'?v.trim():'';
const nameKey=v=>label(v).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');

// Concatenate complete page extractions in source order. Never guess overlapping
// sets or silently discard repeated exercises. Their resolution belongs to review.
export function mergeBulkWorkouts(results,{mode='same_workout',pageCount}={}){
 if(!['same_workout','preserve_sessions'].includes(mode)||!Number.isInteger(pageCount)||pageCount<2||pageCount>11||!Array.isArray(results)||results.length!==pageCount)throw new ImportError('batch_invalid','Send one ordered result for every source image/text page and choose a valid batch mode.',422);
 const pages=[],allDays=[],failed=[],warnings=[],sourceDurations=[],sourceTitles=[];
 let title='';
 for(let i=0;i<results.length;i++){
  const result=results[i],w=result?.review;
  const valid=result?.status==='ready'&&w&&Array.isArray(w.days)&&w.days.length>0&&w.days.every(d=>d&&Array.isArray(d.exercises)&&d.exercises.length>0&&d.exercises.every(e=>e&&typeof e==='object'&&!Array.isArray(e)));
  if(!valid){
   failed.push(i+1);pages.push({page:i+1,status:'failed',message:label(result?.error).slice(0,1200)||'This source needs manual transcription or a retry.'});
   allDays.push({day:null,source_day_label:null,title:'',exercises:[{name:'',equipment:'gym',each_side:null,set_details:[],source_images:[i+1]}]});continue;
  }
  title ||= label(w.title);
  if(label(w.title))sourceTitles.push({page:i+1,title:label(w.title)});
  if(w.duration_days!=null)sourceDurations.push({page:i+1,value:structuredClone(w.duration_days)});
  pages.push({page:i+1,status:'ready',exerciseCount:w.days.reduce((n,d)=>n+d.exercises.length,0),message:result.coverageStatus==='mismatch'?'This page extraction differs from its source counts. Correct it during review.':''});
  for(const d of w.days)allDays.push({...structuredClone(d),exercises:d.exercises.map(e=>({...structuredClone(e),source_images:[i+1]}))});
 }
 const explicit=new Set(allDays.map(d=>d.day!=null?'weekday:'+d.day:label(d.source_day_label)?'label:'+label(d.source_day_label).toLowerCase():'').filter(Boolean));
 // Conflicting explicit source labels are retained, even in same-workout mode.
 const combine=mode==='same_workout'&&explicit.size<=1;
 if(mode==='same_workout'&&!combine)warnings.push('Different source day labels were found. Sessions were retained; check their grouping before saving.');
 const days=combine?[{day:allDays.find(d=>d.day!=null)?.day??null,source_day_label:allDays.find(d=>label(d.source_day_label))?.source_day_label??null,title,exercises:allDays.flatMap(d=>d.exercises)}]:allDays;
 const occurrences=new Map();let position=0;
 for(const d of days)for(const e of d.exercises){position++;const key=nameKey(e.name);if(!key)continue;const list=occurrences.get(key)||[];list.push({position,pages:e.source_images});occurrences.set(key,list);}
 const repeatedExercises=[...occurrences.entries()].filter(([,xs])=>xs.length>1).map(([name,occurrences])=>({name,occurrences}));
 if(repeatedExercises.length)warnings.push('Repeated exercise names may be screenshot overlaps or intentional repeats. All entries and rows were retained; resolve them against every original source.');
 if(failed.length)warnings.push('Sources '+failed.join(', ')+' were not extracted. Their empty exercise placeholders must be filled or explicitly resolved during review.');
 const durationValues=new Set(sourceDurations.map(d=>JSON.stringify(d.value)));
 const duration=durationValues.size===1?sourceDurations[0].value:null;
 if(durationValues.size>1)warnings.push('Source durations conflict: '+sourceDurations.map(d=>'source '+d.page+' = '+JSON.stringify(d.value).slice(0,100)).join('; ')+'. Confirm the correct program duration manually.');
 if(mode==='same_workout'&&new Set(sourceTitles.map(t=>t.title.toLowerCase())).size>1)warnings.push('Source titles differ. Confirm that these screenshots belong to the same workout and choose its full title.');
 warnings.push('Confirm combined source set counts manually. Per-image OCR counts are not added because screenshots may overlap.');
 return {review:{title,duration_days:duration,days},batchReview:{mode,pageCount,pages,failedPages:failed,repeatedExercises,sourceDurations,sourceTitles,warnings}};
}
