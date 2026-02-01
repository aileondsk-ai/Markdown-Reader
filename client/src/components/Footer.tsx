import { Shirt, Github, Twitter, Instagram } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
                <Shirt className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight">StyleFinder AI</span>
            </Link>
            <p className="text-muted-foreground leading-relaxed max-w-sm">
              Discover your true fashion identity with AI-powered analysis. 
              Get personalized recommendations from virtual stylists and elevate your wardrobe.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Features</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/test" className="hover:text-primary transition-colors">Style Identity Test</Link></li>
              <li><Link href="/evaluate" className="hover:text-primary transition-colors">AI Evaluation</Link></li>
              <li><Link href="/profile" className="hover:text-primary transition-colors">Personal Profile</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} StyleFinder AI. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <ButtonIcon icon={Twitter} />
            <ButtonIcon icon={Instagram} />
            <ButtonIcon icon={Github} />
          </div>
        </div>
      </div>
    </footer>
  );
}

function ButtonIcon({ icon: Icon }: { icon: any }) {
  return (
    <a href="#" className="text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-muted rounded-full">
      <Icon className="h-5 w-5" />
    </a>
  );
}
