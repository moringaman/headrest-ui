'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

interface MobileNavProps {
  currentPage: string
  user?: any
  onSignOut?: () => void
  selectedOrg?: any
  organizations?: any[]
}

export default function MobileNav({ currentPage, user, onSignOut, selectedOrg, organizations }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  const getNavigationItems = () => {
    if (currentPage === 'home') {
      return [
        {
          name: 'Pricing',
          href: '/pricing',
          current: false
        },
        {
          name: 'Documentation',
          href: '/docs',
          current: false
        },
        {
          name: 'Login',
          href: '/login',
          current: false
        },
        {
          name: 'Get Started',
          href: '/signup',
          current: false
        }
      ]
    }
    
    if (currentPage === 'pricing') {
      return [
        {
          name: 'Home',
          href: '/',
          current: false
        },
        {
          name: 'Documentation',
          href: '/docs',
          current: false
        },
        {
          name: 'Login',
          href: '/login',
          current: false
        },
        {
          name: 'Get Started',
          href: '/signup',
          current: false
        }
      ]
    }
    
    if (currentPage === 'docs') {
      return [
        {
          name: 'Home',
          href: '/',
          current: false
        },
        {
          name: 'Pricing',
          href: '/pricing',
          current: false
        },
        {
          name: 'Dashboard',
          href: '/dashboard',
          current: false
        },
        {
          name: 'Store Connections',
          href: '/dashboard/stores',
          current: false
        },
        {
          name: 'API Keys',
          href: '/dashboard/api-keys',
          current: false
        }
      ]
    }
    
    if (currentPage === 'signup') {
      return [
        {
          name: 'Home',
          href: '/',
          current: false
        },
        {
          name: 'Pricing',
          href: '/pricing',
          current: false
        },
        {
          name: 'Documentation',
          href: '/docs',
          current: false
        },
        {
          name: 'Login',
          href: '/login',
          current: false
        }
      ]
    }
    
    return [
      {
        name: 'Dashboard',
        href: '/dashboard',
        current: currentPage === 'dashboard'
      },
      {
        name: 'Store Connections',
        href: `/dashboard/stores${selectedOrg ? `?selected=${selectedOrg.id}` : ''}`,
        current: currentPage === 'stores'
      },
      {
        name: 'API Keys',
        href: '/dashboard/api-keys',
        current: currentPage === 'api-keys'
      },
      {
        name: 'Documentation',
        href: '/docs',
        current: currentPage === 'docs'
      }
    ]
  }

  const navigationItems = getNavigationItems()

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <button
          type="button"
          className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-suede-primary"
          onClick={() => setIsOpen(true)}
          aria-label="Open main menu"
        >
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden ${isOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsOpen(false)} />
        
        <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <Link href="/" className="flex items-center space-x-3" onClick={() => setIsOpen(false)}>
              <Image
                src="/assets/suede-logo-transparent.png"
                alt="Headrest"
                width={120}
                height={40}
                className="h-8 w-auto"
                priority
              />
              <span className="text-xl font-bold text-suede-text">Headrest</span>
            </Link>
            <button
              type="button"
              className="rounded-md p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    item.current
                      ? 'bg-suede-primary text-white'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-suede-primary'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {user && (
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-suede-primary flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user.email}</p>
                </div>
              </div>
              
              
              {onSignOut && (
                <button
                  onClick={() => {
                    setIsOpen(false)
                    onSignOut()
                  }}
                  className="mt-3 w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-suede-primary"
                >
                  Sign out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
