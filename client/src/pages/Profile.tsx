import { useAuth } from "@/hooks/use-auth";
import { useLatestSitResult } from "@/hooks/use-sit";
import { useAssessments } from "@/hooks/use-assessments";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, User, Shirt, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { format } from "date-fns";

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: sitResult, isLoading: sitLoading } = useLatestSitResult();
  const { data: assessments, isLoading: assessLoading } = useAssessments();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) {
      // Redirect if not logged in
      window.location.href = "/api/login";
    }
  }, [user, authLoading]);

  if (authLoading || sitLoading || assessLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container max-w-6xl mx-auto px-4 py-12">
      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Sidebar: User Info & SIT Type */}
        <div className="space-y-6">
          <Card className="p-6 text-center shadow-lg border-t-4 border-t-primary">
            <div className="w-24 h-24 bg-secondary rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
              {user.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <h2 className="text-2xl font-display font-bold">{user.firstName} {user.lastName}</h2>
            <p className="text-muted-foreground text-sm">{user.email}</p>
            
            <div className="mt-8 pt-8 border-t">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Style Identity</h3>
              {sitResult ? (
                <div className="space-y-4">
                  <div className="text-4xl font-black text-primary tracking-tight">{sitResult.sitType}</div>
                  <div className="text-lg font-medium font-display">{sitResult.typeDescription}</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {sitResult.keywords?.map((k: string) => (
                      <Badge key={k} variant="secondary">{k}</Badge>
                    ))}
                  </div>
                  <Link href="/test">
                    <Button variant="link" className="text-xs text-muted-foreground">Retake Test</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">You haven't taken the test yet.</p>
                  <Link href="/test">
                    <Button size="sm" className="w-full">Take Test</Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Main Content: Assessment History */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold">Assessment History</h2>
            <Link href="/evaluate">
              <Button size="sm" variant="outline">
                <Shirt className="w-4 h-4 mr-2" />
                New Evaluation
              </Button>
            </Link>
          </div>

          {!assessments || assessments.length === 0 ? (
            <Card className="p-12 text-center border-dashed bg-muted/20">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Shirt className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Assessments Yet</h3>
              <p className="text-muted-foreground mb-6">Upload an outfit to get AI feedback.</p>
              <Link href="/evaluate">
                <Button>Start Evaluation</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {assessments.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300 group cursor-pointer border-muted">
                  <div className="aspect-[3/4] overflow-hidden relative">
                    <img 
                      src={item.imageUrl} 
                      alt="Assessment" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-white/90 text-black hover:bg-white shadow-sm backdrop-blur-sm">
                        {item.persona.charAt(0).toUpperCase() + item.persona.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.createdAt && format(new Date(item.createdAt), 'MMM d, yyyy')}
                      </div>
                    </div>
                    {/* Preview of scores - simplified */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      {Object.entries(item.scores as Record<string, number>).slice(0, 3).map(([key, val]) => (
                        <div key={key} className="bg-muted/50 rounded p-1">
                          <div className="font-bold">{val}/10</div>
                          <div className="text-[10px] uppercase opacity-70">{key.slice(0, 4)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
