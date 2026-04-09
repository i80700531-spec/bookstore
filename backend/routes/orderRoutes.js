import express from 'express';
import { getOrders, createOrder, updateOrderStatus } from '../controllers/orderController.js';
import { verifyAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', verifyAdmin, getOrders);
router.post('/', createOrder);
router.put('/:id/status', verifyAdmin, updateOrderStatus);

export default router;
