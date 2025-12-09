import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  CheckCircle2,
  Loader2,
  Save,
  Info
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
  onAIAssess: () => void;
  isAIAssessing: boolean;
  hasManualEdits: boolean;
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
  onAIAssess,
  isAIAssessing,
  hasManualEdits,
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
          <div className="flex flex-wrap items-center gap-2">
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
              variant="outline"
              className="text-[11px] h-7 px-2.5 ml-auto"
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
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sectionCompletion, setSectionCompletion] = useState<{
    inherentRating: number;
    controlEffectiveness: number;
    residualRating: number;
    riskTreatment: number;
  } | null>(null);
  const [assessingSection, setAssessingSection] = useState<string | null>(null);
  const [manuallyEditedSections, setManuallyEditedSections] = useState<Record<string, boolean>>({});

  // Load manually edited sections from localStorage when modal opens or risk changes
  useEffect(() => {
    if (open && risk) {
      const storedEdits = JSON.parse(localStorage.getItem('manuallyEditedSections') || '{}');
      setManuallyEditedSections(storedEdits[risk.id] || {});
    }
  }, [open, risk]);

  // Initialize section completion from risk prop
  const currentCompletion = sectionCompletion || risk?.sectionCompletion;

  if (!risk) return null;

  const handleNavigateToSection = (section: string, riskId: string, riskName: string) => {
    onOpenChange(false);
    navigate(`/risk-assessment?section=${section}&riskId=${encodeURIComponent(riskId)}&riskName=${encodeURIComponent(riskName)}&source=1st-line`);
  };

  const handleAIAssess = (sectionKey: string) => {
    setAssessingSection(sectionKey);
    
    // Simulate AI assessment with a brief delay
    setTimeout(() => {
      const keyMap: Record<string, keyof typeof risk.sectionCompletion> = {
        'inherent-rating': 'inherentRating',
        'control-effectiveness': 'controlEffectiveness',
        'residual-rating': 'residualRating',
        'risk-treatment': 'riskTreatment',
      };
      
      const completionKey = keyMap[sectionKey];
      if (completionKey) {
        setSectionCompletion(prev => ({
          ...(prev || risk.sectionCompletion),
          [completionKey]: 100,
        }));
        
        toast({
          title: "AI Assessment Complete",
          description: `All fields in ${sectionKey.replace('-', ' ')} have been auto-populated.`,
        });
        
        // Navigate to the form with aiAssessed param so the form knows to show AI indicators
        onOpenChange(false);
        navigate(`/risk-assessment?section=${sectionKey}&riskId=${encodeURIComponent(risk.id)}&riskName=${encodeURIComponent(risk.title)}&aiAssessed=${sectionKey}&source=1st-line`);
      }
      
      setAssessingSection(null);
    }, 1200);
  };

  const handleOpenSummaryModal = () => {
    setSummaryModalOpen(true);
    generateAISummary();
  };

  const generateAISummary = () => {
    setIsGenerating(true);
    // Simulate AI generating summary based on previous cycle and current risk data
    setTimeout(() => {
      const generatedSummary = `Risk Assessment Summary for ${risk.id} - ${risk.title}

Based on analysis of previous cycle data and current risk details:

**Inherent Risk Assessment:**
The inherent risk level remains elevated due to the nature of operations and external market conditions. Historical data indicates consistent exposure patterns with minor fluctuations.

**Control Environment:**
Current controls demonstrate moderate effectiveness. Recommend reviewing automation opportunities to enhance control reliability and reduce manual intervention points.

**Residual Risk Position:**
After applying existing controls, residual risk falls within acceptable tolerance levels. Continuous monitoring is advised to maintain this position.

**Treatment Recommendations:**
1. Strengthen preventive controls in high-impact areas
2. Implement additional monitoring for emerging risk indicators
3. Schedule quarterly reviews to assess control adequacy

**Overall Assessment:**
This risk is currently being managed within established parameters. No immediate escalation required, but proactive measures should be considered for the upcoming cycle.`;
      
      setAiSummary(generatedSummary);
      setIsGenerating(false);
    }, 1500);
  };

  const handleSaveSummary = () => {
    toast({
      title: "Summary Saved",
      description: "Your AI assessment summary has been saved successfully.",
    });
    setSummaryModalOpen(false);
  };

  const cards = [
    {
      title: "Inherent Rating",
      riskId: risk.id,
      riskName: risk.title,
      completion: currentCompletion?.inherentRating ?? 0,
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
      completion: currentCompletion?.controlEffectiveness ?? 0,
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
      completion: currentCompletion?.residualRating ?? 0,
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
      completion: currentCompletion?.riskTreatment ?? 0,
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
      <DialogContent className="max-w-5xl w-[70vw] p-0 overflow-hidden flex flex-col [&>button]:top-3 [&>button]:right-3 [&>button]:z-10">
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
                className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  // Assess all sections with AI
                  cards.forEach((card, index) => {
                    if (!manuallyEditedSections[card.sectionKey] && card.completion < 100) {
                      setTimeout(() => handleAIAssess(card.sectionKey), index * 300);
                    }
                  });
                }}
                disabled={assessingSection !== null}
              >
                {assessingSection ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{assessingSection ? "Assessing..." : "Assess Documents with AI"}</span>
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={handleOpenSummaryModal}
                className="h-8 text-xs gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>AI Assessment Summary</span>
              </Button>
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
                onAIAssess={() => handleAIAssess(card.sectionKey)}
                isAIAssessing={assessingSection === card.sectionKey}
                hasManualEdits={manuallyEditedSections[card.sectionKey] || false}
              />
            ))}
          </div>
        </div>

        {/* AI Summary Modal */}
        <Dialog open={summaryModalOpen} onOpenChange={setSummaryModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Sparkles className="w-4 h-4 text-primary" />
                AI Assessment Summary
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                AI-generated summary based on previous cycle data and current risk details. Edit as needed.
              </p>
              {isGenerating ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Generating summary...</span>
                </div>
              ) : (
                <Textarea
                  value={aiSummary}
                  onChange={(e) => setAiSummary(e.target.value)}
                  className="min-h-[280px] text-sm leading-relaxed"
                  placeholder="AI summary will appear here..."
                />
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSummaryModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveSummary}
                  disabled={isGenerating || !aiSummary}
                  className="gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Summary
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};
