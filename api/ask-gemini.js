// 이 파일은 Netlify/Vercel 서버에서만 실행됩니다.
export default async function handler(request, response) {
  // POST 요청만 허용합니다.
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  // 프론트엔드에서 보낸 질문(prompt)을 받습니다.
  const { prompt } = request.body;
  if (!prompt) {
    return response.status(400).json({ error: '질문(prompt)이 필요합니다.' });
  }

  // Netlify/Vercel 서버에 안전하게 저장된 API 키를 불러옵니다.
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return response.status(500).json({ error: '서버에 API 키가 설정되지 않았습니다.' });
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;

  try {
    // Google Gemini API로 요청을 보냅니다.
    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      }),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error('Gemini API Error:', errorBody);
      throw new Error(`Google API 요청 실패: ${geminiResponse.status}`);
    }

    const result = await geminiResponse.json();
    // 받은 응답을 다시 프론트엔드로 전달합니다.
    return response.status(200).json(result);

  } catch (error) {
    console.error('Internal Server Error:', error);
    return response.status(500).json({ error: error.message });
  }
}


