const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(require('cors')());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

io.on('connection', (socket) => {
  console.log('connected:', socket.id);
  socket.on('disconnect', () => console.log('disconnected:', socket.id));
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Server on port ${PORT}`));
