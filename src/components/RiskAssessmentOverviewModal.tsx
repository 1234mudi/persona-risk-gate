import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  FileText, 
  GitCompare, 
  Calculator,
  ClipboardList,
  Eye,
  Send,
  ThumbsUp,
  ArrowRight,
  Circle,
  CheckCircle2
} from "lucide-react";

interface RiskAssessmentOverviewModalProps {
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
    if (completion === 100) return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (completion > 0) return <Circle className="w-5 h-5 text-amber-500 fill-amber-500/20" />;
    return <Circle className="w-5 h-5 text-muted-foreground" />;
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
      <div className="flex flex-col items-center mr-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted border border-border text-muted-foreground font-bold text-sm">
          {stepNumber}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 mt-2 bg-border" />
        )}
      </div>

      {/* Card content */}
      <div className="flex-1 mb-4 rounded-xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-200">
        <div className="p-4">
          {/* Header row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted/50">
                {icon}
              </div>
              <div>
                <h3 
                  className="text-base font-semibold text-foreground hover:text-primary cursor-pointer transition-colors"
                  onClick={handleNavigate}
                >
                  {title}
                </h3>
                <p className="text-xs text-muted-foreground">{descriptor}</p>
              </div>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
              {getStatusLabel()}
            </div>
          </div>

          {/* Progress and CTAs row */}
          <div className="flex items-center gap-6">
            {/* Progress */}
            <div className="flex items-center gap-3 min-w-[200px]">
              <div className="flex-1">
                <Progress value={completion} className="h-2" />
              </div>
              <span className="text-sm font-semibold text-foreground w-12">{completion}%</span>
            </div>

            {/* CTA */}
            <div className="flex gap-2 ml-auto">
              <Button 
                size="sm"
                className="text-xs h-8 bg-muted text-foreground hover:bg-muted/80"
                onClick={handleNavigate}
              >
                {secondaryCta.icon}
                <span className="ml-1.5">Continue</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RiskAssessmentOverviewModal = ({
  open,
  onOpenChange,
  risk,
}: RiskAssessmentOverviewModalProps) => {
  const navigate = useNavigate();

  if (!risk) return null;

  const handleNavigateToSection = (section: string, riskId: string, riskName: string) => {
    onOpenChange(false);
    navigate(`/risk-assessment?section=${section}&riskId=${encodeURIComponent(riskId)}&riskName=${encodeURIComponent(riskName)}`);
  };

  const cards = [
    {
      title: "Inherent Rating Review",
      riskId: risk.id,
      riskName: risk.title,
      completion: risk.sectionCompletion.inherentRating,
      descriptor: "Review risk scoring without controls",
      icon: <AlertTriangle className="w-5 h-5 text-muted-foreground" />,
      sectionKey: "inherent-rating",
      primaryCta: {
        label: "Compare with Previous Cycle",
        icon: <GitCompare className="w-3.5 h-3.5" />,
      },
      secondaryCta: {
        label: "Review & Challenge",
        icon: <Eye className="w-3.5 h-3.5" />,
      },
    },
    {
      title: "Control Effectiveness Review",
      riskId: risk.id,
      riskName: risk.title,
      completion: risk.sectionCompletion.controlEffectiveness,
      descriptor: "Evaluate design & operating effectiveness",
      icon: <Shield className="w-5 h-5 text-muted-foreground" />,
      sectionKey: "control-effectiveness",
      primaryCta: {
        label: "View Latest Control Test Results",
        icon: <ClipboardList className="w-3.5 h-3.5" />,
      },
      secondaryCta: {
        label: "Review & Challenge",
        icon: <Eye className="w-3.5 h-3.5" />,
      },
    },
    {
      title: "Residual Rating Validation",
      riskId: risk.id,
      riskName: risk.title,
      completion: risk.sectionCompletion.residualRating,
      descriptor: "Validate post-control risk scoring",
      icon: <CheckCircle className="w-5 h-5 text-muted-foreground" />,
      sectionKey: "residual-rating",
      primaryCta: {
        label: "View Auto-Calculated Score",
        icon: <Calculator className="w-3.5 h-3.5" />,
      },
      secondaryCta: {
        label: "Approve or Challenge",
        icon: <ThumbsUp className="w-3.5 h-3.5" />,
      },
    },
    {
      title: "Risk Treatment Oversight",
      riskId: risk.id,
      riskName: risk.title,
      completion: risk.sectionCompletion.riskTreatment,
      descriptor: "Review mitigation plans & status",
      icon: <FileText className="w-5 h-5 text-muted-foreground" />,
      sectionKey: "risk-treatment",
      primaryCta: {
        label: "Review Treatment Plan",
        icon: <FileText className="w-3.5 h-3.5" />,
      },
      secondaryCta: {
        label: "Approve / Send Back",
        icon: <Send className="w-3.5 h-3.5" />,
      },
    },
  ];

  const totalCompletion = Math.round(cards.reduce((sum, card) => sum + card.completion, 0) / cards.length);
  const completedSteps = cards.filter(c => c.completion === 100).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-muted/50 to-background shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">To-Do: Risk Assessment Overview</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                <span className="font-medium text-foreground">{risk.id}</span> · {risk.title}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{completedSteps}/{cards.length}</p>
                  <p className="text-xs text-muted-foreground">Steps Done</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{totalCompletion}%</p>
                  <p className="text-xs text-muted-foreground">Overall</p>
                </div>
              </div>
              <Button 
                onClick={() => handleNavigateToSection('inherent-rating', risk.id, risk.title)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Content - Vertical timeline layout */}
        <div className="flex-1 overflow-auto p-6 bg-gradient-to-b from-background to-muted/20">
          <div className="max-w-3xl mx-auto">
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
