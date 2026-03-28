import { useEffect } from "react";
import { io } from "socket.io-client";

type JoinPayload = {
  role: "farmer" | "doctor" | "admin";
  userId: string;
};

export function useSocket(payload: JoinPayload | null, onCaseUpdate: (data: unknown) => void) {
  const role = payload?.role;
  const userId = payload?.userId;

  useEffect(() => {
    if (!role || !userId) {
      return;
    }

    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:4000", {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1500,
      timeout: 5000,
    });
    socket.connect();
    socket.on("connect", () => {
      socket.emit("join", { role, userId });
    });
    socket.on("case:update", onCaseUpdate);

    return () => {
      socket.off("case:update", onCaseUpdate);
      socket.disconnect();
    };
  }, [role, userId, onCaseUpdate]);
}
