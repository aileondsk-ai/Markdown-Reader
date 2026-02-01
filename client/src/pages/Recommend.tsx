import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Loader2, Sun, Cloud, Snowflake, Flower2, 
  Heart, Sparkles, Briefcase, Coffee, Users,
  PartyPopper, ShoppingBag, Shirt, ChevronRight
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { Recommendation, SitResult } from "@shared/schema";

const SEASONS = [
  { id: 'spring', name: '봄', icon: Flower2, color: 'text-pink-500' },
  { id: 'summer', name: '여름', icon: Sun, color: 'text-yellow-500' },
  { id: 'fall', name: '가을', icon: Cloud, color: 'text-orange-500' },
  { id: 'winter', name: '겨울', icon: Snowflake, color: 'text-blue-500' },
];

const OCCASION_CATEGORIES = [
  {
    name: '첫 만남',
    icon: Users,
    occasions: [
      { id: 'first_interview', name: '면접' },
      { id: 'first_blind_date', name: '소개팅' },
    ],
  },
  {
    name: '데이트',
    icon: Heart,
    occasions: [
      { id: 'date_casual', name: '캐주얼' },
      { id: 'date_special', name: '특별한 날' },
    ],
  },
  {
    name: '비즈니스',
    icon: Briefcase,
    occasions: [
      { id: 'business_work', name: '출근' },
      { id: 'business_meeting', name: '미팅' },
      { id: 'business_dinner', name: '회식' },
    ],
  },
  {
    name: '일상',
    icon: Coffee,
    occasions: [
      { id: 'daily_home', name: '재택' },
      { id: 'daily_cafe', name: '카페' },
      { id: 'daily_travel', name: '여행' },
    ],
  },
  {
    name: '특별 이벤트',
    icon: PartyPopper,
    occasions: [
      { id: 'event_wedding', name: '결혼식' },
      { id: 'event_party', name: '파티' },
      { id: 'event_reunion', name: '동창회' },
    ],
  },
];

type OutfitItem = {
  item: string;
  color: string;
  reason: string;
};

type OutfitSet = {
  top: OutfitItem;
  bottom: OutfitItem;
  shoes: OutfitItem;
  accessory: OutfitItem;
};

type Alternative = {
  name: string;
  description: string;
};

function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

