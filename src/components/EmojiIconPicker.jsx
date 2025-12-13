import React, { useState } from 'react'
import EmojiPicker from 'emoji-picker-react'
import { 
  Search, Home, Users, Star, Heart, Mail, Phone, Calendar, Clock, MapPin,
  Briefcase, Building, TrendingUp, DollarSign, ShoppingCart, Target, Award,
  Settings, Wrench, Zap, AlertCircle, CheckCircle, XCircle, Info, HelpCircle,
  Book, FileText, Folder, File, Image, Video, Music, Download, Upload,
  Edit, Trash, Plus, Minus, X as CloseIcon, Check, ChevronRight, ChevronLeft,
  Grid3x3, List, Filter, Layout, Maximize, Minimize, Move, Copy, Share2,
  Lock, Unlock, Eye, EyeOff, User, UserPlus, UserMinus, UserCheck,
  MessageCircle, Send, Inbox, Archive, Bell, BellOff, Flag, Bookmark,
  ThumbsUp, ThumbsDown, Smile, Frown, Meh, Coffee, Package, Box,
  ShoppingBag, CreditCard, Wallet, Receipt, TrendingDown, BarChart, PieChart,
  LineChart, Activity, Gauge, Percent, Calculator, Coins, Banknote,
  Laptop, Smartphone, Tablet, Monitor, Printer, Keyboard, Mouse, Headphones,
  Wifi, WifiOff, Bluetooth, Battery, BatteryCharging, Power, Plug, Cable,
  Cloud, CloudOff, Database, Server, HardDrive, Save, RefreshCw, RotateCw,
  AlertTriangle, ShieldAlert, ShieldCheck, ShieldOff, Key, KeyRound,
  LogIn, LogOut, UserX, Users2, Contact, Mic, MicOff, Camera, CameraOff,
  PlayCircle, PauseCircle, StopCircle, SkipBack, SkipForward, Volume, Volume2,
  VolumeX, Radio, Tv, Film, Clapperboard, Lightbulb, Sparkles, Flame,
  Paintbrush, Palette, Brush, Scissors, Ruler, Pen, PenTool, Eraser,
  Layers, LayoutGrid, LayoutList, Sidebar, PanelLeft, PanelRight,
  Menu, MoreVertical, MoreHorizontal, Maximize2, Minimize2, ZoomIn, ZoomOut,
  Navigation, Compass, Map, MapPinned, Route, Car, Bike, Bus, Train, Plane,
  Rocket, Ship, Anchor, Waves, Mountain, Tent, TreePine, Palmtree,
  Gift, PartyPopper, Cake, Pizza, IceCream, Apple, Carrot, Fish,
  Utensils, UtensilsCrossed, ChefHat, CookingPot, Soup, Wine, Beer,
  Tag, Tags, Barcode, QrCode, Stamp, Sticker, Hash, AtSign, DollarSign as Dollar,
  Globe, Languages, Type, Bold, Italic, Underline, Strikethrough, AlignLeft,
  AlignCenter, AlignRight, AlignJustify, List as ListIcon, ListOrdered,
  Heading, Quote, Code, Code2, Terminal, Command, Columns, Rows,
  Pin, PinOff, Link, Link2, Unlink, ExternalLink, Anchor as AnchorIcon
} from 'lucide-react'

