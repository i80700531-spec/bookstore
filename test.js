(async () => {
  try {
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: 'admin', password: '1234' })
    });
    const loginData = await loginRes.json();
    console.log('Login:', loginData.success ? '✅ OK' : '❌ FAIL', loginData.token ? '(token received)' : '');
    if (!loginData.token) return;

    const bookRes = await fetch('http://localhost:3001/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + loginData.token },
      body: JSON.stringify({
        title: 'Тестовая книга',
        author: 'Тестовый автор',
        pages: 200,
        price: 800,
        image: '',
        category: 'Новинка'
      })
    });
    const bookData = await bookRes.json();
    console.log('Add book:', bookData.success ? '✅ OK' : '❌ FAIL', JSON.stringify(bookData));

    const listRes = await fetch('http://localhost:3001/api/books');
    const listData = await listRes.json();
    console.log('Books in DB:', listData.length, 'шт.');
    listData.slice(-3).forEach(b => console.log(' -', b.id, b.title, b.price + '₽'));
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
