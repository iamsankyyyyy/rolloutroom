import axios from 'axios'

export function getApiError(err: unknown, fallback = 'Something went wrong'): string {
  if (!axios.isAxiosError(err)) return fallback

  const detail = err.response?.data?.detail

  if (typeof detail === 'string') return detail

  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((d: { msg?: string }) => d.msg ?? '')
      .filter(Boolean)
      .join(', ')
  }

  return err.message || fallback
}