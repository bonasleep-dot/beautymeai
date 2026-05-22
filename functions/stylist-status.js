export async function onRequestGet(context) {
  const apiKey = context.env.POLZA_AI_API_KEY;

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
    const url = new URL(context.request.url);

    const taskId =
      url.searchParams.get("task_id");

    if (!taskId) {
      return new Response(
        JSON.stringify({
          error: "Нет task_id"
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

    const response = await fetch(
      `https://polza.ai/api/v1/media/${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    );

    const data = await response.json();

    console.log(
      "POLZA STATUS:",
      JSON.stringify(data, null, 2)
    );

    const status =
      data.status?.toLowerCase();

    // Генерация завершена
    if (
      [
        "completed",
        "done",
        "success",
        "finished",
        "ready"
      ].includes(status)
    ) {
      const imageUrl =
        data.data?.[0]?.url ||
        data.output?.url ||
        data.result?.url ||
        data.images?.[0]?.url ||
        data.outputs?.[0]?.url ||
        data.url ||
        null;

      return new Response(
        JSON.stringify({
          status: "completed",
          image: imageUrl,
          raw: data
        }),
        {
          headers: {
            "Content-Type":
              "application/json"
          }
        }
      );
    }

    // Ошибка генерации
    if (
      status === "failed" ||
      status === "error"
    ) {
      throw new Error(
        data.error?.message ||
          "Ошибка генерации"
      );
    }

    // Всё ещё генерируется
    return new Response(
      JSON.stringify({
        status: "processing",
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
