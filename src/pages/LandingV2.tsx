import { useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/* ================================================================== */
/* 3D Background — subtle ring that rotates and pulses                 */
/* ================================================================== */
function FloatingRing() {
  const ref = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    const torus = new THREE.TorusGeometry(2.5, 0.02, 64, 128);
    return new THREE.EdgesGeometry(torus);
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.x = Math.sin(t * 0.3) * 0.4 + 0.8;
    ref.current.rotation.y = t * 0.15;
    ref.current.rotation.z = Math.cos(t * 0.2) * 0.1;
    const scale = 1 + Math.sin(t * 0.5) * 0.05;
    ref.current.scale.setScalar(scale);
  });

  return (
    <lineSegments ref={ref} geometry={geometry}>
      <lineBasicMaterial color="#10B981" transparent opacity={0.15} />
    </lineSegments>
  );
}

function GridLines() {
  const ref = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    const points: number[] = [];
    const size = 20;
    const step = 1;
    for (let i = -size; i <= size; i += step) {
      points.push(-size, 0, i, size, 0, i);
      points.push(i, 0, -size, i, 0, size);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = -3 + Math.sin(clock.getElapsedTime() * 0.2) * 0.3;
  });

  return (
    <lineSegments ref={ref} geometry={geometry}>
      <lineBasicMaterial color="#059669" transparent opacity={0.04} />
    </lineSegments>
  );
}

function SubtleScene() {
  return (
    <>
      <FloatingRing />
      <GridLines />
    </>
  );
}

/* ================================================================== */
/* Animated Text Components                                            */
/* ================================================================== */
function AnimatedHeading({ children, className = '' }: { children: string; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const words = ref.current.querySelectorAll('.word');
    gsap.from(words, {
      y: 80,
      opacity: 0,
      duration: 0.8,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: ref.current,
        start: 'top 80%',
      },
    });
  }, []);

  const wrappedWords = children.split(' ').map((word, i) => (
    <span key={i} className="word inline-block mr-[0.3em]">{word}</span>
  ));

  return (
    <h2 ref={ref} className={`overflow-hidden ${className}`}>
      {wrappedWords}
    </h2>
  );
}

function FadeInParagraph({ children, className = '', delay = 0 }: { children: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.from(ref.current, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      delay,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: ref.current,
        start: 'top 85%',
      },
    });
  }, [delay]);

  return <p ref={ref} className={className}>{children}</p>;
}

function CountUp({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: ref.current,
        start: 'top 85%',
      },
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = prefix + Math.round(obj.val).toLocaleString() + suffix;
        }
      },
    });
  }, [target, suffix, prefix]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}

// Extracted so useRef/useEffect aren't called inside a .map() callback (which
// violated React's rules-of-hooks in the prior implementation).
interface StatShape { target: number; prefix: string; suffix: string; label: string }
function StatCard({ stat, index }: { stat: StatShape; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.from(ref.current, {
      y: 40,
      opacity: 0,
      duration: 0.6,
      delay: index * 0.1,
      scrollTrigger: { trigger: ref.current, start: 'top 85%' },
    });
  }, [index]);
  return (
    <div ref={ref} className="text-center">
      <div className="text-[48px] font-bold text-white leading-none">
        <CountUp target={stat.target} prefix={stat.prefix} suffix={stat.suffix} />
      </div>
      <div className="text-[15px] text-[#6B7280] mt-3">{stat.label}</div>
    </div>
  );
}

interface AssetShape { symbol: string; name: string; color: string }
function AssetCard({ asset, index }: { asset: AssetShape; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.from(ref.current, {
      scale: 0.8,
      opacity: 0,
      duration: 0.5,
      delay: index * 0.05,
      scrollTrigger: { trigger: ref.current, start: 'top 90%' },
    });
  }, [index]);
  return (
    <div
      ref={ref}
      className="flex items-center gap-4 p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] transition-colors"
    >
      <img src={`/tokens/${asset.symbol.toLowerCase()}.png`} alt={asset.symbol} className="w-10 h-10 rounded-full" />
      <div>
        <div className="text-[16px] font-semibold text-white">{asset.symbol}</div>
        <div className="text-[13px] text-[#6B7280]">{asset.name}</div>
      </div>
      <div className="ml-auto w-3 h-3 rounded-full" style={{ backgroundColor: asset.color }} />
    </div>
  );
}

