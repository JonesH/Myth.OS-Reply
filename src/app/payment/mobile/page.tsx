'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import QRCode from '@/components/QRCode'
import TransactionTracker from '@/components/TransactionTracker'
import WalletIntegration from '@/components/WalletIntegration'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Plan {
  id: string
  name: string
  price: number
  currency: string
  dailyLimit: number
  features: string[]
  popular: boolean
  description: string
}

interface PaymentAddress {
  address: string
  amount: number
  plan: string
}

export default function MobilePaymentPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [paymentAddress, setPaymentAddress] = useState<PaymentAddress | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingAddress, setGeneratingAddress] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState<'plans' | 'payment' | 'tracking'>('plans')

  const checkAuth = useCallback(async () => {
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
  }, [router])

  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/subscriptions/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlans()
    checkAuth()
  }, [fetchPlans, checkAuth])

  const generatePaymentAddress = async (plan: Plan) => {
    setGeneratingAddress(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/payments/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: plan.id,
          amount: plan.price
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPaymentAddress({
          address: data.address,
          amount: plan.price,
          plan: plan.name
        })
        setSelectedPlan(plan)
        setCurrentStep('payment')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error generating payment address:', error)
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Loading payment options..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (currentStep === 'payment') {
                  setCurrentStep('plans')
                } else if (currentStep === 'tracking') {
                  setCurrentStep('payment')
                } else {
                  router.push('/subscription')
                }
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {currentStep === 'plans' ? 'Choose Plan' : 
               currentStep === 'payment' ? 'Complete Payment' : 'Payment Status'}
            </h1>
            <div className="w-6"></div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Step Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${currentStep === 'plans' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'plans' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Plan</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep === 'payment' || currentStep === 'tracking' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep === 'payment' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Payment</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep === 'tracking' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep === 'tracking' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'tracking' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Confirm</span>
            </div>
          </div>
        </div>

        {/* Plans Selection */}
        {currentStep === 'plans' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
              <p className="text-gray-600">Select the perfect plan for your needs</p>
            </div>

            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`border-2 rounded-xl p-6 ${plan.popular ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'} ${getPlanColor(plan.id)}`}
              >
                {plan.popular && (
                  <div className="text-center mb-4">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <h3 className={`text-xl font-bold mb-2 ${getPlanTextColor(plan.id)}`}>
                    {plan.name}
                  </h3>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {plan.price} {plan.currency}
                  </div>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-700">
                      <svg className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => generatePaymentAddress(plan)}
                  disabled={generatingAddress || plan.id === 'free'}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    plan.id === 'free'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  {plan.id === 'free' ? 'Current Plan' : generatingAddress ? 'Generating...' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Payment Step */}
        {currentStep === 'payment' && paymentAddress && selectedPlan && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>
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

            {/* QR Code */}
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan QR Code</h3>
              <QRCode text={paymentAddress.address} size={200} />
              <div className="mt-4 bg-gray-50 rounded-lg p-3">
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

            {/* Wallet Integration */}
            <WalletIntegration 
              paymentAddress={paymentAddress.address}
              amount={paymentAddress.amount}
              onTransactionSent={(txHash) => {
                console.log('Transaction sent:', txHash)
                setCurrentStep('tracking')
              }}
            />

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Payment Instructions</h3>
              <ol className="list-decimal list-inside space-y-1 text-xs text-blue-800">
                <li>Copy the payment address above</li>
                <li>Open your Theta wallet</li>
                <li>Switch to Theta Testnet network</li>
                <li>Send exactly {paymentAddress.amount} THETA to the address</li>
                <li>Wait for transaction confirmation</li>
              </ol>
            </div>

            <button
              onClick={() => setCurrentStep('tracking')}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              I've Sent the Payment
            </button>
          </div>
        )}

        {/* Tracking Step */}
        {currentStep === 'tracking' && paymentAddress && (
          <div className="space-y-6">
            <TransactionTracker 
              paymentAddress={paymentAddress.address}
              onStatusChange={(status) => {
                if (status.status === 'confirmed') {
                  setTimeout(() => {
                    router.push('/subscription')
                  }, 2000)
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
