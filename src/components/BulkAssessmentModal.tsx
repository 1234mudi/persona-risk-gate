import { useState, useMemo, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Sparkles, AlertTriangle, CheckCircle, Info, Layers, X, Send, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
interface RiskData {
  id: string;
  title: string;
  riskLevel: string;
  owner: string;
  category: string;
  status?: string;
  assessmentProgress: {
    assess: "not-started" | "in-progress" | "completed";
    reviewChallenge: "not-started" | "in-progress" | "completed";
    approve: "not-started" | "in-progress" | "completed";
  };
  sectionCompletion?: {
    inherentRating: number;
    controlEffectiveness: number;
    residualRating: number;
    riskTreatment: number;
  };
  inherentRisk: { level: string; color: string };
  residualRisk: { level: string; color: string };
}

// Helper to check if a risk is completed/closed
const isRiskCompleted = (risk: RiskData): boolean => {
  const status = risk.status?.toLowerCase() || "";
  return status === "completed" || status === "closed";
};

interface BulkAssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRisks: RiskData[];
  onComplete: () => void;
  userType?: "1st-line" | "2nd-line" | "risk-owner";
}

// Mock controls data
const mockControls = [
  { id: "CTRL-001", name: "Segregation of Duties", type: "Preventive", owner: "IT Operations" },
  { id: "CTRL-002", name: "Access Control Review", type: "Detective", owner: "Security Team" },
  { id: "CTRL-003", name: "Data Encryption", type: "Preventive", owner: "IT Security" },
  { id: "CTRL-004", name: "Audit Trail Monitoring", type: "Detective", owner: "Compliance" },
];

