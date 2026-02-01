import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Camera, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 lg:py-40 bg-gradient-to-b from-background to-muted/20">
        <div className="container max-w-7xl mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent font-medium text-sm"
            >
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Personal Styling</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold font-display tracking-tight text-balance"
            >
              Find Your True <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">Style Identity</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-muted-foreground md:max-w-2xl mx-auto leading-relaxed"
            >
              Unlock your unique fashion persona with our advanced diagnostic test and get real-time AI evaluations on your daily outfits.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link href="/test">
                <Button size="lg" className="h-14 px-8 rounded-full text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-1">
                  Start Style Test
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/evaluate">
                <Button variant="outline" size="lg" className="h-14 px-8 rounded-full text-lg hover:bg-muted/50 transition-all">
                  Evaluate Outfit
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Decorative background elements */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white dark:bg-black">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={BarChart3}
              title="Identity Analysis"
              description="Discover if you're an IWSM 'Silent Forest' or EWC 'Urban Pop' through our detailed psychometric test."
              delay={0.1}
            />
            <FeatureCard 
              icon={Camera}
              title="AI Style Check"
              description="Upload your outfit photos and get instant feedback from virtual personas like Editor Sujin."
              delay={0.2}
            />
            <FeatureCard 
              icon={Sparkles}
              title="Smart Wardrobe"
              description="Build a digital profile of your best looks and track your style evolution over time."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Visual Break / Quote */}
      <section className="py-32 bg-primary text-primary-foreground relative overflow-hidden">
        {/* Unsplash abstract fashion texture */}
        {/* Abstract fabric texture */}
        <img 
          src="https://pixabay.com/get/g756d26909ea8e45897473dd797daabb59f888a199591613ebe1a7deb94a41911f3b7d8624fcb903645303d7fa86e97aa6f0e6241ef6d9e90bc85da81e3cef7c8_1280.jpg"
          alt="Abstract Fabric" 
          className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-soft-light"
        />
        <div className="container max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-medium leading-tight">
            "Fashion is the armor to survive the reality of everyday life."
          </h2>
          <p className="mt-6 text-primary-foreground/60 text-lg font-mono">— Bill Cunningham</p>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="p-8 rounded-2xl bg-muted/20 border hover:border-primary/20 hover:bg-muted/30 transition-all duration-300 group"
    >
      <div className="w-14 h-14 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="text-xl font-bold mb-3 font-display">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}
