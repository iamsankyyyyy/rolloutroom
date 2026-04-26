import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { login, register, getMe, updateMe } from '../api'
import type { LoginRequest, RegisterRequest, UpdateUserRequest } from '../types'
import { useNavigate } from 'react-router-dom'

export function useCurrentUser() {
  const token = localStorage.getItem('access_token')
  return useQuery({ queryKey: ['me'], queryFn: getMe, enabled: !!token, retry: false })
}

export function useLogin() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: (token) => { localStorage.setItem('access_token', token.access_token); navigate('/dashboard') },
  })
}

export function useRegister() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data: RegisterRequest) => register(data),
    onSuccess: () => navigate('/login'),
  })
}

export function useLogout() {
  const navigate = useNavigate()
  return () => { localStorage.removeItem('access_token'); navigate('/login') }
}

export function useUpdateMe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateUserRequest) => updateMe(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  })
}
