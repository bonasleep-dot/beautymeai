// functions/weekly-checkin.js
export async function onRequestPost(context) {
  const apiKey = context.env.GROQ_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: "API ключ не настроен" }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  try {
    const { image_base64, previous_result } = await context.request.json();

    const SYSTEM_PROMPT = `Ты — профессиональный AI-дерматолог. Твоя задача — сравнить новое селфи пользователя с его предыдущим анализом кожи и дать обратную связь.
ПРАВИЛА:
- Сравни визуально: стали ли поры меньше, ушло ли покраснение, выровнялся ли тон.
- Будь заботливым и ободряющим. Даже маленькие изменения — это победа.
- Отвечай кратко (2-3 предложения).
- НЕ ставь точные цифры (например, "поры уменьшились на 15%"), пиши субъективно ("поры выглядят чище", "покраснение стало менее заметным").
Предыдущий анализ кожи пользователя: ${previous_result || 'Нет данных'}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: [
            { type: "text", text: "Вот мое новое фото. Сравни мою кожу сейчас с прошлым анализом. Стало лучше или хуже? Что изменилось?" },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image_base64}` } }
          ]}
        ],
        temperature: 0.5,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Ошибка API`);
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "Не удалось сравнить.";

    return new Response(JSON.stringify({ reply }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}