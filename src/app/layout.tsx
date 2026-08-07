import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "CapiClub Inventario",
  description: "Sistema local de inventario y gestion comercial para CapiClub",
  icons: {
    icon: "/brand/capiclub-icon.png",
    apple: "/brand/capiclub-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider />
        {children}
      </body>
    </html>
  );
}
