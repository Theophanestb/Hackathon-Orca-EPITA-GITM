import { CpuIcon, DatabaseZapIcon, EyeOffIcon, ServerOffIcon, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Lab Report Analyzer processes your data locally: no server, no tracking, no storage.",
};

const POINTS: { icon: LucideIcon; title: string; body: React.ReactNode }[] = [
  {
    icon: CpuIcon,
    title: "Processed on your device",
    body: "Files you drop and values you type are read by your browser's JavaScript, in memory. The analysis runs entirely on your computer or phone.",
  },
  {
    icon: ServerOffIcon,
    title: "No server, no upload",
    body: (
      <>
        This site is a set of static files. It has no backend and no API: there is nowhere to send your data. The
        Content Security Policy only allows connections to this site itself, so even a bug could not send your
        results to a third party.
      </>
    ),
  },
  {
    icon: EyeOffIcon,
    title: "No tracking",
    body: "No analytics, no cookies, no advertising, no external fonts or CDNs. Analysing a report makes no network request at all; the only requests are the pages of this site you choose to open.",
  },
  {
    icon: DatabaseZapIcon,
    title: "No storage",
    body: "Your report is never saved: not in localStorage, not in cookies, not anywhere. Pressing \"Clear\" or closing the tab erases it. Only your light/dark theme preference is remembered.",
  },
];

export default function PrivacyPage() {
  return (
    <article className="flex flex-col gap-10">
      <header className="flex max-w-3xl flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Privacy</h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          Health data is sensitive. This tool was designed so that it never has to be trusted with it.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {POINTS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <Icon className="size-4.5" aria-hidden />
            </span>
            <h2 className="font-semibold tracking-tight">{title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
          </li>
        ))}
      </ul>

      <section className="flex max-w-3xl flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Check it yourself</h2>
        <p className="leading-relaxed text-foreground/90">
          Open your browser&rsquo;s developer tools, go to the <strong>Network</strong> tab, then analyse a report:
          no request is made. You can even disconnect from the internet once the page has loaded; the analyzer keeps
          working.
        </p>
      </section>
    </article>
  );
}
