import Link from 'next/link'
import Image from 'next/image'
import MobileNav from '@/components/ui/mobile-nav'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-suede-background shadow-sm border-b border-suede-secondary relative z-20" role="navigation" aria-label="Main navigation">
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
            </div>
            <div className="flex items-center space-x-4">
              {/* Desktop navigation - hidden on mobile */}
              <div className="hidden lg:flex items-center space-x-4">
                <Link 
                  href="/pricing" 
                  className="text-suede-text hover:text-suede-accent focus:outline-none focus:ring-2 focus:ring-suede-primary focus:ring-offset-2 rounded px-2 py-1"
                  aria-label="View pricing plans"
                >
                  Pricing
                </Link>
                <Link 
                  href="/docs" 
                  className="text-suede-text hover:text-suede-accent focus:outline-none focus:ring-2 focus:ring-suede-primary focus:ring-offset-2 rounded px-2 py-1"
                  aria-label="View documentation"
                >
                  Docs
                </Link>
                <Link 
                  href="/login" 
                  className="text-suede-text hover:text-suede-accent focus:outline-none focus:ring-2 focus:ring-suede-primary focus:ring-offset-2 rounded px-2 py-1"
                  aria-label="Sign in to your account"
                >
                  Login
                </Link>
                <Link 
                  href="/signup" 
                  className="bg-suede-primary text-white px-4 py-2 rounded-md hover:bg-suede-accent focus:outline-none focus:ring-2 focus:ring-suede-primary focus:ring-offset-2 transition-colors"
                  aria-label="Get started with Headrest"
                >
                  Get Started
                </Link>
              </div>
              
              {/* Mobile navigation */}
              <MobileNav 
                currentPage="home" 
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background */}
      <div className="relative overflow-hidden">
        {/* High-Quality Background Image */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/assets/suede-hero-banner.webp"
            alt="Headrest background"
            fill
            className="object-cover object-top"
            priority
            quality={95}
            sizes="100vw"
          />
          <div className="absolute inset-0">
            <picture>
              <source srcSet="/assets/suede-hero-banner.webp" type="image/webp" />
              <img
                src="/assets/suede-hero-banner.png"
                alt="Headrest background"
                className="w-full h-full object-cover object-top"
              />
            </picture>
          </div>
        </div>
        
        {/* Reduced overlay for better background visibility */}
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-suede-text mb-6">
            Stop fighting with PrestaShop's outdated Webservice
          </h1>
          <p className="text-xl text-suede-text mb-8 max-w-4xl mx-auto leading-relaxed">
            Headrest is the modern, lightning-fast, and secure API built specifically to power modern headless commerce storefronts, delivering only the data you need, instantly.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link 
              href="/signup"
              className="bg-suede-primary text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-suede-accent focus:outline-none focus:ring-2 focus:ring-suede-primary focus:ring-offset-2 transition-colors"
              aria-label="Start your free trial"
            >
              Start Free Trial
            </Link>
            <Link 
              href="/demo"
              className="border border-suede-primary text-suede-primary px-8 py-3 rounded-lg text-lg font-semibold hover:bg-suede-background focus:outline-none focus:ring-2 focus:ring-suede-primary focus:ring-offset-2 transition-colors"
              aria-label="View product demo"
            >
              View Demo
            </Link>
          </div>

          {/* Live API Badge */}
          <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            Live API serving 500+ products across 25+ active stores
          </div>
        </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-gradient-to-br from-suede-background to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-suede-text mb-4">Why Choose Headrest?</h2>
            <p className="text-xl text-suede-text max-w-3xl mx-auto">Transform your PrestaShop store with modern technology that delivers exceptional performance and developer experience.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Speed Feature */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-suede-secondary hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-suede-primary to-suede-accent rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-suede-text mb-4">10x Faster Performance</h3>
              <p className="text-suede-text text-lg leading-relaxed mb-4">React frontends load 10x faster than traditional PrestaShop themes, delivering lightning-fast user experiences that convert better.</p>
              <div className="flex items-center text-suede-primary font-semibold">
                <span className="text-2xl font-bold mr-2">10x</span>
                <span>Faster Load Times</span>
              </div>
            </div>

            {/* Data Feature */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-suede-secondary hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-suede-secondary to-suede-accent rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-suede-text mb-4">Zero Migration Risk</h3>
              <p className="text-suede-text text-lg leading-relaxed mb-4">Keep your existing PrestaShop database and data exactly where it is. No migration, no data loss, no downtime.</p>
              <div className="flex items-center text-suede-secondary font-semibold">
                <span className="text-2xl font-bold mr-2">0</span>
                <span>Migration Required</span>
              </div>
            </div>

            {/* Developer Feature */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-suede-secondary hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-suede-accent to-suede-primary rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-suede-text mb-4">Developer First</h3>
              <p className="text-suede-text text-lg leading-relaxed mb-4">Built for developers with RESTful APIs, TypeScript support, comprehensive documentation, and modern tooling.</p>
              <div className="flex items-center text-suede-accent font-semibold">
                <span className="text-2xl font-bold mr-2">100%</span>
                <span>TypeScript Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Pricing Preview */}
        <div className="bg-suede-background py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-suede-text mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-suede-text mb-8">Start free, scale as you grow</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Hobby */}
            <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-suede-primary">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold mb-2 text-suede-text">Hobby</h3>
                <div className="text-3xl font-bold text-suede-primary mb-1">$4.99<span className="text-sm text-suede-text">/mo</span></div>
                <p className="text-sm text-suede-primary font-medium">FREE first month 🎁</p>
              </div>
              <ul className="text-left space-y-2 text-sm text-suede-text">
                <li>✓ 1 PrestaShop store</li>
                <li>✓ 1,000 API calls/month</li>
                <li>✓ 1 React template</li>
                <li>✓ Community support</li>
                <li>✓ SSL included</li>
              </ul>
            </div>

            {/* Starter */}
            <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-suede-primary relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-suede-primary text-white px-3 py-1 rounded-full text-xs">
                Popular
              </div>
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold mb-2 text-suede-text">Starter</h3>
                <div className="text-3xl font-bold text-suede-primary mb-1">$19<span className="text-sm text-suede-text">/mo</span></div>
                <p className="text-sm text-suede-secondary line-through">$29/mo</p>
              </div>
              <ul className="text-left space-y-2 text-sm text-suede-text">
                <li>✓ 1 PrestaShop store</li>
                <li>✓ 10,000 API calls/month</li>
                <li>✓ 3 React templates</li>
                <li>✓ Email support (48hr)</li>
                <li>✓ Custom domain</li>
              </ul>
            </div>

            {/* Professional */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-suede-secondary">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold mb-2 text-suede-text">Professional</h3>
                <div className="text-3xl font-bold text-suede-primary mb-1">$79<span className="text-sm text-suede-text">/mo</span></div>
                <p className="text-sm text-suede-secondary line-through">$99/mo</p>
              </div>
              <ul className="text-left space-y-2 text-sm text-suede-text">
                <li>✓ 3 PrestaShop stores</li>
                <li>✓ 100,000 API calls/month</li>
                <li>✓ 5 premium templates</li>
                <li>✓ Email support (24hr)</li>
                <li>✓ Advanced analytics</li>
              </ul>
            </div>

            {/* Business */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-suede-secondary">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold mb-2 text-suede-text">Business</h3>
                <div className="text-3xl font-bold text-suede-primary mb-1">$149<span className="text-sm text-suede-text">/mo</span></div>
                <p className="text-sm text-suede-secondary line-through">$199/mo</p>
              </div>
              <ul className="text-left space-y-2 text-sm text-suede-text">
                <li>✓ 10 PrestaShop stores</li>
                <li>✓ 500,000 API calls/month</li>
                <li>✓ Unlimited templates</li>
                <li>✓ Priority support (4hr)</li>
                <li>✓ Mobile app builder</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8">
            <Link 
              href="/pricing"
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              View full pricing details →
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-suede-accent text-white py-12" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-3 mb-4">
              <Image
                src="/assets/suede-logo-transparent.png"
                alt="Headrest"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold text-white">Headrest</span>
            </div>
            <p className="text-suede-background mb-4">Modern APIs for PrestaShop Stores</p>
            <nav className="flex justify-center space-x-6" role="navigation" aria-label="Footer navigation">
              <Link 
                href="/docs" 
                className="text-suede-background hover:text-white focus:outline-none focus:ring-2 focus:ring-suede-primary focus:ring-offset-2 focus:ring-offset-suede-accent rounded px-2 py-1"
                aria-label="View documentation"
              >
                Documentation
              </Link>
              <Link 
                href="/support" 
                className="text-suede-background hover:text-white focus:outline-none focus:ring-2 focus:ring-suede-primary focus:ring-offset-2 focus:ring-offset-suede-accent rounded px-2 py-1"
                aria-label="Get support"
              >
                Support
              </Link>
              <Link 
                href="/privacy" 
                className="text-suede-background hover:text-white focus:outline-none focus:ring-2 focus:ring-suede-primary focus:ring-offset-2 focus:ring-offset-suede-accent rounded px-2 py-1"
                aria-label="Privacy policy"
              >
                Privacy
              </Link>
              <Link 
                href="/terms" 
                className="text-suede-background hover:text-white focus:outline-none focus:ring-2 focus:ring-suede-primary focus:ring-offset-2 focus:ring-offset-suede-accent rounded px-2 py-1"
                aria-label="Terms of service"
              >
                Terms
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}