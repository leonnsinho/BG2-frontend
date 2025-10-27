import { supabase } from './supabase'

/**
 * Serviço para gerenciar categorias de processos
 */

/**
 * Busca todas as categorias ativas
 * @returns {Promise<Array>} Array de categorias
 */
export const getActiveCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('order_position')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    throw error
  }
}

/**
 * Busca todas as categorias (incluindo inativas)
 * @returns {Promise<Array>} Array de categorias
 */
export const getAllCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('order_position')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar todas categorias:', error)
    throw error
  }
}

/**
 * Busca uma categoria por ID
 * @param {string} id - ID da categoria
 * @returns {Promise<Object>} Categoria
 */
export const getCategoryById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao buscar categoria:', error)
    throw error
  }
}

/**
 * Cria uma nova categoria
 * @param {Object} categoryData - Dados da categoria
 * @returns {Promise<Object>} Categoria criada
 */
export const createCategory = async (categoryData) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao criar categoria:', error)
    throw error
  }
}

/**
 * Atualiza uma categoria
 * @param {string} id - ID da categoria
 * @param {Object} updates - Dados para atualizar
 * @returns {Promise<Object>} Categoria atualizada
 */
export const updateCategory = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error)
    throw error
  }
}

/**
 * Desativa uma categoria (soft delete)
 * @param {string} id - ID da categoria
 * @returns {Promise<Object>} Categoria desativada
 */
export const deactivateCategory = async (id) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao desativar categoria:', error)
    throw error
  }
}

/**
 * Busca processos com informações de categoria (usando view)
 * @param {Object} filters - Filtros opcionais
 * @returns {Promise<Array>} Array de processos com categoria
 */
export const getProcessesWithCategory = async (filters = {}) => {
  try {
    let query = supabase
      .from('processes_with_category')
      .select('*')

    // Aplicar filtros
    if (filters.journey_id) {
      query = query.eq('journey_id', filters.journey_id)
    }

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data, error } = await query.order('name')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar processos com categoria:', error)
    throw error
  }
}

/**
 * Cria um mapa de categorias por ID para lookup rápido
 * @param {Array} categories - Array de categorias
 * @returns {Object} Mapa com id como chave
 */
export const createCategoriesMap = (categories) => {
  const map = {}
  categories.forEach(cat => {
    map[cat.id] = cat
  })
  return map
}
