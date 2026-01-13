export interface GoogleShoppingFeed {
  id: string
  organization_id: string
  name: string
  description?: string

  // Feed Configuration
  target_country: string
  target_language: string
  currency: string

  // Product Filtering
  include_categories?: number[]
  exclude_categories?: number[]
  min_price?: number
  max_price?: number
  only_in_stock: boolean

  // Field Mapping
  field_mappings: GoogleShoppingFieldMappings

  // Sync Settings
  sync_frequency: 'hourly' | 'daily' | 'weekly' | 'manual'
  last_sync_at?: string
  next_sync_at?: string
  sync_status: 'pending' | 'syncing' | 'completed' | 'failed'
  sync_error?: string

  // Feed URLs
  feed_url?: string
  feed_xml_url?: string

  // Statistics
  total_products: number
  successful_products: number
  failed_products: number

  // Metadata
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GoogleShoppingFieldMappings {
  title?: {
    source: 'product_name' | 'custom'
    custom_template?: string
    max_length: number
  }
  description?: {
    source: 'description' | 'description_short' | 'custom'
    custom_template?: string
    max_length: number
  }
  image_link?: {
    source: 'cover_image' | 'first_image'
    size?: 'original' | 'large' | 'medium'
  }
  condition: 'new' | 'refurbished' | 'used'
  brand?: {
    source: 'manufacturer' | 'custom'
    custom_value?: string
  }
  gtin?: {
    source: 'ean13' | 'upc' | 'reference' | 'custom'
    custom_field?: string
  }
  google_product_category?: {
    mapping_type: 'auto' | 'manual' | 'category_based'
    default_category_id?: number
    category_mappings?: Record<number, number>
  }
  availability?: {
    in_stock_value: string
    out_of_stock_value: string
    preorder_value?: string
  }
  price?: {
    include_tax: boolean
    currency_override?: string
  }
}

export interface CreateGoogleShoppingFeedData {
  name: string
  description?: string
  target_country: string
  target_language: string
  currency: string
  field_mappings: GoogleShoppingFieldMappings
  sync_frequency: 'hourly' | 'daily' | 'weekly' | 'manual'
  only_in_stock?: boolean
  include_categories?: number[]
  exclude_categories?: number[]
  min_price?: number
  max_price?: number
}

export interface UpdateGoogleShoppingFeedData extends Partial<CreateGoogleShoppingFeedData> {
  is_active?: boolean
}

export interface GoogleShoppingFeedLog {
  id: string
  feed_id: string
  sync_started_at: string
  sync_completed_at?: string
  status: 'success' | 'failed' | 'partial'
  products_processed: number
  products_succeeded: number
  products_failed: number
  error_message?: string
  error_details?: any
  created_at: string
}

export interface GoogleShoppingFeedStats {
  totalProducts: number
  validProducts: number
  invalidProducts: number
  productsWithGTIN: number
  productsWithBrand: number
  productsWithMPN: number
  productsInStock: number
  productsOutOfStock: number
  feedUrl: string
  errors: Array<{
    productId: number
    errors: string[]
  }>
}

export const PLAN_FEED_LIMITS = {
  hobby: {
    max_feeds: 1,
    max_products_per_feed: 100,
    sync_frequencies: ['manual'] as const,
    advanced_mapping: false,
    multi_currency: false,
    multi_channel: false
  },
  starter: {
    max_feeds: 2,
    max_products_per_feed: 1000,
    sync_frequencies: ['manual', 'daily'] as const,
    advanced_mapping: false,
    multi_currency: false,
    multi_channel: false
  },
  professional: {
    max_feeds: 5,
    max_products_per_feed: 10000,
    sync_frequencies: ['manual', 'daily', 'hourly'] as const,
    advanced_mapping: true,
    multi_currency: true,
    multi_channel: false
  },
  business: {
    max_feeds: -1,
    max_products_per_feed: -1,
    sync_frequencies: ['manual', 'daily', 'hourly', 'realtime'] as const,
    advanced_mapping: true,
    multi_currency: true,
    multi_channel: true
  }
} as const
