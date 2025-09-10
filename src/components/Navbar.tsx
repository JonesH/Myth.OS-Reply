"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import TwitterConnectButton from "@/components/TwitterConnectButton";

interface SubscriptionStatus {
  plan: string
  status: string
  dailyLimit: number
  repliesUsedToday: number
  canUpgrade: boolean
}

export default function Navbar() {
  const { data: session } = useSession();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  console.log('🔍 Navbar - NextAuth session:', session);
  console.log('📍 User Twitter ID:', session?.user?.twitterId);

  useEffect(() => {
    if (session) {
      fetchSubscriptionStatus();
    }
  }, [session]);

  const fetchSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/subscriptions/status', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  return (
    <nav className="relative bg-white/70 backdrop-blur-xl border-b border-gray-300/50">
      <div className="section-container">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="text-2xl font-bold gradient-text group-hover:scale-105 transition-transform duration-200">
              MythosReply
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/docs" 
              className="text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium"
            >
              Documentation
            </Link>
            <Link 
              href="/waitlist" 
              className="text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium"
            >
              Waitlist
            </Link>
            <Link 
              href="/dashboard" 
              className="text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium"
            >
              Dashboard
            </Link>
            <Link 
              href="/subscription" 
              className="text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium"
            >
              Subscription
            </Link>
            
            {/* Authentication Section */}
            <div className="flex items-center space-x-4">
              {session ? (
                <div className="flex items-center space-x-4">
                  {/* Subscription Status */}
                  {subscriptionStatus && (
                    <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
                      <span className={`text-xs font-medium capitalize ${
                        subscriptionStatus.plan === 'free' ? 'text-gray-600' :
                        subscriptionStatus.plan === 'basic' ? 'text-blue-600' :
                        'text-purple-600'
                      }`}>
                        {subscriptionStatus.plan}
                      </span>
                      <span className="text-xs text-gray-500">
                        {subscriptionStatus.repliesUsedToday}/{subscriptionStatus.dailyLimit}
                      </span>
                    </div>
                  )}
                  
                  <TwitterConnectButton callbackUrl="/dashboard" />
                  <Link
                    href="/dashboard"
                    className="btn-primary"
                  >
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/subscription"
                    className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors duration-200"
                  >
                    Subscription
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/auth/login"
                    className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                  <TwitterConnectButton 
                    callbackUrl="/dashboard"
                    className="btn-primary"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    <span>Connect X</span>
                  </TwitterConnectButton>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-sm border-t border-gray-300/50">
            <div className="px-4 py-6 space-y-4">
              {/* Navigation Links */}
              <div className="space-y-3">
                <Link 
                  href="/docs" 
                  className="block text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Documentation
                </Link>
                <Link 
                  href="/waitlist" 
                  className="block text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Waitlist
                </Link>
                <Link 
                  href="/dashboard" 
                  className="block text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/subscription" 
                  className="block text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Subscription
                </Link>
              </div>

              {/* Authentication Section */}
              <div className="pt-4 border-t border-gray-300/50">
                {session ? (
                  <div className="space-y-3">
                    {/* Subscription Status */}
                    {subscriptionStatus && (
                      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 rounded-lg">
                        <span className={`text-sm font-medium capitalize ${
                          subscriptionStatus.plan === 'free' ? 'text-gray-600' :
                          subscriptionStatus.plan === 'basic' ? 'text-blue-600' :
                          'text-purple-600'
                        }`}>
                          {subscriptionStatus.plan} Plan
                        </span>
                        <span className="text-sm text-gray-500">
                          {subscriptionStatus.repliesUsedToday}/{subscriptionStatus.dailyLimit}
                        </span>
                      </div>
                    )}
                    
                    <TwitterConnectButton 
                      callbackUrl="/dashboard" 
                      className="w-full justify-center"
                    />
                    <Link
                      href="/dashboard"
                      className="btn-primary w-full justify-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      href="/subscription"
                      className="block text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors duration-200 text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Subscription
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link
                      href="/auth/login"
                      className="block text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors duration-200 text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <TwitterConnectButton 
                      callbackUrl="/dashboard"
                      className="btn-primary w-full justify-center"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                      <span>Connect X</span>
                    </TwitterConnectButton>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
