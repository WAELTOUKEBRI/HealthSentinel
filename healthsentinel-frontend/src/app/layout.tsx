import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { ThemeProvider } from "@/components/theme-provider"; // 🔹 Custom wrapper
import { Toaster } from "sonner";
import { GeistSans } from 'geist/font/sans'; // Ensure you have GeistSans if using var(--font-sans)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={GeistSans.variable}>
      <body className="flex h-screen overflow-hidden bg-background text-foreground font-sans">
        
        {/* 🔹 ThemeProvider enables Professional Dark Mode */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>

          <Sidebar />

          <div className="flex-1 flex flex-col overflow-y-auto bg-background transition-colors duration-300">
            <Navbar />
            <main className="transition-colors duration-300">
              {children}
            </main>
          </div>

          {/* 🔹 Sonner Toaster enables notifications */}
          <Toaster position="top-right" richColors theme="system" closeButton expand={true} />

        </ThemeProvider>
      </body>
    </html>
  );
}
