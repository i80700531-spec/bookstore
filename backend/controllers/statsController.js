import { getDB } from '../config/database.js';

export const getStats = async (req, res) => {
  try {
    const db = await getDB();
    const orders = await db.all('SELECT * FROM orders');
    for(let o of orders) {
      o.items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
    }
    const booksCount = (await db.get('SELECT COUNT(*) as count FROM books')).count;
    
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter(o => o.date && o.date.startsWith(today));
    
    res.json({
      totalOrders: orders.length,
      todayOrders: todayOrders.length,
      todaySales: todayOrders.reduce((s, o) => s + o.items.reduce((a, i) => a + (i.quantity || 0), 0), 0),
      todayRevenue: todayOrders.reduce((s, o) => s + (o.total || 0), 0),
      totalRevenue: orders.reduce((s, o) => s + (o.total || 0), 0),
      totalBooks: booksCount,
      statusCounts: {
        new: orders.filter(o => o.status === 'new').length,
        accepted: orders.filter(o => o.status === 'accepted').length,
        shipping: orders.filter(o => o.status === 'shipping').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        rejected: orders.filter(o => o.status === 'rejected').length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
