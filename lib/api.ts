import type { Cart, CartItem } from '../types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1` : 'http://localhost:3000/api/v1'

export interface Organization {
  id: string
  name: string
  slug: string
  plan_tier: string
  api_calls_limit: number
  api_calls_used: number
  is_active: boolean
  created_at: string
  updated_at: string
  // Database connection details (if available)
  prestashop_db_host?: string
  prestashop_db_name?: string
  prestashop_db_username?: string
  prestashop_db_password?: string
  prestashop_db_port?: number
  prestashop_db_prefix?: string
  // PrestaShop URL for image URLs
  prestashop_url?: string
}


export interface CreateOrganizationData {
  name: string
  slug?: string
}

export interface UpdateOrganizationData {
  name?: string
  slug?: string
  prestashop_url?: string
}

export interface UpdatePrestaShopCredentialsData {
  prestashop_db_host: string
  prestashop_db_name: string
  prestashop_db_username: string
  prestashop_db_password: string
  prestashop_db_port: number
  prestashop_db_prefix: string
}

export interface UsageStats {
  total_calls: number
  calls_limit: number
  calls_remaining: number
  calls_used_percentage: number
  period_start: string
  period_end: string
  top_endpoints?: Array<{
    endpoint: string
    method: string
    count: number
  }>
  daily_usage?: Array<{
    date: string
    count: number
  }>
}

export interface Credentials {
  prestashop_db_host: string
  prestashop_db_name: string
  prestashop_db_username: string
  prestashop_db_password: string
  prestashop_db_port: number
  prestashop_db_prefix: string
}

export interface ApiKey {
  id: string
  name: string
  description?: string
  key?: string // Only shown once during creation, then not returned
  expires_at?: string
  created_at: string
  last_used_at?: string
  is_active: boolean
}

export interface CreateApiKeyData {
  name: string
  description?: string
  expires_at?: string
}

export interface UpdateApiKeyData {
  name?: string
  description?: string
  expires_at?: string
}

export class ApiClient {
  private baseURL: string
  private apiKey?: string

