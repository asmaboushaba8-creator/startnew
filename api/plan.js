export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { age, goal, problem, details } = await req.json();

  const systemPrompt = `You are a personal coach. Respond ONLY with a valid JSON object. No markdown, no explanation. Use short Arabic sentences only. Never use quotes or apostrophes inside JSON values.`;

  const userPrompt = `Personalized plan for age ${age}, goal: ${goal}, biggest challenge: ${problem}.${
    details ? " Details: " + details.replace(/['"]/g, " ") : ""
  }

Return ONLY this exact JSON, nothing else:
{"day1_title":"title","day1_task1":"task","day1_task2":"task","day1_task3":"task","week1_hours":"hours per day","week1_focus":"30min focus task","week2":"week 2 plan","week3":"week 3 plan","week4":"week 4 and evaluation","forbidden":"one thing to avoid","tip":"consistency tip"}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  const data = await response.json();
  const raw = (data.content || []).map((b) => b.text || "").join("");
  const match = raw.match(/\{[\s\S]\}/);
  if (!match)
    return new Response(JSON.stringify({ error: "فشل التوليد" }), {
      status: 500,
    });

  let str = match[0].replace(/[\x00-\x1F\x7F]/g, " ");
  try {
    JSON.parse(str);
  } catch {
    str = str.replace(/,\s([}\]])/g, "$1");
  }

  return new Response(str, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = { path: "/api/plan" };
