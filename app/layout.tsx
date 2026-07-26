import type { Metadata } from "next";
import { Suspense } from "react";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { prisma } from "@/lib/prisma";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["500", "600", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Smartech Hub",
  description: "Smart Knowledge & Project Hub — PKM and Project Incubator",
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let topics: { id: string; name: string; _count: { items: number } }[] = [];
  try {
    topics = await prisma.topic.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { items: true } } },
    });
  } catch {
    topics = [];
  }

  return (
    <html lang="vi" className={`${outfit.variable} ${jakarta.variable}`}>
      <body className="font-body bg-bg-dark min-h-screen">
        <div className="flex min-h-screen">
          <Suspense fallback={null}>
            <Sidebar topics={topics} />
          </Suspense>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
