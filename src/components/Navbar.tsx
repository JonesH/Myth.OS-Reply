"use client";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import TwitterConnectButton from "@/components/TwitterConnectButton";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface User {
  id: string
  email: string
  username: string
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { subscriptionStatus, refreshSubscriptionStatus } = useSubscription();
  
  console.log('🔍 Navbar - User:', user);
  console.log('📍 User ID:', user?.id);
  console.log('📊 Subscription Status:', subscriptionStatus);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/validate', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const { user } = await response.json();
        setUser(user);
        await refreshSubscriptionStatus();
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [refreshSubscriptionStatus]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-200">
              MythosReply
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link 
              href="/docs" 
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium text-sm"
            >
              Documentation
            </Link>
            <Link 
              href="/waitlist" 
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium text-sm"
            >
              Waitlist
            </Link>
            <Link 
              href="/dashboard" 
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium text-sm"
            >
              Dashboard
            </Link>
            <Link 
              href="/subscription" 
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium text-sm"
            >
              Subscription
            </Link>
          </div>

          {/* Desktop Authentication */}
          <div className="hidden lg:flex items-center space-x-4">
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                {/* Subscription Status Badge */}
                {subscriptionStatus && (
                  <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                    <div className={`w-2 h-2 rounded-full ${
                      subscriptionStatus.status === 'active' ? 'bg-green-500' : 
                      subscriptionStatus.status === 'expired' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></div>
                    <span className={`text-xs font-semibold capitalize ${
                      subscriptionStatus.plan === 'free' ? 'text-gray-600' :
                      subscriptionStatus.plan === 'basic' ? 'text-blue-600' :
                      'text-purple-600'
                    }`}>
                      {subscriptionStatus.plan}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {subscriptionStatus.repliesUsedToday}/{subscriptionStatus.dailyLimit}
                    </span>
                  </div>
                )}
                
                <TwitterConnectButton callbackUrl="/dashboard" />
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors duration-200 px-3 py-1.5 rounded-md hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors duration-200 px-3 py-1.5 rounded-md hover:bg-gray-100"
                >
                  Sign In
                </Link>
                <TwitterConnectButton 
                  callbackUrl="/dashboard"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Connect X
                </TwitterConnectButton>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 rounded-md hover:bg-gray-100"
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
          <div className="lg:hidden bg-white/98 backdrop-blur-sm border-t border-gray-200/60 shadow-lg">
            <div className="px-4 py-6 space-y-4">
              {/* Mobile Navigation Links */}
              <div className="space-y-3">
                <Link 
                  href="/docs" 
                  className="block text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium text-sm py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Documentation
                </Link>
                <Link 
                  href="/waitlist" 
                  className="block text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium text-sm py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Waitlist
                </Link>
                <Link 
                  href="/dashboard" 
                  className="block text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium text-sm py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/subscription" 
                  className="block text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium text-sm py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Subscription
                </Link>
              </div>

              {/* Mobile Authentication Section */}
              <div className="pt-4 border-t border-gray-200/60">
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-full rounded"></div>
                ) : user ? (
                  <div className="space-y-3">
                    {/* Mobile Subscription Status */}
                    {subscriptionStatus && (
                      <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            subscriptionStatus.status === 'active' ? 'bg-green-500' : 
                            subscriptionStatus.status === 'expired' ? 'bg-red-500' : 'bg-yellow-500'
                          }`}></div>
                          <span className={`text-sm font-semibold capitalize ${
                            subscriptionStatus.plan === 'free' ? 'text-gray-600' :
                            subscriptionStatus.plan === 'basic' ? 'text-blue-600' :
                            'text-purple-600'
                          }`}>
                            {subscriptionStatus.plan} Plan
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          {subscriptionStatus.repliesUsedToday}/{subscriptionStatus.dailyLimit} replies
                        </span>
                      </div>
                    )}
                    
                    <TwitterConnectButton 
                      callbackUrl="/dashboard" 
                      className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      Connect X
                    </TwitterConnectButton>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors duration-200 text-center py-2 px-4 rounded-lg hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link
                      href="/auth/login"
                      className="block text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors duration-200 text-center py-2 px-4 rounded-lg hover:bg-gray-100"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <TwitterConnectButton 
                      callbackUrl="/dashboard"
                      className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      Connect X
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
