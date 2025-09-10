'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SubscriptionStatus {
  plan: string
  status: string
  expiresAt: string | null
  dailyLimit: number
  repliesUsedToday: number
  canUpgrade: boolean
}

interface SubscriptionContextType {
  subscriptionStatus: SubscriptionStatus | null
  refreshSubscriptionStatus: () => Promise<void>
  isLoading: boolean
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refreshSubscriptionStatus = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setSubscriptionStatus(null)
        return
      }

      const response = await fetch('/api/subscriptions/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSubscriptionStatus(data)
      } else {
        setSubscriptionStatus(null)
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error)
      setSubscriptionStatus(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshSubscriptionStatus()
  }, [])

  return (
    <SubscriptionContext.Provider value={{
      subscriptionStatus,
      refreshSubscriptionStatus,
      isLoading
    }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}
