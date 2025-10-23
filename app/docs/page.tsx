'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import MobileNav from '@/components/ui/mobile-nav'
import { useAuth } from '@/components/providers/auth-provider'
import { useAppStore } from '@/lib/store'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function DocsPage() {
  const { user, signOut } = useAuth()
  const { addNotification } = useAppStore()
  const [activeSection, setActiveSection] = useState('overview')

  const handleSignOut = async () => {
    try {
      await signOut()
      addNotification({
        type: 'success',
        title: 'Signed Out',
        message: 'Signed out successfully'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to sign out'
      })
    }
  }

  const sections = [
    { id: 'overview', title: 'Overview', icon: '📋' },
    { id: 'stripe', title: 'Stripe Payments', icon: '💳' },
    { id: 'api', title: 'API Reference', icon: '🔗' },
    { id: 'examples', title: 'Code Examples', icon: '💻' },
    { id: 'testing', title: 'Testing', icon: '🧪' },
    { id: 'security', title: 'Security', icon: '🔒' },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: '🆘' }
  ]

  return (
    <div className="min-h-screen bg-suede-background">
      {/* Skip Links */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-suede-primary text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>
      <a 
        href="#navigation" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-32 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to navigation
      </a>
      
      {/* Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-suede-primary focus:ring-offset-2 rounded">
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
              <span className="ml-4 text-sm text-gray-700">Documentation</span>
            </div>
            <div className="flex items-center space-x-4">
              {/* Desktop navigation - hidden on mobile */}
              <div className="hidden lg:flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
              
              {/* Mobile navigation */}
              <MobileNav 
                currentPage="docs" 
                user={user} 
                onSignOut={handleSignOut}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav id="navigation" className="space-y-2" role="navigation" aria-label="Documentation sections">
              <h2 className="sr-only">Documentation Sections</h2>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    activeSection === section.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  aria-current={activeSection === section.id ? 'page' : undefined}
                  aria-label={`Go to ${section.title} section`}
                >
                  <span className="mr-2" aria-hidden="true">{section.icon}</span>
                  {section.title}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main id="main-content" className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-8">
                {activeSection === 'overview' && <OverviewSection />}
                {activeSection === 'stripe' && <StripeSection />}
                {activeSection === 'api' && <ApiSection />}
                {activeSection === 'examples' && <ExamplesSection />}
                {activeSection === 'testing' && <TestingSection />}
                {activeSection === 'security' && <SecuritySection />}
                {activeSection === 'troubleshooting' && <TroubleshootingSection />}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function OverviewSection() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-suede-text mb-6">API Documentation</h1>
      
      <div className="prose max-w-none">
        <h2 className="text-2xl font-semibold text-suede-text mb-4">Welcome to Headrest API</h2>
        <p className="text-suede-text mb-6">
          Headrest provides a powerful REST API for integrating with your PrestaShop stores. 
          This documentation will help you get started with API integration, payment processing, and more.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-suede-background p-6 rounded-lg border border-suede-secondary">
            <h3 className="text-lg font-semibold text-suede-text mb-2">🚀 Quick Start</h3>
            <p className="text-suede-text text-sm mb-4">
              Get up and running with our API in minutes. Simple authentication and clear endpoints.
            </p>
            <Link href="#api" className="text-suede-primary hover:text-suede-accent text-sm font-medium">
              View API Reference →
            </Link>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-2">💳 Payment Integration</h3>
            <p className="text-green-700 text-sm mb-4">
              Integrate Stripe payments with your own account. Keep 100% of your revenue.
            </p>
            <Link href="#stripe" className="text-green-600 hover:text-green-700 text-sm font-medium">
              Learn More →
            </Link>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Features</h3>
        <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
          <li><strong>RESTful API:</strong> Clean, predictable endpoints</li>
          <li><strong>Authentication:</strong> Secure API key-based authentication</li>
          <li><strong>Real-time Data:</strong> Direct connection to your PrestaShop database</li>
          <li><strong>Payment Processing:</strong> Stripe integration with your own account</li>
          <li><strong>Multi-store Support:</strong> Manage multiple stores from one API</li>
          <li><strong>Comprehensive Documentation:</strong> Detailed guides and examples</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mb-4">Getting Started</h3>
        <div className="bg-gray-50 p-6 rounded-lg">
          <ol className="list-decimal list-inside text-gray-600 space-y-2">
            <li>Create an account and get your API keys</li>
            <li>Configure your PrestaShop database connection</li>
            <li>Test your connection and start making API calls</li>
            <li>Integrate payments with Stripe (optional)</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

function StripeSection() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Stripe Payment Integration</h1>
      
      <div className="prose max-w-none">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>🎯 Customer-Owned Stripe Account Model:</strong> You keep your own Stripe account and receive payments directly. No platform fees - you keep 100% of your payment revenue.
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Getting Your Stripe API Keys</h2>
        
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Step 1: Access Stripe Dashboard</h3>
          <ol className="list-decimal list-inside text-gray-600 space-y-2">
            <li>Go to <a href="https://dashboard.stripe.com" className="text-suede-primary hover:text-suede-accent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded" target="_blank" rel="noopener noreferrer" aria-label="Open Stripe Dashboard in new tab">https://dashboard.stripe.com</a></li>
            <li>Log in to your Stripe account</li>
            <li>Navigate to <strong>Developers</strong> → <strong>API Keys</strong></li>
          </ol>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Step 2: Get Your Keys</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Test Mode (Development)</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Secret Key: <code className="bg-gray-100 text-gray-900 px-2 py-1 rounded font-mono text-xs">sk_test_xxxxxxxxxxxxx</code></li>
                <li>Publishable Key: <code className="bg-gray-100 text-gray-900 px-2 py-1 rounded font-mono text-xs">pk_test_xxxxxxxxxxxxx</code></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Live Mode (Production)</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Secret Key: <code className="bg-gray-100 text-gray-900 px-2 py-1 rounded font-mono text-xs">sk_live_xxxxxxxxxxxxx</code></li>
                <li>Publishable Key: <code className="bg-gray-100 text-gray-900 px-2 py-1 rounded font-mono text-xs">pk_live_xxxxxxxxxxxxx</code></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Step 3: Base64 Encode Your Secret Key</h3>
          <SyntaxHighlighter
            language="javascript"
            style={vscDarkPlus}
            className="rounded text-sm"
            showLineNumbers={false}
          >
{`// In your frontend application
const stripeSecretKey = 'sk_test_xxxxxxxxxxxxx';
const encodedKey = btoa(stripeSecretKey); // Base64 encode
console.log(encodedKey); // Output: c2tfdGVzdF94eHh4eHh4eHh4eHh4eHh4eA==`}
          </SyntaxHighlighter>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">API Endpoints</h2>
        
        <div className="space-y-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Create Payment Intent</h3>
            <SyntaxHighlighter
              language="http"
              style={vscDarkPlus}
              className="rounded text-sm mb-4"
              showLineNumbers={false}
            >
{`POST /api/v1/payment/intent
Content-Type: application/json

{
  "order_id": 1,
  "amount": 99.99,
  "currency": "USD",
  "stripe_secret_key": "c2tfdGVzdF94eHh4eHh4eHh4eHh4eHh4eA==",
  "description": "Payment for Order #1",
  "metadata": {
    "customer_email": "customer@example.com"
  }
}`}
            </SyntaxHighlighter>
            <div className="bg-blue-50 p-4 rounded">
              <h4 className="font-semibold text-blue-900 mb-2">Response:</h4>
              <SyntaxHighlighter
                language="json"
                style={vscDarkPlus}
                className="rounded text-sm"
                showLineNumbers={false}
              >
{`{
  "payment_intent_id": "pi_1234567890",
  "client_secret": "pi_1234567890_secret_xyz",
  "status": "requires_payment_method",
  "amount": 99.99,
  "currency": "USD",
  "payment_id": 1
}`}
              </SyntaxHighlighter>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Confirm Payment</h3>
            <SyntaxHighlighter
              language="http"
              style={vscDarkPlus}
              className="rounded text-sm"
              showLineNumbers={false}
            >
{`POST /api/v1/payment/confirm
Content-Type: application/json

{
  "payment_intent_id": "pi_1234567890",
  "stripe_secret_key": "c2tfdGVzdF94eHh4eHh4eHh4eHh4eHh4eA=="
}`}
            </SyntaxHighlighter>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Process Refund</h3>
            <SyntaxHighlighter
              language="http"
              style={vscDarkPlus}
              className="rounded text-sm"
              showLineNumbers={false}
            >
{`POST /api/v1/payment/refund
Content-Type: application/json

{
  "payment_id": 1,
  "amount": 50.00,
  "stripe_secret_key": "c2tfdGVzdF94eHh4eHh4eHh4eHh4eHh4eA==",
  "reason": "requested_by_customer"
}`}
            </SyntaxHighlighter>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Stripe Integration</h3>
            <SyntaxHighlighter
              language="http"
              style={vscDarkPlus}
              className="rounded text-sm"
              showLineNumbers={false}
            >
{`POST /api/v1/payment/test
Content-Type: application/json

{
  "stripe_secret_key": "c2tfdGVzdF94eHh4eHh4eHh4eHh4eHh4eA=="
}`}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    </div>
  )
}

