import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const socketUrl = 'http://localhost:3001';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(socketUrl);
    setSocket(newSocket);
    return () => {
      newSocket.close();
    };
  }, []);

  return socket;
}
