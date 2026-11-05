import 'server-only';

// One fast, low-cost, vision-capable model through the Vercel AI Gateway
// (plain "provider/model" string; auth = Vercel OIDC on deployments and after
// `vercel env pull` locally). Chosen from the live /v1/models list: vision +
// structured output, zero-data-retention and no-training on every endpoint.
// Override with ROAM_AI_MODEL if it is ever retired.
export const AI_MODEL = process.env.ROAM_AI_MODEL || 'anthropic/claude-haiku-5.5';

// Sent with every request: only route to providers with zero data retention.
// No user id, name or needs are ever sent.
export const GATEWAY_OPTIONS = {
  gateway: { zeroDataRetention: true },
};
