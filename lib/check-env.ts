// Debug helper to check environment variables
export function checkEnvironmentVariables() {
  if (typeof window !== 'undefined') {
    console.log('🔍 Environment Variables Check:');
    console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY exists:', !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

    // Check if using placeholder values
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
      console.error('❌ Using placeholder Supabase URL! Set real environment variables in Railway.');
    }

    if (process.env.NEXT_PUBLIC_API_URL?.includes('placeholder')) {
      console.error('❌ Using placeholder API URL! Set real environment variables in Railway.');
    }
  }
}
