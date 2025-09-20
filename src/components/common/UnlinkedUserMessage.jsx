import React from 'react'
import { AlertCircle, Building2, Mail } from 'lucide-react'

export default function UnlinkedUserMessage() {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-6 w-6 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-medium text-yellow-800">
            Aguardando Vinculação
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p className="mb-3">
              Sua conta ainda não está vinculada a nenhuma empresa. Para ter acesso completo ao sistema, você precisa ser vinculado por um administrador.
            </p>
            <div className="bg-white rounded-lg p-4 border border-yellow-200">
              <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                <Building2 className="h-4 w-4 mr-2" />
                Como proceder:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Entre em contato com o administrador da sua empresa</li>
                <li>Solicite a vinculação da sua conta ao sistema</li>
                <li>Aguarde a confirmação e ativação do acesso</li>
              </ul>
            </div>
            <div className="mt-4 flex items-center text-xs text-yellow-600">
              <Mail className="h-4 w-4 mr-1" />
              <span>Precisa de ajuda? Entre em contato com o suporte técnico.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}