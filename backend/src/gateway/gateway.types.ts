import { Request } from 'express';

export interface ApiKeyUserContext {
  apiKeyId: number;
  userId: number;
  projectId: number;
  rateLimit: number;
}

export type ApiGatewayRequest = Request & {
  apiKeyUser?: ApiKeyUserContext;
};

export type AuthenticatedApiGatewayRequest = Request & {
  apiKeyUser: ApiKeyUserContext;
};
