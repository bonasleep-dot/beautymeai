export async function onRequestPost(context) {
  const apiKey = context.env.POLZA_AI_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: "API ключ не настроен" }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  try {
    const { image_base64, outfit_text } = await context.request.json();
    if (!image_base64 || !outfit_text) {
      return new Response(JSON.stringify({ error: 'Нет фото или описания' }), { status: 400 });
    }

    const response = await fetch('https://polza.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-3.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Ты профессиональный beauty-стилист. Отвечай ИСКЛЮЧИТЕЛЬНО на русском языке. Запрещено использовать китайские иероглифы, англицизмы или любые другие языки. Пиши только кириллицей.'
          },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image_base64}` } },
              { type: 'text', text: `На фото лицо девушки. Она собирается: "${outfit_text}". Опираясь на черты её лица и цветотип, дай краткие пошаговые рекомендации по макияжу: какой тон, акценты на глазах или губах, текстуры. Формат: 1. Тон, 2. Глаза, 3. Губы, 4. Главный акцент. Пиши дружелюбно с эмодзи.` }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      const errMsg = data.error?.message || 'Неизвестная ошибка API';
      throw new Error(errMsg);
    }

    return new Response(JSON.stringify({ reply: data.choices[0].message.content }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}