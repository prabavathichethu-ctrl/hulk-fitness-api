// HULK Studio AI / Render. No production data changes occur on startup.
import express from 'express';
import cors from 'cors';
import sharp from 'sharp';
import {randomUUID} from 'node:crypto';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {inspectSource,compareCoverage,requireReviewedCoverage,tablePreview} from './source-coverage.mjs';
import {mergeBulkWorkouts} from './bulk-workout.mjs';
const require=createRequire(import.meta.url);
import {ImportError,digest,parseAiJson,pickSeries,buildProgram,buildPrompt,stableId} from './workout.mjs';
export {parseAiJson,pickSeries,buildProgram} from './workout.mjs';
const defaults=['https://hulkfitnessarena.in','https://www.hulkfitnessarena.in','https://app.flutterflow.io'];
const positive=(v,fallback,max)=>{if(v===undefined||v==='')return fallback;const n=Number(v);if(!Number.isInteger(n)||n<1||n>max)throw Error('Invalid positive configuration value');return n;};
export function configFromEnv(env=process.env){
 const origins=(env.ALLOWED_ORIGINS||defaults.join(',')).split(',').map(s=>s.trim()).filter(Boolean);
 if(!origins.length||origins.some(s=>{try{return s==='*'||!/^https?:\/\//.test(s)||new URL(s).origin!==s;}catch{return true;}}))throw Error('ALLOWED_ORIGINS must contain exact HTTP(S) origins, never *.');
 for(const ownOrigin of [env.RENDER_EXTERNAL_URL,env.IMPORT_APP_ORIGIN].filter(Boolean)){let origin;try{origin=new URL(ownOrigin).origin;}catch{throw Error('Invalid import page origin');}if(!/^https?:\/\//.test(ownOrigin)||origin!==ownOrigin.replace(/\/$/,''))throw Error('Invalid import page origin');if(!origins.includes(origin))origins.push(origin);}
 return {supabaseUrl:(env.SUPABASE_URL||'').replace(/\/$/,''),supabaseKey:env.SUPABASE_ANON_KEY||env.SUPABASE_PUBLISHABLE_KEY||'',nvidiaKey:env.NVIDIA_API_KEY||'',model:env.NVIDIA_MODEL||'',endpoint:env.NVIDIA_ENDPOINT||'https://integrate.api.nvidia.com/v1/chat/completions',origins,jsonLimit:positive(env.MAX_JSON_BYTES,16*1024*1024,20*1024*1024),maxImageBytes:positive(env.MAX_IMAGE_BYTES,5*1024*1024,10*1024*1024),maxImages:positive(env.MAX_IMAGES,4,10),inlineCap:env.NVIDIA_MAX_IMAGE_BASE64_CHARS?positive(env.NVIDIA_MAX_IMAGE_BASE64_CHARS,0,20*1024*1024):0,maxEdge:positive(env.IMAGE_MAX_EDGE,4096,8192),aiTimeout:positive(env.AI_TIMEOUT_MS,90000,120000),dailyLimit:positive(env.IMPORTS_PER_OWNER_PER_DAY,200,10000),minuteLimit:positive(env.IMPORTS_PER_OWNER_PER_MINUTE,6,60)};
}
const bad=(code,message,status=400,extra)=>{throw new ImportError(code,message,status,extra);};
function base64Bytes(value,limit){
 if(typeof value!=='string')bad('image_type','imageBase64 must be a Base64 String, not an Uploaded File object.');
 const s=value.trim().replace(/^data:image\/(?:jpeg|png|webp);base64,/i,'');
 if(!s||s.length%4!==0||!/^[A-Za-z0-9+/]+={0,2}$/.test(s))bad('image_base64','Invalid Base64 image.');
 if(s.length>Math.ceil(limit/3)*4)bad('image_too_large','Image exceeds the configured decoded-byte limit.',413);
 const b=Buffer.from(s,'base64');if(b.length<16||b.length>limit||b.toString('base64')!==s)bad('image_base64','Invalid Base64 image.');return b;
}
export async function prepareImage(bytes,config){
 try{
  const img=sharp(bytes,{limitInputPixels:24000000,failOn:'error'}),m=await img.metadata();
  if(!['jpeg','png','webp'].includes(m.format)||!m.width||!m.height||(m.pages||1)>1)bad('image_format','Use a single-frame JPG, PNG or WEBP image.');
  const out=await img.rotate().resize(config.maxEdge,config.maxEdge,{fit:'inside',withoutEnlargement:true}).jpeg({quality:92,mozjpeg:true}).toBuffer();
  const b64=out.toString('base64');if(config.inlineCap&&b64.length>config.inlineCap)bad('provider_image_limit','Image exceeds this model’s configured inline limit. Crop into readable sections or configure the model’s supported asset flow; it was not aggressively blurred.',413);
  // OCR reads the original decoded pixels. JPEG re-encoding can turn a small
  // decimal such as 7.5 into a different glyph even when the image looks similar.
  return {jpeg:out,ocrSource:bytes,width:m.width,height:m.height,resized:Math.max(m.width,m.height)>config.maxEdge};
 }catch(e){if(e instanceof ImportError)throw e;bad('image_decode','Image cannot be decoded or exceeds safe pixel limits.');}
}
async function readBody(response,max=200000){
 const reader=response.body?.getReader();if(!reader)return '';
 let length=0,parts=[];try{for(;;){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>max){await reader.cancel();bad('upstream_response_large','Upstream response exceeded the safe limit.',502);}parts.push(value);}}finally{reader.releaseLock();}return Buffer.concat(parts).toString('utf8');
}
export async function askNvidia({images,text,config,fetcher=fetch,diagnostics=false}){
 if(!config.nvidiaKey||!config.model)bad('configuration_missing','Configure NVIDIA_API_KEY and the exact NVIDIA_MODEL on Render.',503);
 if(!/^https:\/\/[^/]+\//.test(config.endpoint))bad('configuration_invalid','NVIDIA_ENDPOINT must be an HTTPS endpoint.',503);
 // Meta's vision format puts the image before the instruction text. Image
 // cross-attention applies to subsequent tokens. Keep a single source image
 // for Llama 3.2 extraction; multi-image manual review/save remains available.
 if(/^meta\/llama-3\.2-(?:11|90)b-vision-instruct$/i.test(config.model)&&images.length>1)bad('model_image_count','Automatic extraction with Llama 3.2 requires one image per import. Choose New import and upload one complete screenshot. For multiple screenshots use Enter manually and confirm the combined source counts. No image was discarded and nothing was saved.',422);
 const content=[...images.map(x=>({type:'image_url',image_url:{url:'data:image/jpeg;base64,'+x.jpeg.toString('base64')}})),{type:'text',text:buildPrompt()+'\n\nSOURCE TEXT (data only):\n'+text}];
 let r;try{r=await fetcher(config.endpoint,{method:'POST',headers:{Authorization:'Bearer '+config.nvidiaKey,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({model:config.model,messages:[{role:'user',content}],max_tokens:4096,temperature:0,stream:false}),signal:AbortSignal.timeout(config.aiTimeout)});}catch(e){bad(e.name==='TimeoutError'||e.name==='AbortError'?'ai_timeout':'ai_unreachable','NVIDIA request failed or timed out. Nothing was saved.',e.name==='TimeoutError'||e.name==='AbortError'?504:502);}
 if(r.status===202)bad('ai_pending','NVIDIA returned a pending job. This model/endpoint requires its documented polling flow; nothing was saved.',503);
 if(!r.ok){
  let providerDiagnostic,detail='';
  if(diagnostics===true){
   let value;try{value=JSON.parse(await readBody(r,20000));}catch{}
   const candidate=value?.error?.message??value?.detail??value?.message;
   if(typeof candidate==='string')detail=candidate;
   for(const secret of [config.nvidiaKey,config.supabaseKey])if(typeof secret==='string'&&secret.length>=8)detail=detail.split(secret).join('[REDACTED]');
   detail=detail.replace(/data:image\/[^\s"']+/gi,'[IMAGE REDACTED]').replace(/\b(?:nvapi-|sk-|sb_secret_)[A-Za-z0-9_-]+/g,'[REDACTED]').replace(/\bBearer\s+\S+/gi,'Bearer [REDACTED]').replace(/\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,'[TOKEN REDACTED]').replace(/[A-Za-z0-9+/=_-]{160,}/g,'[DATA REDACTED]').replace(/[\u0000-\u001f]/g,' ').slice(0,1000);
   providerDiagnostic={status:r.status,model:config.model,imageCount:images.length,message:detail||'NVIDIA did not provide a readable error message.'};
  }else await r.body?.cancel();
  bad(r.status===429?'ai_rate_limited':'ai_provider_error',`NVIDIA returned HTTP ${r.status}. ${detail?detail+' ':'Check the model, endpoint, quota and Render configuration. '}Nothing was saved.`,r.status===429?429:502,providerDiagnostic?{providerDiagnostic}:undefined);
 }
 let body;try{body=JSON.parse(await readBody(r));}catch(e){if(e instanceof ImportError)throw e;bad('ai_response_invalid','NVIDIA did not return valid response JSON.',502);}
 const choice=body.choices?.[0];if(choice?.finish_reason!=='stop')bad('ai_incomplete','NVIDIA output was incomplete, refused or truncated. Nothing was saved.',502);
 const raw=choice.message?.content,output=Array.isArray(raw)?raw.map(p=>p.text||'').join(''):raw;
 try{return parseAiJson(output);}catch(e){
  // Only an authenticated owner's preview receives bounded diagnostic text.
  // Keep strict parsing: never guess missing numbers or repair an incomplete object.
  if(diagnostics===true&&e instanceof ImportError&&['ai_json_invalid','ai_response_invalid'].includes(e.code)){
   let preview=typeof output==='string'?output:'';
   for(const secret of [config.nvidiaKey,config.supabaseKey])if(typeof secret==='string'&&secret.length>=8)preview=preview.split(secret).join('[REDACTED]');
   preview=preview.replace(/\b(?:nvapi-|sk-)[A-Za-z0-9_-]+/g,'[REDACTED]').replace(/\bBearer\s+\S+/gi,'Bearer [REDACTED]');
   e.extra={...e.extra,aiDiagnostic:{model:config.model,finishReason:choice.finish_reason,outputCharacters:typeof output==='string'?output.length:0,outputPreview:preview.slice(0,12000),previewTruncated:preview.length>12000}};
  }
  throw e;
 }
}
export function createApp({config=configFromEnv(),fetcher=fetch,logger=console,now=Date.now,extract=askNvidia,inspect=inspectSource}={}){
 const app=express(),usage=new Map(),inflight=new Map();app.disable('x-powered-by');
 const missing=()=>['supabaseUrl','supabaseKey','nvidiaKey','model'].filter(k=>!config[k]);
 const replyError=(res,e,requestId)=>res.status(e instanceof ImportError?e.status:500).json({success:false,error:e instanceof ImportError?e.message:'Unexpected backend error. Check Render logs using the request ID.',code:e instanceof ImportError?e.code:'internal_error',requestId,...(e instanceof ImportError?e.extra:{})});
 app.use((req,res,next)=>{req.requestId=randomUUID();res.set('X-Request-ID',req.requestId);res.set('Cache-Control','no-store');next();});
 app.use((req,res,next)=>{const origin=req.headers.origin;if(origin&&!config.origins.includes(origin))return replyError(res,new ImportError('origin_blocked','This browser origin is not allowed. Add its exact origin to ALLOWED_ORIGINS.',403),req.requestId);next();});
 app.use(cors({origin:(origin,done)=>done(null,!origin||config.origins.includes(origin)),methods:['GET','POST','OPTIONS'],allowedHeaders:['Content-Type','Authorization','X-Request-ID'],exposedHeaders:['X-Request-ID'],maxAge:600}));
 const publicDir=fileURLToPath(new URL('./import-ui/',import.meta.url));
 app.use('/import-assets',express.static(publicDir,{index:false,dotfiles:'deny',setHeaders(res){res.set('X-Content-Type-Options','nosniff');}}));
 app.get('/import-assets/supabase.js',(_req,res)=>res.sendFile(require.resolve('@supabase/supabase-js').replace(/index\.(?:cjs|mjs)$/, 'umd/supabase.js')));
 app.get('/workout-import',(_req,res)=>{
  const connect=["'self'",config.supabaseUrl].filter(Boolean).join(' ');
  res.set('Content-Security-Policy',`default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src ${connect}; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`);
  res.set('X-Content-Type-Options','nosniff');res.set('Referrer-Policy','no-referrer');res.sendFile(publicDir+'index.html');
 });
 app.get('/import-config',(_req,res)=>{
  let publicKey=config.supabaseKey.startsWith('sb_publishable_');
  try{publicKey ||= JSON.parse(Buffer.from(config.supabaseKey.split('.')[1]||'','base64url').toString()).role==='anon';}catch{}
  if(!publicKey)return replyError(res,new ImportError('public_key_required','Configure a public Supabase anon/publishable key for owner sign-in. Never use a service-role or secret key here.',503),_req.requestId);
  res.json({supabaseUrl:config.supabaseUrl,supabasePublishableKey:config.supabaseKey});
 });
 app.get('/health',(_req,res)=>res.json({ok:true,version:'2.3.0',configured:missing().length===0,message:'Process is running. This does not verify NVIDIA or database connectivity.'}));
 async function db(path,token,{method='GET',body,write=false}={}){
  let r;try{r=await fetcher(config.supabaseUrl+'/rest/v1/'+path,{method,headers:{apikey:config.supabaseKey,Authorization:'Bearer '+token,'Content-Type':'application/json',...(write?{Prefer:'return=representation'}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});}catch{bad('database_unreachable','Database request timed out or failed. A write may have completed; retry the identical input to check the same record.',503);}
  let data;try{data=JSON.parse(await readBody(r,250000));}catch{bad('database_response','Database returned an unreadable response.',502);}
  if(!r.ok){if(write&&r.status===409&&data.code==='23505')return {conflict:true};bad(r.status===401?'login_required':r.status===403?'owner_required':'database_error',r.status===401?'Log in again.':r.status===403?'Owner access is required.':'Database rejected the request; no success was reported.',r.status===401?401:r.status===403?403:422,{databaseCode:data?.code||null});}return data;
 }
 async function authenticate(req,res,next){
  try{
   if(!config.supabaseUrl||!config.supabaseKey)bad('configuration_missing','Configure SUPABASE_URL and SUPABASE_ANON_KEY on Render.',503);
   const match=/^Bearer\s+(\S+)$/i.exec(req.headers.authorization||'');if(!match)bad('login_required','Pass the current Supabase user JWT in Authorization: Bearer <JWT>.',401);const token=match[1];
   let r;try{r=await fetcher(config.supabaseUrl+'/auth/v1/user',{headers:{apikey:config.supabaseKey,Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});}catch{bad('auth_unreachable','Login verification is unavailable. Retry shortly.',503);}
   if(!r.ok)bad('login_required','Session expired or invalid. Log in again.',401);
   let user;try{user=JSON.parse(await readBody(r,50000));}catch{bad('login_required','Invalid login verification response.',401);}
   if(!/^[a-f0-9-]{36}$/i.test(user.id||'')||user.is_anonymous)bad('login_required','Use a signed-in owner account.',401);
   const role=await db('rpc/my_role',token,{method:'POST',body:{}});if(role!=='owner')bad('owner_required','Only the active owner may import workouts.',403);
   req.actor={id:user.id,token};next();
  }catch(e){replyError(res,e,req.requestId);}
 }
 app.get('/import-session',authenticate,async(req,res)=>{
  try{const series=await db('training_series?select=id,code,title,status,revision&order=sort_order',req.actor.token);res.json({success:true,series:series.filter(s=>['hulk_fit','alpha','aura','goat'].includes(s.code)&&s.status!=='archived')});}catch(e){replyError(res,e,req.requestId);}
 });
 app.post('/extract-workout',authenticate,express.json({limit:config.jsonLimit,strict:true}),async(req,res)=>{
  const stage=name=>{logger.info?.(JSON.stringify({requestId:req.requestId,stage:name}));};
  let leased=false,sourceCheck,batchReview;
  try{
   stage('backend_received');if(!req.is('application/json'))bad('content_type','Send Content-Type: application/json.',415);
   const body=req.body;if(!body||Array.isArray(body))bad('request_invalid','Send one JSON object.');
   const clean=(v,key,max)=>{if(v===undefined||v===null||v==='null'||v==='undefined')return '';if(typeof v!=='string'||v.length>max)bad('request_invalid',key+' must be a String within the documented limit.');return v.trim();};
   const text=clean(body.workoutText,'workoutText',20000),title=clean(body.title,'title',140),code=clean(body.seriesCode,'seriesCode',30),action=body.action||'import';
   if(!['import','preview','preview_tables','preview_bulk','save_reviewed'].includes(action))bad('action_invalid','Supported actions: preview_tables, preview, preview_bulk or save_reviewed; legacy text imports remain draft-only.');
   const usesAi=action==='import'||action==='preview';
   const {id:userId,token}=req.actor;
   const seriesRows=await db('training_series?select=id,code,title,status,revision&order=sort_order',token),series=pickSeries(code,seriesRows);
   const inputs=[];if(body.imageBase64!==undefined&&body.imageBase64!==null&&!(typeof body.imageBase64==='string'&&['','null','undefined'].includes(body.imageBase64.trim())))inputs.push(body.imageBase64);
   if(body.images!==undefined){if(!Array.isArray(body.images))bad('image_type','images must be an array of Base64 Strings.');inputs.push(...body.images);}
   if(!text&&!inputs.length)bad('input_missing','Upload an image or paste workout text.');if(inputs.length>config.maxImages)bad('image_count',`Maximum ${config.maxImages} images per request.`,413);
   const raw=inputs.map(v=>base64Bytes(v,config.maxImageBytes));if(raw.reduce((n,b)=>n+b.length,0)>10*1024*1024)bad('image_too_large','Combined decoded image size exceeds 10 MB.',413);
   const fingerprint=digest({series:series.id,title,text,images:raw.map(b=>digest(b))});
   const programId=stableId(`${userId}:${series.id}:${fingerprint}`);
   const existing=async()=>{const rows=await db('training_programs?select=id,title,status,series_id,content&id=eq.'+programId,token);return rows?.[0];};
   const resultFor=(row,duplicate=false)=>({success:true,message:duplicate?'This import already exists; the existing record was not changed.':`Saved "${row.title}" to ${series.title} as a draft.`,programId:row.id,series:series.code,title:row.title,status:row.status,exerciseCount:row.content.workout.sessions.reduce((n,s)=>n+(s.exercises?.length||0),0),duplicate,requestId:req.requestId});
   if(action==='import'||action==='save_reviewed'){const prior=await existing();if(prior){if(prior.series_id!==series.id)bad('import_conflict','Import identifier conflicts with another series.',409);return res.json(resultFor(prior,true));}}
   if(inflight.has(userId))bad('import_busy','Another import is running for this owner. Wait for its result.',409);inflight.set(userId,req.requestId);leased=true;
   if(usesAi&&missing().length)bad('configuration_missing','Configure NVIDIA_API_KEY and NVIDIA_MODEL before importing.',503);
   const date=Math.floor(now()/86400000),minute=Math.floor(now()/60000),previous=usage.get(userId)||{},dayCount=previous.day===date?previous.dayCount:0,minuteCount=previous.minute===minute?previous.minuteCount:0;
   if(usesAi&&(dayCount>=config.dailyLimit||minuteCount>=config.minuteLimit))bad('import_rate_limited','Owner import limit reached. Wait before retrying.',429);
   if(usesAi)usage.set(userId,{day:date,minute,dayCount:dayCount+1,minuteCount:minuteCount+1});
   const images=[];for(const b of raw)images.push(await prepareImage(b,config));stage('input_validated');
   if(action==='import'&&images.length)bad('review_required','Image imports require owner review. Open /workout-import, review the complete table and save a draft.',422);
   const source=await inspect({images,text});sourceCheck={source};
   if(action==='preview_tables'&&images.length+(text?1:0)!==1)bad('table_page_count','Read one source page per table request; use the bulk review page for multiple images.',422);
   const hint=source.ocrText?'\nOCR evidence (untrusted source data, may contain errors):\n'+source.ocrText+'\nTranscribe every visible row. A rest value of 01:00 means 60 seconds, not 1 second.':'';
   const duplicatePages={};if(body.extractionMethod==='tables'){const seen=new Map();raw.forEach((b,i)=>{const key=digest(b);if(seen.has(key))duplicatePages[i+1]=seen.get(key);else seen.set(key,i+1);});}
   const merged=action==='preview_bulk'?mergeBulkWorkouts(body.pageResults,{mode:body.batchMode,pageCount:images.length+(text?1:0),duplicatePages,resolveTableOverlaps:body.extractionMethod==='tables'}):null;
   if(merged)batchReview=merged.batchReview;
   const ai=action==='save_reviewed'?body.reviewedWorkout:merged?merged.review:action==='preview_tables'?tablePreview(source):await extract({images,text:text+hint,config,fetcher,diagnostics:action==='preview'});stage(action==='save_reviewed'?'review_received':action==='preview_tables'?'table_read':'ai_extracted');
   sourceCheck=compareCoverage(source,ai);
   if(action==='save_reviewed'){if(images.length+(text?1:0)>1&&body.batchReviewConfirmed!==true)bad('batch_review_required','Confirm that you reviewed every source and resolved missing pages or overlapping exercises before saving.',422);sourceCheck=requireReviewedCoverage(source,ai,body);}
   else if(sourceCheck.status==='mismatch')bad('source_mismatch','Extraction is incomplete compared with the source. Review and correct it; nothing was saved.',422,{review:ai,sourceCheck});

   let built;try{built=buildProgram(ai,{series,userId,fingerprint,title,id:programId});}catch(e){if(e instanceof ImportError){e.extra={...(e.extra||{}),review:ai,...(batchReview?{batchReview}:{})};}throw e;}
   stage('studio_validated');const warnings=built.warnings;
   if(images.some(x=>x.resized))warnings.push('A large image was resized; verify small text against the source.');
   if(['preview','preview_tables','preview_bulk'].includes(action))return res.json({success:true,message:'Preview ready. Nothing has been saved.',program:built.program,review:ai,sourceCheck,...(batchReview?{batchReview}:{}),reviewRequired:true,exerciseCount:built.exerciseCount,warnings,requestId:req.requestId});
   // The reviewed canonical shape is validated first. A deterministic primary key makes creation atomic and retry-safe.
   // All REST calls use the caller JWT and public key, so existing owner RLS still applies. No upsert/update/delete.
   if(action==='save_reviewed'){built.program.description='Owner-reviewed image/text import. Saved as a draft for Studio review before publishing.';built.program.content.workout.note='Owner confirmed source values and counts. '+(sourceCheck.status==='owner_confirmed'?'Manual source counts: '+sourceCheck.manualSetCounts.join(', ')+(sourceCheck.overrideReason?'; OCR override: '+sourceCheck.overrideReason:'')+'. ':'')+(images.length+(text?1:0)>1?'All '+(images.length+(text?1:0))+' source pages were reviewed for completeness and overlap. ':'')+'Not assigned to members.';}
   const saved=await db('training_programs?select=id,title,status,series_id,content',token,{method:'POST',body:built.program,write:true});
   let row=saved?.[0],duplicate=false;if(saved.conflict){row=await existing();duplicate=true;}
   if(!row||row.id!==programId||row.series_id!==series.id)bad('save_unconfirmed','Save result could not be confirmed. Retry identical input before creating a different import.',503);
   stage('draft_saved');res.status(duplicate?200:201).json({...resultFor(row,duplicate),warnings,sourceCheck});
  }catch(e){if(e instanceof ImportError)e.extra={...e.extra,...(sourceCheck?{sourceCheck:e.extra?.sourceCheck||sourceCheck}:{}),...(batchReview?{batchReview}:{})};logger.error?.(JSON.stringify({requestId:req.requestId,code:e instanceof ImportError?e.code:'internal_error'}));replyError(res,e,req.requestId);}
  finally{if(leased&&inflight.get(req.actor.id)===req.requestId)inflight.delete(req.actor.id);}
 });
 app.use((err,req,res,_next)=>replyError(res,err.type==='entity.too.large'?new ImportError('payload_too_large','JSON body exceeds the configured byte limit.',413):err.type==='entity.parse.failed'?new ImportError('invalid_json','Request body is not valid JSON.',400):err,req.requestId));
 return app;
}
const app=createApp();
if(import.meta.url===pathToFileURL(process.argv[1]||'').href){const port=Number(process.env.PORT||10000);app.listen(port,'0.0.0.0',()=>console.log('HULK Studio AI listening on port '+port));}
export default app;
