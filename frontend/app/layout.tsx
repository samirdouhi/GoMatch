import "./globals.css";
import { ThemeProvider } from "./providers";
import ClientShell from "./components/ClientShell";
import { ToastProvider } from "./components/notifications/ToastContainer";
import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className="h-full">
      <body className="min-h-screen text-foreground bg-background">
        <ThemeProvider>
          <ToastProvider>
            <ClientShell>{children}</ClientShell>
          </ToastProvider>
        </ThemeProvider>

        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}








