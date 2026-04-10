import "./globals.css";
import { ThemeProvider } from "./providers";
import ClientShell from "./components/ClientShell";
import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className="h-full">
      <body className="min-h-screen text-foreground bg-transparent">
        <ThemeProvider>
          <ClientShell>{children}</ClientShell>
        </ThemeProvider>

        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}








