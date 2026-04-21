"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { FadeUp } from "@/components/ui/fade-up";

const TradeMap = dynamic(() => import("@/components/trade-map"), { ssr: false });

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function IconSearch() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400">
      <circle cx="18" cy="18" r="10" />
      <line x1="26" y1="26" x2="34" y2="34" />
    </svg>
  );
}

function IconVerified() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400">
      <circle cx="20" cy="12" r="6" />
      <path d="M8 34c0-6.627 5.373-12 12-12s12 5.373 12 12" strokeLinecap="round" />
      <circle cx="28" cy="28" r="6" fill="white" stroke="currentColor" />
      <path d="M25.5 28l2 2 3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconContact() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400">
      <rect x="6" y="8" width="28" height="20" rx="3" />
      <path d="M14 28l-4 4v-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 18c1-3 7-3 8 0" strokeLinecap="round" />
      <circle cx="20" cy="21" r="1" fill="currentColor" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400">
      <rect x="10" y="8" width="20" height="26" rx="2" />
      <path d="M15 14h10M15 19h10M15 24h6" strokeLinecap="round" />
      <circle cx="30" cy="30" r="5" fill="white" stroke="currentColor" />
      <path d="M28 30h4M30 28v4" strokeLinecap="round" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400">
      <path d="M20 6c-6 0-10 4.5-10 10 0 7.5 10 18 10 18s10-10.5 10-18c0-5.5-4-10-10-10z" />
      <rect x="16" y="12" width="8" height="7" rx="1" />
      <path d="M18 12v-2M22 12v-2M16 16h8" strokeLinecap="round" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400">
      <path d="M20 6l3.5 7 7.5 1.1-5.5 5.3 1.3 7.6L20 23.5l-6.8 3.5 1.3-7.6L9 14.1l7.5-1.1z" strokeLinejoin="round" />
      <path d="M20 30v5M17 33l3-2.5 3 2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400">
      <path d="M20 6l12 5v8c0 7-5 12-12 14C13 31 8 26 8 19v-8l12-5z" strokeLinejoin="round" />
      <path d="M15 20l3.5 3.5L25 17" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconNoDollar() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400">
      <circle cx="20" cy="20" r="12" />
      <path d="M20 10v20M16 14h6a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h6" strokeLinecap="round" />
      <line x1="8" y1="8" x2="32" y2="32" strokeLinecap="round" />
    </svg>
  );
}

function IconTag() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400">
      <path d="M8 8h14l10 12-14 12L4 20z" strokeLinejoin="round" />
      <circle cx="14" cy="16" r="2" fill="currentColor" stroke="none" />
      <text x="17" y="25" fontSize="7" fontWeight="bold" fill="#60A5FA" stroke="none" fontFamily="system-ui">FREE</text>
    </svg>
  );
}

// ── Step data ─────────────────────────────────────────────────────────────────

const homeownerSteps = [
  {
    title: "Search by trade",
    desc: "Browse 30A contractors by category — plumbing, HVAC, landscaping, and more. All locally verified.",
    icon: <IconSearch />,
  },
  {
    title: "Review verified profiles",
    desc: "See photos, services, pricing ranges, and real reviews from your neighbors — not anonymous strangers.",
    icon: <IconVerified />,
  },
  {
    title: "Contact directly",
    desc: "Reach out via the platform. No lead fees, no call center. Just you and the contractor.",
    icon: <IconContact />,
  },
];

const tradespeopleSteps = [
  {
    title: "Create your free listing",
    desc: "Build your profile in minutes. Add your trade, service area, photos, and contact info. Always free.",
    icon: <IconClipboard />,
  },
  {
    title: "Get found by local homeowners",
    desc: "When a homeowner in your area searches for your trade, your profile shows up — no ad spend needed.",
    icon: <IconMapPin />,
  },
  {
    title: "Build your reputation",
    desc: "Earn verified reviews from real clients. Every job you complete builds your standing in the community.",
    icon: <IconStar />,
  },
];

