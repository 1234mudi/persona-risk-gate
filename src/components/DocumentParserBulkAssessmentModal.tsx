import { useState, useMemo, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Info, Layers, Send, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  FACTOR_RATING_OPTIONS, 
  CONTROL_RATING_OPTIONS,
  INHERENT_FACTORS, 
  RESIDUAL_FACTORS,
  CONTROL_DIMENSIONS,
} from "@/lib/riskAssessmentSchema";
import { ParsedRisk } from "./AIDocumentAssessmentModal";

interface DocumentParserBulkAssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRisks: ParsedRisk[];
  onApplyAssessments: (assessments: Map<string, RiskAssessmentData>) => void;
}

interface RiskAssessmentData {
  inherent: Record<string, string>;
  residual: Record<string, string>;
  controls: Record<string, { design: string; operating: string; overall: string }>;
}

// Mock controls data
const mockControls = [
  { id: "CTRL-001", name: "Segregation of Duties", type: "Preventive", owner: "IT Operations" },
  { id: "CTRL-002", name: "Access Control Review", type: "Detective", owner: "Security Team" },
  { id: "CTRL-003", name: "Data Encryption", type: "Preventive", owner: "IT Security" },
  { id: "CTRL-004", name: "Audit Trail Monitoring", type: "Detective", owner: "Compliance" },
];

// Helper to find common value across selected risks
const findCommonValue = (values: (string | undefined)[]): string | null => {
  const filtered = values.filter(v => v !== undefined && v !== "");
  if (filtered.length === 0) return null;
  const first = filtered[0];
  return filtered.every(v => v === first) ? first! : null;
};

