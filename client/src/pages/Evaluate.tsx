import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useCreateAssessment } from "@/hooks/use-assessments";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud, Sparkles, Image as ImageIcon, X } from "lucide-react";
import { RadarChart } from "@/components/RadarChart";
import { motion } from "framer-motion";

const PERSONAS = [
  { id: "sujin", name: "패션 에디터 수진", role: "매거진 에디터", desc: "트렌드 적합성과 전체 조화를 전문적으로 평가합니다." },
  { id: "minsu", name: "포토그래퍼 민수", role: "스트리트 사진작가", desc: "개성과 분위기, 진정성에 초점을 맞춥니다." },
  { id: "jihyun", name: "스타일리스트 지현", role: "연예인 스타일리스트", desc: "체형 보완과 컬러 매칭을 세심하게 분석합니다." },
];

export default function Evaluate() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [persona, setPersona] = useState("sujin");
  
  const { mutate: analyze, isPending, data: result } = useCreateAssessment();
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  const handleAnalyze = () => {
    if (!preview) return;
    
    analyze({
      image: preview,
      persona,
    }, {
      onError: (err) => {
        toast({
          title: "분석 실패",
          description: err.message,
          variant: "destructive",
        });
      }
    });
  };

  const clearImage = () => {
    setFile(null);
    setPreview(null);
  };

  if (result) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <Card className="overflow-hidden rounded-2xl border-0 shadow-xl">
              <img src={result.imageUrl} alt="분석된 착장" className="w-full h-auto object-cover" />
            </Card>
            <div className="bg-card p-6 rounded-2xl border shadow-sm">
              <h3 className="font-bold mb-4 font-display text-lg">스타일 점수</h3>
              <RadarChart data={result.scores as Record<string, number>} />
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                {PERSONAS.find(p => p.id === result.persona)?.name[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold font-display">{PERSONAS.find(p => p.id === result.persona)?.name}</h2>
                <p className="text-muted-foreground text-sm">분석 결과</p>
              </div>
            </div>
            
            <Card className="p-8 shadow-lg border-primary/10 bg-gradient-to-br from-card to-muted/20">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {result.feedback.split('\n').map((line, i) => (
                  <p key={i} className="mb-2 leading-relaxed">{line}</p>
                ))}
              </div>
            </Card>
            
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full" data-testid="button-analyze-another">
              다른 착장 분석하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12 md:py-20">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-display font-bold">AI 패션 평가</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          착장 사진을 업로드하고 AI 패션 페르소나로부터 전문적인 피드백을 받아보세요.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Persona Selection */}
        <div className="bg-card rounded-2xl p-2 border shadow-sm">
          <Tabs value={persona} onValueChange={setPersona} className="w-full">
            <TabsList className="w-full h-auto p-1 bg-muted/50 rounded-xl grid grid-cols-3 gap-2">
              {PERSONAS.map(p => (
                <TabsTrigger 
                  key={p.id} 
                  value={p.id}
                  className="py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                  data-testid={`tab-persona-${p.id}`}
                >
                  <div className="text-center">
                    <div className="font-bold">{p.name}</div>
                    <div className="text-xs opacity-70 hidden sm:block">{p.role}</div>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="mt-4 px-2 text-center text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 inline mr-2 text-accent" />
              {PERSONAS.find(p => p.id === persona)?.desc}
            </div>
          </Tabs>
        </div>

        {/* Upload Area */}
        <div className="w-full">
          {!preview ? (
            <div 
              {...getRootProps()} 
              className={`
                border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300
                ${isDragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-muted/30'}
              `}
              data-testid="dropzone-upload"
            >
              <input {...getInputProps()} />
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <UploadCloud className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">드래그 앤 드롭 또는 클릭하여 업로드</h3>
              <p className="text-muted-foreground">JPG, PNG 지원 (최대 5MB)</p>
            </div>
          ) : (
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black/5 group">
              <img src={preview} alt="미리보기" className="w-full h-96 object-cover" />
              <div className="absolute top-4 right-4">
                <Button 
                  size="icon" 
                  variant="destructive" 
                  onClick={(e) => { e.stopPropagation(); clearImage(); }}
                  className="rounded-full shadow-lg"
                  data-testid="button-clear-image"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center pb-8 pt-20">
                 <Button 
                  size="lg" 
                  onClick={handleAnalyze} 
                  disabled={isPending}
                  className="h-14 px-10 rounded-full text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                  data-testid="button-analyze"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      착장 분석하기
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
