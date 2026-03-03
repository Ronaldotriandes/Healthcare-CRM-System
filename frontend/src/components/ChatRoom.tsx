"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@apollo/client";
import { Avatar, Button, Spin, Typography, Empty } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { GET_MESSAGES } from "@/graphql/queries";
import MessageInput from "./MessageInput";
import { getSocket } from "@/lib/socket";

const { Text } = Typography;

interface Message {
  id: string;
  content: string;
  senderId: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
}

interface Props {
  roomId: string;
  roomName: string;
}

const PAGE_SIZE = 20;

export default function ChatRoom({ roomId, roomName }: Props) {
  const myId =
    typeof window !== "undefined" ? localStorage.getItem("user_id") ?? "" : "";

  const [optimistic, setOptimistic] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  const { loading, data, fetchMore } = useQuery(GET_MESSAGES, {
    variables: { input: { roomId, limit: PAGE_SIZE, page: 1 } },
    fetchPolicy: "network-only",
    pollInterval: 3000,
  });

  const serverMessages: Message[] = data?.messages?.messages ?? [];
  const total: number = data?.messages?.total ?? 0;

  useEffect(() => {
    if (serverMessages.length === 0) return;
    setOptimistic((prev) =>
      prev.filter(
        (opt) =>
          !serverMessages.some(
            (m) => m.senderId === myId && m.content === opt.content
          )
      )
    );
  }, [serverMessages, myId]);

  const firstLoad = useRef(true);
  useEffect(() => {
    if (!loading && firstLoad.current && serverMessages.length > 0) {
      firstLoad.current = false;
      scrollToBottom();
    }
  }, [loading, serverMessages.length, scrollToBottom]);

  const allMessages = [
    ...serverMessages,
    ...optimistic.filter(
      (opt) =>
        !serverMessages.some(
          (m) => m.senderId === myId && m.content === opt.content
        )
    ),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  useEffect(() => {
    const socket = getSocket();

    const joinRoom = () => socket.emit("room:join", { roomId });
    if (socket.connected) joinRoom();
    else socket.once("connect", joinRoom);

    const onNewMessage = (msg: Message) => {
      setOptimistic((prev) =>
        prev.filter(
          (opt) => !(opt.senderId === msg.senderId && opt.content === msg.content)
        )
      );
      scrollToBottom();
    };

    socket.on("message:new", onNewMessage);

    return () => {
      socket.emit("room:leave", { roomId });
      socket.off("connect", joinRoom);
      socket.off("message:new", onNewMessage);
    };
  }, [roomId, scrollToBottom]);

  const handleOptimisticSend = useCallback(
    (content: string) => {
      setOptimistic((prev) => [
        ...prev,
        {
          id: `optimistic_${Date.now()}`,
          content,
          senderId: myId,
          createdAt: new Date().toISOString(),
        },
      ]);
      scrollToBottom();
    },
    [myId, scrollToBottom]
  );

  const [loadingMore, setLoadingMore] = useState(false);
  const [extraMessages, setExtraMessages] = useState<Message[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const hasMore = serverMessages.length + extraMessages.length < total;

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    const nextPage = currentPage + 1;
    setLoadingMore(true);
    try {
      const { data: moreData } = await fetchMore({
        variables: { input: { roomId, limit: PAGE_SIZE, page: nextPage } },
      });
      const older = moreData?.messages?.messages ?? [];
      setExtraMessages((prev) => [...older, ...prev]);
      setCurrentPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  };

  const displayMessages = [
    ...extraMessages.filter((e) => !allMessages.some((m) => m.id === e.id)),
    ...allMessages,
  ];

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  if (loading && serverMessages.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #f0f0f0",
          background: "#fff",
          fontWeight: 600,
          fontSize: 16,
        }}
      >
        {roomName}
      </div>

      {/* Messages */}
      <div
        className="chat-messages"
        style={{ flex: 1, overflowY: "auto", padding: "16px" }}
      >
        {hasMore && (
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={loadMore}
              loading={loadingMore}
            >
              Muat pesan sebelumnya
            </Button>
          </div>
        )}

        {displayMessages.length === 0 ? (
          <Empty description="Belum ada pesan" style={{ marginTop: 48 }} />
        ) : (
          displayMessages.map((msg) => {
            const isMe = msg.senderId === myId;
            const isPending = msg.id.startsWith("optimistic_");
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: isMe ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  gap: 8,
                  marginBottom: 12,
                  opacity: isPending ? 0.55 : 1,
                  transition: "opacity 0.3s",
                }}
              >
                {!isMe && (
                  <Avatar size={32} style={{ background: "#1677ff", flexShrink: 0 }}>
                    {msg.senderId[0]?.toUpperCase() ?? "?"}
                  </Avatar>
                )}

                <div
                  style={{
                    maxWidth: "65%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isMe ? "flex-end" : "flex-start",
                  }}
                >
                  {!isMe && (
                    <Text type="secondary" style={{ fontSize: 11, marginBottom: 2 }}>
                      {msg.senderId.slice(0, 8)}
                    </Text>
                  )}

                  <div
                    style={{
                      background: isMe ? "#1677ff" : "#f5f5f5",
                      color: isMe ? "#fff" : "#000",
                      borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      padding: "8px 12px",
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {msg.attachmentUrl ? (
                      <a
                        href={msg.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: isMe ? "#e6f4ff" : "#1677ff" }}
                      >
                        📎 {msg.attachmentName ?? msg.content}
                      </a>
                    ) : (
                      msg.content
                    )}
                  </div>

                  <Text type="secondary" style={{ fontSize: 10, marginTop: 2 }}>
                    {isPending ? "Mengirim..." : formatTime(msg.createdAt)}
                  </Text>
                </div>
              </div>
            );
          })
        )}

        <div ref={bottomRef} />
      </div>

      <MessageInput roomId={roomId} onSent={handleOptimisticSend} />
    </div>
  );
}
