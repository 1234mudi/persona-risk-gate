import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  FileText, 
  Sparkles, 
  RotateCcw, 
  Calculator,
  ClipboardList
} from "lucide-react";

interface RiskAssessmentOverviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risk: {
    id: string;
    title: string;
  } | null;
}

interface AssessmentCardProps {
  title: string;
  riskId: string;
  riskName: string;
  completion: number;
  factorsAssessed: string;
  descriptor: string;
  icon: React.ReactNode;
  accentColor: string;
  bgGradient: string;
  primaryCta: { label: string; icon: React.ReactNode };
  secondaryCta: { label: string; icon: React.ReactNode };
}

const AssessmentCard = ({
  title,
  riskId,
  riskName,
  completion,
  factorsAssessed,
  descriptor,
  icon,
  accentColor,
  bgGradient,
  primaryCta,
  secondaryCta,
  sectionKey,
}: AssessmentCardProps & { sectionKey: string }) => {
  const handleNavigate = (action: string) => {
    const baseUrl = "https://risk-zenith-forge.lovable.app/";
    const params = new URLSearchParams({
      section: sectionKey,
      riskId: riskId,
      action: action,
    });
    window.open(`${baseUrl}?${params.toString()}`, "_blank");
  };

  return (
    <Card className={`relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${bgGradient}`}>
      {/* Accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${accentColor}`} />
      
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${accentColor} bg-opacity-20`}>
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground">{descriptor}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-foreground">{completion}%</span>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Risk Info */}
        <div className="bg-background/60 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Risk ID:</span>
            <span className="text-xs font-semibold text-foreground">{riskId}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Risk Name:</span>
            <span className="text-xs font-semibold text-foreground truncate">{riskName}</span>
          </div>
        </div>
        
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Factors Assessed</span>
            <span className="text-xs font-medium text-foreground">{factorsAssessed}</span>
          </div>
          <Progress value={completion} className="h-2" />
        </div>
        
        {/* CTAs */}
        <div className="space-y-2 pt-2">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 h-10 text-sm bg-background/80 hover:bg-background border-border/50"
            onClick={() => handleNavigate("primary")}
          >
            {primaryCta.icon}
            {primaryCta.label}
          </Button>
          <Button 
            className={`w-full justify-start gap-2 h-10 text-sm ${accentColor} text-white hover:opacity-90`}
            onClick={() => handleNavigate("assess")}
          >
            {secondaryCta.icon}
            {secondaryCta.label}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const RiskAssessmentOverviewModal = ({
  open,
  onOpenChange,
  risk,
}: RiskAssessmentOverviewModalProps) => {
  if (!risk) return null;

  const cards = [
    {
      title: "Inherent Rating",
      riskId: risk.id,
      riskName: risk.title,
      completion: 32,
      factorsAssessed: "1 of 15",
      descriptor: "Risk without controls",
      icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
      accentColor: "bg-orange-500",
      bgGradient: "bg-gradient-to-br from-orange-50 to-amber-50/50 dark:from-orange-950/30 dark:to-amber-950/20",
      sectionKey: "inherent-rating",
      primaryCta: {
        label: "Reload from previous cycle",
        icon: <RotateCcw className="w-4 h-4" />,
      },
      secondaryCta: {
        label: "Assess with AI / Manually",
        icon: <Sparkles className="w-4 h-4" />,
      },
    },
    {
      title: "Control Effectiveness",
      riskId: risk.id,
      riskName: risk.title,
      completion: 67,
      factorsAssessed: "8 of 12",
      descriptor: "Control design & operating effectiveness",
      icon: <Shield className="w-5 h-5 text-blue-600" />,
      accentColor: "bg-blue-500",
      bgGradient: "bg-gradient-to-br from-blue-50 to-cyan-50/50 dark:from-blue-950/30 dark:to-cyan-950/20",
      sectionKey: "control-effectiveness",
      primaryCta: {
        label: "Use most recent test results",
        icon: <ClipboardList className="w-4 h-4" />,
      },
      secondaryCta: {
        label: "Assess with AI / Manually",
        icon: <Sparkles className="w-4 h-4" />,
      },
    },
    {
      title: "Residual Rating",
      riskId: risk.id,
      riskName: risk.title,
      completion: 0,
      factorsAssessed: "0 of 15",
      descriptor: "Risk after applying controls",
      icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
      accentColor: "bg-emerald-500",
      bgGradient: "bg-gradient-to-br from-emerald-50 to-green-50/50 dark:from-emerald-950/30 dark:to-green-950/20",
      sectionKey: "residual-rating",
      primaryCta: {
        label: "Auto-calculated",
        icon: <Calculator className="w-4 h-4" />,
      },
      secondaryCta: {
        label: "Assess with AI / Manually",
        icon: <Sparkles className="w-4 h-4" />,
      },
    },
    {
      title: "Risk Treatment",
      riskId: risk.id,
      riskName: risk.title,
      completion: 15,
      factorsAssessed: "1 of 6",
      descriptor: "Mitigation & action plans",
      icon: <FileText className="w-5 h-5 text-purple-600" />,
      accentColor: "bg-purple-500",
      bgGradient: "bg-gradient-to-br from-purple-50 to-violet-50/50 dark:from-purple-950/30 dark:to-violet-950/20",
      sectionKey: "risk-treatment",
      primaryCta: {
        label: "Define Treatment Plan",
        icon: <FileText className="w-4 h-4" />,
      },
      secondaryCta: {
        label: "Assess with AI / Manually",
        icon: <Sparkles className="w-4 h-4" />,
      },
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-muted/50 to-background">
            <h2 className="text-xl font-semibold text-foreground">To-Do: Risk Assessment Overview</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Complete each section to finalize the risk assessment for <span className="font-medium text-foreground">{risk.title}</span>
            </p>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-auto p-6 bg-gradient-to-b from-background to-muted/20">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 h-full">
              {cards.map((card, index) => (
                <AssessmentCard key={index} {...card} />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
