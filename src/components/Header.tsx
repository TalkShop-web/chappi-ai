
import { LogIn, User } from "lucide-react";
import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="border-b border-border bg-black">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/07598d50-02f5-47c7-a13e-ac19cbb1ea83.png" 
            alt="Chappi.ai" 
            className="h-6 pl-5"
          />
        </Link>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0EA5E9] text-white hover:bg-[#0EA5E9]/90 transition-colors">
            <LogIn className="h-4 w-4" />
            Sign In
          </button>
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <User className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>
    </header>
  );
}
