const OPENAI_APPS_CHALLENGE_PATH = "/.well-known/openai-apps-challenge";

export function openAiAppsChallengeResponse(request, env) {
  const url = new URL(request.url);
  if (request.method !== "GET" || url.pathname !== OPENAI_APPS_CHALLENGE_PATH) return null;

  const token = env.OPENAI_APPS_CHALLENGE;
  if (!token) throw new Error("OPENAI_APPS_CHALLENGE is required");

  return new Response(token, {
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
