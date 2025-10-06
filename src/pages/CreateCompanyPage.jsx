import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { 
  Building2, 
  ArrowLeft, 
  Save,
  AlertCircle,
  Check,
  Phone,
  Mail,
  MapPin,
  Globe,
  Users,
  CreditCard,
  TestTube,
  Shuffle,
  Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function CreateCompanyPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isSuperAdmin } = usePermissions()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    size: 'pequena',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zip: '',
      country: 'Brasil'
    }
  })

  // Verificar permissão
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#373435] mb-2">Acesso Negado</h3>
              <p className="text-gray-600 mb-4">
                Apenas Super Administradores podem criar empresas.
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleInputChange = (field, value) => {
    if (field.startsWith('address.')) {
      const addressField = field.replace('address.', '')
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  // Função para preencher dados de teste
  const fillTestData = () => {
    setFormData({
      name: 'Empresa Teste Ltda',
      cnpj: '12.345.678/0001-90',
      email: 'contato@empresateste.com.br',
      phone: '(11) 98765-4321',
      website: 'https://www.empresateste.com.br',
      industry: 'Tecnologia da Informação',
      size: 'media',
      address: {
        street: 'Avenida Paulista',
        number: '1578',
        complement: 'Conjunto 405',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zip: '01310-200',
        country: 'Brasil'
      }
    })
    toast.success('✅ Dados de teste preenchidos!')
  }

  // Função para gerar dados aleatórios
  const generateRandomData = () => {
    const companies = [
      'TechFlow Soluções',
      'InovaCorp Ltda',
      'Dynamics Systems',
      'Quantum Solutions',
      'Nexus Technologies',
      'Apex Digital'
    ]
    
    const industries = [
      'Tecnologia da Informação',
      'Consultoria Empresarial', 
      'E-commerce',
      'Manufatura',
      'Serviços Financeiros',
      'Marketing Digital'
    ]
    
    const streets = [
      'Rua Augusta', 'Avenida Faria Lima', 'Rua Oscar Freire',
      'Avenida Berrini', 'Rua da Consolação', 'Avenida Rebouças'
    ]
    
    const neighborhoods = [
      'Itaim Bibi', 'Vila Olímpia', 'Pinheiros', 
      'Jardins', 'Centro', 'Brooklin'
    ]
    
    const randomCompany = companies[Math.floor(Math.random() * companies.length)]
    const randomIndustry = industries[Math.floor(Math.random() * industries.length)]
    const randomStreet = streets[Math.floor(Math.random() * streets.length)]
    const randomNeighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)]
    const randomNumber = Math.floor(Math.random() * 9999) + 1
    const randomId = Math.floor(Math.random() * 999) + 100
    
    setFormData({
      name: randomCompany,
      cnpj: `12.345.${randomId}/0001-90`,
      email: `contato@${randomCompany.toLowerCase().replace(/\s+/g, '')}.com.br`,
      phone: `(11) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
      website: `https://www.${randomCompany.toLowerCase().replace(/\s+/g, '')}.com.br`,
      industry: randomIndustry,
      size: ['micro', 'pequena', 'media', 'grande'][Math.floor(Math.random() * 4)],
      address: {
        street: randomStreet,
        number: randomNumber.toString(),
        complement: `Sala ${Math.floor(Math.random() * 100) + 1}`,
        neighborhood: randomNeighborhood,
        city: 'São Paulo',
        state: 'SP',
        zip: `0${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 999).toString().padStart(3, '0')}-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`,
        country: 'Brasil'
      }
    })
    toast.success('🎲 Dados aleatórios gerados!')
  }

  // Função para limpar formulário
  const clearForm = () => {
    setFormData({
      name: '',
      cnpj: '',
      email: '',
      phone: '',
      website: '',
      industry: '',
      size: 'pequena',
      address: {
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zip: '',
        country: 'Brasil'
      }
    })
    toast.success('🗑️ Formulário limpo!')
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Nome da empresa é obrigatório')
      return false
    }

    if (!formData.email.trim()) {
      toast.error('Email da empresa é obrigatório')
      return false
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Email inválido')
      return false
    }

    if (formData.cnpj && !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(formData.cnpj)) {
      toast.error('CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)

    try {
      const companyData = {
        name: formData.name.trim(),
        cnpj: formData.cnpj.trim() || null,
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        website: formData.website.trim() || null,
        industry: formData.industry.trim() || null,
        size: formData.size,
        address: Object.values(formData.address).some(v => v.trim()) ? formData.address : null,
        created_by: user.id,
        subscription_plan: 'basic',
        subscription_status: 'active',
        is_active: true
      }

      console.log('💾 Criando empresa:', companyData)

      const { data, error } = await supabase
        .from('companies')
        .insert([companyData])
        .select()
        .single()

      if (error) throw error

      console.log('✅ Empresa criada com sucesso:', data)
      
      toast.success('✅ Empresa criada com sucesso!')
      
      // Aguardar um pouco antes de navegar
      setTimeout(() => {
        navigate('/companies', { 
          state: { 
            message: `Empresa "${data.name}" criada com sucesso!`,
            newCompanyId: data.id 
          }
        })
      }, 1500)

    } catch (error) {
      console.error('❌ Erro ao criar empresa:', error)
      
      if (error.message.includes('cnpj')) {
        toast.error('CNPJ já está em uso por outra empresa')
      } else if (error.message.includes('email')) {
        toast.error('Email já está em uso por outra empresa')
      } else {
        toast.error(`Erro ao criar empresa: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
            
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-[#EBA500]/20 to-[#EBA500]/10">
                <Building2 className="w-6 h-6 text-[#EBA500]" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-[#373435] mb-3">Nova Empresa</h1>
                <p className="text-gray-600 text-lg">
                  Cadastre uma nova empresa no sistema
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={fillTestData}
                  className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Dados Fixos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateRandomData}
                  className="bg-green-50 border-green-200 text-green-800 hover:bg-green-100"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Gerar Aleatório
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearForm}
                  className="bg-red-50 border-red-200 text-red-800 hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Informações Básicas */}
            <Card className="p-6 bg-white shadow-sm border border-gray-200/50 rounded-3xl">
              <h2 className="text-xl font-semibold text-[#373435] mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#EBA500]" />
                Informações Básicas
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    Nome da Empresa *
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ex: Empresa ABC Ltda"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    CNPJ
                  </label>
                  <Input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => handleInputChange('cnpj', e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    Porte da Empresa
                  </label>
                  <select
                    value={formData.size}
                    onChange={(e) => handleInputChange('size', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/50 focus:border-[#EBA500] transition-all duration-200"
                  >
                    <option value="micro">Microempresa</option>
                    <option value="pequena">Pequena Empresa</option>
                    <option value="media">Média Empresa</option>
                    <option value="grande">Grande Empresa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    Setor de Atuação
                  </label>
                  <Input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    placeholder="Ex: Tecnologia, Varejo, Serviços..."
                    className="w-full"
                  />
                </div>
              </div>
            </Card>

            {/* Informações de Contato */}
            <Card className="p-6 bg-white shadow-sm border border-gray-200/50 rounded-3xl">
              <h2 className="text-xl font-semibold text-[#373435] mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-[#EBA500]" />
                Informações de Contato
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email Principal *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contato@empresa.com"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Telefone
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Website
                  </label>
                  <Input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://www.empresa.com.br"
                    className="w-full"
                  />
                </div>
              </div>
            </Card>

            {/* Endereço */}
            <Card className="p-6 bg-white shadow-sm border border-gray-200/50 rounded-3xl">
              <h2 className="text-xl font-semibold text-[#373435] mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#EBA500]" />
                Endereço (Opcional)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    Logradouro
                  </label>
                  <Input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                    placeholder="Rua, Avenida, etc."
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    Número
                  </label>
                  <Input
                    type="text"
                    value={formData.address.number}
                    onChange={(e) => handleInputChange('address.number', e.target.value)}
                    placeholder="123"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    Complemento
                  </label>
                  <Input
                    type="text"
                    value={formData.address.complement}
                    onChange={(e) => handleInputChange('address.complement', e.target.value)}
                    placeholder="Sala, Apto, etc."
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    Bairro
                  </label>
                  <Input
                    type="text"
                    value={formData.address.neighborhood}
                    onChange={(e) => handleInputChange('address.neighborhood', e.target.value)}
                    placeholder="Centro"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    Cidade
                  </label>
                  <Input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => handleInputChange('address.city', e.target.value)}
                    placeholder="São Paulo"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    Estado
                  </label>
                  <Input
                    type="text"
                    value={formData.address.state}
                    onChange={(e) => handleInputChange('address.state', e.target.value)}
                    placeholder="SP"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    CEP
                  </label>
                  <Input
                    type="text"
                    value={formData.address.zip}
                    onChange={(e) => handleInputChange('address.zip', e.target.value)}
                    placeholder="00000-000"
                    className="w-full"
                  />
                </div>
              </div>
            </Card>

            {/* Informações do Sistema */}
            <Card className="p-6 bg-white shadow-sm border border-gray-200/50 rounded-3xl">
              <h2 className="text-xl font-semibold text-[#373435] mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#EBA500]" />
                Configurações Iniciais
              </h2>
              
              <div className="bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/5 border border-[#EBA500]/30 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#EBA500] mt-0.5" />
                  <div>
                    <h4 className="font-medium text-[#373435] mb-1">Configuração Automática</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Plano: Básico (pode ser alterado posteriormente)</li>
                      <li>• Status: Ativo</li>
                      <li>• Criado por: {user?.email}</li>
                      <li>• Data de criação: {new Date().toLocaleDateString('pt-BR')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            {/* Botões de Ação */}
            <div className="flex items-center justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
              >
                Cancelar
              </Button>
              
              <Button
                type="submit"
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Criar Empresa
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
  )
}