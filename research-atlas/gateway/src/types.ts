export type GatewayEnv = {
  ALLOWED_ORIGIN: string;
  OPERATOR_EMAIL?: string;
};

export type UpstreamRoute = { upstream: URL } | { error: string; status: number };
