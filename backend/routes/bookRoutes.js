import express from 'express';
import { getBooks, createBook, deleteBook } from '../controllers/bookController.js';
import { verifyAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getBooks);
router.post('/', verifyAdmin, createBook);
router.delete('/:id', verifyAdmin, deleteBook);

export default router;
