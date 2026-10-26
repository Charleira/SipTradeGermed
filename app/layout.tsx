import type { Metadata } from "next";
import { Exo_2 } from "next/font/google";
import "./globals.css";
import { AppHeader } from "./components/AppHeader";

// Reserva caso algum arquivo da Isotonic não carregue
const exo = Exo_2({ variable: "--font-exo", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "SIP Trade | Germed",
  description: "Solicitação de Investimento Promocional - Trade Marketing Germed",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // CORREÇÃO: a variável da fonte precisa ficar no <html>, senão o site cai em fonte serifada
    <html lang="pt-BR" className={exo.variable}>
      <body className="min-h-screen font-sans antialiased">
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
