import {FOODS,FOOD_VERSION} from './food-catalog.mjs';
import {EXERCISES,EXERCISE_VERSION} from './exercise-catalog.mjs';
import {validateIntake,calculateNutrition} from './nutrition.mjs';
export const PLAN_VERSION='hulk-plans-1.0.0';
const KEYS=['calories_kcal','protein_g','fat_g','carbs_g'];
const round=(x,p=1)=>Math.round(x*10**p)/10**p;
const required=(code)=>{const e=new Error(code);e.code=code;throw e;};
export function assertPlanEligibility(intake,nutrition){
 const a=validateIntake(intake?.answers),fresh=calculateNutrition(a);
 if(fresh.flags.some(f=>f!=='body_size_review'))required('specialist_review');
 if(intake.review_status!=='approved'||nutrition?.intake_revision!==intake.revision||!nutrition?.approved_at||nutrition.targets?.kind!=='estimate')required('nutrition_pending');
 if(fresh.flags.includes('body_size_review')&&nutrition.targets.origin!=='owner_review')required('individual_review');
 for(const k of KEYS)if(typeof nutrition.targets[k]!=='number'||!Number.isFinite(nutrition.targets[k])||nutrition.targets[k]<(k==='carbs_g'?0:0.1))required('invalid_targets');
 return a;
}
export function sumNutrition(items){
 const totals={calories_kcal:0,protein_g:0,fat_g:0,carbs_g:0,fibre_g:0};
 for(const item of items){const food=FOODS[item.food_id];if(!food||!Number.isFinite(item.grams)||item.grams<0)required('invalid_portion');for(const k in totals)totals[k]+=food.per100[k]*item.grams/100;}
 return Object.fromEntries(Object.entries(totals).map(([k,v])=>[k,round(v)]));
}
function bounds(a,variant){
 const breakfast=variant===0?'poha':'ragi';
 const rows=[['rice',50,280,140],['atta',0,160,70],[breakfast,25,100,55],['lentil',30,120,60],['chana',0,100,20],['carrot',150,150,150],['spinach',100,100,100],['tomato',75,75,75],['banana',100,250,150],['curd',0,400,150],['milk',0,300,150],['oil',0,40,15]];
 if(a.diet==='nonveg')rows.push(['chicken',120,450,250]);
 else if(a.diet==='egg'&&!a.allergies.includes('egg'))rows.push(['egg',50,200,100],['egg_white',0,350,150]);
 else rows.push(['tofu',0,400,200],['paneer',0,180,80]);
 // A declared allergen always overrides dietary preference. No silent replacements.
 return rows.filter(([id])=>FOODS[id].diets.includes(a.diet)&&!FOODS[id].allergens.some(x=>a.allergies.includes(x)));
}
function tolerances(targets){return [Math.max(50,targets.calories_kcal*.05),Math.max(10,targets.protein_g*.1),Math.max(6,targets.fat_g*.1),Math.max(15,targets.carbs_g*.1)];}
function optimise(rows,targets){
 const metrics=[...KEYS,'fibre_g'],goal=[...KEYS.map(k=>targets[k]),targets.fibre_g||targets.calories_kcal/1000*14],tol=[...tolerances(targets),15],vectors=rows.map(([id])=>metrics.map((k,i)=>FOODS[id].per100[k]/100/tol[i]));
 let best;
 for(const seed of [.7,1,1.3]){
  let q=rows.map(([,lo,hi,start])=>Math.max(lo,Math.min(hi,start*seed)));
  for(let iter=0;iter<350;iter++){
   const total=goal.map((_,j)=>q.reduce((s,g,i)=>s+g*vectors[i][j],0));let moved=0;
   for(let i=0;i<q.length;i++){
    const vec=vectors[i],den=vec.reduce((s,x)=>s+x*x,0);if(!den)continue;
    const delta=vec.reduce((s,x,j)=>s+x*(goal[j]/tol[j]-total[j]),0)/den;
    const other=rows.findIndex(([id])=>id===(rows[i][0]==='lentil'?'chana':'lentil'));
    const max=['lentil','chana'].includes(rows[i][0])&&other>=0?Math.min(rows[i][2],150-q[other]):rows[i][2];
    const next=Math.max(rows[i][1],Math.min(max,q[i]+delta)),change=next-q[i];
    q[i]=next;moved+=Math.abs(change);for(let j=0;j<total.length;j++)total[j]+=change*vec[j];
   }
   if(moved<.001)break;
  }
  const items=rows.map(([id,lo,hi],i)=>({food_id:id,grams:Math.max(lo,Math.min(hi,Math.round(q[i]/(id==='oil'?1:5))*(id==='oil'?1:5)))})).filter(x=>x.grams>0);
  const total=sumNutrition(items),error=metrics.reduce((s,k,i)=>s+((total[k]-goal[i])/tol[i])**2,0);
  if(!best||error<best.error)best={items,total,error};
 }
 return best;
}
function portionMeals(items,count,variant){
 // Base four meals. Recipes use only these weighed ingredients plus water.
 const slots=[[],[],[],[]];
 const shares={rice:[0,.5,0,.5],atta:[0,0,0,1],poha:[1,0,0,0],ragi:[1,0,0,0],lentil:[0,.5,0,.5],chana:[0,.5,0,.5],carrot:[0,.5,0,.5],spinach:[0,.5,0,.5],tomato:[0,.5,0,.5],banana:[0,0,1,0],curd:[.5,0,.5,0],milk:[0,0,1,0],oil:[.2,.4,0,.4],chicken:[0,.5,0,.5],egg:[.5,0,0,.5],egg_white:[.5,0,0,.5],tofu:[.3,.35,0,.35],paneer:[0,.5,0,.5]};
 for(const item of items){const weights=shares[item.food_id];let assigned=0;
  const positive=weights.map((x,i)=>x?i:null).filter(x=>x!==null);const final=positive.at(-1);
  for(const idx of positive){const grams=idx===final?round(item.grams-assigned,2):round(item.grams*weights[idx],2);assigned+=grams;slots[idx].push({food_id:item.food_id,grams});}
 }
 let meals=slots.map((ingredients,i)=>({slot:['breakfast','lunch','snack','dinner'][i],recipe:i===0?(variant===0?'poha_plate':'ragi_plate'):i===2?'fruit_dairy':'dal_plate',ingredients}));
 if(count===2)meals=[{slot:'meal1',recipe:'combined',ingredients:[...slots[0],...slots[1]]},{slot:'meal2',recipe:'combined',ingredients:[...slots[2],...slots[3]]}];
 if(count===3)meals=[meals[0],meals[1],{...meals[3],ingredients:[...slots[2],...slots[3]]}];
 if(count===5){const snack=slots[2],fruit=snack.filter(x=>FOODS[x.food_id].group==='fruit'),other=snack.filter(x=>FOODS[x.food_id].group!=='fruit');
  meals=[meals[0],meals[1],{slot:'snack',recipe:'fruit_dairy',ingredients:fruit},meals[3],{slot:'lateSnack',recipe:'fruit_dairy',ingredients:other}];
  if(!other.length){const dinner=meals[3].ingredients;const id=dinner.findIndex(x=>['rice','atta','tofu','chicken','egg','lentil'].includes(x.food_id));if(id>=0){const split={...dinner[id],grams:round(dinner[id].grams/3,2)};dinner[id].grams=round(dinner[id].grams-split.grams,2);meals[4].ingredients=[split];meals[4].recipe='dal_plate';}}
 }
 return meals.filter(m=>m.ingredients.length).map(m=>({...m,totals:sumNutrition(m.ingredients)}));
}
export function buildMeals(a,targets){
 const tol=tolerances(targets);const menus=[];
 for(let variant=0;variant<2;variant++){
  const fit=optimise(bounds(a,variant),targets),meals=portionMeals(fit.items,a.meals,variant);
  const deltas=Object.fromEntries(KEYS.map(k=>[k,round(fit.total[k]-targets[k])]));
  const matches=KEYS.every((k,i)=>Math.abs(deltas[k])<=tol[i]);
  const reasonable=meals.length===a.meals&&fit.total.fibre_g<=Math.max(50,(targets.fibre_g||targets.calories_kcal/1000*14)+20)&&meals.every(m=>m.ingredients.reduce((s,x)=>s+x.grams,0)<=950&&m.totals.protein_g<=90);
  if(!matches||!reasonable)return {kind:'review',reason:reasonable?'macro_match_unavailable':'portion_review',targets,closest_totals:fit.total,deltas};
  menus.push({id:variant?'B':'A',meals,totals:fit.total,deltas,shopping:fit.items});
 }
 const shopping={};for(let day=0;day<7;day++)for(const item of menus[day%2].shopping)shopping[item.food_id]=round((shopping[item.food_id]||0)+item.grams,2);
 return {kind:'matched',diet:a.diet,meals_per_day:a.meals,targets,tolerance:dictTolerances(tol),menus,weekly_rotation:['A','B','A','B','A','B','A'],shopping:Object.entries(shopping).map(([food_id,grams])=>({food_id,grams}))};
}
function dictTolerances(tol){return Object.fromEntries(KEYS.map((k,i)=>[k,round(tol[i])]));}
function exerciseMap(equipment,homeMode){
 if(equipment==='gym')return {squat:'leg_press',push:'db_bench',pull:'cable_row',hinge:'db_rdl',shoulder:'db_press',pull_alt:'lat_pull',single_leg:'split_squat',calf:'calf',arm:'curl',core:'deadbug'};
 if(equipment==='basic'&&homeMode==='dumbbell')return {squat:'goblet',push:'floor_press',pull:'db_row',hinge:'db_rdl',shoulder:'db_press',pull_alt:'db_row',single_leg:'split_squat',calf:'calf',arm:'curl',core:'deadbug'};
 if(equipment==='basic'&&homeMode==='band')return {squat:'band_squat',push:'band_press',pull:'band_row',hinge:'band_hinge',shoulder:'band_overhead',pull_alt:'band_row',single_leg:'split_squat',calf:'calf',arm:'band_curl',core:'deadbug'};
 if(equipment==='basic')required('choose_home_kit');
 return {squat:'squat',push:'pushup',pull:'prone_w',hinge:'bridge',shoulder:'pushup',pull_alt:'prone_w',single_leg:'split_squat',calf:'calf',arm:'pushup',core:'deadbug'};
}
export function buildWorkout(a,options={}){
 const map=exerciseMap(a.equipment,options.home_mode),days={1:[0],2:[0,3],3:[0,2,4],4:[0,1,3,4],5:[0,1,2,4,5],6:[0,1,2,3,4,5]}[a.workout_days];
 const short=a.session_minutes<40,beginner=a.experience==='beginner';
 const full=beginner||a.workout_days<=3||short;
 const strengthDays=full?(a.workout_days>=5?[0,2,4]:a.workout_days===4?[0,3]:days):a.workout_days===5?[0,1,4,5]:days;
 const patterns={full_a:['squat','push','pull','hinge','core'],full_b:['hinge','push','pull','single_leg','core'],upper:['push','pull','shoulder','pull_alt','arm','core'],lower:['squat','hinge','single_leg','calf','core']};
 const sets=beginner||a.goal==='maintenance'||a.session_minutes<30?2:3,rest=beginner?75:90;let turn=0;
 const sessions=Array.from({length:7},(_,day)=>{
  if(!days.includes(day))return {day,kind:'rest'};
  if(!strengthDays.includes(day))return {day,kind:'conditioning',minutes:Math.min(a.session_minutes,['fat_loss','weight_loss','recomp'].includes(a.goal)?25:20),intensity:'talk_test'};
  const type=full?(turn++%2?'full_b':'full_a'):(turn++%2?'lower':'upper');let used=7;const exercises=[];
  for(const pattern of patterns[type]){const id=map[pattern],workSets=a.experience==='advanced'&&a.session_minutes>=60&&exercises.length<2&&a.goal!=='maintenance'?4:sets,minutes=(workSets*45+(workSets-1)*rest+45)/60;if(used+minutes>a.session_minutes)continue;
   used+=minutes;exercises.push({id,pattern,sets:workSets,reps:id==='deadbug'?'6–10 / side':id==='prone_w'?'10–15':'8–12',rest_seconds:rest,reps_in_reserve:beginner?3:2});
  }
  if(exercises.length<2)required('session_review');
  return {day,kind:'strength',type,estimated_minutes:Math.ceil(used),warmup_minutes:5,cooldown_minutes:2,exercises};
 });
 return {kind:'program',name:'HULK FIT Transformation',equipment:a.equipment,home_mode:a.equipment==='basic'?options.home_mode:null,goal:a.goal,experience:a.experience,available_minutes:a.session_minutes,requested_days:a.workout_days,strength_days:strengthDays.length,sessions,notes:[...(a.workout_days===1?['frequency_review']:[]),...(a.equipment==='bodyweight'?['pull_limit']:[]),...(short?['short_session']:[])]};
}
export function buildPlan(intake,nutrition,options={}){
 const a=assertPlanEligibility(intake,nutrition),workout=buildWorkout(a,options),meals=buildMeals(a,nutrition.targets);
 return {policy_version:PLAN_VERSION,food_version:FOOD_VERSION,exercise_version:EXERCISE_VERSION,intake_revision:intake.revision,nutrition_approved_at:nutrition.approved_at,kind:meals.kind==='matched'?'complete':'meal_review',workout,meals};
}
export function currentPlan(assignment,intake,nutrition){return !!(assignment&&intake&&nutrition&&assignment.plan?.policy_version===PLAN_VERSION&&assignment.plan?.food_version===FOOD_VERSION&&assignment.plan?.exercise_version===EXERCISE_VERSION&&intake.review_status==='approved'&&assignment.intake_revision===intake.revision&&nutrition.intake_revision===intake.revision&&Date.parse(assignment.nutrition_approved_at)===Date.parse(nutrition.approved_at));}
