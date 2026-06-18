"use client"

import Link from "next/link"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { LanguageToggle } from "@/components/language-toggle"
import QuadrantPlayground from "@/components/QuadrantPlayground"

export default function HomePage() {
  const { isSignedIn, isLoaded } = useUser()

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Quadrants",
    description: "AI task manager. Brain-dump your tasks; AI prioritizes them and tells you what to do next.",
    url: "https://quadrants.dev",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, macOS, Windows",
    offers: [
      { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free plan" },
      { "@type": "Offer", price: "9.99", priceCurrency: "USD", description: "Pro plan" },
    ],
    logo: "https://quadrants.dev/logo.png",
    creator: { "@type": "Organization", name: "Quadrants", url: "https://quadrants.dev" },
  }

  return (
    <div className="brand-field min-h-screen font-sans text-[var(--ink)] antialiased">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <div className="mx-auto max-w-[1200px] px-3 py-3 sm:px-4 sm:py-4">
        {/* ── Hero frame: one white card floating on the gray field ── */}
        <div className="brand-paper relative overflow-hidden rounded-[28px]">
          {/* top bar */}
          <header className="flex items-center justify-between px-5 py-4 sm:px-8">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Quadrants" width={26} height={26} className="h-[26px] w-[26px] rounded-md object-contain" />
              <span className="font-display text-lg font-semibold tracking-tight">Quadrants</span>
            </Link>
            <nav className="flex items-center gap-2 sm:gap-3">
              <LanguageToggle />
              {isLoaded && isSignedIn ? (
                <Link href="/projects" className="pill text-sm">Open app</Link>
              ) : (
                <>
                  <Link href="/sign-in" className="hidden rounded-full px-3 py-2 text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] sm:inline-flex">
                    Sign in
                  </Link>
                  <Link href="/sign-up" className="pill text-sm">Start free</Link>
                </>
              )}
            </nav>
          </header>

          {/* hero */}
          <div className="flex flex-col items-center px-5 pb-0 pt-14 text-center sm:pt-20">
            <span className="eyebrow mb-6">AI task manager · no setup</span>
            <h1 className="font-display max-w-4xl text-[2.6rem] font-semibold leading-[0.96] tracking-[-0.035em] sm:text-6xl lg:text-[5.2rem]">
              The power of OmniFocus.
              <br />
              None of the
              <span
                className="mx-2 inline-block h-[0.62em] w-[0.62em] translate-y-[0.04em] rounded-[6px] align-middle"
                style={{ backgroundColor: "var(--acc-magenta)" }}
                aria-hidden
              />
              work.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--ink-soft)] sm:text-lg">
              Brain-dump everything on your mind. AI sorts it by what matters and tells you the one thing to do next — no projects to set up, no tags to maintain.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Link href="/sign-up" className="pill px-6 py-3 text-[15px]">Start free</Link>
              <Link href="/sign-in" className="pill pill-ghost px-6 py-3 text-[15px]">Sign in</Link>
            </div>

            {/* ── signature: fanned posters of the product's own world ── */}
            <div className="relative mt-14 hidden h-[300px] w-full max-w-3xl md:block" aria-hidden>
              {POSTERS.map((p) => (
                <Poster key={p.label} {...p} />
              ))}
            </div>
            {/* mobile: a single poster */}
            <div className="mt-12 md:hidden">
              <div className="mx-auto w-44 -rotate-2">
                <Poster {...POSTERS[1]} static />
              </div>
            </div>
          </div>
        </div>

        {/* ── The loop (a real 3-step sequence, so numbering earns its place) ── */}
        <section className="mt-3 grid gap-3 sm:grid-cols-3">
          {LOOP.map((step) => (
            <div key={step.n} className="brand-paper rounded-[20px] p-6">
              <div className="eyebrow mb-8" style={{ color: step.color }}>{step.n}</div>
              <h3 className="font-display text-2xl font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{step.body}</p>
            </div>
          ))}
        </section>

        {/* ── Interactive proof: the live board ── */}
        <section className="brand-paper mt-3 overflow-hidden rounded-[28px]">
          <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-2">
            <div>
              <span className="eyebrow">See it think</span>
              <h2 className="font-display mt-4 text-3xl font-semibold leading-[1.04] tracking-[-0.03em] sm:text-4xl">
                Drag once. It keeps itself sorted.
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--ink-soft)]">
                Every task lands in one of four quadrants by urgency and importance. AI does the placing; you just glance and go. Try dragging a card.
              </p>
            </div>
            <div className="h-[300px] overflow-hidden rounded-2xl border hairline bg-[var(--field)] p-2">
              <QuadrantPlayground />
            </div>
          </div>
        </section>

        {/* ── Thesis band: the one bold accent moment ── */}
        <section
          className="mt-3 overflow-hidden rounded-[28px] px-6 py-16 text-center sm:px-10 sm:py-24"
          style={{ backgroundColor: "var(--acc-yellow)" }}
        >
          <span className="eyebrow" style={{ color: "#7a7400" }}>The whole idea</span>
          <h2 className="font-display mx-auto mt-5 max-w-3xl text-3xl font-semibold leading-[1.02] tracking-[-0.03em] text-[var(--ink)] sm:text-5xl">
            Stop organizing. Start doing.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-black/70 sm:text-lg">
            Other apps give you a system to maintain. This one maintains itself — so your only job is the next task.
          </p>
        </section>

        {/* ── Final CTA ── */}
        <section className="brand-paper mt-3 rounded-[28px] px-6 py-20 text-center">
          <h2 className="font-display mx-auto max-w-2xl text-4xl font-semibold leading-[1.0] tracking-[-0.035em] sm:text-6xl">
            What should you do right now?
          </h2>
          <p className="mt-5 text-[var(--ink-soft)]">It already knows. Find out in under a minute.</p>
          <div className="mt-8">
            <Link href="/sign-up" className="pill px-7 py-3.5 text-base">Start free</Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="mt-3 flex flex-col items-center justify-between gap-4 px-2 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="" width={20} height={20} className="h-5 w-5 rounded object-contain" />
            <span className="font-display text-sm font-semibold tracking-tight">Quadrants</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-[var(--ink-soft)]">
            <Link href="/pricing" className="hover:text-[var(--ink)]">Pricing</Link>
            <Link href="/about" className="hover:text-[var(--ink)]">About</Link>
            <Link href="/contact" className="hover:text-[var(--ink)]">Contact</Link>
            <Link href="/privacy" className="hover:text-[var(--ink)]">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--ink)]">Terms</Link>
          </div>
          <span className="eyebrow">© 2026 Quadrants</span>
        </footer>
      </div>
    </div>
  )
}

