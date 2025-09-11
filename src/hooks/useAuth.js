import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function useLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { signIn } = useAuth()

  const login = async (email, password) => {
    setLoading(true)
    setError(null)

    try {
      const result = await signIn(email, password)
      
      if (result.error) {
        setError(result.error)
        return { success: false, error: result.error }
      }

      return { success: true, user: result.user }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    login,
    loading,
    error,
    clearError: () => setError(null)
  }
}

export function useRegister() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { signUp } = useAuth()

  const register = async (email, password, userData = {}) => {
    setLoading(true)
    setError(null)

    try {
      const result = await signUp(email, password, userData)
      
      if (result.error) {
        setError(result.error)
        return { success: false, error: result.error }
      }

      return { success: true, user: result.user }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    register,
    loading,
    error,
    clearError: () => setError(null)
  }
}

export function useLogout() {
  const [loading, setLoading] = useState(false)
  const { signOut } = useAuth()

  const logout = async () => {
    setLoading(true)
    try {
      await signOut()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    logout,
    loading
  }
}

export function useProfile() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { profile, updateProfile, fetchProfile } = useAuth()

  const updateUserProfile = async (updates) => {
    setLoading(true)
    setError(null)

    try {
      const result = await updateProfile(updates)
      
      if (result.error) {
        setError(result.error)
        return { success: false, error: result.error }
      }

      return { success: true, profile: result.data }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (!profile?.id) return { success: false, error: 'No user profile' }

    setLoading(true)
    try {
      const updatedProfile = await fetchProfile(profile.id)
      return { success: true, profile: updatedProfile }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    profile,
    updateUserProfile,
    refreshProfile,
    loading,
    error,
    clearError: () => setError(null)
  }
}

export function usePermissions() {
  const { profile, hasPermission, hasRole, getActiveCompany } = useAuth()

  const checkPermission = (permission) => hasPermission(permission)
  const checkRole = (roles) => hasRole(roles)
  const activeCompany = getActiveCompany()

  const isSuperAdmin = () => hasRole('super_admin')
  const isConsultant = () => hasRole(['super_admin', 'consultant'])
  const isCompanyAdmin = () => hasRole(['super_admin', 'consultant', 'company_admin'])
  const isUser = () => hasRole(['super_admin', 'consultant', 'company_admin', 'user'])

  return {
    profile,
    activeCompany,
    checkPermission,
    checkRole,
    isSuperAdmin,
    isConsultant,
    isCompanyAdmin,
    isUser
  }
}
