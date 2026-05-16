"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [cameraStatus, setCameraStatus] = useState({ connected: false, model: '' });

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000');

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to backend');
      socketInstance.emit('camera:status');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from backend');
    });

    socketInstance.on('camera:status', (status) => {
      setCameraStatus(status);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, cameraStatus }}>
      {children}
    </SocketContext.Provider>
  );
};
