import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useActivityLogs } from '../hooks/useActivityLogs'

// Estado inicial do contexto do usuário
const initialState = {
  // Configurações do usuário
  preferences: {
    theme: 'light',
    language: 'pt-BR',
    notifications: {
      email: true,
      browser: true,
      invites: true,
      updates: true
    },
    dashboard: {
      layout: 'grid',
      showWelcome: true,
      defaultView: 'overview'
    }
  },

  // Estado da interface
  ui: {
    sidebarOpen: true,
    sidebarCollapsed: false,
    activeCompany: null,
    currentPage: 'dashboard',
    breadcrumbs: []
  },

  // Cache de dados
  cache: {
    companies: [],
    users: [],
    invites: [],
    lastUpdated: null
  },

  // Estado de loading global
  loading: {
    global: false,
    companies: false,
    users: false,
    invites: false
  },

  // Notificações
  notifications: [],

  // Erros globais
  errors: []
}

// Actions para o reducer
const USER_ACTIONS = {
  // Preferences
  SET_PREFERENCES: 'SET_PREFERENCES',
  UPDATE_PREFERENCE: 'UPDATE_PREFERENCE',
  RESET_PREFERENCES: 'RESET_PREFERENCES',

  // UI
  SET_SIDEBAR_OPEN: 'SET_SIDEBAR_OPEN',
  SET_SIDEBAR_COLLAPSED: 'SET_SIDEBAR_COLLAPSED',
  SET_ACTIVE_COMPANY: 'SET_ACTIVE_COMPANY',
  SET_CURRENT_PAGE: 'SET_CURRENT_PAGE',
  SET_BREADCRUMBS: 'SET_BREADCRUMBS',

  // Cache
  SET_CACHE_DATA: 'SET_CACHE_DATA',
  UPDATE_CACHE_ITEM: 'UPDATE_CACHE_ITEM',
  CLEAR_CACHE: 'CLEAR_CACHE',

  // Loading
  SET_LOADING: 'SET_LOADING',
  SET_GLOBAL_LOADING: 'SET_GLOBAL_LOADING',

  // Notifications
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',

  // Errors
  ADD_ERROR: 'ADD_ERROR',
  REMOVE_ERROR: 'REMOVE_ERROR',
  CLEAR_ERRORS: 'CLEAR_ERRORS'
}

// Reducer para gerenciar o estado
function userReducer(state, action) {
  switch (action.type) {
    case USER_ACTIONS.SET_PREFERENCES:
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload }
      }

    case USER_ACTIONS.UPDATE_PREFERENCE:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          [action.key]: action.value
        }
      }

    case USER_ACTIONS.RESET_PREFERENCES:
      return {
        ...state,
        preferences: initialState.preferences
      }

    case USER_ACTIONS.SET_SIDEBAR_OPEN:
      return {
        ...state,
        ui: { ...state.ui, sidebarOpen: action.payload }
      }

    case USER_ACTIONS.SET_SIDEBAR_COLLAPSED:
      return {
        ...state,
        ui: { ...state.ui, sidebarCollapsed: action.payload }
      }

    case USER_ACTIONS.SET_ACTIVE_COMPANY:
      return {
        ...state,
        ui: { ...state.ui, activeCompany: action.payload }
      }

    case USER_ACTIONS.SET_CURRENT_PAGE:
      return {
        ...state,
        ui: { ...state.ui, currentPage: action.payload }
      }

    case USER_ACTIONS.SET_BREADCRUMBS:
      return {
        ...state,
        ui: { ...state.ui, breadcrumbs: action.payload }
      }

    case USER_ACTIONS.SET_CACHE_DATA:
      return {
        ...state,
        cache: {
          ...state.cache,
          [action.key]: action.payload,
          lastUpdated: new Date().toISOString()
        }
      }

    case USER_ACTIONS.UPDATE_CACHE_ITEM:
      return {
        ...state,
        cache: {
          ...state.cache,
          [action.key]: state.cache[action.key].map(item =>
            item.id === action.id ? { ...item, ...action.updates } : item
          )
        }
      }

    case USER_ACTIONS.CLEAR_CACHE:
      return {
        ...state,
        cache: initialState.cache
      }

    case USER_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: { ...state.loading, [action.key]: action.payload }
      }

    case USER_ACTIONS.SET_GLOBAL_LOADING:
      return {
        ...state,
        loading: { ...state.loading, global: action.payload }
      }

    case USER_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, {
          id: Date.now() + Math.random(),
          timestamp: new Date().toISOString(),
          ...action.payload
        }]
      }

    case USER_ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      }

    case USER_ACTIONS.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: []
      }

    case USER_ACTIONS.ADD_ERROR:
      return {
        ...state,
        errors: [...state.errors, {
          id: Date.now() + Math.random(),
          timestamp: new Date().toISOString(),
          ...action.payload
        }]
      }

    case USER_ACTIONS.REMOVE_ERROR:
      return {
        ...state,
        errors: state.errors.filter(e => e.id !== action.payload)
      }

    case USER_ACTIONS.CLEAR_ERRORS:
      return {
        ...state,
        errors: []
      }

    default:
      return state
  }
}

// Criar contexto
const UserContext = createContext()

// Hook para usar o contexto
export const useUserContext = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider')
  }
  return context
}

