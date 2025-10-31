'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import MobileNav from '@/components/ui/mobile-nav'
import { useAuth } from '@/components/providers/auth-provider'
import { useAppStore } from '@/lib/store'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  apiClient, 
  type ApiKey, 
  type CreateApiKeyData, 
  type UpdateApiKeyData
} from '@/lib/api'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function ApiKeysPage() {
  const { user, session } = useAuth()
  const { addNotification } = useAppStore()
  const queryClient = useQueryClient()
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null)
  const [createdApiKey, setCreatedApiKey] = useState<ApiKey | null>(null)
  const [showAdvancedExamples, setShowAdvancedExamples] = useState(false)
  const [viewingApiKey, setViewingApiKey] = useState<ApiKey | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [testApiKeyInput, setTestApiKeyInput] = useState('')
  const [showTestApiKey, setShowTestApiKey] = useState(false)

  // Fetch API keys
  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => apiClient.getApiKeys(session?.access_token),
    enabled: !!session?.access_token,
  })

  // Create API key mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateApiKeyData) =>
      apiClient.createApiKey(data, session?.access_token),
    onSuccess: (data: ApiKey) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      setCreatedApiKey(data)
      setIsCreateModalOpen(false)
      addNotification({
        type: 'success',
        title: 'API Key Created',
        message: 'Your new API key has been created successfully. Save it securely - it won\'t be shown again!'
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to Create API Key',
        message: `Error: ${error.message}`
      })
    }
  })

  // Update API key mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateApiKeyData }) => 
      apiClient.updateApiKey(id, data, session?.access_token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      setIsEditModalOpen(false)
      setSelectedApiKey(null)
      addNotification({
        type: 'success',
        title: 'API Key Updated',
        message: 'API key has been updated successfully'
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to Update API Key',
        message: `Error: ${error.message}`
      })
    }
  })

  // Revoke API key mutation
  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiClient.revokeApiKey(id, session?.access_token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      addNotification({
        type: 'success',
        title: 'API Key Revoked',
        message: 'API key has been revoked successfully'
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to Revoke API Key',
        message: `Error: ${error.message}`
      })
    }
  })

  // Delete API key mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteApiKey(id, session?.access_token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      addNotification({
        type: 'success',
        title: 'API Key Deleted',
        message: 'API key has been deleted successfully'
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to Delete API Key',
        message: `Error: ${error.message}`
      })
    }
  })

  // Test API key mutation
  const testMutation = useMutation({
    mutationFn: ({ apiKey, organizationId }: { apiKey: string, organizationId?: string }) => 
      apiClient.testApiKey(apiKey, organizationId),
    onSuccess: (data) => {
      addNotification({
        type: 'success',
        title: 'API Key Test Successful',
        message: `API key is working! Retrieved ${Array.isArray(data) ? data.length : 'some'} products.`
      })
      // Clear the input on success
      setTestApiKeyInput('')
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'API Key Test Failed',
        message: `Error: ${error.message}`
      })
    }
  })

  const handleEdit = (apiKey: ApiKey) => {
    setSelectedApiKey(apiKey)
    setIsEditModalOpen(true)
  }

  const handleView = (apiKey: ApiKey) => {
    setViewingApiKey(apiKey)
    setIsViewModalOpen(true)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      addNotification({
        type: 'success',
        title: 'Copied to Clipboard',
        message: 'API key copied to clipboard successfully!'
      })
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Copy Failed',
        message: 'Failed to copy API key to clipboard. Please copy it manually.'
      })
    }
  }

  const handleRevoke = (id: string) => {
    if (confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      revokeMutation.mutate(id)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  const handleTestApiKey = (apiKey: string) => {
    if (!apiKey || !apiKey.trim()) {
      addNotification({
        type: 'error',
        title: 'Test Failed',
        message: 'Please enter an API key to test.'
      })
      return
    }
    testMutation.mutate({ apiKey: apiKey.trim() })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-800/50 rounded border border-gray-700"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded">
                <Image
                  src="/assets/suede-logo-transparent.png"
                  alt="Headrest"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                  priority
                />
                <span className="text-xl font-bold text-white">Headrest</span>
              </Link>
              <div className="h-6 w-px bg-gray-700"></div>
              <div>
                <h1 className="text-3xl font-bold text-white">API Keys</h1>
                <p className="mt-2 text-gray-400">
                  Manage your API keys for secure access to your PrestaShop data
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Desktop button - hidden on mobile */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="hidden lg:block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create API Key
              </button>

              {/* Mobile navigation */}
              <MobileNav
                currentPage="api-keys"
                user={user}
              />
            </div>
          </div>

          {/* Navigation - hidden on mobile */}
          <nav className="mt-6 hidden lg:block">
            <div className="flex space-x-8">
              <Link
                href="/dashboard"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/stores"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Manage Stores
              </Link>
              <Link
                href="/dashboard/api-keys"
                className="text-blue-400 font-medium"
              >
                API Keys
              </Link>
              <Link
                href="/dashboard/auth-settings"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Auth Settings
              </Link>
            </div>
          </nav>
        </div>

        {/* Test API Key Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Test API Key</h2>
          <p className="text-gray-400 mb-4">
            Paste your API key below to test if it's working correctly.
          </p>

          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                type={showTestApiKey ? "text" : "password"}
                placeholder="Paste your API key here..."
                value={testApiKeyInput}
                onChange={(e) => setTestApiKeyInput(e.target.value)}
                className="w-full px-3 py-2 pr-10 bg-gray-900/50 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowTestApiKey(!showTestApiKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showTestApiKey ? (
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <button
              onClick={() => handleTestApiKey(testApiKeyInput)}
              disabled={!testApiKeyInput.trim() || testMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {testMutation.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Test Key</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* API Keys List */}
        <div className="space-y-4 mb-8">
          {apiKeys && apiKeys.length > 0 ? (
            apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-white">{apiKey.name}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 border border-green-500/20 text-green-400">
                        Active
                      </span>
                    </div>

                    {apiKey.description && (
                      <p className="mt-1 text-sm text-gray-400">{apiKey.description}</p>
                    )}

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-300">API Key:</span>
                        <div className="mt-1 flex items-center space-x-2">
                          <code className="bg-gray-900 border border-gray-700 px-2 py-1 rounded text-xs font-mono text-green-400 truncate flex-1">
                            {apiKey.key ? apiKey.key : '••••••••••••••••••••••••••••••••'}
                          </code>
                          {apiKey.key && (
                            <button
                              onClick={() => copyToClipboard(apiKey.key!)}
                              className="text-gray-400 hover:text-white p-1"
                              title="Copy to clipboard"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleView(apiKey)}
                            className="text-blue-400 hover:text-blue-300 p-1"
                            title="View API key details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="font-medium text-gray-300">Created:</span>
                        <p className="mt-1 text-gray-400">
                          {new Date(apiKey.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <span className="font-medium text-gray-300">Last Used:</span>
                        <p className="mt-1 text-gray-400">
                          {apiKey.last_used_at
                            ? new Date(apiKey.last_used_at).toLocaleDateString()
                            : 'Never'
                          }
                        </p>
                      </div>
                    </div>

                    {apiKey.expires_at && (
                      <div className="mt-3">
                        <span className="font-medium text-gray-300">Expires:</span>
                        <p className="mt-1 text-sm text-gray-400">
                          {new Date(apiKey.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleTestApiKey(apiKey.key || '')}
                      disabled={!apiKey.key || testMutation.isPending}
                      className="text-green-400 hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={apiKey.key ? "Test API key" : "Cannot test - key not available"}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>

                    <button
                      onClick={() => handleEdit(apiKey)}
                      className="text-gray-400 hover:text-white"
                      title="Edit API key"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    <button
                      onClick={() => handleRevoke(apiKey.id)}
                      disabled={revokeMutation.isPending}
                      className="text-yellow-400 hover:text-yellow-300 disabled:opacity-50"
                      title="Revoke API key"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                      </svg>
                    </button>

                    <button
                      onClick={() => handleDelete(apiKey.id)}
                      disabled={deleteMutation.isPending}
                      className="text-red-400 hover:text-red-300 disabled:opacity-50"
                      title="Delete API key"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-white">No API Keys</h3>
              <p className="mt-2 text-gray-400">
                Get started by creating your first API key to access your PrestaShop data programmatically.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create API Key
              </button>
            </div>
          )}
        </div>

        {/* Use Cases and Code Snippets */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Use Cases & Code Examples</h2>
          <p className="text-gray-400 mb-6">
            Learn how to use your API keys with these practical examples and code snippets.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* JavaScript/Node.js Example */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">JavaScript/Node.js</h3>
              <div className="rounded-lg overflow-hidden">
                <SyntaxHighlighter
                  language="javascript"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                >
                  {`// Fetch products using API key
const response = await fetch(
  'https://api.headlessshop.com/organizations/org-id/products',
  {
    headers: {
      'x-api-key': 'hs_live_your_api_key_here'
    }
  }
);

const products = await response.json();
console.log('Products:', products);

// Get database credentials
const credentials = await fetch(
  'https://api.headlessshop.com/organizations/me/credentials',
  {
    headers: {
      'x-api-key': 'hs_live_your_api_key_here'
    }
  }
);

const dbConfig = await credentials.json();`}
                </SyntaxHighlighter>
              </div>
            </div>

            {/* Python Example */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Python</h3>
              <div className="rounded-lg overflow-hidden">
                <SyntaxHighlighter
                  language="python"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                >
                  {`import requests

# Fetch products using API key
headers = {
    'x-api-key': 'hs_live_your_api_key_here'
}

response = requests.get(
    'https://api.headlessshop.com/organizations/org-id/products',
    headers=headers
)

products = response.json()
print(f"Found {len(products)} products")

# Get organization info
org_response = requests.get(
    'https://api.headlessshop.com/organizations/me',
    headers=headers
)

org_data = org_response.json()`}
                </SyntaxHighlighter>
              </div>
            </div>

            {/* PHP Example */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">PHP</h3>
              <div className="rounded-lg overflow-hidden">
                <SyntaxHighlighter
                  language="php"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                >
                  {`<?php
// Fetch products using API key
$apiKey = 'hs_live_your_api_key_here';
$headers = [
    'x-api-key: ' . $apiKey,
    'Content-Type: application/json'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 
    'https://api.headlessshop.com/organizations/org-id/products'
);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$products = json_decode($response, true);
curl_close($ch);

echo "Found " . count($products) . " products";
?>`}
                </SyntaxHighlighter>
              </div>
            </div>

            {/* cURL Example */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">cURL</h3>
              <div className="rounded-lg overflow-hidden">
                <SyntaxHighlighter
                  language="bash"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                >
                  {`# Fetch products
curl -X GET \\
  "https://api.headlessshop.com/organizations/org-id/products" \\
  -H "x-api-key: hs_live_your_api_key_here"

# Get database credentials
curl -X GET \\
  "https://api.headlessshop.com/organizations/me/credentials" \\
  -H "x-api-key: hs_live_your_api_key_here"

# Get usage statistics
curl -X GET \\
  "https://api.headlessshop.com/api/v1/usage" \\
  -H "x-api-key: hs_live_your_api_key_here"`}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>

          {/* Common Use Cases */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-white mb-4">Common Use Cases</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <h4 className="font-medium text-blue-400">Mobile Apps</h4>
                </div>
                <p className="text-sm text-blue-300/80">
                  Use API keys to fetch products and manage orders in your mobile applications.
                </p>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <h4 className="font-medium text-green-400">Data Sync</h4>
                </div>
                <p className="text-sm text-green-300/80">
                  Automate product synchronization between systems using scheduled API calls.
                </p>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h4 className="font-medium text-purple-400">Analytics</h4>
                </div>
                <p className="text-sm text-purple-300/80">
                  Monitor API usage and track performance with the usage statistics endpoint.
                </p>
              </div>
            </div>
          </div>

          {/* Security Best Practices */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-white mb-4">Security Best Practices</h3>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-400">Important Security Tips</h4>
                  <div className="mt-2 text-sm text-yellow-300/80">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Never expose API keys in frontend JavaScript code</li>
                      <li>Store keys securely in environment variables</li>
                      <li>Use different keys for different services</li>
                      <li>Set expiration dates for temporary access</li>
                      <li>Monitor usage and revoke unused keys</li>
                      <li>Rotate keys regularly for enhanced security</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Examples */}
          <div className="mt-8">
            <button
              onClick={() => setShowAdvancedExamples(!showAdvancedExamples)}
              className="flex items-center text-lg font-medium text-white hover:text-blue-400 transition-colors"
            >
              <svg
                className={`w-5 h-5 mr-2 transition-transform ${showAdvancedExamples ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Advanced Examples
            </button>

            {showAdvancedExamples && (
              <div className="mt-4 space-y-6">
                {/* React Hook Example */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-white">React Custom Hook</h4>
                  <div className="rounded-lg overflow-hidden">
                    <SyntaxHighlighter
                      language="javascript"
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      {`// hooks/usePrestaShopAPI.js
import { useState, useEffect } from 'react';

export const usePrestaShopAPI = (apiKey, organizationId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (endpoint) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        \`https://api.headlessshop.com/organizations/\${organizationId}/\${endpoint}\`,
        {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchData };
};

// Usage in component
const MyComponent = () => {
  const { data: products, loading, error, fetchData } = usePrestaShopAPI(
    'hs_live_your_api_key',
    'your-org-id'
  );

  useEffect(() => {
    fetchData('products');
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {products?.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
};`}
                    </SyntaxHighlighter>
                  </div>
                </div>

                {/* Node.js Service Class */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-white">Node.js Service Class</h4>
                  <div className="rounded-lg overflow-hidden">
                    <SyntaxHighlighter
                      language="javascript"
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      {`// services/PrestaShopService.js
class PrestaShopService {
  constructor(apiKey, organizationId, baseUrl = 'https://api.headlessshop.com') {
    this.apiKey = apiKey;
    this.organizationId = organizationId;
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = \`\${this.baseUrl}/organizations/\${this.organizationId}/\${endpoint}\`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(\`API request failed: \${response.statusText}\`);
    }

    return response.json();
  }

  async getProducts(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(\`products?\${params}\`);
  }

  async getProduct(id) {
    return this.request(\`products/\${id}\`);
  }

  async getOrganizationInfo() {
    return this.request('..', {
      method: 'GET',
      url: \`\${this.baseUrl}/organizations/me\`
    });
  }

  async getCredentials() {
    return this.request('..', {
      method: 'GET',
      url: \`\${this.baseUrl}/organizations/me/credentials\`
    });
  }
}

// Usage
const prestaShop = new PrestaShopService(
  'hs_live_your_api_key',
  'your-org-id'
);

// Get all products
const products = await prestaShop.getProducts();

// Get specific product
const product = await prestaShop.getProduct('123');

// Get organization info
const orgInfo = await prestaShop.getOrganizationInfo();`}
                    </SyntaxHighlighter>
                  </div>
                </div>

                {/* Webhook Integration */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-white">Webhook Integration</h4>
                  <div className="rounded-lg overflow-hidden">
                    <SyntaxHighlighter
                      language="javascript"
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      {`// webhook-handler.js
const express = require('express');
const PrestaShopService = require('./services/PrestaShopService');

const app = express();
app.use(express.json());

const prestaShop = new PrestaShopService(
  process.env.PRESHASHOP_API_KEY,
  process.env.ORGANIZATION_ID
);

// Webhook endpoint to sync products
app.post('/webhook/product-update', async (req, res) => {
  try {
    const { productId, action } = req.body;
    
    if (action === 'updated') {
      // Fetch updated product data
      const product = await prestaShop.getProduct(productId);
      
      // Update your local database
      await updateLocalProduct(product);
      
      // Log the update
      console.log(\`Product \${productId} updated successfully\`);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Scheduled sync job
const cron = require('node-cron');

// Run every hour
cron.schedule('0 * * * *', async () => {
  try {
    console.log('Starting scheduled product sync...');
    
    const products = await prestaShop.getProducts();
    await syncProductsToLocal(products);
    
    console.log(\`Synced \${products.length} products\`);
  } catch (error) {
    console.error('Scheduled sync error:', error);
  }
});`}
                    </SyntaxHighlighter>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* Create API Key Modal */}
        {isCreateModalOpen && (
          <CreateApiKeyModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
          />
        )}

        {/* Edit API Key Modal */}
        {isEditModalOpen && selectedApiKey && (
          <EditApiKeyModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false)
              setSelectedApiKey(null)
            }}
            onSubmit={(data) => updateMutation.mutate({ id: selectedApiKey.id, data })}
            isLoading={updateMutation.isPending}
            apiKey={selectedApiKey}
          />
        )}

        {/* Created API Key Modal */}
        {createdApiKey && (
          <CreatedApiKeyModal
            isOpen={!!createdApiKey}
            onClose={() => setCreatedApiKey(null)}
            apiKey={createdApiKey}
          />
        )}

        {/* View API Key Modal */}
        {viewingApiKey && (
          <ViewApiKeyModal
            isOpen={!!viewingApiKey}
            onClose={() => setViewingApiKey(null)}
            apiKey={viewingApiKey}
          />
        )}
      </div>
    </div>
  )
}

// Create API Key Modal Component
function CreateApiKeyModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateApiKeyData) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState<CreateApiKeyData>({
    name: '',
    description: '',
    expires_at: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white">Create API Key</h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
              placeholder="e.g., Mobile App Key"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
              placeholder="Optional description of what this API key is used for"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Expiration Date
            </label>
            <input
              type="datetime-local"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
          </div>
        </form>

        <div className="px-6 py-4 bg-gray-800/30 border-t border-gray-700 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-300 bg-gray-900/50 border border-gray-600 rounded-md hover:bg-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Creating...' : 'Create API Key'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Edit API Key Modal Component
function EditApiKeyModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  apiKey,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: UpdateApiKeyData) => void
  isLoading: boolean
  apiKey: ApiKey
}) {
  const [formData, setFormData] = useState<UpdateApiKeyData>({
    name: apiKey.name,
    description: apiKey.description || '',
    expires_at: apiKey.expires_at || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  if (!isOpen) return null


  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white">Edit API Key</h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Expiration Date
            </label>
            <input
              type="datetime-local"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
          </div>
        </form>

        <div className="px-6 py-4 bg-gray-800/30 border-t border-gray-700 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-300 bg-gray-900/50 border border-gray-600 rounded-md hover:bg-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Updating...' : 'Update API Key'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Created API Key Modal Component
function CreatedApiKeyModal({
  isOpen,
  onClose,
  apiKey,
}: {
  isOpen: boolean
  onClose: () => void
  apiKey: ApiKey
}) {
  const { addNotification } = useAppStore()
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(apiKey.key || '')
      setCopied(true)
      addNotification({
        type: 'success',
        title: 'Copied to Clipboard',
        message: 'API key copied to clipboard successfully!'
      })
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Copy Failed',
        message: 'Failed to copy API key to clipboard. Please copy it manually.'
      })
    }
  }

  if (!isOpen) return null


  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-white">API Key Created Successfully</h3>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-400">
                  API Key Created
                </h3>
                <div className="mt-2 text-sm text-blue-300/80">
                  <p>Your API key has been created successfully. You can view and copy it anytime from the API Keys page.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Name
              </label>
              <p className="text-sm text-white">{apiKey.name}</p>
            </div>

            {apiKey.description && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <p className="text-sm text-white">{apiKey.description}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                API Key
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-gray-900 border border-gray-700 px-3 py-2 rounded text-sm font-mono break-all text-green-400">
                  {apiKey.key}
                </code>
                <button
                  onClick={copyToClipboard}
                  disabled={copied}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    copied
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-800/30 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

// View API Key Modal Component
function ViewApiKeyModal({
  isOpen,
  onClose,
  apiKey,
}: {
  isOpen: boolean
  onClose: () => void
  apiKey: ApiKey
}) {
  const { addNotification } = useAppStore()
  const [copied, setCopied] = useState(false)

  // Test API key mutation for the modal
  const testMutation = useMutation({
    mutationFn: ({ apiKey, organizationId }: { apiKey: string, organizationId?: string }) => 
      apiClient.testApiKey(apiKey, organizationId),
    onSuccess: (data) => {
      addNotification({
        type: 'success',
        title: 'API Key Test Successful',
        message: `API key is working! Retrieved ${Array.isArray(data) ? data.length : 'some'} products.`
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'API Key Test Failed',
        message: `Error: ${error.message}`
      })
    }
  })

  const handleTestApiKey = (apiKey: string) => {
    if (!apiKey) {
      addNotification({
        type: 'error',
        title: 'Test Failed',
        message: 'Cannot test API key - key is not available.'
      })
      return
    }
    testMutation.mutate({ apiKey })
  }

  // No need to fetch individual API key - the list endpoint returns full details

  const copyToClipboard = async () => {
    if (!apiKey.key) {
      addNotification({
        type: 'error',
        title: 'Copy Failed',
        message: 'API key is not available. Keys are only shown once when created.'
      })
      return
    }
    
    try {
      await navigator.clipboard.writeText(apiKey.key)
      setCopied(true)
      addNotification({
        type: 'success',
        title: 'Copied to Clipboard',
        message: 'API key copied to clipboard successfully!'
      })
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Copy Failed',
        message: 'Failed to copy API key to clipboard. Please copy it manually.'
      })
    }
  }

  if (!isOpen) return null


  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-white">View API Key</h3>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Name
              </label>
              <p className="text-sm text-white">{apiKey.name}</p>
            </div>

            {apiKey.description && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <p className="text-sm text-white">{apiKey.description}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                API Key
              </label>
              {apiKey.key ? (
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-gray-900 border border-gray-700 px-3 py-2 rounded text-sm font-mono break-all text-green-400">
                    {apiKey.key}
                  </code>
                  <button
                    onClick={copyToClipboard}
                    disabled={copied}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      copied
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => handleTestApiKey(apiKey.key!)}
                    disabled={testMutation.isPending}
                    className="px-3 py-2 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Test API key"
                  >
                    {testMutation.isPending ? 'Testing...' : 'Test'}
                  </button>
                </div>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-400">
                        API Key Not Available
                      </h3>
                      <div className="mt-2 text-sm text-yellow-300/80">
                        <p>For security reasons, API keys are only shown once when created. If you need to use this key, you'll need to create a new one.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Created
                </label>
                <p className="text-white">
                  {new Date(apiKey.created_at).toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Last Used
                </label>
                <p className="text-white">
                  {apiKey.last_used_at
                    ? new Date(apiKey.last_used_at).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>

            {apiKey.expires_at && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Expires
                </label>
                <p className="text-white">
                  {new Date(apiKey.expires_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-800/30 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
