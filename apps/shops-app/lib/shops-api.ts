export type Workspace = {
  id: string;
  account_id: string;
  name: string;
  slug: string;
  role: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ShopsMode =
  | "business_management"
  | "online_store"
  | "both";

type ApiEnvelope<T> = {
  message: string;
  data: T;
};

type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
  code?: string;
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
      "Unable to initialize the CSRF cookie from the Shops API foundation.",
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
      errorPayload.message ?? "Shops API request failed.",
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

export function getShopsContext(workspaceSlug: string) {
  return request<
    ApiEnvelope<{
      workspace: Workspace;
      product: string;
      subscription: {
        status: string;
        plan_code: string | null;
        starts_at: string | null;
        ends_at: string | null;
        has_access: boolean;
      };
      current_user_role: string;
      shops_mode: ShopsMode | null;
      onboarding_required: boolean;
    }>
  >(`/api/workspaces/${encodeURIComponent(workspaceSlug)}/shops/context`, {
    method: "GET",
  });
}

export function storeShopsMode(workspaceSlug: string, mode: ShopsMode) {
  return request<
    ApiEnvelope<{
      workspace: Workspace;
      product: string;
      subscription: {
        status: string;
        plan_code: string | null;
        starts_at: string | null;
        ends_at: string | null;
        has_access: boolean;
      };
      current_user_role: string;
      shops_mode: ShopsMode;
      onboarding_required: boolean;
    }>
  >(
    `/api/workspaces/${encodeURIComponent(workspaceSlug)}/shops/mode`,
    {
      method: "POST",
      body: JSON.stringify({ mode }),
    },
    { requireCsrf: true },
  );
}
