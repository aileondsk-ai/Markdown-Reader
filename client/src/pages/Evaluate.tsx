import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import { useCreateAssessment, useCreateBatchAssessment } from "@/hooks/use-assessments";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud, Sparkles, X, CheckCircle2, ImagePlus, ChevronLeft, ChevronRight } from "lucide-react";
import { RadarChart } from "@/components/RadarChart";
import { ShareCard } from "@/components/ShareCard";
import { motion, AnimatePresence } from "framer-motion";

const PERSONAS = [
  { id: "sujin", name: "패션 에디터 수진", role: "매거진 에디터", desc: "트렌드 적합성과 전체 조화를 전문적으로 평가합니다." },
  { id: "minsu", name: "포토그래퍼 민수", role: "스트리트 사진작가", desc: "개성과 분위기, 진정성에 초점을 맞춥니다." },
  { id: "jihyun", name: "스타일리스트 지현", role: "연예인 스타일리스트", desc: "체형 보완과 컬러 매칭을 세심하게 분석합니다." },
];

const MAX_IMAGES = 10;

interface ProcessedImage {
  file: File;
  preview: string;
  originalSize: number;
  compressedSize: number;
}

interface BatchResult {
  individual: Array<{
    id: number;
    imageUrl: string;
    persona: string;
    scores: { harmony: number; trend: number; body: number };
    feedback: string;
  }>;
  summary: {
    overallScores: { harmony: number; trend: number; body: number };
    overallFeedback: string;
  };
}

