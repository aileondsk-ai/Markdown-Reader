import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Home from "@/pages/Home";
import Test from "@/pages/Test";
import Evaluate from "@/pages/Evaluate";
import Profile from "@/pages/Profile";
import History from "@/pages/History";
import Progress from "@/pages/Progress";
import Chat from "@/pages/Chat";
import Recommend from "@/pages/Recommend";
import NotFound from "@/pages/not-found";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/test" component={Test} />
          <Route path="/evaluate" component={Evaluate} />
          <Route path="/profile" component={Profile} />
          <Route path="/history" component={History} />
          <Route path="/progress" component={Progress} />
          <Route path="/chat" component={Chat} />
          <Route path="/recommend" component={Recommend} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
