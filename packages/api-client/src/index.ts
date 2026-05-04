export const DEFAULT_API_BASE = "https://api.nexoraxs.com";

export type ApiResponseEnvelope<T> = {
  message: string;
  data: T;
};

export type ApiCollectionEnvelope<T> = {
  data: T[];
  meta?: Record<string, unknown>;
  links?: Record<string, unknown>;
};

export type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
  code?: string;
};

export type CookieReader = (name: string) => string | null;

export type ApiClientConfig = {
  apiBaseUrl?: string;
  fetchFn?: typeof fetch;
  readCookie?: CookieReader;
  defaultHeaders?: HeadersInit;
};

export type ApiRequestOptions = {
  requireCsrf?: boolean;
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

export function resolveApiBaseUrl(apiBaseUrl = DEFAULT_API_BASE) {
  return apiBaseUrl.replace(/\/$/, "");
}

export function readCookie(name: string, cookieSource?: string) {
  const source =
    cookieSource ?? (typeof document === "undefined" ? "" : document.cookie);

  if (!source) {
    return null;
  }

  const normalized = source
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`));

  return normalized ? normalized.slice(name.length + 1) : null;
}

export function readXsrfTokenCookie(readCookieValue: CookieReader = readCookie) {
  const rawValue = readCookieValue("XSRF-TOKEN");

  return rawValue ? decodeURIComponent(rawValue) : null;
}

export function createApiClient(config: ApiClientConfig = {}) {
  const fetchFn = config.fetchFn ?? fetch;
  const readCookieValue = config.readCookie ?? ((name: string) => readCookie(name));
  const baseUrl = resolveApiBaseUrl(config.apiBaseUrl);

  function buildUrl(path: string) {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    return `${baseUrl}${path}`;
  }

  async function ensureCsrfCookie() {
    const response = await fetchFn(buildUrl("/sanctum/csrf-cookie"), {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...config.defaultHeaders,
      },
    });

    if (!response.ok) {
      throw new ApiClientError(
        "Unable to initialize the CSRF cookie from the API.",
        response.status,
      );
    }
  }

  async function request<T>(
    path: string,
    init: RequestInit = {},
    options: ApiRequestOptions = {},
  ) {
    if (options.requireCsrf) {
      await ensureCsrfCookie();
    }

    const headers = new Headers(config.defaultHeaders);

    if (init.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (options.requireCsrf) {
      headers.set("X-Requested-With", "XMLHttpRequest");

      const xsrfToken = readXsrfTokenCookie(readCookieValue);

      if (!xsrfToken) {
        throw new ApiClientError(
          "Missing XSRF-TOKEN cookie after CSRF initialization.",
          419,
        );
      }

      headers.set("X-XSRF-TOKEN", xsrfToken);
    }

    const response = await fetchFn(buildUrl(path), {
      ...init,
      headers,
      credentials: "include",
      cache: "no-store",
    });

    return parseResponse<T>(response);
  }

  return {
    apiBaseUrl: baseUrl,
    buildUrl,
    ensureCsrfCookie,
    request,
  };
}

async function parseResponse<T>(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as T | ApiErrorPayload)
    : null;

  if (!response.ok) {
    const errorPayload = (payload ?? {}) as ApiErrorPayload;

    throw new ApiClientError(
      errorPayload.message ?? "API request failed.",
      response.status,
      errorPayload.errors ?? {},
      errorPayload.code,
    );
  }

  return payload as T;
}
