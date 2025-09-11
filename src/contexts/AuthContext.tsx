'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  username: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  checkAuth: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setUser(null)
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/auth/validate', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const { user } = await response.json()
        setUser(user)
      } else {
        setUser(null)
        localStorage.removeItem('token')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
      localStorage.removeItem('token')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      checkAuth,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