export const DocumentParserBulkAssessmentModal = ({ 
  open, 
  onOpenChange, 
  selectedRisks, 
  onApplyAssessments 
}: DocumentParserBulkAssessmentModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const [checkedRisks, setCheckedRisks] = useState<Set<string>>(() => new Set(selectedRisks.map(r => r.id)));

  // Update checked risks when selectedRisks changes
  useMemo(() => {
    setCheckedRisks(new Set(selectedRisks.map(r => r.id)));
  }, [selectedRisks]);

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
  
  // Inherent Risk ratings
  const [inherentRatings, setInherentRatings] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    INHERENT_FACTORS.forEach(factor => {
      initial[factor.id] = "";
    });
    return initial;
  });

  // Control Effectiveness ratings
  const [controlRatings, setControlRatings] = useState<Record<string, { design: string; operating: string; overall: string }>>(() => {
    const initial: Record<string, { design: string; operating: string; overall: string }> = {};
    mockControls.forEach(control => {
      initial[control.id] = { design: "", operating: "", overall: "" };
    });
    return initial;
  });

  // Filter risks based on search query
  const filteredRisks = useMemo(() => {
    if (!searchQuery.trim()) return selectedRisks;
    const query = searchQuery.toLowerCase();
    return selectedRisks.filter(risk => 
      risk.id.toLowerCase().includes(query) ||
      risk.title.toLowerCase().includes(query) ||
      risk.category.toLowerCase().includes(query) ||
      risk.owner.toLowerCase().includes(query)
    );
  }, [selectedRisks, searchQuery]);

  // Compute common reference values based on checked risks
  const commonReferenceValues = useMemo(() => {
    const checkedRiskIds = Array.from(checkedRisks);
    if (checkedRiskIds.length === 0) {
      return {
        inherent: {} as Record<string, string | null>,
        hasAnyInherent: false,
      };
    }

    // Build inherent common values from parsed risk data
    const inherentCommon: Record<string, string | null> = {};
    INHERENT_FACTORS.forEach(factor => {
      const key = factor.name.toLowerCase();
      if (key === 'impact') {
        const values = selectedRisks
          .filter(r => checkedRisks.has(r.id))
          .map(r => {
            const level = r.inherentRisk.toLowerCase();
            if (level.includes('high') || level.includes('extreme')) return "4";
            if (level.includes('medium')) return "3";
            if (level.includes('low')) return "2";
            return "1";
          });
        inherentCommon[factor.id] = findCommonValue(values);
      } else if (key === 'likelihood') {
        inherentCommon[factor.id] = findCommonValue(["3"]); // Default moderate
      }
    });
    
    const hasAnyInherent = Object.values(inherentCommon).some(v => v !== null);

    return {
      inherent: inherentCommon,
      hasAnyInherent,
    };
  }, [checkedRisks, selectedRisks]);

  const updateInherentRating = (factorId: string, value: string) => {
    setInherentRatings(prev => ({ ...prev, [factorId]: value }));
  };

  const updateControlRating = (controlId: string, field: "design" | "operating" | "overall", value: string) => {
    setControlRatings(prev => ({
      ...prev,
      [controlId]: { ...prev[controlId], [field]: value },
    }));
  };

  const calculateAvgScore = (controlId: string) => {
    const ratings = controlRatings[controlId];
    const values = [ratings.design, ratings.operating, ratings.overall].filter(Boolean).map(Number);
    if (values.length === 0) return "-";
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  // Calculate progress for each risk
  const calculateRiskProgress = useCallback((riskId: string): number => {
    if (!checkedRisks.has(riskId)) return 0;
    
    const inherentFieldCount = INHERENT_FACTORS.length;
    const controlFieldCount = mockControls.length * 3;
    const totalFields = inherentFieldCount + controlFieldCount;
    let completedFields = 0;
    
    Object.values(inherentRatings).forEach(rating => {
      if (rating) completedFields++;
    });
    
    Object.values(controlRatings).forEach(control => {
      if (control.design) completedFields++;
      if (control.operating) completedFields++;
      if (control.overall) completedFields++;
    });
    
    return Math.round((completedFields / totalFields) * 100);
  }, [inherentRatings, controlRatings, checkedRisks]);

  const handleApply = () => {
    const assessments = new Map<string, RiskAssessmentData>();
    
    checkedRisks.forEach(riskId => {
      assessments.set(riskId, {
        inherent: { ...inherentRatings },
        residual: {},
        controls: { ...controlRatings },
      });
    });
    
    onApplyAssessments(assessments);
    toast.success(`Applied assessments to ${checkedCount} risk(s)`);
    onOpenChange(false);
  };

  const getRatingLabel = (value: string): string => {
    const option = FACTOR_RATING_OPTIONS.find(o => o.value === value);
    return option ? option.label : "";
  };

  const getControlTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "preventive":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700";
      case "detective":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-700";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col bg-background p-0">
        <TooltipProvider delayDuration={100}>
          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Assess Selected Risks</h2>
                <p className="text-sm text-muted-foreground">Apply common ratings across {selectedRisks.length} risks simultaneously</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                disabled={checkedCount === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <Send className="w-4 h-4" />
                Apply to All Selected Risks
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar - Risk List */}
            <div className="w-80 border-r border-border bg-muted/30 flex flex-col">
              {/* Selection Header */}
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Selected:</span>
                  <span className="text-primary">{checkedCount}/{selectedRisks.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={checkedCount === filteredRisks.length && filteredRisks.length > 0}
                    onCheckedChange={toggleAllRisks}
                    id="select-all"
                  />
                  <label htmlFor="select-all" className="text-sm text-muted-foreground">All</label>
                </div>
              </div>

              {/* Search */}
              <div className="px-4 py-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search risks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 bg-background"
                  />
                </div>
              </div>

              {/* Risk List */}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {filteredRisks.map((risk) => {
                    const progress = calculateRiskProgress(risk.id);
                    const isChecked = checkedRisks.has(risk.id);
                    
                    return (
                      <div
                        key={risk.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          isChecked 
                            ? "bg-primary/5 border-primary/30" 
                            : "bg-background border-border hover:border-primary/20"
                        }`}
                        onClick={() => toggleRiskCheck(risk.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleRiskCheck(risk.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs font-mono shrink-0">
                                {risk.id}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-foreground truncate">{risk.title}</p>
                            <p className="text-xs text-muted-foreground">{risk.category || 'Uncategorized'}</p>
                            {isChecked && (
                              <div className="mt-2 flex items-center gap-2">
                                <Progress value={progress} className="h-1.5 flex-1" />
                                <span className="text-xs text-muted-foreground w-8">{progress}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Right Content - Assessment Form */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Note Banner */}
              <div className="px-6 py-3 bg-muted/50 border-b border-border">
                <p className="text-sm text-muted-foreground">
                  Note: The details shown here are common reference values applied across all selected risks.
                </p>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  {/* Section 1: Inherent Risk Assessment */}
                  <div className="border border-red-200 dark:border-red-900/50 rounded-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-red-500/10 to-transparent px-4 py-3 border-b border-red-200 dark:border-red-900/50 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-semibold">1</div>
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span className="font-semibold text-foreground">Inherent Risk Assessment</span>
                    </div>
                    
                    <div className="p-4">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left border-b border-border">
                            <th className="pb-3 text-sm font-medium text-muted-foreground w-32">Factor</th>
                            <th className="pb-3 text-sm font-medium text-muted-foreground">Description</th>
                            <th className="pb-3 text-sm font-medium text-muted-foreground text-center w-28">Common Value</th>
                            <th className="pb-3 text-sm font-medium text-muted-foreground text-center w-36">
                              Rating (Bulk) <span className="text-red-500">*</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {INHERENT_FACTORS.map((factor) => {
                            const commonVal = commonReferenceValues.inherent[factor.id];
                            
                            return (
                              <tr key={factor.id} className="border-b border-border/50 last:border-0">
                                <td className="py-4">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                    <span className="font-medium text-foreground">{factor.name}</span>
                                  </div>
                                </td>
                                <td className="py-4 pr-4">
                                  <p className="text-sm text-muted-foreground">{factor.description}</p>
                                </td>
                                <td className="py-4 text-center">
                                  {commonVal ? (
                                    <Badge variant="secondary" className="bg-slate-700 text-white">
                                      {getRatingLabel(commonVal)} ({commonVal})
                                    </Badge>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">-</span>
                                  )}
                                </td>
                                <td className="py-4">
                                  <Select
                                    value={inherentRatings[factor.id]}
                                    onValueChange={(value) => updateInherentRating(factor.id, value)}
                                  >
                                    <SelectTrigger className="h-9 bg-background">
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {FACTOR_RATING_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label} ({option.numericValue})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 2: Control Effectiveness Assessment */}
                  <div className="border border-emerald-200 dark:border-emerald-900/50 rounded-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500/10 to-transparent px-4 py-3 border-b border-emerald-200 dark:border-emerald-900/50 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-semibold">2</div>
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <span className="font-semibold text-foreground">Control Effectiveness Assessment</span>
                    </div>
                    
                    <div className="p-4 overflow-x-auto">
                      <table className="w-full min-w-[800px]">
                        <thead>
                          <tr className="text-left border-b border-border">
                            <th className="pb-3 text-sm font-medium text-muted-foreground w-24">Control ID</th>
                            <th className="pb-3 text-sm font-medium text-muted-foreground">Control Name</th>
                            <th className="pb-3 text-sm font-medium text-muted-foreground w-24 text-center">Type</th>
                            <th className="pb-3 text-sm font-medium text-muted-foreground w-20 text-center">Common</th>
                            <th className="pb-3 text-sm font-medium text-muted-foreground w-28 text-center">
                              Design <span className="text-red-500">*</span>
                            </th>
                            <th className="pb-3 text-sm font-medium text-muted-foreground w-28 text-center">
                              Operating <span className="text-red-500">*</span>
                            </th>
                            <th className="pb-3 text-sm font-medium text-muted-foreground w-28 text-center">
                              Overall <span className="text-red-500">*</span>
                            </th>
                            <th className="pb-3 text-sm font-medium text-muted-foreground w-16 text-center">Avg</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockControls.map((control) => (
                            <tr key={control.id} className="border-b border-border/50 last:border-0">
                              <td className="py-3">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {control.id}
                                </Badge>
                              </td>
                              <td className="py-3 font-medium text-foreground">{control.name}</td>
                              <td className="py-3 text-center">
                                <Badge variant="outline" className={`text-xs ${getControlTypeColor(control.type)}`}>
                                  {control.type}
                                </Badge>
                              </td>
                              <td className="py-3 text-center text-sm text-muted-foreground">4/3/4</td>
                              <td className="py-3">
                                <Select
                                  value={controlRatings[control.id]?.design || ""}
                                  onValueChange={(value) => updateControlRating(control.id, "design", value)}
                                >
                                  <SelectTrigger className="h-8 bg-background">
                                    <SelectValue placeholder="" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {CONTROL_RATING_OPTIONS.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label} ({option.numericValue})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="py-3">
                                <Select
                                  value={controlRatings[control.id]?.operating || ""}
                                  onValueChange={(value) => updateControlRating(control.id, "operating", value)}
                                >
                                  <SelectTrigger className="h-8 bg-background">
                                    <SelectValue placeholder="" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {CONTROL_RATING_OPTIONS.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label} ({option.numericValue})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="py-3">
                                <Select
                                  value={controlRatings[control.id]?.overall || ""}
                                  onValueChange={(value) => updateControlRating(control.id, "overall", value)}
                                >
                                  <SelectTrigger className="h-8 bg-background">
                                    <SelectValue placeholder="" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {CONTROL_RATING_OPTIONS.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label} ({option.numericValue})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="py-3 text-center font-medium text-foreground">
                                {calculateAvgScore(control.id)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
};
