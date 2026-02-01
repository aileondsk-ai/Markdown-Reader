import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSubmitSit } from "@/hooks/use-sit";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, ArrowRight, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { SIT_TYPES, SitTypeCode } from "@/lib/sit-types";

// 12개 질문 - 각 축당 3문항씩
// I/E: 표현 방향, W/C: 스타일 온도, S/N: 변화 성향, M/B: 디테일 관심도
const questions = [
  // I/E 축 (표현 방향) - 3문항
  { id: "q1", axis: "IE", text: "옷을 선택할 때 가장 중요한 것은?", options: [
    { label: "내가 입었을 때 편안하고 만족스러운가", value: "I" },
    { label: "다른 사람들에게 어떻게 보일까", value: "E" }
  ]},
  { id: "q2", axis: "IE", text: "새 옷을 샀을 때 나는?", options: [
    { label: "집에서 혼자 입어보며 즐긴다", value: "I" },
    { label: "빨리 밖에 나가서 보여주고 싶다", value: "E" }
  ]},
  { id: "q3", axis: "IE", text: "패션에서 가장 중요한 것은?", options: [
    { label: "나 자신과의 조화", value: "I" },
    { label: "상황과 분위기에 맞는 인상 관리", value: "E" }
  ]},
  
  // W/C 축 (스타일 온도) - 3문항
  { id: "q4", axis: "WC", text: "나의 전체적인 스타일 분위기는?", options: [
    { label: "부드럽고 친근한 느낌", value: "W" },
    { label: "날카롭고 세련된 느낌", value: "C" }
  ]},
  { id: "q5", axis: "WC", text: "선호하는 컬러 톤은?", options: [
    { label: "베이지, 아이보리, 따뜻한 색감", value: "W" },
    { label: "블랙, 그레이, 차가운 색감", value: "C" }
  ]},
  { id: "q6", axis: "WC", text: "선호하는 옷의 실루엣은?", options: [
    { label: "라운드하고 부드러운 라인", value: "W" },
    { label: "직선적이고 구조적인 라인", value: "C" }
  ]},
  
  // S/N 축 (변화 성향) - 3문항
  { id: "q7", axis: "SN", text: "옷장에서 가장 많은 비중을 차지하는 것은?", options: [
    { label: "오래 입은 검증된 아이템들", value: "S" },
    { label: "최근에 새로 산 다양한 아이템들", value: "N" }
  ]},
  { id: "q8", axis: "SN", text: "트렌드에 대한 나의 태도는?", options: [
    { label: "클래식이 최고, 유행은 참고만 한다", value: "S" },
    { label: "새로운 트렌드를 적극적으로 시도한다", value: "N" }
  ]},
  { id: "q9", axis: "SN", text: "쇼핑할 때 나는?", options: [
    { label: "늘 비슷한 스타일의 옷을 고른다", value: "S" },
    { label: "이전에 없던 새로운 스타일에 도전한다", value: "N" }
  ]},
  
  // M/B 축 (디테일 관심도) - 3문항
  { id: "q10", axis: "MB", text: "액세서리에 대한 나의 생각은?", options: [
    { label: "없거나 최소한으로, 심플하게", value: "M" },
    { label: "포인트 아이템으로 적극 활용", value: "B" }
  ]},
  { id: "q11", axis: "MB", text: "옷을 코디할 때 나는?", options: [
    { label: "컬러와 아이템 수를 최소화한다", value: "M" },
    { label: "레이어링과 다양한 요소를 활용한다", value: "B" }
  ]},
  { id: "q12", axis: "MB", text: "이상적인 코디 스타일은?", options: [
    { label: "깔끔하고 군더더기 없는 룩", value: "M" },
    { label: "눈에 띄는 포인트가 있는 룩", value: "B" }
  ]},
];