// Mock reference data per risk (simulating existing values)
const mockRiskReferenceData: Record<string, {
  inherent: { likelihood: string; impact: string; velocity: string };
  residual: { likelihood: string; impact: string; velocity: string };
  controls: Record<string, { design: string; operating: string; testing: string }>;
}> = {
  "R-001": {
    inherent: { likelihood: "3", impact: "3", velocity: "2" },
    residual: { likelihood: "2", impact: "2", velocity: "1" },
    controls: {
      "CTRL-001": { design: "4", operating: "3", testing: "4" },
      "CTRL-002": { design: "3", operating: "4", testing: "3" },
      "CTRL-003": { design: "5", operating: "4", testing: "4" },
      "CTRL-004": { design: "3", operating: "3", testing: "3" },
    }
  },
  "R-001-A": {
    inherent: { likelihood: "4", impact: "3", velocity: "2" },
    residual: { likelihood: "2", impact: "2", velocity: "1" },
    controls: {
      "CTRL-001": { design: "4", operating: "3", testing: "4" },
      "CTRL-002": { design: "4", operating: "4", testing: "3" },
      "CTRL-003": { design: "5", operating: "4", testing: "4" },
      "CTRL-004": { design: "3", operating: "3", testing: "3" },
    }
  },
  "R-001-A-1": {
    inherent: { likelihood: "3", impact: "3", velocity: "2" },
    residual: { likelihood: "2", impact: "2", velocity: "1" },
    controls: {
      "CTRL-001": { design: "4", operating: "3", testing: "4" },
      "CTRL-002": { design: "3", operating: "3", testing: "3" },
      "CTRL-003": { design: "4", operating: "3", testing: "3" },
      "CTRL-004": { design: "4", operating: "4", testing: "4" },
    }
  },
  "R-002": {
    inherent: { likelihood: "4", impact: "4", velocity: "3" },
    residual: { likelihood: "3", impact: "2", velocity: "2" },
    controls: {
      "CTRL-001": { design: "4", operating: "4", testing: "4" },
      "CTRL-002": { design: "3", operating: "3", testing: "3" },
      "CTRL-003": { design: "4", operating: "4", testing: "3" },
      "CTRL-004": { design: "3", operating: "3", testing: "3" },
    }
  },
  "R-002-A": {
    inherent: { likelihood: "4", impact: "4", velocity: "3" },
    residual: { likelihood: "3", impact: "2", velocity: "2" },
    controls: {
      "CTRL-001": { design: "4", operating: "4", testing: "4" },
      "CTRL-002": { design: "3", operating: "3", testing: "3" },
      "CTRL-003": { design: "4", operating: "4", testing: "3" },
      "CTRL-004": { design: "3", operating: "3", testing: "3" },
    }
  },
  "R-003": {
    inherent: { likelihood: "3", impact: "3", velocity: "2" },
    residual: { likelihood: "2", impact: "2", velocity: "1" },
    controls: {
      "CTRL-001": { design: "3", operating: "3", testing: "3" },
      "CTRL-002": { design: "3", operating: "3", testing: "3" },
      "CTRL-003": { design: "4", operating: "3", testing: "3" },
      "CTRL-004": { design: "3", operating: "3", testing: "3" },
    }
  },
  "R-003-A": {
    inherent: { likelihood: "3", impact: "3", velocity: "2" },
    residual: { likelihood: "2", impact: "2", velocity: "1" },
    controls: {
      "CTRL-001": { design: "3", operating: "3", testing: "3" },
      "CTRL-002": { design: "3", operating: "3", testing: "3" },
      "CTRL-003": { design: "4", operating: "3", testing: "3" },
      "CTRL-004": { design: "3", operating: "3", testing: "3" },
    }
  },
  "R-004": {
    inherent: { likelihood: "5", impact: "4", velocity: "3" },
    residual: { likelihood: "3", impact: "3", velocity: "2" },
    controls: {
      "CTRL-001": { design: "4", operating: "4", testing: "4" },
      "CTRL-002": { design: "4", operating: "4", testing: "4" },
      "CTRL-003": { design: "5", operating: "4", testing: "4" },
      "CTRL-004": { design: "4", operating: "4", testing: "4" },
    }
  },
  "R-005": {
    inherent: { likelihood: "3", impact: "3", velocity: "2" },
    residual: { likelihood: "2", impact: "2", velocity: "1" },
    controls: {
      "CTRL-001": { design: "3", operating: "3", testing: "3" },
      "CTRL-002": { design: "3", operating: "3", testing: "3" },
      "CTRL-003": { design: "3", operating: "3", testing: "3" },
      "CTRL-004": { design: "3", operating: "3", testing: "3" },
    }
  },
  // 1st Line risks
  "R-1L-001": {
    inherent: { likelihood: "4", impact: "3", velocity: "2" },
    residual: { likelihood: "2", impact: "2", velocity: "1" },
    controls: {
      "CTRL-001": { design: "4", operating: "3", testing: "4" },
      "CTRL-002": { design: "3", operating: "4", testing: "3" },
      "CTRL-003": { design: "5", operating: "4", testing: "4" },
      "CTRL-004": { design: "3", operating: "3", testing: "3" },
    }
  },
  "R-1L-001-A": {
    inherent: { likelihood: "4", impact: "3", velocity: "2" },
    residual: { likelihood: "2", impact: "2", velocity: "1" },
    controls: {
      "CTRL-001": { design: "4", operating: "3", testing: "4" },
      "CTRL-002": { design: "3", operating: "4", testing: "3" },
      "CTRL-003": { design: "5", operating: "4", testing: "4" },
      "CTRL-004": { design: "3", operating: "3", testing: "3" },
    }
  },
  "R-1L-002": {
    inherent: { likelihood: "3", impact: "4", velocity: "3" },
    residual: { likelihood: "2", impact: "3", velocity: "2" },
    controls: {
      "CTRL-001": { design: "3", operating: "3", testing: "3" },
      "CTRL-002": { design: "4", operating: "4", testing: "4" },
      "CTRL-003": { design: "4", operating: "4", testing: "4" },
      "CTRL-004": { design: "3", operating: "3", testing: "3" },
    }
  },
  // Risk Owner risks
  "R-RO-001": {
    inherent: { likelihood: "4", impact: "4", velocity: "2" },
    residual: { likelihood: "2", impact: "2", velocity: "1" },
    controls: {
      "CTRL-001": { design: "4", operating: "4", testing: "4" },
      "CTRL-002": { design: "4", operating: "4", testing: "4" },
      "CTRL-003": { design: "5", operating: "4", testing: "4" },
      "CTRL-004": { design: "4", operating: "4", testing: "4" },
    }
  },
  "R-RO-001-A": {
    inherent: { likelihood: "4", impact: "4", velocity: "2" },
    residual: { likelihood: "2", impact: "2", velocity: "1" },
    controls: {
      "CTRL-001": { design: "4", operating: "4", testing: "4" },
      "CTRL-002": { design: "4", operating: "4", testing: "4" },
      "CTRL-003": { design: "5", operating: "4", testing: "4" },
      "CTRL-004": { design: "4", operating: "4", testing: "4" },
    }
  },
  "R-RO-002": {
    inherent: { likelihood: "3", impact: "3", velocity: "2" },
    residual: { likelihood: "2", impact: "2", velocity: "1" },
    controls: {
      "CTRL-001": { design: "3", operating: "3", testing: "3" },
      "CTRL-002": { design: "3", operating: "3", testing: "3" },
      "CTRL-003": { design: "4", operating: "3", testing: "3" },
      "CTRL-004": { design: "3", operating: "3", testing: "3" },
    }
  },
};

