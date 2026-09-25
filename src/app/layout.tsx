import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Central de Ajuda | W Check Brasil",
    template: "%s | Central de Ajuda W Check Brasil",
  },
  description:
    "Central de ajuda da W Check Brasil: artigos e tutoriais para você aprender a usar o ERP veicular, o módulo financeiro e todas as soluções da plataforma.",
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`h-full antialiased ${inter.variable} ${geistMono.variable} font-sans`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