function ApiSection() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">API Reference</h1>
      
      <div className="prose max-w-none">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Base URL</h2>
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <code className="text-lg font-mono text-gray-900">{process.env.NEXT_PUBLIC_API_URL || 'https://prestashop-api-staging.up.railway.app'}/api/v1</code>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Authentication</h2>
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <p className="text-gray-600 mb-4">All API requests require authentication using your API key:</p>
          <SyntaxHighlighter
            language="http"
            style={vscDarkPlus}
            className="rounded text-sm"
            showLineNumbers={false}
          >
{`Authorization: Bearer YOUR_API_KEY`}
          </SyntaxHighlighter>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Available Endpoints</h2>
        
        <div className="space-y-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Products</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <code className="font-mono text-sm text-gray-900">GET /organizations/{'{org_id}'}/products</code>
                <span className="text-sm text-gray-700">Fetch all products</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <code className="font-mono text-sm text-gray-900">GET /organizations/{'{org_id}'}/products/{'{id}'}</code>
                <span className="text-sm text-gray-700">Get single product</span>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Categories</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <code className="font-mono text-sm text-gray-900">GET /organizations/{'{org_id}'}/categories</code>
                <span className="text-sm text-gray-700">Fetch all categories</span>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Customers</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <code className="font-mono text-sm text-gray-900">GET /organizations/{'{org_id}'}/customers</code>
                <span className="text-sm text-gray-700">Fetch all customers</span>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Orders</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <code className="font-mono text-sm text-gray-900">GET /organizations/{'{org_id}'}/orders</code>
                <span className="text-sm text-gray-700">Fetch all orders</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExamplesSection() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Code Examples</h1>
      
      <div className="prose max-w-none">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">JavaScript/Node.js</h2>
        <SyntaxHighlighter
          language="javascript"
          style={vscDarkPlus}
          className="rounded text-sm mb-6"
          showLineNumbers={false}
        >
{`const baseUrl = '${process.env.NEXT_PUBLIC_API_URL || 'https://prestashop-api-staging.up.railway.app'}/api/v1';

// Fetch products
const response = await fetch(\`\${baseUrl}/organizations/YOUR_ORG_ID/products\`, {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const products = await response.json();`}
        </SyntaxHighlighter>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Python</h2>
        <SyntaxHighlighter
          language="python"
          style={vscDarkPlus}
          className="rounded text-sm mb-6"
          showLineNumbers={false}
        >
{`import requests

base_url = '${process.env.NEXT_PUBLIC_API_URL || 'https://prestashop-api-staging.up.railway.app'}/api/v1'
response = requests.get(
    f'{base_url}/organizations/YOUR_ORG_ID/products',
    headers={'Authorization': 'Bearer YOUR_API_KEY'}
)
products = response.json()`}
        </SyntaxHighlighter>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">cURL</h2>
        <SyntaxHighlighter
          language="bash"
          style={vscDarkPlus}
          className="rounded text-sm mb-6"
          showLineNumbers={false}
        >
{`curl -X GET \\
  '${process.env.NEXT_PUBLIC_API_URL || 'https://prestashop-api-staging.up.railway.app'}/api/v1/organizations/YOUR_ORG_ID/products' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json'`}
        </SyntaxHighlighter>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">React Hook Example</h2>
        <SyntaxHighlighter
          language="javascript"
          style={vscDarkPlus}
          className="rounded text-sm"
          showLineNumbers={false}
        >
{`import { useState, useEffect } from 'react';

export const useProducts = (organizationId) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          \`\${baseUrl}/organizations/\${organizationId}/products\`,
          {
            headers: {
              'Authorization': \`Bearer \${API_KEY}\`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [organizationId]);

  return { products, loading, error };
};`}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

