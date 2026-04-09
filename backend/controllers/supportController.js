import { bot } from '../services/botService.js';
import { ADMIN_CHAT_ID } from '../config/env.js';

export const sendSupportMessage = async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const adminMsg = `📩 *Новое сообщение из службы поддержки (Сайт)*\n\n📝 *Текст:* ${message}`;

    bot.sendMessage(ADMIN_CHAT_ID, adminMsg, { parse_mode: 'Markdown' });

    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error("Error in sendSupportMessage:", error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