export default function Evaluate() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [persona, setPersona] = useState<"sujin" | "minsu" | "jihyun">("sujin");
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const { mutate: analyzeSingle, isPending: isSinglePending, data: singleResult } = useCreateAssessment();
  const { mutate: analyzeBatch, isPending: isBatchPending, data: batchResult } = useCreateBatchAssessment();
  const { toast } = useToast();

  const isPending = isSinglePending || isBatchPending;
  const result = images.length === 1 ? singleResult : null;
  const multiResult = images.length > 1 ? batchResult as BatchResult | undefined : undefined;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const checkImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("이미지 로드 실패"));
      };
      img.src = objectUrl;
    });
  };

  const processImage = async (file: File): Promise<ProcessedImage | null> => {
    const originalSize = file.size;

    try {
      const dimensions = await checkImageDimensions(file);
      const maxDimension = Math.max(dimensions.width, dimensions.height);
      
      if (maxDimension < 1280) {
        toast({
          title: "이미지 품질 안내",
          description: `${file.name}: 해상도가 낮아 분석 정확도가 떨어질 수 있습니다.`,
          variant: "default",
        });
      }

      const needsCompression = originalSize > 2 * 1024 * 1024 || maxDimension > 1920;
      let processedFile = file;

      if (needsCompression) {
        const options = {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/jpeg" as const,
          initialQuality: 0.85,
          preserveExif: true,
        };

        try {
          processedFile = await imageCompression(file, options);
        } catch {
          processedFile = file;
        }
      }

      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(processedFile);
      });

      return {
        file: processedFile,
        preview,
        originalSize,
        compressedSize: processedFile.size,
      };
    } catch {
      return null;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const remainingSlots = MAX_IMAGES - images.length;
    const filesToProcess = acceptedFiles.slice(0, remainingSlots);

    if (acceptedFiles.length > remainingSlots) {
      toast({
        title: "이미지 수 제한",
        description: `최대 ${MAX_IMAGES}장까지 업로드 가능합니다. ${filesToProcess.length}장만 추가됩니다.`,
        variant: "default",
      });
    }

    setIsCompressing(true);
    setCompressionProgress(0);

    const newImages: ProcessedImage[] = [];
    for (let i = 0; i < filesToProcess.length; i++) {
      const processed = await processImage(filesToProcess[i]);
      if (processed) {
        newImages.push(processed);
      }
      setCompressionProgress(Math.round(((i + 1) / filesToProcess.length) * 100));
    }

    setImages((prev) => [...prev, ...newImages]);
    setIsCompressing(false);
    setCompressionProgress(0);
  }, [images.length, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: MAX_IMAGES,
    disabled: images.length >= MAX_IMAGES,
  });

  const handleAnalyze = () => {
    if (images.length === 0) return;
    
    if (images.length === 1) {
      analyzeSingle({
        image: images[0].preview,
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
    } else {
      analyzeBatch({
        images: images.map(img => img.preview),
        persona,
      }, {
        onError: (err) => {
          toast({
            title: "다중 분석 실패",
            description: err.message,
            variant: "destructive",
          });
        }
      });
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (currentImageIndex >= index && currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1);
    }
  };

  const clearAllImages = () => {
    setImages([]);
    setCurrentImageIndex(0);
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
            
            <div className="border-t pt-6 mt-6">
              <h3 className="font-bold mb-4 text-center">결과 공유하기</h3>
              <ShareCard 
                imageUrl={result.imageUrl}
                personaName={PERSONAS.find(p => p.id === result.persona)?.name || ""}
                scores={result.scores as { harmony: number; trend: number; body: number }}
              />
            </div>

            <Button onClick={() => window.location.reload()} variant="outline" className="w-full" data-testid="button-analyze-another">
              다른 착장 분석하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (multiResult) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold font-display mb-2">다중 착장 분석 결과</h1>
          <p className="text-muted-foreground">{multiResult.individual.length}장의 착장을 분석했습니다</p>
        </div>

        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl p-8 mb-8 border">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl">
              {PERSONAS.find(p => p.id === persona)?.name[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold font-display">{PERSONAS.find(p => p.id === persona)?.name}</h2>
              <p className="text-muted-foreground">종합 분석</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card/80 backdrop-blur rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold mb-4">평균 스타일 점수</h3>
              <RadarChart data={multiResult.summary.overallScores} />
            </div>
            <div className="bg-card/80 backdrop-blur rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold mb-4">종합 피드백</h3>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {multiResult.summary.overallFeedback.split('\n').map((line, i) => (
                  <p key={i} className="mb-2 leading-relaxed text-sm">{line}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        <h3 className="font-bold text-xl mb-4 font-display">개별 착장 분석</h3>
        <div className="grid gap-6">
          {multiResult.individual.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              data-testid={`card-result-${index}`}
            >
              <Card className="overflow-hidden">
                <div className="grid md:grid-cols-[200px_1fr] gap-6 p-6">
                  <div className="relative rounded-xl overflow-hidden">
                    <img src={item.imageUrl} alt={`착장 ${index + 1}`} className="w-full h-48 md:h-full object-cover" data-testid={`img-result-${index}`} />
                    <Badge className="absolute top-2 left-2" data-testid={`badge-index-${index}`}>#{index + 1}</Badge>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span data-testid={`score-harmony-${index}`}>조화: {item.scores.harmony}/10</span>
                      <span data-testid={`score-trend-${index}`}>트렌드: {item.scores.trend}/10</span>
                      <span data-testid={`score-body-${index}`}>체형: {item.scores.body}/10</span>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none" data-testid={`text-feedback-${index}`}>
                      {item.feedback.split('\n').slice(0, 3).map((line, i) => (
                        <p key={i} className="mb-1 text-sm">{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {multiResult.individual.length > 0 && (
          <div className="mt-8 border-t pt-8">
            <h3 className="font-bold text-xl mb-4 font-display text-center">대표 결과 공유하기</h3>
            <ShareCard 
              imageUrl={multiResult.individual[0].imageUrl}
              personaName={PERSONAS.find(p => p.id === persona)?.name || ""}
              scores={multiResult.individual[0].scores}
            />
          </div>
        )}

        <div className="mt-8 text-center">
          <Button onClick={() => window.location.reload()} variant="outline" size="lg" data-testid="button-analyze-another">
            다른 착장 분석하기
          </Button>
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
          <br />
          <span className="text-sm">최대 {MAX_IMAGES}장까지 한 번에 분석 가능합니다.</span>
        </p>
      </div>

      <div className="grid gap-8">
        <div className="bg-card rounded-2xl p-2 border shadow-sm">
          <Tabs value={persona} onValueChange={(v) => setPersona(v as "sujin" | "minsu" | "jihyun")} className="w-full">
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

        <div className="w-full">
          {isCompressing ? (
            <div className="border-2 border-dashed rounded-3xl p-12 text-center border-primary/50 bg-primary/5">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h3 className="text-xl font-bold mb-4">이미지 최적화 중...</h3>
              <Progress value={compressionProgress} className="max-w-xs mx-auto mb-2" />
              <p className="text-muted-foreground">{compressionProgress}%</p>
            </div>
          ) : images.length === 0 ? (
            <div 
              {...getRootProps()} 
              className={`
                border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300
                ${isDragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-muted/30'}
              `}
              data-testid="dropzone-upload"
            >
              <input {...getInputProps()} data-testid="input-file-upload" />
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <UploadCloud className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">드래그 앤 드롭 또는 클릭하여 업로드</h3>
              <p className="text-muted-foreground">JPG, PNG, HEIC 지원 (최대 {MAX_IMAGES}장, 고해상도 자동 최적화)</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black/5">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    src={images[currentImageIndex].preview}
                    alt={`미리보기 ${currentImageIndex + 1}`}
                    className="w-full h-96 object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                </AnimatePresence>
                
                {images.length > 1 && (
                  <>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
                      data-testid="button-prev-image"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
                      data-testid="button-next-image"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm" data-testid="text-image-counter">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}

                <div className="absolute top-4 right-4 flex gap-2">
                  <Button 
                    size="icon" 
                    variant="destructive" 
                    onClick={() => removeImage(currentImageIndex)}
                    className="rounded-full shadow-lg"
                    data-testid="button-remove-image"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {images[currentImageIndex].originalSize !== images[currentImageIndex].compressedSize && (
                  <div className="absolute top-4 left-4 bg-green-500/90 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {formatFileSize(images[currentImageIndex].originalSize)} → {formatFileSize(images[currentImageIndex].compressedSize)}
                  </div>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      index === currentImageIndex ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                    data-testid={`thumb-image-${index}`}
                  >
                    <img src={img.preview} alt={`썸네일 ${index + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 right-0 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-tl">
                      {index + 1}
                    </span>
                  </button>
                ))}
                
                {images.length < MAX_IMAGES && (
                  <div
                    {...getRootProps()}
                    className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
                    data-testid="button-add-more-images"
                  >
                    <input {...getInputProps()} data-testid="input-add-more" />
                    <ImagePlus className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={clearAllImages}
                  className="flex-1"
                  data-testid="button-clear-all"
                >
                  모두 삭제
                </Button>
                <Button 
                  size="lg" 
                  onClick={handleAnalyze} 
                  disabled={isPending}
                  className="flex-[2] h-14 rounded-xl text-lg font-bold shadow-xl shadow-primary/20"
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
                      {images.length === 1 ? '착장 분석하기' : `${images.length}장 한 번에 분석하기`}
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
