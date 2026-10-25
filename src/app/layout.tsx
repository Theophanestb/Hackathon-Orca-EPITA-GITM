import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Lab Report Analyzer", template: "%s · Lab Report Analyzer" },
  description:
    "Analyse your medical lab reports entirely in your browser. Your data never leaves your device.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {/* Decorative ambient background (styles in globals.css). */}
        <div aria-hidden className="dna-layer">
          <div className="dna-helix dna-helix-a" />
          <div className="dna-helix dna-helix-b" />
        </div>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            <a
              href="#main"
              className="sr-only z-50 rounded-md bg-background px-3 py-2 text-sm font-medium shadow focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
            >
              Skip to content
            </a>
            <SiteHeader />
            <main id="main" className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
              {children}
            </main>
            <SiteFooter />
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
