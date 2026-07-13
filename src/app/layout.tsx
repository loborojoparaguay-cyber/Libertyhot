import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Libertyhot",
  description: "Plataforma de contenido exclusivo para creadores. Solo mayores de 18 años.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-base-bg font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
