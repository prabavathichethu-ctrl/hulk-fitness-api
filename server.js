require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");

const app = express();
// Frontend inda request receive madoke permissions
app.use(cors());
// Dodda image data (Base64) accept madoke limit increase madidivi
app.use(express.json({ limit: '50mb' })); 

// 1. Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. NVIDIA AI Setup
const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

// API Endpoint (Frontend inda image receive mado jaaga)
app.post("/api/extract-workout", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Image data miss aagide bro!" });
    }

    console.log("⏳ 1. API ge image banthu, NVIDIA AI ge kalsutha idivi...");
    
    const response = await openai.chat.completions.create({
      model: "meta/llama-3.2-11b-vision-instruct",
      messages: [
        {
          role: "system",
          content: "You are a strict data extractor. Output ONLY a valid JSON object. CRITICAL RULE: Any time, duration, or mixed values MUST be enclosed in double quotes. Do not add any conversational text."
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

    console.log("✅ 2. AI inda JSON output perfect aagide!");
    console.log("🚀 3. Supabase Database ge push madtha ide...");

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

    if (error) {
      console.log("🔄 Table rules strict ide, Row 1 ge update madtha ide...");
      const updateResult = await supabase
        .from('workouts')
        .update({ workout_json: workoutData })
        .eq('id', 1)
        .select();
      data = updateResult.data;
      error = updateResult.error;
    }

    if (error) throw error;

    console.log("💥 BOOM! 100% Success! Database ge save aaythu.");
    
    // Frontend ge success message kalsodu
    res.json({ success: true, message: "Workout successfully extracted and saved!", data: data });

  } catch (err) {
    console.error("❌ API Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Server Start madoke port set madidivi
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}...`);
});