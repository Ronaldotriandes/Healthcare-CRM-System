import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem("access_token");
    socket = io(process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3002", {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      auth: { token },
    });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
