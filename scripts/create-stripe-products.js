#!/usr/bin/env node

/**
 * Script to create Stripe products and prices for Suede SaaS
 * Run with: node scripts/create-stripe-products.js
 * 
 * Make sure to set your STRIPE_SECRET_KEY environment variable first:
 * export STRIPE_SECRET_KEY=sk_test_...
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

const plans = [
  {
    name: 'Suede Hobby - Monthly',
    description: 'Perfect for developers and hobbyists',
    price: 499, // $4.99 in cents
    interval: 'month',
    features: [
      '1 PrestaShop store connection',
      '1,000 API calls/month',
      '1 React template',
      'Community support',
      'SSL included'
    ]
  },
  {
    name: 'Suede Hobby - Annual',
    description: 'Perfect for developers and hobbyists (Annual - Save 20%)',
    price: 4790, // $47.90 in cents
    interval: 'year',
    features: [
      '1 PrestaShop store connection',
      '1,000 API calls/month',
      '1 React template',
      'Community support',
      'SSL included'
    ]
  },
  {
    name: 'Suede Starter - Monthly',
    description: 'Most popular for growing businesses',
    price: 1900, // $19.00 in cents
    interval: 'month',
    features: [
      '1 PrestaShop store connection',
      '10,000 API calls/month',
      '3 React templates',
      'Email support (48hr)',
      'Custom domain'
    ]
  },
  {
    name: 'Suede Starter - Annual',
    description: 'Most popular for growing businesses (Annual - Save 20%)',
    price: 18240, // $182.40 in cents
    interval: 'year',
    features: [
      '1 PrestaShop store connection',
      '10,000 API calls/month',
      '3 React templates',
      'Email support (48hr)',
      'Custom domain'
    ]
  },
  {
    name: 'Suede Professional - Monthly',
    description: 'For established businesses',
    price: 7900, // $79.00 in cents
    interval: 'month',
    features: [
      '3 PrestaShop stores',
      '100,000 API calls/month',
      '5 premium templates',
      'Email support (24hr)',
      'Advanced analytics'
    ]
  },
  {
    name: 'Suede Professional - Annual',
    description: 'For established businesses (Annual - Save 20%)',
    price: 75840, // $758.40 in cents
    interval: 'year',
    features: [
      '3 PrestaShop stores',
      '100,000 API calls/month',
      '5 premium templates',
      'Email support (24hr)',
      'Advanced analytics'
    ]
  },
  {
    name: 'Suede Business - Monthly',
    description: 'For large enterprises',
    price: 14900, // $149.00 in cents
    interval: 'month',
    features: [
      '10 PrestaShop stores',
      '500,000 API calls/month',
      'Unlimited templates',
      'Priority support (4hr)',
      'Mobile app builder'
    ]
  },
  {
    name: 'Suede Business - Annual',
    description: 'For large enterprises (Annual - Save 20%)',
    price: 143040, // $1,430.40 in cents
    interval: 'year',
    features: [
      '10 PrestaShop stores',
      '500,000 API calls/month',
      'Unlimited templates',
      'Priority support (4hr)',
      'Mobile app builder'
    ]
  }
];

async function createProducts() {
  console.log('🚀 Creating Stripe products and prices...\n');
  
  const results = [];
  
  for (const plan of plans) {
    try {
      console.log(`Creating: ${plan.name}`);
      
      // Create product
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: {
          features: JSON.stringify(plan.features)
        }
      });
      
      // Create price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price,
        currency: 'usd',
        recurring: {
          interval: plan.interval
        },
        metadata: {
          plan_type: plan.name.includes('Annual') ? 'annual' : 'monthly',
          plan_tier: plan.name.split(' - ')[0].replace('Suede ', '').toLowerCase()
        }
      });
      
      results.push({
        name: plan.name,
        productId: product.id,
        priceId: price.id,
        amount: plan.price,
        interval: plan.interval
      });
      
      console.log(`✅ Created: ${plan.name}`);
      console.log(`   Product ID: ${product.id}`);
      console.log(`   Price ID: ${price.id}`);
      console.log(`   Amount: $${(plan.price / 100).toFixed(2)}/${plan.interval}\n`);
      
    } catch (error) {
      console.error(`❌ Error creating ${plan.name}:`, error.message);
    }
  }
  
  console.log('\n📋 Environment Variables to Add to .env:');
  console.log('# Monthly Plans');
  results.filter(r => r.interval === 'month').forEach(plan => {
    const envVar = `NEXT_PUBLIC_STRIPE_${plan.name.split(' - ')[0].replace('Suede ', '').toUpperCase()}_MONTHLY_PRICE_ID`;
    console.log(`${envVar}=${plan.priceId}`);
  });
  
  console.log('\n# Annual Plans');
  results.filter(r => r.interval === 'year').forEach(plan => {
    const envVar = `NEXT_PUBLIC_STRIPE_${plan.name.split(' - ')[0].replace('Suede ', '').toUpperCase()}_ANNUAL_PRICE_ID`;
    console.log(`${envVar}=${plan.priceId}`);
  });
  
  console.log('\n✨ All products created successfully!');
}

// Run the script
if (require.main === module) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ Please set STRIPE_SECRET_KEY environment variable');
    console.log('Example: export STRIPE_SECRET_KEY=sk_test_...');
    process.exit(1);
  }
  
  createProducts().catch(console.error);
}

module.exports = { createProducts, plans };
