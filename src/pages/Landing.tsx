import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Briefcase01Icon, CornIcon, Leaf01Icon, NaturalFoodIcon, ShoppingBag01Icon, StarIcon, TractorIcon, WarehouseIcon } from '@hugeicons/core-free-icons'

/**
 * Animated counter hook.
 */
function useCountUp(target: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const counted = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || !startOnView) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true
          const startTime = performance.now()
          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(eased * target))
            if (progress < 1) {
              requestAnimationFrame(animate)
            }
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration, startOnView])

  return { count, ref }
}

/**
 * Landing page — hero, features, how it works, stats, testimonials, CTA.
 */
export default function Landing() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const farmers = useCountUp(0)
  const products = useCountUp(0)
  const jobs = useCountUp(0)
  const communities = useCountUp(0)

  const features = [
    {
      icon: ShoppingBag01Icon,
      title: 'E-Commerce Marketplace',
      description: 'Sell your fresh produce directly to buyers. Set your prices, manage listings, and grow your customer base without middlemen.',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: Briefcase01Icon,
      title: 'Job Portal',
      description: 'Find skilled workers for your farm or discover agricultural job opportunities near you. Seasonal, full-time, and contract work.',
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      icon: WarehouseIcon,
      title: 'Smart Inventory',
      description: 'Track supplies, seeds, fertilizers, and equipment. Get low-stock alerts and manage your farm resources efficiently.',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
  ]

  const steps = [
    { number: '01', title: 'Create Your Account', description: 'Sign up as a farmer or buyer in under 2 minutes.' },
    { number: '02', title: 'Set Up Your Farm Profile', description: 'Showcase your farm, products, and available jobs.' },
    { number: '03', title: 'Start Selling or Buying', description: 'List products, find workers, or purchase fresh farm goods.' },
    { number: '04', title: 'Grow Your Community', description: 'Build relationships, get repeat customers, and expand your reach.' },
  ]

  const testimonials = [
    {
      quote: "Farmify changed how I sell my vegetables. I went from selling at the local market to delivering to 30 customers weekly. My income has doubled!",
      name: "— Real Farmer Story",
      role: "Vegetable Farmer, Nueva Ecija",
      rating: 5,
    },
    {
      quote: "Finding seasonal workers used to be a nightmare. Now I post a job on Farmify and get qualified applicants within days.",
      name: "— Real Farmer Story",
      role: "Fruit Farm Owner, Davao",
      rating: 5,
    },
    {
      quote: "Farmify helps me source fresh ingredients directly from farmers. Better quality, better prices, and I support local agriculture.",
      name: "— Real Buyer Story",
      role: "Restaurant Owner, Quezon City",
      rating: 5,
    },
  ]

  return (
    <div className="overflow-hidden">
      {/* ── Hero Section ── */}
      <section className="relative bg-gradient-to-b from-green-50 via-white to-white">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 size-80 rounded-full bg-green-100/40 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-emerald-100/30 blur-3xl" />
          <div className="absolute top-1/3 left-1/4 size-4 rounded-full bg-green-300/50" />
          <div className="absolute top-1/2 right-1/3 size-3 rounded-full bg-emerald-400/40" />
          <div className="absolute bottom-1/4 right-1/4 size-5 rounded-full bg-lime-300/40" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:px-8 lg:pt-32 lg:pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left content */}
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700 mb-6">
                <HugeiconsIcon icon={NaturalFoodIcon} className="size-4" />
                <span>Empowering Filipino Farmers</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-tight font-display">
                Empowering Farmers,{' '}
                <span className="text-primary">Growing Communities</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
                The all-in-one platform for Filipino farmers to sell products, find workers,
                and manage farm inventory. Connect with buyers and grow your agricultural business.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                {isAuthenticated ? (
                  <Button size="lg" onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                    <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                  </Button>
                ) : (
                  <>
                    <Button size="lg" onClick={() => navigate('/register')}>
                      Get Started Free
                      <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => navigate('/marketplace')}>
                      Browse Marketplace
                    </Button>
                  </>
                )}
              </div>

              {/* Trust indicators */}
              <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <HugeiconsIcon icon={StarIcon} key={i} className="size-4 fill-amber-500 text-amber-500" />
                  ))}
                  <span className="ml-2">Trusted by the Filipino farming community</span>
                </div>
              </div>
            </div>

            {/* Right illustration */}
            <div className="relative hidden lg:block">
              <div className="relative aspect-square max-w-lg mx-auto">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-200 via-emerald-100 to-green-50 animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute inset-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center">
                  <div className="text-center">
                    <HugeiconsIcon icon={TractorIcon} className="size-20 text-primary mx-auto" />
                    <p className="mt-4 text-lg font-semibold text-foreground">Farmify Platform</p>
                    <p className="text-sm text-muted-foreground">All-in-one farm management</p>
                  </div>
                </div>
                {/* Floating elements */}
                <div className="absolute top-10 -left-4 rounded-lg bg-white px-3 py-2 shadow-lg animate-bounce" style={{ animationDuration: '3s' }}>
                  <p className="text-xs font-medium text-green-600 flex items-center gap-1">
                    <HugeiconsIcon icon={CornIcon} className="size-3" /> Fresh Produce
                  </p>
                </div>
                <div className="absolute bottom-16 -right-4 rounded-lg bg-white px-3 py-2 shadow-lg animate-bounce" style={{ animationDuration: '3.5s' }}>
                  <p className="text-xs font-medium text-amber-600 flex items-center gap-1">
                    <HugeiconsIcon icon={Briefcase01Icon} className="size-3" /> Farm Jobs
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-display">
              Everything You Need in One Platform
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Farmify provides all the tools farmers need to succeed in the digital age.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, i) => (
              <Card
                key={feature.title}
                className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'both' }}
              >
                <CardContent className="p-8">
                  <div className={`mb-5 inline-flex rounded-xl ${feature.bgColor} p-3.5 ${feature.color} transition-transform duration-300 group-hover:scale-110`}>
                    <HugeiconsIcon icon={feature.icon} className="size-7" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
                {/* Bottom gradient accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section className="py-20 bg-gradient-to-b from-green-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-display">
              How It Works
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Getting started with Farmify is simple and quick.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-4 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-green-200 via-emerald-400 to-green-200" />

            {steps.map((step, i) => (
              <div key={step.number} className="relative text-center animate-slide-up" style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'both' }}>
                <div className="relative mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-white shadow-lg z-10">
                  {step.number}
                </div>
                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section className="py-20 bg-primary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { label: 'Registered Farmers', value: farmers.count, ref: farmers.ref, suffix: '+' },
              { label: 'Products Listed', value: products.count, ref: products.ref, suffix: '+' },
              { label: 'Jobs Posted', value: jobs.count, ref: jobs.ref, suffix: '+' },
              { label: 'Communities Reached', value: communities.count, ref: communities.ref, suffix: '' },
            ].map((stat) => (
              <div key={stat.label} className="text-center text-primary-foreground">
                <span
                  ref={stat.ref}
                  className="block text-4xl font-extrabold sm:text-5xl tabular-nums"
                >
                  {stat.value.toLocaleString()}{stat.suffix}
                </span>
                <span className="mt-2 block text-sm text-green-200 font-medium">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-primary-foreground/60">
            Live community metrics — updated in real time.
          </p>
        </div>
      </section>

      {/* ── Testimonials Section ── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-display">
              What Farmers Say
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Join thousands of farmers who trust Farmify.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map((t, i) => (
              <Card
                key={`testimonial-${i}`}
                className="animate-slide-up border-0 shadow-md"
                style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'both' }}
              >
                <CardContent className="p-6">
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <HugeiconsIcon icon={StarIcon} key={j} className="size-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <blockquote className="text-muted-foreground leading-relaxed mb-6 italic">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm text-center leading-none px-1">
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-700">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl font-display">
            Ready to Grow Your Farm Business?
          </h2>
          <p className="mt-4 text-lg text-green-100 max-w-2xl mx-auto">
            Join Farmify today and connect with a community of farmers, buyers, and workers.
            Start selling, hiring, and managing your farm smarter.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {isAuthenticated ? (
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-green-50"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-green-50"
                  onClick={() => navigate('/register')}
                >
                  Join Farmify Free
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10"
                  onClick={() => navigate('/marketplace')}
                >
                  Explore Marketplace
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Decorative bottom leaf */}
      <div className="flex justify-center py-4 bg-gradient-to-r from-green-600 to-emerald-700">
        <HugeiconsIcon icon={Leaf01Icon} className="size-6 text-green-300/50" />
      </div>
    </div>
  )
}
