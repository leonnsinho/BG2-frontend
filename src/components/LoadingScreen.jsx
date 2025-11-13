import React, { useEffect, useState } from 'react'
import { Loader2, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabase'

export default function LoadingScreen() {
  const { user } = useAuth()
  const [userData, setUserData] = useState({ name: 'Bem-vindo', avatar: null })
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      let userId = user?.id

      if (!userId) {
        const { data: { session } } = await supabase.auth.getSession()
        userId = session?.user?.id
      }

      if (!userId || hasAttemptedFetch) return
      
      setHasAttemptedFetch(true)

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', userId)
          .single()

        if (data && !error) {
          let avatarFullUrl = null
          if (data.avatar_url) {
            if (data.avatar_url.startsWith('http')) {
              avatarFullUrl = data.avatar_url
            } else {
              const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(data.avatar_url)
              avatarFullUrl = urlData.publicUrl
            }
          }

          setUserData({
            name: data.full_name || 'Bem-vindo',
            avatar: avatarFullUrl
          })
        }
      } catch (err) {
        console.error('Erro ao buscar dados do usuário:', err)
      }
    }

    fetchUserData()
  }, [user?.id, hasAttemptedFetch])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EBA500]/5 via-white to-blue-500/5 flex items-center justify-center">
      <div className="text-center">
        {/* Logo animado com foto de perfil */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-[#EBA500] to-[#d99500] rounded-full opacity-20 animate-ping"></div>
          </div>
          <div className="relative flex items-center justify-center w-24 h-24 mx-auto bg-gradient-to-br from-[#EBA500] to-[#d99500] rounded-full shadow-xl overflow-hidden">
            {userData.avatar ? (
              <img 
                src={userData.avatar} 
                alt="Avatar" 
                className="w-full h-full object-cover animate-pulse"
              />
            ) : (
              <User className="h-12 w-12 text-white animate-pulse" />
            )}
          </div>
        </div>

        {/* Texto */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {userData.name}
        </h2>
        <p className="text-gray-600 mb-8">
          Carregando seu perfil...
        </p>

        {/* Spinner */}
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 text-[#EBA500] animate-spin" />
          <span className="text-sm text-gray-500">Aguarde um momento</span>
        </div>

        {/* Barra de progresso animada */}
        <div className="mt-8 w-64 mx-auto">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#EBA500] to-blue-500 rounded-full animate-loading-bar"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
