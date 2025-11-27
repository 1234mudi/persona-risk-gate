import { useState } from "react";
import { Shield, Users, BarChart3, UserCheck, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { PersonaCard } from "@/components/PersonaCard";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
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

  const personas = [
    {
      icon: UserCheck,
      name: "Risk Owner",
      description: "Approve self-assessments, review final risks, and authorize remediation plans.",
      line: "first" as const,
    },
    {
      icon: ClipboardCheck,
      name: "1st Line Risk Analyst",
      description: "Perform assessments, update risk and control data, and submit evidence for testing.",
      line: "first" as const,
    },
    {
      icon: Users,
      name: "1st Line Risk Manager",
      description: "Plan assessment cycles, track team progress, and ensure timely completion of RCSA tasks.",
      line: "first" as const,
    },
    {
      icon: BarChart3,
      name: "2nd Line Risk Analyst",
      description: "Validate assessments, challenge ratings, and ensure quality across reviews.",
      line: "second" as const,
      route: "/dashboard/2nd-line-analyst",
    },
    {
      icon: Shield,
      name: "Chief Risk Officer",
      description: "Monitor enterprise risk posture, review key metrics, and guide strategic risk decisions.",
      line: "second" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-first-line flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              Risk and Compliance Self Assessment
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
          {/* Login Form Section */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md p-8 shadow-lg border-border/50">
              <div className="space-y-6">
                <div className="space-y-2 text-center">
                  <h2 className="text-3xl font-bold text-foreground">Welcome Back</h2>
                  <p className="text-muted-foreground">
                    Sign in to your workspace to continue
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email or Username</Label>
                    <Input
                      id="email"
                      type="text"
                      placeholder="Enter your email or username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <a
                        href="#"
                        className="text-sm text-primary hover:text-primary/80 transition-colors"
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
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Remember me for 30 days
                    </Label>
                  </div>

                  <Button type="submit" className="w-full h-11 text-base font-medium">
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
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Quick Access</h2>
              <p className="text-muted-foreground">
                Select a persona for instant test environment access
              </p>
            </div>

            <div className="space-y-4">
              {personas.map((persona, index) => (
                <PersonaCard
                  key={index}
                  icon={persona.icon}
                  name={persona.name}
                  description={persona.description}
                  line={persona.line}
                  onSelect={() => handlePersonaLogin(persona.name, (persona as any).route)}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
