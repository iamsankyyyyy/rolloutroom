import { apiClient } from './client'
import type { LoginRequest, RegisterRequest, TokenResponse, User, UpdateUserRequest } from '../types'

export async function login(data: LoginRequest): Promise<TokenResponse> {
  const form = new URLSearchParams()
  form.append('username', data.username)
  form.append('password', data.password)

  const res = await apiClient.post<TokenResponse>('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return res.data
}

export async function register(data: RegisterRequest): Promise<User> {
  const res = await apiClient.post<User>('/auth/register', data)
  return res.data
}

export async function getMe(): Promise<User> {
  const res = await apiClient.get<User>('/users/me')
  return res.data
}

export async function updateMe(data: UpdateUserRequest): Promise<User> {
  const res = await apiClient.patch<User>('/users/me', data)
  return res.data
}
