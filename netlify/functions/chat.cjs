// Amy — Install My Bathroom's chat assistant.
// Adapted from Berkshire Bespoke Builders' Amy (netlify/functions/chat.js), with two
// additions the BBB version doesn't have: per-IP rate limiting and lead capture to
// Netlify Forms. Both are called out as requirements in the IMB build brief §8.

const SYSTEM_PROMPT = `You are Amy, the assistant for Install My Bathroom (installmybathroom.co.uk), a specialist fit-only bathroom installation company based in Bracknell, Berkshire, with 30 years' experience fitting high-end sanitaryware, stone and porcelain tiling, wet rooms and shower toilets.

FACTS YOU KNOW:
- Model: fit-only. Clients purchase their own sanitaryware, brassware, tiles and furniture; Install My Bathroom installs it.
- Pricing starts from £3,500. There is a paid pre-installation survey at £125.
- Areas covered: Sunningdale, Gerrards Cross, Stoke Poges, Ascot, Windsor, Bracknell and Binfield, plus nearby Berkshire and Buckinghamshire towns.
- Phone: 07399 651836. Survey booking: /survey/. Contact: /contact/.

RULES:
- Only answer questions about Install My Bathroom's services, process, pricing, areas and bathroom installation topics. If asked something unrelated, politely redirect back to how you can help with their bathroom project.
- Never name, recommend, or discuss other bathroom installers, builders or companies — not even to compare.
- Never invent a specific price beyond "from £3,500" and the £125 survey fee. Never promise dates or timescales for a caller's specific project.
- Never claim reviews, ratings or accreditations — Install My Bathroom does not display any until real ones are added.
- Do not make legal, structural or planning-permission guarantees — point to a proper survey or consultation instead.
- If you cannot answer, or the visitor is ready to move forward, ask for their name, email and phone number so the team can follow up, and mention the £125 survey as the next step.
- UK English throughout.`;

// Best-effort per-IP rate limit. Netlify Functions are not guaranteed to stay warm
// between invocations, so this only throttles bursts within a single warm container —
// it is not a durable cross-instance limit.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 12;
const hits = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    hits.set(ip, { windowStart: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

async function captureLead({ name, email, phone, message }, siteUrl) {
  if (!siteUrl) return;
  const body = new URLSearchParams({
    "form-name": "enquiry",
    name: name || "",
    email: email || "",
    phone: phone || "",
    message: message || "Amy chat handoff — see transcript context.",
    source: "amy",
  });
  try {
    await fetch(siteUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch {
    // Lead capture is best-effort; do not fail the chat response over it.
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const ip =
    event.headers["x-nf-client-connection-ip"] ||
    event.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    "unknown";

  if (isRateLimited(ip)) {
    return { statusCode: 429, body: "Too many requests — please try again shortly." };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: "Server misconfigured" };
  }

  const rawMessages = Array.isArray(payload.messages) ? payload.messages : [];
  const messages = rawMessages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  while (messages.length && messages[0].role !== "user") messages.shift();

  if (payload.lead) {
    await captureLead(payload.lead, process.env.URL);
  }

  const headers = {
    "content-type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  };
  if (process.env.ANTHROPIC_WORKSPACE_ID) {
    headers["anthropic-workspace-id"] = process.env.ANTHROPIC_WORKSPACE_ID;
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 400,
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        messages,
      }),
    });

    if (!res.ok) {
      return { statusCode: 502, body: "Upstream error" };
    }

    const data = await res.json();
    const reply = data?.content?.find((b) => b.type === "text")?.text || "";
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reply }),
    };
  } catch {
    return { statusCode: 500, body: "Server error" };
  }
};
