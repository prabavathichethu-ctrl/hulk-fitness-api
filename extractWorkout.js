require("dotenv").config();
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");

// 1. Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. NVIDIA AI Setup
const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

function mimeTypeForPath(imagePath) {
  const ext = path.extname(imagePath).slice(1).toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/jpeg";
}

async function processWorkoutAndSave(imagePath) {
  try {
    console.log("⏳ 1. Image na odhtha ide...");
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString("base64");
    const mimeType = mimeTypeForPath(imagePath);

    console.log("🤖 2. NVIDIA AI ge image kalsutha ide (swalpa wait madi)...");
    const response = await openai.chat.completions.create({
      model: "meta/llama-3.2-11b-vision-instruct",
      messages: [
        {
          role: "system",
          content: "You are a strict data extractor. Output ONLY a valid JSON object. CRITICAL RULE: Any time, duration, or mixed values (like 1:00 or 10kg) MUST be enclosed in double quotes as strings (e.g., \"1:00\"). All keys and string values must use double quotes. Do not add any conversational text."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract structured workout data from this image. Output exactly as valid JSON." },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
          ]
        }
      ],
      max_tokens: 1024,
      temperature: 0.1
    });

    let rawText = response.choices[0].message.content;
    
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("AI response nalli JSON brackets {} sikkilla.");
    }

    let jsonString = rawText.substring(firstBrace, lastBrace + 1);
    const workoutData = JSON.parse(jsonString);

    console.log("✅ 3. AI inda JSON output perfect aagide!");
    console.log("🚀 4. Supabase Database ge push madtha ide...");

    // First try: day_no: 1 (Valid day number) jothe hosa row insert madodu
    let { data, error } = await supabase
      .from('workouts')
      .insert([
        { 
          goal: "AI Workout " + Math.floor(Math.random() * 1000), 
          day_no: 1, 
          title: "AI Extracted Workout",
          exercises: [],
          workout_json: workoutData
        } 
      ])
      .select();

    // Ondu vele table rule hosa row ge oppilla andre, direct Row 1 ge save maduthe!
    if (error) {
      console.log("🔄 Table rules strict ide, so Row 1 (id: 1) ge data update madtha ide...");
      const updateResult = await supabase
        .from('workouts')
        .update({ workout_json: workoutData })
        .eq('id', 1)
        .select();
        
      data = updateResult.data;
      error = updateResult.error;
    }

    if (error) {
      console.error("❌ Supabase Error bandide:", error.message);
    } else {
      console.log("💥 BOOM! 100% Success! Data Supabase nalli save aaythu:", data);
    }

  } catch (err) {
    console.error("❌ Error aagide bro!", err.message);
  }
}

// Code shuru madoke!
processWorkoutAndSave("./test.jpg");