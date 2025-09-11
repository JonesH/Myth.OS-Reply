'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function SimpleSubscriptionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Subscription page - No token found, redirecting to login')
        }
        router.push('/auth/login')
        return
      }

      // Validate token with server
      const response = await fetch('/api/auth/validate', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Subscription page - Auth validation response:', response.status)
      }

      if (!response.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Subscription page - Token invalid, redirecting to login')
        }
        localStorage.removeItem('token')
        router.push('/auth/login')
        return
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Subscription page - Auth successful')
      }
      setLoading(false)
    } catch (error) {
      console.error('Auth check failed:', error)
      setError('Authentication failed')
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Navbar />
      
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Management</h1>
        <p className="text-gray-600">Manage your subscription plan and view usage statistics</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Subscription Status</h2>
        <p className="text-gray-600">Loading subscription information...</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Free</h3>
            <div className="text-2xl font-bold text-gray-900 mb-4">0 THETA</div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 10 AI replies per day limit</li>
              <li>• Basic AI models only</li>
              <li>• Limited automation features</li>
              <li>• Basic analytics</li>
            </ul>
          </div>
          
          <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-600 mb-2">Basic</h3>
            <div className="text-2xl font-bold text-gray-900 mb-4">1 THETA</div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 50 AI replies per day</li>
              <li>• Standard AI models</li>
              <li>• Full automation features</li>
              <li>• Standard analytics</li>
            </ul>
          </div>
          
          <div className="border border-purple-200 rounded-lg p-6 bg-purple-50">
            <h3 className="text-lg font-semibold text-purple-600 mb-2">Premium</h3>
            <div className="text-2xl font-bold text-gray-900 mb-4">5 THETA</div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 500 AI replies per day</li>
              <li>• Advanced AI models</li>
              <li>• Custom AI instructions</li>
              <li>• Advanced analytics and insights</li>
              <li>• Priority support features</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="text-center">
        <a
          href="/payment"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
        >
          View Payment Options
        </a>
      </div>
      </div>
    </div>
  )
}
