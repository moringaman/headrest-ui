// Database types
export interface Organization {
  id: string
  name: string
  email: string
  plan: 'starter' | 'professional' | 'business' | 'enterprise'
  created_at: string
  updated_at: string
  
  // PrestaShop connection details (encrypted)
  prestashop_url?: string
  prestashop_db_host?: string
  prestashop_db_port?: number
  prestashop_db_username?: string
  prestashop_db_password?: string
  prestashop_db_name?: string
  prestashop_db_prefix?: string
  
  // API usage tracking
  api_calls_this_month?: number
  last_api_call?: string
  
  // Billing
  stripe_customer_id?: string
  stripe_subscription_id?: string
  subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing'
}

export interface User {
  id: string
  email: string
  full_name?: string
  organization_id: string
  role: 'owner' | 'admin' | 'developer' | 'viewer'
  created_at: string
  updated_at: string
}

export interface ApiKey {
  id: string
  organization_id: string
  name: string
  key_hash: string
  key_preview: string // First 8 characters for display
  permissions: ('read' | 'write')[]
  last_used?: string
  created_at: string
  expires_at?: string
  is_active: boolean
}

// API Response types
export interface Product {
  id: number
  name: string
  description?: string
  price: number
  reference?: string
  active: boolean
  images?: ProductImage[]
  categories?: Category[]
  translations?: ProductTranslation[]
}

export interface ProductImage {
  id: number
  product_id: number
  image_url: string
  cover: boolean
  position: number
}

export interface ProductTranslation {
  id: number
  product_id: number
  language_id: number
  name: string
  description?: string
  description_short?: string
  meta_title?: string
  meta_description?: string
}

export interface Category {
  id: number
  name: string
  description?: string
  active: boolean
  parent_id?: number
  level_depth: number
  position: number
}

export interface Customer {
  id: number
  email: string
  firstname: string
  lastname: string
  active: boolean
  date_add: string
  date_upd: string
}

export interface Order {
  id: number
  customer_id: number
  total_paid: number
  currency: string
  date_add: string
  current_state: number
  payment: string
  order_details?: OrderDetail[]
}

export interface OrderDetail {
  id: number
  order_id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface Cart {
  id: number
  customer_id?: number
  date_add: string
  date_upd: string
  items?: CartItem[]
}

export interface CartItem {
  id: number
  cart_id: number
  product_id: number
  quantity: number
  date_add: string
}

// Usage analytics
export interface UsageStats {
  total_requests: number
  requests_this_month: number
  requests_today: number
  avg_response_time: number
  error_rate: number
  top_endpoints: {
    endpoint: string
    count: number
  }[]
}

// API responses
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Form types
export interface StoreConnectionForm {
  name: string
  prestashop_url: string
  db_host: string
  db_port: number
  db_username: string
  db_password: string
  db_name: string
  db_prefix: string
}

export interface ApiKeyForm {
  name: string
  permissions: ('read' | 'write')[]
  expires_in_days?: number
}