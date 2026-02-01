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
              <span>AI 기반 퍼스널 스타일링</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold font-display tracking-tight text-balance"
            >
              나만의 <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">스타일 정체성</span>을 찾아보세요
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-muted-foreground md:max-w-2xl mx-auto leading-relaxed"
            >
              MBTI처럼 당신만의 패션 유형을 발견하고, AI 페르소나로부터 실시간 스타일 평가를 받아보세요.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link href="/test">
                <Button size="lg" className="h-14 px-8 rounded-full text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-1" data-testid="button-start-test">
                  스타일 테스트 시작
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/evaluate">
                <Button variant="outline" size="lg" className="h-14 px-8 rounded-full text-lg hover:bg-muted/50 transition-all" data-testid="button-evaluate">
                  패션 평가받기
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
              title="스타일 정체성 분석"
              description="당신이 '고요한 숲' 유형인지 '도시의 건축가' 유형인지, 16가지 스타일 유형 중 나를 찾아보세요."
              delay={0.1}
            />
            <FeatureCard 
              icon={Camera}
              title="AI 패션 평가"
              description="사진을 업로드하면 패션 에디터 수진, 스트리트 포토그래퍼 민수 등 AI 페르소나가 솔직한 피드백을 드립니다."
              delay={0.2}
            />
            <FeatureCard 
              icon={Sparkles}
              title="스타일 히스토리"
              description="나의 베스트 룩을 기록하고, 시간에 따른 스타일 변화를 추적해보세요."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Visual Break / Quote */}
      <section className="py-32 bg-primary text-primary-foreground relative overflow-hidden">
        <img 
          src="https://pixabay.com/get/g756d26909ea8e45897473dd797daabb59f888a199591613ebe1a7deb94a41911f3b7d8624fcb903645303d7fa86e97aa6f0e6241ef6d9e90bc85da81e3cef7c8_1280.jpg"
          alt="Abstract Fabric" 
          className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-soft-light"
        />
        <div className="container max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-medium leading-tight">
            "패션은 일상의 현실에서 살아남기 위한 갑옷이다."
          </h2>
          <p className="mt-6 text-primary-foreground/60 text-lg font-mono">— 빌 커닝햄</p>
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
