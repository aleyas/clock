import "./globals.css";

export const metadata = {
  title: "Poker Clock — Platinum",
  description: "Professional multi-device poker tournament clock."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><link rel="manifest" href="/manifest.webmanifest" /></head><body>{children}</body>
    </html>
  );
}