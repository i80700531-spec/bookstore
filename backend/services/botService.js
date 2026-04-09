import TelegramBot from 'node-telegram-bot-api';
import { TOKEN, ADMIN_CHAT_ID } from '../config/env.js';
import { getDB } from '../config/database.js';

export const bot = new TelegramBot(TOKEN, { polling: true });

const sessions = {};

function getSession(chatId) {
  if (!sessions[chatId]) {
    sessions[chatId] = { step: null, cart: [], order: {} };
  }
  return sessions[chatId];
}

const mainMenu = {
  reply_markup: {
    keyboard: [
      ['📚 Каталог книг', '🛒 Моя корзина'],
      ['🔍 Поиск книги', '📦 Оформить заказ'],
      ['📞 Контакты', '❓ Помощь']
    ],
    resize_keyboard: true
  }
};

export function initBot() {
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from.first_name || 'Дорогой читатель';
    sessions[chatId] = { step: null, cart: [], order: {} };
    bot.sendMessage(chatId,
      `📚 *Добро пожаловать в Книжный Мир!*\n\nПривет, *${name}*! 👋\n\n✅ Просматривайте каталог\n✅ Ищите книги\n✅ Оформляйте заказ\n\nВыберите раздел:`,
      { parse_mode: 'Markdown', ...mainMenu }
    );
  });

  async function showCatalog(chatId) {
    const db = await getDB();
    const books = await db.all('SELECT * FROM books');
    bot.sendMessage(chatId, '📚 *Наш каталог книг:*\n\nВыберите книгу:', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: books.map(book => ([
          { text: `📖 ${book.title} — ${book.price} ₽`, callback_data: `book_${book.id}` }
        ]))
      }
    });
  }

  async function showBook(chatId, bookId) {
    const db = await getDB();
    const book = await db.get('SELECT * FROM books WHERE id = ?', [bookId]);
    if (!book) return;
    const text = `📖 *${book.title}*\n\n✍️ Автор: ${book.author}\n📄 Страниц: ${book.pages}\n🏷️ ${book.category}\n💰 *${book.price} ₽*\n\n📝 ${book.description}`;
    bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛒 В корзину', callback_data: `add_${book.id}` }],
          [{ text: '◀️ Каталог', callback_data: 'catalog' }]
        ]
      }
    });
  }

  function showCart(chatId) {
    const session = getSession(chatId);
    if (session.cart.length === 0) {
      return bot.sendMessage(chatId, '🛒 *Корзина пуста*\n\nДобавьте книги!', {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '📚 Каталог', callback_data: 'catalog' }]] }
      });
    }
    let text = '🛒 *Ваша корзина:*\n\n';
    let total = 0;
    session.cart.forEach((item, i) => {
      text += `${i + 1}. 📖 *${item.title}*\n   ${item.price} ₽ × ${item.quantity} = ${item.price * item.quantity} ₽\n\n`;
      total += item.price * item.quantity;
    });
    text += `━━━━━━━━━━━━\n💰 *Итого: ${total} ₽*`;
    bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📦 Оформить заказ', callback_data: 'start_order' }],
          [{ text: '🗑️ Очистить', callback_data: 'clear_cart' }],
          [{ text: '📚 Ещё покупки', callback_data: 'catalog' }]
        ]
      }
    });
  }

  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data_cb = query.data;
    const session = getSession(chatId);
    bot.answerCallbackQuery(query.id);
    const db = await getDB();

    if (data_cb === 'catalog') return showCatalog(chatId);
    if (data_cb.startsWith('book_')) return showBook(chatId, data_cb.replace('book_', ''));
    
    if (data_cb.startsWith('add_')) {
      const bookId = data_cb.replace('add_', '');
      const book = await db.get('SELECT * FROM books WHERE id = ?', [bookId]);
      if (!book) return;
      const existing = session.cart.find(i => i.id === book.id);
      if (existing) existing.quantity += 1;
      else session.cart.push({ ...book, quantity: 1 });
      const cnt = session.cart.reduce((s, i) => s + i.quantity, 0);
      bot.sendMessage(chatId, `✅ *«${book.title}»* добавлена!\n🛒 В корзине: ${cnt}`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🛒 Корзина', callback_data: 'cart' }],
            [{ text: '📚 Ещё', callback_data: 'catalog' }]
          ]
        }
      });
    }

    if (data_cb === 'cart') return showCart(chatId);
    if (data_cb === 'clear_cart') { session.cart = []; bot.sendMessage(chatId, '🗑️ Корзина очищена!', mainMenu); }
    
    if (data_cb === 'start_order') {
      if (session.cart.length === 0) return bot.sendMessage(chatId, '❌ Корзина пуста!', mainMenu);
      session.step = 'ask_name';
      bot.sendMessage(chatId, '📦 *Оформление заказа*\n\nШаг 1/3: Ваше *имя и фамилия*:', {
        parse_mode: 'Markdown', reply_markup: { remove_keyboard: true }
      });
    }

    if (data_cb === 'delivery_courier') {
      session.order.delivery = 'courier';
      session.step = 'ask_address';
      bot.sendMessage(chatId, '🚚 Шаг 3/3: *Адрес доставки*:', { parse_mode: 'Markdown' });
    }
    if (data_cb === 'delivery_pickup') {
      session.order.delivery = 'pickup';
      session.order.address = 'г. Москва, ул. Книжная, 10';
      finishBotOrder(chatId, session);
    }

    if (data_cb.startsWith('web_accept_') || data_cb.startsWith('web_reject_') || data_cb.startsWith('web_delivered_') || data_cb.startsWith('bot_accept_') || data_cb.startsWith('bot_reject_') || data_cb.startsWith('bot_delivered_')) {
      const parts = data_cb.split('_');
      const action = parts[1]; // accept, reject, delivered
      const orderId = parts.slice(2).join('_');
      const order = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
      if (!order) return bot.sendMessage(chatId, '❌ Заказ не найден');

      const statusMap = { accept: 'accepted', reject: 'rejected', delivered: 'delivered' };
      await db.run('UPDATE orders SET status = ? WHERE id = ?', [statusMap[action], orderId]);

      const emojiMap = { accept: '✅', reject: '❌', delivered: '🚚' };
      const textMap = { accept: 'Заказ принят', reject: 'Заказ отклонён', delivered: 'Заказ доставлен' };
      bot.sendMessage(chatId, `${emojiMap[action]} ${textMap[action]}!\nТрек: ${order.trackNumber}\nКлиент: ${order.name}`);

      if (order.customerChatId) {
        const msgs = {
          accept: '✅ Ваш заказ принят и готовится!',
          reject: '❌ Ваш заказ отклонён. Свяжитесь с нами.',
          delivered: '🎉 Ваш заказ доставлен! Спасибо!'
        };
        bot.sendMessage(order.customerChatId, msgs[action]);
      }
    }
  });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || '';
    const session = getSession(chatId);
    const db = await getDB();

    if (text.startsWith('/')) return;
    if (text === '📚 Каталог книг') return showCatalog(chatId);
    if (text === '🛒 Моя корзина') return showCart(chatId);
    if (text === '📦 Оформить заказ') {
      if (session.cart.length === 0) return bot.sendMessage(chatId, '🛒 Корзина пуста!', mainMenu);
      session.step = 'ask_name';
      return bot.sendMessage(chatId, '📦 *Оформление заказа*\n\nШаг 1/3: *Имя и фамилия*:', {
        parse_mode: 'Markdown', reply_markup: { remove_keyboard: true }
      });
    }
    if (text === '🔍 Поиск книги') {
      session.step = 'search';
      return bot.sendMessage(chatId, '🔍 Введите название книги:', { reply_markup: { remove_keyboard: true } });
    }
    if (text === '📞 Контакты') {
      return bot.sendMessage(chatId,
        '📞 *Контакты:*\n\n📱 +7 (999) 123-45-67\n📧 info@knizhniy-mir.ru\n📍 г. Москва, ул. Книжная, 10\n\n🕐 Пн-Пт: 09-21 | Сб: 10-22 | Вс: 11-19',
        { parse_mode: 'Markdown', ...mainMenu }
      );
    }
    if (text === '❓ Помощь') {
      return bot.sendMessage(chatId,
        '❓ *Помощь:*\n\n📚 Каталог — все книги\n🔍 Поиск — найти книгу\n🛒 Корзина — выбранные книги\n📦 Заказ — оформить покупку\n\n📱 +7 (999) 123-45-67',
        { parse_mode: 'Markdown', ...mainMenu }
      );
    }

    if (session.step === 'search') {
      const q = text.trim().toLowerCase();
      const books = await db.all('SELECT * FROM books WHERE title LIKE ? OR author LIKE ?', [`%${q}%`, `%${q}%`]);
      session.step = null;
      if (books.length === 0) {
        return bot.sendMessage(chatId, `🔍 *"${text}"* — ничего не найдено.`, { parse_mode: 'Markdown', ...mainMenu });
      }
      bot.sendMessage(chatId, `🔍 Найдено: *${books.length}*`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: books.map(b => ([{ text: `📖 ${b.title} — ${b.price}₽`, callback_data: `book_${b.id}` }]))
        }
      });
      return;
    }

    if (session.step === 'ask_name') {
      session.order.name = text;
      session.step = 'ask_phone';
      return bot.sendMessage(chatId, `✅ *${text}*!\n\nШаг 2/3: *Номер телефона*:\n_(+79991234567)_`, { parse_mode: 'Markdown' });
    }
    if (session.step === 'ask_phone') {
      if (!/^[\+\d][\d\s\-]{6,14}$/.test(text.trim())) {
        return bot.sendMessage(chatId, '❌ Неверный формат. Попробуйте: +79991234567', { parse_mode: 'Markdown' });
      }
      session.order.phone = text.trim();
      session.step = 'ask_delivery';
      return bot.sendMessage(chatId, 'Шаг 3/3: *Способ получения*:', {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚚 Доставка', callback_data: 'delivery_courier' }],
            [{ text: '🏪 Самовывоз', callback_data: 'delivery_pickup' }]
          ]
        }
      });
    }
    if (session.step === 'ask_address') {
      session.order.address = text;
      finishBotOrder(chatId, session);
    }
  });

  async function finishBotOrder(chatId, session) {
    const db = await getDB();
    const cart = session.cart;
    const order_info = session.order;
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const trackNumber = Math.random().toString().slice(2, 15);

    const orderId = Date.now().toString();
    await db.run(
      'INSERT INTO orders (id, trackNumber, name, phone, address, delivery, payment, total, status, source, date, customerChatId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [orderId, trackNumber, order_info.name, order_info.phone, order_info.address || '', order_info.delivery || 'courier', 'cash', total, 'new', 'telegram', new Date().toISOString(), chatId.toString()]
    );
    for (let item of cart) {
      await db.run(
        'INSERT INTO order_items (order_id, book_id, title, price, quantity, image) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, item.id, item.title, item.price, item.quantity, item.image || null]
      );
    }

    let userMsg = `🎉 *Заказ оформлен!*\n\n🔖 Трек: \`${trackNumber}\`\n\n`;
    cart.forEach((item, i) => { userMsg += `${i + 1}. ${item.title} × ${item.quantity} — ${item.price * item.quantity} ₽\n`; });
    userMsg += `\n💰 *Итого: ${total} ₽*\n📞 Мы свяжемся: ${order_info.phone}`;
    bot.sendMessage(chatId, userMsg, { parse_mode: 'Markdown', ...mainMenu });

    let adminMsg = `🛎️ *НОВЫЙ ЗАКАЗ (Telegram)!*\n\n`;
    adminMsg += `🔖 Трек: \`${trackNumber}\`\n👤 ${order_info.name}\n📱 ${order_info.phone}\n`;
    adminMsg += `🚚 ${order_info.delivery === 'courier' ? 'Доставка' : 'Самовывоз'}\n`;
    if (order_info.address) adminMsg += `📍 ${order_info.address}\n`;
    adminMsg += `\n📚 *Товары:*\n`;
    cart.forEach((item, i) => { adminMsg += `${i + 1}. ${item.title} × ${item.quantity} — ${item.price * item.quantity} ₽\n`; });
    adminMsg += `\n💰 *ИТОГО: ${total} ₽*`;

    bot.sendMessage(ADMIN_CHAT_ID, adminMsg, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Принять', callback_data: `bot_accept_${orderId}` },
            { text: '❌ Отклонить', callback_data: `bot_reject_${orderId}` }
          ],
          [{ text: '🚚 Доставлено', callback_data: `bot_delivered_${orderId}` }]
        ]
      }
    });

    session.cart = [];
    session.order = {};
    session.step = null;
  }

  bot.on('polling_error', (err) => console.error('Bot error:', err.code));
  console.log('✅ Telegram Bot initialized.');
}