  constructor(apiKey?: string) {
    this.baseURL = API_BASE_URL
    this.apiKey = apiKey
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Only add apiKey if no Authorization header is already provided
    if (this.apiKey && !(options.headers as Record<string, string>)?.['Authorization']) {
      defaultHeaders['Authorization'] = `Bearer ${this.apiKey}`
    }
    
    // Merge headers properly
    const finalHeaders = {
      ...defaultHeaders,
      ...(options.headers as Record<string, string>)
    }


    const response = await fetch(url, {
      ...options,
      headers: finalHeaders,
    })

    if (!response.ok) {
      const errorBody = await response.text()
      // console.error('API Error:', { 
      //   url,
      //   status: response.status, 
      //   statusText: response.statusText, 
      //   body: errorBody,
      //   headers: finalHeaders
      // })
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Product endpoints
  async getProducts(organizationId?: string) {
    const endpoint = organizationId 
      ? `/organizations/${organizationId}/products`
      : '/products'
    return this.request(endpoint)
  }

  async getProduct(id: string, organizationId?: string) {
    const endpoint = organizationId 
      ? `/organizations/${organizationId}/products/${id}`
      : `/products/${id}`
    return this.request(endpoint)
  }

  // Customer endpoints
  async getCustomers(organizationId?: string) {
    const endpoint = organizationId 
      ? `/organizations/${organizationId}/customers`
      : '/customers'
    return this.request(endpoint)
  }

  // Order endpoints
  async getOrders(organizationId?: string) {
    const endpoint = organizationId 
      ? `/organizations/${organizationId}/orders`
      : '/orders'
    return this.request(endpoint)
  }

  // Cart endpoints
  async createCart(organizationId?: string): Promise<Cart> {
    const endpoint = organizationId
      ? `/organizations/${organizationId}/cart`
      : '/cart'
    return this.request(endpoint, { method: 'POST' }) as Promise<Cart>
  }

  async getCart(cartId: number, organizationId?: string): Promise<Cart> {
    const endpoint = organizationId
      ? `/organizations/${organizationId}/cart/${cartId}`
      : `/cart/${cartId}`
    return this.request(endpoint) as Promise<Cart>
  }

  async addToCart(cartId: number, productId: number, quantity: number = 1, organizationId?: string): Promise<CartItem> {
    const endpoint = organizationId
      ? `/organizations/${organizationId}/cart/${cartId}/items`
      : `/cart/${cartId}/items`
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        product_id: productId,
        quantity: quantity
      })
    }) as Promise<CartItem>
  }

  async removeFromCart(cartId: number, itemId: number, organizationId?: string): Promise<void> {
    const endpoint = organizationId
      ? `/organizations/${organizationId}/cart/${cartId}/items/${itemId}`
      : `/cart/${cartId}/items/${itemId}`
    return this.request(endpoint, { method: 'DELETE' }) as Promise<void>
  }

  // Alias for removeFromCart to match your naming
  async removeFromBasket(cartId: number, itemId: number, organizationId?: string): Promise<void> {
    return this.removeFromCart(cartId, itemId, organizationId)
  }

  async updateCartItem(cartId: number, itemId: number, quantity: number, organizationId?: string): Promise<CartItem> {
    const endpoint = organizationId
      ? `/organizations/${organizationId}/cart/${cartId}/items/${itemId}`
      : `/cart/${cartId}/items/${itemId}`
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    }) as Promise<CartItem>
  }

  async clearCart(cartId: number, organizationId?: string): Promise<void> {
    const endpoint = organizationId
      ? `/organizations/${organizationId}/cart/${cartId}/items`
      : `/cart/${cartId}/items`
    return this.request(endpoint, { method: 'DELETE' }) as Promise<void>
  }


  // API key validation
  async validateApiKey() {
    return this.request('/auth/validate')
  }

  // Organization endpoints
  async getOrganizations(token?: string): Promise<Organization[]> {
    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    try {
      return await this.request<Organization[]>('/organizations/list', { headers })
    } catch (error: any) {
      // If no organizations exist, the API might return 404
      // In this case, return an empty array instead of throwing an error
      console.log('getOrganizations error:', error.message)
      if (error.message?.includes('404') || error.message?.includes('Not Found') || error.message?.includes('API Error: 404')) {
        console.log('Returning empty array for 404/Not Found')
        return []
      }
      throw error
    }
  }

  async getCurrentOrganization(token?: string): Promise<Organization> {
    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return this.request<Organization>('/organizations/me', { headers })
  }

  async getOrganization(organizationId: string, token?: string): Promise<Organization> {
    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return this.request<Organization>(`/organizations/${organizationId}`, { headers })
  }

  async createOrganization(data: CreateOrganizationData, token?: string) {
    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return this.request('/organizations', {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    })
  }

  async updateCurrentOrganization(data: UpdateOrganizationData, token?: string) {
    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return this.request('/organizations/me', {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data)
    })
  }

  async updateOrganization(organizationId: string, data: UpdateOrganizationData, token?: string) {
    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return this.request(`/organizations/${organizationId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data)
    })
  }

  async updateCredentials(credentials: UpdatePrestaShopCredentialsData, token?: string) {
    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return this.request('/organizations/me/credentials', {
      method: 'PATCH',
      headers,
      body: JSON.stringify(credentials)
    })
  }

  async deleteCurrentOrganization(token?: string) {
    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return this.request('/organizations/me', {
      method: 'DELETE',
      headers
    })
  }

  async deleteOrganization(organizationId: string, token?: string) {
    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return this.request(`/organizations/${organizationId}`, {
      method: 'DELETE',
      headers
    })
  }

  // Get usage statistics for current organization
  async getUsageStats(token?: string): Promise<UsageStats> {
    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    try {
      return await this.request<UsageStats>('/organizations/me/usage', { headers })
    } catch (error: any) {
      // If no usage stats exist (e.g., no organizations), return default stats
      console.log('getUsageStats error:', error.message)
      if (error.message?.includes('404') || error.message?.includes('Not Found') || error.message?.includes('API Error: 404')) {
        console.log('Returning default stats for 404/Not Found')
        return {
          total_calls: 0,
          calls_limit: 0,
          calls_remaining: 0,
          calls_used_percentage: 0,
          period_start: new Date().toISOString(),
          period_end: new Date().toISOString()
        }
      }
      throw error
    }
  }

  // Get decrypted credentials for current organization
  async getCredentials(token?: string): Promise<Credentials> {
    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return this.request<Credentials>('/organizations/me/credentials', { headers })
  }

  // Get decrypted credentials for specific organization
  async getOrganizationCredentials(organizationId: string, token?: string): Promise<Credentials> {
    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return this.request<Credentials>(`/organizations/${organizationId}/credentials`, { headers })
  }

  // Test database connection by calling products endpoint
  async testConnection(token?: string) {
    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return this.request('/products', { headers })
  }

  // Test database connection for specific organization
  async testOrganizationConnection(organizationId: string, token?: string): Promise<any[]> {
    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    // Call the organization-specific products endpoint to test the database connection
    return this.request<any[]>(`/organizations/${organizationId}/products`, { headers })
  }

  // API Key management endpoints
  async getApiKeys(token?: string): Promise<ApiKey[]> {
    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return this.request('/api-keys', { headers }) as Promise<ApiKey[]>
  }


  async createApiKey(data: CreateApiKeyData, token?: string): Promise<ApiKey> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return this.request('/api-keys', {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    }) as Promise<ApiKey>
  }

  async updateApiKey(id: string, data: UpdateApiKeyData, token?: string) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return this.request(`/api-keys/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data)
    })
  }

  async revokeApiKey(id: string, token?: string) {
    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return this.request(`/api-keys/${id}/revoke`, {
      method: 'POST',
      headers
    })
  }

  async deleteApiKey(id: string, token?: string) {
    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return this.request(`/api-keys/${id}`, {
      method: 'DELETE',
      headers
    })
  }

  async testApiKey(apiKey: string, organizationId?: string) {
    const endpoint = organizationId 
      ? `/organizations/${organizationId}/products`
      : '/products'
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    }
    
    return this.request(endpoint, { headers })
  }
}

// Default client for non-authenticated requests
export const apiClient = new ApiClient()

// Create authenticated client
export const createAuthenticatedClient = (apiKey: string) => 
  new ApiClient(apiKey)