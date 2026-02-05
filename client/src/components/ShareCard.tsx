import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Share2, Download, Loader2, CheckCircle2, Sparkles, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareCardProps {
  variant?: "OUTFIT" | "SIT";
  imageUrl?: string; // Optional for SIT (can use generic background if no image)
  personaName?: string; // Used in Outfit mode or as title suffix
  // Outfit specific
  scores?: { harmony: number; trend: number; body: number };
  // SIT specific
  sitType?: string;
  keywords?: string[];
  description?: string;
}

export function ShareCard({
  variant = "OUTFIT",
  imageUrl,
  personaName,
  scores,
  sitType,
  keywords,
  description
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const totalScore = scores
    ? Math.round((scores.harmony + scores.trend + scores.body) / 3 * 10)
    : 0;

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
    link.download = `stylefinder-${variant.toLowerCase()}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    toast({
      title: "다운로드 완료",
      description: "카드 이미지가 저장되었습니다.",
    });
  };

  /** 공유/복사용 짧은 텍스트 (SIT: 유형 문구, OUTFIT: 점수 문구) */
  const getShareableText = (): string => {
    if (variant === "SIT") {
      return `나의 스타일 정체성은 ${sitType}입니다. - StyleFinder AI`;
    }
    return `${personaName}의 스타일 분석 결과! 총점 ${totalScore}점 - StyleFinder AI`;
  };

  const handleCopyText = async () => {
    const text = getShareableText();
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "복사 완료",
        description: "클립보드에 복사되었습니다. 원하는 곳에 붙여넣기 하세요.",
      });
    } catch {
      toast({
        title: "복사 실패",
        description: "클립보드를 사용할 수 없습니다. 저장 버튼으로 이미지를 저장해 보세요.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    const canvas = await generateImage();
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], "stylefinder-result.png", { type: "image/png" });
        const shareTitle = variant === "OUTFIT"
          ? "StyleFinder AI 분석 결과"
          : "StyleFinder SIT 스타일 유형";
        const shareText = variant === "OUTFIT"
          ? `${personaName}의 스타일 분석 결과! 총점 ${totalScore}점`
          : `나의 스타일 정체성은 ${sitType}입니다.`;

        const shareData = {
          title: shareTitle,
          text: shareText,
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
              toast({
                title: "공유 취소",
                description: "저장된 이미지를 앱에서 공유해 보세요.",
                variant: "default",
              });
            }
          }
        } else {
          handleDownload();
          toast({
            title: "공유 안내",
            description: "이 환경에서는 공유가 제한됩니다. 저장 버튼으로 이미지를 저장한 뒤 앱에서 공유해 보세요.",
            variant: "default",
          });
        }
      } else {
        handleDownload();
        toast({
          title: "공유 안내",
          description: "이 환경에서는 공유가 제한됩니다. 저장 버튼으로 이미지를 저장한 뒤 앱에서 공유해 보세요.",
          variant: "default",
        });
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
        <div className="bg-card rounded-xl overflow-hidden min-h-[400px] flex flex-col">
          {/* Header Image Area */}
          <div className="relative aspect-square">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="결과 이미지"
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
                data-testid="img-share-content"
              />
            ) : (
              // Fallback pattern for SIT if no image provided
              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center p-8">
                {variant === "SIT" ? (
                  <div className="text-center">
                    <Sparkles className="w-16 h-16 mx-auto text-primary mb-4 opacity-50" />
                    <div className="text-6xl font-black font-display text-primary tracking-tighter" data-testid="text-sit-type-large">
                      {sitType}
                    </div>
                  </div>
                ) : (
                  <Sparkles className="w-20 h-20 text-muted-foreground/20" />
                )}
              </div>
            )}

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            {/* Overlay Content */}
            <div className="absolute bottom-4 left-4 right-4 text-white">
              {variant === "OUTFIT" && scores && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm opacity-80" data-testid="text-persona-name">{personaName} 평가</div>
                  </div>
                  <div className="text-4xl font-bold font-display" data-testid="text-total-score">{totalScore}점</div>
                </>
              )}
              {variant === "SIT" && (
                <div className="text-center pb-2">
                  <div className="text-sm opacity-80 mb-1">나의 스타일 아이덴티티</div>
                  {!imageUrl && <div className="text-xs opacity-60">StyleFinder AI</div>}
                </div>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 space-y-3 flex-1 bg-card">
            {variant === "OUTFIT" && scores && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground" data-testid="label-harmony">조화</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${scores.harmony * 10}%` }} />
                    </div>
                    <span className="font-bold w-8 text-right">{scores.harmony}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground" data-testid="label-trend">트렌드</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${scores.trend * 10}%` }} />
                    </div>
                    <span className="font-bold w-8 text-right">{scores.trend}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground" data-testid="label-body">체형</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${scores.body * 10}%` }} />
                    </div>
                    <span className="font-bold w-8 text-right">{scores.body}</span>
                  </div>
                </div>
              </>
            )}

            {variant === "SIT" && (
              <div className="space-y-4 text-center py-2">
                {imageUrl && sitType && (
                  <div className="text-4xl font-black font-display text-primary tracking-tight mb-2">
                    {sitType}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 justify-center">
                  {keywords?.slice(0, 3).map((k) => (
                    <span key={k} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full font-medium">
                      #{k}
                    </span>
                  ))}
                </div>

                {description && (
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed px-2">
                    {description}
                  </p>
                )}
              </div>
            )}

            <div className="pt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground border-t mt-auto" data-testid="text-branding">
              <CheckCircle2 className="w-3 h-3" />
              StyleFinder AI
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 max-w-sm mx-auto">
        <Button
          variant="outline"
          className="flex-1 min-w-[80px]"
          onClick={handleDownload}
          disabled={isGenerating}
          data-testid="button-download-card"
          aria-label="카드 이미지 저장"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          저장
        </Button>
        <Button
          className="flex-1 min-w-[80px]"
          onClick={handleShare}
          disabled={isGenerating}
          data-testid="button-share-card"
          aria-label="결과 공유하기"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Share2 className="w-4 h-4 mr-2" />
          )}
          공유하기
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopyText}
          className="shrink-0"
          aria-label="공유용 텍스트 복사"
          data-testid="button-copy-text"
        >
          <Copy className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
