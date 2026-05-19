// functions/generate.js
export async function onRequestPost(context) {
  // В Cloudflare переменные окружения лежат в context.env
  const apiKey = context.env.GROQ_API_KEY; 
  if (!apiKey) { 
    return new Response(JSON.stringify({ error: "GROQ API ключ не настроен на сервере" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // В Cloudflare тело запроса — это стандартный Request, читаем через .json()
    const { profile } = await context.request.json();
    
    const SYSTEM_PROMPT = `Ты — профессиональный AI-beauty консультант. Твоя задача — проанализировать профиль кожи пользователя и выдать результат в формате JSON.

ПРАВИЛА:
- Анализируй кожу заботливо, современно, без сложного медицинского жаргона. Аудитория 14-50 лет.
- Учитывай аллергии и бюджет (продукты только продающиеся в РФ: Золотое Яблоко, iHerb, аптеки, Ozon).
- Количество шагов ухода = выбор пользователя.
- Слово "рутина" НЕ ИСПОЛЬЗУЕМ. Используем только слово "уход".

ФОРМАТ — строго валидный JSON, ничего кроме JSON:
{
  "skin_score": 65,
  "problems": ["Склонность к воспалениям", "Обезвоженность"],
  "good_sides": ["Хороший потенциал восстановления", "Ровный рельеф"],
  "profile_summary": "1-2 предложения о состоянии кожи",
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

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Подбери уход для профиля:\n\n${profile}` }
        ],
        temperature: 0.6,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Ошибка API Groq: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content || '';
    
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Возвращаем стандартный Response
    return new Response(JSON.stringify({ result: cleanJson }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Ошибка AI: " + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
