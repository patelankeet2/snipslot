import { config } from '../config';

// Error the API sent back on purpose (400, 401, 403, 404, 409...)
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: { field: string; message: string }[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// The request never got an answer: offline, DNS failure, server down
export class NetworkError extends Error {
  constructor() {
    super('You appear to be offline');
    this.name = 'NetworkError';
  }
}

export const UNAUTHORIZED_EVENT = 'snipslot:unauthorized';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Facade over fetch: pages call api.get / api.post and never deal with
// headers, cookies, JSON parsing or error shapes themselves.
async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  // files go as multipart form data (the browser sets that header itself), everything else as JSON
  const isForm = body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`${config.apiBase}/api${path}`, {
      method,
      credentials: 'include', // send the session cookie
      headers: body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : undefined,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new NetworkError();
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // let the auth context know the session is gone (expired cookie etc)
    if (res.status === 401 && path !== '/auth/me') {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(
      res.status,
      data?.error?.code ?? 'ERROR',
      data?.error?.message ?? `Request failed (${res.status})`,
      data?.error?.details,
    );
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  // DELETE with a JSON body, eg removing a push subscription by its endpoint
  deleteWithBody: <T>(path: string, body: unknown) => request<T>('DELETE', path, body),
  upload: <T>(path: string, form: FormData) => request<T>('POST', path, form),
};

// Friendly text for any error a page might catch
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError || err instanceof NetworkError) return err.message;
  return 'Something went wrong, please try again';
}
