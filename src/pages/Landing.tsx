import { useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import WaitlistForm from '@/components/WaitlistForm';

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/* 3D Wireframe Shape — morphs from sphere → torus → cube on scroll    */
/* ------------------------------------------------------------------ */
function MorphingShape({ scrollProgress }: { scrollProgress: React.MutableRefObject<number> }) {
  const meshRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);

  // Generate geometries
  const geometries = useMemo(() => {
    const sphere = new THREE.IcosahedronGeometry(2, 3);
    const torus = new THREE.TorusGeometry(1.8, 0.6, 16, 32);
    const box = new THREE.OctahedronGeometry(2, 2);
    return {
      sphere: new THREE.EdgesGeometry(sphere),
      torus: new THREE.EdgesGeometry(torus),
      box: new THREE.EdgesGeometry(box),
    };
  }, []);

  // Store sphere vertex positions for morph targets
  const morphData = useMemo(() => {
    const sPos = geometries.sphere.attributes.position.array as Float32Array;
    const tPos = geometries.torus.attributes.position.array as Float32Array;
    const bPos = geometries.box.attributes.position.array as Float32Array;

    // Normalize lengths
    const maxLen = Math.max(sPos.length, tPos.length, bPos.length);
    const padArray = (arr: Float32Array, len: number) => {
      const result = new Float32Array(len);
      for (let i = 0; i < len; i++) {
        result[i] = arr[i % arr.length];
      }
      return result;
    };

    return {
      sphere: padArray(sPos, maxLen),
      torus: padArray(tPos, maxLen),
      box: padArray(bPos, maxLen),
      length: maxLen,
    };
  }, [geometries]);

  useFrame((_state) => {
    if (!meshRef.current) return;
    const t = scrollProgress.current;

    // Rotate
    meshRef.current.rotation.x += 0.003;
    meshRef.current.rotation.y += 0.005;

    // Morph geometry based on scroll
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < morphData.length; i++) {
      if (t < 0.5) {
        // Sphere → Torus
        const p = t * 2;
        positions[i] = morphData.sphere[i] * (1 - p) + morphData.torus[i] * p;
      } else {
        // Torus → Box
        const p = (t - 0.5) * 2;
        positions[i] = morphData.torus[i] * (1 - p) + morphData.box[i] * p;
      }
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;

    // Color shift
    if (materialRef.current) {
      const hue = 0.16 - t * 0.04; // golden yellow drifting to amber
      materialRef.current.color.setHSL(hue, 0.82, 0.62);
    }
  });

  // Create initial geometry with enough vertices
  const initialGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(morphData.sphere), 3));
    return geo;
  }, [morphData]);

  return (
    <lineSegments ref={meshRef} geometry={initialGeometry}>
      <lineBasicMaterial ref={materialRef} color="#EDE84A" transparent opacity={0.6} />
    </lineSegments>
  );
}

/* ------------------------------------------------------------------ */
/* Floating Particles                                                  */
/* ------------------------------------------------------------------ */
function Particles() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 500;

  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 15;
    }
    return [pos];
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0005;
      pointsRef.current.rotation.x += 0.0002;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial color="#D8CF45" size={0.03} transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* 3D Scene                                                            */
