import { FlaskConicalIcon, ShieldCheckIcon } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 font-semibold">
          <FlaskConicalIcon className="size-5" aria-hidden />
          Lab Report Analyzer
        </div>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Lab Report Analyzer</h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Understand your medical lab results in seconds, analysed entirely in your browser.
        </p>
        <Badge variant="secondary" className="h-7 px-3 text-sm">
          <ShieldCheckIcon aria-hidden />
          Privacy: your data never leaves your device
        </Badge>
      </main>
    </div>
  );
}
