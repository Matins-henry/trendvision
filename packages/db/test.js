const net = require('net');
const socket = new net.Socket();
socket.setTimeout(5000);
socket.connect(6543, 'aws-0-eu-west-1.pooler.supabase.com', () => {
  console.log('Connected successfully!');
  socket.destroy();
});
socket.on('error', (err) => console.log('Error:', err.message));
socket.on('timeout', () => console.log('Timed out'));