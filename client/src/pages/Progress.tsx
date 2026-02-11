import { useAuth } from "@/hooks/use-auth";
import { useAssessments, useAssessmentStats } from "@/hooks/use-assessments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  Sparkles,
  ArrowRight,
  Calendar
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { format, subDays, subMonths, isAfter } from "date-fns";
import { ko } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type PeriodType = 'week' | 'month' | 'all';
type CategoryType = 'all' | 'harmony' | 'trend' | 'body';

interface Milestone {
  id: string;
  title: string;
  description: string;
  achieved: boolean;
  achievedAt?: Date;
}

export default function Progress() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: assessments, isLoading: assessLoading } = useAssessments();
  const { data: stats } = useAssessmentStats();
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<PeriodType>('month');
  const [category, setCategory] = useState<CategoryType>('all');
  const [goalScore, setGoalScore] = useState<number>(8);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/api/login";
    }
  }, [user, authLoading]);

  const filteredData = useMemo(() => {
    if (!assessments || assessments.length === 0) return [];
    
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        break;
      default:
        startDate = new Date(0);
    }
    
    return assessments
      .filter(a => a.createdAt && isAfter(new Date(a.createdAt), startDate))
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime())
      .map(a => {
        const scores = a.scores as { harmony: number; trend: number; body: number };
        return {
          date: format(new Date(a.createdAt!), 'M/d', { locale: ko }),
          fullDate: format(new Date(a.createdAt!), 'yyyy년 M월 d일', { locale: ko }),
          harmony: scores.harmony || 0,
          trend: scores.trend || 0,
          body: scores.body || 0,
          average: Math.round(((scores.harmony || 0) + (scores.trend || 0) + (scores.body || 0)) / 3 * 10) / 10,
          id: a.id,
        };
      });
  }, [assessments, period]);

  const trendAnalysis = useMemo(() => {
    if (filteredData.length < 2) return null;
    
    const first = filteredData[0];
    const last = filteredData[filteredData.length - 1];
    
    const harmonyChange = last.harmony - first.harmony;
    const trendChange = last.trend - first.trend;
    const bodyChange = last.body - first.body;
    const averageChange = last.average - first.average;
    
    return {
      harmony: { change: harmonyChange, direction: harmonyChange >= 0 ? 'up' : 'down' },
      trend: { change: trendChange, direction: trendChange >= 0 ? 'up' : 'down' },
      body: { change: bodyChange, direction: bodyChange >= 0 ? 'up' : 'down' },
      average: { change: averageChange, direction: averageChange >= 0 ? 'up' : 'down' },
    };
  }, [filteredData]);

  const milestones = useMemo((): Milestone[] => {
    if (!assessments || assessments.length === 0) return [];
    
    const milestoneList: Milestone[] = [];
    
    if (assessments.length >= 1) {
      milestoneList.push({
        id: 'first',
        title: '첫 평가 완료',
        description: '스타일 여정의 시작!',
        achieved: true,
        achievedAt: new Date(assessments[assessments.length - 1].createdAt!),
      });
    }
    
    if (assessments.length >= 5) {
      milestoneList.push({
        id: 'five',
        title: '5회 평가 달성',
        description: '꾸준한 스타일 관리',
        achieved: true,
      });
    } else {
      milestoneList.push({
        id: 'five',
        title: '5회 평가 달성',
        description: `${assessments.length}/5 완료`,
        achieved: false,
      });
    }
    
    const avgScores = assessments.map(a => {
      const s = a.scores as { harmony: number; trend: number; body: number };
      return ((s.harmony || 0) + (s.trend || 0) + (s.body || 0)) / 3;
    });
    const hasHighScore = avgScores.some(s => s >= 8);
    
    milestoneList.push({
      id: 'highscore',
      title: '평균 8점 이상',
      description: hasHighScore ? '스타일 마스터!' : '도전 중',
      achieved: hasHighScore,
    });
    
    return milestoneList;
  }, [assessments]);

  const aiInsight = useMemo(() => {
    if (!trendAnalysis || !assessments || assessments.length < 2) return null;
    
    const insights: string[] = [];
    
    if (trendAnalysis.average.change > 0) {
      insights.push(`전체적인 스타일 점수가 ${Math.abs(trendAnalysis.average.change).toFixed(1)}점 상승했습니다! 좋은 진전이에요.`);
    } else if (trendAnalysis.average.change < 0) {
      insights.push(`최근 점수가 조금 하락했네요. 기본에 충실한 코디로 다시 시작해보세요.`);
    }
    
    const categories = [
      { key: 'harmony', name: '조화도', data: trendAnalysis.harmony },
      { key: 'trend', name: '트렌드', data: trendAnalysis.trend },
      { key: 'body', name: '체형 적합도', data: trendAnalysis.body },
    ];
    
    const bestCategory = categories.reduce((a, b) => 
      a.data.change > b.data.change ? a : b
    );
    const worstCategory = categories.reduce((a, b) => 
      a.data.change < b.data.change ? a : b
    );
    
    if (bestCategory.data.change > 0) {
      insights.push(`${bestCategory.name}에서 가장 큰 성장을 보이고 있어요!`);
    }
    
    if (worstCategory.data.change < -0.5) {
      insights.push(`${worstCategory.name} 영역에 조금 더 신경 써보세요.`);
    }
    
    return insights;
  }, [trendAnalysis, assessments]);

  if (authLoading || assessLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" data-testid="loader-progress" />
      </div>
    );
  }

  if (!user) return null;

  const chartColors = {
    harmony: "hsl(var(--chart-1))",
    trend: "hsl(var(--chart-2))",
    body: "hsl(var(--chart-3))",
    average: "hsl(var(--primary))",
  };

  return (
    <main className="container max-w-7xl mx-auto px-4 py-8 md:py-12" role="main" aria-label="스타일 변화 추적">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2" id="progress-heading" data-testid="text-page-title">
          스타일 변화 추적
        </h1>
        <p className="text-muted-foreground">
          시간에 따른 스타일 점수 변화를 확인하고 성장을 추적하세요
        </p>
      </div>

      {/* Period & Category Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
          <SelectTrigger className="w-[140px]" data-testid="select-period">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">최근 1주</SelectItem>
            <SelectItem value="month">최근 1개월</SelectItem>
            <SelectItem value="all">전체 기간</SelectItem>
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={(v) => setCategory(v as CategoryType)}>
          <SelectTrigger className="w-[140px]" data-testid="select-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 항목</SelectItem>
            <SelectItem value="harmony">조화도</SelectItem>
            <SelectItem value="trend">트렌드</SelectItem>
            <SelectItem value="body">체형 적합도</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredData.length === 0 ? (
        <Card className="p-12 text-center border-dashed bg-muted/20">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">아직 분석할 데이터가 없습니다</h3>
          <p className="text-muted-foreground mb-6">
            AI 평가를 받아 스타일 변화를 추적해보세요.
          </p>
          <Link href="/evaluate">
            <Button data-testid="button-start-evaluate">평가 시작하기</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  점수 변화 추이
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]" data-testid="chart-score-trend">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }} 
                        tickLine={false}
                      />
                      <YAxis 
                        domain={[0, 10]} 
                        tick={{ fontSize: 12 }} 
                        tickLine={false}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border rounded-lg shadow-lg p-3">
                                <p className="font-medium mb-2">{data.fullDate}</p>
                                {category === 'all' || category === 'harmony' ? (
                                  <p className="text-sm">조화도: <span className="font-bold">{data.harmony}</span></p>
                                ) : null}
                                {category === 'all' || category === 'trend' ? (
                                  <p className="text-sm">트렌드: <span className="font-bold">{data.trend}</span></p>
                                ) : null}
                                {category === 'all' || category === 'body' ? (
                                  <p className="text-sm">체형: <span className="font-bold">{data.body}</span></p>
                                ) : null}
                                {category === 'all' && (
                                  <p className="text-sm font-medium mt-1 pt-1 border-t">
                                    평균: <span className="font-bold text-primary">{data.average}</span>
                                  </p>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      
                      {(category === 'all' || category === 'harmony') && (
                        <Line 
                          type="monotone" 
                          dataKey="harmony" 
                          name="조화도"
                          stroke={chartColors.harmony} 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      )}
                      {(category === 'all' || category === 'trend') && (
                        <Line 
                          type="monotone" 
                          dataKey="trend" 
                          name="트렌드"
                          stroke={chartColors.trend} 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      )}
                      {(category === 'all' || category === 'body') && (
                        <Line 
                          type="monotone" 
                          dataKey="body" 
                          name="체형 적합도"
                          stroke={chartColors.body} 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Trend Analysis */}
            {trendAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    트렌드 분석
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg" data-testid="trend-harmony">
                      <p className="text-sm text-muted-foreground mb-1">조화도</p>
                      <div className={`flex items-center justify-center gap-1 text-lg font-bold ${
                        trendAnalysis.harmony.direction === 'up' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {trendAnalysis.harmony.direction === 'up' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {trendAnalysis.harmony.change >= 0 ? '+' : ''}{trendAnalysis.harmony.change.toFixed(1)}
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-muted/30 rounded-lg" data-testid="trend-trend">
                      <p className="text-sm text-muted-foreground mb-1">트렌드</p>
                      <div className={`flex items-center justify-center gap-1 text-lg font-bold ${
                        trendAnalysis.trend.direction === 'up' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {trendAnalysis.trend.direction === 'up' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {trendAnalysis.trend.change >= 0 ? '+' : ''}{trendAnalysis.trend.change.toFixed(1)}
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-muted/30 rounded-lg" data-testid="trend-body">
                      <p className="text-sm text-muted-foreground mb-1">체형 적합도</p>
                      <div className={`flex items-center justify-center gap-1 text-lg font-bold ${
                        trendAnalysis.body.direction === 'up' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {trendAnalysis.body.direction === 'up' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {trendAnalysis.body.change >= 0 ? '+' : ''}{trendAnalysis.body.change.toFixed(1)}
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-primary/10 rounded-lg" data-testid="trend-average">
                      <p className="text-sm text-muted-foreground mb-1">평균</p>
                      <div className={`flex items-center justify-center gap-1 text-lg font-bold ${
                        trendAnalysis.average.direction === 'up' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {trendAnalysis.average.direction === 'up' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {trendAnalysis.average.change >= 0 ? '+' : ''}{trendAnalysis.average.change.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Insight */}
            {aiInsight && aiInsight.length > 0 && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI 인사이트
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {aiInsight.map((insight, i) => (
                      <li key={i} className="flex items-start gap-2" data-testid={`insight-${i}`}>
                        <ArrowRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Goal Setting */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  목표 점수
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="5"
                      max="10"
                      step="0.5"
                      value={goalScore}
                      onChange={(e) => setGoalScore(Number(e.target.value))}
                      className="flex-1"
                      data-testid="input-goal-score"
                    />
                    <span className="text-2xl font-bold text-primary w-12 text-right" data-testid="text-goal-score">
                      {goalScore}
                    </span>
                  </div>
                  
                  {stats && stats.averageScores && (
                    <div className="text-sm text-muted-foreground">
                      현재 평균: {((stats.averageScores.harmony + stats.averageScores.trend + stats.averageScores.body) / 3).toFixed(1)}점
                      {((stats.averageScores.harmony + stats.averageScores.trend + stats.averageScores.body) / 3) >= goalScore ? (
                        <Badge variant="default" className="ml-2">목표 달성!</Badge>
                      ) : (
                        <span className="ml-2">
                          (목표까지 {(goalScore - (stats.averageScores.harmony + stats.averageScores.trend + stats.averageScores.body) / 3).toFixed(1)}점)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  마일스톤
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {milestones.map((milestone) => (
                    <div 
                      key={milestone.id} 
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        milestone.achieved ? 'bg-green-50 dark:bg-green-950/20' : 'bg-muted/30'
                      }`}
                      data-testid={`milestone-${milestone.id}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        milestone.achieved ? 'bg-green-500 text-white' : 'bg-muted'
                      }`}>
                        {milestone.achieved ? (
                          <Award className="w-4 h-4" />
                        ) : (
                          <Target className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${milestone.achieved ? '' : 'text-muted-foreground'}`}>
                          {milestone.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{milestone.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>빠른 링크</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/evaluate">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-quick-evaluate">
                    새 평가 받기
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                </Link>
                <Link href="/history">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-quick-history">
                    히스토리 보기
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-quick-profile">
                    프로필 보기
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}
