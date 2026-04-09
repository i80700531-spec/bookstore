import express from 'express';
import { getStats } from '../controllers/statsController.js';
import { verifyAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', verifyAdmin, getStats);

export default router;
