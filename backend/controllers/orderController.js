import { getDB } from '../config/database.js';
import { bot } from '../services/botService.js';
import { ADMIN_CHAT_ID } from '../config/env.js';

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

export const getOrders = async (req, res) => {
  try {
    const db = await getDB();
    const orders = await db.all('SELECT * FROM orders');
    for (let o of orders) {
      o.items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
    }
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createOrder = async (req, res) => {
  try {
    const db = await getDB();
    const trackNumber = Math.random().toString().slice(2, 15);
    const order = {
      id: Date.now().toString(),
      trackNumber,
      name: req.body.name || 'Пользователь с сайта',
      phone: req.body.phone || 'Не указан',
      address: req.body.address || '',
      delivery: req.body.delivery || 'courier',
      payment: req.body.payment || 'cash',
      total: req.body.total || 0,
      status: 'new',
      source: 'website',
      date: new Date().toISOString(),
      customerChatId: null
    };
    
    await db.run(
      'INSERT INTO orders (id, trackNumber, name, phone, address, delivery, payment, total, status, source, date, customerChatId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [order.id, order.trackNumber, order.name, order.phone, order.address, order.delivery, order.payment, order.total, order.status, order.source, order.date, order.customerChatId]
    );

    const items = req.body.items || [];
    for (let item of items) {
      await db.run(
        'INSERT INTO order_items (order_id, book_id, title, price, quantity, image) VALUES (?, ?, ?, ?, ?, ?)',
        [order.id, item.id, item.title, item.price, item.quantity, item.image || null]
      );
    }

    // Admin Telegram xabarnomasi
    const sendAdminNotification = async () => {
      try {
        let adminMsg = `<b>🛎️ НОВЫЙ ЗАКАЗ (Сайт)!</b>\n\n`;
        adminMsg += `<b>🔖 Трек:</b> <code>${trackNumber}</code>\n`;
        adminMsg += `<b>👤 Клиент:</b> ${escapeHTML(order.name)}\n`;
        adminMsg += `<b>📱 Телефон:</b> ${escapeHTML(order.phone)}\n`;
        adminMsg += `<b>🚚 Доставка:</b> ${order.delivery === 'courier' ? 'Курьер' : 'Самовывоз'}\n`;
        if (order.address) adminMsg += `<b>📍 Адрес:</b> ${escapeHTML(order.address)}\n`;
        
        adminMsg += `\n<b>📚 Товары:</b>\n`;
        items.forEach((item, i) => {
          adminMsg += `${i + 1}. ${escapeHTML(item.title)} × ${item.quantity} — ${item.price * item.quantity} ₽\n`;
        });
        adminMsg += `\n<b>💰 ИТОГО: ${order.total} ₽</b>`;

        await bot.sendMessage(ADMIN_CHAT_ID, adminMsg, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Принять', callback_data: `web_accept_${order.id}` },
                { text: '❌ Отклонить', callback_data: `web_reject_${order.id}` }
              ],
              [{ text: '🚚 Доставлено', callback_data: `web_delivered_${order.id}` }]
            ]
          }
        });
      } catch (botErr) {
        console.error('Ошибка отправки уведомления:', botErr.message);
      }
    };

    sendAdminNotification();

    res.json({ success: true, trackNumber, orderId: order.id });
  } catch (err) {
    console.error('Ошибка при создании заказа:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const db = await getDB();
    const orderId = req.params.id;
    const status = req.body.status;
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) return res.status(404).json({ error: 'Buyurtma topilmadi' });
    
    await db.run('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);

    if (order.customerChatId) {
      const statusTexts = {
        'accepted': '✅ Ваш заказ принят и готовится к отправке!',
        'rejected': '❌ К сожалению, ваш заказ был отклонён. Свяжитесь с нами для уточнения.',
        'delivered': '🎉 Ваш заказ доставлен! Спасибо за покупку!',
        'shipping': '🚚 Ваш заказ отправлен! Трек: ' + order.trackNumber
      };
      if (statusTexts[status]) {
        bot.sendMessage(order.customerChatId, statusTexts[status]);
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
