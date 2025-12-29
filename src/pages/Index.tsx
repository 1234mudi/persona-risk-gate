import { useState } from "react";
import { Shield, Users, BarChart3, UserCheck, ClipboardCheck, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { PersonaCard } from "@/components/PersonaCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      description: "Approves the Risk & Control Self- Assessment(RCSA) results and oversee the status of critical risk remediation actions within the assigned business area.",
      line: "first" as const,
      route: "/dashboard/risk-owner",
    },
    {
      icon: ClipboardCheck,
      name: "1st Line Risk Analyst",
      description: "Executes the Risk & Control Self- Assessment(RCSA) process, involves rating inherent risk, documenting control evidence, and identifying control weaknesses or gaps.",
      line: "first" as const,
      route: "/dashboard/1st-line-analyst",
    },
    {
      icon: Users,
      name: "1st Line Risk Manager",
      description: "Review, validate, and submit the team's completed Risk & Control Self- Assessment(RCSA) package, plus actively manage and track all assigned remediation action plans.",
      line: "first" as const,
    },
  ];

  const secondColumnPersonas = [
    {
      icon: BarChart3,
      name: "2nd Line Risk Analyst",
      description: "Independently review and challenge 1st Line Risk & Control Self- Assessment(RCSA) submissions, validate control effectiveness ratings, and log formal findings or corrections.",
      line: "second" as const,
      route: "/dashboard/2nd-line-analyst",
    },
    {
      icon: Shield,
      name: "Chief Risk Officer",
      description: "Monitor the enterprise-wide aggregated risk posture via dashboards, and authorize organizational risk strategies and material control investments.",
      line: "second" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-first-line/10 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-primary to-first-line flex items-center justify-center">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h1 className="text-base sm:text-lg font-semibold text-foreground leading-tight">
                  <span className="hidden sm:inline">Risk & Control Self- Assessment (RCSA)</span>
                  <span className="sm:hidden">RCSA</span>
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pl-9 sm:pl-10.5 hidden sm:block">
              A comprehensive platform for managing enterprise risk assessments, control evaluations, and remediation tracking across your organization.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-2 sm:py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 max-w-7xl mx-auto items-start">
          {/* Login Form Section */}
          <div className="flex items-start justify-center lg:justify-end order-1 lg:order-1">
            <Card className="w-full max-w-md p-3 sm:p-5 shadow-lg border-border/50">
              <div className="space-y-4">
                <div className="space-y-0.5 text-center">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">Welcome Back</h2>
                  <p className="text-xs text-muted-foreground">
                    Sign in to your workspace to continue
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm">Email or Username</Label>
                    <Input
                      id="email"
                      type="text"
                      placeholder="Enter your email or username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 sm:h-9"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm">Password</Label>
                      <a
                        href="#"
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        Forgot password?
                      </a>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 sm:h-9"
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2 min-h-[44px]">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      className="h-5 w-5"
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Remember me for 30 days
                    </Label>
                  </div>

                  <Button type="submit" className="w-full h-11 sm:h-9 text-sm font-medium">
                    Sign In
                  </Button>
                </form>

                <div className="text-center text-sm text-muted-foreground">
                  Need help? Contact{" "}
                  <a href="#" className="text-primary hover:text-primary/80 transition-colors">
                    support@rcsa.com
                  </a>
                </div>
              </div>
            </Card>
          </div>

          {/* Persona Cards Section */}
          <div className="space-y-3 order-2 lg:order-2">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Quick Access</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Select your role to access the test environment
              </p>
            </div>

            {/* 1st Line Defense Section */}
            <div className="rounded-xl border border-first-line/20 bg-first-line/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-first-line"></div>
                <h3 className="text-sm font-semibold text-first-line">1st Line Defense</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <div className="rounded-xl border border-second-line/20 bg-second-line/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-second-line"></div>
                <h3 className="text-sm font-semibold text-second-line">2nd Line Defense</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
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
      </main>
    </div>
  );
};

export default Index;