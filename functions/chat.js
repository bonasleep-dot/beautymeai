// functions/chat.js
export async function onRequestPost(context) {
  const apiKey = context.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API ключ не настроен" }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { question, profile, summary, routine_context, full_context } = await context.request.json();

    const SYSTEM_PROMPT = `Ты — профессиональный, заботливый AI-beauty консультант в приложении BeautyMe AI. Отвечай кратко (1-3 предложения), по делу, современным языком. Используй эмодзи.

Контекст: Пользователь уже проходил анализ кожи.
Его профиль: ${profile || 'Не указан'}
Краткое резюме его кожи: ${summary || 'Не указано'}
Его текущий план ухода: ${routine_context || 'Не указан'}
Полные результаты его анализа (JSON): ${full_context || 'Нет данных'}

Опирайся на полные результаты анализа. Ты знаешь его Skin Score, проблемы, хорошие стороны, что ему нельзя использовать (avoid) и его Pro Tip. Будь конкретным. Если просят проверить состав, оцени его с точки зрения профиля кожи пользователя.`;

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
          { role: "user", content: question }
        ],
        temperature: 0.7,
        max_tokens: 250
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Ошибка API Groq`);
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "Извините, я не смогла сформировать ответ.";

    return new Response(JSON.stringify({ reply }), {
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