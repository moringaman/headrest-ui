'use client'

import { useState } from 'react'
import { useCart } from '@/lib/use-cart'
import { CartItem } from '@/types'

interface CartProps {
  organizationId?: string
  className?: string
}

export function Cart({ organizationId, className = '' }: CartProps) {
  const {
    currentCart,
    cartItems,
    cartLoading,
    removeFromBasket,
    updateItemQuantity,
    clearCartItems,
    isRemovingFromCart,
    isUpdatingItem,
    isClearingCart
  } = useCart(organizationId)

  const [removingItem, setRemovingItem] = useState<number | null>(null)

  const handleRemoveItem = async (itemId: number) => {
    setRemovingItem(itemId)
    try {
      await removeFromBasket(itemId)
    } catch (error) {
      console.error('Failed to remove item:', error)
    } finally {
      setRemovingItem(null)
    }
  }

  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId)
      return
    }
    try {
      await updateItemQuantity(itemId, newQuantity)
    } catch (error) {
      console.error('Failed to update quantity:', error)
    }
  }

  const handleClearCart = async () => {
    if (confirm('Are you sure you want to clear all items from your cart?')) {
      try {
        await clearCartItems()
      } catch (error) {
        console.error('Failed to clear cart:', error)
      }
    }
  }

  if (cartLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-suede-primary"></div>
          <span className="ml-3 text-gray-600">Loading cart...</span>
        </div>
      </div>
    )
  }

  if (!currentCart || cartItems.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Cart</h3>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"></path>
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
          <p className="mt-1 text-sm text-gray-500">Start adding some products to your cart.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Your Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
          </h3>
          {cartItems.length > 0 && (
            <button
              onClick={handleClearCart}
              disabled={isClearingCart}
              className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              {isClearingCart ? 'Clearing...' : 'Clear Cart'}
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {cartItems.map((item) => (
          <CartItemComponent
            key={item.id}
            item={item}
            onRemove={() => handleRemoveItem(item.id)}
            onQuantityChange={(quantity) => handleQuantityChange(item.id, quantity)}
            isRemoving={removingItem === item.id}
            isUpdating={isUpdatingItem}
          />
        ))}
      </div>

      <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">
            Total: ${cartItems.reduce((total, item) => total + (item.quantity * 0), 0).toFixed(2)}
          </span>
          <button className="bg-suede-primary hover:bg-suede-accent text-white px-6 py-2 rounded-md font-medium">
            Checkout
          </button>
        </div>
      </div>
    </div>
  )
}

interface CartItemComponentProps {
  item: CartItem
  onRemove: () => void
  onQuantityChange: (quantity: number) => void
  isRemoving: boolean
  isUpdating: boolean
}

function CartItemComponent({ 
  item, 
  onRemove, 
  onQuantityChange, 
  isRemoving, 
  isUpdating 
}: CartItemComponentProps) {
  const [quantity, setQuantity] = useState(item.quantity)

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity)
    onQuantityChange(newQuantity)
  }

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">
            Product ID: {item.product_id}
          </h4>
          <p className="text-sm text-gray-500">
            Added: {new Date(item.date_add).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={isUpdating || quantity <= 1}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
            >
              -
            </button>
            <span className="w-8 text-center text-sm font-medium">
              {quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={isUpdating}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
            >
              +
            </button>
          </div>

          <button
            onClick={onRemove}
            disabled={isRemoving}
            className="text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            {isRemoving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}