/* ------------------------------------------------------------------ */
function Scene({ scrollProgress }: { scrollProgress: React.MutableRefObject<number> }) {
  const { camera } = useThree();

  useFrame(() => {
    // Camera moves slightly based on scroll
    camera.position.z = 5 - scrollProgress.current * 1.5;
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <MorphingShape scrollProgress={scrollProgress} />
      <Particles />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Section Components                                                  */
/* ------------------------------------------------------------------ */
function FeatureCard({ icon, title, description, delay }: {
  icon: string; title: string; description: string; delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.from(ref.current, {
      y: 60,
      opacity: 0,
      duration: 0.8,
      delay,
      scrollTrigger: {
        trigger: ref.current,
        start: 'top 85%',
      },
    });
  }, [delay]);

  return (
    <div ref={ref} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-[#D4C93A]/40 transition-colors group">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#EDE84A] transition-colors">{title}</h3>
      <p className="text-[#9CA3AF] text-[15px] leading-relaxed">{description}</p>
    </div>
  );
}

function StatItem({ value, label, delay }: { value: string; label: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.from(ref.current, {
      y: 40,
      opacity: 0,
      duration: 0.6,
      delay,
      scrollTrigger: {
        trigger: ref.current,
        start: 'top 85%',
      },
    });
  }, [delay]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-[32px] md:text-[48px] font-bold text-white leading-none">{value}</div>
      <div className="text-[#6B7280] text-[15px] mt-2">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Landing Page                                                   */
/* ------------------------------------------------------------------ */
export default function Landing() {
  const scrollProgress = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubRef = useRef<HTMLParagraphElement>(null);
  const heroCTARef = useRef<HTMLDivElement>(null);

  // Smooth scrolling with Lenis
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    lenis.on('scroll', (e: { progress: number }) => {
      scrollProgress.current = e.progress;
      ScrollTrigger.update();
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  // Hero text animations
  useEffect(() => {
    if (heroTitleRef.current) {
      gsap.from(heroTitleRef.current, { y: 80, opacity: 0, duration: 1, delay: 0.3, ease: 'power3.out' });
    }
    if (heroSubRef.current) {
      gsap.from(heroSubRef.current, { y: 40, opacity: 0, duration: 0.8, delay: 0.6, ease: 'power3.out' });
    }
    if (heroCTARef.current) {
      gsap.from(heroCTARef.current, { y: 30, opacity: 0, duration: 0.8, delay: 0.9, ease: 'power3.out' });
    }
  }, []);

  return (
    <div ref={containerRef} className="bg-[#0A0A0F] text-white min-h-screen overflow-hidden">
      {/* Fixed 3D Canvas Background */}
      <div className="fixed inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <Scene scrollProgress={scrollProgress} />
        </Canvas>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-4 md:py-5">
        <a href="#top" aria-label="Back to top" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <img src="/logo.jpg" alt="Roil" className="w-9 h-9 rounded-xl" />
          <span className="text-xl font-bold text-white">Roil</span>
        </a>
        <div className="flex items-center gap-3 md:gap-6">
          <a href="#features" className="hidden md:inline text-[14px] text-[#9CA3AF] hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hidden md:inline text-[14px] text-[#9CA3AF] hover:text-white transition-colors">How It Works</a>
          <a href="#stats" className="hidden md:inline text-[14px] text-[#9CA3AF] hover:text-white transition-colors">Stats</a>
          <a
            href="https://x.com/roil_app"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline text-[14px] text-[#9CA3AF] hover:text-white transition-colors"
          >
            Twitter
          </a>
          <a
            href="https://t.me/roilannouncement"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline text-[14px] text-[#9CA3AF] hover:text-white transition-colors"
          >
            Telegram
          </a>
          <a
            href="#waitlist"
            className="px-5 py-2.5 rounded-xl text-[14px] font-semibold bg-gradient-to-r from-[#EDE84A] to-[#D4C93A] text-[#0A0A0F] hover:opacity-90 transition-opacity"
          >
            Join Waitlist
          </a>
        </div>
      </nav>

      {/* ==================== HERO ==================== */}
      <section id="top" className="relative z-10 min-h-screen flex items-center justify-center px-4 md:px-8">
        <div className="text-center max-w-[800px]">
          <h1
            ref={heroTitleRef}
            className="text-[36px] md:text-[56px] lg:text-[72px] font-bold leading-[1.05] tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #EDE84A 50%, #D4C93A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Private Treasury
            <br />
            Management
          </h1>
          <p ref={heroSubRef} className="text-[16px] md:text-[20px] text-[#9CA3AF] mt-6 max-w-[560px] mx-auto leading-relaxed">
            Automated portfolio rebalancing, DCA strategies, and reward tracking.
            Powered by Canton Network's privacy-first blockchain.
          </p>
          <div ref={heroCTARef} className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <a
              href="#waitlist"
              className="px-8 py-4 rounded-xl text-[16px] font-semibold bg-gradient-to-r from-[#EDE84A] to-[#D4C93A] text-[#0A0A0F] hover:opacity-90 transition-opacity shadow-[0_0_40px_rgba(237,232,74,0.3)]"
            >
              Join the Waitlist
            </a>
            <a
              href="#features"
              className="px-8 py-4 rounded-xl text-[16px] font-semibold border border-white/20 text-white hover:bg-white/5 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* ==================== FEATURES ==================== */}
      <section id="features" className="relative z-10 py-16 md:py-32 px-4 md:px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[28px] md:text-[40px] font-bold text-white">Built for Smart Portfolios</h2>
            <p className="text-[16px] md:text-[18px] text-[#6B7280] mt-4 max-w-[500px] mx-auto">
              Everything you need to manage, grow, and protect your digital assets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon="&#x1F504;"
              title="Auto-Rebalance"
              description="Set drift thresholds and let Roil automatically rebalance your portfolio when allocations drift."
              delay={0}
            />
            <FeatureCard
              icon="&#x1F4C8;"
              title="DCA Strategies"
              description="Schedule recurring buys across any token pair. Weekly, monthly, or custom frequencies."
              delay={0.15}
            />
            <FeatureCard
              icon="&#x1F3C6;"
              title="Reward Tiers"
              description="Earn fee rebates based on your transaction volume. From Bronze to Platinum, the more you trade, the more you save."
              delay={0.3}
            />
            <FeatureCard
              icon="&#x1F512;"
              title="Privacy-First"
              description="Built on Canton Network, with sub-transaction privacy that keeps your portfolio details confidential."
              delay={0.1}
            />
            <FeatureCard
              icon="&#x1F4CA;"
              title="Real-Time Analytics"
              description="Track performance, drift, allocation, and historical returns with interactive charts and donut visualizations."
              delay={0.25}
            />
            <FeatureCard
              icon="&#x1F310;"
              title="Multi-Asset"
              description="9 tokenized assets: BTC, ETH, SOL, Gold, Silver, Bonds, Stablecoins, and Canton Coin."
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section id="how-it-works" className="relative z-10 py-16 md:py-32 px-4 md:px-8">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[28px] md:text-[40px] font-bold text-white">How It Works</h2>
            <p className="text-[18px] text-[#6B7280] mt-4">Three steps to automated portfolio management.</p>
          </div>

          <div className="space-y-12">
            {[
              { step: '01', title: 'Choose a Strategy', desc: 'Pick from 6 pre-built templates or build your own custom allocation with our intuitive builder.' },
              { step: '02', title: 'Set Your Rules', desc: 'Configure drift thresholds, DCA schedules, and auto-compound preferences. You control the parameters.' },
              { step: '03', title: 'Sit Back & Earn', desc: 'Roil monitors your portfolio 24/7. Auto-rebalances when needed, executes DCA buys, and distributes rewards.' },
            ].map((item, i) => {
              const ref = useRef<HTMLDivElement>(null);
              useEffect(() => {
                if (!ref.current) return;
                gsap.from(ref.current, {
                  x: i % 2 === 0 ? -80 : 80,
                  opacity: 0,
                  duration: 0.8,
                  scrollTrigger: { trigger: ref.current, start: 'top 80%' },
                });
              }, []);
              return (
                <div key={item.step} ref={ref} className="flex items-start gap-4 md:gap-8">
                  <div className="text-[40px] md:text-[64px] font-bold text-[#D4C93A]/20 leading-none shrink-0 w-[60px] md:w-[100px]">
                    {item.step}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-[24px] font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-[16px] text-[#9CA3AF] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== STATS ==================== */}
      <section id="stats" className="relative z-10 py-16 md:py-32 px-4 md:px-8">
        <div className="max-w-[900px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <StatItem value="9" label="Tokenized Assets" delay={0} />
            <StatItem value="6" label="Strategy Templates" delay={0.1} />
            <StatItem value="24/7" label="Auto-Rebalancing" delay={0.2} />
            <StatItem value="100%" label="On-Chain" delay={0.3} />
          </div>
        </div>
      </section>

      {/* ==================== WAITLIST ==================== */}
      <section id="waitlist" className="relative z-10 py-16 md:py-32 px-4 md:px-8 scroll-mt-24">
        <div className="max-w-[700px] mx-auto text-center">
          <span className="inline-block rounded-full border border-[#D4C93A]/40 bg-[#D4C93A]/10 px-4 py-1.5 text-[13px] font-medium text-[#EDE84A]">
            Mainnet coming soon
          </span>
          <h2 className="text-[32px] md:text-[48px] font-bold text-white leading-tight mt-6">
            Be first when
            <br />
            <span className="text-[#EDE84A]">Roil goes live.</span>
          </h2>
          <p className="text-[18px] text-[#6B7280] mt-6 max-w-[520px] mx-auto">
            Roil is launching on Canton mainnet soon. Join the waitlist and we'll email you
            the moment it goes live. First members get early access.
          </p>
          <div className="mt-10">
            <WaitlistForm source="landing" />
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="relative z-10 border-t border-white/10 py-8 md:py-12 px-4 md:px-8">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Roil" className="w-8 h-8 rounded-lg" />
            <span className="text-[15px] font-semibold text-white">Roil App</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://x.com/roil_app" target="_blank" rel="noopener noreferrer" className="text-[14px] text-[#6B7280] hover:text-white transition-colors">
              Twitter
            </a>
            <a href="https://t.me/roilannouncement" target="_blank" rel="noopener noreferrer" className="text-[14px] text-[#6B7280] hover:text-white transition-colors">
              Telegram
            </a>
            <a href="https://docs.roil.fi" target="_blank" rel="noopener noreferrer" className="text-[14px] text-[#6B7280] hover:text-white transition-colors">
              Docs
            </a>
            <span className="text-[14px] text-[#6B7280]">
              &copy; 2026 Roil App
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
