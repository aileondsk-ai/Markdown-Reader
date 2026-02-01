import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Share2, Download, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareCardProps {
  imageUrl: string;
  personaName: string;
  scores: { harmony: number; trend: number; body: number };
  sitType?: string;
}

export function ShareCard({ imageUrl, personaName, scores, sitType }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const totalScore = Math.round((scores.harmony + scores.trend + scores.body) / 3 * 10);

  const generateImage = async (): Promise<HTMLCanvasElement | null> => {
    if (!cardRef.current) return null;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });
      return canvas;
    } catch (error) {
      console.error("이미지 생성 오류:", error);
      toast({
        title: "이미지 생성 실패",
        description: "카드 이미지를 생성하는 중 문제가 발생했습니다.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    const canvas = await generateImage();
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `stylefinder-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    toast({
      title: "다운로드 완료",
      description: "카드 이미지가 저장되었습니다.",
    });
  };

  const handleShare = async () => {
    const canvas = await generateImage();
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], "stylefinder-result.png", { type: "image/png" });
        const shareData = {
          title: "StyleFinder AI 분석 결과",
          text: `${personaName}의 스타일 분석 결과! 총점 ${totalScore}점`,
          files: [file],
        };

        if (navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
            toast({
              title: "공유 완료",
              description: "결과를 공유했습니다.",
            });
          } catch (err: any) {
            if (err.name !== "AbortError") {
              handleDownload();
            }
          }
        } else {
          handleDownload();
        }
      } else {
        handleDownload();
      }
    }, "image/png");
  };

  return (
    <div className="space-y-4">
      <div 
        ref={cardRef}
        className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-primary/90 to-accent/90 p-1"
        data-testid="card-share"
      >
        <div className="bg-card rounded-xl overflow-hidden">
          <div className="relative aspect-square">
            <img 
              src={imageUrl} 
              alt="분석된 착장" 
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
              data-testid="img-share-outfit"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm opacity-80" data-testid="text-persona-name">{personaName} 평가</div>
                {sitType && (
                  <div className="bg-primary/80 px-2 py-0.5 rounded-full text-xs font-bold" data-testid="text-sit-type">
                    {sitType}
                  </div>
                )}
              </div>
              <div className="text-4xl font-bold font-display" data-testid="text-total-score">{totalScore}점</div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground" data-testid="label-harmony">조화</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden" data-testid="bar-harmony">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${scores.harmony * 10}%` }}
                  />
                </div>
                <span className="font-bold w-8 text-right" data-testid="score-harmony">{scores.harmony}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground" data-testid="label-trend">트렌드</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden" data-testid="bar-trend">
                  <div 
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${scores.trend * 10}%` }}
                  />
                </div>
                <span className="font-bold w-8 text-right" data-testid="score-trend">{scores.trend}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground" data-testid="label-body">체형</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden" data-testid="bar-body">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${scores.body * 10}%` }}
                  />
                </div>
                <span className="font-bold w-8 text-right" data-testid="score-body">{scores.body}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground border-t" data-testid="text-branding">
              <CheckCircle2 className="w-3 h-3" />
              StyleFinder AI
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 max-w-sm mx-auto">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={handleDownload}
          disabled={isGenerating}
          data-testid="button-download-card"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          저장
        </Button>
        <Button 
          className="flex-1"
          onClick={handleShare}
          disabled={isGenerating}
          data-testid="button-share-card"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Share2 className="w-4 h-4 mr-2" />
          )}
          공유하기
        </Button>
      </div>
    </div>
  );
}
