import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAppStore } from './store'
import { apiClient } from './api'
import { Cart, CartItem } from '../types'

export function useCart(organizationId?: string) {
  const queryClient = useQueryClient()
  const {
    currentCart,
    cartItems,
    cartLoading,
    setCurrentCart,
    setCartItems,
    addCartItem,
    removeCartItem,
    updateCartItem,
    clearCart,
    setCartLoading
  } = useAppStore()

  // Get current cart
  const { data: cart, isLoading: cartIsLoading } = useQuery({
    queryKey: ['cart', currentCart?.id, organizationId],
    queryFn: () => currentCart ? apiClient.getCart(currentCart.id, organizationId) : null,
    enabled: !!currentCart,
  })

  // React Query v5: Use useEffect instead of onSuccess
  useEffect(() => {
    if (cart) {
      setCartItems(cart.items || [])
    }
  }, [cart, setCartItems])

  // Create cart mutation
  const createCartMutation = useMutation({
    mutationFn: () => apiClient.createCart(organizationId),
    onSuccess: (data: Cart) => {
      setCurrentCart(data)
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: (error) => {
      console.error('Failed to create cart:', error)
    }
  })

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) => {
      if (!currentCart) throw new Error('No cart available')
      return apiClient.addToCart(currentCart.id, productId, quantity, organizationId)
    },
    onSuccess: (data: CartItem) => {
      addCartItem(data)
      queryClient.invalidateQueries({ queryKey: ['cart', currentCart?.id] })
    },
    onError: (error) => {
      console.error('Failed to add to cart:', error)
    }
  })

  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: (itemId: number) => {
      if (!currentCart) throw new Error('No cart available')
      return apiClient.removeFromCart(currentCart.id, itemId, organizationId)
    },
    onSuccess: (_, itemId) => {
      removeCartItem(itemId)
      queryClient.invalidateQueries({ queryKey: ['cart', currentCart?.id] })
    },
    onError: (error) => {
      console.error('Failed to remove from cart:', error)
    }
  })

  // Alias for removeFromCart to match your naming
  const removeFromBasket = (itemId: number) => {
    return removeFromCartMutation.mutate(itemId)
  }

  // Update cart item mutation
  const updateCartItemMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) => {
      if (!currentCart) throw new Error('No cart available')
      return apiClient.updateCartItem(currentCart.id, itemId, quantity, organizationId)
    },
    onSuccess: (data: CartItem) => {
      updateCartItem(data.id, data)
      queryClient.invalidateQueries({ queryKey: ['cart', currentCart?.id] })
    },
    onError: (error) => {
      console.error('Failed to update cart item:', error)
    }
  })

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: () => {
      if (!currentCart) throw new Error('No cart available')
      return apiClient.clearCart(currentCart.id, organizationId)
    },
    onSuccess: () => {
      clearCart()
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: (error) => {
      console.error('Failed to clear cart:', error)
    }
  })

  // Helper functions
  const createCart = () => {
    createCartMutation.mutate()
  }

  const addToCart = (productId: number, quantity: number = 1) => {
    if (!currentCart) {
      createCart()
      // Wait for cart creation then add item
      setTimeout(() => {
        addToCartMutation.mutate({ productId, quantity })
      }, 1000)
    } else {
      addToCartMutation.mutate({ productId, quantity })
    }
  }

  const updateItemQuantity = (itemId: number, quantity: number) => {
    updateCartItemMutation.mutate({ itemId, quantity })
  }

  const clearCartItems = () => {
    clearCartMutation.mutate()
  }

  return {
    // State
    currentCart,
    cartItems,
    cartLoading: cartLoading || cartIsLoading,
    
    // Actions
    createCart,
    addToCart,
    removeFromCart: removeFromCartMutation.mutate,
    removeFromBasket, // Alias for your naming
    updateItemQuantity,
    clearCartItems,
    
    // Mutations for loading states
    isCreatingCart: createCartMutation.isPending,
    isAddingToCart: addToCartMutation.isPending,
    isRemovingFromCart: removeFromCartMutation.isPending,
    isUpdatingItem: updateCartItemMutation.isPending,
    isClearingCart: clearCartMutation.isPending,
  }
}


