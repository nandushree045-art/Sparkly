// This runs on Vercel's server, never in the browser — so your API key stays hidden.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { system, messages, max_tokens } = req.body;

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: max_tokens || 1000,
        system,
        messages,
      }),
    });

    const data = await anthropicRes.json();
       console.error("Anthropic error:", JSON.stringify(data));

    if (!anthropicRes.ok) {
      return res.status(anthropicRes.status).json({ error: data });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
