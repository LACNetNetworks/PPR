'use client'

import { getClientApiBaseUrl } from './api-config'
import type { ApiError, HeadersInit } from '@/types/api'

/**
 * Client-side API client that uses authentication hook
 * Use this in client components
 */
export class ApiClient {
  private baseUrl: string
  private getAuthToken: () => string | undefined

  constructor(getAuthToken: () => string | undefined) {
    this.baseUrl = getClientApiBaseUrl()
    this.getAuthToken = getAuthToken
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const token = this.getAuthToken()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    // Authentication is optional for now but ready to be implemented
    // When authentication is required, this will always include the token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      let error: ApiError
      try {
        error = await response.json()
      } catch {
        error = {
          message: `HTTP ${response.status}: ${response.statusText}`,
          code: response.status.toString(),
        }
      }
      throw error
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    }

    return response.text() as unknown as T
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    })
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    })
  }

  /**
   * Upload file with FormData
   */
  async upload<T>(
    endpoint: string,
    formData: FormData,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const token = this.getAuthToken()

    const headers: Record<string, string> = {
      ...(options?.headers as Record<string, string>),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...options,
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      let error: ApiError
      try {
        error = await response.json()
      } catch {
        error = {
          message: `HTTP ${response.status}: ${response.statusText}`,
          code: response.status.toString(),
        }
      }
      throw error
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    }

    return response.text() as unknown as T
  }
}


