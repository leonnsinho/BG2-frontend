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
  Trash2,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function CreateCompanyPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isSuperAdmin } = usePermissions()
  const [loading, setLoading] = useState(false)
  const [isInternational, setIsInternational] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
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
    
    setIsInternational(false)
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

  // Função para gerar dados de empresa internacional
  const generateInternationalData = () => {
    const internationalCompanies = [
      {
        name: 'TechVision Inc.',
        taxId: '12-3456789',
        email: 'contact@techvision.com',
        phone: '+1 (555) 123-4567',
        website: 'https://www.techvision.com',
        industry: 'Software Development',
        address: {
          street: '123 Silicon Valley Blvd',
          number: 'Suite 500',
          complement: 'Building A',
          neighborhood: 'Downtown',
          city: 'San Francisco',
          state: 'CA',
          zip: '94102',
          country: 'United States'
        }
      },
      {
        name: 'Global Solutions Ltd',
        taxId: 'GB123456789',
        email: 'info@globalsolutions.co.uk',
        phone: '+44 20 7123 4567',
        website: 'https://www.globalsolutions.co.uk',
        industry: 'Business Consulting',
        address: {
          street: '45 Oxford Street',
          number: 'Floor 3',
          complement: '',
          neighborhood: 'Westminster',
          city: 'London',
          state: 'England',
          zip: 'W1D 1BS',
          country: 'United Kingdom'
        }
      },
      {
        name: 'Innovare Technologies SRL',
        taxId: 'IT12345678901',
        email: 'contatto@innovare.it',
        phone: '+39 02 1234 5678',
        website: 'https://www.innovare.it',
        industry: 'Manufacturing',
        address: {
          street: 'Via Milano',
          number: '15',
          complement: 'Piano 2',
          neighborhood: 'Centro Storico',
          city: 'Milano',
          state: 'Lombardia',
          zip: '20121',
          country: 'Italy'
        }
      },
      {
        name: 'TechnoPort Unipessoal Lda',
        taxId: '123456789',
        email: 'geral@technoport.pt',
        phone: '+351 21 123 4567',
        website: 'https://www.technoport.pt',
        industry: 'Technology Services',
        address: {
          street: 'Avenida da Liberdade',
          number: '123',
          complement: '4º Andar',
          neighborhood: 'Baixa',
          city: 'Lisboa',
          state: 'Lisboa',
          zip: '1250-096',
          country: 'Portugal'
        }
      },
      {
        name: 'Soluciones Digitales SA',
        taxId: '30-12345678-9',
        email: 'contacto@solucionesdigitales.com.ar',
        phone: '+54 11 1234-5678',
        website: 'https://www.solucionesdigitales.com.ar',
        industry: 'Digital Marketing',
        address: {
          street: 'Avenida Corrientes',
          number: '1500',
          complement: 'Piso 8',
          neighborhood: 'San Nicolás',
          city: 'Buenos Aires',
          state: 'CABA',
          zip: 'C1042',
          country: 'Argentina'
        }
      },
      {
        name: 'Innovation GmbH',
        taxId: 'DE123456789',
        email: 'kontakt@innovation.de',
        phone: '+49 30 12345678',
        website: 'https://www.innovation.de',
        industry: 'Engineering',
        address: {
          street: 'Friedrichstraße',
          number: '200',
          complement: 'Etage 5',
          neighborhood: 'Mitte',
          city: 'Berlin',
          state: 'Berlin',
          zip: '10117',
          country: 'Germany'
        }
      }
    ]
    
    const selectedCompany = internationalCompanies[Math.floor(Math.random() * internationalCompanies.length)]
    const randomSize = ['micro', 'pequena', 'media', 'grande'][Math.floor(Math.random() * 4)]
    
    setIsInternational(true)
    setFormData({
      name: selectedCompany.name,
      cnpj: selectedCompany.taxId,
      email: selectedCompany.email,
      phone: selectedCompany.phone,
      website: selectedCompany.website,
      industry: selectedCompany.industry,
      size: randomSize,
      address: selectedCompany.address
    })
    toast.success('🌍 Dados de empresa internacional gerados!')
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
    setLogoFile(null)
    setLogoPreview(null)
    toast.success('🗑️ Formulário limpo!')
  }

  // Função para lidar com upload de logo
  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    
    if (!file) return

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Tipo de arquivo inválido. Use JPG, PNG, GIF ou WEBP')
      return
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. O tamanho máximo é 5MB')
      return
    }

    setLogoFile(file)

    // Criar preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  // Função para remover logo
  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    toast.success('Logo removido')
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

    // Validar CNPJ apenas se não for empresa internacional e o campo estiver preenchido
    if (!isInternational && formData.cnpj && !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(formData.cnpj)) {
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
      let logoUrl = null

      // 1. Upload do logo primeiro (se houver)
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        console.log('📤 Fazendo upload do logo:', filePath)

        const { error: uploadError } = await supabase.storage
          .from('company-avatars')
          .upload(filePath, logoFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('❌ Erro no upload do logo:', uploadError)
          throw new Error(`Erro ao fazer upload do logo: ${uploadError.message}`)
        }

        logoUrl = filePath
        console.log('✅ Logo uploaded:', logoUrl)
      }

      // 2. Criar empresa com logo_url
      const companyData = {
        name: formData.name.trim(),
        cnpj: formData.cnpj.trim() || null,
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        website: formData.website.trim() || null,
        industry: formData.industry.trim() || null,
        size: formData.size,
        address: Object.values(formData.address).some(v => v.trim()) ? formData.address : null,
        logo_url: logoUrl,
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

      if (error) {
        // Se houver erro ao criar empresa, deletar logo que foi enviado
        if (logoUrl) {
          await supabase.storage
            .from('company-avatars')
            .remove([logoUrl])
        }
        throw error
      }

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
                  Brasil
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateInternationalData}
                  className="bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Internacional
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#373435] flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#EBA500]" />
                  Informações Básicas
                </h2>
                
                {/* Toggle Empresa Internacional */}
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternational}
                      onChange={(e) => {
                        setIsInternational(e.target.checked)
                        if (e.target.checked) {
                          // Limpar campos brasileiros ao ativar modo internacional
                          handleInputChange('cnpj', '')
                          handleInputChange('address.zip', '')
                          handleInputChange('address.country', '')
                        } else {
                          handleInputChange('address.country', 'Brasil')
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#EBA500]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EBA500]"></div>
                    <span className="ms-3 text-sm font-medium text-[#373435]">
                      🌍 Empresa Internacional
                    </span>
                  </label>
                </div>
              </div>
              
              {/* Mensagem informativa quando modo internacional ativado */}
              {isInternational && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Modo Internacional Ativado</h4>
                      <p className="text-sm text-blue-700">
                        Os campos de documentos, telefone e CEP aceitarão formatos internacionais. 
                        Você pode inserir os dados no formato do país de origem da empresa.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload de Logo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#373435] mb-3">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  Logo da Empresa (Opcional)
                </label>
                
                {!logoPreview ? (
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF ou WEBP (MAX. 5MB)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleLogoChange}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                      <img
                        src={logoPreview}
                        alt="Preview do logo"
                        className="w-24 h-24 object-contain rounded-lg bg-white border border-gray-200"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#373435]">{logoFile?.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(logoFile?.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
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
                    {isInternational ? 'Documento Fiscal (Tax ID, EIN, etc.)' : 'CNPJ'}
                  </label>
                  <Input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => handleInputChange('cnpj', e.target.value)}
                    placeholder={isInternational ? 'Ex: 12-3456789 ou formato local' : '00.000.000/0000-00'}
                    className="w-full"
                  />
                  {!isInternational && (
                    <p className="mt-1 text-xs text-gray-500">Formato: XX.XXX.XXX/XXXX-XX</p>
                  )}
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
                    placeholder={isInternational ? '+1 234 567-8900 ou formato local' : '(11) 99999-9999'}
                    className="w-full"
                  />
                  {!isInternational && (
                    <p className="mt-1 text-xs text-gray-500">Formato brasileiro: (XX) XXXXX-XXXX</p>
                  )}
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
                
                {/* Campo País - sempre visível */}
                <div>
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    País
                  </label>
                  <Input
                    type="text"
                    value={formData.address.country}
                    onChange={(e) => handleInputChange('address.country', e.target.value)}
                    placeholder={isInternational ? 'Ex: Portugal, EUA, Argentina' : 'Brasil'}
                    className="w-full"
                  />
                </div>
                
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
                    {isInternational ? 'Estado/Região/Província' : 'Estado'}
                  </label>
                  <Input
                    type="text"
                    value={formData.address.state}
                    onChange={(e) => handleInputChange('address.state', e.target.value)}
                    placeholder={isInternational ? 'Ex: California, Lisboa' : 'SP'}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#373435] mb-2">
                    {isInternational ? 'Código Postal / ZIP' : 'CEP'}
                  </label>
                  <Input
                    type="text"
                    value={formData.address.zip}
                    onChange={(e) => handleInputChange('address.zip', e.target.value)}
                    placeholder={isInternational ? 'Ex: 90210, 1000-001' : '00000-000'}
                    className="w-full"
                  />
                  {!isInternational && (
                    <p className="mt-1 text-xs text-gray-500">Formato: XXXXX-XXX</p>
                  )}
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