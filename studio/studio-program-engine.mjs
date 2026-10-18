import {assertPlanEligibility,buildWorkout,buildMeals,sumNutrition,PLAN_VERSION} from './plan-engine.mjs';
import {FOODS,FOOD_VERSION} from './food-catalog.mjs';
import {EXERCISES,EXERCISE_VERSION} from './exercise-catalog.mjs';
import {validateExerciseDefinition,copyCustomDefinition,validateSetDetails,copySetDetails} from './custom-exercises.mjs';
export const LIBRARY_VERSION='hulk-studio-library-1.0.0';
export const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const goals=['any','weight_gain','muscle_gain','maintenance','fat_loss','weight_loss','recomp'];
const fail=code=>{const e=new Error(code);e.code=code;throw e;};
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v),int=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
const text=(v,min,max)=>typeof v==='string'&&v.trim().length>=min&&v.length<=max;
const round=v=>Math.round(v*100)/100;
export function validateSeries(s){
 if(!obj(s)||!text(s.title,2,120)||!text(s.title_kn||'',0,120)||!text(s.description||'',0,2000)||!text(s.description_kn||'',0,2000)||!/^[a-z][a-z0-9_-]{1,39}$/.test(s.code||'')||!['draft','published','archived'].includes(s.status)||!int(s.sort_order,0,10000))fail('series_fields');
 if(s.cover_path&&!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(s.cover_path))fail('cover_invalid');
 return s;
}
function validReps(v){if(typeof v!=='string'||!/^\d{1,2}(?:\s*[-–]\s*\d{1,2})?(?:\s*\/\s*side)?$/.test(v))return false;const nums=v.match(/\d+/g).map(Number);return nums.every(n=>n>=1&&n<=60)&&(nums.length<2||nums[0]<=nums[1]);}
export function validateProgram(p,strict=true){
 if(!obj(p)||!UUID.test(p.series_id||'')||!text(p.title,2,140)||!text(p.title_kn||'',0,140)||!text(p.description||'',0,2000)||!text(p.description_kn||'',0,2000)||!int(p.duration_days,1,365)||!goals.includes(p.goal)||!['any','beginner','intermediate','advanced'].includes(p.experience)||!['any','gym','basic','bodyweight'].includes(p.equipment)||!['any','veg','egg','nonveg'].includes(p.diet_pref)||!int(p.sort_order,0,10000)||!['draft','published','archived'].includes(p.status))fail('program_fields');
 const c=p.content;if(!obj(c)||c.version!==LIBRARY_VERSION||!obj(c.workout)||!obj(c.diet)||!['automatic','custom'].includes(c.workout.mode)||!['personalized','custom'].includes(c.diet.mode)||!text(c.workout.note||'',0,1000)||!text(c.diet.note||'',0,1000))fail('program_content');
 if(JSON.stringify(c).length>100000)fail('program_large');
 if(c.workout.mode==='custom'){
  const days=c.workout.sessions;if(!Array.isArray(days)||days.length!==7||new Set(days.map(s=>s.day)).size!==7)fail('workout_days');
  let strength=0,training=0;
  for(const s of days){
   if(!obj(s)||!int(s.day,0,6)||!['rest','conditioning','strength'].includes(s.kind)||!text(s.title||'',0,100))fail('workout_days');
   if(s.kind==='rest')continue;training++;
   if(s.kind==='conditioning'){if(!int(s.minutes,5,60))fail('conditioning_minutes');continue;}
   strength++;
   if(!Array.isArray(s.exercises)||s.exercises.length>12||(strict&&!s.exercises.length))fail('exercise_missing');
   for(const e of s.exercises){if(!obj(e))fail('exercise_fields');if(e.set_details!==undefined)validateSetDetails(e);else if(!int(e.sets,1,6)||!validReps(e.reps)||!int(e.rest_seconds,30,300)||!int(e.reps_in_reserve,1,4)||e.load_each_side!==undefined)fail('exercise_fields');validateExerciseDefinition(e,strict);}
  }
  if(strict&&(!strength||training>6))fail('workout_days');
 }
 if(c.diet.mode==='custom'){
  const menus=c.diet.menus;if(!Array.isArray(menus)||menus.length!==2||new Set(menus.map(m=>m.id)).size!==2||menus.some(m=>!['A','B'].includes(m.id)))fail('diet_menus');
  for(const m of menus){
   if(!Array.isArray(m.meals)||m.meals.length<2||m.meals.length>5||m.meals.length!==menus[0].meals.length)fail('meal_count');
   for(const meal of m.meals){
    if(!obj(meal)||!text(meal.title,2,100)||!['breakfast','lunch','snack','dinner','lateSnack','meal1','meal2'].includes(meal.slot)||!Array.isArray(meal.ingredients)||meal.ingredients.length>15||(strict&&!meal.ingredients.length))fail('meal_fields');
    for(const item of meal.ingredients)if(!obj(item)||!FOODS[item.food_id]||typeof item.grams!=='number'||!Number.isFinite(item.grams)||item.grams<=0||item.grams>1000||(item.food_id==='oil'&&item.grams>50))fail('food_fields');
   }
  }
 }
 return p;
}
function customWorkout(p,a,options){
 if(a.equipment==='basic'&&!['dumbbell','band'].includes(options.home_mode))fail('choose_home_kit');
 const allowed=a.equipment==='gym'?['gym','dumbbell','band','bodyweight']:a.equipment==='basic'?[options.home_mode,'bodyweight']:['bodyweight'];
 let training=0,strength=0;
 const sessions=p.content.workout.sessions.map(s=>{
  if(s.kind==='rest')return {day:s.day,kind:'rest'};training++;
  if(s.kind==='conditioning'){if(s.minutes>a.session_minutes)fail('session_review');return {day:s.day,kind:'conditioning',title:s.title,minutes:s.minutes,intensity:'talk_test'};}
  strength++;let time=7;
  const exercises=s.exercises.map(e=>{const definition=validateExerciseDefinition(e,true);if(!allowed.includes(definition.equipment))fail('program_equipment');if(e.set_details?.some(s=>s.rest_seconds===null))fail('set_rest_review');const rest=e.set_details?e.set_details.slice(0,-1).reduce((sum,s)=>sum+s.rest_seconds,0):(e.sets-1)*e.rest_seconds;time+=(e.sets*45+rest+45)/60;return {id:e.id,sets:e.sets,reps:e.reps,rest_seconds:e.rest_seconds,reps_in_reserve:e.reps_in_reserve,pattern:'owner_selection',...(e.set_details?copySetDetails(e):{}),...(e.custom?{custom:copyCustomDefinition(definition)}:{})};});
  if(time>a.session_minutes)fail('session_review');
  return {day:s.day,kind:'strength',type:'full_a',title:s.title,estimated_minutes:Math.ceil(time),warmup_minutes:5,cooldown_minutes:2,exercises};
 }).sort((a,b)=>a.day-b.day);
 if(training>a.workout_days)fail('program_days');
 return {kind:'program',name:p.title,equipment:a.equipment,home_mode:a.equipment==='basic'?options.home_mode:null,goal:a.goal,experience:a.experience,available_minutes:a.session_minutes,requested_days:a.workout_days,strength_days:strength,sessions,notes:[]};
}
function customMeals(p,a,targets){
 const menus=[],tolerance={calories_kcal:Math.max(50,targets.calories_kcal*.05),protein_g:Math.max(10,targets.protein_g*.1),fat_g:Math.max(6,targets.fat_g*.1),carbs_g:Math.max(15,targets.carbs_g*.1)};
 for(const source of p.content.diet.menus){
  if(source.meals.length!==a.meals)fail('program_meals');
  const reference=source.meals.flatMap(m=>m.ingredients);for(const item of reference){const f=FOODS[item.food_id];if(!f.diets.includes(a.diet))fail('program_diet');if(f.allergens.some(x=>a.allergies.includes(x)))fail('program_allergy');}
  const total=sumNutrition(reference);if(!total.calories_kcal)fail('food_fields');const scale=targets.calories_kcal/total.calories_kcal;
  const meals=source.meals.map(m=>{const ingredients=m.ingredients.map(x=>({...x,grams:round(x.grams*scale)}));return {slot:m.slot,recipe:'combined',title:m.title,ingredients,totals:sumNutrition(ingredients)};});
  const items=meals.flatMap(m=>m.ingredients),totals=sumNutrition(items),deltas=Object.fromEntries(Object.keys(tolerance).map(k=>[k,round(totals[k]-targets[k])]));
  const portions=meals.every(m=>m.ingredients.reduce((s,x)=>s+x.grams,0)<=950&&m.totals.protein_g<=90&&m.ingredients.every(x=>x.grams<=1000&&(x.food_id!=='oil'||x.grams<=50)))&&totals.fibre_g<=Math.max(50,(targets.fibre_g||targets.calories_kcal/1000*14)+20);
  if(!portions||Object.keys(tolerance).some(k=>Math.abs(deltas[k])>tolerance[k]))return {kind:'review',reason:portions?'macro_match_unavailable':'portion_review',targets,closest_totals:totals,deltas};
  const shop={};for(const i of items)shop[i.food_id]=round((shop[i.food_id]||0)+i.grams);
  menus.push({id:source.id,meals,totals,deltas,shopping:Object.entries(shop).map(([food_id,grams])=>({food_id,grams}))});
 }
 const rotation=['A','B','A','B','A','B','A'],shop={};for(const key of rotation)for(const i of menus.find(m=>m.id===key).shopping)shop[i.food_id]=round((shop[i.food_id]||0)+i.grams);
 return {kind:'matched',diet:a.diet,meals_per_day:a.meals,targets,tolerance,menus,weekly_rotation:rotation,shopping:Object.entries(shop).map(([food_id,grams])=>({food_id,grams}))};
}
export function buildLibraryPlan(intake,nutrition,p,series,options={}){
 const a=assertPlanEligibility(intake,nutrition);validateProgram(p);validateSeries(series);
 if(p.status!=='published'||series.status!=='published'||p.series_id!==series.id)fail('program_unpublished');
 for(const [k,field] of [['goal','goal'],['experience','experience'],['equipment','equipment'],['diet_pref','diet']])if(p[k]!=='any'&&p[k]!==a[field])fail('program_mismatch');
 const workout=p.content.workout.mode==='automatic'?buildWorkout(a,options):customWorkout(p,a,options);workout.name=p.title;
 const meals=p.content.diet.mode==='personalized'?buildMeals(a,nutrition.targets):customMeals(p,a,nutrition.targets);
 return {policy_version:PLAN_VERSION,food_version:FOOD_VERSION,exercise_version:EXERCISE_VERSION,intake_revision:intake.revision,nutrition_approved_at:nutrition.approved_at,kind:meals.kind==='matched'?'complete':'meal_review',workout,meals,
  program:{version:LIBRARY_VERSION,id:p.id,revision:p.revision,title:p.title,title_kn:p.title_kn||'',duration_days:p.duration_days,series_id:series.id,series_revision:series.revision,series_title:series.title,series_title_kn:series.title_kn||'',cover_path:series.cover_path||null,workout_note:p.content.workout.note||'',diet_note:p.content.diet.note||''}};
}
