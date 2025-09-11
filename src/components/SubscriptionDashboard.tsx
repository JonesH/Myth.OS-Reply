'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SubscriptionStatus {
  plan: string
  status: string
  expiresAt: string | null
  dailyLimit: number
  repliesUsedToday: number
  daysUntilExpiry: number | null
  canUpgrade: boolean
  walletAddress: string | null
}

interface SubscriptionHistory {
  id: string
  plan: string
  status: string
  amount: number
  transactionHash: string | null
  startDate: string
  endDate: string | null
  autoRenew: boolean
}

interface Plan {
  id: string
  name: string
  price: number
  currency: string
  dailyLimit: number
  features: string[]
  popular: boolean
}

export default function SubscriptionDashboard() {
  const router = useRouter()
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [subscriptionHistory, setSubscriptionHistory] = useState<SubscriptionHistory[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [walletAddress, setWalletAddress] = useState('')
  const [transactionHash, setTransactionHash] = useState('')
  const [upgrading, setUpgrading] = useState(false)

  const fetchSubscriptionData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const [statusRes, historyRes, plansRes] = await Promise.all([
        fetch('/api/subscriptions/status', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/subscriptions/history', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/subscriptions/plans')
      ])

      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setSubscriptionStatus(statusData)
        setWalletAddress(statusData.walletAddress || '')
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json()
        setSubscriptionHistory(historyData.subscriptions)
      }

      if (plansRes.ok) {
        const plansData = await plansRes.json()
        setPlans(plansData.plans)
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchSubscriptionData()
  }, [fetchSubscriptionData])

  const handleUpgrade = async () => {
    if (!selectedPlan || !transactionHash) {
      alert('Please select a plan and provide transaction hash')
      return
    }

    setUpgrading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: selectedPlan.id,
          transactionHash,
          walletAddress
        })
      })

      if (response.ok) {
        alert('Subscription upgraded successfully!')
        setShowUpgradeModal(false)
        fetchSubscriptionData()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error)
      alert('Error upgrading subscription')
    } finally {
      setUpgrading(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'expired': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'text-gray-600'
      case 'basic': return 'text-blue-600'
      case 'premium': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Management</h1>
        <p className="text-gray-600">Manage your subscription plan and view usage statistics</p>
      </div>

      {/* Current Subscription Status */}
      {subscriptionStatus && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Plan</h3>
              <div className="flex items-center space-x-2">
                <span className={`text-lg font-semibold capitalize ${getPlanColor(subscriptionStatus.plan)}`}>
                  {subscriptionStatus.plan}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(subscriptionStatus.status)}`}>
                  {subscriptionStatus.status}
                </span>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Daily Usage</h3>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold">
                  {subscriptionStatus.repliesUsedToday} / {subscriptionStatus.dailyLimit}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min((subscriptionStatus.repliesUsedToday / subscriptionStatus.dailyLimit) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Expires</h3>
              <div className="text-lg font-semibold">
                {subscriptionStatus.daysUntilExpiry !== null 
                  ? `${subscriptionStatus.daysUntilExpiry} days` 
                  : 'Never'
                }
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex flex-wrap gap-3">
              {subscriptionStatus.canUpgrade && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upgrade Plan
                </button>
              )}
              <Link
                href="/payment"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                Payment Flow
              </Link>
              <Link
                href="/subscription"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-center"
              >
                Manage Subscription
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Payment History</h2>
        {subscriptionHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptionHistory.map((sub) => (
                  <tr key={sub.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                      {sub.plan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sub.amount} THETA
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sub.transactionHash ? (
                        <a 
                          href={`https://explorer.thetatoken.org/tx/${sub.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {sub.transactionHash.substring(0, 10)}...
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(sub.startDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No payment history found.</p>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Upgrade Subscription</h3>
            
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Select Plan</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.filter(plan => plan.id !== 'free').map((plan) => (
                  <div
                    key={plan.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedPlan?.id === plan.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    } ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-semibold text-lg">{plan.name}</h5>
                      {plan.popular && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Popular</span>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.price} {plan.currency}
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index}>• {feature}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address
              </label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your Theta wallet address"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Hash
              </label>
              <input
                type="text"
                value={transactionHash}
                onChange={(e) => setTransactionHash(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the transaction hash from your payment"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={upgrading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpgrade}
                disabled={upgrading || !selectedPlan || !transactionHash}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {upgrading ? 'Processing...' : 'Upgrade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
