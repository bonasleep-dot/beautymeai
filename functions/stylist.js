export async function onRequestPost(context) {
  const apiKey = context.env.POLZA_AI_API_KEY;
  const kv = context.env.MAKEUP_LIMITS;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "API ключ не настроен"
      }),
      {
        status: 500,
        headers: {
          "Content-Type":
            "application/json"
        }
      }
    );
  }

  try {
    // Лимит 3 генерации в день
    const clientIp =
      context.request.headers.get(
        "CF-Connecting-IP"
      ) || "unknown";

    const today =
      new Date()
        .toISOString()
        .split("T")[0];

    const limitKey =
      `makeup:${clientIp}:${today}`;

    const usedCount =
      parseInt(
        (await kv.get(limitKey)) ||
          "0"
      );

    if (usedCount >= 3) {
      return new Response(
        JSON.stringify({
          error:
            "Лимит генераций на сегодня исчерпан 💄 Попробуйте завтра",
          limitReached: true
        }),
        {
          status: 429,
          headers: {
            "Content-Type":
              "application/json"
          }
        }
      );
    }

    const {
      image_base64,
      outfit_text
    } =
      await context.request.json();

    if (
      !image_base64 ||
      !outfit_text
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Нет фото или описания"
        }),
        {
          status: 400,
          headers: {
            "Content-Type":
              "application/json"
          }
        }
      );
    }

    const prompt = `
Нанеси ТОЛЬКО фотореалистичный макияж на лицо человека на исходном фото.

СТРОГО СОХРАНИТЬ БЕЗ ИЗМЕНЕНИЙ:
- лицо человека
- черты лица
- форма лица
- возраст
- кожа
- цвет кожи
- глаза
- цвет глаз
- губы
- нос
- брови
- волосы
- прическа
- длина волос
- цвет волос
- одежда
- аксессуары
- поза
- фон
- освещение
- ракурс
- выражение лица

НЕЛЬЗЯ:
- менять возраст
- омолаживать
- состаривать
- менять черты лица
- делать другое лицо
- менять прическу
- менять одежду
- менять фон
- менять тело
- менять форму лица

МОЖНО ИЗМЕНИТЬ ТОЛЬКО:
- макияж глаз
- тени
- тушь
- подводку
- румяна
- тон кожи (только как макияж)
- губы (только помада)
- легкий контуринг

Стиль макияжа:
"${outfit_text}"

Результат должен выглядеть как то же самое фото, но с аккуратно нанесенным макияжем.
`.trim();

    const response =
      await fetch(
        "https://polza.ai/api/v1/media",
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${apiKey}`,
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            model:
              "google/gemini-3.1-flash-image-preview",

            async: true,

            input: {
              prompt,
              image_resolution:
                "1K",
              output_format:
                "jpeg",
              images: [
                {
                  type: "url",
                  data: `data:image/jpeg;base64,${image_base64}`
                }
              ]
            }
          })
        }
      );

    const data =
      await response.json();

    console.log(
      "POLZA CREATE:",
      JSON.stringify(
        data,
        null,
        2
      )
    );

    if (!response.ok) {
      throw new Error(
        data.error?.message ||
          "Ошибка запуска генерации"
      );
    }

    // увеличиваем счетчик
    await kv.put(
      limitKey,
      String(
        usedCount + 1
      ),
      {
        expirationTtl:
          60 * 60 * 24
      }
    );

    return new Response(
      JSON.stringify({
        taskId: data.id,
        remaining:
          2 - usedCount,
        raw: data
      }),
      {
        headers: {
          "Content-Type":
            "application/json"
        }
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: e.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type":
            "application/json"
        }
      }
    );
  }
}
