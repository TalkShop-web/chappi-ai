
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center space-y-6">
          <Link to="/">
            <img 
              src="/lovable-uploads/fe93913a-8bf2-4312-b6ea-a1e624532cfd.png" 
              alt="Chappi.ai" 
              className="h-8"
            />
          </Link>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms & Conditions
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </div>
          
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Chappi.ai. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
