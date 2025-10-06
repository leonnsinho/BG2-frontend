// Componente wrapper que remove o Layout para páginas que já estão dentro de ProtectedRoute
export const NoLayoutWrapper = ({ children }) => {
  return <>{children}</>
}
