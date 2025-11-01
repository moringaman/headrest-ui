import { useState, useEffect } from 'react'
import { useConfigCat } from '@/components/providers/configcat-provider'

/**
 * Custom hook to fetch and track a specific feature flag from ConfigCat
 *
 * @param flagKey - The ConfigCat feature flag key
 * @param defaultValue - Default value to use while loading or if flag doesn't exist
 * @returns Object containing the flag value and loading state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { value: googleAuthEnabled, isLoading } = useFeatureFlag('googleAuthConfig', false)
 *
 *   if (isLoading) return <Spinner />
 *
 *   return googleAuthEnabled ? <GoogleAuth /> : null
 * }
 * ```
 */
export function useFeatureFlag(flagKey: string, defaultValue: boolean = false) {
  const { getFeatureFlag, isReady } = useConfigCat()
  const [value, setValue] = useState<boolean>(defaultValue)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchFlag = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const flagValue = await getFeatureFlag(flagKey, defaultValue)

        if (isMounted) {
          setValue(flagValue)
          setIsLoading(false)
        }
      } catch (err) {
        console.error(`Error fetching feature flag '${flagKey}':`, err)

        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'))
          setValue(defaultValue)
          setIsLoading(false)
        }
      }
    }

    if (isReady) {
      fetchFlag()
    } else {
      // ConfigCat client not ready yet, use default value
      setValue(defaultValue)
      setIsLoading(false)
    }

    return () => {
      isMounted = false
    }
  }, [flagKey, defaultValue, getFeatureFlag, isReady])

  return { value, isLoading, error }
}
