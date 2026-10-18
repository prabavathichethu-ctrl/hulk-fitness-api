// HULK product defaults v1.0.0. Starting estimates, not clinical prescriptions.
export const POLICY_VERSION = 'hulk-nutrition-1.0.0';
export const GOALS = ['weight_gain','muscle_gain','maintenance','fat_loss','weight_loss','recomp'];
export const ADJUSTMENTS = Object.freeze({weight_gain:0.08,muscle_gain:0.05,maintenance:0,fat_loss:-0.12,weight_loss:-0.12,recomp:-0.05});
const enums = {
  goal: GOALS, sex: ['male','female','unspecified'], diet: ['veg','egg','nonveg'],
  work: ['desk','mixed','active'], steps: ['low','medium','high','unknown'],
  experience: ['beginner','intermediate','advanced'], equipment: ['gym','basic','bodyweight'],
  recomp_priority: ['balanced','fat_loss','lean']
};
const bounds = {age:[13,90],height_cm:[120,230],weight_kg:[30,250],workout_days:[1,6],session_minutes:[20,120],meals:[2,5]};
const integers = ['age','workout_days','session_minutes','meals'];
const screens = ['health_review','pregnant_or_lactating','eating_concern','exercise_red_flags'];
const allergies = ['milk','egg','nuts','soy','gluten','fish'];
export function validateIntake(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid answers.');
  const out = {};
  for (const [key, values] of Object.entries(enums)) {
    if (!values.includes(input[key])) throw new Error('Please check '+key+'.');
    out[key] = input[key];
  }
  for (const [key,[min,max]] of Object.entries(bounds)) {
    const n = input[key];
    if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max || (integers.includes(key) && !Number.isInteger(n))) throw new Error('Please check '+key+'.');
    out[key] = n;
  }
  for (const key of screens) {
    if (typeof input[key] !== 'boolean') throw new Error('Please answer every readiness question.');
    out[key] = input[key];
  }
  if (!Array.isArray(input.allergies) || input.allergies.length > allergies.length || input.allergies.some(x=>!allergies.includes(x))) throw new Error('Please check allergies.');
  out.allergies = [...new Set(input.allergies)];
  if (input.consent !== true) throw new Error('Consent is required to save these details.');
  out.consent = true;
  return out; // Discards user IDs, calculated targets and any other client-supplied fields.
}
export function activityFactor(a) {
  // Work and steps describe the same daily movement. Use the higher band,
  // then add training separately. Unknown steps reduce estimate confidence.
  const movement = Math.max({desk:0,mixed:1,active:2}[a.work],{low:0,unknown:0,medium:1,high:2}[a.steps]);
  const training = a.workout_days <= 2 ? 0 : a.workout_days <= 4 ? 1 : 2;
  return [[1.2,1.375,1.5],[1.375,1.5,1.6],[1.5,1.6,1.7]][movement][training];
}
export function calculateNutrition(input) {
  const a = validateIntake(input);
  const bmi = a.weight_kg / ((a.height_cm/100)**2);
  const flags = [];
  if (a.age < 18) flags.push('under_18');
  if (a.age > 65) flags.push('over_65');
  if (a.sex === 'unspecified') flags.push('formula_basis');
  for (const key of screens) if (a[key]) flags.push(key);
  if (bmi < 18.5 || bmi >= 30) flags.push('body_size_review');
  const base = {policy_version:POLICY_VERSION,kind:'review',flags,bmi:Math.round(bmi*10)/10,confidence:a.steps==='unknown'?'low':'provisional'};
  if (flags.length) return base;
  const rmr = 10*a.weight_kg + 6.25*a.height_cm - 5*a.age + (a.sex==='male'?5:-161);
  const factor = activityFactor(a), maintenance = rmr*factor;
  const adjustment = a.goal === 'recomp' ? {balanced:-0.05,fat_loss:-0.12,lean:0}[a.recomp_priority] : ADJUSTMENTS[a.goal];
  const calories = Math.round(maintenance*(1+adjustment)/50)*50;
  const protein = Math.round(a.weight_kg*(a.goal==='maintenance'?1.6:2));
  const fat = Math.round(calories*0.25/9);
  const carbs = Math.round((calories-4*protein-9*fat)/4*10)/10;
  if (carbs < 0 || !Number.isFinite(calories)) return {...base,flags:['macro_review']};
  return {...base,kind:'estimate',rmr_kcal:Math.round(rmr),activity_factor:factor,maintenance_kcal:Math.round(maintenance),adjustment_percent:Math.round(adjustment*100),calories_kcal:calories,protein_g:protein,fat_g:fat,carbs_g:carbs,fibre_g:Math.round(calories/1000*14*10)/10};
}
export function foodChoices(a) {
  // Food suggestions only. These are not calorie-counted meal prescriptions.
  const excluded = new Set(a.allergies || []);
  const foods = [{id:'dal',en:'Dal, chana and rajma',kn:'ಬೇಳೆ, ಕಡಲೆ ಮತ್ತು ರಾಜ್ಮಾ'},{id:'rice',en:'Rice, ragi and vegetables',kn:'ಅಕ್ಕಿ, ರಾಗಿ ಮತ್ತು ತರಕಾರಿಗಳು'}];
  if (!excluded.has('milk')) foods.push({id:'dairy',en:'Curd and paneer',kn:'ಮೊಸರು ಮತ್ತು ಪನೀರ್'});
  if (!excluded.has('soy')) foods.push({id:'soy',en:'Tofu and soy chunks',kn:'ಟೋಫು ಮತ್ತು ಸೋಯಾ ಚಂಕ್ಸ್'});
  if (a.diet !== 'veg' && !excluded.has('egg')) foods.push({id:'egg',en:'Eggs',kn:'ಮೊಟ್ಟೆಗಳು'});
  if (a.diet === 'nonveg') { foods.push({id:'chicken',en:'Chicken',kn:'ಚಿಕನ್'}); if (!excluded.has('fish')) foods.push({id:'fish',en:'Fish',kn:'ಮೀನು'}); }
  return foods;
}
