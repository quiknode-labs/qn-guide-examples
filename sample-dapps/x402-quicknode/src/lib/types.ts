export type MethodProtocol = "JSON-RPC" | "REST";

export type Method = {
  id: string;
  name: string;
  description: string;
  protocol: MethodProtocol;
  network: string;
  networkDisplay: string;
  rpcMethod?: string;
  rpcParams?: unknown[];
  restPath?: string;
  restMethod?: "GET" | "POST";
};

export type AuthResponse = {
  token: string;
  accountId: string;
  expiresAt: string;
};

export type CreditsResponse = {
  accountId: string;
  credits: number;
};

export type DripResponse = {
  accountId: string;
  walletAddress: string;
  transactionHash: string;
};

export type X402AuthState = {
  jwt: string | null;
  accountId: string | null;
  jwtExpiresAt: Date | null;
  isAuthenticating: boolean;
  isAuthenticated: boolean;
};

export type MethodExecutionResult = {
  id: string;
  methodId: string;
  methodName: string;
  network: string;
  networkDisplay: string;
  protocol: MethodProtocol;
  status: number;
  ok: boolean;
  requestedAt: string;
  data: unknown;
  error?: string;
  paymentResponse?: unknown;
};
