import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { Phone, MapPin, Clock, ArrowRight, Check, ChevronDown, MessageCircle } from 'lucide-react'
import logo from '../assets/images/Logo_Tp.png'
import img2 from '../assets/images/Image 2.webp'
import img3 from '../assets/images/Image 3.webp'
import img4 from '../assets/images/Image 4.webp'

const PHONE = '+94 71 931 8737'
const WHATSAPP_NUMBER = '94719318737'
const ADDRESS = '10 Bank Road, Viharagoda, Badulla'
const MAP_LINK = 'https://maps.app.goo.gl/qYVq1cqgFCpH9T1G6'
// lat/lng: 6°59'04.6"N  81°03'30.4"E
const LAT = 6.984611
const LNG = 81.058444

const WA_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=Hi%2C%20I%20want%20to%20join%20Focus%20Fitness`

// Best-matching Unsplash images for gym hero (direct CDN, no API key needed)
const HERO_BG = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80&auto=format'
const GALLERY_IMGS = [
  'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=75&auto=format',
  'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=75&auto=format',
  'https://images.unsplash.com/photo-1549476464-37392f717541?w=800&q=75&auto=format',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=75&auto=format',
]

const stats = [
  { value: '100+', label: 'Active Members' },
  { value: '5+', label: 'Pro Trainers' },
  { value: '7', label: 'Days a Week' },
  { value: '3+', label: 'Years Strong' },
]

const perks = [
  'Full gym access — open 7 days',
  'Professional trainer guidance',
  'Modern equipment & facilities',
  'Locker room access',
  'Progress tracking support',
]

const plans = [
  {
    name: 'Monthly',
    price: '3,000',
    period: '/month',
    highlight: true,
    badge: 'Most Popular',
    features: ['Full gym access', 'Trainer guidance', 'Locker room', 'Progress tracking'],
  },
  {
    name: 'Quarterly',
    price: '8,000',
    period: '/3 months',
    highlight: false,
    features: ['Everything in Monthly', 'Save LKR 1,000', 'Priority trainer time', 'Body assessment'],
  },
  {
    name: 'Annual',
    price: '28,000',
    period: '/year',
    highlight: false,
    features: ['Everything in Quarterly', 'Save LKR 8,000', 'Free protein shake / month', 'VIP access'],
  },
]

const hours = [
  { days: 'Monday – Friday', time: '5:00 AM – 9:30 PM' },
  { days: 'Saturday – Sunday', time: '5:00 AM – 11:00 AM · 2:00 PM – 9:30 PM' },
  { days: 'Poya Days', time: 'Closed' },
]

// ── Animation helpers ─────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
}
const stagger = (delay = 0) => ({
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1], delay } },
})

function Section({ id, children, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.section
      id={id}
      ref={ref}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.section>
  )
}

// ── Typewriter hook ───────────────────────────────────────────────
function useTypewriter(words, typingSpeed = 85, deletingSpeed = 45, pause = 2400) {
  const [wordIndex, setWordIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const word = words[wordIndex]
    let timeout
    if (!deleting && charIndex === word.length) {
      timeout = setTimeout(() => setDeleting(true), pause)
    } else if (deleting && charIndex === 0) {
      setDeleting(false)
      setWordIndex((i) => (i + 1) % words.length)
    } else {
      timeout = setTimeout(() => {
        setCharIndex((c) => c + (deleting ? -1 : 1))
      }, deleting ? deletingSpeed : typingSpeed)
    }
    return () => clearTimeout(timeout)
  }, [charIndex, wordIndex, deleting, words, typingSpeed, deletingSpeed, pause])

  return words[wordIndex].substring(0, charIndex)
}

// ── CountUp component ─────────────────────────────────────────────
function CountUp({ value, inView }) {
  const match = String(value).match(/^(\d[\d,]*)(.*)$/)
  const raw = match ? parseInt(match[1].replace(/,/g, '')) : 0
  const suffix = match ? match[2] : ''
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    let rafId
    const start = performance.now()
    const duration = 1800
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.floor(eased * raw))
      if (progress < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [inView, raw])

  return <>{display}{suffix}</>
}

// ── Stats section (owns inView so CountUp fires on scroll) ────────
function StatsSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={fadeUp}
      className="bg-[#111] border-y border-white/5"
    >
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            variants={stagger(i * 0.1)}
            className="flex flex-col items-center py-10 px-4 text-center"
          >
            <p className="font-display text-4xl md:text-5xl font-black text-primary">
              <CountUp value={s.value} inView={inView} />
            </p>
            <p className="text-white/50 text-xs tracking-widest uppercase mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}

export default function LandingPage() {
  const typedWord = useTypewriter(['TRAIN.', 'PUSH.', 'LIFT.', 'GRIND.', 'SWEAT.'])
  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen" style={{ scrollBehavior: 'smooth' }}>

      {/* ── NAVBAR ──────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 inset-x-0 z-50 h-16 flex items-center justify-between px-6 md:px-12 bg-black/60 backdrop-blur-md border-b border-white/5"
      >
        <div className="flex items-center gap-3">
          <img src={logo} alt="Focus Fitness" className="h-24 w-auto" />
        </div>
        <div className="flex items-center gap-3">
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </a>
          <Link
            to="/login"
            className="text-xs text-white/50 hover:text-white transition-colors tracking-widest uppercase border border-white/10 hover:border-white/30 rounded px-4 py-1.5"
          >
            Staff Portal
          </Link>
        </div>
      </motion.header>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.img
          src={HERO_BG}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-[#0a0a0a]" />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.p
            className="text-primary text-xs font-bold tracking-[0.3em] uppercase mb-6"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
          >
            Focus Fitness — Sri Lanka
          </motion.p>
          <motion.h1
            className="font-display text-[clamp(56px,11vw,120px)] font-black leading-none tracking-tight uppercase mb-6"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.7 }}
          >
            <span className="inline-flex items-baseline">
              <span style={{ minWidth: '3ch' }}>{typedWord}</span>
              <motion.span
                className="inline-block w-[4px] h-[0.8em] bg-white align-baseline ml-1 rounded-sm"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
              />
            </span>
            <br />
            <span className="text-primary">CONQUER.</span>
          </motion.h1>
          <motion.p
            className="text-white/70 text-base md:text-lg max-w-md mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65, duration: 0.7 }}
          >
            A results-driven gym built for people who take their fitness seriously. Open 7 days a week.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.6 }}
          >
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded bg-primary px-8 py-3.5 text-sm font-bold text-white hover:bg-primary/90 active:scale-95 transition-all shadow-2xl shadow-primary/30 uppercase tracking-wide"
            >
              Join Now <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#plans"
              className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              See Plans <ChevronDown className="h-4 w-4" />
            </a>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <ChevronDown className="h-5 w-5 text-white/25" />
        </motion.div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────── */}
      <StatsSection />

      {/* ── ABOUT ───────────────────────────────────────────────── */}
      <Section id="about" className="px-6 md:px-12 py-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="grid grid-cols-2 gap-3">
            <motion.img
              variants={stagger(0)}
              src={img2}
              alt="Focus Fitness gym"
              className="rounded-xl object-cover w-full aspect-[3/4]"
            />
            <motion.img
              variants={stagger(0.15)}
              src={img3}
              alt="Focus Fitness training"
              className="rounded-xl object-cover w-full aspect-[3/4] mt-8"
            />
          </div>

          <div>
            <motion.p variants={stagger(0)} className="text-primary text-xs font-bold tracking-[0.3em] uppercase mb-4">Why Choose Us</motion.p>
            <motion.h2 variants={stagger(0.1)} className="font-display text-4xl md:text-5xl font-black uppercase leading-tight mb-6">
              Real Results.<br />Real Community.
            </motion.h2>
            <motion.p variants={stagger(0.18)} className="text-white/60 leading-relaxed mb-8">
              At Focus Fitness, we combine professional coaching, modern equipment, and a motivated community to help you hit your goals — whatever they may be.
            </motion.p>
            <ul className="space-y-3">
              {perks.map((item, i) => (
                <motion.li key={item} variants={stagger(0.22 + i * 0.07)} className="flex items-center gap-3 text-sm text-white/80">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 shrink-0">
                    <Check className="h-3 w-3 text-primary" />
                  </span>
                  {item}
                </motion.li>
              ))}
            </ul>
            <motion.div variants={stagger(0.6)}>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded bg-primary px-7 py-3 text-sm font-bold text-white hover:bg-primary/90 active:scale-95 transition-all"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </a>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ── GALLERY ─────────────────────────────────────────────── */}
      <Section className="px-6 md:px-12 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <motion.p variants={stagger(0)} className="text-primary text-xs font-bold tracking-[0.3em] uppercase mb-3">Gallery</motion.p>
            <motion.h2 variants={stagger(0.1)} className="font-display text-3xl font-black uppercase">Inside Focus Fitness</motion.h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <motion.div variants={stagger(0)} className="md:col-span-2 md:row-span-2 overflow-hidden rounded-xl">
              <img
                src={GALLERY_IMGS[0]}
                alt="Focus Fitness"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                style={{ aspectRatio: '1/1' }}
              />
            </motion.div>
            {GALLERY_IMGS.slice(1).map((src, i) => (
              <motion.div key={i} variants={stagger((i + 1) * 0.12)} className="overflow-hidden rounded-xl">
                <img
                  src={src}
                  alt={`Focus Fitness ${i + 2}`}
                  className="w-full object-cover hover:scale-105 transition-transform duration-700"
                  style={{ aspectRatio: '4/3' }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── PLANS ───────────────────────────────────────────────── */}
      <Section id="plans" className="px-6 md:px-12 py-24 bg-[#111]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <motion.p variants={stagger(0)} className="text-primary text-xs font-bold tracking-[0.3em] uppercase mb-4">Membership Plans</motion.p>
            <motion.h2 variants={stagger(0.1)} className="font-display text-4xl md:text-5xl font-black uppercase mb-3">Choose Your Plan</motion.h2>
            <motion.p variants={stagger(0.18)} className="text-white/50 text-sm">Flexible options to fit your commitment level. No hidden fees.</motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                variants={stagger(i * 0.12)}
                className={`relative rounded-2xl p-8 flex flex-col ${
                  plan.highlight
                    ? 'border-2 border-primary bg-primary/8 shadow-2xl shadow-primary/20'
                    : 'border border-white/10 bg-white/3'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                    {plan.badge}
                  </span>
                )}
                <p className="text-white/50 text-xs uppercase tracking-widest mb-3">{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-display text-4xl font-black">{plan.price}</span>
                  <span className="text-white/40 text-sm">LKR{plan.period}</span>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                      <Check className={`h-4 w-4 shrink-0 ${plan.highlight ? 'text-primary' : 'text-white/40'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full flex items-center justify-center gap-2 rounded py-3 text-sm font-bold transition-all active:scale-95 ${
                    plan.highlight
                      ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/30'
                      : 'border border-white/15 text-white/70 hover:border-white/30 hover:text-white'
                  }`}
                >
                  Get Started <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── HOURS + MAP ─────────────────────────────────────────── */}
      <Section id="contact" className="px-6 md:px-12 py-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          <div>
            <motion.p variants={stagger(0)} className="text-primary text-xs font-bold tracking-[0.3em] uppercase mb-4">Visit Us</motion.p>
            <motion.h2 variants={stagger(0.1)} className="font-display text-4xl font-black uppercase mb-6">Find Focus Fitness</motion.h2>

            <motion.div variants={stagger(0.18)} className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-sm text-white/70">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <a href={`tel:${PHONE}`} className="hover:text-white transition-colors">{PHONE}</a>
              </div>
              <div className="flex items-start gap-3 text-sm text-white/70">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p>{ADDRESS}</p>
                  <a
                    href={MAP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs mt-0.5 inline-block"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Hours table */}
            <motion.div variants={stagger(0.25)}>
              <p className="text-white/40 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" /> Opening Hours
              </p>
              <div className="space-y-2">
                {hours.map((h) => (
                  <div
                    key={h.days}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 p-3 rounded-lg border ${
                      h.days === 'Poya Days'
                        ? 'border-destructive/20 bg-destructive/5 text-white/40'
                        : 'border-white/8 bg-white/3 text-white/70'
                    }`}
                  >
                    <span className="text-xs font-medium">{h.days}</span>
                    <span className={`text-xs font-mono ${h.days === 'Poya Days' ? 'text-red-500' : 'text-white/50'}`}>{h.time}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={stagger(0.35)}>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded bg-primary px-7 py-3 text-sm font-bold text-white hover:bg-primary/90 active:scale-95 transition-all"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp Us
              </a>
            </motion.div>
          </div>

          {/* Map embed — exact marker, dark mode via CSS filter */}
          <motion.div variants={stagger(0.15)} className="rounded-2xl overflow-hidden border border-white/8 shadow-2xl sticky top-24">
            <div style={{ filter: 'invert(93%) hue-rotate(180deg) brightness(88%) contrast(88%) saturate(0.9)' }}>
              <iframe
                title="Focus Fitness Location"
                src={`https://maps.google.com/maps?q=${LAT},${LNG}&z=17&output=embed`}
                width="100%"
                height="400"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a
              href={MAP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3.5 bg-[#111] hover:bg-[#1a1a1a] text-sm text-white/60 hover:text-white transition-colors"
            >
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Get Directions in Google Maps
            </a>
          </motion.div>
        </div>
      </Section>

      {/* ── CTA STRIP ───────────────────────────────────────────── */}
      <Section className="px-6 md:px-12 pb-24">
        <motion.div
          variants={stagger(0)}
          className="max-w-4xl mx-auto relative overflow-hidden rounded-2xl"
        >
          <img src={img4} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/75" />
          <div className="relative z-10 text-center py-20 px-8">
            <p className="text-primary text-xs font-bold tracking-[0.3em] uppercase mb-4">Start Today</p>
            <h2 className="font-display text-4xl md:text-5xl font-black uppercase mb-4">What Are You Waiting For?</h2>
            <p className="text-white/60 mb-8 max-w-sm mx-auto text-sm">Walk in or drop us a message. Your first session starts the moment you decide.</p>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded bg-primary px-10 py-4 text-sm font-bold text-white hover:bg-primary/90 active:scale-95 transition-all shadow-2xl shadow-primary/30 uppercase tracking-wide"
            >
              Join Focus Fitness <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </motion.div>
      </Section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Focus Fitness" className="h-7 w-auto" />
            <span className="font-display font-bold tracking-wide">Focus Fitness</span>
          </div>
          <p className="text-xs text-white/30">© {new Date().getFullYear()} Focus Fitness. All rights reserved.</p>
          <Link to="/login" className="text-xs text-white/30 hover:text-white/60 transition-colors">
            Staff Portal
          </Link>
        </div>
      </footer>

    </div>
  )
}
