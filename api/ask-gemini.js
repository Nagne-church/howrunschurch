// 이 파일은 Netlify Edge Function 환경에서 실행됩니다.
export default async function handler(request) {
  // 1. HTTP 메소드가 POST인지 확인
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 2. API 키가 서버에 설정되어 있는지 확인
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: '서버에 API 키가 설정되지 않았습니다.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 3. 요청 본문을 파싱하고 prompt가 있는지 확인 (핵심 수정 ①)
    const { prompt } = await request.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: '질문(prompt)이 필요합니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Google Gemini API 요청 주소
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // 4. Google API로 요청 전송
    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      }),
    });

    // 5. Google API 응답 에러 처리
    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error('Gemini API Error:', errorBody);
      throw new Error(`Google API 요청 실패: ${geminiResponse.status}`);
    }

    // 6. 성공 응답을 파싱하여 프론트엔드로 전달 (핵심 수정 ②)
    const result = await geminiResponse.json();
    
    // 프론트엔드에서 사용하기 쉽도록 필요한 부분만 추출하여 새로운 객체로 만듭니다.
    const responseToFrontend = {
        candidates: [{
            content: {
                parts: [{ text: result.candidates[0].content.parts[0].text }]
            }
        }]
    };

    return new Response(JSON.stringify(responseToFrontend), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Internal Server Error:', error);
    // 7. 서버 내부 에러 처리
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
