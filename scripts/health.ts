/** Production HTTP smoke check across the public surface and health probe. */
export {};

const base = process.env.APP_URL ?? "https://vialform.vercel.app";
const paths = ["/api/health", "/", "/materials", "/quality", "/procurement", "/research-notes", "/company", "/contact", "/compare", "/login", "/signup"];

let failures = 0;
for (const path of paths) {
  const response = await fetch(base + path);
  const ok = response.status === 200;
  if (!ok) failures += 1;
  console.log(ok ? "ok  " : "FAIL", response.status, path);
}

const health = (await (await fetch(base + "/api/health")).json()) as { status?: string; db?: string; demo?: boolean; products?: number };
console.log("health:", JSON.stringify(health));
if (health.status !== "ok") failures += 1;

console.log(failures === 0 ? "SMOKE PASS" : `SMOKE FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);