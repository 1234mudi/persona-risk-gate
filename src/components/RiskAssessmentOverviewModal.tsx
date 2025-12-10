import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  GitCompare, 
  Calculator,
  ClipboardList,
  Eye,
  Send,
  ThumbsUp,
  ArrowRight,
  Circle,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Loader2,
  Save,
  Target,
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

interface IssueItem {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  dateIdentified: string;
  owner: string;
}

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
  reviewCommentsAddressed?: number;
  totalReviewComments?: number;
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
  reviewCommentsAddressed = 0,
  totalReviewComments = 0,
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

          {/* Issues Card - Criticality Chips or No Action indicator */}
          {isIssuesCard && issuesData ? (
            issuesData.newIssues > 0 ? (
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
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px] text-emerald-600">No new issues identified — No action required</span>
              </div>
            )
          ) : (
            <>
              {/* Progress row */}
              <div className="flex items-center gap-2 min-w-[160px]">
                <div className="flex-1">
                  <Progress value={completion} className="h-1.5" />
                </div>
                <span className="text-xs font-semibold text-foreground w-10">{completion}%</span>
              </div>

              {/* Review Comments Progress */}
              {totalReviewComments > 0 && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
                  <MessageSquare className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="text-[10px] text-muted-foreground">
                    <span className="font-medium text-foreground">{reviewCommentsAddressed}</span> out of <span className="font-medium text-foreground">{totalReviewComments}</span> review comments addressed
                  </span>
                  <div className="flex-1 max-w-[60px]">
                    <Progress 
                      value={(reviewCommentsAddressed / totalReviewComments) * 100} 
                      className="h-1"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const RiskAssessmentOverviewModal = ({
  open,
  onOpenChange,
  risk,
  assessmentIssues = [],
  activeRelatedIssues = [],
}: RiskAssessmentOverviewModalProps) => {
  const navigate = useNavigate();
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);

  if (!risk) return null;

  const handleOpenSummaryModal = () => {
    setSummaryModalOpen(true);
    generateAISummary();
  };

  const generateAISummary = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generatedSummary = `Risk Assessment Summary for ${risk.id} - ${risk.title}

Based on analysis of previous cycle data and current risk details:

**Inherent Rating Review:**
The inherent risk level remains elevated due to the nature of operations and external market conditions. Historical data indicates consistent exposure patterns with minor fluctuations in risk scoring without controls.

**Control Effectiveness Review:**
Current controls demonstrate moderate effectiveness. Design and operating effectiveness evaluation suggests opportunities to enhance control reliability and reduce manual intervention points.

**Residual Rating Validation:**
After applying existing controls, the post-control risk scoring falls within acceptable tolerance levels. Continuous monitoring is advised to maintain this position.

**Issues:**
${newIssuesCount > 0 ? `${newIssuesCount} new issues have been identified requiring review. Criticality breakdown: ${highCount > 0 ? `${highCount} High, ` : ''}${mediumCount > 0 ? `${mediumCount} Medium, ` : ''}${lowCount > 0 ? `${lowCount} Low` : ''}.` : 'No new issues identified during this assessment cycle.'}

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
    
    const inherentMatch = summary.match(/\*\*Inherent Rating Review:\*\*\s*([\s\S]*?)(?=\*\*Control|$)/);
    const controlMatch = summary.match(/\*\*Control Effectiveness Review:\*\*\s*([\s\S]*?)(?=\*\*Residual|$)/);
    const residualMatch = summary.match(/\*\*Residual Rating Validation:\*\*\s*([\s\S]*?)(?=\*\*Issues|$)/);
    const issuesMatch = summary.match(/\*\*Issues:\*\*\s*([\s\S]*?)(?=\*\*Overall|$)/);
    const overallMatch = summary.match(/\*\*Overall Assessment:\*\*\s*([\s\S]*?)$/);
    
    return {
      inherentRating: inherentMatch ? inherentMatch[1].trim() : defaultText,
      controlEffectiveness: controlMatch ? controlMatch[1].trim() : defaultText,
      residualRating: residualMatch ? residualMatch[1].trim() : defaultText,
      issues: issuesMatch ? issuesMatch[1].trim() : defaultText,
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
      { title: "Inherent Rating Review", text: sections.inherentRating.substring(0, 200) + (sections.inherentRating.length > 200 ? "..." : "") },
      { title: "Control Effectiveness Review", text: sections.controlEffectiveness.substring(0, 200) + (sections.controlEffectiveness.length > 200 ? "..." : "") },
      { title: "Residual Rating Validation", text: sections.residualRating.substring(0, 200) + (sections.residualRating.length > 200 ? "..." : "") },
      { title: "Issues", text: sections.issues.substring(0, 200) + (sections.issues.length > 200 ? "..." : "") }
    ];
    
    let yPos = 1;
    summaryItems.forEach((item) => {
      slide2.addText(item.title, { x: 0.5, y: yPos, w: 9, h: 0.35, fontSize: 14, bold: true, color: "374151" });
      slide2.addText(item.text, { x: 0.5, y: yPos + 0.35, w: 9, h: 0.7, fontSize: 11, color: "6b7280", valign: "top" });
      yPos += 1.2;
    });

    // Slide 3: Inherent Rating Review (detailed)
    const slide3 = pptx.addSlide();
    slide3.addText("Inherent Rating Review", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, bold: true, color: "1d4ed8" });
    slide3.addText(sections.inherentRating, { x: 0.5, y: 1, w: 9, h: 4, fontSize: 14, color: "374151", valign: "top" });

    // Slide 4: Control Effectiveness Review (detailed)
    const slide4 = pptx.addSlide();
    slide4.addText("Control Effectiveness Review", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, bold: true, color: "1d4ed8" });
    slide4.addText(sections.controlEffectiveness, { x: 0.5, y: 1, w: 9, h: 4, fontSize: 14, color: "374151", valign: "top" });

    // Slide 5: Residual Rating Validation (detailed)
    const slide5 = pptx.addSlide();
    slide5.addText("Residual Rating Validation", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, bold: true, color: "1d4ed8" });
    slide5.addText(sections.residualRating, { x: 0.5, y: 1, w: 9, h: 4, fontSize: 14, color: "374151", valign: "top" });

    // Slide 6: Issues (detailed)
    const slide6 = pptx.addSlide();
    slide6.addText("Issues", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, bold: true, color: "1d4ed8" });
    slide6.addText(sections.issues, { x: 0.5, y: 1, w: 9, h: 4, fontSize: 14, color: "374151", valign: "top" });

    // Slide 7: Overall Assessment
    const slide7 = pptx.addSlide();
    slide7.addText("Overall Assessment", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, bold: true, color: "1d4ed8" });
    slide7.addText(sections.overall, { x: 0.5, y: 1, w: 9, h: 3.5, fontSize: 14, color: "374151", valign: "top" });
    slide7.addText(`Risk ID: ${risk.id}`, { x: 0.5, y: 4.5, w: 4, h: 0.4, fontSize: 12, color: "6b7280" });
    slide7.addText(`Assessment Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { x: 5, y: 4.5, w: 4, h: 0.4, fontSize: 12, color: "6b7280" });

    pptx.writeFile({ fileName: `${getSanitizedFilename()}.pptx` });
    toast({ title: "PowerPoint Export", description: "Summary exported as 7-slide PowerPoint presentation." });
  };

  const handleExport = (format: string) => {
    switch (format) {
      case 'PDF': generatePDF(); break;
      case 'Excel': generateExcel(); break;
      case 'Word': generateWord(); break;
      case 'PPT': generatePPT(); break;
    }
  };

  const handleNavigateToSection = (section: string, riskId: string, riskName: string) => {
    onOpenChange(false);
    // For issues section, add openPanel param to open the issues slider
    const panelParam = section === 'issues' ? '&openPanel=issues' : '';
    navigate(`/risk-assessment?section=${section}&riskId=${encodeURIComponent(riskId)}&riskName=${encodeURIComponent(riskName)}&source=2nd-line${panelParam}`);
  };

  // Calculate issues data from props - only consider new issues (assessmentIssues)
  const newIssuesCount = assessmentIssues.length;
  const highCount = assessmentIssues.filter(i => i.severity === 'High').length;
  const mediumCount = assessmentIssues.filter(i => i.severity === 'Medium').length;
  const lowCount = assessmentIssues.filter(i => i.severity === 'Low').length;

  const cards = [
    {
      title: "Inherent Rating Review",
      riskId: risk.id,
      riskName: risk.title,
      completion: risk.sectionCompletion.inherentRating,
      descriptor: "Review risk scoring without controls",
      icon: <AlertTriangle className="w-4 h-4 text-muted-foreground" />,
      sectionKey: "inherent-rating",
      primaryCta: {
        label: "Compare with Previous Cycle",
        icon: <GitCompare className="w-3.5 h-3.5" />,
      },
      secondaryCta: {
        label: "Review & Challenge",
        icon: <Eye className="w-3.5 h-3.5" />,
      },
      reviewCommentsAddressed: 3,
      totalReviewComments: 5,
    },
    {
      title: "Control Effectiveness Review",
      riskId: risk.id,
      riskName: risk.title,
      completion: risk.sectionCompletion.controlEffectiveness,
      descriptor: "Evaluate design & operating effectiveness",
      icon: <Shield className="w-4 h-4 text-muted-foreground" />,
      sectionKey: "control-effectiveness",
      primaryCta: {
        label: "View Latest Control Test Results",
        icon: <ClipboardList className="w-3.5 h-3.5" />,
      },
      secondaryCta: {
        label: "Review & Challenge",
        icon: <Eye className="w-3.5 h-3.5" />,
      },
      reviewCommentsAddressed: 2,
      totalReviewComments: 8,
    },
    {
      title: "Residual Rating Validation",
      riskId: risk.id,
      riskName: risk.title,
      completion: risk.sectionCompletion.residualRating,
      descriptor: "Validate post-control risk scoring",
      icon: <CheckCircle className="w-4 h-4 text-muted-foreground" />,
      sectionKey: "residual-rating",
      primaryCta: {
        label: "View Auto-Calculated Score",
        icon: <Calculator className="w-3.5 h-3.5" />,
      },
      secondaryCta: {
        label: "Approve or Challenge",
        icon: <ThumbsUp className="w-3.5 h-3.5" />,
      },
      reviewCommentsAddressed: 1,
      totalReviewComments: 4,
    },
    {
      title: "Issues",
      riskId: risk.id,
      riskName: risk.title,
      completion: 100,
      descriptor: "Review identified issues",
      icon: <AlertCircle className="w-4 h-4 text-muted-foreground" />,
      sectionKey: "issues",
      primaryCta: {
        label: "View Issues",
        icon: <AlertCircle className="w-3.5 h-3.5" />,
      },
      secondaryCta: {
        label: "Review Issues",
        icon: <Eye className="w-3.5 h-3.5" />,
      },
      reviewCommentsAddressed: 0,
      totalReviewComments: 0,
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
      <DialogContent className="sm:max-w-5xl w-[95vw] p-0 flex flex-col max-h-[85vh]">
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
                variant="outline"
                onClick={handleOpenSummaryModal}
                className="h-8 text-xs gap-1.5 border-2 border-green-500"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary fill-primary/20" />
                <span>Assessment Summary</span>
              </Button>
              <Button 
                size="sm"
                onClick={() => handleNavigateToSection('inherent-rating', risk.id, risk.title)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs"
              >
                View Assessment Details
              </Button>
            </div>
          </div>
        </div>
        
        {/* Content - Vertical timeline layout */}
        <div className="p-4 bg-gradient-to-b from-background to-muted/20">
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

        {/* Summary Modal */}
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
      </DialogContent>
    </Dialog>
  );
};
