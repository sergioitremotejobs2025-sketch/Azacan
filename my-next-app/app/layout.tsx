import type { Metadata } from "next";
import "./globals.css";
import NavBar from "./_components/NavBar";

import QueryProvider from "./_providers/QueryProvider";

export const metadata: Metadata = {
  title: "LibroMind | AI Book Recommendations",
  description: "Curate your perfect library with AI-powered book recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <div className="min-h-screen bg-gray-50 ">
            <NavBar />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
