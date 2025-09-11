'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSubscription } from '@/contexts/SubscriptionContext'

interface UsageStats {
  currentPlan: string
  dailyLimit: number
  repliesUsedToday: number
  totalRepliesUsed: number
  totalAiGenerations: number
  usageHistory: Array<{
    date: string
    repliesUsed: number
    aiGenerations: number
  }>
}

export default function UsageStatsWidget() {
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { subscriptionStatus, refreshSubscriptionStatus } = useSubscription()

  const fetchUsageStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/usage/stats?days=7', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        // Update the stats with current subscription data
        setStats({
          ...data,
          currentPlan: subscriptionStatus?.plan || data.currentPlan,
          dailyLimit: subscriptionStatus?.dailyLimit || data.dailyLimit,
          repliesUsedToday: subscriptionStatus?.repliesUsedToday || data.repliesUsedToday
        })
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error)
    } finally {
      setLoading(false)
    }
  }, [subscriptionStatus])

  useEffect(() => {
    fetchUsageStats()
  }, [fetchUsageStats])

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'text-gray-600'
      case 'basic': return 'text-blue-600'
      case 'premium': return 'text-purple-600'
      case 'enterprise': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getUsagePercentage = () => {
    if (!stats) return 0
    return Math.min((stats.repliesUsedToday / stats.dailyLimit) * 100, 100)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Usage Statistics</h3>
        <span className={`text-sm font-medium capitalize ${getPlanColor(stats.currentPlan)}`}>
          {stats.currentPlan} Plan
        </span>
      </div>

      <div className="space-y-4">
        {/* Daily Usage */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Today's Usage</span>
            <span className="text-sm text-gray-600">
              {stats.repliesUsedToday} / {stats.dailyLimit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                getUsagePercentage() > 80 ? 'bg-red-500' : 
                getUsagePercentage() > 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${getUsagePercentage()}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {stats.dailyLimit - stats.repliesUsedToday} replies remaining today
          </p>
        </div>

        {/* Weekly Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.totalRepliesUsed}</div>
            <div className="text-sm text-gray-600">Replies (7 days)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.totalAiGenerations}</div>
            <div className="text-sm text-gray-600">AI Generations</div>
          </div>
        </div>

        {/* Upgrade Prompt for Free Users */}
        {stats.currentPlan === 'free' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              Upgrade to Basic (90 THETA) for 50 replies/day and advanced features!
            </p>
            <a 
              href="/payment"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View Plans →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
