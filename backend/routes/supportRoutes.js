import express from 'express';
import { sendSupportMessage } from '../controllers/supportController.js';

const router = express.Router();

router.post('/', sendSupportMessage);

export default router;
