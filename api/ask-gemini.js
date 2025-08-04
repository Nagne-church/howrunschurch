// 이 파일은 Netlify 서버에서만 실행됩니다.
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = request.body;
  if (!prompt) {
    return response.status(400).json({ error: '질문(prompt)이 필요합니다.' });
  }

  // Vercel이 아닌 Netlify 환경 변수를 사용합니다.
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return response.status(500).json({ error: '서버에 API 키가 설정되지 않았습니다.' });
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  try {
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
    return response.status(200).json(result);

  } catch (error) {
    console.error('Internal Server Error:', error);
    return response.status(500).json({ error: error.message });
  }
}