/* ================================================================== */
/* Pinned Feature Section — text changes as you scroll                 */
/* ================================================================== */
function PinnedFeatures() {
  const containerRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      label: 'Auto-Rebalance',
      title: 'Your portfolio stays balanced.',
      description: 'Set drift thresholds and Roil monitors 24/7. When allocations drift beyond your limits, automatic rebalancing kicks in — no manual intervention needed.',
      accent: '#059669',
    },
    {
      label: 'DCA Engine',
      title: 'Consistent investing, automated.',
      description: 'Schedule recurring buys across any token pair. Daily, weekly, or monthly — dollar cost averaging has never been this effortless.',
      accent: '#6366F1',
    },
    {
      label: 'Reward Tiers',
      title: 'Trade more, pay less.',
      description: 'Earn fee rebates based on your activity. From Bronze to Platinum, every transaction brings you closer to higher savings.',
      accent: '#D97706',
    },
    {
      label: 'Privacy-First',
      title: 'Your data stays yours.',
      description: 'Built on Canton Network with sub-transaction privacy. Portfolio details, balances, and strategies — all confidential by default.',
      accent: '#EC4899',
    },
  ];

  useEffect(() => {
    if (!containerRef.current || !featuresRef.current) return;

    const items = featuresRef.current.querySelectorAll('.feature-item');

    // Pin the container
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: `+=${items.length * 100}%`,
      pin: true,
      pinSpacing: true,
    });

    // Animate each feature
    items.forEach((item, i) => {
      if (i === 0) return; // First item is visible by default
      gsap.from(item, {
        opacity: 0,
        y: 60,
        duration: 0.6,
        scrollTrigger: {
          trigger: containerRef.current,
          start: `${(i / items.length) * 100}% top`,
          end: `${((i + 0.5) / items.length) * 100}% top`,
          scrub: true,
        },
      });
      // Fade out previous
      if (i > 0) {
        gsap.to(items[i - 1], {
          opacity: 0,
          y: -40,
          duration: 0.6,
          scrollTrigger: {
            trigger: containerRef.current,
            start: `${(i / items.length) * 100}% top`,
            end: `${((i + 0.5) / items.length) * 100}% top`,
            scrub: true,
          },
        });
      }
    });

    return () => ScrollTrigger.getAll().forEach((st) => st.kill());
  }, []);

  return (
    <div ref={containerRef} className="relative h-screen flex items-center overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-8 w-full">
        <div className="grid grid-cols-2 gap-20 items-center">
          {/* Left — static label */}
          <div>
            <p className="text-[14px] font-semibold text-[#059669] tracking-widest uppercase mb-4">Features</p>
            <h2 className="text-[48px] font-bold text-white leading-[1.1]">
              Everything you need.
              <br />
              <span className="text-[#6B7280]">Nothing you don't.</span>
            </h2>
          </div>

          {/* Right — scrolling features */}
          <div ref={featuresRef} className="relative min-h-[280px]">
            {features.map((f, i) => (
              <div
                key={f.label}
                className="feature-item absolute inset-0 flex flex-col justify-center"
                style={{ opacity: i === 0 ? 1 : 0 }}
              >
                <div
                  className="text-[13px] font-bold tracking-widest uppercase mb-3"
                  style={{ color: f.accent }}
                >
                  {f.label}
                </div>
                <h3 className="text-[32px] font-bold text-white mb-4 leading-tight">{f.title}</h3>
                <p className="text-[17px] text-[#9CA3AF] leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Horizontal Scroll Section                                           */
/* ================================================================== */
function HorizontalScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const steps = [
    { num: '01', title: 'Connect', desc: 'Link your Canton wallet in one click. Your keys, your control.', icon: '\u{1F517}' },
    { num: '02', title: 'Choose', desc: 'Pick a strategy or build your own. 6 templates or fully custom.', icon: '\u{1F3AF}' },
    { num: '03', title: 'Configure', desc: 'Set allocations, drift thresholds, and DCA schedules.', icon: '\u{2699}\u{FE0F}' },
    { num: '04', title: 'Relax', desc: 'Roil handles rebalancing, executes DCA buys, and distributes rewards.', icon: '\u{1F680}' },
  ];

  useEffect(() => {
    if (!containerRef.current || !trackRef.current) return;

    const totalScroll = trackRef.current.scrollWidth - window.innerWidth;

    gsap.to(trackRef.current, {
      x: -totalScroll,
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: `+=${totalScroll}`,
        pin: true,
        scrub: 1,
        pinSpacing: true,
      },
    });

    return () => ScrollTrigger.getAll().forEach((st) => st.kill());
  }, []);

  return (
    <div ref={containerRef} className="h-screen overflow-hidden">
      <div ref={trackRef} className="flex items-center h-full" style={{ width: `${steps.length * 100}vw` }}>
        {steps.map((step) => (
          <div key={step.num} className="w-screen h-full flex items-center justify-center px-8 shrink-0">
            <div className="max-w-[600px]">
              <div className="text-[120px] font-bold text-[#059669]/10 leading-none mb-4">{step.num}</div>
              <div className="text-[56px] mb-4">{step.icon}</div>
              <h3 className="text-[40px] font-bold text-white mb-4">{step.title}</h3>
              <p className="text-[20px] text-[#9CA3AF] leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Main Landing V2                                                     */
/* ================================================================== */
export default function LandingV2() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  // Hero entrance
  useEffect(() => {
    gsap.from('.hero-line-1', { y: 100, opacity: 0, duration: 1.2, delay: 0.2, ease: 'power3.out' });
    gsap.from('.hero-line-2', { y: 100, opacity: 0, duration: 1.2, delay: 0.5, ease: 'power3.out' });
    gsap.from('.hero-sub', { y: 40, opacity: 0, duration: 0.8, delay: 0.9, ease: 'power2.out' });
    gsap.from('.hero-cta', { y: 30, opacity: 0, duration: 0.8, delay: 1.2, ease: 'power2.out' });
    gsap.from('.hero-scroll', { opacity: 0, duration: 0.6, delay: 2, ease: 'power2.out' });
  }, []);

  return (
    <div ref={containerRef} className="bg-[#08080C] text-white">
      {/* Fixed 3D Background */}
      <div className="fixed inset-0 z-0 opacity-60">
        <Canvas camera={{ position: [0, 1, 6], fov: 50 }}>
          <SubtleScene />
        </Canvas>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-6 backdrop-blur-sm bg-[#08080C]/60">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Roil" className="w-8 h-8 rounded-lg" />
          <span className="text-[18px] font-bold">Roil</span>
        </div>
        <div className="flex items-center gap-8">
          <a href="#about" className="text-[14px] text-[#6B7280] hover:text-white transition-colors">About</a>
          <a href="#features" className="text-[14px] text-[#6B7280] hover:text-white transition-colors">Features</a>
          <a href="#how" className="text-[14px] text-[#6B7280] hover:text-white transition-colors">How It Works</a>
          <a
            href="https://x.com/RoilFinance"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] text-[#6B7280] hover:text-white transition-colors"
          >
            Twitter
          </a>
          <a
            href="/login"
            className="px-5 py-2.5 rounded-lg text-[14px] font-semibold bg-white text-[#08080C] hover:bg-[#E5E7EB] transition-colors"
          >
            Launch App
          </a>
        </div>
      </nav>

      {/* ==================== HERO ==================== */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-8">
        <div className="text-center">
          <div className="overflow-hidden">
            <h1 className="hero-line-1 text-[80px] font-bold leading-[1] tracking-tight text-white">
              The future of
            </h1>
          </div>
          <div className="overflow-hidden">
            <h1
              className="hero-line-2 text-[80px] font-bold leading-[1] tracking-tight"
              style={{
                background: 'linear-gradient(90deg, #059669, #10B981, #34D399)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              portfolio management.
            </h1>
          </div>
          <p className="hero-sub text-[20px] text-[#6B7280] mt-8 max-w-[480px] mx-auto leading-relaxed">
            Automated rebalancing, DCA strategies, and privacy-first asset management on Canton Network.
          </p>
          <div className="hero-cta flex items-center justify-center gap-4 mt-10">
            <a
              href="/login"
              className="px-8 py-4 rounded-xl text-[16px] font-semibold bg-white text-[#08080C] hover:bg-[#E5E7EB] transition-colors"
            >
              Get Started
            </a>
            <a
              href="#about"
              className="px-8 py-4 rounded-xl text-[16px] font-semibold text-[#6B7280] hover:text-white transition-colors"
            >
              Learn more &darr;
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hero-scroll absolute bottom-10 flex flex-col items-center gap-2">
          <div className="w-[1px] h-[60px] bg-gradient-to-b from-transparent via-[#059669] to-transparent animate-pulse" />
        </div>
      </section>

      {/* ==================== ABOUT — big text reveal ==================== */}
      <section id="about" className="relative z-10 py-40 px-8">
        <div className="max-w-[900px] mx-auto">
          <AnimatedHeading className="text-[52px] font-bold text-white leading-[1.15] mb-8">
            Roil is a private treasury management protocol built on Canton Network.
          </AnimatedHeading>
          <FadeInParagraph className="text-[22px] text-[#6B7280] leading-relaxed" delay={0.3}>
            We believe portfolio management should be automated, private, and accessible. Set your strategy once — Roil handles the rest.
          </FadeInParagraph>
        </div>
      </section>

      {/* ==================== STATS — counters ==================== */}
      <section className="relative z-10 py-32 px-8">
        <div className="max-w-[1000px] mx-auto">
          <div className="grid grid-cols-4 gap-8">
            {[
              { target: 2400000, prefix: '$', suffix: '', label: 'Total Value Locked' },
              { target: 1247, prefix: '', suffix: '', label: 'Active Portfolios' },
              { target: 9, prefix: '', suffix: '', label: 'Tokenized Assets' },
              { target: 99, prefix: '', suffix: '.9%', label: 'Uptime' },
            ].map((stat, i) => (
              <StatCard key={stat.label} stat={stat} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PINNED FEATURES ==================== */}
      <section id="features">
        <PinnedFeatures />
      </section>

      {/* ==================== HORIZONTAL SCROLL — How It Works ==================== */}
      <section id="how">
        <HorizontalScroll />
      </section>

      {/* ==================== ASSET GRID ==================== */}
      <section className="relative z-10 py-32 px-8">
        <div className="max-w-[1000px] mx-auto">
          <AnimatedHeading className="text-[40px] font-bold text-white text-center mb-16">
            9 tokenized assets. One platform.
          </AnimatedHeading>

          <div className="grid grid-cols-3 gap-4">
            {[
              { symbol: 'CBTC', name: 'Canton Bitcoin', color: '#F59E0B' },
              { symbol: 'ETHx', name: 'Canton Ethereum', color: '#8B5CF6' },
              { symbol: 'SOLx', name: 'Canton Solana', color: '#14F195' },
              { symbol: 'CC', name: 'Canton Coin', color: '#059669' },
              { symbol: 'USDCx', name: 'USD Coin', color: '#2563EB' },
              { symbol: 'XAUt', name: 'Tokenized Gold', color: '#D97706' },
              { symbol: 'XAGt', name: 'Tokenized Silver', color: '#94A3B8' },
              { symbol: 'USTb', name: 'US Treasury Bond', color: '#1E40AF' },
              { symbol: 'MMF', name: 'Money Market Fund', color: '#0EA5E9' },
            ].map((asset, i) => (
              <AssetCard key={asset.symbol} asset={asset} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FINAL CTA ==================== */}
      <section className="relative z-10 py-40 px-8">
        <div className="max-w-[700px] mx-auto text-center">
          <AnimatedHeading className="text-[56px] font-bold text-white leading-[1.1] mb-6">
            Start managing your portfolio today.
          </AnimatedHeading>
          <FadeInParagraph className="text-[20px] text-[#6B7280] mb-10" delay={0.2}>
            No minimum deposit. No lock-up periods. Full control, full privacy.
          </FadeInParagraph>
          <div>
            <a
              href="/login"
              className="inline-flex px-10 py-4 rounded-xl text-[18px] font-semibold bg-white text-[#08080C] hover:bg-[#E5E7EB] transition-colors"
            >
              Launch App
            </a>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="relative z-10 border-t border-white/5 py-16 px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.jpg" alt="Roil" className="w-7 h-7 rounded-lg" />
                <span className="text-[16px] font-bold">Roil</span>
              </div>
              <p className="text-[13px] text-[#6B7280] leading-relaxed">
                Private treasury management on Canton Network.
              </p>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-4">Product</h4>
              <div className="flex flex-col gap-2.5">
                <a href="/login" className="text-[14px] text-[#6B7280] hover:text-white transition-colors">Launch App</a>
                <a href="#features" className="text-[14px] text-[#6B7280] hover:text-white transition-colors">Features</a>
                <a href="#how" className="text-[14px] text-[#6B7280] hover:text-white transition-colors">How It Works</a>
              </div>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-4">Resources</h4>
              <div className="flex flex-col gap-2.5">
                <a href="https://docs.roil.fi" target="_blank" rel="noopener noreferrer" className="text-[14px] text-[#6B7280] hover:text-white transition-colors">Documentation</a>
                <a href="https://github.com/Roil-Finance/roil-finance" target="_blank" rel="noopener noreferrer" className="text-[14px] text-[#6B7280] hover:text-white transition-colors">GitHub</a>
              </div>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-4">Community</h4>
              <div className="flex flex-col gap-2.5">
                <a href="https://x.com/RoilFinance" target="_blank" rel="noopener noreferrer" className="text-[14px] text-[#6B7280] hover:text-white transition-colors">Twitter / X</a>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <span className="text-[13px] text-[#4B5563]">&copy; 2026 Roil Finance. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
