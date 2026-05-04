export type AuthUser = {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Workspace = {
  id: string;
  account_id: string;
  name: string;
  slug: string;
  role: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ApiEnvelope<T> = {
  message: string;
  data: T;
};

type CollectionEnvelope<T> = {
  data: T[];
  meta?: Record<string, unknown>;
};

type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
  code?: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

type CreateWorkspacePayload = {
  name: string;
  slug: string;
};

const DEFAULT_API_BASE = "https://api.nexoraxs.com";

export class ApiClientError extends Error {
  status: number;
  errors: Record<string, string[]>;
  code?: string;

  constructor(
    message: string,
    status: number,
    errors: Record<string, string[]> = {},
    code?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.errors = errors;
    this.code = code;
  }
}

export { ApiClientError as AuthApiError };

function apiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_BASE ?? DEFAULT_API_BASE).replace(
    /\/$/,
    "",
  );
}

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${name}=`;
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix));

  return cookie ? cookie.slice(prefix.length) : null;
}

function readXsrfToken() {
  const rawValue = readCookie("XSRF-TOKEN");
  return rawValue ? decodeURIComponent(rawValue) : null;
}

async function ensureCsrfCookie() {
  const response = await fetch(`${apiBaseUrl()}/sanctum/csrf-cookie`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new ApiClientError(
      "Unable to initialize the CSRF cookie from the Auth API.",
      response.status,
    );
  }
}

async function parseResponse<T>(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as T | ApiErrorPayload)
    : null;

  if (!response.ok) {
    const errorPayload = (payload ?? {}) as ApiErrorPayload;

    throw new ApiClientError(
      errorPayload.message ?? "Auth API request failed.",
      response.status,
      errorPayload.errors ?? {},
      errorPayload.code,
    );
  }

  return payload as T;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  options: { requireCsrf?: boolean } = {},
) {
  if (options.requireCsrf) {
    await ensureCsrfCookie();
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.requireCsrf) {
    headers.set("X-Requested-With", "XMLHttpRequest");

    const xsrfToken = readXsrfToken();

    if (!xsrfToken) {
      throw new ApiClientError(
        "Missing XSRF-TOKEN cookie after CSRF initialization.",
        419,
      );
    }

    headers.set("X-XSRF-TOKEN", xsrfToken);
  }

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  return parseResponse<T>(response);
}

export function register(payload: RegisterPayload) {
  return request<ApiEnvelope<{ user: AuthUser }>>(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { requireCsrf: true },
  );
}

export function login(payload: LoginPayload) {
  return request<ApiEnvelope<{ user: AuthUser }>>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { requireCsrf: true },
  );
}

export function logout() {
  return request<ApiEnvelope<{ logged_out: boolean }>>(
    "/api/auth/logout",
    {
      method: "POST",
    },
    { requireCsrf: true },
  );
}

export function getCurrentUser() {
  return request<ApiEnvelope<{ user: AuthUser }>>("/api/auth/me", {
    method: "GET",
  });
}

export function getWorkspaces() {
  return request<CollectionEnvelope<Workspace>>("/api/workspaces", {
    method: "GET",
  });
}

export function createWorkspace(payload: CreateWorkspacePayload) {
  return request<ApiEnvelope<{ workspace: Workspace }>>(
    "/api/workspaces",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { requireCsrf: true },
  );
}

export function getWorkspaceBySlug(slug: string) {
  return request<ApiEnvelope<{ workspace: Workspace }>>(
    `/api/workspaces/${encodeURIComponent(slug)}`,
    {
      method: "GET",
    },
  );
}
