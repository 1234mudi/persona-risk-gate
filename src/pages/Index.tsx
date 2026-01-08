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
      {/* Left Panel - Teal Gradient with Wave Pattern */}
      <div className="hidden lg:flex lg:w-[35%] relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #00D4AA 0%, #00E5C0 50%, #00F5D4 100%)' }}>
        {/* Wave Pattern SVG */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 900"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Flowing curved lines that sweep from left to right */}
          <path
            d="M-100,50 Q50,80 80,200 Q110,350 50,450 Q-10,550 40,700 Q90,850 30,950"
            fill="none"
            stroke="rgba(0,180,160,0.35)"
            strokeWidth="1.5"
          />
          <path
            d="M-80,80 Q70,110 100,230 Q130,380 70,480 Q10,580 60,730 Q110,880 50,980"
            fill="none"
            stroke="rgba(0,180,160,0.32)"
            strokeWidth="1.5"
          />
          <path
            d="M-60,110 Q90,140 120,260 Q150,410 90,510 Q30,610 80,760 Q130,910 70,1010"
            fill="none"
            stroke="rgba(0,180,160,0.29)"
            strokeWidth="1.5"
          />
          <path
            d="M-40,140 Q110,170 140,290 Q170,440 110,540 Q50,640 100,790 Q150,940 90,1040"
            fill="none"
            stroke="rgba(0,180,160,0.26)"
            strokeWidth="1.5"
          />
          <path
            d="M-20,170 Q130,200 160,320 Q190,470 130,570 Q70,670 120,820 Q170,970 110,1070"
            fill="none"
            stroke="rgba(0,180,160,0.23)"
            strokeWidth="1.5"
          />
          <path
            d="M0,200 Q150,230 180,350 Q210,500 150,600 Q90,700 140,850 Q190,1000 130,1100"
            fill="none"
            stroke="rgba(0,180,160,0.20)"
            strokeWidth="1.5"
          />
          <path
            d="M20,230 Q170,260 200,380 Q230,530 170,630 Q110,730 160,880 Q210,1030 150,1130"
            fill="none"
            stroke="rgba(0,180,160,0.17)"
            strokeWidth="1.5"
          />
          <path
            d="M40,260 Q190,290 220,410 Q250,560 190,660 Q130,760 180,910 Q230,1060 170,1160"
            fill="none"
            stroke="rgba(0,180,160,0.14)"
            strokeWidth="1.5"
          />
          <path
            d="M60,290 Q210,320 240,440 Q270,590 210,690 Q150,790 200,940 Q250,1090 190,1190"
            fill="none"
            stroke="rgba(0,180,160,0.12)"
            strokeWidth="1.5"
          />
          <path
            d="M80,320 Q230,350 260,470 Q290,620 230,720 Q170,820 220,970 Q270,1120 210,1220"
            fill="none"
            stroke="rgba(0,180,160,0.10)"
            strokeWidth="1.5"
          />
          <path
            d="M100,350 Q250,380 280,500 Q310,650 250,750 Q190,850 240,1000 Q290,1150 230,1250"
            fill="none"
            stroke="rgba(0,180,160,0.08)"
            strokeWidth="1.5"
          />
          <path
            d="M120,380 Q270,410 300,530 Q330,680 270,780 Q210,880 260,1030 Q310,1180 250,1280"
            fill="none"
            stroke="rgba(0,180,160,0.06)"
            strokeWidth="1.5"
          />
          <path
            d="M140,410 Q290,440 320,560 Q350,710 290,810 Q230,910 280,1060 Q330,1210 270,1310"
            fill="none"
            stroke="rgba(0,180,160,0.05)"
            strokeWidth="1.5"
          />
        </svg>
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
