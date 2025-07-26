// Simple room-based WebSocket chat backend using ws
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

const server = createServer();
const wss = new WebSocketServer({ server });

// Map of room name to Set of WebSocket clients
const rooms = new Map<string, Set<WebSocket>>();

wss.on("connection", (ws: WebSocket) => {
  let currentRoom: string | null = null;

  ws.on("message", (data: WebSocket.RawData) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === "join" && typeof msg.room === "string") {
        // Leave previous room
        if (currentRoom && rooms.has(currentRoom)) {
          rooms.get(currentRoom!)!.delete(ws);
        }
        // Join new room
        currentRoom = msg.room;
        if (!rooms.has(currentRoom)) {
          rooms.set(currentRoom, new Set());
        }
        rooms.get(currentRoom)!.add(ws);
        ws.send(
          JSON.stringify({
            type: "system",
            message: `Joined room: ${currentRoom}`,
          })
        );
      } else if (
        msg.type === "chat" &&
        currentRoom &&
        typeof msg.message === "string"
      ) {
        // Broadcast to all clients in the room
        const payload = JSON.stringify({
          type: "chat",
          room: currentRoom,
          message: msg.message,
        });
        for (const client of rooms.get(currentRoom!) ?? []) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
          }
        }
      }
    } catch (e) {
      ws.send(
        JSON.stringify({ type: "error", message: "Invalid message format" })
      );
    }
  });

  ws.on("close", () => {
    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom!)!.delete(ws);
      // Optionally, clean up empty rooms
      if (rooms.get(currentRoom!)!.size === 0) {
        rooms.delete(currentRoom!);
      }
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`WebSocket chat server running on ws://localhost:${PORT}`);
});