function TestingSection() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Testing</h1>
      
      <div className="prose max-w-none">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Stripe Test Cards</h2>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">Test Card Numbers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-yellow-900 mb-2">Successful Payment</h4>
              <code className="bg-gray-900 text-green-400 px-3 py-2 rounded text-sm font-mono block">4242424242424242</code>
            </div>
            <div>
              <h4 className="font-semibold text-yellow-900 mb-2">Declined Payment</h4>
              <code className="bg-gray-900 text-red-400 px-3 py-2 rounded text-sm font-mono block">4000000000000002</code>
            </div>
            <div>
              <h4 className="font-semibold text-yellow-900 mb-2">Requires Authentication</h4>
              <code className="bg-gray-900 text-yellow-400 px-3 py-2 rounded text-sm font-mono block">4000002500003155</code>
            </div>
            <div>
              <h4 className="font-semibold text-yellow-900 mb-2">3D Secure</h4>
              <code className="bg-gray-900 text-blue-400 px-3 py-2 rounded text-sm font-mono block">4000000000003220</code>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Details</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li><strong>Expiry:</strong> Any future date (e.g., 12/25)</li>
            <li><strong>CVC:</strong> Any 3 digits (e.g., 123)</li>
            <li><strong>ZIP:</strong> Any 5 digits (e.g., 12345)</li>
          </ul>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">API Testing</h2>
        
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Your API Key</h3>
          <SyntaxHighlighter
            language="javascript"
            style={vscDarkPlus}
            className="rounded text-sm"
            showLineNumbers={false}
          >
{`// Test your API key
const response = await fetch('${process.env.NEXT_PUBLIC_API_URL || 'https://prestashop-api-staging.up.railway.app'}/api/v1/products', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

if (response.ok) {
  console.log('API key is valid!');
} else {
  console.error('API key is invalid');
}`}
          </SyntaxHighlighter>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Stripe Integration</h3>
          <SyntaxHighlighter
            language="javascript"
            style={vscDarkPlus}
            className="rounded text-sm"
            showLineNumbers={false}
          >
{`// Test Stripe key
const testResponse = await fetch('/api/v1/payment/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    stripe_secret_key: btoa('sk_test_xxxxxxxxxxxxx')
  })
});

console.log('Stripe test result:', await testResponse.json());`}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  )
}

