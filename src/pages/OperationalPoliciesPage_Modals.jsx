// Continuação dos Modais para OperationalPoliciesPage.jsx
// Adicione estes modais antes do fechamento do componente

{/* Modal de Conteúdo */}
{showContentModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#373435]">
          {editingContent ? 'Editar Conteúdo' : 'Novo Conteúdo'}
        </h2>
        <button
          onClick={() => setShowContentModal(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Conteúdo
          </label>
          <select
            value={contentForm.content_type}
            onChange={(e) => {
              const type = e.target.value
              let defaultData = { text: '' }
              
              if (type === 'list') defaultData = { items: [''] }
              if (type === 'table') defaultData = { headers: [''], rows: [['']] }
              if (type === 'heading') defaultData = { text: '', level: 2 }
              
              setContentForm({ content_type: type, content_data: defaultData })
            }}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#EBA500]"
          >
            <option value="text">Texto</option>
            <option value="heading">Título</option>
            <option value="list">Lista</option>
            <option value="table">Tabela</option>
          </select>
        </div>

        {/* Text */}
        {contentForm.content_type === 'text' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Texto
            </label>
            <textarea
              value={contentForm.content_data.text || ''}
              onChange={(e) => setContentForm(prev => ({
                ...prev,
                content_data: { text: e.target.value }
              }))}
              rows={8}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#EBA500] resize-none"
              placeholder="Digite o texto da política..."
            />
          </div>
        )}

        {/* Heading */}
        {contentForm.content_type === 'heading' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texto do Título
              </label>
              <input
                type="text"
                value={contentForm.content_data.text || ''}
                onChange={(e) => setContentForm(prev => ({
                  ...prev,
                  content_data: { ...prev.content_data, text: e.target.value }
                }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#EBA500]"
                placeholder="Título da seção"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nível
              </label>
              <select
                value={contentForm.content_data.level || 2}
                onChange={(e) => setContentForm(prev => ({
                  ...prev,
                  content_data: { ...prev.content_data, level: parseInt(e.target.value) }
                }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#EBA500]"
              >
                <option value="2">H2 (Grande)</option>
                <option value="3">H3 (Médio)</option>
                <option value="4">H4 (Pequeno)</option>
              </select>
            </div>
          </div>
        )}

        {/* List */}
        {contentForm.content_type === 'list' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Itens da Lista
            </label>
            <div className="space-y-2">
              {(contentForm.content_data.items || ['']).map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newItems = [...(contentForm.content_data.items || [''])]
                      newItems[index] = e.target.value
                      setContentForm(prev => ({
                        ...prev,
                        content_data: { items: newItems }
                      }))
                    }}
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#EBA500]"
                    placeholder={`Item ${index + 1}`}
                  />
                  <button
                    onClick={() => {
                      const newItems = (contentForm.content_data.items || ['']).filter((_, i) => i !== index)
                      setContentForm(prev => ({
                        ...prev,
                        content_data: { items: newItems.length > 0 ? newItems : [''] }
                      }))
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newItems = [...(contentForm.content_data.items || ['']), '']
                  setContentForm(prev => ({
                    ...prev,
                    content_data: { items: newItems }
                  }))
                }}
                className="text-[#EBA500] hover:text-[#EBA500]/80 text-sm font-medium"
              >
                + Adicionar Item
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {contentForm.content_type === 'table' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cabeçalhos da Tabela
              </label>
              <div className="flex gap-2">
                {(contentForm.content_data.headers || ['']).map((header, index) => (
                  <input
                    key={index}
                    type="text"
                    value={header}
                    onChange={(e) => {
                      const newHeaders = [...(contentForm.content_data.headers || [''])]
                      newHeaders[index] = e.target.value
                      setContentForm(prev => ({
                        ...prev,
                        content_data: { ...prev.content_data, headers: newHeaders }
                      }))
                    }}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#EBA500]"
                    placeholder={`Coluna ${index + 1}`}
                  />
                ))}
                <button
                  onClick={() => {
                    const newHeaders = [...(contentForm.content_data.headers || ['']), '']
                    const newRows = (contentForm.content_data.rows || [['']]).map(row => [...row, ''])
                    setContentForm(prev => ({
                      ...prev,
                      content_data: { ...prev.content_data, headers: newHeaders, rows: newRows }
                    }))
                  }}
                  className="px-3 py-2 text-[#EBA500] hover:bg-[#EBA500]/10 rounded-lg"
                >
                  + Col
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Linhas da Tabela
              </label>
              <div className="space-y-2">
                {(contentForm.content_data.rows || [['']]).map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-2">
                    {row.map((cell, cellIndex) => (
                      <input
                        key={cellIndex}
                        type="text"
                        value={cell}
                        onChange={(e) => {
                          const newRows = [...(contentForm.content_data.rows || [['']])]
                          newRows[rowIndex][cellIndex] = e.target.value
                          setContentForm(prev => ({
                            ...prev,
                            content_data: { ...prev.content_data, rows: newRows }
                          }))
                        }}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#EBA500]"
                      />
                    ))}
                    <button
                      onClick={() => {
                        const newRows = (contentForm.content_data.rows || [['']]).filter((_, i) => i !== rowIndex)
                        setContentForm(prev => ({
                          ...prev,
                          content_data: { ...prev.content_data, rows: newRows.length > 0 ? newRows : [['']] }
                        }))
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const colCount = contentForm.content_data.headers?.length || 1
                    const newRow = Array(colCount).fill('')
                    const newRows = [...(contentForm.content_data.rows || [['']]), newRow]
                    setContentForm(prev => ({
                      ...prev,
                      content_data: { ...prev.content_data, rows: newRows }
                    }))
                  }}
                  className="text-[#EBA500] hover:text-[#EBA500]/80 text-sm font-medium"
                >
                  + Adicionar Linha
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => setShowContentModal(false)}
          disabled={saving}
          className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSaveContent}
          disabled={saving}
          className="px-6 py-2 bg-[#EBA500] hover:bg-[#EBA500]/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}

{/* Modal de Anexo */}
{showAttachmentModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#373435]">
          Adicionar Anexo
        </h2>
        <button
          onClick={() => setShowAttachmentModal(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Arquivo *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#EBA500] transition-colors">
            <input
              type="file"
              onChange={(e) => setUploadFile(e.target.files[0])}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              {uploadFile ? (
                <p className="text-gray-900 font-medium">{uploadFile.name}</p>
              ) : (
                <>
                  <p className="text-gray-700 font-medium mb-1">
                    Clique para selecionar um arquivo
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, Word, Excel, imagens, etc.
                  </p>
                </>
              )}
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição (opcional)
          </label>
          <textarea
            value={uploadDescription}
            onChange={(e) => setUploadDescription(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#EBA500] resize-none"
            placeholder="Descrição do arquivo..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => setShowAttachmentModal(false)}
          disabled={uploading}
          className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleUploadAttachment}
          disabled={uploading || !uploadFile}
          className="px-6 py-2 bg-[#EBA500] hover:bg-[#EBA500]/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Fazendo Upload...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}
