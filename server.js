const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: '*', methods: ['GET','POST'] } });

const COLORS = ['#e63946', '#457b9d', '#2a9d8f', '#f4a261', '#8d99ae'];
let clients = new Map();

io.on('connection', (socket) => {
  console.log('conectado:', socket.id);

  if (clients.size >= 4) {
    socket.emit('room_full');
    socket.disconnect(true);
    return;
  }

  const used = new Set(Array.from(clients.values()).map(c => c.color));
  const color = COLORS.find(c => !used.has(c)) || COLORS[0];
  clients.set(socket.id, { color });

  socket.emit('init', { color, id: socket.id });
  socket.broadcast.emit('user_joined', { id: socket.id, color });

  socket.on('draw', (data) => {
    socket.broadcast.emit('draw', data);
  });

  socket.on('clear', () => {
    socket.broadcast.emit('clear');
  });

  socket.on('disconnect', () => {
    clients.delete(socket.id);
    socket.broadcast.emit('user_left', { id: socket.id });
    console.log('desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server escuchando en ${PORT}`));
