"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import { Button, Input, Upload, message as antMessage } from "antd";
import { SendOutlined, PaperClipOutlined } from "@ant-design/icons";
import { SEND_MESSAGE } from "@/graphql/mutations";

interface Props {
  roomId: string;
  onSent?: (content: string) => void;
}

export default function MessageInput({ roomId, onSent }: Props) {
  const [content, setContent] = useState("");
  const [sendMessage, { loading }] = useMutation(SEND_MESSAGE);

  const handleSend = async () => {
    const text = content.trim();
    if (!text) return;

    try {
      onSent?.(text);
      setContent("");

      await sendMessage({
        variables: {
          input: {
            roomId,
            content: text,
            idempotencyKey: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          },
        },
      });
    } catch {
      antMessage.error("Gagal mengirim pesan");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: "12px 16px",
        borderTop: "1px solid #f0f0f0",
        background: "#fff",
        alignItems: "flex-end",
      }}
    >
      <Upload
        showUploadList={false}
        beforeUpload={async (file) => {
          const token = localStorage.getItem("access_token");
          const form = new FormData();
          form.append("file", file);
          form.append("roomId", roomId);
          form.append("content", file.name);
          form.append(
            "idempotencyKey",
            `${Date.now()}-${Math.random().toString(36).slice(2)}`
          );
          try {
            await fetch(
              `${process.env.NEXT_PUBLIC_AUTH_URL?.replace("3001", "3002")}/chat/messages/attachment`,
              { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form }
            );
            antMessage.success("File terkirim");
          } catch {
            antMessage.error("Gagal upload file");
          }
          return false; 
        }}
      >
        <Button icon={<PaperClipOutlined />} type="text" />
      </Upload>

      <Input.TextArea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Tulis pesan... (Enter untuk kirim, Shift+Enter baris baru)"
        autoSize={{ minRows: 1, maxRows: 4 }}
        style={{ borderRadius: 20, resize: "none", flex: 1 }}
      />

      <Button
        type="primary"
        icon={<SendOutlined />}
        onClick={handleSend}
        loading={loading}
        disabled={!content.trim()}
        style={{ borderRadius: 20, height: 36 }}
      >
        Kirim
      </Button>
    </div>
  );
}
