import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Layout } from '../../components/layout/Layout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { Loading } from '../../components/ui/Loading'
import { 
  Users, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  UserPlus,
  Mail,
  Building2,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Link
} from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'

const ROLES = {
  'super_admin': { 
    label: 'Super Admin', 
    color: 'red',
    icon: Shield
  },
  'consultant': { 
    label: 'Consultor', 
    color: 'purple',
    icon: Users
  },
  'company_admin': { 
    label: 'Admin Empresa', 
    color: 'blue',
    icon: Building2
  },
  'user': { 
    label: 'Usuário', 
    color: 'green',
    icon: Users
  }
}

const STATUS_COLORS = {
  'active': 'green',
  'inactive': 'red',
  'pending': 'yellow'
}

export default function UsersManagementPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [companies, setCompanies] = useState([])
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadUsers()
    loadCompanies()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      // Buscar usuários da tabela profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Buscar vinculações de usuários com empresas
      const { data: userCompanies, error: userCompaniesError } = await supabase
        .from('user_companies')
        .select(`
          *,
          companies (
            id,
            name
          )
        `)
        .eq('is_active', true)

      if (userCompaniesError) throw userCompaniesError

      console.log('Profiles carregados:', profiles?.length)
      console.log('Vinculações carregadas:', userCompanies?.length)
      console.log('Exemplo de userCompanies:', userCompanies?.[0])

      // Combinar dados
      const combinedUsers = profiles.map(profile => {
        // Encontrar vinculação ativa do usuário - usar diferentes campos possíveis
        const possibleUserIds = [profile.user_id, profile.id].filter(Boolean)
        const userCompany = userCompanies?.find(uc => 
          possibleUserIds.includes(uc.user_id)
        )
        
        console.log(`Usuário ${profile.email}: IDs possíveis [${possibleUserIds.join(', ')}], empresa encontrada:`, userCompany?.companies?.name || 'nenhuma', 'Role global:', profile.role, 'Role na empresa:', userCompany?.role)
        
        return {
          ...profile,
          user_id: profile.user_id || profile.id, // Para manter compatibilidade
          email: profile.email,
          status: profile.is_active ? 'active' : 'inactive',
          companies: userCompany?.companies, // Empresa vinculada através de user_companies
          company_role: userCompany?.role, // Role na empresa
          last_sign_in_at: profile.last_login
        }
      })

      setUsers(combinedUsers)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async (userId, updates) => {
    try {
      setUpdating(true)
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)

      if (error) throw error

      await loadUsers()
      setIsEditModalOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      alert('Erro ao atualizar usuário')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    try {
      setUpdating(true);
      
      // Get current user status
      const currentUser = users.find(u => u.id === userId);
      if (!currentUser) return;

      const newActiveStatus = !currentUser.is_active;
      const action = newActiveStatus ? 'ativar' : 'desativar';
      
      if (!confirm(`Tem certeza que deseja ${action} este usuário?`)) {
        return;
      }
      
      // Update user status
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: newActiveStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      await loadUsers();
      alert(`Usuário ${newActiveStatus ? 'ativado' : 'desativado'} com sucesso`);
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      alert('Erro ao alterar status do usuário');
    } finally {
      setUpdating(false);
    }
  }

  // Carregar empresas
  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
    }
  }

  // Vincular usuário a empresa ou alterar empresa existente
  const handleLinkToCompany = async (userId, companyId, role = 'user') => {
    try {
      setUpdating(true)
      
      console.log('Processando vinculação - usuário:', userId, 'empresa:', companyId, 'role:', role)
      
      // Primeiro, desativar qualquer vinculação existente
      const { error: deactivateError } = await supabase
        .from('user_companies')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_active', true)

      if (deactivateError) {
        console.error('Erro ao desativar vinculação anterior:', deactivateError)
        throw deactivateError
      }

      // Verificar se já existe vinculação com a nova empresa
      const { data: existingLink } = await supabase
        .from('user_companies')
        .select('id, is_active')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .single()

      if (existingLink) {
        // Reativar vinculação existente com nova role
        const { error: updateError } = await supabase
          .from('user_companies')
          .update({
            is_active: true,
            role: role,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLink.id)

        if (updateError) throw updateError
        console.log('Vinculação existente reativada')
      } else {
        // Criar nova vinculação
        const { data: insertResult, error: insertError } = await supabase
          .from('user_companies')
          .insert({
            user_id: userId,
            company_id: companyId,
            role: role,
            is_active: true,
            created_at: new Date().toISOString()
          })
          .select()

        if (insertError) {
          console.error('Erro ao inserir nova vinculação:', insertError)
          throw insertError
        }
        
        console.log('Nova vinculação criada:', insertResult)
      }

      await loadUsers()
      setIsLinkModalOpen(false)
      setSelectedUser(null)
      
      // Verificar se o usuário já tinha empresa para determinar a mensagem
      const currentUser = users.find(u => (u.user_id || u.id) === userId)
      const wasEdit = Boolean(currentUser?.companies?.id)
      
      alert(wasEdit 
        ? 'Empresa do usuário alterada com sucesso!' 
        : 'Usuário vinculado à empresa com sucesso!'
      )
    } catch (error) {
      console.error('Erro ao vincular usuário:', error)
      alert('Erro ao vincular usuário à empresa: ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  // Desvincular usuário da empresa
  const handleUnlinkFromCompany = async (userId) => {
    try {
      if (!confirm('Tem certeza que deseja desvincular este usuário da empresa?')) {
        return
      }

      setUpdating(true)
      
      console.log('Desvinculando usuário:', userId)
      
      // Desativar vinculação existente
      const { error } = await supabase
        .from('user_companies')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error) {
        console.error('Erro ao desativar vinculação:', error)
        throw error
      }

      await loadUsers()
      alert('Usuário desvinculado da empresa com sucesso!')
    } catch (error) {
      console.error('Erro ao desvincular usuário:', error)
      alert('Erro ao desvincular usuário da empresa: ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  // Filtrar usuários
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.companies?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Verificar tanto o role global quanto o role da empresa
    const effectiveRole = user.company_role || user.role
    const matchesRole = !roleFilter || user.role === roleFilter || user.company_role === roleFilter
    const matchesStatus = !statusFilter || user.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleInfo = (role) => ROLES[role] || ROLES.user

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loading />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gerenciamento de Usuários
              </h1>
              <p className="text-gray-600">
                {users.length} usuários cadastrados no sistema
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => window.location.href = '/invites'}
            className="flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Convidar Usuário</span>
          </Button>
        </div>

        {/* Filtros */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as funções</option>
              {Object.entries(ROLES).map(([key, role]) => (
                <option key={key} value={key}>{role.label}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="pending">Pendente</option>
            </select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setRoleFilter('')
                setStatusFilter('')
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </Card>

        {/* Lista de Usuários */}
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Função
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  // Usar o role da empresa se existir, senão usar o role global
                  const effectiveRole = user.company_role || user.role
                  const roleInfo = getRoleInfo(effectiveRole)
                  const RoleIcon = roleInfo.icon

                  return (
                    <tr key={user.user_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || 'Nome não informado'}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${roleInfo.color}-100 text-${roleInfo.color}-800`}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {roleInfo.label}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Building2 className="h-3 w-3 mr-1 text-gray-400" />
                          {user.companies?.name ? (
                            <div className="flex items-center gap-2">
                              <span>{user.companies.name}</span>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setIsLinkModalOpen(true)
                                  }}
                                  className="text-blue-600 hover:text-blue-800 p-1 h-auto"
                                  title="Alterar empresa"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUnlinkFromCompany(user.user_id || user.id)}
                                  className="text-red-600 hover:text-red-800 p-1 h-auto"
                                  title="Desvincular da empresa"
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">Não vinculado</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setIsLinkModalOpen(true)
                                }}
                                className="text-blue-600 hover:text-blue-800 p-1 h-auto"
                                title="Vincular à empresa"
                              >
                                <Link className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${STATUS_COLORS[user.status]}-100 text-${STATUS_COLORS[user.status]}-800`}>
                          {user.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {user.status === 'inactive' && <XCircle className="h-3 w-3 mr-1" />}
                          {user.status === 'pending' && <AlertCircle className="h-3 w-3 mr-1" />}
                          {user.status === 'active' ? 'Ativo' : user.status === 'inactive' ? 'Inativo' : 'Pendente'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setIsViewModalOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setIsEditModalOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className={user.is_active ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                          >
                            {user.is_active ? (
                              <Trash2 className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Nenhum usuário encontrado
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || roleFilter || statusFilter
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Convide usuários para começar.'}
              </p>
            </div>
          )}
        </Card>

        {/* Modal de Visualização */}
        {isViewModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" onClick={() => setIsViewModalOpen(false)}>
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Detalhes do Usuário
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                      <p className="text-sm text-gray-900">{selectedUser.full_name || 'Não informado'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedUser.email}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Função</label>
                      <p className="text-sm text-gray-900">
                        {getRoleInfo(selectedUser.company_role || selectedUser.role).label}
                        {selectedUser.company_role && selectedUser.company_role !== selectedUser.role && (
                          <span className="text-xs text-gray-500 ml-2">
                            (Global: {getRoleInfo(selectedUser.role).label})
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Empresa</label>
                      <p className="text-sm text-gray-900">{selectedUser.companies?.name || 'Não vinculado'}</p>
                      {selectedUser.company_role && (
                        <p className="text-xs text-gray-500 mt-1">
                          Função na empresa: {getRoleInfo(selectedUser.company_role).label}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Data de Criação</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedUser.created_at)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button
                    onClick={() => setIsViewModalOpen(false)}
                    variant="outline"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Vinculação de Empresa */}
        {isLinkModalOpen && selectedUser && (
          <LinkUserModal
            user={selectedUser}
            companies={companies}
            onClose={() => {
              setIsLinkModalOpen(false)
              setSelectedUser(null)
            }}
            onLink={handleLinkToCompany}
            loading={updating}
          />
        )}

        {/* Modal de Edição */}
        {isEditModalOpen && selectedUser && (
          <EditUserModal
            user={selectedUser}
            onClose={() => {
              setIsEditModalOpen(false)
              setSelectedUser(null)
            }}
            onSave={handleUpdateUser}
            loading={updating}
          />
        )}
      </div>
    </Layout>
  )
}

// Componente Modal de Edição
function EditUserModal({ user, onClose, onSave, loading }) {
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    role: user.role || 'user'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(user.user_id, formData)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Editar Usuário
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="Nome completo do usuário"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Função
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(ROLES).map(([key, role]) => (
                      <option key={key} value={key}>{role.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email (não editável)
                  </label>
                  <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:ml-3 sm:w-auto"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="mt-3 w-full sm:mt-0 sm:w-auto"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Componente Modal de Vinculação
function LinkUserModal({ user, companies, onClose, onLink, loading }) {
  const isEdit = Boolean(user.companies?.id)
  const [selectedCompanyId, setSelectedCompanyId] = useState(user.companies?.id || '')
  const [selectedRole, setSelectedRole] = useState(user.company_role || 'user')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedCompanyId) {
      alert('Por favor, selecione uma empresa')
      return
    }
    
    const userId = user.user_id || user.id
    console.log('Modal: Tentando vincular usuário ID:', userId, 'Dados do usuário:', {
      user_id: user.user_id,
      id: user.id,
      email: user.email
    })
    
    onLink(userId, selectedCompanyId, selectedRole)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {isEdit ? 'Alterar Empresa do Usuário' : 'Vincular Usuário à Empresa'}
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  {isEdit 
                    ? `Alterar a empresa de ${user.full_name || user.email}`
                    : `Vincular ${user.full_name || user.email} a uma empresa`
                  }
                </p>
                
                {isEdit && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>Empresa atual:</strong> {user.companies?.name}
                    </p>
                    <p className="text-sm text-yellow-700">
                      <strong>Função atual:</strong> {user.company_role || 'user'}
                    </p>
                  </div>
                )}
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isEdit ? 'Nova Empresa' : 'Empresa'}
                  </label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecione uma empresa...</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Função na Empresa
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">Usuário</option>
                    <option value="company_admin">Admin da Empresa</option>
                    <option value="consultant">Consultor</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:ml-3 sm:w-auto"
              >
                {loading 
                  ? (isEdit ? 'Alterando...' : 'Vinculando...') 
                  : (isEdit ? 'Alterar' : 'Vincular')
                }
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="mt-3 w-full sm:mt-0 sm:w-auto"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}