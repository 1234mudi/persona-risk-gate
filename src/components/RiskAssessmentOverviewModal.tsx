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
  ChevronRight,
  ArrowRight
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
  stepNumber: number;
  isLast: boolean;
}

const AssessmentCard = ({
  title,
  completion,
  factorsAssessed,
  descriptor,
  icon,
  accentColor,
  bgGradient,
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

  const getStatusColor = () => {
    if (completion === 100) return "text-emerald-500";
    if (completion > 0) return "text-amber-500";
    return "text-muted-foreground";
  };

  const getStatusLabel = () => {
    if (completion === 100) return "Complete";
    if (completion > 0) return "In Progress";
    return "Not Started";
  };

  return (
    <div className="flex items-center">
      <div className={`relative flex-1 rounded-xl border border-border/50 ${bgGradient} p-4 hover:shadow-lg transition-all duration-300 group`}>
        {/* Step indicator */}
        <div className={`absolute -top-3 left-4 ${accentColor} text-white text-xs font-bold px-2.5 py-0.5 rounded-full`}>
          Step {stepNumber}
        </div>
        
        {/* Header with icon and completion */}
        <div className="flex items-start justify-between mt-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${accentColor} bg-opacity-20`}>
              {icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground leading-tight">{title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{descriptor}</p>
            </div>
          </div>
        </div>
        
        {/* Progress section */}
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between items-center">
            <span className={`text-xs font-medium ${getStatusColor()}`}>{getStatusLabel()}</span>
            <span className="text-xs text-muted-foreground">{factorsAssessed}</span>
          </div>
          <Progress value={completion} className="h-1.5" />
          <div className="text-right">
            <span className="text-lg font-bold text-foreground">{completion}%</span>
          </div>
        </div>
        
        {/* CTAs - Horizontal layout */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1 text-xs h-8 bg-background/80 hover:bg-background border-border/50"
            onClick={handleNavigate}
          >
            {primaryCta.icon}
            <span className="ml-1.5 truncate">{primaryCta.label}</span>
          </Button>
          <Button 
            size="sm"
            className={`flex-1 text-xs h-8 ${accentColor} text-white hover:opacity-90`}
            onClick={handleNavigate}
          >
            {secondaryCta.icon}
            <span className="ml-1.5 truncate">{secondaryCta.label}</span>
          </Button>
        </div>
      </div>
      
      {/* Connector arrow */}
      {!isLast && (
        <div className="hidden xl:flex items-center justify-center w-8 text-muted-foreground/50">
          <ChevronRight className="w-5 h-5" />
        </div>
      )}
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
      completion: 40,
      factorsAssessed: "6 of 15 reviewed",
      descriptor: "Review risk scoring without controls",
      icon: <AlertTriangle className="w-4 h-4 text-orange-600" />,
      accentColor: "bg-orange-500",
      bgGradient: "bg-gradient-to-br from-orange-50 to-amber-50/50 dark:from-orange-950/30 dark:to-amber-950/20",
      sectionKey: "inherent-rating",
      primaryCta: {
        label: "Compare Cycle",
        icon: <GitCompare className="w-3.5 h-3.5" />,
      },
      secondaryCta: {
        label: "Review",
        icon: <Eye className="w-3.5 h-3.5" />,
      },
    },
    {
      title: "Control Effectiveness",
      riskId: risk.id,
      riskName: risk.title,
      completion: 67,
      factorsAssessed: "8 of 12 reviewed",
      descriptor: "Evaluate design & operating effectiveness",
      icon: <Shield className="w-4 h-4 text-blue-600" />,
      accentColor: "bg-blue-500",
      bgGradient: "bg-gradient-to-br from-blue-50 to-cyan-50/50 dark:from-blue-950/30 dark:to-cyan-950/20",
      sectionKey: "control-effectiveness",
      primaryCta: {
        label: "Test Results",
        icon: <ClipboardList className="w-3.5 h-3.5" />,
      },
      secondaryCta: {
        label: "Review",
        icon: <Eye className="w-3.5 h-3.5" />,
      },
    },
    {
      title: "Residual Rating",
      riskId: risk.id,
      riskName: risk.title,
      completion: 0,
      factorsAssessed: "0 of 15 validated",
      descriptor: "Validate post-control risk scoring",
      icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
      accentColor: "bg-emerald-500",
      bgGradient: "bg-gradient-to-br from-emerald-50 to-green-50/50 dark:from-emerald-950/30 dark:to-green-950/20",
      sectionKey: "residual-rating",
      primaryCta: {
        label: "Auto Score",
        icon: <Calculator className="w-3.5 h-3.5" />,
      },
      secondaryCta: {
        label: "Approve",
        icon: <ThumbsUp className="w-3.5 h-3.5" />,
      },
    },
    {
      title: "Risk Treatment",
      riskId: risk.id,
      riskName: risk.title,
      completion: 17,
      factorsAssessed: "1 of 6 reviewed",
      descriptor: "Review mitigation plans & status",
      icon: <FileText className="w-4 h-4 text-purple-600" />,
      accentColor: "bg-purple-500",
      bgGradient: "bg-gradient-to-br from-purple-50 to-violet-50/50 dark:from-purple-950/30 dark:to-violet-950/20",
      sectionKey: "risk-treatment",
      primaryCta: {
        label: "Treatment Plan",
        icon: <FileText className="w-3.5 h-3.5" />,
      },
      secondaryCta: {
        label: "Approve",
        icon: <Send className="w-3.5 h-3.5" />,
      },
    },
  ];

  const totalCompletion = Math.round(cards.reduce((sum, card) => sum + card.completion, 0) / cards.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] p-0 overflow-hidden">
        <div className="flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-muted/50 to-background">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Risk Assessment Review Workflow</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  <span className="font-medium text-foreground">{risk.id}</span> · {risk.title}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Overall Progress</p>
                  <div className="flex items-center gap-2">
                    <Progress value={totalCompletion} className="w-24 h-2" />
                    <span className="text-sm font-semibold text-foreground">{totalCompletion}%</span>
                  </div>
                </div>
                <Button 
                  onClick={() => handleNavigateToSection('inherent-rating', risk.id, risk.title)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <span>Continue Review</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Content - Horizontal layout */}
          <div className="p-6 bg-gradient-to-b from-background to-muted/20">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-0">
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