const valueProps = [
  {
    title: "Community verified",
    desc: "Reviews come from registered local users — not anonymous internet strangers. Real names, real neighbors.",
    icon: <IconShield />,
  },
  {
    title: "No pay-to-win placement",
    desc: "Listings are ranked by reputation and relevance — not by who paid for the top spot. The best contractor wins.",
    icon: <IconNoDollar />,
  },
  {
    title: "Free to start, forever",
    desc: "Homeowners browse free. Contractors list free. We only charge if you want to grow faster with premium placement.",
    icon: <IconTag />,
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export function HowItWorksContent() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Section 1: Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-zinc-950 text-white py-28 px-4 text-center">
        {/* Topo map background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1440 560"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g stroke="white" strokeWidth="0.75" fill="none" opacity="0.18">
              {Array.from({ length: 32 }).map((_, row) => {
                const baseY = -20 + row * 19;
                const xs = [0, 80, 160, 240, 320, 400, 480, 560, 640, 720, 800, 880, 960, 1040, 1120, 1200, 1280, 1360, 1440, 1500];
                const ys = xs.map((x) => {
                  const v =
                    22 * Math.sin(x * 0.005 + row * 0.62) +
                    12 * Math.sin(x * 0.013 + row * 1.1 + 1.8) +
                    7  * Math.sin(x * 0.028 + row * 0.38 + 3.3) +
                    4  * Math.sin(x * 0.048 + row * 1.7 + 0.9);
                  return baseY + v;
                });
                let d = `M${xs[0]},${ys[0]}`;
                for (let i = 1; i < xs.length; i++) {
                  const w = xs[i] - xs[i - 1];
                  d += ` C${xs[i-1] + w * 0.35},${ys[i-1]} ${xs[i-1] + w * 0.65},${ys[i]} ${xs[i]},${ys[i]}`;
                }
                return <path key={row} d={d} />;
              })}
              {/* Closed hilltop loops */}
              <ellipse cx="310" cy="130" rx="62" ry="28" transform="rotate(-8 310 130)" />
              <ellipse cx="310" cy="130" rx="38" ry="16" transform="rotate(-8 310 130)" />
              <ellipse cx="310" cy="130" rx="18" ry="7" transform="rotate(-8 310 130)" />
              <ellipse cx="1080" cy="220" rx="80" ry="34" transform="rotate(12 1080 220)" />
              <ellipse cx="1080" cy="220" rx="52" ry="22" transform="rotate(12 1080 220)" />
              <ellipse cx="1080" cy="220" rx="28" ry="11" transform="rotate(12 1080 220)" />
              <ellipse cx="680" cy="400" rx="55" ry="24" transform="rotate(-5 680 400)" />
              <ellipse cx="680" cy="400" rx="32" ry="14" transform="rotate(-5 680 400)" />
              <ellipse cx="200" cy="360" rx="44" ry="20" transform="rotate(10 200 360)" />
              <ellipse cx="200" cy="360" rx="24" ry="11" transform="rotate(10 200 360)" />
              <ellipse cx="1300" cy="90" rx="50" ry="22" transform="rotate(-15 1300 90)" />
              <ellipse cx="1300" cy="90" rx="28" ry="12" transform="rotate(-15 1300 90)" />
            </g>
          </svg>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
              The local way to find a tradesman you can trust.
            </h1>
            <p className="mt-5 text-lg text-blue-300 leading-relaxed max-w-2xl mx-auto">
              Trade Source connects 30A homeowners with verified local contractors — no algorithms, no middlemen.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contractors">
                <button className="px-6 py-3 rounded-lg bg-blue-400 text-zinc-950 font-semibold hover:bg-blue-300 transition-colors">
                  Find a Tradesman
                </button>
              </Link>
              <Link href="/join">
                <button className="px-6 py-3 rounded-lg border border-white text-white font-semibold hover:bg-white/10 transition-colors">
                  List Your Business
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Section 2: For Homeowners ─────────────────────────────────────── */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeUp duration={0.9}>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">
              For Homeowners
            </p>
            <h2 className="text-3xl font-bold text-zinc-900 mb-12">
              Find the right contractor in three steps
            </h2>
          </FadeUp>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10">
            {homeownerSteps.map((step, i) => (
              <FadeUp key={step.title} delay={i * 0.25} duration={0.9}>
                <div className="flex flex-col items-start gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-400 text-sm font-bold">
                      {i + 1}
                    </span>
                  </div>
                  <div>{step.icon}</div>
                  <h3 className="text-lg font-bold text-zinc-900">{step.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: For Tradespeople ───────────────────────────────────── */}
      <section className="bg-blue-50 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeUp duration={0.9}>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">
              For Tradespeople
            </p>
            <h2 className="text-3xl font-bold text-zinc-900 mb-12">
              Grow your local business — free
            </h2>
          </FadeUp>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10">
            {tradespeopleSteps.map((step, i) => (
              <FadeUp key={step.title} delay={i * 0.25} duration={0.9}>
                <div className="flex flex-col items-start gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-blue-400 text-sm font-bold">
                      {i + 1}
                    </span>
                  </div>
                  <div>{step.icon}</div>
                  <h3 className="text-lg font-bold text-zinc-900">{step.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: The Map ────────────────────────────────────────────── */}
      <section className="bg-zinc-950 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeUp duration={0.9}>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white">30A&apos;s Local Trade Network</h2>
              <p className="mt-3 text-blue-300 text-base">
                Every dot is a verified local business. This is your community.
              </p>
            </div>
          </FadeUp>

          <FadeUp delay={0.2} duration={0.9}>
            <div className="rounded-2xl overflow-hidden border border-white/10">
              <TradeMap />
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Section 5: Why Trade Source ───────────────────────────────────── */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeUp duration={0.9}>
            <h2 className="text-3xl font-bold text-zinc-900 text-center mb-12">
              Why Trade Source?
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {valueProps.map((card, i) => (
              <FadeUp key={card.title} delay={i * 0.2} duration={0.9}>
                <div className="border border-blue-100 rounded-2xl p-6 bg-white hover:border-blue-300 hover:shadow-md transition-all duration-200">
                  <div className="mb-4">{card.icon}</div>
                  <h3 className="text-base font-bold text-zinc-900 mb-2">{card.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{card.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 6: CTA Strip ──────────────────────────────────────────── */}
      <section className="bg-zinc-950 py-20 px-4 text-center">
        <FadeUp duration={0.9}>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white">Ready to get started?</h2>
            <p className="mt-3 text-blue-300 text-base">
              It takes 2 minutes to find a tradesman or build your free listing.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contractors">
                <button className="px-6 py-3 rounded-lg bg-blue-400 text-zinc-950 font-semibold hover:bg-blue-300 transition-colors">
                  Find a Tradesman
                </button>
              </Link>
              <Link href="/join">
                <button className="px-6 py-3 rounded-lg border border-white text-white font-semibold hover:bg-white/10 transition-colors">
                  List Your Business
                </button>
              </Link>
            </div>
          </div>
        </FadeUp>
      </section>
    </div>
  );
}
