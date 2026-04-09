import { spawn } from 'child_process';

console.log('');
console.log('═══════════════════════════════════════════');
console.log('  📚 КНИЖНЫЙ МИР — Запуск среды разработки');
console.log('═══════════════════════════════════════════');
console.log('  🔧 Backend:   http://localhost:3001');
console.log('  🌐 Frontend:  http://localhost:3000');
console.log('═══════════════════════════════════════════');
console.log('');

const backend = spawn('node', ['backend/index.js'], {
  stdio: 'inherit',
  shell: true
});

const frontend = spawn('node', ['node_modules/vite/bin/vite.js', '--port=3000', '--host=0.0.0.0'], {
  stdio: 'inherit',
  shell: true
});

backend.on('error', (err) => console.error('❌ Backend error:', err));
frontend.on('error', (err) => console.error('❌ Frontend error:', err));

process.on('SIGINT', () => {
  console.log('\n🛑 Завершение работы...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});
