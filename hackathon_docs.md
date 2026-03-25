
# StreetGuard AI - Hackathon Prototype Guide

## 🚀 1-Click Deploy to Netlify
1. Connect your GitHub repository.
2. Set Environment Variables:
   - `API_KEY`: Your Google Gemini API Key.
   - `SUPABASE_URL`: (Optional) Your Supabase project URL.
   - `SUPABASE_ANON_KEY`: (Optional) Your Supabase public key.

## 🛠 Supabase Setup (Optional Persistence)
Execute this SQL in your Supabase SQL Editor:
```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lat FLOAT8,
  lng FLOAT8,
  animal TEXT,
  behavior TEXT,
  threat TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  residents_notified INT,
  confidence FLOAT8
);

-- Enable RLS
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow Public Access" ON alerts FOR ALL USING (true);
```

## 🎬 Demo Script
1. **Intro**: "StreetGuard AI protects communities from dangerous street animal encounters using AI CCTV analysis."
2. **Detection**: Point to the live feed. Wait for the "Demo Mode" to trigger a detection box. Note the red glow and confidence score.
3. **Alert**: Show the browser notification popup and play the alert beep. Explain how residents get these instant notifications.
4. **Dashboard**: Show the map update with a new red pin and the safety log table populating.
5. **SOS**: Hit the red SOS button to demonstrate immediate community-wide broadcast simulation.

## 📸 Portfolio Prompts
- "A futuristic glassmorphism safety dashboard for street animal detection, dark mode, high contrast red accents."
- "CCTV feed with AI bounding boxes detecting an aggressive dog, cyberpunk UI style, mobile responsive."
