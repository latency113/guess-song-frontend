import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";

export const metadata: Metadata = {
  title: "Intro Quiz - เกมทายเพลงจากเสียงดนตรีอินโทร",
  description: "ฟังแค่เสียงดนตรี Intro ทายเพลงให้ไวที่สุดเพื่อเก็บคะแนนสูงสุด! มีทั้งหมวดเพลงไทยและเพลงสากล พร้อมตารางอันดับ Leaderboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800&family=Prompt:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#09090f] text-zinc-100 min-h-screen flex flex-col selection:bg-pink-500 selection:text-white antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