// 점수 및 유형 계산 함수
function calculateSitResult(answers: Record<string, string>): {
  sitType: SitTypeCode;
  scores: { IE: number; WC: number; SN: number; MB: number };
} {
  // 기본 점수 50 (중간값)
  const scores = {
    IE: 50,
    WC: 50,
    SN: 50,
    MB: 50,
  };
  
  Object.entries(answers).forEach(([qId, answer]) => {
    const question = questions.find(q => q.id === qId);
    if (!question) return;
    
    const axis = question.axis;
    // 각 질문당 약 17점씩 변동 (3문항 * 17 ≈ 50)
    if (axis === "IE") {
      scores.IE += answer === "E" ? 17 : -17;
    } else if (axis === "WC") {
      scores.WC += answer === "C" ? 17 : -17;
    } else if (axis === "SN") {
      scores.SN += answer === "N" ? 17 : -17;
    } else if (axis === "MB") {
      scores.MB += answer === "B" ? 17 : -17;
    }
  });
  
  // 0-100 범위로 클램핑
  scores.IE = Math.max(0, Math.min(100, scores.IE));
  scores.WC = Math.max(0, Math.min(100, scores.WC));
  scores.SN = Math.max(0, Math.min(100, scores.SN));
  scores.MB = Math.max(0, Math.min(100, scores.MB));
  
  // 50 이상이면 두 번째 문자 (E, C, N, B)
  const sitCode = 
    (scores.IE >= 50 ? "E" : "I") +
    (scores.WC >= 50 ? "C" : "W") +
    (scores.SN >= 50 ? "N" : "S") +
    (scores.MB >= 50 ? "B" : "M");
  
  return {
    sitType: sitCode as SitTypeCode,
    scores,
  };
}

export default function Test() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const { mutate: submitTest, isPending, isSuccess, data: result } = useSubmitSit();
  const { toast } = useToast();

  const onOptionClick = (value: string) => {
    const newAnswers = { ...answers, [questions[currentStep].id]: value };
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 250);
    } else {
      // 모든 질문 완료 - 점수 계산 후 제출
      const { sitType, scores } = calculateSitResult(newAnswers);
      submitTest({ answers: newAnswers, calculatedType: sitType, scores }, {
        onError: (err) => {
          toast({
            title: "테스트 제출 오류",
            description: err.message,
            variant: "destructive",
          });
        }
      });
    }
  };

  if (isSuccess && result) {
    const typeInfo = SIT_TYPES[result.sitType as SitTypeCode];
    
    return (
      <div className="container max-w-2xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8"
        >
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          
          <h1 className="text-4xl font-display font-bold">당신의 스타일 정체성은 <span className="text-primary">{result.sitType}</span></h1>
          
          <Card className="p-8 bg-card shadow-xl border-t-4 border-t-primary mt-8">
            <h3 className="text-2xl font-bold mb-4 font-display">{typeInfo?.nickname || result.typeDescription}</h3>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {(typeInfo?.keywords || result.keywords)?.map((k: string) => (
                <span key={k} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">
                  {k}
                </span>
              ))}
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {typeInfo?.description || "당신의 답변을 분석한 결과, 구조와 창의성의 균형을 추구하는 스타일입니다. 타임리스한 아이템과 대담한 포인트를 조화롭게 활용합니다."}
            </p>
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>대표 스타일:</strong> {typeInfo?.style}
              </p>
            </div>
          </Card>

          <div className="flex gap-4 justify-center pt-8">
            <Link href="/profile">
              <Button size="lg" variant="outline" data-testid="button-view-profile">프로필 보기</Button>
            </Link>
            <Link href="/evaluate">
              <Button size="lg" className="shadow-lg shadow-primary/25" data-testid="button-start-evaluation">
                AI 평가 시작하기 <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const progress = ((currentStep + 1) / questions.length) * 100;
  const currentQ = questions[currentStep];

  return (
    <div className="container max-w-xl mx-auto px-4 py-20 md:py-32">
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground font-medium">
            <span>질문 {currentStep + 1} / {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          {isPending ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 text-center space-y-4"
            >
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
              <h2 className="text-xl font-medium">당신의 스타일 DNA를 분석 중...</h2>
            </motion.div>
          ) : (
            <motion.div
              key={currentQ.id}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <h2 className="text-3xl font-display font-medium text-center leading-tight">
                {currentQ.text}
              </h2>

              <div className="grid gap-4">
                {currentQ.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onOptionClick(option.value)}
                    className="w-full p-6 text-left rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all duration-200 group"
                    data-testid={`option-${option.value}`}
                  >
                    <span className="text-lg font-medium group-hover:text-primary transition-colors">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
