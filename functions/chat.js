// functions/chat.js
export async function onRequestPost(context) {
  const apiKey = context.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API ключ не настроен" }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Получаем вопрос пользователя и его профиль кожи
    const { question, profile, summary } = await context.request.json();

    const SYSTEM_PROMPT = `Ты — профессиональный, заботливый AI-beauty консультант в приложении BeautyMe AI. Отвечай кратко (2-4 предложения), по делу, современным языком без сложного медицинского жаргона. Используй эмодзи для теплоты.

Контекст: Пользователь уже проходил анализ кожи.
Его профиль: ${profile || 'Не указан'}
Краткое резюме его кожи: ${summary || 'Не указано'}

Отвечай исходя из этого контекста. Если спрашивают про лекарственные препараты, рекомендуй обратиться к дерматологу.`;

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
        temperature: 0.7, // Чуть больше креативности для чата
        max_tokens: 250   // Ограничиваем длину, чтобы ответы были краткими
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
