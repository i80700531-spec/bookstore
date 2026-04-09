import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '../../database.sqlite');

let db;

export async function getDB() {
  if (db) return db;
  db = await open({ filename: DB_PATH, driver: sqlite3.Database });
  return db;
}

export async function initDB() {
  const database = await getDB();

  await database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      login TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      pages INTEGER DEFAULT 0,
      price INTEGER DEFAULT 0,
      description TEXT DEFAULT '',
      image TEXT DEFAULT '',
      category TEXT DEFAULT 'Новинка',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      trackNumber TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      delivery TEXT DEFAULT 'courier',
      payment TEXT DEFAULT 'cash',
      total INTEGER DEFAULT 0,
      status TEXT DEFAULT 'new',
      source TEXT DEFAULT 'website',
      date TEXT NOT NULL,
      customerChatId TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      book_id TEXT NOT NULL,
      title TEXT NOT NULL,
      price INTEGER DEFAULT 0,
      quantity INTEGER DEFAULT 1,
      image TEXT DEFAULT '',
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  // Default admin user: admin / 1234
  const existing = await database.get('SELECT id FROM users WHERE login = ?', ['admin']);
  if (!existing) {
    const hashed = await bcrypt.hash('1234', 10);
    await database.run('INSERT INTO users (login, password) VALUES (?, ?)', ['admin', hashed]);
    console.log('✅ Default admin created: login=admin, password=1234');
  }

  console.log('✅ Database initialized:', DB_PATH);
  return database;
}
