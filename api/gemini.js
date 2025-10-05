// In api/gemini.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const { imageDataBase64, weatherData } = req.body;

  if (!imageDataBase64 || !weatherData) {
      return res.status(400).json({ error: 'Missing image or weather data' });
  }
    
  // This is our new, more intelligent prompt
  const prompt = `
    You are a hyperlocal weather prediction expert. Your task is to analyze an image of the sky and combine it with real-time weather data to provide a forecast.

    **Instructions:**
    1.  **Analyze the Sky:** Examine the provided image. Ignore any obstructions like buildings, trees, or power lines at the bottom or sides. Your focus is SOLELY on the visible portion of the sky, the types of clouds, their color, and the quality of the light.
    2.  **Fuse with Data:** Consider the following real-time weather data for the current location (Koovappally, Kerala, India):
        * Temperature: ${weatherData.temperature}°C
        * Humidity: ${weatherData.humidity}%
        * Cloud Cover: ${weatherData.cloudCover}%
    3.  **Provide a JSON Output:** Based on both the visual evidence and the weather data, generate a forecast. Your response MUST be ONLY a valid JSON object in the following format. Do not include any other text or markdown formatting.

    **JSON Format:**
    {
      "prediction_text": "A short, user-friendly forecast of 2-3 sentences about the likelihood of rain in the next 1-2 hours.",
      "rain_probability_percent": A number between 0 and 100 representing the chance of rain,
      "cloud_coverage_percent": A number between 0 and 100 representing the cloudiness you see in the image,
      "confidence_score_percent": A number between 0 and 100 indicating your confidence in this forecast.
    }
  `;

  const requestBody = {
    "contents": [{
      "parts": [
        { "text": prompt },
        {
          "inline_data": {
            "mime_type": "image/jpeg",
            "data": imageDataBase64
          }
        }
      ]
    }],
    "generationConfig": {
        "responseMimeType": "application/json", // We explicitly ask for a JSON response
    }
  };
  
  const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`;

  try {
    const googleResponse = await fetch(googleApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await googleResponse.json();

    if (!googleResponse.ok) {
      console.error('Google API Error:', data);
      return res.status(googleResponse.status).json({ error: 'Error from Google API', details: data });
    }
    
    // The Gemini response is now a JSON text string, so we parse it before sending
    const parsedGeminiResponse = JSON.parse(data.candidates[0].content.parts[0].text);
    res.status(200).json(parsedGeminiResponse);

  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