const ICON_CATEGORIES = {
  geral: {
    name: 'Geral',
    icons: [
      { name: 'Casa', icon: Home, key: 'Home' },
      { name: 'Usuários', icon: Users, key: 'Users' },
      { name: 'Estrela', icon: Star, key: 'Star' },
      { name: 'Coração', icon: Heart, key: 'Heart' },
      { name: 'Alvo', icon: Target, key: 'Target' },
      { name: 'Prêmio', icon: Award, key: 'Award' },
      { name: 'Configurações', icon: Settings, key: 'Settings' },
      { name: 'Buscar', icon: Search, key: 'Search' },
      { name: 'Menu', icon: Menu, key: 'Menu' },
      { name: 'Mais Vertical', icon: MoreVertical, key: 'MoreVertical' },
      { name: 'Mais Horizontal', icon: MoreHorizontal, key: 'MoreHorizontal' }
    ]
  },
  negocios: {
    name: 'Negócios',
    icons: [
      { name: 'Maleta', icon: Briefcase, key: 'Briefcase' },
      { name: 'Prédio', icon: Building, key: 'Building' },
      { name: 'Crescimento', icon: TrendingUp, key: 'TrendingUp' },
      { name: 'Queda', icon: TrendingDown, key: 'TrendingDown' },
      { name: 'Gráfico de Barras', icon: BarChart, key: 'BarChart' },
      { name: 'Gráfico de Pizza', icon: PieChart, key: 'PieChart' },
      { name: 'Gráfico de Linha', icon: LineChart, key: 'LineChart' },
      { name: 'Atividade', icon: Activity, key: 'Activity' },
      { name: 'Velocímetro', icon: Gauge, key: 'Gauge' },
      { name: 'Porcentagem', icon: Percent, key: 'Percent' }
    ]
  },
  financeiro: {
    name: 'Financeiro',
    icons: [
      { name: 'Dinheiro', icon: DollarSign, key: 'DollarSign' },
      { name: 'Cartão de Crédito', icon: CreditCard, key: 'CreditCard' },
      { name: 'Carteira', icon: Wallet, key: 'Wallet' },
      { name: 'Recibo', icon: Receipt, key: 'Receipt' },
      { name: 'Calculadora', icon: Calculator, key: 'Calculator' },
      { name: 'Moedas', icon: Coins, key: 'Coins' },
      { name: 'Nota', icon: Banknote, key: 'Banknote' },
      { name: 'Carrinho', icon: ShoppingCart, key: 'ShoppingCart' },
      { name: 'Sacola', icon: ShoppingBag, key: 'ShoppingBag' }
    ]
  },
  comunicacao: {
    name: 'Comunicação',
    icons: [
      { name: 'Email', icon: Mail, key: 'Mail' },
      { name: 'Telefone', icon: Phone, key: 'Phone' },
      { name: 'Mensagem', icon: MessageCircle, key: 'MessageCircle' },
      { name: 'Enviar', icon: Send, key: 'Send' },
      { name: 'Caixa de Entrada', icon: Inbox, key: 'Inbox' },
      { name: 'Notificação', icon: Bell, key: 'Bell' },
      { name: 'Silenciar', icon: BellOff, key: 'BellOff' },
      { name: 'Microfone', icon: Mic, key: 'Mic' },
      { name: 'Microfone Desligado', icon: MicOff, key: 'MicOff' }
    ]
  },
  arquivos: {
    name: 'Arquivos',
    icons: [
      { name: 'Pasta', icon: Folder, key: 'Folder' },
      { name: 'Arquivo', icon: File, key: 'File' },
      { name: 'Documento', icon: FileText, key: 'FileText' },
      { name: 'Imagem', icon: Image, key: 'Image' },
      { name: 'Vídeo', icon: Video, key: 'Video' },
      { name: 'Música', icon: Music, key: 'Music' },
      { name: 'Download', icon: Download, key: 'Download' },
      { name: 'Upload', icon: Upload, key: 'Upload' },
      { name: 'Arquivar', icon: Archive, key: 'Archive' },
      { name: 'Salvar', icon: Save, key: 'Save' },
      { name: 'Pacote', icon: Package, key: 'Package' },
      { name: 'Caixa', icon: Box, key: 'Box' }
    ]
  },
  edicao: {
    name: 'Edição',
    icons: [
      { name: 'Editar', icon: Edit, key: 'Edit' },
      { name: 'Deletar', icon: Trash, key: 'Trash' },
      { name: 'Adicionar', icon: Plus, key: 'Plus' },
      { name: 'Remover', icon: Minus, key: 'Minus' },
      { name: 'Fechar', icon: CloseIcon, key: 'CloseIcon' },
      { name: 'Confirmar', icon: Check, key: 'Check' },
      { name: 'Copiar', icon: Copy, key: 'Copy' },
      { name: 'Tesoura', icon: Scissors, key: 'Scissors' },
      { name: 'Pincel', icon: Paintbrush, key: 'Paintbrush' },
      { name: 'Paleta', icon: Palette, key: 'Palette' },
      { name: 'Borracha', icon: Eraser, key: 'Eraser' }
    ]
  },
  usuarios: {
    name: 'Usuários',
    icons: [
      { name: 'Usuário', icon: User, key: 'User' },
      { name: 'Adicionar Usuário', icon: UserPlus, key: 'UserPlus' },
      { name: 'Remover Usuário', icon: UserMinus, key: 'UserMinus' },
      { name: 'Usuário Verificado', icon: UserCheck, key: 'UserCheck' },
      { name: 'Usuário Bloqueado', icon: UserX, key: 'UserX' },
      { name: 'Grupo', icon: Users2, key: 'Users2' },
      { name: 'Contato', icon: Contact, key: 'Contact' },
      { name: 'Login', icon: LogIn, key: 'LogIn' },
      { name: 'Logout', icon: LogOut, key: 'LogOut' }
    ]
  },
  alertas: {
    name: 'Alertas',
    icons: [
      { name: 'Alerta', icon: AlertCircle, key: 'AlertCircle' },
      { name: 'Alerta Triângulo', icon: AlertTriangle, key: 'AlertTriangle' },
      { name: 'Sucesso', icon: CheckCircle, key: 'CheckCircle' },
      { name: 'Erro', icon: XCircle, key: 'XCircle' },
      { name: 'Info', icon: Info, key: 'Info' },
      { name: 'Ajuda', icon: HelpCircle, key: 'HelpCircle' },
      { name: 'Raio', icon: Zap, key: 'Zap' },
      { name: 'Lâmpada', icon: Lightbulb, key: 'Lightbulb' },
      { name: 'Brilho', icon: Sparkles, key: 'Sparkles' }
    ]
  },
  tempo: {
    name: 'Tempo & Agenda',
    icons: [
      { name: 'Calendário', icon: Calendar, key: 'Calendar' },
      { name: 'Relógio', icon: Clock, key: 'Clock' },
      { name: 'Atualizar', icon: RefreshCw, key: 'RefreshCw' },
      { name: 'Rotacionar', icon: RotateCw, key: 'RotateCw' }
    ]
  },
  tecnologia: {
    name: 'Tecnologia',
    icons: [
      { name: 'Laptop', icon: Laptop, key: 'Laptop' },
      { name: 'Smartphone', icon: Smartphone, key: 'Smartphone' },
      { name: 'Tablet', icon: Tablet, key: 'Tablet' },
      { name: 'Monitor', icon: Monitor, key: 'Monitor' },
      { name: 'Impressora', icon: Printer, key: 'Printer' },
      { name: 'Teclado', icon: Keyboard, key: 'Keyboard' },
      { name: 'Mouse', icon: Mouse, key: 'Mouse' },
      { name: 'Fones', icon: Headphones, key: 'Headphones' },
      { name: 'Wifi', icon: Wifi, key: 'Wifi' },
      { name: 'Bluetooth', icon: Bluetooth, key: 'Bluetooth' },
      { name: 'Bateria', icon: Battery, key: 'Battery' },
      { name: 'Carregando', icon: BatteryCharging, key: 'BatteryCharging' },
      { name: 'Poder', icon: Power, key: 'Power' },
      { name: 'Nuvem', icon: Cloud, key: 'Cloud' },
      { name: 'Banco de Dados', icon: Database, key: 'Database' },
      { name: 'Servidor', icon: Server, key: 'Server' },
      { name: 'HD', icon: HardDrive, key: 'HardDrive' },
      { name: 'Terminal', icon: Terminal, key: 'Terminal' },
      { name: 'Código', icon: Code, key: 'Code' }
    ]
  },
  seguranca: {
    name: 'Segurança',
    icons: [
      { name: 'Bloquear', icon: Lock, key: 'Lock' },
      { name: 'Desbloquear', icon: Unlock, key: 'Unlock' },
      { name: 'Escudo Verificado', icon: ShieldCheck, key: 'ShieldCheck' },
      { name: 'Escudo Alerta', icon: ShieldAlert, key: 'ShieldAlert' },
      { name: 'Escudo Desligado', icon: ShieldOff, key: 'ShieldOff' },
      { name: 'Chave', icon: Key, key: 'Key' },
      { name: 'Chave Redonda', icon: KeyRound, key: 'KeyRound' },
      { name: 'Visualizar', icon: Eye, key: 'Eye' },
      { name: 'Ocultar', icon: EyeOff, key: 'EyeOff' }
    ]
  },
  navegacao: {
    name: 'Navegação',
    icons: [
      { name: 'Direita', icon: ChevronRight, key: 'ChevronRight' },
      { name: 'Esquerda', icon: ChevronLeft, key: 'ChevronLeft' },
      { name: 'Navegação', icon: Navigation, key: 'Navigation' },
      { name: 'Bússola', icon: Compass, key: 'Compass' },
      { name: 'Mapa', icon: Map, key: 'Map' },
      { name: 'Localização', icon: MapPin, key: 'MapPin' },
      { name: 'Pin Fixado', icon: MapPinned, key: 'MapPinned' },
      { name: 'Rota', icon: Route, key: 'Route' },
      { name: 'Maximizar', icon: Maximize, key: 'Maximize' },
      { name: 'Minimizar', icon: Minimize, key: 'Minimize' },
      { name: 'Zoom In', icon: ZoomIn, key: 'ZoomIn' },
      { name: 'Zoom Out', icon: ZoomOut, key: 'ZoomOut' }
    ]
  },
  layout: {
    name: 'Layout',
    icons: [
      { name: 'Grade', icon: Grid3x3, key: 'Grid3x3' },
      { name: 'Lista', icon: List, key: 'List' },
      { name: 'Filtro', icon: Filter, key: 'Filter' },
      { name: 'Layout', icon: Layout, key: 'Layout' },
      { name: 'Grade Layout', icon: LayoutGrid, key: 'LayoutGrid' },
      { name: 'Lista Layout', icon: LayoutList, key: 'LayoutList' },
      { name: 'Camadas', icon: Layers, key: 'Layers' },
      { name: 'Sidebar', icon: Sidebar, key: 'Sidebar' },
      { name: 'Painel Esquerdo', icon: PanelLeft, key: 'PanelLeft' },
      { name: 'Painel Direito', icon: PanelRight, key: 'PanelRight' },
      { name: 'Colunas', icon: Columns, key: 'Columns' },
      { name: 'Linhas', icon: Rows, key: 'Rows' }
    ]
  },
  diversos: {
    name: 'Diversos',
    icons: [
      { name: 'Livro', icon: Book, key: 'Book' },
      { name: 'Bandeira', icon: Flag, key: 'Flag' },
      { name: 'Favorito', icon: Bookmark, key: 'Bookmark' },
      { name: 'Curtir', icon: ThumbsUp, key: 'ThumbsUp' },
      { name: 'Não Curtir', icon: ThumbsDown, key: 'ThumbsDown' },
      { name: 'Feliz', icon: Smile, key: 'Smile' },
      { name: 'Triste', icon: Frown, key: 'Frown' },
      { name: 'Neutro', icon: Meh, key: 'Meh' },
      { name: 'Café', icon: Coffee, key: 'Coffee' },
      { name: 'Presente', icon: Gift, key: 'Gift' },
      { name: 'Festa', icon: PartyPopper, key: 'PartyPopper' },
      { name: 'Compartilhar', icon: Share2, key: 'Share2' },
      { name: 'Link', icon: Link, key: 'Link' },
      { name: 'Link Externo', icon: ExternalLink, key: 'ExternalLink' },
      { name: 'Ferramenta', icon: Wrench, key: 'Wrench' },
      { name: 'Câmera', icon: Camera, key: 'Camera' },
      { name: 'Globo', icon: Globe, key: 'Globe' },
      { name: 'Etiqueta', icon: Tag, key: 'Tag' },
      { name: 'Código de Barras', icon: Barcode, key: 'Barcode' },
      { name: 'QR Code', icon: QrCode, key: 'QrCode' }
    ]
  }
}