// ── The fanned poster collage — bold Swiss mini-posters of the product world ──
interface PosterDef {
  label: string
  kicker: string
  bg: string
  fg: string
  rotate: number
  left: string
  z: number
  dots?: boolean
}

const POSTERS: PosterDef[] = [
  { label: "DO\nFIRST", kicker: "01 · urgent + important", bg: "#0a0a0a", fg: "#ffffff", rotate: -11, left: "6%", z: 10 },
  { label: "重要\n& 紧急", kicker: "urgent × important", bg: "#ffe600", fg: "#0a0a0a", rotate: -4, left: "26%", z: 20, dots: true },
  { label: "WHAT\nNOW?", kicker: "1 of 12 · focus", bg: "#ff2d78", fg: "#ffffff", rotate: 3, left: "46%", z: 30 },
  { label: "SCHE\nDULE", kicker: "important · later", bg: "#16d07a", fg: "#0a0a0a", rotate: 9, left: "66%", z: 20 },
]

function Poster({ label, kicker, bg, fg, rotate, left, z, dots, static: isStatic }: PosterDef & { static?: boolean }) {
  return (
    <div
      className={isStatic ? "relative" : "absolute top-0"}
      style={isStatic ? { transform: `rotate(${rotate}deg)` } : { left, zIndex: z, transform: `rotate(${rotate}deg)` }}
    >
      <div
        className="relative flex h-60 w-44 flex-col justify-between overflow-hidden rounded-2xl p-4 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.35)]"
        style={{ backgroundColor: bg, color: fg }}
      >
        {dots && (
          <div
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{ backgroundImage: `radial-gradient(${fg} 1.2px, transparent 1.2px)`, backgroundSize: "11px 11px" }}
          />
        )}
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-70">{kicker}</span>
        <span className="font-display whitespace-pre-line text-[2.1rem] font-extrabold leading-[0.92] tracking-[-0.04em]">
          {label}
        </span>
      </div>
    </div>
  )
}

const LOOP = [
  { n: "01", title: "Capture", body: "Type or paste everything on your mind — one line each, however messy. No fields, no folders.", color: "var(--acc-blue)" },
  { n: "02", title: "Prioritize", body: "AI reads each task and places it by urgency and importance. The board sorts itself.", color: "var(--acc-magenta)" },
  { n: "03", title: "Focus", body: "It surfaces the single most important thing. Do that, then the next. That's the whole app.", color: "var(--acc-green)" },
]
