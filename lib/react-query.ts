import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
    },
    mutations: {
      retry: 1,
    },
  },
})

// Query keys for consistent caching
export const queryKeys = {
  // Auth
  user: ['user'] as const,
  session: ['session'] as const,
  
  // Organizations
  organizations: ['organizations'] as const,
  organization: (id: string) => ['organization', id] as const,
  
  // API Keys
  apiKeys: (orgId: string) => ['apiKeys', orgId] as const,
  apiKey: (id: string) => ['apiKey', id] as const,
  
  // Usage Stats
  usageStats: (orgId: string) => ['usageStats', orgId] as const,
  usageHistory: (orgId: string) => ['usageHistory', orgId] as const,
  
  // PrestaShop Data (via tenant API)
  products: (orgId: string) => ['products', orgId] as const,
  product: (orgId: string, id: string) => ['product', orgId, id] as const,
  customers: (orgId: string) => ['customers', orgId] as const,
  orders: (orgId: string) => ['orders', orgId] as const,
} as const