export default function EmojiIconPicker({ value, onChange, onClose }) {
  const [activeTab, setActiveTab] = useState('emojis') // 'emojis' ou 'icons'
  const [iconCategory, setIconCategory] = useState('geral')
  const [iconSearch, setIconSearch] = useState('')

  // Filtra ícones pela busca
  const getFilteredIcons = () => {
    if (iconSearch.trim() === '') {
      return ICON_CATEGORIES[iconCategory].icons
    }
    
    // Se houver busca, retorna de todas as categorias
    const allIcons = Object.values(ICON_CATEGORIES).flatMap(cat => cat.icons)
    return allIcons.filter(icon =>
      icon.name.toLowerCase().includes(iconSearch.toLowerCase())
    )
  }

  const filteredIcons = getFilteredIcons()

  const handleEmojiClick = (emojiData) => {
    onChange(emojiData.emoji)
    onClose()
  }

  const handleIconClick = (iconKey) => {
    onChange(`icon:${iconKey}`)
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={onClose} />
      
      {/* Picker Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[70] bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('emojis')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'emojis'
                ? 'bg-[#EBA500] text-white'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            😊 Emojis
          </button>
          <button
            onClick={() => setActiveTab('icons')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'icons'
                ? 'bg-[#EBA500] text-white'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            ⚡ Ícones SVG
          </button>
        </div>

        {/* Content */}
        <div className="w-[350px] max-h-[400px] overflow-hidden">
          {activeTab === 'emojis' ? (
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              width="100%"
              height={400}
              searchPlaceHolder="Buscar emoji..."
              previewConfig={{ showPreview: false }}
            />
          ) : (
            <div className="p-3">
              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  placeholder="Buscar ícone..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#EBA500]"
                />
              </div>

              {/* Category Tabs (só aparece se não houver busca) */}
              {iconSearch.trim() === '' && (
                <div className="flex gap-1 mb-3 overflow-x-auto pb-2 scrollbar-thin">
                  {Object.entries(ICON_CATEGORIES).map(([key, category]) => (
                    <button
                      key={key}
                      onClick={() => setIconCategory(key)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                        iconCategory === key
                          ? 'bg-[#EBA500] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Icons Grid */}
              <div className="overflow-y-auto max-h-[300px] grid grid-cols-6 gap-2">
                {filteredIcons.map(({ name, icon: Icon, key }) => (
                  <button
                    key={key}
                    onClick={() => handleIconClick(key)}
                    className="p-2 hover:bg-[#EBA500]/10 rounded-lg transition-colors flex flex-col items-center group"
                    title={name}
                  >
                    <Icon className="h-6 w-6 text-gray-700 group-hover:text-[#EBA500]" />
                  </button>
                ))}
              </div>

              {filteredIcons.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Nenhum ícone encontrado
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
