import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
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
