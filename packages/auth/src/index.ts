import {
  type ApiClientConfig,
  ApiClientError,
  type ApiResponseEnvelope,
  createApiClient,
} from "@nexoraxs/api-client";

export { ApiClientError };

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export function createAuthClient(config: ApiClientConfig = {}) {
  const apiClient = createApiClient(config);

  return {
    register(payload: RegisterPayload) {
      return apiClient.request<ApiResponseEnvelope<{ user: AuthUser }>>(
        "/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        { requireCsrf: true },
      );
    },

    login(payload: LoginPayload) {
      return apiClient.request<ApiResponseEnvelope<{ user: AuthUser }>>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        { requireCsrf: true },
      );
    },

    logout() {
      return apiClient.request<ApiResponseEnvelope<{ logged_out: boolean }>>(
        "/api/auth/logout",
        {
          method: "POST",
        },
        { requireCsrf: true },
      );
    },

    getCurrentUser() {
      return apiClient.request<ApiResponseEnvelope<{ user: AuthUser }>>(
        "/api/auth/me",
        {
          method: "GET",
        },
      );
    },
  };
}

export type AuthClient = ReturnType<typeof createAuthClient>;
