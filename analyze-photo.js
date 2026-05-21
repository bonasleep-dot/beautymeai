export async function onRequestPost(context) {
  const apiKey = context.env.POLZA_AI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API ключ не настроен" }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { image_base64 } = await context.request.json();

    if (!image_base64) {
      throw new Error("Фото не загружено");
    }

    const SYSTEM_PROMPT = `Ты — профессиональный AI-beauty дерматолог. Твоя задача — проанализировать селфи пользователя и выдать результат в формате JSON.

ПРАВИЛА:
- Анализируй кожу заботливо, современно, без сложного медицинского жаргона. Аудитория 14-50 лет.
- Рекомендуй продукты только продающиеся в РФ (Золотое Яблоко, iHerb, аптеки, Ozon).
- Слово "рутина" НЕ ИСПОЛЬЗУЕМ. Используем только слово "уход".
- Если на фото плохое освещение или макияж, сделай предположения, но укажи, что фото могло исказить результат.

ФОРМАТ — строго валидный JSON, ничего кроме JSON:
{
  "skin_score": 65,
  "problems": ["Склонность к воспалениям", "Обезвоженность"],
  "good_sides": ["Хороший потенциал восстановления", "Ровный рельеф"],
  "profile_summary": "1-2 предложения о состоянии кожи на фото",
  "morning_routine": [
    {
      "step": 1,
      "step_name": "Очищение",
      "product_name": "Название",
      "brand": "Бренд",
      "price_rub": 890,
      "why": "Почему подходит (1-2 предложения заботливым тоном)",
      "key_ingredients": ["ингредиент1","ингредиент2"],
      "where_to_buy": "Золотое Яблоко / iHerb / аптека"
    }
  ],
  "evening_routine": [],
  "total_cost_rub": 3200,
  "pro_tip": "Один важный совет",
  "avoid": "Что категорически не использовать"
}`;

    const response = await fetch('https://polza.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Проанализируй мою кожу по этому селфи и подбери уход." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image_base64}` } }
            ]
          }
        ],
        temperature: 0.6,
        response_format: { type: "json_object" },
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Ошибка API`);
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return new Response(JSON.stringify({ result: cleanJson }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}