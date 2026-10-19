import {createWorker,PSM} from 'tesseract.js';
import eng from '@tesseract.js-data/eng';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {digest,ImportError} from './workout.mjs';

// An independent count of visible table rows, never an OCR-to-number repair.
// Unsupported layouts remain unverified. Even a match needs an owner's review.
export function countSourceTables(text){
 const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean),tables=[];
 let table=null,uncertain=false;
 for(let i=0;i<lines.length;i++){
  const line=lines[i];
  if(/\bSET\b.*\b(?:KG|LB|LBS)\b.*\bREPS\b.*\bREST\b/i.test(line)){
   table={label:(lines[i-1]||'Exercise').slice(0,140),sets:0,restRows:0};tables.push(table);continue;
  }
  if(!table)continue;
  // Require a set ordinal, two data cells (possibly an OCR-damaged weight),
  // and a clear mm:ss rest. Other table formats need manual source counts.
  const row=/^(\d{1,2})\s+\S+\s+\d{1,2}\s+(\d{1,2}):([0-5]\d)\s*$/.exec(line);
  if(row){if(Number(row[1])!==table.sets+1)uncertain=true;table.sets++;table.restRows++;}
  else if(/^\d/.test(line))uncertain=true;
 }
 const verified=tables.length>0&&tables.length<=84&&!uncertain&&tables.every(t=>t.sets>=1&&t.sets<=6);
 return {status:verified?'counted':'unverified',method:'ocr-table-count',tables,
  message:verified?'Visible table counts found. Check every value and checkbox against the source.':'This layout could not be counted reliably. Enter the source exercise and set counts yourself.'};
}

// One worker at a time; terminate after every job so a small Render instance
// does not retain a WASM heap. The trained data is installed by npm, not fetched
// from a public CDN during a request. Cache only bounded count summaries.
let busy=false;
const cache=new Map();
export async function inspectSource({images,text}){
 const key=digest({images:images.map(i=>createHash('sha256').update(i.jpeg).digest('hex')),text}),prior=cache.get(key);
 if(prior&&Date.now()-prior.at<15*60*1000)return structuredClone(prior.value);
 if(!images.length)return countSourceTables(text);
 if(images.length>1||text.trim()){
  const pages=[];
  for(const image of images)pages.push(await inspectSource({images:[image],text:''}));
  if(text.trim())pages.push(countSourceTables(text));
  return {status:'unverified',method:'ocr-table-count',tables:[],pageCounts:pages.map(p=>p.tables.map(t=>t.sets)),pageInventories:pages,message:'Multiple sources may overlap. Check all sources and enter the combined exercise/set counts without duplicates.'};
 }
 if(busy)throw new ImportError('ocr_busy','Source counting is busy. Retry shortly; nothing was saved.',409);
 busy=true;let worker,timer,expired=false;
 try{
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{expired=true;if(worker)void worker.terminate().catch(()=>{});reject(new Error('OCR timeout'));},25000);});
  const run=(async()=>{
   worker=await createWorker('eng',1,{langPath:eng.langPath,gzip:true,cacheMethod:'none',errorHandler:()=>{}});
   if(expired){await worker.terminate();throw Error('OCR timeout');}
   await worker.setParameters({tessedit_pageseg_mode:PSM.SINGLE_BLOCK});
   const pages=[];
   for(const image of images){
    const bounded=await sharp(image.jpeg).resize(2200,2200,{fit:'inside',withoutEnlargement:true}).png().toBuffer();
    const {data}=await worker.recognize(bounded);pages.push(countSourceTables(data.text));
   }
   return pages[0];
  })();
  const value=await Promise.race([run,timeout]);
  if(cache.size>=20)cache.delete(cache.keys().next().value);
  cache.set(key,{at:Date.now(),value});return structuredClone(value);
 }catch{return {status:'unverified',method:'ocr-table-count',tables:[],message:'Automatic source counting was unavailable. Enter source counts and review every value manually.'};}
 finally{clearTimeout(timer);if(worker&&!expired)await worker.terminate().catch(()=>{});busy=false;}
}

export function extractedCounts(ai){
 const exercises=Array.isArray(ai?.days)?ai.days.flatMap(d=>Array.isArray(d?.exercises)?d.exercises:[]):[];
 return exercises.map(e=>({name:typeof e?.name==='string'?e.name:'',sets:Array.isArray(e?.set_details)&&e.set_details.length?e.set_details.length:Number.isInteger(e?.sets)?e.sets:0,restRows:Array.isArray(e?.set_details)?e.set_details.filter(r=>typeof r?.rest_seconds==='number').length:0}));
}
export function compareCoverage(source,ai){
 const actual=extractedCounts(ai),issues=[];
 if(source.status!=='counted')return {status:'unverified',actual,issues:[source.message],source};
 if(actual.length!==source.tables.length)issues.push(`Source has ${source.tables.length} exercises; extraction has ${actual.length}.`);
 source.tables.forEach((t,i)=>{
  if(actual[i]?.sets!==t.sets)issues.push(`Source exercise ${i+1} has ${t.sets} set rows; extraction has ${actual[i]?.sets||0}.`);
  if(t.restRows>0&&actual[i]?.restRows!==t.restRows)issues.push(`Source exercise ${i+1}: visible rest values are missing from the extraction.`);
 });
 return {status:issues.length?'mismatch':'counts_match',actual,issues,source};
}
export function requireReviewedCoverage(source,ai,body){
 if(body.reviewConfirmed!==true)throw new ImportError('review_required','Compare every exercise, set, value and Each Side checkbox with the source, then confirm your review.',422);
 const check=compareCoverage(source,ai);
 if(check.status==='counts_match')return check;
 if(source.status==='counted'&&!body.sourceCountOverride)throw new ImportError('source_mismatch','The reviewed table still differs from the visible source counts. Nothing was saved.',422,{sourceCheck:check,review:ai});
 // A coach may correct an OCR count, but only with explicit replacement counts
 // and a reason. This is human confirmation, never labelled OCR verified.
 const counts=body.sourceSetCounts,actual=extractedCounts(ai);
 if(!Array.isArray(counts)||counts.length<1||counts.length>84||counts.some(n=>!Number.isInteger(n)||n<1||n>6)||counts.length!==actual.length||counts.some((n,i)=>actual[i].sets!==n))throw new ImportError('source_counts_required','Enter the number of sets for every source exercise in order; the reviewed table must match.',422,{sourceCheck:check});
 if(source.status==='counted'&&(typeof body.sourceCountOverride!=='string'||body.sourceCountOverride.trim().length<10||body.sourceCountOverride.length>300))throw new ImportError('source_override_reason','Explain why the automatic source count is incorrect (10–300 characters).',422);
 return {...check,status:'owner_confirmed',issues:[],manualSetCounts:counts,overrideReason:source.status==='counted'?body.sourceCountOverride.trim():null};
}
