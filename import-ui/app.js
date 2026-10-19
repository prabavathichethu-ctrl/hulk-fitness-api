'use strict';
const $=id=>document.getElementById(id);
const state={client:null,source:null,workout:null,sourceCheck:null,busy:false,saved:false,urls:[],batch:null,dirty:false,selectedFiles:[]};
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
function notice(message,error=false){$('notice').textContent=message;$('notice').className=error?'error':'';}
function setBusy(on){state.busy=on;document.body.classList.toggle('busy',on);document.querySelectorAll('button,input,select,textarea').forEach(b=>b.disabled=on);$('stop-batch').disabled=!on||!state.batch;if(!on){if(state.saved)lockReview();else updateGate();}}
function button(text,fn,cls='quiet'){const b=node('button',text,cls);b.type='button';b.addEventListener('click',fn);return b;}
function field(parent,label,value,change,{kind='text',options,max}={}){
 const l=node('label',label),input=node(kind==='select'?'select':kind==='textarea'?'textarea':'input');
 if(kind==='select')for(const [v,t]of options){const o=node('option',t);o.value=v;input.append(o);}
 input.setAttribute('aria-label',label);if(max)input.maxLength=max;input.value=value??'';
 input.addEventListener(kind==='select'?'change':'input',()=>{change(input.value);edited();});l.append(input);parent.append(l);return input;
}
const numeric=value=>{if(typeof value==='number'||value==null)return value??null;const v=value.trim();return v===''?null:/^\d+(?:\.\d+)?$/.test(v)?Number(v):v;};
const emptyExercise=()=>({name:'',name_kn:'',equipment:'gym',primary:[],secondary:[],stabilisers:[],cues:[],tempo:null,each_side:null,reps_in_reserve:null,sets:null,set_details:[]});
const emptyWorkout=()=>({title:'',duration_days:null,days:[{day:null,source_day_label:null,title:'',exercises:[]}]});
function normalize(w){
 const out=w&&typeof w==='object'?structuredClone(w):emptyWorkout();
 if(!Array.isArray(out.days)||!out.days.length)out.days=emptyWorkout().days;
 for(const d of out.days){if(!Array.isArray(d.exercises))d.exercises=[];for(const e of d.exercises){if(!Array.isArray(e.set_details)||!e.set_details.length){if(Number.isInteger(e.sets)&&e.sets>0&&e.sets<=6)e.set_details=Array.from({length:e.sets},()=>({kg:e.kg??null,reps:e.reps??null,rest_seconds:e.rest_seconds??null}));else e.set_details=[];}}}
 return out;
}
async function api(path,body){
 const {data:{session}}=await state.client.auth.getSession();if(!session)throw Error('Sign in with your owner account.');
 const r=await fetch(path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+session.access_token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(150000)});
 let data;try{data=await r.json();}catch{throw Error('The server did not return a readable response. Retry shortly.');}
 if(r.status===401){$('login').hidden=false;throw Error('Your session expired. Sign in again; keep this page open to retain your review.');}
 return {r,data};
}
async function ownerSession(){const {r,data}=await api('/import-session');if(!r.ok||!data.success)throw Error(data.error||'Owner access is required.');const previous=$('series').value;$('series').replaceChildren(node('option','Choose a series'));$('series').firstChild.value='';for(const s of data.series){const o=node('option',s.title);o.value=s.code;$('series').append(o);}$('series').value=previous;$('login').hidden=true;$('workspace').hidden=false;$('logout').hidden=false;}
async function captureSource(){
 if(!$('series').value)throw Error('Choose the destination series first.');
 const files=state.selectedFiles,text=$('source-text').value.trim();
 if(!files.length&&!text)throw Error('Choose a workout image or paste the complete workout.');
 if(files.length>4||files.some(f=>f.size>5*1024*1024)||files.reduce((n,f)=>n+f.size,0)>10*1024*1024)throw Error('Use up to 4 images, each under 5 MB and under 10 MB combined.');
 const images=[];for(const f of files){if(!['image/jpeg','image/png','image/webp'].includes(f.type))throw Error('Use JPG, PNG or WEBP images.');images.push(await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(Error('Image could not be read.'));reader.readAsDataURL(f);}));}
 return {seriesCode:$('series').value,workoutText:text,images,batchMode:$('batch-mode').value,extractionMethod:$('extraction-method').value};
}
function displaySources(){
 state.urls.forEach(u=>URL.revokeObjectURL(u));state.urls=[];$('sources').replaceChildren();
 for(const [i,b64]of state.source.images.entries()){const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)),url=URL.createObjectURL(new Blob([bytes]));state.urls.push(url);$('sources').append(node('h4','Image '+(i+1)));const img=node('img');img.src=url;img.alt='Original workout screenshot '+(i+1);$('sources').append(img);}
 if(state.source.workoutText)$('sources').append(node('pre',state.source.workoutText));
 $('destination').textContent='Destination: '+$('series').selectedOptions[0].textContent;
}
function openReview(workout,sourceCheck,batchReview=null){
 state.workout=normalize(workout);state.sourceCheck=sourceCheck;state.saved=false;state.dirty=false;
 $('source-form').hidden=true;$('review').hidden=false;$('confirmed').checked=false;$('batch-confirmed').checked=false;$('source-counts').value='';$('override-reason').value='';
 $('workout-title').value=state.workout.title??'';$('duration').value=state.workout.duration_days??'';
 displaySources();renderSessions();renderBatchSummary(batchReview);updateGate();
}
function edited(){if(!state.workout)return;$('confirmed').checked=false;$('batch-confirmed').checked=false;state.dirty=true;notice('Compare your corrections with the original source, then confirm the complete review. Nothing has been saved.');updateGate();}
function renderSessions(){
 $('sessions').replaceChildren();
 state.workout.days.forEach((d,di)=>{
  const section=node('section',undefined,'session'),heading=node('div',undefined,'actions');heading.append(node('h3','Session '+(di+1)),button('Remove session',()=>{state.workout.days.splice(di,1);renderSessions();edited();},'quiet danger'));section.append(heading);
  field(section,'Session title',d.title,v=>d.title=v,{max:100});
  const fields=node('div',undefined,'fields');
  field(fields,'Weekday (only if specified)',d.day==null?'':String(d.day),v=>d.day=v===''?null:Number(v),{kind:'select',options:[['','Unspecified'],...['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((s,i)=>[String(i),s])]});
  field(fields,'Source day/session label (if present)',d.source_day_label,v=>d.source_day_label=v||null,{max:100});section.append(fields);
  d.exercises.forEach((e,ei)=>{
   const card=node('article',undefined,'exercise'),bar=node('div',undefined,'actions');bar.append(node('h4','Exercise '+(ei+1)),button('Remove exercise',()=>{d.exercises.splice(ei,1);renderSessions();edited();},'quiet danger'));card.append(bar);if(Array.isArray(e.source_images))card.append(node('p','Source: image/page '+e.source_images.join(', '),'hint'));
   if(e.source_note)card.append(node('p',e.source_note,'hint'));
   field(card,'Exercise name',e.name,v=>e.name=v,{max:120});
   const ef=node('div',undefined,'fields');
   field(ef,'Equipment',e.equipment||'',v=>e.equipment=v,{kind:'select',options:[['','Choose equipment'],['gym','Gym'],['dumbbell','Dumbbell'],['band','Band'],['bodyweight','Bodyweight']]});
   field(ef,'Each Side',e.each_side===true?'yes':e.each_side===false?'no':'unknown',v=>e.each_side=v==='unknown'?null:v==='yes',{kind:'select',options:[['unknown','Not visible / unspecified'],['yes','Checked / yes'],['no','Unchecked / no']]});card.append(ef);
   const table=node('table'),head=node('thead'),hr=node('tr');for(const t of ['Set','KG','Reps','Rest (sec)',''])hr.append(node('th',t));head.append(hr);table.append(head);const tb=node('tbody');
   e.set_details.forEach((row,ri)=>{const tr=node('tr');tr.append(node('td',String(ri+1)));for(const [key,label]of [['kg','KG'],['reps','Reps'],['rest_seconds','Rest seconds']]){const td=node('td'),input=node('input');input.value=row[key]??'';input.inputMode=key==='kg'?'decimal':'numeric';input.setAttribute('aria-label',`Session ${di+1}, exercise ${ei+1}, set ${ri+1}: ${label}`);input.addEventListener('input',()=>{row[key]=numeric(input.value);e.sets=e.set_details.length;edited();});td.append(input);tr.append(td);}const td=node('td');td.append(button('×',()=>{e.set_details.splice(ri,1);e.sets=e.set_details.length;renderSessions();edited();},'quiet danger'));td.firstChild.setAttribute('aria-label','Remove set '+(ri+1));tr.append(td);tb.append(tr);});table.append(tb);card.append(table,button('+ Set',()=>{e.set_details.push({kg:null,reps:null,rest_seconds:null});e.sets=e.set_details.length;renderSessions();edited();}));
   const details=node('details');details.append(node('summary','Source notes and muscle selections'));
   field(details,'Kannada name (optional)',e.name_kn,v=>e.name_kn=v,{max:120});field(details,'Tempo (only if shown)',e.tempo,v=>e.tempo=v||null,{max:60});field(details,'Reps in reserve (only if shown)',e.reps_in_reserve,v=>e.reps_in_reserve=numeric(v));
   for(const [key,label]of [['primary','Primary muscles'],['secondary','Secondary muscles'],['stabilisers','Stabilisers']])field(details,label+' (Studio IDs, comma separated)',Array.isArray(e[key])?e[key].join(', '):'',v=>e[key]=v.split(',').map(s=>s.trim()).filter(Boolean));
   field(details,'Source coaching notes (one per line)',Array.isArray(e.cues)?e.cues.join('\n'):'',v=>e.cues=v.split('\n').map(s=>s.trim()).filter(Boolean),{kind:'textarea'});card.append(details);section.append(card);
  });section.append(button('+ Exercise',()=>{d.exercises.push(emptyExercise());renderSessions();edited();}));$('sessions').append(section);
 });
}
function localIssues(){
 const w=state.workout,issues=[];if(!w)return ['Extract a workout first.'];
 if(typeof w.title!=='string'||w.title.trim().length<2)issues.push('Enter the workout title.');
 if(w.duration_days!=null&&(!Number.isInteger(w.duration_days)||w.duration_days<1||w.duration_days>365))issues.push('Duration must be 1–365 whole days or blank.');
 if(w.days.length<1||w.days.length>7)issues.push('Keep 1–7 sessions.');const used=new Set();
 w.days.forEach((d,di)=>{const n=di+1,day=d.day??di;if(used.has(day)||!Number.isInteger(day)||day<0||day>6)issues.push(`Session ${n}: weekday overlaps another session.`);used.add(day);if(w.days.length>1&&d.day==null&&(!d.source_day_label||d.source_day_label.trim().length<2))issues.push(`Session ${n}: enter its actual source day label, or combine exercise cards.`);if(!d.exercises.length||d.exercises.length>12)issues.push(`Session ${n}: keep 1–12 exercises.`);
  d.exercises.forEach((e,ei)=>{const label=`Session ${n}, exercise ${ei+1}`;if(!e.name||e.name.trim().length<2)issues.push(label+': enter the exercise name.');if(!['gym','dumbbell','band','bodyweight'].includes(e.equipment))issues.push(label+': choose equipment.');if(!e.set_details.length||e.set_details.length>6)issues.push(label+': keep 1–6 sets.');if(e.sets!=null&&e.sets!==e.set_details.length)issues.push(label+': declared set count differs from the rows; correct/add missing rows.');e.set_details.forEach((r,i)=>{if(!Number.isInteger(r.reps)||r.reps<1||r.reps>60)issues.push(`${label}, set ${i+1}: enter exact reps 1–60.`);if(r.kg!=null&&(typeof r.kg!=='number'||r.kg<0||r.kg>1000))issues.push(`${label}, set ${i+1}: KG must be 0–1000 or blank.`);if(r.rest_seconds!=null&&(!Number.isInteger(r.rest_seconds)||r.rest_seconds<0||r.rest_seconds>300))issues.push(`${label}, set ${i+1}: rest must be 0–300 seconds or blank.`);});});
 });return issues;
}
function countsInput(){return $('source-counts').value.trim()?$('source-counts').value.split(',').map(s=>/^\d+$/.test(s.trim())?Number(s.trim()):NaN):[];}
function coverageIssues(){
 const src=state.sourceCheck?.source,es=state.workout.days.flatMap(d=>d.exercises),issues=[];
 if(src?.status==='counted'){
  if(es.length!==src.tables.length)issues.push(`Source: ${src.tables.length} exercises. Reviewed table: ${es.length}.`);
  src.tables.forEach((t,i)=>{if(es[i]?.set_details.length!==t.sets)issues.push(`Source exercise ${i+1}: ${t.sets} sets; reviewed table: ${es[i]?.set_details.length||0}.`);if(t.restRows&&es[i]?.set_details.filter(r=>typeof r.rest_seconds==='number').length!==t.restRows)issues.push(`Exercise ${i+1}: source rest values are missing.`);t.rows?.forEach((r,j)=>{for(const k of ['kg','reps','rest_seconds'])if(r[k]!=null&&(k!=='kg'||r.weightRead)&&es[i]?.set_details[j]?.[k]!==r[k])issues.push(`Exercise ${i+1}, set ${j+1}: ${k} differs from OCR. Check the image and correct it, or explain the OCR error below.`);});});
 }
 const manual=countsInput(),matches=manual.length===es.length&&manual.length>0&&manual.every((n,i)=>Number.isInteger(n)&&n>=1&&n<=6&&es[i].set_details.length===n);
 if(src?.status!=='counted')return matches?[]:['Enter the source sets for every exercise in “Confirm or correct the source counts”.'];
 if(issues.length&&matches&&$('override-reason').value.trim().length>=10)return [];
 return issues;
}
function updateGate(){
 if(!state.workout)return;$('save').disabled=true;
 const src=state.sourceCheck?.source,es=state.workout.days.flatMap(d=>d.exercises),box=node('div',undefined,'status'),ok=coverageIssues().length===0;
 box.append(node('strong',ok?'Counts ready for owner review':'Needs review — saving is blocked'));
 box.append(node('p',src?.status==='counted'?`Automatic source count: ${src.tables.length} exercises · ${src.tables.reduce((n,t)=>n+t.sets,0)} sets. Reviewed table: ${es.length} exercises · ${es.reduce((n,e)=>n+e.set_details.length,0)} sets.`:src?.message||'Automatic source counts are unavailable. Confirm the source counts manually.'));
 if(ok)box.classList.add('ok');const issues=coverageIssues();if(issues.length){const ul=node('ul');issues.forEach(t=>ul.append(node('li',t)));box.append(ul);}$('coverage').replaceChildren(box);
 $('override-label').hidden=src?.status!=='counted';if(src?.status!=='counted')$('manual-count-panel').open=true;
 const validation=localIssues();$('validation').textContent=validation.slice(0,4).join(' ');
 $('save').disabled=state.busy||state.saved||!ok||validation.length>0||!$('confirmed').checked||(! $('batch-confirm-label').hidden&&!$('batch-confirmed').checked);
 $('save-note').textContent=state.saved?'Draft saved. Further edits belong in Studio.':'Nothing has been saved. Check the source before confirming.';
}
function renderBatchSummary(batch){
 const count=state.source.images.length+(state.source.workoutText?1:0);$('batch-confirm-label').hidden=count<2;$('batch-summary').replaceChildren();
 if(!batch)return;const box=node('div',undefined,'status');box.append(node('strong','All source pages need review'));const list=node('ul');
 for(const page of batch.pages){list.append(node('li','Source '+page.page+': '+(page.status==='duplicate'?page.message:page.status==='ready'?page.exerciseCount+' exercise cards read; review required. '+(page.message||''):'Extraction failed. '+page.message)));}
 for(const message of batch.warnings)list.append(node('li',message));box.append(list);$('batch-summary').append(box);
}
function paintBatch(){
 $('batch-progress').hidden=false;$('page-progress').replaceChildren();
 state.batch.results.forEach((r,i)=>{const status=r.status==='ready'?(r.coverageStatus==='mismatch'?'needs correction':r.coverageStatus==='unverified'?'needs source review':'rows read — review required'):r.status;const li=node('li','Source '+(i+1)+' of '+state.batch.results.length+' · '+status+(r.reusedFrom?' (result reused from identical source '+r.reusedFrom+')':'')+(r.error?' — '+r.error:''));if(r.diagnostic){const detail=node('details');detail.append(node('summary','Extraction diagnostic'),node('pre',JSON.stringify({code:r.code,requestId:r.requestId,diagnostic:r.diagnostic},null,2)));li.append(detail);}$('page-progress').append(li);});
 $('retry-batch').hidden=state.busy;const failures=state.batch.results.filter(r=>r.status!=='ready').length;$('retry-batch').textContent=failures?'Retry failed sources ('+failures+')':'Rebuild review (no AI calls)';
}
async function runBulk(){
 if(!state.batch){const sources=state.source.images.map(image=>({images:[image],workoutText:''}));if(state.source.workoutText)sources.push({images:[],workoutText:state.source.workoutText});state.batch={sources,results:sources.map(()=>({status:'pending'})),stop:false};$('source-form').hidden=true;}
 state.batch.stop=false;$('stop-batch').disabled=false;paintBatch();
 for(let i=0;i<state.batch.sources.length;i++){
  if(state.batch.results[i].status==='ready')continue;
  if(state.batch.stop){state.batch.results[i]={status:'failed',error:'Not requested: batch was stopped. Retry this source or transcribe it manually.'};continue;}
  const source=state.batch.sources[i];state.batch.results[i]={status:'processing'};paintBatch();notice('Extracting source '+(i+1)+' of '+state.batch.sources.length+'… Completed sources will not be requested again on retry.');
  // Reuse identical bytes. Table-mode merging also lists the duplicate page
  // while including its cards once; separate-session mode retains both.
  const prior=source.images.length?state.batch.sources.findIndex((s,j)=>j<i&&s.images[0]===source.images[0]&&state.batch.results[j].status==='ready'):-1;
  if(prior>=0){state.batch.results[i]=structuredClone(state.batch.results[prior]);state.batch.results[i].reusedFrom=prior+1;paintBatch();continue;}
  try{const {r,data}=await api('/extract-workout',{seriesCode:state.source.seriesCode,...source,action:state.source.extractionMethod==='tables'?'preview_tables':'preview'});
   if(data.review&&Array.isArray(data.review.days)&&data.review.days.length&&data.review.days.every(d=>Array.isArray(d?.exercises)&&d.exercises.length))state.batch.results[i]={status:'ready',review:data.review,coverageStatus:data.sourceCheck?.status,code:data.code};
   else state.batch.results[i]={status:'failed',error:data.error||'No usable extraction returned. Retry or enter this source manually.',code:data.code,requestId:data.requestId,diagnostic:data.aiDiagnostic||data.providerDiagnostic};
   if(r.status===429)state.batch.stop=true;
  }catch(e){state.batch.results[i]={status:'failed',error:e.message||'Source request failed.'};if(!$('login').hidden)state.batch.stop=true;}
  paintBatch();
 }
 const {r,data}=await api('/extract-workout',{...state.source,action:'preview_bulk',pageResults:state.batch.results});
 if(data.review){openReview(data.review,data.sourceCheck,data.batchReview);notice('Sources read. Review missing or overlapping cards, OCR names, equipment, Each Side and every numeric value. Enter the workout title and combined counts before saving. Nothing has been saved.',!r.ok);}else throw Error(data.error||'The review could not be built. Retry the review without requesting completed sources again.');
}
$('discard-batch').addEventListener('click',reset);
$('stop-batch').addEventListener('click',()=>{if(state.batch){state.batch.stop=true;$('stop-batch').disabled=true;notice('The current source will finish. Remaining sources will be left for retry or manual entry.');}});
$('retry-batch').addEventListener('click',async()=>{if(state.busy||!state.batch||state.saved)return;if(state.dirty&&!window.confirm('Retrying rebuilds the review table and replaces your unsaved corrections. Continue?'))return;setBusy(true);try{await runBulk();}catch(e){notice(e.message,true);}finally{setBusy(false);paintBatch();}});
function lockReview(){$('retry-batch').disabled=true;document.querySelectorAll('#review input,#review select,#review textarea,#review button').forEach(n=>n.disabled=true);$('reset').disabled=false;}
function reset(){state.urls.forEach(u=>URL.revokeObjectURL(u));state.urls=[];state.source=null;state.workout=null;state.sourceCheck=null;state.saved=false;state.batch=null;state.dirty=false;$('batch-progress').hidden=true;$('review').hidden=true;$('source-form').hidden=false;$('files').value='';state.selectedFiles=[];$('selected-files').replaceChildren();$('source-text').value='';document.querySelectorAll('#review input,#review select,#review textarea,#review button').forEach(n=>n.disabled=false);notice('Choose the next source.');}
async function begin(manual=false){if(state.busy)return;setBusy(true);notice(manual?'Preparing manual review…':'Counting the source and extracting the workout… This can take up to two minutes.');try{
 state.source=await captureSource();state.batch=null;
 if(manual){openReview(emptyWorkout(),null);notice('Enter every exercise and set, then confirm the source counts.');return;}
 if(state.source.images.length+(state.source.workoutText?1:0)>1){await runBulk();return;}
 const {r,data}=await api('/extract-workout',{...state.source,action:state.source.extractionMethod==='tables'?'preview_tables':'preview'});
 if(data.review){openReview(data.review,data.sourceCheck);notice(r.ok?'Extraction ready. Compare the complete table with the source.':data.error,true);}
 else{openReview(emptyWorkout(),data.sourceCheck);notice((data.error||'Extraction could not be read.')+' You can enter the workout manually or start a new import.',true);}
 }catch(e){notice(e.message||'Request failed. Retry shortly.',true);}finally{setBusy(false);if(state.batch)paintBatch();}}
$('login-form').addEventListener('submit',async event=>{event.preventDefault();if(state.busy)return;setBusy(true);try{const identity=$('identity').value.trim(),password=$('password').value;const {error}=await state.client.auth.signInWithPassword({...identity.startsWith('+')?{phone:identity}:{email:identity},password});$('password').value='';if(error)throw Error(error.message);await ownerSession();notice('Choose the series and complete workout source.');}catch(e){$('password').value='';notice(e.message,true);}finally{setBusy(false);}});
function showSelectedFiles(){
 $('selected-files').replaceChildren();state.selectedFiles.forEach((file,i)=>{const row=node('li');row.append(node('span',file.name+' '));if(i>0)row.append(button('Move up',()=>{[state.selectedFiles[i-1],state.selectedFiles[i]]=[state.selectedFiles[i],state.selectedFiles[i-1]];showSelectedFiles();}));if(i<state.selectedFiles.length-1)row.append(button('Move down',()=>{[state.selectedFiles[i+1],state.selectedFiles[i]]=[state.selectedFiles[i],state.selectedFiles[i+1]];showSelectedFiles();}));$('selected-files').append(row);});
}
$('files').addEventListener('change',()=>{state.selectedFiles=[...$('files').files];showSelectedFiles();});
$('extract').addEventListener('click',()=>begin(false));$('manual').addEventListener('click',()=>begin(true));$('reset').addEventListener('click',reset);
$('workout-title').addEventListener('input',()=>{state.workout.title=$('workout-title').value;edited();});$('duration').addEventListener('input',()=>{state.workout.duration_days=numeric($('duration').value);edited();});
$('source-counts').addEventListener('input',edited);$('override-reason').addEventListener('input',edited);$('confirmed').addEventListener('change',updateGate);$('batch-confirmed').addEventListener('change',updateGate);
$('add-session').addEventListener('click',()=>{state.workout.days.push({day:null,source_day_label:null,title:'',exercises:[]});renderSessions();edited();});
$('merge').addEventListener('click',()=>{state.workout.days=[{day:null,source_day_label:null,title:state.workout.title,exercises:state.workout.days.flatMap(d=>d.exercises)}];renderSessions();edited();});
$('save').addEventListener('click',async()=>{if(state.busy||$('save').disabled)return;setBusy(true);notice('Saving the reviewed values as a draft…');try{const {r,data}=await api('/extract-workout',{...state.source,action:'save_reviewed',reviewedWorkout:state.workout,reviewConfirmed:$('confirmed').checked,sourceSetCounts:countsInput(),batchReviewConfirmed:$('batch-confirmed').checked,sourceCountOverride:$('override-reason').value.trim()||undefined});if(!r.ok||!data.success){if(data.sourceCheck)state.sourceCheck=data.sourceCheck;throw Error(data.error||'Save could not be confirmed. Retry the same review.');}state.saved=true;notice(data.message+' Open the selected series in Studio to review and publish.');$('save-note').textContent='Draft ID: '+data.programId;lockReview();}catch(e){notice(e.message,true);}finally{setBusy(false);}});
$('logout').addEventListener('click',async()=>{if(state.busy)return;await state.client.auth.signOut({scope:'local'});reset();$('workspace').hidden=true;$('login').hidden=false;$('logout').hidden=true;notice('Signed out.');});
(async()=>{try{const r=await fetch('/import-config');const c=await r.json();if(!r.ok||!c.supabaseUrl||!c.supabasePublishableKey)throw Error('The owner sign-in configuration is unavailable. Check Render configuration.');state.client=supabase.createClient(c.supabaseUrl,c.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:false}});notice('Sign in to start. Your review stays on this page until you save or leave.');}catch(e){notice(e.message,true);$('login-form').querySelector('button').disabled=true;}})();
