export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.GROQ_API_KEY; 
  if (!apiKey) return { 
    statusCode: 500, 
    body: JSON.stringify({ error: "GROQ API ключ не настроен на сервере" }) 
  };

  try {
    const { profile } = JSON.parse(event.body);
    
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
    
    return { 
      statusCode: 200, 
      body: JSON.stringify({ result: cleanJson }) 
    };
  } catch (error) {
    console.error(error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: "Ошибка AI: " + error.message }) 
    };
  }
};