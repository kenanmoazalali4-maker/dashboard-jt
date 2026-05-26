import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { auth } from "@/lib/auth";
import { NotificationProvider } from "@/components/Notifications";

export const metadata: Metadata = {
  title: "لوحة تحكم السيرفر",
  description: "لوحة تحكم إدارة سيرفر FiveM",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const staff = (session as any)?.staff;
  const isLoggedIn = !!staff;

  return (
    <html lang="ar" dir="rtl">
      <body>
        <NotificationProvider>
          {isLoggedIn ? (
            <div className="app-layout">
              <Sidebar staff={staff} />
              <main className="main-content">{children}</main>
            </div>
          ) : (
            children
          )}
        </NotificationProvider>
      </body>
    </html>
  );
}
