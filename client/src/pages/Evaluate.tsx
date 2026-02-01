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
  { id: "sujin", name: "Editor Sujin", role: "Vogue Editor", desc: "Sharp, trend-focused, brutal honesty." },
  { id: "minsu", name: "Photographer Minsu", role: "Street Snapper", desc: "Focuses on vibe, silhouette, and authenticity." },
  { id: "jihyun", name: "Designer Jihyun", role: "Minimalist Designer", desc: "Technical details, fabric quality, and harmony." },
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
      image: preview, // Base64 string
      persona,
    }, {
      onError: (err) => {
        toast({
          title: "Analysis Failed",
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
              <img src={result.imageUrl} alt="Analyzed Outfit" className="w-full h-auto object-cover" />
            </Card>
            <div className="bg-card p-6 rounded-2xl border shadow-sm">
              <h3 className="font-bold mb-4 font-display text-lg">Style Scores</h3>
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
                <p className="text-muted-foreground text-sm">Analysis Result</p>
              </div>
            </div>
            
            <Card className="p-8 shadow-lg border-primary/10 bg-gradient-to-br from-card to-muted/20">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {/* Simple markdown rendering */}
                {result.feedback.split('\n').map((line, i) => (
                  <p key={i} className="mb-2 leading-relaxed">{line}</p>
                ))}
              </div>
            </Card>
            
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              Analyze Another Outfit
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12 md:py-20">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-display font-bold">AI Style Evaluation</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Upload your outfit and get professional feedback from our AI fashion personas.
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
            >
              <input {...getInputProps()} />
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <UploadCloud className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">Drag & Drop or Click to Upload</h3>
              <p className="text-muted-foreground">Supports JPG, PNG (Max 5MB)</p>
            </div>
          ) : (
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black/5 group">
              <img src={preview} alt="Preview" className="w-full h-96 object-cover" />
              <div className="absolute top-4 right-4">
                <Button 
                  size="icon" 
                  variant="destructive" 
                  onClick={(e) => { e.stopPropagation(); clearImage(); }}
                  className="rounded-full shadow-lg"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              {/* Analyze Overlay Button */}
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center pb-8 pt-20">
                 <Button 
                  size="lg" 
                  onClick={handleAnalyze} 
                  disabled={isPending}
                  className="h-14 px-10 rounded-full text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Analyze Outfit
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
