"use client";

import { useState } from "react";
import { Button, Card, Form, Input, Tabs, message as antMessage } from "antd";
import { useRouter } from "next/navigation";

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm extends LoginForm {
  name: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const AUTH_URL =
    process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:3001";

  const handleLogin = async (values: LoginForm) => {
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Login gagal");
      const data = await res.json();
      // Response dibungkus ResponseDto: { code, success, message, result: { access_token, user } }
      const payload = data.result ?? data;
      localStorage.setItem("access_token", payload.access_token);
      if (payload.user?.id) localStorage.setItem("user_id", payload.user.id);
      antMessage.success("Login berhasil!");
      router.push("/chat");
    } catch {
      antMessage.error("Email atau password salah");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: RegisterForm) => {
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Register gagal");
      const data = await res.json();
      const payload = data.result ?? data;
      localStorage.setItem("access_token", payload.access_token);
      if (payload.user?.id) localStorage.setItem("user_id", payload.user.id);
      antMessage.success("Registrasi berhasil!");
      router.push("/chat");
    } catch {
      antMessage.error("Registrasi gagal, coba email lain");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0f2f5",
      }}
    >
      <Card style={{ width: 380, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>Healthcare CRM</h2>
          <p style={{ color: "#888", margin: "4px 0 0" }}>Chat & Support System</p>
        </div>

        <Tabs
          defaultActiveKey="login"
          centered
          items={[
            {
              key: "login",
              label: "Masuk",
              children: (
                <Form layout="vertical" onFinish={handleLogin}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[{ required: true, type: "email", message: "Email tidak valid" }]}
                  >
                    <Input placeholder="email@example.com" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="Password"
                    rules={[{ required: true, message: "Password wajib diisi" }]}
                  >
                    <Input.Password placeholder="••••••••" />
                  </Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={loading}
                  >
                    Masuk
                  </Button>
                </Form>
              ),
            },
            {
              key: "register",
              label: "Daftar",
              children: (
                <Form layout="vertical" onFinish={handleRegister}>
                  <Form.Item
                    name="name"
                    label="Nama"
                    rules={[{ required: true, message: "Nama wajib diisi" }]}
                  >
                    <Input placeholder="Nama lengkap" />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[{ required: true, type: "email", message: "Email tidak valid" }]}
                  >
                    <Input placeholder="email@example.com" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="Password"
                    rules={[
                      { required: true, message: "Password wajib diisi" },
                      { min: 6, message: "Minimal 6 karakter" },
                    ]}
                  >
                    <Input.Password placeholder="••••••••" />
                  </Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={loading}
                  >
                    Daftar
                  </Button>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
