import "./globals.css";

export const metadata = {
  title: "EuIndico - UniCesumar | Indique e Ganhe Prêmios",
  // Campanha Atual: PIX de R$ 250,00
  description: "Programa de indicações UniCesumar. Indique seus amigos para realizar matrículas e concorra a um PIX de R$ 250,00 direto na sua conta!",
  // BACKUP 3 PRÊMIOS: description: "Programa de indicações UniCesumar. Indique seus amigos para realizar matrículas e concorra a prêmios incríveis como Smartphones, Alexa e Fones de Ouvido Bluetooth!",
  icons: {
    icon: [
      {
        url: "/euindico/favicon.png?v=2",
        type: "image/png",
      }
    ]
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