export default function Recommend() {
  const { toast } = useToast();
  const [selectedSeason, setSelectedSeason] = useState(getCurrentSeason());
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { data: recommendations = [], isLoading: recsLoading } = useQuery<Recommendation[]>({
    queryKey: ['/api/recommendations'],
  });

  const { data: sitResult } = useQuery<SitResult | null>({
    queryKey: ['/api/sit/latest'],
  });

  const generateRecommendation = useMutation({
    mutationFn: async (data: { occasion: string; season: string }) => {
      const response = await apiRequest('POST', '/api/recommendations', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
      setSelectedRec(data);
      toast({
        title: "추천 완료",
        description: "코디 추천이 생성되었습니다",
      });
    },
    onError: () => {
      toast({
        title: "오류",
        description: "추천을 생성할 수 없습니다",
        variant: "destructive",
      });
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PATCH', `/api/recommendations/${id}/favorite`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
      if (selectedRec?.id === data.id) {
        setSelectedRec(data);
      }
    },
  });

  const handleGenerateRecommendation = () => {
    if (!selectedOccasion) {
      toast({
        title: "상황을 선택해주세요",
        description: "추천을 받으려면 상황을 선택해야 합니다",
        variant: "destructive",
      });
      return;
    }
    generateRecommendation.mutate({
      occasion: selectedOccasion,
      season: selectedSeason,
    });
  };

  const getOccasionName = (occasionId: string): string => {
    for (const cat of OCCASION_CATEGORIES) {
      const occ = cat.occasions.find(o => o.id === occasionId);
      if (occ) return occ.name;
    }
    return occasionId;
  };

  const favoriteRecs = recommendations.filter(r => r.isFavorite);

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">코디 추천</h1>
          <p className="text-muted-foreground">TPO에 맞는 스타일을 추천받으세요</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowHistory(!showHistory)}
          data-testid="button-toggle-history"
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          {showHistory ? '새 추천' : '저장된 추천'}
        </Button>
      </div>

      {sitResult && (
        <Card className="mb-6">
          <CardContent className="py-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">당신의 스타일 유형</p>
              <p className="font-bold text-lg">{sitResult?.sitType}</p>
            </div>
            <Badge variant="secondary" className="ml-auto">SIT 기반 추천 활성화</Badge>
          </CardContent>
        </Card>
      )}

      {showHistory ? (
        <div className="space-y-6">
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all" data-testid="tab-all">전체</TabsTrigger>
              <TabsTrigger value="favorites" data-testid="tab-favorites">
                즐겨찾기 ({favoriteRecs.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              {recsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : recommendations.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">저장된 추천이 없습니다</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setShowHistory(false)}
                      data-testid="button-go-to-recommend"
                    >
                      추천 받기
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {recommendations.map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      recommendation={rec}
                      onClick={() => setSelectedRec(rec)}
                      onToggleFavorite={() => toggleFavorite.mutate(rec.id)}
                      getOccasionName={getOccasionName}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="favorites" className="mt-4">
              {favoriteRecs.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">즐겨찾기한 추천이 없습니다</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {favoriteRecs.map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      recommendation={rec}
                      onClick={() => setSelectedRec(rec)}
                      onToggleFavorite={() => toggleFavorite.mutate(rec.id)}
                      getOccasionName={getOccasionName}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>계절 선택</CardTitle>
                <CardDescription>현재 날짜 기준으로 자동 감지됩니다</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3">
                  {SEASONS.map((season) => {
                    const Icon = season.icon;
                    const isSelected = selectedSeason === season.id;
                    return (
                      <Button
                        key={season.id}
                        variant={isSelected ? "default" : "outline"}
                        className="h-auto py-4 flex-col gap-2"
                        onClick={() => setSelectedSeason(season.id)}
                        data-testid={`button-season-${season.id}`}
                      >
                        <Icon className={`w-6 h-6 ${isSelected ? '' : season.color}`} />
                        <span>{season.name}</span>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>상황 선택</CardTitle>
                <CardDescription>어떤 상황에서 입을 옷인가요?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {OCCASION_CATEGORIES.map((category) => {
                  const CategoryIcon = category.icon;
                  return (
                    <div key={category.name}>
                      <div className="flex items-center gap-2 mb-2">
                        <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {category.occasions.map((occ) => (
                          <Badge
                            key={occ.id}
                            variant={selectedOccasion === occ.id ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => setSelectedOccasion(occ.id)}
                            data-testid={`badge-occasion-${occ.id}`}
                          >
                            {occ.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!selectedOccasion || generateRecommendation.isPending}
                  onClick={handleGenerateRecommendation}
                  data-testid="button-generate-recommendation"
                >
                  {generateRecommendation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      추천 생성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      코디 추천 받기
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">최근 추천</CardTitle>
              </CardHeader>
              <CardContent>
                {recsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : recommendations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    아직 추천 기록이 없습니다
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recommendations.slice(0, 5).map((rec) => (
                      <div
                        key={rec.id}
                        className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover-elevate"
                        onClick={() => setSelectedRec(rec)}
                        data-testid={`recent-rec-${rec.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{getOccasionName(rec.occasion)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(rec.createdAt!), 'MM.dd', { locale: ko })}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Dialog open={!!selectedRec} onOpenChange={() => setSelectedRec(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRec && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl">
                    {getOccasionName(selectedRec.occasion)} 코디
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFavorite.mutate(selectedRec.id)}
                    data-testid="button-toggle-favorite"
                  >
                    <Heart className={`w-5 h-5 ${selectedRec.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                </div>
                <DialogDescription>
                  {SEASONS.find(s => s.id === selectedRec.season)?.name} | 
                  {selectedRec.sitType && ` ${selectedRec.sitType} 기반`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {(['top', 'bottom', 'shoes', 'accessory'] as const).map((key) => {
                    const outfit = (selectedRec.outfitSet as OutfitSet)?.[key];
                    if (!outfit) return null;
                    const labels = { top: '상의', bottom: '하의', shoes: '신발', accessory: '액세서리' };
                    return (
                      <Card key={key}>
                        <CardContent className="pt-4">
                          <Badge variant="outline" className="mb-2">{labels[key]}</Badge>
                          <h4 className="font-bold">{outfit.item}</h4>
                          <p className="text-sm text-muted-foreground">색상: {outfit.color}</p>
                          <p className="text-sm mt-2">{outfit.reason}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">스타일링 컨셉</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{selectedRec.reasoning}</p>
                  </CardContent>
                </Card>

                {Array.isArray(selectedRec.alternatives) && selectedRec.alternatives.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">대안 스타일</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(selectedRec.alternatives as Alternative[]).map((alt: Alternative, i: number) => (
                        <div key={i} className="p-3 rounded-lg bg-muted">
                          <p className="font-medium">{alt.name}</p>
                          <p className="text-sm text-muted-foreground">{alt.description}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RecommendationCard({
  recommendation,
  onClick,
  onToggleFavorite,
  getOccasionName,
}: {
  recommendation: Recommendation;
  onClick: () => void;
  onToggleFavorite: () => void;
  getOccasionName: (id: string) => string;
}) {
  const seasonInfo = SEASONS.find(s => s.id === recommendation.season);
  const SeasonIcon = seasonInfo?.icon || Sun;

  return (
    <Card 
      className="cursor-pointer hover-elevate"
      onClick={onClick}
      data-testid={`recommendation-card-${recommendation.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">
            <SeasonIcon className={`w-3 h-3 mr-1 ${seasonInfo?.color}`} />
            {seasonInfo?.name}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            data-testid={`button-favorite-${recommendation.id}`}
          >
            <Heart className={`w-4 h-4 ${recommendation.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>
        <CardTitle className="text-lg">{getOccasionName(recommendation.occasion)}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">{recommendation.reasoning}</p>
        <p className="text-xs text-muted-foreground mt-3">
          {format(new Date(recommendation.createdAt!), 'yyyy.MM.dd HH:mm', { locale: ko })}
        </p>
      </CardContent>
    </Card>
  );
}
