"use client";

import { useQuery } from "@apollo/client";
import { Avatar, Badge, List, Skeleton, Typography } from "antd";
import { GET_CHAT_ROOMS } from "@/graphql/queries";

const { Text } = Typography;

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

interface ChatRoom {
  id: string;
  name?: string;
  participants: { userId: string }[];
  lastMessage?: Message;
  updatedAt: string;
}

interface Props {
  selectedRoomId: string | null;
  onSelectRoom: (id: string, name: string) => void;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function getRoomLabel(room: ChatRoom, userId: string) {
  if (room.name) return room.name;
  const others = room.participants.filter((p) => p.userId !== userId);
  return others.length > 0 ? `User ${others[0].userId.slice(0, 8)}` : "Room";
}

export default function ChatSidebar({ selectedRoomId, onSelectRoom }: Props) {
  const currentUserId =
    typeof window !== "undefined" ? localStorage.getItem("user_id") ?? "" : "";

  const { data, loading } = useQuery<{ chatRooms: ChatRoom[] }>(GET_CHAT_ROOMS, {
    pollInterval: 10_000, 
  });

  const rooms = data?.chatRooms ?? [];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Room list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} avatar active paragraph={{ rows: 1 }} style={{ marginBottom: 12 }} />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "#999" }}>
            Belum ada chat room
          </div>
        ) : (
          <List
            dataSource={rooms}
            renderItem={(room) => {
              const isSelected = room.id === selectedRoomId;
              const label = getRoomLabel(room, currentUserId);
              const initial = label.charAt(0).toUpperCase();

              return (
                <List.Item
                  onClick={() => onSelectRoom(room.id, label)}
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    backgroundColor: isSelected ? "#e6f4ff" : "transparent",
                    borderLeft: isSelected ? "3px solid #1677ff" : "3px solid transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge dot status="success">
                        <Avatar style={{ backgroundColor: "#1677ff" }}>
                          {initial}
                        </Avatar>
                      </Badge>
                    }
                    title={
                      <Text strong ellipsis style={{ maxWidth: 140 }}>
                        {label}
                      </Text>
                    }
                    description={
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Text
                          type="secondary"
                          ellipsis
                          style={{ fontSize: 12, maxWidth: 120 }}
                        >
                          {room.lastMessage?.content ?? "No messages yet"}
                        </Text>
                        {room.lastMessage && (
                          <Text type="secondary" style={{ fontSize: 11, whiteSpace: "nowrap" }}>
                            {formatTime(room.lastMessage.createdAt)}
                          </Text>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
