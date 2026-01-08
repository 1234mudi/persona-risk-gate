import { useState } from "react";
import { Shield, Users, BarChart3, UserCheck, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PersonaCard } from "@/components/PersonaCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";


const Index = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Login successful", {
      description: `Welcome back! Logging in as ${email}`,
    });
  };

  const handlePersonaLogin = (personaName: string, route?: string) => {
    toast.success("Quick login successful", {
      description: `Logging in as ${personaName}`,
    });
    if (route) {
      setTimeout(() => navigate(route), 500);
    }
  };

  const firstColumnPersonas = [
    {
      icon: UserCheck,
      name: "Risk Owner",
      description: "Approves RCSA results and oversees critical risk remediation.",
      line: "first" as const,
      route: "/dashboard/risk-owner",
    },
    {
      icon: ClipboardCheck,
      name: "1st Line Risk Analyst",
      description: "Executes RCSA process, rates risk, and documents control evidence.",
      line: "first" as const,
      route: "/dashboard/1st-line-analyst",
    },
    {
      icon: Users,
      name: "1st Line Risk Manager",
      description: "Reviews and submits RCSA packages, manages action plans.",
      line: "first" as const,
    },
  ];

  const secondColumnPersonas = [
    {
      icon: BarChart3,
      name: "2nd Line Risk Analyst",
      description: "Reviews and challenges 1st Line RCSA submissions.",
      line: "second" as const,
      route: "/dashboard/2nd-line-analyst",
    },
    {
      icon: Shield,
      name: "Chief Risk Officer",
      description: "Monitors enterprise risk posture and authorizes strategies.",
      line: "second" as const,
    },
  ];

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left Panel - Exact Image */}
      <div className="hidden lg:flex lg:w-[35%] relative overflow-hidden">
        <img
          src="/login-side-panel.png"
          alt="Login background"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Right Panel - Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
        {/* Top Bar */}
        <div className="flex justify-end items-center p-2">
          <ThemeToggle />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-6 lg:px-8 py-2 overflow-hidden">
          {/* Logo/Branding */}
          <div className="w-full max-w-sm flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-black dark:text-white">RCSA Platform</h1>
              <p className="text-[10px] text-muted-foreground">Risk & Control Self-Assessment</p>
            </div>
          </div>

          {/* Login Form */}
          <div className="w-full max-w-sm space-y-3 mb-2">
            <form onSubmit={handleLogin} className="space-y-3">
              {/* Username field with floating label and left accent */}
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[hsl(175,100%,42%)]"></div>
                <label className="absolute -top-2.5 left-3 bg-background px-1 text-xs text-muted-foreground z-10">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 pl-4 border-border rounded-none focus:border-primary focus:ring-0 focus:ring-offset-0 bg-background"
                  required
                />
              </div>

              {/* Password field with placeholder only */}
              <div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 border-border rounded-none focus:border-primary focus:ring-0 focus:ring-offset-0 bg-background"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-32 h-8 bg-[#E87722] hover:bg-[#D06A1E] text-white font-semibold text-xs rounded-none"
              >
                SIGN IN
              </Button>
            </form>

            <div>
              <a href="#" className="text-sm text-primary hover:underline">
                Recover Username
              </a>
              <span className="text-muted-foreground mx-2">|</span>
              <a href="#" className="text-sm text-primary hover:underline">
                Recover Password
              </a>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full max-w-md flex items-center gap-2 mb-2">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs text-muted-foreground font-medium">Quick Access</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          {/* Persona Cards */}
          <div className="w-full max-w-xl space-y-1.5 mb-3">
            {/* 1st Line Defense Section */}
            <div className="border border-first-line/20 bg-first-line/5 p-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-first-line"></div>
                <h3 className="text-xs font-semibold text-first-line uppercase tracking-wide">
                  1st Line Defense
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {firstColumnPersonas.map((persona, index) => (
                  <PersonaCard
                    key={index}
                    icon={persona.icon}
                    name={persona.name}
                    description={persona.description}
                    line={persona.line}
                    onSelect={() => handlePersonaLogin(persona.name, persona.route)}
                  />
                ))}
              </div>
            </div>

            {/* 2nd Line Defense Section */}
            <div className="border border-second-line/20 bg-second-line/5 p-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-second-line"></div>
                <h3 className="text-xs font-semibold text-second-line uppercase tracking-wide">
                  2nd Line Defense
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md">
                {secondColumnPersonas.map((persona, index) => (
                  <PersonaCard
                    key={index}
                    icon={persona.icon}
                    name={persona.name}
                    description={persona.description}
                    line={persona.line}
                    onSelect={() => handlePersonaLogin(persona.name, persona.route)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-2 px-6 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Copyright © 2025. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Support
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
