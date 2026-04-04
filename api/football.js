export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const FD_KEY = "cf8d3f6b2fb540d0ba5abcdfd3ee76ce";
  const { path, ...rest } = req.query;

  if (!path) return res.status(400).json({ error: "Missing path parameter" });

  const queryString = Object.entries(rest)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

  const fullUrl = `https://api.football-data.org/v4/${path}${queryString ? "?" + queryString : ""}`;

  try {
    const response = await fetch(fullUrl, {
      headers: { "X-Auth-Token": FD_KEY }
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch", details: error.message });
  }
}
