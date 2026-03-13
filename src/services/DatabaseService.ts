import Database from 'better-sqlite3'
import { DB_CONFIG } from '../config/constants'

/**
 * Serviço responsável pela persistência de dados no SQLite
 */
export class DatabaseService {
  private db: Database.Database

  constructor() {
    this.db = new Database(DB_CONFIG.DB_PATH)
    this.initialize()
  }

  /**
   * Cria as tabelas necessárias caso não existam
   */
  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS watched_users (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        username   TEXT    NOT NULL UNIQUE COLLATE NOCASE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('🗄️  Banco de dados SQLite inicializado')
  }

  /**
   * Adiciona um usuário à lista de monitorados.
   * Retorna true se adicionado, false se já existia.
   */
  addUser(username: string): boolean {
    const stmt = this.db.prepare(
      'INSERT OR IGNORE INTO watched_users (username) VALUES (?)'
    )
    const result = stmt.run(username.toLowerCase().trim())
    return result.changes > 0
  }

  /**
   * Remove um usuário da lista de monitorados.
   * Retorna true se removido, false se não existia.
   */
  removeUser(username: string): boolean {
    const stmt = this.db.prepare(
      'DELETE FROM watched_users WHERE username = ?'
    )
    const result = stmt.run(username.toLowerCase().trim())
    return result.changes > 0
  }

  /**
   * Retorna todos os usuários monitorados.
   */
  listUsers(): string[] {
    const rows = this.db
      .prepare('SELECT username FROM watched_users ORDER BY username ASC')
      .all() as { username: string }[]
    return rows.map((r) => r.username)
  }

  /**
   * Verifica se um usuário está na lista de monitorados.
   */
  isWatched(username: string): boolean {
    const row = this.db
      .prepare('SELECT 1 FROM watched_users WHERE username = ? LIMIT 1')
      .get(username.toLowerCase().trim())
    return row !== undefined
  }

  /**
   * Fecha a conexão com o banco de dados.
   */
  close(): void {
    this.db.close()
  }
}
