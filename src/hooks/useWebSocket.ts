import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from '../store/index.js';
import type { Alert, ProductionData, StorageTankData, TransportData, RefuelingData } from '../../shared/types.js';

interface MonitoringUpdate {
  production: ProductionData[];
  storage: StorageTankData[];
  transport: TransportData[];
  refueling: RefuelingData[];
  timestamp: Date;
}

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { addAlert, updateRealtimeData } = useAppStore();

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socket.on('monitoring:update', (data: MonitoringUpdate) => {
      updateRealtimeData({
        production: data.production,
        storage: data.storage,
        transport: data.transport,
        refueling: data.refueling
      });
    });

    socket.on('alert:new', (alert: Alert) => {
      addAlert(alert);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    socketRef.current = socket;
  }, [addAlert, updateRealtimeData]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { connect, disconnect, isConnected: socketRef.current?.connected ?? false };
}
