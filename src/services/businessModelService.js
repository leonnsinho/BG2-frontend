import { supabase } from './supabase'

/**
 * Service para gerenciar os cartões do modelo de negócio
 */
class BusinessModelService {
  /**
   * Busca todos os cartões do modelo de negócio de uma empresa
   * @param {string} companyId - ID da empresa
   * @returns {Promise<Object>} Objeto com os cartões organizados por seção
   */
  async getCardsByCompany(companyId) {
    try {
      const { data, error } = await supabase
        .from('business_model_cards')
        .select('*')
        .eq('company_id', companyId)
        .order('position', { ascending: true })

      if (error) throw error

      // Organizar cartões por seção
      const cardsBySection = {}
      data.forEach(card => {
        if (!cardsBySection[card.section_id]) {
          cardsBySection[card.section_id] = []
        }
        cardsBySection[card.section_id].push({
          id: card.id,
          text: card.text,
          position: card.position
        })
      })

      return cardsBySection
    } catch (error) {
      console.error('Erro ao buscar cartões do modelo de negócio:', error)
      throw error
    }
  }

  /**
   * Cria um novo cartão
   * @param {string} companyId - ID da empresa
   * @param {string} sectionId - ID da seção
   * @param {string} text - Texto do cartão
   * @param {string} userId - ID do usuário que está criando
   * @returns {Promise<Object>} Cartão criado
   */
  async createCard(companyId, sectionId, text, userId) {
    try {
      // Buscar a última posição da seção
      const { data: existingCards, error: countError } = await supabase
        .from('business_model_cards')
        .select('position')
        .eq('company_id', companyId)
        .eq('section_id', sectionId)
        .order('position', { ascending: false })
        .limit(1)

      if (countError) throw countError

      const nextPosition = existingCards.length > 0 ? existingCards[0].position + 1 : 0

      const { data, error } = await supabase
        .from('business_model_cards')
        .insert({
          company_id: companyId,
          section_id: sectionId,
          text: text,
          position: nextPosition,
          created_by: userId,
          updated_by: userId
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        text: data.text,
        position: data.position
      }
    } catch (error) {
      console.error('Erro ao criar cartão:', error)
      throw error
    }
  }

  /**
   * Atualiza o texto de um cartão
   * @param {string} cardId - ID do cartão
   * @param {string} text - Novo texto
   * @param {string} userId - ID do usuário que está editando
   * @returns {Promise<Object>} Cartão atualizado
   */
  async updateCard(cardId, text, userId) {
    try {
      const { data, error } = await supabase
        .from('business_model_cards')
        .update({
          text: text,
          updated_by: userId
        })
        .eq('id', cardId)
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        text: data.text,
        position: data.position
      }
    } catch (error) {
      console.error('Erro ao atualizar cartão:', error)
      throw error
    }
  }

  /**
   * Deleta um cartão
   * @param {string} cardId - ID do cartão
   * @returns {Promise<void>}
   */
  async deleteCard(cardId) {
    try {
      const { error } = await supabase
        .from('business_model_cards')
        .delete()
        .eq('id', cardId)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao deletar cartão:', error)
      throw error
    }
  }

  /**
   * Reordena os cartões de uma seção
   * @param {string} companyId - ID da empresa
   * @param {string} sectionId - ID da seção
   * @param {Array<{id: string, position: number}>} cards - Array com IDs e novas posições
   * @returns {Promise<void>}
   */
  async reorderCards(companyId, sectionId, cards) {
    try {
      const updates = cards.map(card => 
        supabase
          .from('business_model_cards')
          .update({ position: card.position })
          .eq('id', card.id)
          .eq('company_id', companyId)
          .eq('section_id', sectionId)
      )

      await Promise.all(updates)
    } catch (error) {
      console.error('Erro ao reordenar cartões:', error)
      throw error
    }
  }
}

export const businessModelService = new BusinessModelService()
