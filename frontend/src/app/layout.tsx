import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM Chat",
  description: "Customer Support Chat",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <body style={{ height: "100%" }}>
        {/* AntdRegistry handles SSR style injection untuk Ant Design v5 */}
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}
