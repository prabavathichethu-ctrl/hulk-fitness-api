// HULK coaching catalogue. Suggestions are separate from source transcription.
// Base names/transliterations/cues: existing studio/exercise-catalog.mjs.
// Base muscle roles: existing HULK muscle-mapping.json. Three explicit row variants
// use broad movement regions; emphasis still requires the coach's review.
export const COACHING_VERSION='hulk-import-coaching-1.0.0';
export const COACHING_PROFILES=[
 {
  "id": "leg_press",
  "name": "Leg press",
  "name_kn": "ಲೆಗ್ ಪ್ರೆಸ್",
  "equipment": "gym",
  "primary": [
   "quads",
   "glutes"
  ],
  "secondary": [
   "hamstrings",
   "adductors"
  ],
  "stabilisers": [
   "core"
  ],
  "cues": [
   "Keep your hips against the pad; use a comfortable depth.",
   "Move smoothly and keep knees in line with your feet."
  ],
  "aliases": [
   "Leg press"
  ]
 },
 {
  "id": "db_bench",
  "name": "Dumbbell bench press",
  "name_kn": "ಡಂಬೆಲ್ ಬೆಂಚ್ ಪ್ರೆಸ್",
  "equipment": "gym",
  "primary": [
   "chest"
  ],
  "secondary": [
   "front_delts",
   "triceps"
  ],
  "stabilisers": [],
  "cues": [
   "Use a stable bench and a load you can control.",
   "Lower smoothly; stop before discomfort or loss of control."
  ],
  "aliases": [
   "Dumbbell bench press"
  ]
 },
 {
  "id": "cable_row",
  "name": "Seated cable row",
  "name_kn": "ಸೀಟೆಡ್ ಕೇಬಲ್ ರೋ",
  "equipment": "gym",
  "primary": [
   "lats",
   "upper_back"
  ],
  "secondary": [
   "biceps",
   "rear_delts"
  ],
  "stabilisers": [
   "core"
  ],
  "cues": [
   "Sit tall and pull toward your lower ribs.",
   "Keep the torso steady; avoid jerking the weight."
  ],
  "aliases": [
   "Seated cable row"
  ]
 },
 {
  "id": "lat_pull",
  "name": "Lat pulldown",
  "name_kn": "ಲ್ಯಾಟ್ ಪುಲ್‌ಡೌನ್",
  "equipment": "gym",
  "primary": [
   "lats"
  ],
  "secondary": [
   "biceps",
   "upper_back"
  ],
  "stabilisers": [],
  "cues": [
   "Pull in front of your head toward the upper chest.",
   "Use a comfortable grip and avoid swinging."
  ],
  "aliases": [
   "Lat pulldown"
  ]
 },
 {
  "id": "db_rdl",
  "name": "Dumbbell Romanian deadlift",
  "name_kn": "ಡಂಬೆಲ್ ರೊಮೇನಿಯನ್ ಡೆಡ್‌ಲಿಫ್ಟ್",
  "equipment": "dumbbell",
  "primary": [
   "hamstrings",
   "glutes"
  ],
  "secondary": [
   "adductors"
  ],
  "stabilisers": [
   "lower_back",
   "core",
   "forearms"
  ],
  "cues": [
   "Soften the knees and move the hips back.",
   "Keep weights close; use only a comfortable hip-hinge range."
  ],
  "aliases": [
   "Dumbbell Romanian deadlift"
  ]
 },
 {
  "id": "db_press",
  "name": "Dumbbell shoulder press",
  "name_kn": "ಡಂಬೆಲ್ ಶೋಲ್ಡರ್ ಪ್ರೆಸ್",
  "equipment": "dumbbell",
  "primary": [
   "front_delts",
   "side_delts"
  ],
  "secondary": [
   "triceps",
   "upper_back",
   "serratus"
  ],
  "stabilisers": [
   "core"
  ],
  "cues": [
   "Brace the trunk and use a comfortable overhead range.",
   "Avoid leaning back to finish a repetition."
  ],
  "aliases": [
   "Dumbbell shoulder press"
  ]
 },
 {
  "id": "goblet",
  "name": "Goblet squat",
  "name_kn": "ಗಾಬ್ಲೆಟ್ ಸ್ಕ್ವಾಟ್",
  "equipment": "dumbbell",
  "primary": [
   "quads",
   "glutes"
  ],
  "secondary": [
   "adductors",
   "hamstrings"
  ],
  "stabilisers": [
   "core",
   "lower_back"
  ],
  "cues": [
   "Hold the weight close and keep feet planted.",
   "Use a comfortable depth with knees tracking over feet."
  ],
  "aliases": [
   "Goblet squat"
  ]
 },
 {
  "id": "floor_press",
  "name": "Dumbbell floor press",
  "name_kn": "ಡಂಬೆಲ್ ಫ್ಲೋರ್ ಪ್ರೆಸ್",
  "equipment": "dumbbell",
  "primary": [
   "chest"
  ],
  "secondary": [
   "front_delts",
   "triceps"
  ],
  "stabilisers": [],
  "cues": [
   "Lie on a clear floor with feet planted.",
   "Lower until upper arms gently meet the floor; avoid bouncing."
  ],
  "aliases": [
   "Dumbbell floor press"
  ]
 },
 {
  "id": "db_row",
  "name": "Dumbbell row",
  "name_kn": "ಡಂಬೆಲ್ ರೋ",
  "equipment": "dumbbell",
  "primary": [
   "lats",
   "upper_back"
  ],
  "secondary": [
   "biceps",
   "rear_delts"
  ],
  "stabilisers": [
   "core",
   "lower_back"
  ],
  "cues": [
   "Hinge comfortably and keep the trunk steady.",
   "Pull toward the hip without twisting the torso."
  ],
  "aliases": [
   "Dumbbell row"
  ]
 },
 {
  "id": "curl",
  "name": "Dumbbell curl",
  "name_kn": "ಡಂಬೆಲ್ ಕರ್‌ಲ್",
  "equipment": "dumbbell",
  "primary": [
   "biceps"
  ],
  "secondary": [
   "forearms"
  ],
  "stabilisers": [],
  "cues": [
   "Keep elbows near the torso.",
   "Lift and lower without swinging."
  ],
  "aliases": [
   "Dumbbell curl"
  ]
 },
 {
  "id": "band_squat",
  "name": "Band squat",
  "name_kn": "ಬ್ಯಾಂಡ್ ಸ್ಕ್ವಾಟ್",
  "equipment": "band",
  "primary": [
   "quads",
   "glutes"
  ],
  "secondary": [
   "adductors",
   "hamstrings"
  ],
  "stabilisers": [
   "core",
   "lower_back"
  ],
  "cues": [
   "Check the band for damage before use.",
   "Stand securely on the band and use controlled, comfortable depth."
  ],
  "aliases": [
   "Band squat"
  ]
 },
 {
  "id": "band_hinge",
  "name": "Band hip hinge",
  "name_kn": "ಬ್ಯಾಂಡ್ ಹಿಪ್ ಹಿಂಜ್",
  "equipment": "band",
  "primary": [
   "hamstrings",
   "glutes"
  ],
  "secondary": [
   "adductors"
  ],
  "stabilisers": [
   "lower_back",
   "core",
   "forearms"
  ],
  "cues": [
   "Stand securely on the band and soften the knees.",
   "Move the hips back without rounding or forcing the range."
  ],
  "aliases": [
   "Band hip hinge"
  ]
 },
 {
  "id": "band_row",
  "name": "Seated band row",
  "name_kn": "ಸೀಟೆಡ್ ಬ್ಯಾಂಡ್ ರೋ",
  "equipment": "band",
  "primary": [
   "lats",
   "upper_back"
  ],
  "secondary": [
   "biceps",
   "rear_delts"
  ],
  "stabilisers": [
   "core"
  ],
  "cues": [
   "Use the band around your feet only as its manufacturer permits.",
   "Keep a secure grip and do not aim stretched bands at your face."
  ],
  "aliases": [
   "Seated band row"
  ]
 },
 {
  "id": "band_press",
  "name": "Standing band chest press",
  "name_kn": "ಸ್ಟ್ಯಾಂಡಿಂಗ್ ಬ್ಯಾಂಡ್ ಚೆಸ್ಟ್ ಪ್ರೆಸ್",
  "equipment": "band",
  "primary": [
   "chest"
  ],
  "secondary": [
   "front_delts",
   "triceps"
  ],
  "stabilisers": [],
  "cues": [
   "Place the band behind your upper back as directed by its manufacturer.",
   "Use controlled movement without forcing the shoulders."
  ],
  "aliases": [
   "Standing band chest press"
  ]
 },
 {
  "id": "band_overhead",
  "name": "Band shoulder press",
  "name_kn": "ಬ್ಯಾಂಡ್ ಶೋಲ್ಡರ್ ಪ್ರೆಸ್",
  "equipment": "band",
  "primary": [
   "front_delts",
   "side_delts"
  ],
  "secondary": [
   "triceps",
   "upper_back",
   "serratus"
  ],
  "stabilisers": [
   "core"
  ],
  "cues": [
   "Stand securely on the band with a firm grip.",
   "Keep the trunk steady and use a comfortable overhead range."
  ],
  "aliases": [
   "Band shoulder press"
  ]
 },
 {
  "id": "band_curl",
  "name": "Band curl",
  "name_kn": "ಬ್ಯಾಂಡ್ ಕರ್‌ಲ್",
  "equipment": "band",
  "primary": [
   "biceps"
  ],
  "secondary": [
   "forearms"
  ],
  "stabilisers": [],
  "cues": [
   "Stand securely on the band.",
   "Keep elbows close and avoid swinging."
  ],
  "aliases": [
   "Band curl"
  ]
 },
 {
  "id": "squat",
  "name": "Bodyweight squat",
  "name_kn": "ಬಾಡಿವೇಟ್ ಸ್ಕ್ವಾಟ್",
  "equipment": "bodyweight",
  "primary": [
   "quads",
   "glutes"
  ],
  "secondary": [
   "adductors",
   "hamstrings"
  ],
  "stabilisers": [
   "core",
   "lower_back"
  ],
  "cues": [
   "Keep feet planted and use a comfortable stance.",
   "Control the descent; a wall can help with balance."
  ],
  "aliases": [
   "Bodyweight squat"
  ]
 },
 {
  "id": "pushup",
  "name": "Wall or knee push-up",
  "name_kn": "ಗೋಡೆ ಅಥವಾ ನೀ ಪುಷ್‌ಅಪ್",
  "equipment": "bodyweight",
  "primary": [
   "chest"
  ],
  "secondary": [
   "triceps",
   "front_delts",
   "serratus"
  ],
  "stabilisers": [
   "core"
  ],
  "cues": [
   "Choose the wall or knee version you can control.",
   "Keep the body steady and stop before form changes."
  ],
  "aliases": [
   "Wall or knee push-up"
  ]
 },
 {
  "id": "bridge",
  "name": "Glute bridge",
  "name_kn": "ಗ್ಲೂಟ್ ಬ್ರಿಡ್ಜ್",
  "equipment": "bodyweight",
  "primary": [
   "glutes"
  ],
  "secondary": [
   "hamstrings"
  ],
  "stabilisers": [
   "core"
  ],
  "cues": [
   "Lie on a clear floor with feet planted.",
   "Lift the hips without forcing the lower back."
  ],
  "aliases": [
   "Glute bridge"
  ]
 },
 {
  "id": "prone_w",
  "name": "Prone W raise",
  "name_kn": "ಪ್ರೋನ್ ಡಬ್ಲ್ಯೂ ರೈಸ್",
  "equipment": "bodyweight",
  "primary": [
   "upper_back",
   "rear_delts"
  ],
  "secondary": [
   "rotator_cuff"
  ],
  "stabilisers": [
   "lower_back"
  ],
  "cues": [
   "Lie face down and move arms into a comfortable W shape.",
   "Lift gently without straining the neck; this is light back work."
  ],
  "aliases": [
   "Prone W raise"
  ]
 },
 {
  "id": "split_squat",
  "name": "Supported split squat",
  "name_kn": "ಸಪೋರ್ಟೆಡ್ ಸ್ಪ್ಲಿಟ್ ಸ್ಕ್ವಾಟ್",
  "equipment": "bodyweight",
  "primary": [
   "quads",
   "glutes"
  ],
  "secondary": [
   "adductors",
   "hamstrings"
  ],
  "stabilisers": [
   "core"
  ],
  "cues": [
   "Use a wall for balance and keep both feet planted.",
   "Lower only as far as you can control comfortably."
  ],
  "aliases": [
   "Supported split squat"
  ]
 },
 {
  "id": "calf",
  "name": "Standing calf raise",
  "name_kn": "ಸ್ಟ್ಯಾಂಡಿಂಗ್ ಕಾಲ್ಫ್ ರೈಸ್",
  "equipment": "bodyweight",
  "primary": [
   "calves"
  ],
  "secondary": [],
  "stabilisers": [],
  "cues": [
   "Use a wall for balance.",
   "Rise and lower slowly on flat ground."
  ],
  "aliases": [
   "Standing calf raise"
  ]
 },
 {
  "id": "deadbug",
  "name": "Dead bug",
  "name_kn": "ಡೆಡ್ ಬಗ್",
  "equipment": "bodyweight",
  "primary": [
   "core",
   "obliques"
  ],
  "secondary": [
   "hip_flexors"
  ],
  "stabilisers": [],
  "cues": [
   "Move opposite arm and leg slowly.",
   "Keep the trunk steady and shorten the range when needed."
  ],
  "aliases": [
   "Dead bug"
  ]
 },
 {
  "id": "tbar_chest_supported",
  "name": "T Bar Chest Supported Row",
  "name_kn": "ಟಿ ಬಾರ್ ಚೆಸ್ಟ್ ಸಪೋರ್ಟೆಡ್ ರೋ",
  "equipment": "gym",
  "primary": [
   "lats",
   "upper_back"
  ],
  "secondary": [
   "biceps",
   "rear_delts"
  ],
  "stabilisers": [],
  "cues": [
   "Keep your chest supported on the pad and your feet stable.",
   "Pull with control; avoid lifting your chest or jerking the weight."
  ],
  "aliases": [
   "T Bar Chest Supported Row",
   "Chest Supported T Bar Row",
   "Chest Supported T-Bar Row"
  ]
 },
 {
  "id": "db_single_arm_row",
  "name": "Dumbbell Single Arm Row",
  "name_kn": "ಡಂಬೆಲ್ ಸಿಂಗಲ್ ಆರ್ಮ್ ರೋ",
  "equipment": "dumbbell",
  "primary": [
   "lats",
   "upper_back"
  ],
  "secondary": [
   "biceps",
   "rear_delts"
  ],
  "stabilisers": [
   "core",
   "lower_back"
  ],
  "cues": [
   "Hinge comfortably and keep the trunk steady.",
   "Pull toward the hip without twisting the torso."
  ],
  "aliases": [
   "Dumbbell Single Arm Row",
   "Single Arm Dumbbell Row",
   "One Arm Dumbbell Row"
  ]
 },
 {
  "id": "cable_vbar_row",
  "name": "Cable V Bar Seated Row",
  "name_kn": "ಕೇಬಲ್ ವಿ ಬಾರ್ ಸೀಟೆಡ್ ರೋ",
  "equipment": "gym",
  "primary": [
   "lats",
   "upper_back"
  ],
  "secondary": [
   "biceps",
   "rear_delts"
  ],
  "stabilisers": [
   "core"
  ],
  "cues": [
   "Sit tall and pull toward your lower ribs.",
   "Keep the torso steady; avoid jerking the weight."
  ],
  "aliases": [
   "Cable V Bar Seated Row",
   "Seated Cable V Bar Row",
   "V Bar Seated Cable Row",
   "Seated V Bar Cable Row"
  ]
 }
];
const normal=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
const modifiers=new Set(['not','no','low','high','new','old','one','two','alt','lat','row','gym','db','wide','close','single','double','band','cable','reverse','underhand','overhand','assisted','behind','neck','grip','standing','seated']);
function ocrNoise(parts){return parts.length<=2&&parts.every(p=>p.length<=3&&!modifiers.has(p));}
export function lookupCoaching(name,{ocr=false}={}){
 const key=normal(name);if(!key)return null;
 const exact=COACHING_PROFILES.filter(p=>p.aliases.some(a=>normal(a)===key));
 if(exact.length===1)return {profile:exact[0],match:'exact'};
 if(exact.length||!ocr)return null;
 const words=key.split(' '),matches=[];
 for(const profile of COACHING_PROFILES){
  for(const alias of profile.aliases){const target=normal(alias).split(' ');let found=false;
   for(let i=0;i<=words.length-target.length;i++)if(target.every((w,j)=>words[i+j]===w)&&ocrNoise(words.slice(0,i))&&ocrNoise(words.slice(i+target.length))){found=true;break;}
   if(found){matches.push(profile);break;}
  }
 }
 return matches.length===1?{profile:matches[0],match:'ocr-decoration'}:null;
}
const blank=v=>v==null||(typeof v==='string'&&!v.trim())||(Array.isArray(v)&&!v.length);
// Mutate only blank coaching fields. Numeric prescriptions, source flags, tempo,
// RIR, names and equipment are never overwritten. Suggested equipment needs an
// explicit button if a prior extraction supplied a different value.
export function autofillCoaching(exercise){
 const match=lookupCoaching(exercise?.name,{ocr:exercise?.ocr_rows_complete!==undefined});
 if(!match)return {matched:false,filled:[]};
 const {profile}=match,filled=[];
 for(const [key,value]of [['name_kn',profile.name_kn],['equipment',profile.equipment],['cues',profile.cues]])if(blank(exercise[key])){exercise[key]=structuredClone(value);filled.push(key);}
 const roles=['primary','secondary','stabilisers'];
 if(roles.every(k=>blank(exercise[k])))for(const k of roles){exercise[k]=[...profile[k]];if(profile[k].length)filled.push(k);}
 if(filled.length){
  exercise.coaching_autofill={...(exercise.coaching_autofill||{}),version:COACHING_VERSION,profileId:profile.id,matchedName:exercise.name,templateName:profile.name,fields:[...new Set([...(Array.isArray(exercise.coaching_autofill?.fields)?exercise.coaching_autofill.fields:[]),...filled])],match:match.match};
 }
 return {matched:true,profile,match:match.match,filled};
}
export function coachingMatchesCurrent(exercise){return Boolean(exercise.coaching_autofill&&exercise.coaching_autofill.profileId===lookupCoaching(exercise.name,{ocr:exercise.ocr_rows_complete!==undefined})?.profile.id);}
export function fillWorkoutCoaching(workout){let count=0;for(const day of workout?.days||[])for(const exercise of day.exercises||[])if(autofillCoaching(exercise).filled.length)count++;return count;}
export function clearCoachingAutofill(exercise){
 const meta=exercise.coaching_autofill,profile=COACHING_PROFILES.find(p=>p.id===meta?.profileId);
 if(profile)for(const key of Array.isArray(meta.fields)?meta.fields:[]){const value=key==='name_kn'?profile.name_kn:profile[key];if(JSON.stringify(exercise[key])===JSON.stringify(value))exercise[key]=Array.isArray(value)?[]:'';}
 delete exercise.coaching_autofill;
}
