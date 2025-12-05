import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  FileText,
  RotateCcw,
  Sparkles,
  ClipboardCheck,
  Calculator,
  ArrowRight,
  Target,
  Circle,
  CheckCircle2
} from "lucide-react";

interface RiskAssessmentOverviewModal1stLineProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risk: {
    id: string;
    title: string;
    sectionCompletion: {
      inherentRating: number;
      controlEffectiveness: number;
      residualRating: number;
      riskTreatment: number;
    };
  } | null;
}

interface AssessmentCardProps {
  title: string;
  riskId: string;
  riskName: string;
  completion: number;
  descriptor: string;
  icon: React.ReactNode;
  
  primaryCta: { label: string; icon: React.ReactNode };
  secondaryCta: { label: string; icon: React.ReactNode };
  stepNumber: number;
  isLast: boolean;
}

const AssessmentCard = ({
  title,
  completion,
  descriptor,
  icon,
  
  primaryCta,
  secondaryCta,
  sectionKey,
  stepNumber,
  isLast,
  onNavigate,
  riskId,
  riskName,
}: AssessmentCardProps & { sectionKey: string; onNavigate: (section: string, riskId: string, riskName: string) => void }) => {
  const handleNavigate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onNavigate(sectionKey, riskId, riskName);
  };

  const getStatusIcon = () => {
    if (completion === 100) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (completion > 0) return <Circle className="w-4 h-4 text-amber-500 fill-amber-500/20" />;
    return <Circle className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusLabel = () => {
    if (completion === 100) return "Complete";
    if (completion > 0) return "In Progress";
    return "Not Started";
  };

  const getStatusColor = () => {
    if (completion === 100) return "text-emerald-500 bg-emerald-500/10";
    if (completion > 0) return "text-amber-500 bg-amber-500/10";
    return "text-muted-foreground bg-muted";
  };

  return (
    <div className="flex">
      {/* Timeline indicator */}
      <div className="flex flex-col items-center mr-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted border border-border text-muted-foreground font-bold text-xs">
          {stepNumber}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 mt-1.5 bg-border" />
        )}
      </div>

      {/* Card content */}
      <div className="flex-1 mb-3 rounded-lg border border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-200">
        <div className="p-3">
          {/* Header row */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-muted/50">
                {icon}
              </div>
              <div>
                <h3 
                  className="group text-sm font-semibold text-primary hover:text-primary/80 cursor-pointer transition-colors flex items-center gap-1 underline underline-offset-2 decoration-primary/40 hover:decoration-primary"
                  onClick={handleNavigate}
                >
                  {title}
                  <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-[11px] text-muted-foreground">{descriptor}</p>
              </div>
            </div>
            <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor()}`}>
              {getStatusLabel()}
            </div>
          </div>

          {/* Progress row */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1">
              <Progress value={completion} className="h-1.5" />
            </div>
            <span className="text-xs font-semibold text-foreground w-10">{completion}%</span>
          </div>

          {/* Action buttons row */}
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm"
              variant="outline"
              className="text-[11px] h-7 px-2.5"
              onClick={handleNavigate}
            >
              {primaryCta.icon}
              <span className="ml-1">{primaryCta.label}</span>
            </Button>
            <Button 
              size="sm"
              className="text-[11px] h-7 px-2.5 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleNavigate}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="ml-1">Assess with AI</span>
            </Button>
            <Button 
              size="sm"
              variant="outline"
              className="text-[11px] h-7 px-2.5"
              onClick={handleNavigate}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="ml-1">Assess Manually</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RiskAssessmentOverviewModal1stLine = ({
  open,
  onOpenChange,
  risk,
}: RiskAssessmentOverviewModal1stLineProps) => {
  const navigate = useNavigate();

  if (!risk) return null;

  const handleNavigateToSection = (section: string, riskId: string, riskName: string) => {
    onOpenChange(false);
    navigate(`/risk-assessment?section=${section}&riskId=${encodeURIComponent(riskId)}&riskName=${encodeURIComponent(riskName)}`);
  };

  const cards = [
    {
      title: "Inherent Rating",
      riskId: risk.id,
      riskName: risk.title,
      completion: risk.sectionCompletion.inherentRating,
      descriptor: "Risk without controls",
      icon: <AlertTriangle className="w-4 h-4 text-muted-foreground" />,
      sectionKey: "inherent-rating",
      primaryCta: {
        label: "Reload from previous cycle",
        icon: <RotateCcw className="w-3.5 h-3.5" />,
      },
      secondaryCta: {
        label: "Assess with AI / Manually",
        icon: <Sparkles className="w-3.5 h-3.5" />,
      },
    },
    {
      title: "Control Effectiveness",
      riskId: risk.id,
      riskName: risk.title,
      completion: risk.sectionCompletion.controlEffectiveness,
      descriptor: "Evaluate control strength",
      icon: <Shield className="w-4 h-4 text-muted-foreground" />,
      sectionKey: "control-effectiveness",
      primaryCta: {
        label: "Use recent control test results",
        icon: <ClipboardCheck className="w-3.5 h-3.5" />,
      },
      secondaryCta: {
        label: "Assess with AI / Manually",
        icon: <Sparkles className="w-3.5 h-3.5" />,
      },
    },
    {
      title: "Residual Rating",
      riskId: risk.id,
      riskName: risk.title,
      completion: risk.sectionCompletion.residualRating,
      descriptor: "Post-control risk level",
      icon: <CheckCircle className="w-4 h-4 text-muted-foreground" />,
      sectionKey: "residual-rating",
      primaryCta: {
        label: "Auto-calculated",
        icon: <Calculator className="w-3.5 h-3.5" />,
      },
      secondaryCta: {
        label: "Assess with AI / Manually",
        icon: <Sparkles className="w-3.5 h-3.5" />,
      },
    },
    {
      title: "Risk Treatment",
      riskId: risk.id,
      riskName: risk.title,
      completion: risk.sectionCompletion.riskTreatment,
      descriptor: "Mitigation & action plans",
      icon: <Target className="w-4 h-4 text-muted-foreground" />,
      sectionKey: "risk-treatment",
      primaryCta: {
        label: "Define Treatment Plan",
        icon: <FileText className="w-3.5 h-3.5" />,
      },
      secondaryCta: {
        label: "Review & Submit",
        icon: <ArrowRight className="w-3.5 h-3.5" />,
      },
    },
  ];

  const totalCompletion = Math.round(cards.reduce((sum, card) => sum + card.completion, 0) / cards.length);
  const completedSteps = cards.filter(c => c.completion === 100).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[85vw] p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-muted/50 to-background shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">To-Do: Risk Assessment Overview</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="font-medium text-foreground">{risk.id}</span> · {risk.title}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-xl font-bold text-foreground">{completedSteps}/{cards.length}</p>
                  <p className="text-[10px] text-muted-foreground">Steps Done</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <p className="text-xl font-bold text-foreground">{totalCompletion}%</p>
                  <p className="text-[10px] text-muted-foreground">Overall</p>
                </div>
              </div>
              <Button 
                size="sm"
                onClick={() => handleNavigateToSection('inherent-rating', risk.id, risk.title)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Content - Vertical timeline layout */}
        <div className="flex-1 overflow-auto p-4 bg-gradient-to-b from-background to-muted/20">
          <div className="max-w-xl mx-auto">
            {cards.map((card, index) => (
              <AssessmentCard 
                key={index} 
                {...card} 
                stepNumber={index + 1}
                isLast={index === cards.length - 1}
                onNavigate={handleNavigateToSection} 
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
