import { useAuth } from "@/hooks/use-auth";
import { 
  useConversations, 
  useConversation, 
  useCreateConversation, 
  useSendMessage,
  useDeleteConversation 
} from "@/hooks/use-chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Loader2, 
  Send, 
  Plus, 
  MessageSquare, 
  Trash2, 
  Image as ImageIcon,
  Sparkles,
  User,
  X
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, useState, useRef, useCallback } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useDropzone } from "react-dropzone";

const PERSONAS = {
  sujin: { name: '수진', initial: 'SJ', description: '트렌디한 패션 인플루언서', color: 'bg-pink-500' },
  minsu: { name: '민수', initial: 'MS', description: '클래식 패션 컨설턴트', color: 'bg-blue-500' },
  jihyun: { name: '지현', initial: 'JH', description: '미니멀 스타일리스트', color: 'bg-purple-500' },
};

const QUICK_QUESTIONS = [
  "오늘 면접이 있는데 어떤 옷이 좋을까요?",
  "데이트할 때 어떤 스타일이 좋을까요?",
  "캐주얼한 오피스룩 추천해주세요",
  "체형에 맞는 옷 선택법이 궁금해요",
];

export default function Chat() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: conversations, isLoading: convsLoading } = useConversations();
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const { data: conversationData, isLoading: convLoading } = useConversation(selectedConvId);
  const createConversation = useCreateConversation();
  const sendMessage = useSendMessage(selectedConvId);
  const deleteConversation = useDeleteConversation();
  const [, setLocation] = useLocation();
  
  const [message, setMessage] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/api/login";
    }
  }, [user, authLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationData?.messages]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    noClick: true,
  });

  const handleStartConversation = async (persona: string) => {
    try {
      const conv = await createConversation.mutateAsync({ 
        persona: persona as 'sujin' | 'minsu' | 'jihyun' 
      });
      setSelectedConvId(conv.id);
      setShowNewChat(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessage.isPending) return;
    
    try {
      await sendMessage.mutateAsync({
        content: message,
        image: attachedImage || undefined,
      });
      setMessage('');
      setAttachedImage(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setMessage(question);
  };

  const handleDeleteConversation = async (id: number) => {
    try {
      await deleteConversation.mutateAsync(id);
      if (selectedConvId === id) {
        setSelectedConvId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading || convsLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" data-testid="loader-chat" />
      </div>
    );
  }

  if (!user) return null;

  const currentPersona = conversationData?.conversation.persona;
  const personaInfo = currentPersona ? PERSONAS[currentPersona as keyof typeof PERSONAS] : null;

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 h-[calc(100vh-140px)]">
      <div className="grid lg:grid-cols-4 gap-6 h-full">
        {/* Sidebar - Conversations List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold">채팅</h2>
            <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-new-chat">
                  <Plus className="w-4 h-4 mr-1" />
                  새 대화
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>스타일리스트 선택</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-4">
                  {Object.entries(PERSONAS).map(([key, persona]) => (
                    <Button
                      key={key}
                      variant="outline"
                      className="h-auto p-4 justify-start gap-4"
                      onClick={() => handleStartConversation(key)}
                      disabled={createConversation.isPending}
                      data-testid={`button-persona-${key}`}
                    >
                      <div className={`w-12 h-12 rounded-full ${persona.color} flex items-center justify-center text-2xl`}>
                        {persona.initial}
                      </div>
                      <div className="text-left">
                        <div className="font-bold">{persona.name}</div>
                        <div className="text-sm text-muted-foreground">{persona.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-2 pr-4">
              {conversations && conversations.length > 0 ? (
                conversations.map((conv) => {
                  const persona = PERSONAS[conv.persona as keyof typeof PERSONAS];
                  return (
                    <div
                      key={conv.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConvId === conv.id 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedConvId(conv.id)}
                      data-testid={`conversation-${conv.id}`}
                    >
                      <div className={`w-10 h-10 rounded-full ${persona?.color || 'bg-muted'} flex items-center justify-center text-lg shrink-0`}>
                        {persona?.initial || '...'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{conv.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(conv.createdAt), 'M월 d일', { locale: ko })}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 opacity-0 group-hover:opacity-100 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conv.id);
                        }}
                        data-testid={`button-delete-${conv.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">대화가 없습니다</p>
                  <p className="text-xs">새 대화를 시작해보세요</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-3 flex flex-col h-full">
          {selectedConvId && conversationData ? (
            <Card className="flex flex-col h-full">
              {/* Chat Header */}
              <CardHeader className="border-b py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${personaInfo?.color || 'bg-muted'} flex items-center justify-center text-lg`}>
                    {personaInfo?.initial || '...'}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{conversationData.conversation.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{personaInfo?.description}</p>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent 
                className="flex-1 overflow-y-auto p-4 space-y-4"
                {...getRootProps()}
              >
                <input {...getInputProps()} />
                
                {isDragActive && (
                  <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10">
                    <p className="text-primary font-medium">이미지를 드롭하세요</p>
                  </div>
                )}

                {convLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : conversationData.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className={`w-16 h-16 rounded-full ${personaInfo?.color} flex items-center justify-center text-xl font-bold text-white mb-4`}>
                      {personaInfo?.initial}
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      안녕하세요! {personaInfo?.name}입니다
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      패션에 대해 무엇이든 물어보세요!
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center max-w-md">
                      {QUICK_QUESTIONS.map((q, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="cursor-pointer hover:bg-secondary/80 transition-colors"
                          onClick={() => handleQuickQuestion(q)}
                          data-testid={`quick-question-${i}`}
                        >
                          {q}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  conversationData.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                      data-testid={`message-${msg.id}`}
                    >
                      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : personaInfo?.color || 'bg-muted'
                      }`}>
                        {msg.role === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-bold text-white">{personaInfo?.initial}</span>
                        )}
                      </div>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {format(new Date(msg.createdAt), 'HH:mm', { locale: ko })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                
                {sendMessage.isPending && (
                  <div className="flex gap-3" data-testid="typing-indicator">
                    <div className={`w-8 h-8 rounded-full ${personaInfo?.color} flex items-center justify-center`}>
                      <span className="text-xs font-bold text-white">{personaInfo?.initial}</span>
                    </div>
                    <div className="bg-muted rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input Area */}
              <div className="border-t p-4">
                {attachedImage && (
                  <div className="mb-2 flex items-center gap-2">
                    <img 
                      src={attachedImage} 
                      alt="첨부 이미지" 
                      className="h-16 rounded-lg object-cover"
                      data-testid="attached-image-preview"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setAttachedImage(null)}
                      data-testid="button-remove-image"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => setAttachedImage(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      data-testid="input-image-upload"
                    />
                    <Button type="button" variant="outline" size="icon" asChild>
                      <span>
                        <ImageIcon className="w-4 h-4" />
                      </span>
                    </Button>
                  </label>
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="메시지를 입력하세요..."
                    className="flex-1"
                    disabled={sendMessage.isPending}
                    data-testid="input-message"
                  />
                  <Button 
                    type="submit" 
                    disabled={!message.trim() || sendMessage.isPending}
                    data-testid="button-send"
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center h-full text-center p-8">
              <Sparkles className="w-16 h-16 text-primary/30 mb-4" />
              <h3 className="text-xl font-medium mb-2">AI 스타일리스트와 대화하세요</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                패션 관련 질문을 하거나 착장 사진을 공유하면 맞춤 조언을 받을 수 있어요.
              </p>
              <Button onClick={() => setShowNewChat(true)} data-testid="button-start-chat">
                <Plus className="w-4 h-4 mr-2" />
                새 대화 시작하기
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
