import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '@/components/providers/AuthProvider';
import { AppLayout } from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: "OCASA — Dashboard",
  description: "Dashboard operacional y financiero OCASA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
