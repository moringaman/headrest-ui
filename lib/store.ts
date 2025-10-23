import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { Organization, ApiKey, UsageStats, Cart, CartItem } from '../types'

interface AppState {
  // Organization state
  currentOrganization: Organization | null
  organizations: Organization[]
  setCurrentOrganization: (org: Organization) => void
  setOrganizations: (orgs: Organization[]) => void
  
  // API Keys state
  apiKeys: ApiKey[]
  setApiKeys: (keys: ApiKey[]) => void
  addApiKey: (key: ApiKey) => void
  updateApiKey: (id: string, updates: Partial<ApiKey>) => void
  deleteApiKey: (id: string) => void
  
  // Usage stats
  usageStats: UsageStats | null
  setUsageStats: (stats: UsageStats) => void
  
  // Cart state
  currentCart: Cart | null
  cartItems: CartItem[]
  cartLoading: boolean
  setCurrentCart: (cart: Cart | null) => void
  setCartItems: (items: CartItem[]) => void
  addCartItem: (item: CartItem) => void
  removeCartItem: (itemId: number) => void
  updateCartItem: (itemId: number, updates: Partial<CartItem>) => void
  clearCart: () => void
  setCartLoading: (loading: boolean) => void
  
  // UI State
  sidebar: {
    isOpen: boolean
    toggle: () => void
    close: () => void
    open: () => void
  }
  
  // Notifications
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    timestamp: Date
  }>
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Organization state
        currentOrganization: null,
        organizations: [],
        setCurrentOrganization: (org) => set({ currentOrganization: org }),
        setOrganizations: (orgs) => set({ organizations: orgs }),
        
        // API Keys state
        apiKeys: [],
        setApiKeys: (keys) => set({ apiKeys: keys }),
        addApiKey: (key) => set((state) => ({ 
          apiKeys: [...state.apiKeys, key] 
        })),
        updateApiKey: (id, updates) => set((state) => ({
          apiKeys: state.apiKeys.map(key => 
            key.id === id ? { ...key, ...updates } : key
          )
        })),
        deleteApiKey: (id) => set((state) => ({
          apiKeys: state.apiKeys.filter(key => key.id !== id)
        })),
        
        // Usage stats
        usageStats: null,
        setUsageStats: (stats) => set({ usageStats: stats }),
        
        // Cart state
        currentCart: null,
        cartItems: [],
        cartLoading: false,
        setCurrentCart: (cart) => set({ currentCart: cart }),
        setCartItems: (items) => set({ cartItems: items }),
        addCartItem: (item) => set((state) => ({ 
          cartItems: [...state.cartItems, item] 
        })),
        removeCartItem: (itemId) => set((state) => ({
          cartItems: state.cartItems.filter(item => item.id !== itemId)
        })),
        updateCartItem: (itemId, updates) => set((state) => ({
          cartItems: state.cartItems.map(item => 
            item.id === itemId ? { ...item, ...updates } : item
          )
        })),
        clearCart: () => set({ cartItems: [], currentCart: null }),
        setCartLoading: (loading) => set({ cartLoading: loading }),
        
        // UI State
        sidebar: {
          isOpen: false,
          toggle: () => set((state) => ({ 
            sidebar: { ...state.sidebar, isOpen: !state.sidebar.isOpen }
          })),
          close: () => set((state) => ({ 
            sidebar: { ...state.sidebar, isOpen: false }
          })),
          open: () => set((state) => ({ 
            sidebar: { ...state.sidebar, isOpen: true }
          })),
        },
        
        // Notifications
        notifications: [],
        addNotification: (notification) => {
          const id = Math.random().toString(36).substr(2, 9)
          const timestamp = new Date()
          set((state) => ({
            notifications: [...state.notifications, { ...notification, id, timestamp }]
          }))
          
          // Auto-remove after 5 seconds
          setTimeout(() => {
            get().removeNotification(id)
          }, 5000)
        },
        removeNotification: (id) => set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        })),
        clearNotifications: () => set({ notifications: [] }),
      }),
      {
        name: 'headless-shop-storage',
        partialize: (state) => ({
          // Only persist certain parts of the state
          currentOrganization: state.currentOrganization,
          sidebar: {
            isOpen: false, // Don't persist sidebar state
          }
        }),
      }
    ),
    {
      name: 'headless-shop-store',
    }
  )
)