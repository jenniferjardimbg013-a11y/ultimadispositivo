import * as SQLite from 'expo-sqlite';

const DB_NAME = 'meubanco.db';

export interface Tarefa {
  id: number;
  nome: string;
  imagem?: string | null;
  projeto_id: number | null;
}
export interface Projeto {
  id: number;
  nome: string;
  imagem?: string | null;
}


export async function setupDatabase() {
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS projetos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      imagem TEXT
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tarefas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      imagem TEXT,
      projeto_id INTEGER REFERENCES projetos(id)
    );
  `);

  const colunasProjetos = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(projetos)'
  );

  if (!colunasProjetos.some((coluna: { name: string }) => coluna.name === 'imagem')) {
    await db.execAsync('Alter TABLE projetos ADD COLUMN imagem TEXT;');
  }

  const colunas = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(tarefas)'
  );

  if (!colunas.some((coluna: { name: string }) => coluna.name === 'projeto_id')) {
    await db.execAsync(
      'ALTER TABLE tarefas ADD COLUMN projeto_id INTEGER REFERENCES projetos(id);'
    );
  }



  return db;
}
export const projetoService = {
  async create(db: SQLite.SQLiteDatabase, nome: string) {
    return db.runAsync('INSERT INTO projetos (nome, imagem) VALUES (?, ?)', [nome, null]);
  },
  async getAll(db: SQLite.SQLiteDatabase): Promise<Projeto[]> {
    return db.getAllAsync<Projeto>('SELECT * FROM projetos ORDER BY id DESC');
  },
  async update(db: SQLite.SQLiteDatabase,
    id: number,
    nome: string,
    imagem: string | null) {
    return db.runAsync('UPDATE projetos SET nome = ?, imagem = ? WHERE id = ?',
      [nome, imagem, id]
    );
  },
  async countTarefas(db: SQLite.SQLiteDatabase, projetoId: number): Promise<number> {
    const resultado = await db.getFirstAsync<{ total: number }>(
      'SELECT COUNT(*) AS total FROM tarefas WHERE projeto_id = ?',
      [projetoId]
    );
    return resultado?.total ?? 0;
  },
  async delete(db: SQLite.SQLiteDatabase, id: number) {
    return db.runAsync('DELETE FROM projetos WHERE id = ?', [id]);
  }
};


export const dbService = {

  async create(db: SQLite.SQLiteDatabase, nome: string, imagem: string | null, projetoId: number | null = null) {
    return await db.runAsync('INSERT INTO tarefas (nome, imagem, projeto_id) VALUES (?, ?, ?)', [nome, imagem, projetoId]);
  },


  async getAll(db: SQLite.SQLiteDatabase): Promise<Tarefa[]> {
    return await db.getAllAsync<Tarefa>('SELECT * FROM tarefas ORDER BY id DESC');
  },


  async update(db: SQLite.SQLiteDatabase, id: number, novoNome: string, novaImagem: string | null) {
    return await db.runAsync('UPDATE tarefas SET nome = ?, imagem = ? WHERE id = ?', [novoNome, novaImagem, id]);
  },


  async delete(db: SQLite.SQLiteDatabase, id: number) {
    return await db.runAsync('DELETE FROM tarefas WHERE id = ?', [id]);
  }
};