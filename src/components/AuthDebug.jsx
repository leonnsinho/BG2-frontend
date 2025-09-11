import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabase'

export function AuthDebug() {
  const { user, profile, loading, error } = useAuth()

  const handleQuickLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <h3 className="font-bold text-sm mb-2">Auth Debug</h3>
      <div className="text-xs space-y-1">
        <div>
          <strong>Loading:</strong> {loading ? 'true' : 'false'}
        </div>
        <div>
          <strong>User:</strong> {user ? `${user.email} (${user.id})` : 'null'}
        </div>
        <div>
          <strong>Profile:</strong> {profile ? `${profile.full_name || 'No name'} (${profile.role})` : 'null'}
        </div>
        {error && (
          <div className="text-red-600">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
      
      {user && (
        <button
          onClick={handleQuickLogout}
          className="mt-2 w-full bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
        >
          🔓 Logout Rápido
        </button>
      )}
    </div>
  )
}
