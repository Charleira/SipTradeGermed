import type { Metadata } from "next";
import { Exo_2 } from "next/font/google";
import "./globals.css";
import { AppHeader } from "./components/AppHeader";

// Reserva caso os arquivos da Isotonic não estejam em public/fonts
const exo = Exo_2({ variable: "--font-exo", subsets: ["latin"], weight: ["400", "600", "700"] });

export const metadata: Metadata = {
  title: "SIP Trade | Germed",
  description: "Solicitação de Investimento Promocional - Trade Marketing Germed",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${exo.variable} min-h-screen antialiased`}>
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
