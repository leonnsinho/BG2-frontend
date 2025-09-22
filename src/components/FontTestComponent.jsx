import React from 'react'

const FontTestComponent = () => {
  return (
    <div className="p-8 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-primary-500 mb-2">
          Creato Display Fonts
        </h1>
        <p className="text-gray-600">Testando todas as variações da fonte</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-neutral-900 border-b pb-2">
            Pesos Normais
          </h3>
          <p className="font-thin text-lg">Creato Display Thin (100)</p>
          <p className="font-light text-lg">Creato Display Light (300)</p>
          <p className="font-normal text-lg">Creato Display Regular (400)</p>
          <p className="font-medium text-lg">Creato Display Medium (500)</p>
          <p className="font-bold text-lg">Creato Display Bold (700)</p>
          <p className="font-extrabold text-lg">Creato Display ExtraBold (800)</p>
          <p className="font-black text-lg">Creato Display Black (900)</p>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-neutral-900 border-b pb-2">
            Pesos Itálicos
          </h3>
          <p className="font-thin italic text-lg">Creato Display Thin Italic (100)</p>
          <p className="font-light italic text-lg">Creato Display Light Italic (300)</p>
          <p className="font-normal italic text-lg">Creato Display Regular Italic (400)</p>
          <p className="font-medium italic text-lg">Creato Display Medium Italic (500)</p>
          <p className="font-bold italic text-lg">Creato Display Bold Italic (700)</p>
          <p className="font-extrabold italic text-lg">Creato Display ExtraBold Italic (800)</p>
          <p className="font-black italic text-lg">Creato Display Black Italic (900)</p>
        </div>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg mt-8">
        <h3 className="text-xl font-bold mb-4 text-primary-600">
          Exemplo de Uso no Partimap
        </h3>
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-neutral-900">
            Dashboard Empresarial
          </h1>
          <h2 className="text-2xl font-bold text-primary-500">
            Gestão de Jornadas
          </h2>
          <p className="text-base font-medium text-neutral-700">
            Acompanhe o progresso das suas jornadas empresariais em tempo real
          </p>
          <p className="text-sm font-normal text-neutral-600">
            Utilize os insights gerados para tomar decisões estratégicas mais assertivas
          </p>
        </div>
        
        <div className="flex gap-4 mt-6">
          <button className="px-6 py-3 bg-primary-500 text-white font-bold rounded-lg hover:bg-primary-600 transition-colors">
            Iniciar Jornada
          </button>
          <button className="px-6 py-3 border-2 border-primary-500 text-primary-500 font-medium rounded-lg hover:bg-primary-50 transition-colors">
            Ver Relatórios
          </button>
        </div>
      </div>
    </div>
  )
}

export default FontTestComponent