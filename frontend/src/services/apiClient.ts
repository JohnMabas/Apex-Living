const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

export interface ApiClientError extends Error {
  statusCode?: number;
  fieldErrors?: Record<string, string[]>;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  formData?: FormData;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { ...options.headers };
  let body: BodyInit | undefined;

  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body,
    credentials: "include",
    signal: options.signal,
  });

  const payload = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    const error = new Error(
      (payload.message as string) ?? "Something went wrong.",
    ) as ApiClientError;
    error.statusCode = response.status;
    if (payload.errors) {
      error.fieldErrors = payload.errors as Record<string, string[]>;
    }
    throw error;
  }

  return payload as T;
}

export { API_URL };

/** Fetch a binary resource (e.g. a PDF receipt) with optional custom headers. */
export async function apiFetchBlob(
  path: string,
  options: Omit<RequestOptions, "body"> = {},
): Promise<Blob> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: options.headers,
    credentials: "include",
    signal: options.signal,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const error = new Error(
      (payload.message as string) ?? "Something went wrong.",
    ) as ApiClientError;
    error.statusCode = response.status;
    throw error;
  }

  return response.blob();
}
