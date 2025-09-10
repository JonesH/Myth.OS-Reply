'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SubscriptionStatus {
  plan: string
  status: string
  dailyLimit: number
  repliesUsedToday: number
  canUpgrade: boolean
}

interface PremiumGateProps {
  children: React.ReactNode
  feature: string
  requiredPlan?: 'basic' | 'premium'
  showUpgradePrompt?: boolean
}

export default function PremiumGate({ 
  children, 
  feature, 
  requiredPlan = 'basic',
  showUpgradePrompt = true 
}: PremiumGateProps) {
  const router = useRouter()
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    checkSubscriptionStatus()
  }, [])

  const checkSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/subscriptions/status', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setSubscriptionStatus(data)
      }
    } catch (error) {
      console.error('Error checking subscription status:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasAccess = () => {
    if (!subscriptionStatus) return false
    
    if (subscriptionStatus.status !== 'active') return false
    
    switch (requiredPlan) {
      case 'basic':
        return subscriptionStatus.plan === 'basic' || subscriptionStatus.plan === 'premium'
      case 'premium':
        return subscriptionStatus.plan === 'premium'
      default:
        return true
    }
  }

  const getUpgradeMessage = () => {
    switch (requiredPlan) {
      case 'basic':
        return 'This feature requires a Basic plan (1 THETA) or higher.'
      case 'premium':
        return 'This feature requires a Premium plan (5 THETA).'
      default:
        return 'This feature requires a paid subscription.'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (hasAccess()) {
    return <>{children}</>
  }

  if (!showUpgradePrompt) {
    return null
  }

  return (
    <>
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 text-center">
        <div className="mb-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Feature</h3>
          <p className="text-gray-600 mb-4">{getUpgradeMessage()}</p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upgrade Now
          </button>
          <div className="text-sm text-gray-500">
            <a href="/subscription" className="text-blue-600 hover:text-blue-800">
              View subscription options
            </a>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Upgrade Required</h3>
            <p className="text-gray-600 mb-6">{getUpgradeMessage()}</p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => router.push('/subscription')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                View Plans
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
