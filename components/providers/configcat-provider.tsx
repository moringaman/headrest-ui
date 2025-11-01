'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import * as configcat from '@configcat/sdk'

interface ConfigCatContextType {
  isReady: boolean
  getFeatureFlag: (key: string, defaultValue: boolean) => Promise<boolean>
  client: configcat.IConfigCatClient | null
}

const ConfigCatContext = createContext<ConfigCatContextType>({
  isReady: false,
  getFeatureFlag: async () => false,
  client: null,
})

export function useConfigCat() {
  const context = useContext(ConfigCatContext)
  if (!context) {
    throw new Error('useConfigCat must be used within ConfigCatProvider')
  }
  return context
}

interface ConfigCatProviderProps {
  children: ReactNode
}

export function ConfigCatProvider({ children }: ConfigCatProviderProps) {
  const [client, setClient] = useState<configcat.IConfigCatClient | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Select SDK key based on environment
    const SDK_KEY = process.env.NODE_ENV === 'production'
      ? 'configcat-sdk-1/IKLbCD0DdkCHetPrnkzGwg/zWLB-M96HkuKn0gCtyuwrQ' // Production
      : 'configcat-sdk-1/IKLbCD0DdkCHetPrnkzGwg/QfoT6wY9JkyCEd2dU2lmvg' // Development

    // Create logger for development (remove or set to Error in production)
    const logger = configcat.createConsoleLogger(
      process.env.NODE_ENV === 'development'
        ? configcat.LogLevel.Info
        : configcat.LogLevel.Error
    )

    console.log(`Initializing ConfigCat with ${process.env.NODE_ENV} environment`)

    // Initialize ConfigCat client as singleton
    const configCatClient = configcat.getClient(
      SDK_KEY,
      configcat.PollingMode.AutoPoll,
      {
        logger: logger,
        pollIntervalSeconds: 60, // Poll every 60 seconds
        setupHooks: (hooks) => {
          hooks.on('clientReady', () => {
            console.log(`ConfigCat client is ready (${process.env.NODE_ENV})`)
            setIsReady(true)
          })
          hooks.on('configChanged', (config) => {
            console.log('ConfigCat config changed')
          })
        },
      }
    )

    setClient(configCatClient)

    // Cleanup on unmount
    return () => {
      configCatClient.dispose()
    }
  }, [])

  const getFeatureFlag = async (key: string, defaultValue: boolean): Promise<boolean> => {
    if (!client) {
      console.warn(`ConfigCat client not initialized, returning default value for ${key}`)
      return defaultValue
    }

    try {
      const value = await client.getValueAsync(key, defaultValue)
      console.log(`Feature flag ${key}: ${value}`)
      return value
    } catch (error) {
      console.error(`Error fetching feature flag ${key}:`, error)
      return defaultValue
    }
  }

  return (
    <ConfigCatContext.Provider value={{ isReady, getFeatureFlag, client }}>
      {children}
    </ConfigCatContext.Provider>
  )
}
