import axios from 'axios'
import type { AxiosError } from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9911',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ message?: string }>) => {
    if (err.response?.status === 401) {
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export async function apiGet<T>(url: string) {
  const res = await api.get<{ data: T }>(url)
  return res.data.data
}

export async function apiPost<T, B = unknown>(url: string, body?: B) {
  const res = await api.post<{ data: T; message?: string }>(url, body)
  return res.data
}

export async function apiPut<T, B = unknown>(url: string, body?: B) {
  const res = await api.put<{ data: T }>(url, body)
  return res.data.data
}

export async function apiDelete(url: string) {
  const res = await api.delete(url)
  return res.data
}
