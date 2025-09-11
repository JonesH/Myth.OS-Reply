'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import QRCode from '@/components/QRCode'
import TransactionTracker from '@/components/TransactionTracker'
import WalletIntegration from '@/components/WalletIntegration'
import { useSubscription } from '@/contexts/SubscriptionContext'

interface Plan {
  id: string
  name: string
  price: number
  currency: string
  dailyLimit: number
  features: string[]
  popular: boolean
  description: string
  minPrice?: number
  maxPrice?: number
  isEnterprise?: boolean
}

interface PaymentAddress {
  address: string
  amount: number
  plan: string
}

export default function PaymentPlansPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [paymentAddress, setPaymentAddress] = useState<PaymentAddress | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingAddress, setGeneratingAddress] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [enterpriseAmount, setEnterpriseAmount] = useState<number>(6000)
  const { refreshSubscriptionStatus } = useSubscription()

  useEffect(() => {
    fetchPlans()
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/auth/validate', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      } else {
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/auth/login')
    }
  }

  const fetchPlans = async () => {
    console.log('🔄 Fetching plans...')
    try {
      const response = await fetch('/api/subscriptions/plans')
      console.log('📡 Plans response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Plans fetched:', data)
        setPlans(data.plans)
      } else {
        console.error('❌ Failed to fetch plans')
      }
    } catch (error) {
      console.error('❌ Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePaymentAddress = async (plan: Plan) => {
    console.log('🔄 Generating payment address for plan:', plan)
    setGeneratingAddress(true)
    try {
      const token = localStorage.getItem('token')
      console.log('📝 Token exists:', !!token)
      
      const response = await fetch('/api/payments/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: plan.id,
          amount: plan.isEnterprise ? enterpriseAmount : plan.price
        })
      })

      console.log('📡 Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Payment address generated:', data)
        setPaymentAddress({
          address: data.address,
          amount: plan.price,
          plan: plan.name
        })
        setSelectedPlan(plan)
        alert(`✅ ${plan.name} plan selected! Payment address generated successfully.`)
        
        // Refresh subscription status across the app
        await refreshSubscriptionStatus()
      } else {
        const error = await response.json()
        console.error('❌ Error response:', error)
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('❌ Error generating payment address:', error)
      alert('Error generating payment address')
    } finally {
      setGeneratingAddress(false)
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'border-gray-200 bg-gray-50'
      case 'basic': return 'border-blue-200 bg-blue-50'
      case 'premium': return 'border-purple-200 bg-purple-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const getPlanTextColor = (plan: string) => {
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
    <div className="min-h-screen bg-hero-gradient">
      <Navbar />
      
      <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600">Select the perfect plan for your Twitter automation needs</p>
      </div>

      {/* Plans Comparison Table */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Plan Comparison</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Features</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="px-6 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                    <div className={`inline-block px-4 py-2 rounded-lg ${getPlanColor(plan.id)}`}>
                      <span className={`font-semibold ${getPlanTextColor(plan.id)}`}>{plan.name}</span>
                      {plan.popular && (
                        <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Popular</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Price</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 text-center text-sm text-gray-900">
                    <div className="text-2xl font-bold">{plan.price} {plan.currency}</div>
                    <div className="text-xs text-gray-500">per month</div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Daily AI Replies</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 text-center text-sm text-gray-900">
                    <span className="font-semibold">{plan.dailyLimit}</span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">AI Models with EdgeCloude</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 text-center text-sm text-gray-900">
                    {plan.id === 'free' ? 'Basic' : plan.id === 'basic' ? 'Standard' : 'Advanced'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Automation Features</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 text-center text-sm text-gray-900">
                    {plan.id === 'free' ? (
                      <span className="flex items-center justify-center">
                        <img src="/assets/symbols/remove.png" alt="No" className="w-4 h-4 mr-1" />
                        Limited
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <img src="/assets/symbols/check.png" alt="Yes" className="w-4 h-4 mr-1" />
                        Full
                      </span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Analytics</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 text-center text-sm text-gray-900">
                    {plan.id === 'free' ? (
                      <span className="flex items-center justify-center">
                        <img src="/assets/symbols/remove.png" alt="No" className="w-4 h-4 mr-1" />
                        Basic
                      </span>
                    ) : plan.id === 'basic' ? (
                      <span className="flex items-center justify-center">
                        <img src="/assets/symbols/check.png" alt="Yes" className="w-4 h-4 mr-1" />
                        Standard
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <img src="/assets/symbols/check.png" alt="Yes" className="w-4 h-4 mr-1" />
                        Advanced
                      </span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Custom Instructions</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 text-center text-sm text-gray-900">
                    {plan.id === 'premium' || plan.id === 'enterprise' ? (
                      <span className="flex items-center justify-center">
                        <img src="/assets/symbols/check.png" alt="Yes" className="w-4 h-4 mr-1" />
                        Yes
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <img src="/assets/symbols/remove.png" alt="No" className="w-4 h-4 mr-1" />
                        No
                      </span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Support</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 text-center text-sm text-gray-900">
                    {plan.id === 'free' ? (
                      <span className="flex items-center justify-center">
                        <img src="/assets/symbols/remove.png" alt="No" className="w-4 h-4 mr-1" />
                        Community
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <img src="/assets/symbols/check.png" alt="Yes" className="w-4 h-4 mr-1" />
                        Email
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative border-2 rounded-xl p-8 transition-all duration-200 hover:shadow-lg ${
              plan.popular ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'
            } ${getPlanColor(plan.id)}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className={`text-2xl font-bold mb-2 ${getPlanTextColor(plan.id)}`}>
                {plan.name}
              </h3>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {plan.isEnterprise ? (
                  <div className="space-y-2">
                    <div>Custom Pricing</div>
                    <div className="text-lg text-gray-600">
                      {plan.minPrice} - {plan.maxPrice} {plan.currency}
                    </div>
                  </div>
                ) : (
                  `${plan.price} ${plan.currency}`
                )}
              </div>
              <p className="text-gray-600">{plan.description}</p>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-gray-700">
                  <img src="/assets/symbols/check.png" alt="Feature" className="w-5 h-5 mr-3" />
                  {feature}
                </li>
              ))}
            </ul>

            {/* Enterprise Amount Input */}
            {plan.isEnterprise && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Amount (THETA)
                </label>
                <input
                  type="number"
                  min={plan.minPrice}
                  max={plan.maxPrice}
                  value={enterpriseAmount}
                  onChange={(e) => setEnterpriseAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`${plan.minPrice} - ${plan.maxPrice}`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Range: {plan.minPrice} - {plan.maxPrice} THETA
                </p>
              </div>
            )}

            <button
              onClick={() => generatePaymentAddress(plan)}
              disabled={generatingAddress || plan.id === 'free'}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                plan.id === 'free'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : selectedPlan?.id === plan.id
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : plan.popular
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              {plan.id === 'free' 
                ? 'Current Plan' 
                : selectedPlan?.id === plan.id 
                ? 'Selected'  
                : generatingAddress 
                ? 'Generating...' 
                : 'Select Plan'}
            </button>
          </div>
        ))}
      </div>

      {/* Payment Address Display */}
      {paymentAddress && selectedPlan && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Complete Your Payment
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Details */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-semibold">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold">{paymentAddress.amount} THETA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network:</span>
                    <span className="font-semibold">Theta Testnet</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Payment Instructions</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  <li>Copy the payment address below</li>
                  <li>Open your Theta wallet</li>
                  <li>Switch to Theta Testnet network</li>
                  <li>Send exactly {paymentAddress.amount} THETA to the address</li>
                  <li>Wait for transaction confirmation</li>
                </ol>
              </div>

              {/* Transaction Tracker */}
              <TransactionTracker 
                paymentAddress={paymentAddress.address}
                onStatusChange={(status) => {
                  if (status.status === 'confirmed') {
                    // Redirect to subscription page on successful payment
                    setTimeout(() => {
                      router.push('/subscription')
                    }, 2000)
                  }
                }}
              />
            </div>

            {/* QR Code and Address */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Address</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <QRCode text={paymentAddress.address} size={200} />
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 break-all font-mono">
                      {paymentAddress.address}
                    </p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(paymentAddress.address)}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Copy Address
                  </button>
                </div>
              </div>

              {/* Wallet Integration */}
              <WalletIntegration 
                paymentAddress={paymentAddress.address}
                amount={paymentAddress.amount}
                onTransactionSent={(txHash) => {
                  console.log('Transaction sent:', txHash)
                  // The transaction tracker will pick this up automatically
                }}
              />
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/subscription"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Subscription Management
            </Link>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
