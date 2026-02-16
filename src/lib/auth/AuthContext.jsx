import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchCsrfToken, login as loginRequest, logout as logoutRequest, me } from '../api/auth'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const currentUser = await me()
      setUser(currentUser)
      setError(null)
      return currentUser
    } catch (requestError) {
      if (requestError?.status === 401) {
        setUser(null)
        setError(null)
        return null
      }
      setUser(null)
      setError(requestError)
      throw requestError
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      try {
        await fetchCsrfToken()
        const currentUser = await me()
        if (!mounted) return
        setUser(currentUser)
        setError(null)
      } catch (requestError) {
        if (!mounted) return
        if (requestError?.status === 401) {
          setUser(null)
          setError(null)
        } else {
          setUser(null)
          setError(requestError)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    bootstrap()

    return () => {
      mounted = false
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const currentUser = await loginRequest(email, password)
    setUser(currentUser)
    setError(null)
    return currentUser
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    setUser(null)
    setError(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      logout,
      refresh,
      isAuthenticated: Boolean(user),
    }),
    [user, loading, error, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
