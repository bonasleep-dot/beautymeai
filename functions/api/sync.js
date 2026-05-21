export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const phone = url.searchParams.get('phone');
    if (!phone) return new Response(JSON.stringify({ error: 'Нет номера' }), { status: 400 });

    const data = await context.env.BEAUTYME_KV.get(`user_${phone}`);
    return new Response(data || '{}', { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function onRequestPost(context) {
  try {
    const { phone, data } = await context.request.json();
    if (!phone || !data) return new Response(JSON.stringify({ error: 'Нет данных' }), { status: 400 });

    await context.env.BEAUTYME_KV.put(`user_${phone}`, JSON.stringify(data));
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