function SecuritySection() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Security Best Practices</h1>
      
      <div className="prose max-w-none">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Environment Variables</h2>
        
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Frontend (.env.local)</h3>
          <SyntaxHighlighter
            language="bash"
            style={vscDarkPlus}
            className="rounded text-sm"
            showLineNumbers={false}
          >
{`REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
REACT_APP_STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
REACT_APP_API_KEY=your_api_key_here`}
          </SyntaxHighlighter>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Backend (.env)</h3>
          <SyntaxHighlighter
            language="bash"
            style={vscDarkPlus}
            className="rounded text-sm"
            showLineNumbers={false}
          >
{`STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
API_SECRET_KEY=your_secret_key_here`}
          </SyntaxHighlighter>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Security Checklist</h2>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Never Commit Keys to Git</h3>
              <p className="text-gray-600 text-sm">Always use .gitignore to exclude environment files</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Use HTTPS Only</h3>
              <p className="text-gray-600 text-sm">Stripe requires HTTPS for live payments</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Rotate Keys Regularly</h3>
              <p className="text-gray-600 text-sm">Change keys if compromised and use different keys for test/production</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Monitor Key Usage</h3>
              <p className="text-gray-600 text-sm">Check Stripe Dashboard for unusual activity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TroubleshootingSection() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Troubleshooting</h1>
      
      <div className="prose max-w-none">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Common Error Scenarios</h2>
        
        <div className="space-y-6">
          <div className="border border-red-200 rounded-lg p-6 bg-red-50">
            <h3 className="text-lg font-semibold text-red-900 mb-3">Invalid Stripe Key</h3>
            <SyntaxHighlighter
              language="json"
              style={vscDarkPlus}
              className="rounded text-sm mb-4"
              showLineNumbers={false}
            >
{`{
  "statusCode": 400,
  "message": "Invalid encoded Stripe key",
  "error": "Bad Request"
}`}
            </SyntaxHighlighter>
            <div className="text-red-700">
              <strong>Solution:</strong> Ensure key is properly base64 encoded using <code className="bg-red-100 px-2 py-1 rounded text-sm">btoa()</code> in JavaScript
            </div>
          </div>

          <div className="border border-yellow-200 rounded-lg p-6 bg-yellow-50">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">Order Not Found</h3>
            <SyntaxHighlighter
              language="json"
              style={vscDarkPlus}
              className="rounded text-sm mb-4"
              showLineNumbers={false}
            >
{`{
  "statusCode": 404,
  "message": "Order not found",
  "error": "Not Found"
}`}
            </SyntaxHighlighter>
            <div className="text-yellow-700">
              <strong>Solution:</strong> Verify order ID exists in your PrestaShop database
            </div>
          </div>

          <div className="border border-red-200 rounded-lg p-6 bg-red-50">
            <h3 className="text-lg font-semibold text-red-900 mb-3">Payment Failed</h3>
            <SyntaxHighlighter
              language="json"
              style={vscDarkPlus}
              className="rounded text-sm mb-4"
              showLineNumbers={false}
            >
{`{
  "statusCode": 400,
  "message": "Payment failed",
  "error": "Bad Request"
}`}
            </SyntaxHighlighter>
            <div className="text-red-700">
              <strong>Solution:</strong> Check Stripe Dashboard for detailed error logs
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Debug Steps</h2>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <ol className="list-decimal list-inside text-gray-600 space-y-2">
            <li>Test Stripe key with <code>/payment/test</code> endpoint</li>
            <li>Check order exists in PrestaShop database</li>
            <li>Verify base64 encoding of secret key</li>
            <li>Check Stripe Dashboard for detailed logs</li>
            <li>Test with Stripe test cards first</li>
          </ol>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Getting Help</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">API Documentation</h3>
            <p className="text-blue-700 text-sm mb-4">
              Visit the interactive API documentation for detailed endpoint information.
            </p>
            <Link href="#api" className="text-suede-primary hover:text-suede-accent text-sm font-medium">
              View API Reference →
            </Link>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Stripe Documentation</h3>
            <p className="text-green-700 text-sm mb-4">
              Comprehensive Stripe integration guides and troubleshooting.
            </p>
            <a 
              href="https://stripe.com/docs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded text-sm font-medium"
              aria-label="Open Stripe Documentation in new tab"
            >
              Visit Stripe Docs →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
