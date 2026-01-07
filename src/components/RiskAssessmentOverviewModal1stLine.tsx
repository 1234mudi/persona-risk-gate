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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Check,
  BarChart3
} from "lucide-react";
import pptxgen from "pptxgenjs";

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
import { RiskTraversalNav } from "./RiskTraversalNav";

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
  // Traversal props
  showTraversal?: boolean;
  currentIndex?: number;
  totalCount?: number;
  isFirst?: boolean;
  isLast?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  isReviewMode?: boolean;
  reviewProgress?: { current: number; total: number } | null;
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
      <div className="flex flex-col items-center mr-2">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted border border-border text-muted-foreground font-bold text-[10px]">
          {stepNumber}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 mt-1 bg-border" />
        )}
      </div>

      {/* Card content */}
      <div 
        className="flex-1 mb-2 rounded-lg border border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={handleNavigate}
      >
        <div className="p-2">
          {/* Header row */}
          <div className="flex items-start justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-md bg-muted/50">
                {icon}
              </div>
              <div>
                <h3 
                  className="group text-xs font-semibold text-primary hover:text-primary/80 cursor-pointer transition-colors flex items-center gap-1 underline underline-offset-2 decoration-primary/40 hover:decoration-primary"
                >
                  {title}
                  <ArrowRight className="w-2.5 h-2.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-[10px] text-muted-foreground">{descriptor}</p>
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
                
                {/* Assess with AI Button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="sm"
                        variant="outline"
                        className="text-[11px] h-7 px-2.5 bg-primary/5 hover:bg-primary/10 border-primary/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAIAssess();
                        }}
                        disabled={isAIAssessing}
                      >
                        {isAIAssessing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                        )}
                        <span className="ml-1">
                          {isAIAssessing ? "Assessing..." : "Assess with AI"}
                        </span>
                        {hasManualEdits && !isAIAssessing && (
                          <AlertCircle className="w-3 h-3 text-amber-500 ml-1" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    {hasManualEdits && (
                      <TooltipContent>
                        <p className="text-xs">Manual edits exist - AI may override</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                
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
  showTraversal = false,
  currentIndex = 0,
  totalCount = 0,
  isFirst = true,
  isLast = true,
  onNext,
  onPrevious,
  isReviewMode = false,
  reviewProgress,
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

  // Calculate issues data from props - only consider new issues (assessmentIssues)
  const newIssuesCount = assessmentIssues.length;
  const highCount = assessmentIssues.filter(i => i.severity === 'High').length;
  const mediumCount = assessmentIssues.filter(i => i.severity === 'Medium').length;
  const lowCount = assessmentIssues.filter(i => i.severity === 'Low').length;

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

  // Export helper functions
  const getSanitizedFilename = () => {
    return `assessment-summary-${risk.id}`.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
  };

  const generatePDF = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Assessment Summary - ${risk.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .meta { color: #666; margin-bottom: 20px; }
            .content { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>Assessment Summary</h1>
          <div class="meta">
            <p><strong>Risk ID:</strong> ${risk.id}</p>
            <p><strong>Risk Title:</strong> ${risk.title}</p>
            <p><strong>Export Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div class="content">${aiSummary.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
    toast({ title: "PDF Export", description: "Print dialog opened for PDF export." });
  };

  const generateExcel = () => {
    const csvContent = `Risk ID,Risk Title,Export Date,Summary\n"${risk.id}","${risk.title}","${new Date().toLocaleDateString()}","${aiSummary.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getSanitizedFilename()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Excel Export", description: "Summary exported as CSV file." });
  };

  const generateWord = () => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
        <head><meta charset="utf-8"><title>Assessment Summary</title></head>
        <body>
          <h1>Assessment Summary</h1>
          <p><strong>Risk ID:</strong> ${risk.id}</p>
          <p><strong>Risk Title:</strong> ${risk.title}</p>
          <p><strong>Export Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <hr/>
          <div>${aiSummary.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</div>
        </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getSanitizedFilename()}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Word Export", description: "Summary exported as Word document." });
  };

  // Helper function to parse AI summary into sections
  const parseAISummaryToSections = (summary: string) => {
    const defaultText = "No data available for this section.";
    
    const inherentMatch = summary.match(/\*\*Inherent Risk Assessment:\*\*\s*([\s\S]*?)(?=\*\*Control|$)/);
    const controlMatch = summary.match(/\*\*Control Environment:\*\*\s*([\s\S]*?)(?=\*\*Residual|$)/);
    const residualMatch = summary.match(/\*\*Residual Risk Position:\*\*\s*([\s\S]*?)(?=\*\*Treatment|$)/);
    const treatmentMatch = summary.match(/\*\*Treatment Recommendations:\*\*\s*([\s\S]*?)(?=\*\*Overall|$)/);
    const overallMatch = summary.match(/\*\*Overall Assessment:\*\*\s*([\s\S]*?)$/);
    
    return {
      inherentRating: inherentMatch ? inherentMatch[1].trim() : defaultText,
      controlEffectiveness: controlMatch ? controlMatch[1].trim() : defaultText,
      residualRating: residualMatch ? residualMatch[1].trim() : defaultText,
      treatment: treatmentMatch ? treatmentMatch[1].trim() : defaultText,
      overall: overallMatch ? overallMatch[1].trim() : "This risk is currently being managed within established parameters."
    };
  };

  const generatePPT = () => {
    const pptx = new pptxgen();
    pptx.title = `Assessment Summary - ${risk.id}`;
    pptx.author = "Risk Assessment System";
    
    const sections = parseAISummaryToSections(aiSummary);
    
    // Slide 1: Title
    const slide1 = pptx.addSlide();
    slide1.addText(risk.title, { x: 0.5, y: 2, w: 9, h: 1.2, fontSize: 36, bold: true, color: "1d4ed8" });
    slide1.addText("Risk Assessment Summary", { x: 0.5, y: 3.3, w: 9, h: 0.5, fontSize: 20, color: "6b7280" });
    slide1.addText(`Risk ID: ${risk.id}`, { x: 0.5, y: 3.9, w: 9, h: 0.4, fontSize: 14, color: "9ca3af" });
    slide1.addText(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { x: 0.5, y: 4.4, w: 9, h: 0.4, fontSize: 14, color: "9ca3af" });

    // Slide 2: Assessment Summary Overview
    const slide2 = pptx.addSlide();
    slide2.addText("Assessment Summary", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, bold: true, color: "1d4ed8" });
    
    const summaryItems = [
      { title: "Inherent Risk Assessment", text: sections.inherentRating.substring(0, 200) + (sections.inherentRating.length > 200 ? "..." : "") },
      { title: "Control Environment", text: sections.controlEffectiveness.substring(0, 200) + (sections.controlEffectiveness.length > 200 ? "..." : "") },
      { title: "Residual Risk Position", text: sections.residualRating.substring(0, 200) + (sections.residualRating.length > 200 ? "..." : "") },
      { title: "Treatment Recommendations", text: sections.treatment.substring(0, 200) + (sections.treatment.length > 200 ? "..." : "") }
    ];
    
    let yPos = 1;
    summaryItems.forEach((item) => {
      slide2.addText(item.title, { x: 0.5, y: yPos, w: 9, h: 0.35, fontSize: 14, bold: true, color: "374151" });
      slide2.addText(item.text, { x: 0.5, y: yPos + 0.35, w: 9, h: 0.7, fontSize: 11, color: "6b7280", valign: "top" });
      yPos += 1.2;
    });

    // Slide 3: Inherent Risk Assessment (detailed)
    const slide3 = pptx.addSlide();
    slide3.addText("Inherent Risk Assessment", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, bold: true, color: "1d4ed8" });
    slide3.addText(sections.inherentRating, { x: 0.5, y: 1, w: 9, h: 4, fontSize: 14, color: "374151", valign: "top" });

    // Slide 4: Control Environment (detailed)
    const slide4 = pptx.addSlide();
    slide4.addText("Control Environment", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, bold: true, color: "1d4ed8" });
    slide4.addText(sections.controlEffectiveness, { x: 0.5, y: 1, w: 9, h: 4, fontSize: 14, color: "374151", valign: "top" });

    // Slide 5: Residual Risk Position (detailed)
    const slide5 = pptx.addSlide();
    slide5.addText("Residual Risk Position", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, bold: true, color: "1d4ed8" });
    slide5.addText(sections.residualRating, { x: 0.5, y: 1, w: 9, h: 4, fontSize: 14, color: "374151", valign: "top" });

    // Slide 6: Treatment Recommendations (detailed)
    const slide6 = pptx.addSlide();
    slide6.addText("Treatment Recommendations", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, bold: true, color: "1d4ed8" });
    slide6.addText(sections.treatment, { x: 0.5, y: 1, w: 9, h: 4, fontSize: 14, color: "374151", valign: "top" });

    // Slide 7: Overall Assessment
    const slide7 = pptx.addSlide();
    slide7.addText("Overall Assessment", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, bold: true, color: "1d4ed8" });
    slide7.addText(sections.overall, { x: 0.5, y: 1, w: 9, h: 3.5, fontSize: 14, color: "374151", valign: "top" });
    slide7.addText(`Risk ID: ${risk.id}`, { x: 0.5, y: 4.5, w: 4, h: 0.4, fontSize: 12, color: "6b7280" });
    slide7.addText(`Assessment Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { x: 5, y: 4.5, w: 4, h: 0.4, fontSize: 12, color: "6b7280" });

    pptx.writeFile({ fileName: `${getSanitizedFilename()}.pptx` });
    toast({ title: "PowerPoint Export", description: "Summary exported as PowerPoint presentation." });
  };

  const handleExport = (format: string) => {
    switch (format) {
      case 'PDF': generatePDF(); break;
      case 'Excel': generateExcel(); break;
      case 'Word': generateWord(); break;
      case 'PPT': generatePPT(); break;
    }
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
      <DialogContent className="sm:max-w-2xl w-[95vw] p-0 overflow-hidden flex flex-col max-h-[90vh] [&>button]:top-2 [&>button]:right-2 [&>button]:z-10">
        {/* Header */}
        <div className="px-3 py-2 border-b border-border bg-gradient-to-r from-muted/50 to-background shrink-0 pr-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{risk.title}</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                <span className="font-medium text-foreground">{risk.id}</span> · To-Do: Risk Assessment Overview
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{completedSteps}/{cards.length}</p>
                  <p className="text-[9px] text-muted-foreground">Steps Done</p>
                </div>
                <div className="h-6 w-px bg-border" />
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{totalCompletion}%</p>
                  <p className="text-[9px] text-muted-foreground">Overall</p>
                </div>
              </div>
              <Button 
                size="sm"
                variant="outline"
                onClick={handleOpenSummaryModal}
                className="h-7 text-[11px] gap-1 border-2 border-green-500"
              >
                <Sparkles className="w-3 h-3 text-primary fill-primary/20" />
                <span>Summary</span>
              </Button>
              <Button 
                size="sm"
                onClick={() => handleNavigateToSection('inherent-rating', risk.id, risk.title)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-7 text-[11px]"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
        
        {/* Content - Vertical timeline layout */}
        <div className="flex-1 overflow-auto p-3 bg-gradient-to-b from-background to-muted/20">
          <div>
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

        {/* Footer with navigation */}
        {showTraversal && onNext && onPrevious && (
          <div className="px-3 py-2 border-t border-border bg-muted/30 shrink-0 flex justify-center">
            <RiskTraversalNav
              currentIndex={currentIndex}
              totalCount={totalCount}
              isFirst={isFirst}
              isLast={isLast}
              onNext={onNext}
              onPrevious={onPrevious}
              isReviewMode={isReviewMode}
              reviewProgress={reviewProgress}
            />
          </div>
        )}

        {/* AI Summary Modal */}
        <Dialog open={summaryModalOpen} onOpenChange={setSummaryModalOpen}>
          <DialogContent className="sm:max-w-lg w-[95vw] flex flex-col max-h-[80vh]">
            <DialogHeader className="shrink-0">
              <DialogTitle className="flex items-center gap-2 text-base">
                <Sparkles className="w-4 h-4 text-primary fill-primary/20" />
                Assessment Summary
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
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
              <div className="overflow-hidden">
                <ScrollArea className="h-[280px] rounded-md border border-border p-3 bg-muted/30">
                  <div className="space-y-1 pr-3">
                    {renderFormattedText(aiSummary)}
                  </div>
                </ScrollArea>
              </div>
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
            </div>
            
            {/* Fixed footer - always visible */}
            <div className="flex justify-between gap-2 pt-3 border-t border-border shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isGenerating || !aiSummary}
                    className="gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-background border border-border z-50">
                  <DropdownMenuItem onClick={() => handleExport('PDF')} className="cursor-pointer">
                    <FileText className="w-4 h-4 text-red-500 mr-2" />
                    PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('Word')} className="cursor-pointer">
                    <FileText className="w-4 h-4 text-blue-500 mr-2" />
                    Word
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('Excel')} className="cursor-pointer">
                    <BarChart3 className="w-4 h-4 text-emerald-500 mr-2" />
                    Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('PPT')} className="cursor-pointer">
                    <FileText className="w-4 h-4 text-orange-500 mr-2" />
                    PowerPoint
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
