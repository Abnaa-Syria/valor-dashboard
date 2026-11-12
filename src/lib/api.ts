import axios, { AxiosError } from 'axios';
import { clearToken, getToken } from './auth-storage';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isLoginRequest = error.config?.url?.includes('/admin/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      clearToken();
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    return Promise.reject(error);
  },
);

/** Every success response from the API is wrapped in { data }. */
export async function get<T>(url: string, params?: object): Promise<T> {
  const response = await api.get<{ data: T }>(url, { params });
  return response.data.data;
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const response = await api.post<{ data: T }>(url, body);
  return response.data.data;
}

export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const response = await api.patch<{ data: T }>(url, body);
  return response.data.data;
}

export async function del<T>(url: string): Promise<T> {
  const response = await api.delete<{ data: T }>(url);
  return response.data.data;
}

type ApiErrorBody = { error?: { code?: string; message?: string } };

const messagesByCode: Record<string, string> = {
  VALIDATION_ERROR: 'Some fields are invalid.',
  FORBIDDEN: "You don't have permission to do this.",
  NOT_FOUND: "This item doesn't exist.",
  CONFLICT: 'This value is already in use.',
  TOO_MANY_REQUESTS: 'Too many attempts. Try again in a moment.',
  DATABASE_UNAVAILABLE: 'The database is unavailable right now.',
};

export function getErrorCode(error: unknown): string | undefined {
  return (error as AxiosError<ApiErrorBody>)?.response?.data?.error?.code;
}

export function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<ApiErrorBody>;
  if (!axiosError?.response) return "Can't reach the server. Check that the API is running.";
  const code = getErrorCode(error);
  // Known codes get a friendly message; otherwise the API's own (English) message is clear enough.
  return (code && messagesByCode[code]) || axiosError.response.data?.error?.message || 'Something went wrong. Try again.';
}
