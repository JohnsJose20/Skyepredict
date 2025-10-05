// In api/gemini.js

export default async function handler(req, res) {
  // 1. We only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // 2. Get the API Key securely from Vercel's Environment Variables
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'API key not configured' });
    return;
  }

  // 3. Forward the request from our website to the real Gemini API
  const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`;

  try {
    const googleResponse = await fetch(googleApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // The body is the JSON data our frontend sends
      body: JSON.stringify(req.body),
    });

    const data = await googleResponse.json();

    // 4. Check for errors from the Google API
    if (!googleResponse.ok) {
        console.error('Google API Error:', data);
        res.status(googleResponse.status).json({ error: 'Error from Google API', details: data });
        return;
    }

    // 5. Send the successful response back to our website
    res.status(200).json(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
