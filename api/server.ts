/**
 * local server entry file, for local development
 */
import { Server } from 'socket.io';
import http from 'http';
import app from './app.js';
import {
  generateProductionData,
  generateStorageTankData,
  generateTransportData,
  generateRefuelingData,
  generateAlerts
} from '../shared/mockData.js';

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});

setInterval(() => {
  const production = generateProductionData(5);
  const storage = generateStorageTankData(5);
  const transport = generateTransportData(3);
  const refueling = generateRefuelingData(3);

  io.emit('monitoring:update', {
    production,
    storage,
    transport,
    refueling,
    timestamp: new Date()
  });
}, 3000);

setInterval(() => {
  const randomAlert = Math.random();
  if (randomAlert > 0.95) {
    const alerts = generateAlerts(1);
    if (alerts.length > 0) {
      io.emit('alert:new', alerts[0]);
    }
  }
}, 10000);

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;