// Provider do contexto
export function UserProvider({ children }) {
  const [state, dispatch] = useReducer(userReducer, initialState)
  const { profile, user, loading: authLoading } = useAuth()
  const { logSettingsUpdate } = useActivityLogs()

  // Carregar preferências do localStorage quando usuário logado
  useEffect(() => {
    if (user && !authLoading) {
      loadUserPreferences()
    }
  }, [user, authLoading])

  // Salvar preferências no localStorage quando mudarem
  useEffect(() => {
    if (user) {
      saveUserPreferences()
    }
  }, [state.preferences, user])

  // Carregar preferências do localStorage
  const loadUserPreferences = () => {
    try {
      const savedPrefs = localStorage.getItem(`bg2_preferences_${user.id}`)
      if (savedPrefs) {
        const preferences = JSON.parse(savedPrefs)
        dispatch({
          type: USER_ACTIONS.SET_PREFERENCES,
          payload: preferences
        })
      }
    } catch (error) {
      console.warn('Erro ao carregar preferências:', error)
    }
  }

  // Salvar preferências no localStorage
  const saveUserPreferences = () => {
    try {
      localStorage.setItem(
        `bg2_preferences_${user.id}`,
        JSON.stringify(state.preferences)
      )
    } catch (error) {
      console.warn('Erro ao salvar preferências:', error)
    }
  }

  // Funções de preferências
  const updatePreference = async (key, value) => {
    dispatch({
      type: USER_ACTIONS.UPDATE_PREFERENCE,
      key,
      value
    })

    // Log da mudança
    await logSettingsUpdate('preferences', { [key]: value })
  }

  const setPreferences = async (preferences) => {
    dispatch({
      type: USER_ACTIONS.SET_PREFERENCES,
      payload: preferences
    })

    // Log da mudança
    await logSettingsUpdate('preferences', preferences)
  }

  const resetPreferences = async () => {
    dispatch({ type: USER_ACTIONS.RESET_PREFERENCES })
    await logSettingsUpdate('preferences', { action: 'reset' })
  }

  // Funções de UI
  const toggleSidebar = () => {
    dispatch({
      type: USER_ACTIONS.SET_SIDEBAR_OPEN,
      payload: !state.ui.sidebarOpen
    })
  }

  const setSidebarCollapsed = (collapsed) => {
    dispatch({
      type: USER_ACTIONS.SET_SIDEBAR_COLLAPSED,
      payload: collapsed
    })
  }

  const setActiveCompany = (company) => {
    dispatch({
      type: USER_ACTIONS.SET_ACTIVE_COMPANY,
      payload: company
    })
  }

  const setCurrentPage = (page) => {
    dispatch({
      type: USER_ACTIONS.SET_CURRENT_PAGE,
      payload: page
    })
  }

  const setBreadcrumbs = (breadcrumbs) => {
    dispatch({
      type: USER_ACTIONS.SET_BREADCRUMBS,
      payload: breadcrumbs
    })
  }

  // Funções de cache
  const setCacheData = (key, data) => {
    dispatch({
      type: USER_ACTIONS.SET_CACHE_DATA,
      key,
      payload: data
    })
  }

  const updateCacheItem = (key, id, updates) => {
    dispatch({
      type: USER_ACTIONS.UPDATE_CACHE_ITEM,
      key,
      id,
      updates
    })
  }

  const clearCache = () => {
    dispatch({ type: USER_ACTIONS.CLEAR_CACHE })
  }

  // Funções de loading
  const setLoading = (key, loading) => {
    dispatch({
      type: USER_ACTIONS.SET_LOADING,
      key,
      payload: loading
    })
  }

  const setGlobalLoading = (loading) => {
    dispatch({
      type: USER_ACTIONS.SET_GLOBAL_LOADING,
      payload: loading
    })
  }

  // Funções de notificações
  const addNotification = (notification) => {
    dispatch({
      type: USER_ACTIONS.ADD_NOTIFICATION,
      payload: notification
    })

    // Auto-remover após 5 segundos se não for persistente
    if (!notification.persistent) {
      setTimeout(() => {
        removeNotification(notification.id)
      }, 5000)
    }
  }

  const removeNotification = (id) => {
    dispatch({
      type: USER_ACTIONS.REMOVE_NOTIFICATION,
      payload: id
    })
  }

  const clearNotifications = () => {
    dispatch({ type: USER_ACTIONS.CLEAR_NOTIFICATIONS })
  }

  // Funções de erro
  const addError = (error) => {
    dispatch({
      type: USER_ACTIONS.ADD_ERROR,
      payload: error
    })
  }

  const removeError = (id) => {
    dispatch({
      type: USER_ACTIONS.REMOVE_ERROR,
      payload: id
    })
  }

  const clearErrors = () => {
    dispatch({ type: USER_ACTIONS.CLEAR_ERRORS })
  }

  // Helpers para notificações comuns
  const showSuccess = (message, title = 'Sucesso') => {
    addNotification({
      type: 'success',
      title,
      message
    })
  }

  const showError = (message, title = 'Erro') => {
    addNotification({
      type: 'error',
      title,
      message,
      persistent: true
    })
  }

  const showWarning = (message, title = 'Aviso') => {
    addNotification({
      type: 'warning',
      title,
      message
    })
  }

  const showInfo = (message, title = 'Informação') => {
    addNotification({
      type: 'info',
      title,
      message
    })
  }

  // Valor do contexto
  const contextValue = {
    // Estado
    ...state,
    
    // Auth data
    user,
    profile,
    authLoading,

    // Preferences
    updatePreference,
    setPreferences,
    resetPreferences,

    // UI
    toggleSidebar,
    setSidebarCollapsed,
    setActiveCompany,
    setCurrentPage,
    setBreadcrumbs,

    // Cache
    setCacheData,
    updateCacheItem,
    clearCache,

    // Loading
    setLoading,
    setGlobalLoading,

    // Notifications
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,

    // Errors
    addError,
    removeError,
    clearErrors
  }

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  )
}
