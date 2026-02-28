import type { Metadata } from "next";
import "./globals.css";
import { NotificationProvider } from "@/components/notifications/NotificationContext";
import { ToastProvider } from "@/components/ui/ToastProvider";
import "mapbox-gl/dist/mapbox-gl.css";

export const metadata: Metadata = {
  title: "PerfectBench",
  description: "Find and host activities nearby.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="app-shell">
          <ToastProvider>
            <NotificationProvider>{children}</NotificationProvider>
          </ToastProvider>
        </div>
      </body>
    </html>
  );
}