// Helper to find common value across selected risks
const findCommonValue = (values: (string | undefined)[]): string | null => {
  const filtered = values.filter(v => v !== undefined && v !== "");
  if (filtered.length === 0) return null;
  const first = filtered[0];
  return filtered.every(v => v === first) ? first! : null;
};

export const BulkAssessmentModal = ({ open, onOpenChange, selectedRisks, onComplete, userType = "1st-line" }: BulkAssessmentModalProps) => {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter out completed/closed risks for initial selection
  const selectableRisks = useMemo(() => 
    selectedRisks.filter(r => !isRiskCompleted(r)), 
    [selectedRisks]
  );
  
  const [checkedRisks, setCheckedRisks] = useState<Set<string>>(() => new Set(selectableRisks.map(r => r.id)));

  // Update checked risks when selectedRisks changes (only selectable ones)
  useMemo(() => {
    setCheckedRisks(new Set(selectableRisks.map(r => r.id)));
  }, [selectableRisks]);

  const toggleRiskCheck = (riskId: string) => {
    setCheckedRisks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(riskId)) {
        newSet.delete(riskId);
      } else {
        newSet.add(riskId);
      }
      return newSet;
    });
  };

  const toggleAllRisks = (checked: boolean) => {
    if (checked) {
      setCheckedRisks(new Set(filteredRisks.map(r => r.id)));
    } else {
      setCheckedRisks(new Set());
    }
  };

  const checkedCount = checkedRisks.size;
  const selectableFilteredCount = useMemo(() => 
    selectedRisks.filter(r => !isRiskCompleted(r)).length,
    [selectedRisks]
  );
  
  // Inherent Risk ratings
  const [inherentLikelihood, setInherentLikelihood] = useState("");
  const [inherentImpact, setInherentImpact] = useState("");
  const [inherentVelocity, setInherentVelocity] = useState("");

  // Control Effectiveness ratings
  const [controlRatings, setControlRatings] = useState<Record<string, { design: string; operating: string; testing: string }>>(() => {
    const initial: Record<string, { design: string; operating: string; testing: string }> = {};
    mockControls.forEach(control => {
      initial[control.id] = { design: "", operating: "", testing: "" };
    });
    return initial;
  });

  // Residual Risk ratings
  const [residualLikelihood, setResidualLikelihood] = useState("");
  const [residualImpact, setResidualImpact] = useState("");
  const [residualVelocity, setResidualVelocity] = useState("");

  // Filter risks based on search query - exclude completed/closed risks entirely
  const filteredRisks = useMemo(() => {
    const activeRisks = selectedRisks.filter(r => !isRiskCompleted(r));
    if (!searchQuery.trim()) return activeRisks;
    const query = searchQuery.toLowerCase();
    return activeRisks.filter(risk => 
      risk.id.toLowerCase().includes(query) ||
      risk.title.toLowerCase().includes(query) ||
      risk.category.toLowerCase().includes(query) ||
      risk.owner.toLowerCase().includes(query) ||
      risk.riskLevel.toLowerCase().includes(query)
    );
  }, [selectedRisks, searchQuery]);

  // Compute common reference values based on checked risks
  const commonReferenceValues = useMemo(() => {
    const checkedRiskIds = Array.from(checkedRisks);
    if (checkedRiskIds.length === 0) {
      return {
        inherent: { likelihood: null, impact: null, velocity: null },
        residual: { likelihood: null, impact: null, velocity: null },
        controls: {} as Record<string, { design: string | null; operating: string | null; testing: string | null }>,
        hasAnyInherent: false,
        hasAnyResidual: false,
        hasAnyControls: false,
      };
    }

    const riskData = checkedRiskIds.map(id => mockRiskReferenceData[id]).filter(Boolean);
    
    const inherentLikelihood = findCommonValue(riskData.map(d => d?.inherent?.likelihood));
    const inherentImpact = findCommonValue(riskData.map(d => d?.inherent?.impact));
    const inherentVelocity = findCommonValue(riskData.map(d => d?.inherent?.velocity));
    
    const residualLikelihood = findCommonValue(riskData.map(d => d?.residual?.likelihood));
    const residualImpact = findCommonValue(riskData.map(d => d?.residual?.impact));
    const residualVelocity = findCommonValue(riskData.map(d => d?.residual?.velocity));

    const controlCommon: Record<string, { design: string | null; operating: string | null; testing: string | null }> = {};
    mockControls.forEach(control => {
      controlCommon[control.id] = {
        design: findCommonValue(riskData.map(d => d?.controls?.[control.id]?.design)),
        operating: findCommonValue(riskData.map(d => d?.controls?.[control.id]?.operating)),
        testing: findCommonValue(riskData.map(d => d?.controls?.[control.id]?.testing)),
      };
    });

    const hasAnyInherent = inherentLikelihood !== null || inherentImpact !== null || inherentVelocity !== null;
    const hasAnyResidual = residualLikelihood !== null || residualImpact !== null || residualVelocity !== null;
    const hasAnyControls = Object.values(controlCommon).some(c => c.design !== null || c.operating !== null || c.testing !== null);

    return {
      inherent: { likelihood: inherentLikelihood, impact: inherentImpact, velocity: inherentVelocity },
      residual: { likelihood: residualLikelihood, impact: residualImpact, velocity: residualVelocity },
      controls: controlCommon,
      hasAnyInherent,
      hasAnyResidual,
      hasAnyControls,
    };
  }, [checkedRisks]);

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-300 dark:bg-yellow-500/50 text-foreground rounded px-0.5">{part}</mark>
      ) : part
    );
  };

  const handleAISuggest = async () => {
    setIsGeneratingAI(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Apply AI suggestions
    setInherentLikelihood("4");
    setInherentImpact("3");
    setInherentVelocity("2");
    
    setControlRatings({
      "CTRL-001": { design: "4", operating: "3", testing: "4" },
      "CTRL-002": { design: "3", operating: "4", testing: "3" },
      "CTRL-003": { design: "5", operating: "4", testing: "4" },
      "CTRL-004": { design: "3", operating: "3", testing: "3" },
    });
    
    setResidualLikelihood("2");
    setResidualImpact("2");
    setResidualVelocity("1");
    
    setIsGeneratingAI(false);
    toast.success("AI suggestions applied to all sections");
  };

  const updateControlRating = (controlId: string, field: "design" | "operating" | "testing", value: string) => {
    setControlRatings(prev => ({
      ...prev,
      [controlId]: { ...prev[controlId], [field]: value },
    }));
  };

  const calculateAvgScore = (controlId: string) => {
    const ratings = controlRatings[controlId];
    const values = [ratings.design, ratings.operating, ratings.testing].filter(Boolean).map(Number);
    if (values.length === 0) return "-";
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  // Calculate progress for each risk based on current form completion
  const calculateRiskProgress = useCallback((riskId: string): number => {
    if (!checkedRisks.has(riskId)) return 0;
    
    // Total fields: 3 inherent + 3 residual + (4 controls * 3 fields each) = 18 total
    const totalFields = 18;
    let completedFields = 0;
    
    // Inherent section (3 fields)
    if (inherentLikelihood) completedFields++;
    if (inherentImpact) completedFields++;
    if (inherentVelocity) completedFields++;
    
    // Residual section (3 fields)
    if (residualLikelihood) completedFields++;
    if (residualImpact) completedFields++;
    if (residualVelocity) completedFields++;
    
    // Control ratings (4 controls * 3 fields = 12 fields)
    Object.values(controlRatings).forEach(control => {
      if (control.design) completedFields++;
      if (control.operating) completedFields++;
      if (control.testing) completedFields++;
    });
    
    return Math.round((completedFields / totalFields) * 100);
  }, [checkedRisks, inherentLikelihood, inherentImpact, inherentVelocity, residualLikelihood, residualImpact, residualVelocity, controlRatings]);

  // Get progress color based on percentage
  const getProgressColor = (progress: number): string => {
    if (progress === 100) return "bg-green-500";
    if (progress >= 50) return "bg-amber-500";
    if (progress > 0) return "bg-orange-500";
    return "bg-muted";
  };


  const handleSubmitAll = () => {
    if (checkedCount === 0) {
      toast.error("Please select at least one risk to submit");
      return;
    }
    toast.success(`${checkedCount} assessments submitted successfully`);
    onComplete();
    onOpenChange(false);
  };

  const getControlTypeBadge = (type: string) => {
    if (type === "Preventive") {
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700 text-xs font-medium">{type}</Badge>;
    }
    return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-700 text-xs font-medium">{type}</Badge>;
  };

  const ratingOptions = [
    { value: "1", label: "1 - Low" },
    { value: "2", label: "2 - Low-Medium" },
    { value: "3", label: "3 - Medium" },
    { value: "4", label: "4 - High" },
    { value: "5", label: "5 - Critical" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[92vh] max-h-[92vh] p-0 flex flex-col gap-0 overflow-hidden bg-gradient-to-br from-orange-50/30 via-background to-green-50/20 dark:from-orange-950/10 dark:via-background dark:to-green-950/10">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Bulk Risk Assessment</h2>
              <p className="text-sm text-muted-foreground">
                Perform bulk assessment for {selectedRisks.length} selected risks
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-9">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmitAll} disabled={checkedCount === 0} className="h-9 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white disabled:opacity-50">
              <Send className="w-4 h-4 mr-1.5" />
              Apply to All Selected Risks ({checkedCount})
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Selected Risks */}
          <div className="w-[280px] border-r border-border bg-background/50 flex flex-col shrink-0">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <span>Selected: <span className="text-primary">{checkedCount}/{selectedRisks.length}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={checkedCount === selectableFilteredCount && selectableFilteredCount > 0}
                    onCheckedChange={(checked) => toggleAllRisks(!!checked)}
                    disabled={selectableFilteredCount === 0}
                    className="h-4 w-4"
                  />
                  <span className="text-xs text-muted-foreground">All</span>
                </div>
              </div>
            </div>
            {/* Search Box */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search risks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-muted/50 border-border/50 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="text-xs text-muted-foreground mt-2">
                  Showing {filteredRisks.length} of {selectedRisks.length} risks
                </p>
              )}
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {filteredRisks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No risks match your search</p>
                  </div>
                ) : (
                  filteredRisks.map(risk => (
                    <div 
                      key={risk.id} 
                      className={`p-3 rounded-lg border transition-colors group ${
                        checkedRisks.has(risk.id) 
                          ? 'border-primary/50 bg-primary/5 cursor-pointer' 
                          : 'border-border bg-card hover:bg-muted/50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={checkedRisks.has(risk.id)}
                          onCheckedChange={() => toggleRiskCheck(risk.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5 h-4 w-4 shrink-0"
                        />
                        <div 
                          className="flex-1 min-w-0"
                          onClick={() => {
                            const dashboardPath = userType === "2nd-line" 
                              ? "/dashboard/2nd-line-analyst" 
                              : userType === "risk-owner" 
                                ? "/dashboard/risk-owner" 
                                : "/dashboard/1st-line-analyst";
                            const url = `${dashboardPath}?openOverview=true&riskId=${encodeURIComponent(risk.id)}&riskName=${encodeURIComponent(risk.title)}`;
                            window.open(url, '_blank');
                          }}
                          title="Click to open risk assessment in new tab"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs font-mono border-primary/50 text-primary">
                              {highlightMatch(risk.id, searchQuery)}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium leading-tight mb-1 group-hover:text-primary transition-colors">
                            {highlightMatch(risk.title, searchQuery)}
                          </p>
                          <p className="text-xs text-muted-foreground mb-2">{highlightMatch(risk.category, searchQuery)}</p>
                          {/* Progress indicator */}
                          {checkedRisks.has(risk.id) && (
                            <div className="flex items-center gap-2">
                              <div className="relative h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-300 ${getProgressColor(calculateRiskProgress(risk.id))}`}
                                  style={{ width: `${calculateRiskProgress(risk.id)}%` }}
                                />
                              </div>
                              <span className={`text-xs font-medium min-w-[32px] text-right ${
                                calculateRiskProgress(risk.id) === 100 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : calculateRiskProgress(risk.id) >= 50 
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-muted-foreground'
                              }`}>
                                {calculateRiskProgress(risk.id)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content - Assessment Sections */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* AI Suggestions Button */}
            <div className="px-6 py-3 flex items-center justify-between border-b border-border/50">
              <p className="text-xs text-muted-foreground/70">
                Note: The details shown here are common reference values applied across all selected risks.
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleAISuggest} 
                disabled={isGeneratingAI}
                className="text-primary hover:text-primary hover:bg-primary/10"
              >
                {isGeneratingAI ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Apply AI Suggestions (All Sections)
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {/* Section 1: Inherent Risk Assessment */}
                <section className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-semibold text-sm shadow">
                        1
                      </div>
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <span className="font-medium">Inherent Risk Assessment - Rate each factor from 1 (Low) to 5 (Critical)</span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 text-xs">
                      Applies to all {selectedRisks.length} selected risks
                    </Badge>
                  </div>
                  <div className="overflow-x-auto">
                    {!commonReferenceValues.hasAnyInherent && checkedRisks.size > 0 ? (
                      <div className="py-8 px-4 text-center">
                        <Info className="w-6 h-6 mx-auto mb-2 text-muted-foreground/60" />
                        <p className="text-sm text-muted-foreground">
                          No shared reference details are available for the current selection.
                        </p>
                      </div>
                    ) : checkedRisks.size === 0 ? (
                      <div className="py-8 px-4 text-center">
                        <Info className="w-6 h-6 mx-auto mb-2 text-muted-foreground/60" />
                        <p className="text-sm text-muted-foreground">
                          Select at least one risk to view reference details.
                        </p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-[200px]">Factor</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Description</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground w-[120px]">Common Value</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground w-[180px]">
                              Rating (Bulk) <span className="text-destructive">*</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-border/50 hover:bg-muted/20">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                <span className="font-medium">Likelihood</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-muted-foreground">Probability of risk event occurring</td>
                            <td className="py-4 px-4 text-center">
                              {commonReferenceValues.inherent.likelihood ? (
                                <Badge variant="outline" className="text-xs">{ratingOptions.find(o => o.value === commonReferenceValues.inherent.likelihood)?.label || commonReferenceValues.inherent.likelihood}</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Varies</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <Select value={inherentLikelihood} onValueChange={setInherentLikelihood}>
                                <SelectTrigger className="h-10 bg-muted/50 border-border/50">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border border-border z-50">
                                  {ratingOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                          <tr className="border-b border-border/50 hover:bg-muted/20">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                <span className="font-medium">Impact</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-muted-foreground">Potential impact on business operations</td>
                            <td className="py-4 px-4 text-center">
                              {commonReferenceValues.inherent.impact ? (
                                <Badge variant="outline" className="text-xs">{ratingOptions.find(o => o.value === commonReferenceValues.inherent.impact)?.label || commonReferenceValues.inherent.impact}</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Varies</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <Select value={inherentImpact} onValueChange={setInherentImpact}>
                                <SelectTrigger className="h-10 bg-muted/50 border-border/50">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border border-border z-50">
                                  {ratingOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                          <tr className="hover:bg-muted/20">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                <span className="font-medium">Velocity</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-muted-foreground">Speed at which risk can materialize</td>
                            <td className="py-4 px-4 text-center">
                              {commonReferenceValues.inherent.velocity ? (
                                <Badge variant="outline" className="text-xs">{ratingOptions.find(o => o.value === commonReferenceValues.inherent.velocity)?.label || commonReferenceValues.inherent.velocity}</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Varies</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <Select value={inherentVelocity} onValueChange={setInherentVelocity}>
                                <SelectTrigger className="h-10 bg-muted/50 border-border/50">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border border-border z-50">
                                  {ratingOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>

                {/* Section 2: Control Effectiveness Assessment */}
                <section className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-900/10 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm shadow">
                        2
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 border-green-500 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      </div>
                      <span className="font-medium">Control Effectiveness Assessment - Rate each dimension from 1 (Ineffective) to 5 (Highly Effective)</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    {!commonReferenceValues.hasAnyControls && checkedRisks.size > 0 ? (
                      <div className="py-8 px-4 text-center">
                        <Info className="w-6 h-6 mx-auto mb-2 text-muted-foreground/60" />
                        <p className="text-sm text-muted-foreground">
                          No shared reference details are available for the current selection.
                        </p>
                      </div>
                    ) : checkedRisks.size === 0 ? (
                      <div className="py-8 px-4 text-center">
                        <Info className="w-6 h-6 mx-auto mb-2 text-muted-foreground/60" />
                        <p className="text-sm text-muted-foreground">
                          Select at least one risk to view reference details.
                        </p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-[120px]">Control ID</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-[180px]">Control Name</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-[100px]">Type</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground w-[80px]">Common</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground w-[100px]">
                              Design <span className="text-destructive">*</span>
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground w-[100px]">
                              Operating <span className="text-destructive">*</span>
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground w-[100px]">
                              Testing <span className="text-destructive">*</span>
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground w-[80px]">Avg</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockControls.map((control) => {
                            const commonCtrl = commonReferenceValues.controls[control.id];
                            const hasCommon = commonCtrl?.design || commonCtrl?.operating || commonCtrl?.testing;
                            return (
                              <tr key={control.id} className="border-b border-border/50 hover:bg-muted/20">
                                <td className="py-3 px-4">
                                  <Badge variant="outline" className="font-mono text-xs">{control.id}</Badge>
                                </td>
                                <td className="py-3 px-4 font-medium text-sm">{control.name}</td>
                                <td className="py-3 px-4">{getControlTypeBadge(control.type)}</td>
                                <td className="py-3 px-4 text-center">
                                  {hasCommon ? (
                                    <span className="text-xs text-muted-foreground">
                                      {commonCtrl?.design || "-"}/{commonCtrl?.operating || "-"}/{commonCtrl?.testing || "-"}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground italic">Varies</span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <Select 
                                    value={controlRatings[control.id]?.design || ""} 
                                    onValueChange={(v) => updateControlRating(control.id, "design", v)}
                                  >
                                    <SelectTrigger className="h-9 bg-muted/50 border-border/50">
                                      <SelectValue placeholder="" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border border-border z-50">
                                      {[1, 2, 3, 4, 5].map(n => (
                                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="py-3 px-4">
                                  <Select 
                                    value={controlRatings[control.id]?.operating || ""} 
                                    onValueChange={(v) => updateControlRating(control.id, "operating", v)}
                                  >
                                    <SelectTrigger className="h-9 bg-muted/50 border-border/50">
                                      <SelectValue placeholder="" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border border-border z-50">
                                      {[1, 2, 3, 4, 5].map(n => (
                                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="py-3 px-4">
                                  <Select 
                                    value={controlRatings[control.id]?.testing || ""} 
                                    onValueChange={(v) => updateControlRating(control.id, "testing", v)}
                                  >
                                    <SelectTrigger className="h-9 bg-muted/50 border-border/50">
                                      <SelectValue placeholder="" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border border-border z-50">
                                      {[1, 2, 3, 4, 5].map(n => (
                                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="py-3 px-4 text-center text-sm font-medium text-muted-foreground">
                                  {calculateAvgScore(control.id)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>

                {/* Section 3: Residual Risk Assessment */}
                <section className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-900/10 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm shadow">
                        3
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium">Residual Risk Assessment - Rate each factor from 1 (Low) to 5 (Critical) after control mitigation</span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 text-xs">
                      Applies to all {checkedRisks.size} selected risks
                    </Badge>
                  </div>
                  <div className="overflow-x-auto">
                    {!commonReferenceValues.hasAnyResidual && checkedRisks.size > 0 ? (
                      <div className="py-8 px-4 text-center">
                        <Info className="w-6 h-6 mx-auto mb-2 text-muted-foreground/60" />
                        <p className="text-sm text-muted-foreground">
                          No shared reference details are available for the current selection.
                        </p>
                      </div>
                    ) : checkedRisks.size === 0 ? (
                      <div className="py-8 px-4 text-center">
                        <Info className="w-6 h-6 mx-auto mb-2 text-muted-foreground/60" />
                        <p className="text-sm text-muted-foreground">
                          Select at least one risk to view reference details.
                        </p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-[200px]">Factor</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Description</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground w-[120px]">Common Value</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground w-[180px]">
                              Rating (Bulk) <span className="text-destructive">*</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-border/50 hover:bg-muted/20">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span className="font-medium">Likelihood</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-muted-foreground">Probability after control mitigation</td>
                            <td className="py-4 px-4 text-center">
                              {commonReferenceValues.residual.likelihood ? (
                                <Badge variant="outline" className="text-xs">{ratingOptions.find(o => o.value === commonReferenceValues.residual.likelihood)?.label || commonReferenceValues.residual.likelihood}</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Varies</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <Select value={residualLikelihood} onValueChange={setResidualLikelihood}>
                                <SelectTrigger className="h-10 bg-muted/50 border-border/50">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border border-border z-50">
                                  {ratingOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                          <tr className="border-b border-border/50 hover:bg-muted/20">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span className="font-medium">Impact</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-muted-foreground">Remaining impact after controls</td>
                            <td className="py-4 px-4 text-center">
                              {commonReferenceValues.residual.impact ? (
                                <Badge variant="outline" className="text-xs">{ratingOptions.find(o => o.value === commonReferenceValues.residual.impact)?.label || commonReferenceValues.residual.impact}</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Varies</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <Select value={residualImpact} onValueChange={setResidualImpact}>
                                <SelectTrigger className="h-10 bg-muted/50 border-border/50">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border border-border z-50">
                                  {ratingOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                          <tr className="hover:bg-muted/20">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span className="font-medium">Velocity</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-muted-foreground">Risk velocity after mitigation</td>
                            <td className="py-4 px-4 text-center">
                              {commonReferenceValues.residual.velocity ? (
                                <Badge variant="outline" className="text-xs">{ratingOptions.find(o => o.value === commonReferenceValues.residual.velocity)?.label || commonReferenceValues.residual.velocity}</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Varies</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <Select value={residualVelocity} onValueChange={setResidualVelocity}>
                                <SelectTrigger className="h-10 bg-muted/50 border-border/50">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border border-border z-50">
                                  {ratingOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
