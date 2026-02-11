import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAssessmentsByMonth, useAssessmentStats, useToggleFavorite } from "@/hooks/use-assessments";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronLeft, ChevronRight, Calendar, Heart, Star, TrendingUp, Filter, SortDesc } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from "date-fns";
import { ko } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PERSONAS: Record<string, string> = {
  sujin: "수진",
  minsu: "민수",
  jihyun: "지현",
};

type SortOption = "date" | "score";
type FilterOption = "all" | "favorite";

export default function History() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: assessments, isLoading: assessmentsLoading } = useAssessmentsByMonth(year, month);
  const { data: stats, isLoading: statsLoading } = useAssessmentStats();
  const toggleFavorite = useToggleFavorite();

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/api/login";
    }
  }, [user, authLoading]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const firstDayOffset = getDay(startOfMonth(currentDate));

  const assessmentsByDate = useMemo(() => {
    const map = new Map<string, typeof assessments>();
    assessments?.forEach((a) => {
      if (a.createdAt) {
        const dateKey = format(new Date(a.createdAt), "yyyy-MM-dd");
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, a]);
      }
    });
    return map;
  }, [assessments]);

  const filteredAndSortedAssessments = useMemo(() => {
    let list = assessments || [];
    
    if (filterBy === "favorite") {
      list = list.filter((a) => a.isFavorite);
    }
    
    if (sortBy === "score") {
      list = [...list].sort((a, b) => {
        const aTotal = Object.values(a.scores as Record<string, number>).reduce((sum, v) => sum + v, 0);
        const bTotal = Object.values(b.scores as Record<string, number>).reduce((sum, v) => sum + v, 0);
        return bTotal - aTotal;
      });
    }
    
    return list;
  }, [assessments, sortBy, filterBy]);

  const selectedAssessment = useMemo(() => {
    return assessments?.find((a) => a.id === selectedAssessmentId);
  }, [assessments, selectedAssessmentId]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const handleToggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite.mutate(id);
  };

  if (authLoading || assessmentsLoading || statsLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" data-testid="loader-history" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="container max-w-6xl mx-auto px-4 py-12" role="main" aria-label="코디 히스토리">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display mb-2" id="history-heading">코디 히스토리</h1>
        <p className="text-muted-foreground">시간에 따른 나의 스타일 변화를 확인해보세요</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={goToPrevMonth}
                data-testid="button-prev-month"
                aria-label="이전 달"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-xl font-bold font-display" data-testid="text-current-month">
                {format(currentDate, "yyyy년 M월", { locale: ko })}
              </h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={goToNextMonth}
                data-testid="button-next-month"
                aria-label="다음 달"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array(firstDayOffset).fill(null).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {daysInMonth.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayAssessments = assessmentsByDate.get(dateKey) || [];
                const hasAssessments = dayAssessments.length > 0;
                const isToday = isSameDay(day, new Date());

                return (
                  <motion.div
                    key={dateKey}
                    className={`
                      aspect-square rounded-lg border p-1 cursor-pointer transition-colors
                      ${hasAssessments ? "bg-primary/5 border-primary/20 hover:bg-primary/10" : "hover:bg-muted/50"}
                      ${isToday ? "ring-2 ring-primary" : ""}
                    `}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => {
                      if (dayAssessments.length > 0) {
                        setSelectedAssessmentId(dayAssessments[0].id);
                      }
                    }}
                    data-testid={`calendar-day-${dateKey}`}
                  >
                    <div className="text-xs text-center font-medium mb-1">
                      {format(day, "d")}
                    </div>
                    {hasAssessments && (
                      <div className="flex flex-wrap gap-0.5 justify-center">
                        {dayAssessments.slice(0, 3).map((a) => (
                          <div
                            key={a.id}
                            className="w-2 h-2 rounded-full bg-primary"
                          />
                        ))}
                        {dayAssessments.length > 3 && (
                          <div className="text-[8px] text-muted-foreground">+{dayAssessments.length - 3}</div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">이번 달 기록</h3>
              <div className="flex items-center gap-2">
                <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)}>
                  <SelectTrigger className="w-[120px]" data-testid="select-filter">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="favorite">즐겨찾기</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-[120px]" data-testid="select-sort">
                    <SortDesc className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">날짜순</SelectItem>
                    <SelectItem value="score">점수순</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredAndSortedAssessments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>이번 달 기록이 없습니다</p>
                <Link href="/evaluate">
                  <Button className="mt-4" data-testid="button-start-evaluate">
                    패션 평가 시작하기
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                <AnimatePresence>
                  {filteredAndSortedAssessments.map((item) => {
                    const scores = item.scores as { harmony: number; trend: number; body: number };
                    const totalScore = Math.round((scores.harmony + scores.trend + scores.body) / 3 * 10) / 10;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={() => setSelectedAssessmentId(item.id)}
                        className="cursor-pointer"
                      >
                        <Card 
                          className="overflow-hidden hover:shadow-lg transition-shadow group"
                          data-testid={`card-assessment-${item.id}`}
                        >
                          <div className="aspect-[4/3] overflow-hidden relative">
                            <img
                              src={item.imageUrl}
                              alt="코디"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              data-testid={`img-assessment-${item.id}`}
                            />
                            <button
                              onClick={(e) => handleToggleFavorite(item.id, e)}
                              className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm transition-colors ${
                                item.isFavorite
                                  ? "bg-red-500/90 text-white"
                                  : "bg-white/80 text-gray-600 hover:bg-white"
                              }`}
                              data-testid={`button-favorite-${item.id}`}
                            >
                              <Heart className={`w-4 h-4 ${item.isFavorite ? "fill-current" : ""}`} />
                            </button>
                            <div className="absolute bottom-2 left-2">
                              <Badge variant="secondary" className="backdrop-blur-sm">
                                {PERSONAS[item.persona]}
                              </Badge>
                            </div>
                          </div>
                          <div className="p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground" data-testid={`text-date-${item.id}`}>
                                {item.createdAt && format(new Date(item.createdAt), "M월 d일", { locale: ko })}
                              </span>
                              <span className="font-bold text-primary" data-testid={`text-score-${item.id}`}>
                                {totalScore}점
                              </span>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              통계
            </h3>
            {stats ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">전체 평가</span>
                  <span className="font-bold" data-testid="stat-total-count">{stats.totalCount}회</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">이번 달</span>
                  <span className="font-bold" data-testid="stat-monthly-count">{stats.monthlyCount}회</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    즐겨찾기
                  </span>
                  <span className="font-bold" data-testid="stat-favorite-count">{stats.favoriteCount}개</span>
                </div>
                <div className="pt-4">
                  <h4 className="text-sm font-medium mb-3">평균 점수</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-16">조화</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${stats.averageScores.harmony * 10}%` }}
                        />
                      </div>
                      <span className="font-bold w-8 text-right" data-testid="stat-avg-harmony">
                        {stats.averageScores.harmony}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-16">트렌드</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${stats.averageScores.trend * 10}%` }}
                        />
                      </div>
                      <span className="font-bold w-8 text-right" data-testid="stat-avg-trend">
                        {stats.averageScores.trend}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-16">체형</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${stats.averageScores.body * 10}%` }}
                        />
                      </div>
                      <span className="font-bold w-8 text-right" data-testid="stat-avg-body">
                        {stats.averageScores.body}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">통계 데이터가 없습니다</p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4">빠른 링크</h3>
            <div className="space-y-2">
              <Link href="/evaluate">
                <Button variant="outline" className="w-full justify-start" data-testid="button-quick-evaluate">
                  새 평가 받기
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" className="w-full justify-start" data-testid="button-quick-profile">
                  프로필 보기
                </Button>
              </Link>
              <Link href="/test">
                <Button variant="outline" className="w-full justify-start" data-testid="button-quick-test">
                  SIT 테스트
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={!!selectedAssessment} onOpenChange={() => setSelectedAssessmentId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedAssessment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{PERSONAS[selectedAssessment.persona]} 평가</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    {selectedAssessment.createdAt && format(new Date(selectedAssessment.createdAt), "yyyy년 M월 d일", { locale: ko })}
                  </span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="aspect-[4/3] rounded-lg overflow-hidden">
                  <img
                    src={selectedAssessment.imageUrl}
                    alt="코디"
                    className="w-full h-full object-cover"
                    data-testid="img-detail-assessment"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(selectedAssessment.scores as Record<string, number>).map(([key, value]) => (
                    <div key={key} className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{value}</div>
                      <div className="text-xs text-muted-foreground uppercase">
                        {key === "harmony" ? "조화" : key === "trend" ? "트렌드" : "체형"}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {selectedAssessment.feedback.split("\n").map((line, i) => (
                    <p key={i} className="mb-2">{line}</p>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={selectedAssessment.isFavorite ? "default" : "outline"}
                    onClick={() => toggleFavorite.mutate(selectedAssessment.id)}
                    data-testid="button-detail-favorite"
                  >
                    <Heart className={`w-4 h-4 mr-2 ${selectedAssessment.isFavorite ? "fill-current" : ""}`} />
                    {selectedAssessment.isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
