import { useState } from "react";
import { Shield, Users, BarChart3, UserCheck, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Teal with Wave Pattern */}
      <div className="hidden lg:flex lg:w-[42%] bg-primary relative overflow-hidden">
        {/* Wave Pattern SVG */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 800"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Multiple wavy lines */}
          <path
            d="M-50,100 Q100,150 50,250 T100,400 T50,550 T100,700 T50,850"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="2"
          />
          <path
            d="M0,80 Q150,130 100,230 T150,380 T100,530 T150,680 T100,830"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="2"
          />
          <path
            d="M50,120 Q200,170 150,270 T200,420 T150,570 T200,720 T150,870"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="2"
          />
          <path
            d="M100,60 Q250,110 200,210 T250,360 T200,510 T250,660 T200,810"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="2"
          />
          <path
            d="M150,140 Q300,190 250,290 T300,440 T250,590 T300,740 T250,890"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="2"
          />
          <path
            d="M200,100 Q350,150 300,250 T350,400 T300,550 T350,700 T300,850"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="2"
          />
          <path
            d="M250,80 Q400,130 350,230 T400,380 T350,530 T400,680 T350,830"
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="2"
          />
          <path
            d="M300,120 Q450,170 400,270 T450,420 T400,570 T450,720 T400,870"
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Right Panel - Content */}
      <div className="flex-1 flex flex-col min-h-screen bg-background">
        {/* Top Bar */}
        <div className="flex justify-end items-center p-4">
          <ThemeToggle />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-8 lg:px-12 pb-6">
          {/* Logo/Branding */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">RCSA Platform</h1>
              <p className="text-xs text-muted-foreground">Risk & Control Self-Assessment</p>
            </div>
          </div>

          {/* Login Form */}
          <div className="w-full max-w-sm space-y-4 mb-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm text-muted-foreground">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder=""
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 border-border bg-background"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm text-muted-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder=""
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border-border bg-background"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-warning hover:bg-warning/90 text-white font-semibold"
              >
                SIGN IN
              </Button>
            </form>

            <div className="text-center">
              <a
                href="#"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Recover Password
              </a>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full max-w-md flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs text-muted-foreground font-medium">Quick Access</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          {/* Persona Cards */}
          <div className="w-full max-w-2xl space-y-4">
            {/* 1st Line Defense Section */}
            <div className="rounded-lg border border-first-line/20 bg-first-line/5 p-3">
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
            <div className="rounded-lg border border-second-line/20 bg-second-line/5 p-3">
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
        <footer className="py-4 px-6 border-t border-border">
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
