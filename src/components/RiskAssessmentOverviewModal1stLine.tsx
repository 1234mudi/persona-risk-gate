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
  Target
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
  factorsAssessed: string;
  icon: React.ReactNode;
  accentColor: string;
  primaryCta: { label: string; icon: React.ReactNode; action: () => void };
  secondaryCta: { label: string; icon: React.ReactNode; action: () => void };
}

const AssessmentCard = ({
  title,
  riskId,
  riskName,
  completion,
  descriptor,
  factorsAssessed,
  icon,
  accentColor,
  primaryCta,
  secondaryCta,
}: AssessmentCardProps) => {
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
    <div className={`rounded-xl border border-border/50 bg-card shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden`}>
      {/* Accent top border */}
      <div className={`h-1.5 ${accentColor}`} />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${accentColor}/10`}>
              {icon}
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{descriptor}</p>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${getStatusColor()}`}>
            {getStatusLabel()}
          </div>
        </div>

        {/* Risk Info */}
        <div className="bg-muted/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-primary">{riskId}</span>
          </div>
          <p className="text-sm text-foreground font-medium line-clamp-1">{riskName}</p>
        </div>

        {/* Progress Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Completion Progress</span>
            <span className="text-sm font-bold text-foreground">{completion}%</span>
          </div>
          <Progress value={completion} className="h-2" />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-muted-foreground">{factorsAssessed}</span>
            <span className="text-[11px] text-muted-foreground">{completion === 100 ? "Completed" : "In progress"}</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-2">
          <Button 
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs h-9 border-border/50 hover:bg-muted/50"
            onClick={primaryCta.action}
          >
            {primaryCta.icon}
            <span className="ml-2 truncate">{primaryCta.label}</span>
          </Button>
          <Button 
            size="sm"
            className="w-full justify-start text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={secondaryCta.action}
          >
            {secondaryCta.icon}
            <span className="ml-2">{secondaryCta.label}</span>
          </Button>
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

  const handleNavigateToSection = (section: string) => {
    onOpenChange(false);
    navigate(`/risk-assessment?section=${section}&riskId=${encodeURIComponent(risk.id)}&riskName=${encodeURIComponent(risk.title)}`);
  };

  const cards: AssessmentCardProps[] = [
    {
      title: "Inherent Rating",
      riskId: risk.id,
      riskName: risk.title,
      completion: risk.sectionCompletion.inherentRating,
      descriptor: "Risk without controls",
      factorsAssessed: `${Math.round(risk.sectionCompletion.inherentRating * 0.15)} of 15 factors assessed`,
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      accentColor: "bg-amber-500",
      primaryCta: {
        label: "Reload from previous cycle",
        icon: <RotateCcw className="w-3.5 h-3.5" />,
        action: () => handleNavigateToSection("inherent-rating"),
      },
      secondaryCta: {
        label: "Assess with AI / Manually",
        icon: <Sparkles className="w-3.5 h-3.5" />,
        action: () => handleNavigateToSection("inherent-rating"),
      },
    },
    {
      title: "Control Effectiveness",
      riskId: risk.id,
      riskName: risk.title,
      completion: risk.sectionCompletion.controlEffectiveness,
      descriptor: "Evaluate control strength",
      factorsAssessed: `${Math.round(risk.sectionCompletion.controlEffectiveness * 0.12)} of 12 controls assessed`,
      icon: <Shield className="w-5 h-5 text-blue-500" />,
      accentColor: "bg-blue-500",
      primaryCta: {
        label: "Use recent control test results",
        icon: <ClipboardCheck className="w-3.5 h-3.5" />,
        action: () => handleNavigateToSection("control-effectiveness"),
      },
      secondaryCta: {
        label: "Assess with AI / Manually",
        icon: <Sparkles className="w-3.5 h-3.5" />,
        action: () => handleNavigateToSection("control-effectiveness"),
      },
    },
    {
      title: "Residual Rating",
      riskId: risk.id,
      riskName: risk.title,
      completion: risk.sectionCompletion.residualRating,
      descriptor: "Post-control risk level",
      factorsAssessed: `${Math.round(risk.sectionCompletion.residualRating * 0.15)} of 15 factors calculated`,
      icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
      accentColor: "bg-emerald-500",
      primaryCta: {
        label: "Auto-calculated",
        icon: <Calculator className="w-3.5 h-3.5" />,
        action: () => handleNavigateToSection("residual-rating"),
      },
      secondaryCta: {
        label: "Assess with AI / Manually",
        icon: <Sparkles className="w-3.5 h-3.5" />,
        action: () => handleNavigateToSection("residual-rating"),
      },
    },
    {
      title: "Risk Treatment",
      riskId: risk.id,
      riskName: risk.title,
      completion: risk.sectionCompletion.riskTreatment,
      descriptor: "Mitigation & action plans",
      factorsAssessed: `${Math.round(risk.sectionCompletion.riskTreatment * 0.08)} of 8 plans defined`,
      icon: <Target className="w-5 h-5 text-purple-500" />,
      accentColor: "bg-purple-500",
      primaryCta: {
        label: "Define Treatment Plan",
        icon: <FileText className="w-3.5 h-3.5" />,
        action: () => handleNavigateToSection("risk-treatment"),
      },
      secondaryCta: {
        label: "Review & Submit",
        icon: <ArrowRight className="w-3.5 h-3.5" />,
        action: () => handleNavigateToSection("risk-treatment"),
      },
    },
  ];

  const totalCompletion = Math.round(
    (risk.sectionCompletion.inherentRating + 
     risk.sectionCompletion.controlEffectiveness + 
     risk.sectionCompletion.residualRating + 
     risk.sectionCompletion.riskTreatment) / 4
  );
  const completedSections = [
    risk.sectionCompletion.inherentRating,
    risk.sectionCompletion.controlEffectiveness,
    risk.sectionCompletion.residualRating,
    risk.sectionCompletion.riskTreatment,
  ].filter(c => c === 100).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-muted/50 to-background shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">To-Do: Risk Assessment Overview</h2>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-medium text-primary">{risk.id}</span> · {risk.title}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{completedSections}/4</p>
                  <p className="text-xs text-muted-foreground">Sections Done</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{totalCompletion}%</p>
                  <p className="text-xs text-muted-foreground">Overall Progress</p>
                </div>
              </div>
              <Button 
                onClick={() => handleNavigateToSection('inherent-rating')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-10"
              >
                <span>Start Assessment</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
          
          {/* Overall Progress Bar */}
          <div className="mt-4">
            <Progress value={totalCompletion} className="h-2" />
          </div>
        </div>
        
        {/* Content - Grid layout */}
        <div className="flex-1 overflow-auto p-6 bg-gradient-to-b from-background to-muted/20">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 max-w-7xl mx-auto">
            {cards.map((card, index) => (
              <AssessmentCard key={index} {...card} />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
