import "./globals.css";

export const metadata = {
  title: "Poker Clock — Platinum",
  description: "Professional multi-device poker tournament clock."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}