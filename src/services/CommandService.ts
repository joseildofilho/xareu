import { Message } from 'discord.js'
import { AudioService } from './AudioService'
import { VoiceService } from './VoiceService'
import { DatabaseService } from './DatabaseService'

/**
 * Serviço responsável pelo processamento de comandos via DM
 */
export class CommandService {
  private audioService: AudioService
  private voiceService: VoiceService
  private databaseService: DatabaseService

  constructor(audioService: AudioService, voiceService: VoiceService, databaseService: DatabaseService) {
    this.audioService = audioService
    this.voiceService = voiceService
    this.databaseService = databaseService
  }

  /**
   * Lista todos os áudios disponíveis
   */
  async listAvailableAudios(message: Message): Promise<void> {
    console.log('📋 Comando help recebido')

    const audioList = this.audioService.listAvailableAudios()

    if (audioList.length === 0) {
      await message.reply('📂 Nenhum áudio encontrado!')
      return
    }

    const formattedList = audioList.join('\n• ')

    await message.reply(
      `🎵 **Áudios disponíveis:**\n• ${formattedList}\n\n💡 Digite o nome do áudio para tocar!`
    )
  }

  /**
   * Processa um comando de áudio
   */
  async processAudioCommand(message: Message, audioName: string): Promise<void> {
    const { connection, guildName } = await this.voiceService.findActiveConnection()

    if (!connection) {
      console.log('⏭️  Bot não está em nenhum canal de voz')
      await message.reply('❌ Não estou conectado em nenhum canal de voz no momento!')
      return
    }

    await message.reply(`🔊 Tocando "${audioName}.mp3" no servidor: ${guildName}`)

    this.voiceService.playAudioByName(audioName, connection)
  }

  /**
   * Adiciona um usuário à lista de monitorados
   */
  async addWatchedUser(message: Message, username: string): Promise<void> {
    if (!username) {
      await message.reply('❌ Uso: `!add <username>`')
      return
    }

    const added = this.databaseService.addUser(username)

    if (added) {
      console.log(`➕ Usuário adicionado à lista: ${username}`)
      await message.reply(`✅ **${username}** adicionado à lista de monitorados! Vou rosnar quando ele entrar.`)
    } else {
      await message.reply(`⚠️ **${username}** já está na lista de monitorados.`)
    }
  }

  /**
   * Remove um usuário da lista de monitorados
   */
  async removeWatchedUser(message: Message, username: string): Promise<void> {
    if (!username) {
      await message.reply('❌ Uso: `!remove <username>`')
      return
    }

    const removed = this.databaseService.removeUser(username)

    if (removed) {
      console.log(`➖ Usuário removido da lista: ${username}`)
      await message.reply(`✅ **${username}** removido da lista de monitorados.`)
    } else {
      await message.reply(`⚠️ **${username}** não está na lista de monitorados.`)
    }
  }

  /**
   * Lista todos os usuários monitorados
   */
  async listWatchedUsers(message: Message): Promise<void> {
    const users = this.databaseService.listUsers()

    if (users.length === 0) {
      await message.reply('📋 A lista de monitorados está vazia.\nUse `!add <username>` para adicionar alguém.')
      return
    }

    const formatted = users.map((u) => `• ${u}`).join('\n')
    await message.reply(`👁️ **Usuários monitorados (${users.length}):**\n${formatted}`)
  }

  /**
   * Processa uma mensagem DM
   */
  async processDM(message: Message): Promise<void> {
    console.log(`📨 DM recebida de ${message.author.tag}: "${message.content}"`)

    const raw = message.content.trim()
    const lower = raw.toLowerCase()

    if (lower === 'help') {
      await this.listAvailableAudios(message)
      return
    }

    if (lower === '!list') {
      await this.listWatchedUsers(message)
      return
    }

    if (lower.startsWith('!add ')) {
      const username = raw.slice(5).trim()
      await this.addWatchedUser(message, username)
      return
    }

    if (lower.startsWith('!remove ')) {
      const username = raw.slice(8).trim()
      await this.removeWatchedUser(message, username)
      return
    }

    await this.processAudioCommand(message, lower)
  }
}
