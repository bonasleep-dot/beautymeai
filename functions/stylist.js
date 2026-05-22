export async function onRequestPost(context) {
  const apiKey = context.env.POLZA_AI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "API ключ не настроен"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  try {
    const { image_base64, outfit_text } =
      await context.request.json();

    if (!image_base64 || !outfit_text) {
      return new Response(
        JSON.stringify({
          error: "Нет фото или описания"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const response = await fetch(
      "https://polza.ai/api/v1/media",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model:
            "google/gemini-3.1-flash-image-preview",

          // обязательно для polling
          async: true,

          input: {
            prompt: `Нанеси фотореалистичный макияж на это лицо. Образ: "${outfit_text}". Сохрани естественные черты лица, цвет глаз и прическу. Макияж должен гармонировать с одеждой. Верни измененное фото.`,

            image_resolution: "1K",
            output_format: "jpeg",

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

    const data = await response.json();

    console.log(
      "POLZA CREATE:",
      JSON.stringify(data, null, 2)
    );

    if (!response.ok) {
      throw new Error(
        data.error?.message ||
          "Ошибка запуска генерации"
      );
    }

    return new Response(
      JSON.stringify({
        taskId: data.id,
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
