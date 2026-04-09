import { getDB } from '../config/database.js';

export const getBooks = async (req, res) => {
  try {
    const db = await getDB();
    const books = await db.all('SELECT * FROM books');
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createBook = async (req, res) => {
  try {
    const db = await getDB();
    const book = {
      id: Date.now().toString(),
      title: req.body.title,
      author: req.body.author,
      pages: parseInt(req.body.pages) || 0,
      price: parseInt(req.body.price) || 0,
      description: req.body.description || `${req.body.title} — книга автора ${req.body.author}.`,
      image: req.body.image || '',
      category: req.body.category || 'Новинка'
    };
    await db.run(
      'INSERT INTO books (id, title, author, pages, price, description, image, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [book.id, book.title, book.author, book.pages, book.price, book.description, book.image, book.category]
    );
    res.json({ success: true, book });
  } catch (error) {
    console.error("Error in createBook:", error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const deleteBook = async (req, res) => {
  try {
    const db = await getDB();
    await db.run('DELETE FROM books WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
