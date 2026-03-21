import axios from "axios";

const rawUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "";
export const apiClient = axios.create({
  baseURL: rawUrl.endsWith("/api/v1") ? rawUrl : `${rawUrl}/api/v1`
});

const TOKEN_KEY = "impact_draw_access_token";

export function setAccessToken(token: string) {
  apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
  delete apiClient.defaults.headers.common.Authorization;
  localStorage.removeItem(TOKEN_KEY);
}

export function hydrateAccessToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  }
}

hydrateAccessToken();
