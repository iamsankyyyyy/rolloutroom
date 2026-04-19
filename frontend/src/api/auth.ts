import { apiClient } from './client'
import type { LoginRequest, RegisterRequest, TokenResponse, User } from '../types'

/**
 * POST /auth/login
 *
 * If your backend expects JSON instead of form data, we'll adjust this later.
 */
export async function login(data: LoginRequest): Promise<TokenResponse> {
  const form = new URLSearchParams()
  form.append('username', data.username)
  form.append('password', data.password)

  const res = await apiClient.post<TokenResponse>('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return res.data
}

/**
 * POST /auth/register
 * Sends JSON: { username, email, password }
 */
export async function register(data: RegisterRequest): Promise<User> {
  const res = await apiClient.post<User>('/auth/register', data)
  return res.data
}

/**
 * GET /users/me
 */
export async function getMe(): Promise<User> {
  const res = await apiClient.get<User>('/users/me')
  return res.data
}