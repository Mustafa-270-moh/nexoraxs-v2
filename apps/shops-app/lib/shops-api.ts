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

export type ShopsBusinessType =
  | "mobile_store"
  | "clothing"
  | "shoes"
  | "supermarket"
  | "electronics"
  | "other";

export type ShopsCountry = "EG";

export type ShopsCurrency = "EGP";

export type ShopsSetup = {
  business_type: ShopsBusinessType;
  country: ShopsCountry;
  currency: ShopsCurrency;
  first_branch_name: string | null;
};

export type ShopsContextData = {
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
  shops_setup: ShopsSetup | null;
  onboarding_required: boolean;
  setup_required: boolean;
};

export type StoreShopsSetupPayload = {
  business_type: ShopsBusinessType;
  country: ShopsCountry;
  currency: ShopsCurrency;
  first_branch_name?: string | null;
};

type ApiEnvelope<T> = {
  message: string;
  data: T;
};

type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
  code?: string;
};

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

export function resolveApiBaseUrl(
  configuredBaseUrl?: string,
  currentHostname?: string,
  currentProtocol?: string,
) {
  const normalizedConfiguredBaseUrl = String(configuredBaseUrl ?? "")
    .trim()
    .replace(/\/+$/, "");

  if (normalizedConfiguredBaseUrl) {
    return normalizedConfiguredBaseUrl;
  }

  const normalizedHostname = String(currentHostname ?? "").trim().toLowerCase();

  if (
    normalizedHostname === "localhost" ||
    normalizedHostname === "127.0.0.1" ||
    normalizedHostname === "::1"
  ) {
    return "http://localhost:8080";
  }

  if (normalizedHostname.includes(".")) {
    const hostnameSegments = normalizedHostname.split(".");

    if (hostnameSegments.length >= 2) {
      hostnameSegments[0] = "api";

      const normalizedProtocol =
        currentProtocol === "http:" ? "http" : "https";

      return `${normalizedProtocol}://${hostnameSegments.join(".")}`;
    }
  }

  throw new Error(
    "NEXT_PUBLIC_API_BASE is required when the runtime hostname cannot derive the backend origin.",
  );
}

function apiBaseUrl() {
  return resolveApiBaseUrl(
    process.env.NEXT_PUBLIC_API_BASE,
    typeof window === "undefined" ? undefined : window.location.hostname,
    typeof window === "undefined" ? undefined : window.location.protocol,
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
  return request<ApiEnvelope<ShopsContextData>>(
    `/api/workspaces/${encodeURIComponent(workspaceSlug)}/shops/context`,
    {
      method: "GET",
    },
  );
}

export function storeShopsMode(workspaceSlug: string, mode: ShopsMode) {
  return request<ApiEnvelope<ShopsContextData>>(
    `/api/workspaces/${encodeURIComponent(workspaceSlug)}/shops/mode`,
    {
      method: "POST",
      body: JSON.stringify({ mode }),
    },
    { requireCsrf: true },
  );
}

export function storeShopsSetup(
  workspaceSlug: string,
  payload: StoreShopsSetupPayload,
) {
  return request<ApiEnvelope<ShopsContextData>>(
    `/api/workspaces/${encodeURIComponent(workspaceSlug)}/shops/setup`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { requireCsrf: true },
  );
}
