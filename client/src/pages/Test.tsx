import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSubmitSit } from "@/hooks/use-sit";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, ArrowRight, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

// Mock questions - in a real app these might come from an API or a larger config file
const questions = [
  { id: "q1", axis: "I", text: "On a weekend, you prefer to:", options: [{ label: "Explore a crowded new exhibition", value: "E" }, { label: "Read a book at a quiet cafe", value: "I" }] },
  { id: "q2", axis: "S", text: "When shopping, you look for:", options: [{ label: "Unique, conceptual pieces", value: "N" }, { label: "High-quality, practical basics", value: "S" }] },
  { id: "q3", axis: "T", text: "Your outfit decisions are based on:", options: [{ label: "Logic and functionality", value: "T" }, { label: "Mood and feeling", value: "F" }] },
  { id: "q4", axis: "J", text: "Your wardrobe is:", options: [{ label: "Organized by color and season", value: "J" }, { label: "A chaotic mix of treasures", value: "P" }] },
  { id: "q5", axis: "I", text: "At a party, you are usually:", options: [{ label: "Center of attention", value: "E" }, { label: "Having deep talks in a corner", value: "I" }] },
  { id: "q6", axis: "S", text: "You prefer fabrics that feel:", options: [{ label: "Structured and reliable", value: "S" }, { label: "Flowy and unexpected", value: "N" }] },
  { id: "q7", axis: "T", text: "Critique on your style makes you:", options: [{ label: "Analyze it objectively", value: "T" }, { label: "Feel personally hurt", value: "F" }] },
  { id: "q8", axis: "J", text: "Packing for a trip, you:", options: [{ label: "Throw things in last minute", value: "P" }, { label: "Have a checklist ready", value: "J" }] },
];

export default function Test() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const { mutate: submitTest, isPending, isSuccess, data: result } = useSubmitSit();
  const { toast } = useToast();

  const handleAnswer = (value: string) => {
    const q = questions[currentStep];
    setAnswers(prev => ({ ...prev, [q.id]: value }));
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Finished
      submit();
    }
  };

  const submit = () => {
    // Merge the last answer in properly before submitting
    // (State update batching means 'answers' might not have the very last one yet if we just called setAnswers)
    // Actually, let's just trigger submit in a useEffect or ensure we have all data.
    // For simplicity here, we'll pass the full object constructed manually.
    // NOTE: The handleAnswer logic above sets state, which is async. 
    // Better to wait for user to click "Submit" on last step OR auto-submit carefully.
    // Let's modify handleAnswer to handle the final submission with the correct data.
  };

  const onOptionClick = (value: string) => {
    const newAnswers = { ...answers, [questions[currentStep].id]: value };
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 250); // Small delay for visual feedback
    } else {
      submitTest({ answers: newAnswers }, {
        onError: (err) => {
          toast({
            title: "Error submitting test",
            description: err.message,
            variant: "destructive",
          });
        }
      });
    }
  };

  if (isSuccess && result) {
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
          
          <h1 className="text-4xl font-display font-bold">Your Style Identity is <span className="text-primary">{result.sitType}</span></h1>
          
          <Card className="p-8 bg-card shadow-xl border-t-4 border-t-primary mt-8">
            <h3 className="text-2xl font-bold mb-4 font-display">The {result.typeDescription}</h3>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {result.keywords?.map((k: string) => (
                <span key={k} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">
                  {k}
                </span>
              ))}
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Based on your answers, you favor a style that balances structure with creativity. 
              Your wardrobe likely consists of timeless pieces mixed with bold statements.
            </p>
          </Card>

          <div className="flex gap-4 justify-center pt-8">
            <Link href="/profile">
              <Button size="lg" variant="outline">View Profile</Button>
            </Link>
            <Link href="/evaluate">
              <Button size="lg" className="shadow-lg shadow-primary/25">
                Start AI Evaluation <ArrowRight className="ml-2 w-4 h-4" />
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
            <span>Question {currentStep + 1} of {questions.length}</span>
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
              <h2 className="text-xl font-medium">Analyzing your style DNA...</h2>
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
