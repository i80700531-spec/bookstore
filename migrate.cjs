const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');
const bcrypt = require('bcryptjs');

async function migrate() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      login TEXT UNIQUE,
      password TEXT
    );
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT,
      author TEXT,
      pages INTEGER,
      price INTEGER,
      description TEXT,
      image TEXT,
      category TEXT
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      trackNumber TEXT,
      name TEXT,
      phone TEXT,
      address TEXT,
      delivery TEXT,
      payment TEXT,
      total INTEGER,
      status TEXT,
      source TEXT,
      date TEXT,
      customerChatId TEXT
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT,
      book_id TEXT,
      title TEXT,
      price INTEGER,
      quantity INTEGER,
      image TEXT,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    );
  `);

  // Создаём стандартного админа: admin / 1234
  const hashedPassword = await bcrypt.hash('1234', 10);
  await db.run('INSERT OR IGNORE INTO users (login, password) VALUES (?, ?)', ['admin', hashedPassword]);

  // Читаем data.json, если он есть
  if (fs.existsSync('./data.json')) {
    const dataJSON = JSON.parse(fs.readFileSync('./data.json', 'utf-8'));
    
    // Книги
    if (dataJSON.books) {
      for (const b of dataJSON.books) {
        await db.run(
          `INSERT OR IGNORE INTO books (id, title, author, pages, price, description, image, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [b.id, b.title, b.author, b.pages, b.price, b.description, b.image, b.category]
        );
      }
    }

    // Заказы
    if (dataJSON.orders) {
      for (const o of dataJSON.orders) {
        await db.run(
          `INSERT OR IGNORE INTO orders (id, trackNumber, name, phone, address, delivery, payment, total, status, source, date, customerChatId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [o.id, o.trackNumber, o.name, o.phone, o.address, o.delivery, o.payment, o.total, o.status, o.source, o.date, o.customerChatId]
        );
        for (const i of o.items) {
          await db.run(
            `INSERT INTO order_items (order_id, book_id, title, price, quantity, image) VALUES (?, ?, ?, ?, ?, ?)`,
            [o.id, i.id, i.title, i.price, i.quantity, i.image || null]
          );
        }
      }
    }
    console.log('Миграция успешно завершена! База создана: database.sqlite');
    
    // Бэкап data.json
    fs.renameSync('./data.json', './data.json.bak');
    console.log('Файл data.json переименован в data.json.bak (для резерва).');
  } else {
    console.log('Файл data.json не найден. Создана пустая база данных.');
  }

  await db.close();
}

migrate().catch(console.error);
