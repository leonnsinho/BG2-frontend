import React from 'react'
import { Outlet } from 'react-router-dom'
import { Layout } from './layout/Layout'
import { Sidebar } from './layout/Sidebar'

/**
 * Layout persistente para rotas protegidas
 * Mantém o Sidebar montado durante a navegação para transições fluidas
 */
export const ProtectedLayout = () => {
  return (
    <Layout sidebar={<Sidebar />}>
      <Outlet />
    </Layout>
  )
}
