"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Layout, Modal, Form, Input, Select, message as antMessage } from "antd";
import { PlusOutlined, LogoutOutlined } from "@ant-design/icons";
import { useMutation } from "@apollo/client";
import ChatSidebar from "@/components/ChatSidebar";
import ChatRoom from "@/components/ChatRoom";
import { CREATE_CHAT_ROOM } from "@/graphql/mutations";

const { Sider, Content } = Layout;

interface Room {
  id: string;
  name: string;
}

interface UserOption {
  id: string;
  fullname: string;
  email: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [newRoomModal, setNewRoomModal] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [form] = Form.useForm();
  const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:3001";

  const [createChatRoom, { loading: creating }] = useMutation(CREATE_CHAT_ROOM, {
    onCompleted(data) {
      const room = data?.createChatRoom;
      if (room) {
        antMessage.success(`Room "${room.name}" berhasil dibuat`);
        setSelectedRoom({ id: room.id, name: room.name });
      }
      setNewRoomModal(false);
      form.resetFields();
    },
    onError() {
      antMessage.error("Gagal membuat chat room");
    },
  });

  // Redirect ke login jika belum auth
  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.replace("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    router.replace("/login");
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${AUTH_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data.result ?? []);
    } catch {
      antMessage.error("Gagal memuat daftar pengguna");
    }
  };

  const handleOpenModal = () => {
    setNewRoomModal(true);
    fetchUsers();
  };

  const handleCreateRoom = (values: { name: string; participantIds: string[] }) => {
    createChatRoom({
      variables: { input: { name: values.name, participantIds: values.participantIds } },
    });
  };

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <Sider
        width={280}
        style={{ background: "#fff", borderRight: "1px solid #f0f0f0" }}
      >
        {/* Wrapper — flex container agar header selalu terlihat */}
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Sidebar header */}
          <div
            style={{
              flexShrink: 0,
              padding: "12px 16px",
              borderBottom: "1px solid #f0f0f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 16 }}>Chat Rooms</span>
            <div style={{ display: "flex", gap: 4 }}>
              <Button
                size="small"
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleOpenModal}
              />
              <Button
                size="small"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                danger
              />
            </div>
          </div>

          {/* Room list */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            <ChatSidebar
              selectedRoomId={selectedRoom?.id ?? null}
              onSelectRoom={(id, name) => setSelectedRoom({ id, name })}
            />
          </div>
        </div>
      </Sider>

      {/* Main content */}
      <Content style={{ display: "flex", flexDirection: "column" }}>
        {selectedRoom ? (
          <ChatRoom roomId={selectedRoom.id} roomName={selectedRoom.name} />
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#aaa",
              fontSize: 16,
            }}
          >
            Pilih chat room untuk mulai percakapan
          </div>
        )}
      </Content>

      {/* Modal buat room baru */}
      <Modal
        title="Buat Chat Room Baru"
        open={newRoomModal}
        onCancel={() => {
          setNewRoomModal(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={creating}
        okText="Buat"
        cancelText="Batal"
      >
        <Form form={form} layout="vertical" onFinish={handleCreateRoom}>
          <Form.Item
            name="name"
            label="Nama Room"
            rules={[{ required: true, message: "Nama room wajib diisi" }]}
          >
            <Input placeholder="Contoh: Support - Pasien 001" />
          </Form.Item>
          <Form.Item
            name="participantIds"
            label="Peserta"
            rules={[{ required: true, message: "Pilih minimal 1 peserta" }]}
          >
            <Select
              mode="multiple"
              placeholder="Cari dan pilih peserta..."
              optionFilterProp="label"
              showSearch
              options={users.map((u) => ({
                value: u.id,
                label: u.fullname || u.email,
                desc: u.email,
              }))}
              optionRender={(opt) => (
                <div>
                  <div style={{ fontWeight: 500 }}>{opt.data.label}</div>
                  <div style={{ fontSize: 11, color: "#999" }}>{opt.data.desc}</div>
                </div>
              )}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
