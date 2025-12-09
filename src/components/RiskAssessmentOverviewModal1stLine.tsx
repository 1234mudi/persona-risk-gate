import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Info,
  Upload,
  Download,
  AlertCircle,
  Pencil,
  Check
} from "lucide-react";

// Helper function to render markdown-like formatting
const renderFormattedText = (text: string) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  
  return lines.map((line, index) => {
    // Process bold (**text**)
    let processedLine = line.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    // Process italic (*text*)
    processedLine = processedLine.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic">$1</em>');
    
    if (line.trim() === '') {
      return <br key={index} />;
    }
    
    return (
      <p 
        key={index} 
        className="text-sm leading-relaxed text-foreground"
        dangerouslySetInnerHTML={{ __html: processedLine }}
      />
    );
  });
};
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { SingleRiskDocumentModal } from "./SingleRiskDocumentModal";

interface IssueItem {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  dateIdentified: string;
  owner: string;
}

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
  assessmentIssues?: IssueItem[];
  activeRelatedIssues?: IssueItem[];
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
  isIssuesCard?: boolean;
  issuesData?: {
    newIssues: number;
    criticality: Array<{ label: string; count: number; color: string }>;
  };
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
  isIssuesCard = false,
  issuesData,
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
    if (isIssuesCard && issuesData) {
      return `${issuesData.newIssues} New`;
    }
    if (completion === 100) return "Complete";
    if (completion > 0) return "In Progress";
    return "Not Started";
  };

  const getStatusColor = () => {
    if (isIssuesCard) return "text-blue-600 bg-blue-500/10";
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
      <div 
        className="flex-1 mb-3 rounded-lg border border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={handleNavigate}
      >
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

          {/* Issues Card - Criticality Chips */}
          {isIssuesCard && issuesData ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-muted-foreground">Criticality:</span>
              {issuesData.criticality.map((item, idx) => (
                <Badge 
                  key={idx}
                  className={`${item.color} text-white text-[10px] px-2 py-0.5 cursor-pointer hover:opacity-80`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(sectionKey, riskId, riskName);
                  }}
                >
                  {item.label}: {item.count}
                </Badge>
              ))}
            </div>
          ) : (
            <>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigate(e);
                  }}
                >
                  {primaryCta.icon}
                  <span className="ml-1">{primaryCta.label}</span>
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  className="text-[11px] h-7 px-2.5 ml-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigate(e);
                  }}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="ml-1">Assess Manually</span>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const RiskAssessmentOverviewModal1stLine = ({
  open,
  onOpenChange,
  risk,
  assessmentIssues = [],
  activeRelatedIssues = [],
}: RiskAssessmentOverviewModal1stLineProps) => {
  const navigate = useNavigate();
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
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
    // For issues section, add openPanel param to open the issues slider
    const panelParam = section === 'issues' ? '&openPanel=issues' : '';
    navigate(`/risk-assessment?section=${section}&riskId=${encodeURIComponent(riskId)}&riskName=${encodeURIComponent(riskName)}&source=1st-line${panelParam}`);
  };

  // Calculate issues data from props
  const allIssues = [...assessmentIssues, ...activeRelatedIssues];
  const newIssuesCount = assessmentIssues.length;
  const highCount = allIssues.filter(i => i.severity === 'High').length;
  const mediumCount = allIssues.filter(i => i.severity === 'Medium').length;
  const lowCount = allIssues.filter(i => i.severity === 'Low').length;

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
      title: "Issues",
      riskId: risk.id,
      riskName: risk.title,
      completion: 100,
      descriptor: "New issues identified",
      icon: <AlertCircle className="w-4 h-4 text-muted-foreground" />,
      sectionKey: "issues",
      primaryCta: {
        label: "View Issues",
        icon: <AlertCircle className="w-3.5 h-3.5" />,
      },
      secondaryCta: {
        label: "Review Issues",
        icon: <ArrowRight className="w-3.5 h-3.5" />,
      },
      isIssuesCard: true,
      issuesData: {
        newIssues: newIssuesCount,
        criticality: [
          ...(highCount > 0 ? [{ label: "High", count: highCount, color: "bg-red-500" }] : []),
          ...(mediumCount > 0 ? [{ label: "Medium", count: mediumCount, color: "bg-amber-500" }] : []),
          ...(lowCount > 0 ? [{ label: "Low", count: lowCount, color: "bg-blue-500" }] : []),
        ]
      }
    },
  ];

  const totalCompletion = Math.round(cards.reduce((sum, card) => sum + card.completion, 0) / cards.length);
  const completedSteps = cards.filter(c => c.completion === 100).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[70vw] p-0 overflow-hidden flex flex-col [&>button]:top-3 [&>button]:right-3 [&>button]:z-10">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-muted/50 to-background shrink-0 pr-12">
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
                onClick={() => setDocumentModalOpen(true)}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Assess Documents with AI</span>
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={handleOpenSummaryModal}
                className="h-8 text-xs gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary fill-primary/20" />
                <span>Assessment Summary</span>
              </Button>
              <Button 
                size="sm"
                onClick={() => handleNavigateToSection('inherent-rating', risk.id, risk.title)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs"
              >
                Continue
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
                <Sparkles className="w-4 h-4 text-primary fill-primary/20" />
                Assessment Summary
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Generated summary based on previous cycle data and current risk details. Edit as needed.
              </p>
              {isGenerating ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Generating summary...</span>
                </div>
              ) : isEditingSummary ? (
                <Textarea
                  value={aiSummary}
                  onChange={(e) => setAiSummary(e.target.value)}
                  className="min-h-[280px] text-sm leading-relaxed"
                  placeholder="Summary will appear here..."
                />
              ) : (
                <ScrollArea className="min-h-[280px] max-h-[280px] rounded-md border border-border p-3 bg-muted/30">
                  <div className="space-y-1">
                    {renderFormattedText(aiSummary)}
                  </div>
                </ScrollArea>
              )}
              
              {/* Edit Toggle Button */}
              {!isGenerating && aiSummary && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingSummary(!isEditingSummary)}
                    className="gap-1.5 text-xs"
                  >
                    {isEditingSummary ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Done Editing
                      </>
                    ) : (
                      <>
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </>
                    )}
                  </Button>
                </div>
              )}
              <div className="flex justify-between gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const blob = new Blob([aiSummary], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `assessment-summary-${risk.id}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast({
                      title: "Summary Exported",
                      description: "The summary has been downloaded as a text file.",
                    });
                  }}
                  disabled={isGenerating || !aiSummary}
                  className="gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </Button>
                <div className="flex gap-2">
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
            </div>
          </DialogContent>
        </Dialog>

        {/* Single Risk Document Search Modal */}
        <SingleRiskDocumentModal
          open={documentModalOpen}
          onOpenChange={setDocumentModalOpen}
          risk={risk ? { id: risk.id, title: risk.title } : null}
          onApplyChanges={(changes) => {
            toast({
              title: "Changes Applied",
              description: `Risk ${risk?.id} has been updated with document data.`,
            });
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
