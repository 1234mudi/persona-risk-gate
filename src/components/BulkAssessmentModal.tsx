import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sparkles, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronRight, Loader2, X, Save, Send } from "lucide-react";
import { toast } from "sonner";

interface RiskData {
  id: string;
  title: string;
  riskLevel: string;
  owner: string;
  category: string;
  assessmentProgress: {
    assess: "not-started" | "in-progress" | "completed";
    reviewChallenge: "not-started" | "in-progress" | "completed";
    approve: "not-started" | "in-progress" | "completed";
  };
  inherentRisk: { level: string; color: string };
  residualRisk: { level: string; color: string };
}

interface BulkAssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRisks: RiskData[];
  onComplete: () => void;
}

interface RiskAssessmentState {
  inherentRisk: string;
  residualRisk: string;
  controlEffectiveness: string;
  comments: string;
}

interface BulkFieldState {
  value: string;
  applyToAll: boolean;
}

export const BulkAssessmentModal = ({ open, onOpenChange, selectedRisks, onComplete }: BulkAssessmentModalProps) => {
  const [expandedRisks, setExpandedRisks] = useState<Set<string>>(new Set());
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  // Bulk fields with "Apply to All" toggles
  const [bulkInherentRisk, setBulkInherentRisk] = useState<BulkFieldState>({ value: "", applyToAll: true });
  const [bulkResidualRisk, setBulkResidualRisk] = useState<BulkFieldState>({ value: "", applyToAll: true });
  const [bulkControlEffectiveness, setBulkControlEffectiveness] = useState<BulkFieldState>({ value: "", applyToAll: true });
  const [bulkComments, setBulkComments] = useState<BulkFieldState>({ value: "", applyToAll: true });

  // Individual risk overrides
  const [riskOverrides, setRiskOverrides] = useState<Record<string, RiskAssessmentState>>(() => {
    const initial: Record<string, RiskAssessmentState> = {};
    selectedRisks.forEach(risk => {
      initial[risk.id] = {
        inherentRisk: risk.inherentRisk.level,
        residualRisk: risk.residualRisk.level,
        controlEffectiveness: "Design Effective",
        comments: "",
      };
    });
    return initial;
  });

  const toggleRiskExpand = (riskId: string) => {
    setExpandedRisks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(riskId)) {
        newSet.delete(riskId);
      } else {
        newSet.add(riskId);
      }
      return newSet;
    });
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "Level 1": return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400";
      case "Level 2": return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400";
      case "Level 3": return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusBadge = (status: "not-started" | "in-progress" | "completed") => {
    switch (status) {
      case "completed": 
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Complete</Badge>;
      case "in-progress": 
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      default: 
        return <Badge variant="outline" className="text-xs"><AlertCircle className="w-3 h-3 mr-1" />Not Started</Badge>;
    }
  };

  const handleAISuggest = async () => {
    setIsGeneratingAI(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setBulkInherentRisk({ value: "High", applyToAll: true });
    setBulkResidualRisk({ value: "Medium", applyToAll: true });
    setBulkControlEffectiveness({ value: "Operating Effective", applyToAll: true });
    setBulkComments({ 
      value: "AI Assessment: Based on comprehensive analysis of risk profiles, control environment maturity, and industry benchmarks. Ratings reflect current operational context and regulatory requirements.", 
      applyToAll: true 
    });
    
    setIsGeneratingAI(false);
    toast.success("AI suggestions applied to bulk fields");
  };

  const updateRiskOverride = (riskId: string, field: keyof RiskAssessmentState, value: string) => {
    setRiskOverrides(prev => ({
      ...prev,
      [riskId]: { ...prev[riskId], [field]: value },
    }));
  };

  const handleSaveAsDraft = () => {
    toast.success(`${selectedRisks.length} assessments saved as draft`);
  };

  const handleSubmitAll = () => {
    toast.success(`${selectedRisks.length} assessments submitted successfully`);
    onComplete();
    onOpenChange(false);
  };

  const filledFieldsCount = [bulkInherentRisk.value, bulkResidualRisk.value, bulkControlEffectiveness.value].filter(Boolean).length;
  const progressPercent = (filledFieldsCount / 3) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[90vw] h-[90vh] max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold">Bulk Risk Assessment</h2>
              <p className="text-sm text-muted-foreground">
                {selectedRisks.length} risks selected • {filledFieldsCount}/3 required fields completed
              </p>
            </div>
            <Progress value={progressPercent} className="w-24 h-2" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveAsDraft}>
              <Save className="w-4 h-4 mr-1" />
              Save as Draft
            </Button>
            <Button size="sm" onClick={handleSubmitAll} className="bg-primary">
              <Send className="w-4 h-4 mr-1" />
              Submit All ({selectedRisks.length})
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 h-full">
          <div className="p-6 space-y-6">
            {/* Selected Risks Summary */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Selected Risks</h3>
                <span className="text-xs text-muted-foreground">{selectedRisks.length} items</span>
              </div>
              <div className="bg-muted/20 rounded-lg border border-border overflow-hidden">
                <div className="grid grid-cols-[100px_1fr_100px_120px] gap-4 px-4 py-2 bg-muted/40 text-xs font-medium text-muted-foreground border-b border-border">
                  <span>Risk ID</span>
                  <span>Title</span>
                  <span>Hierarchy</span>
                  <span>Status</span>
                </div>
                <div className="divide-y divide-border/50 max-h-[180px] overflow-y-auto">
                  {selectedRisks.map(risk => (
                    <div key={risk.id} className="grid grid-cols-[100px_1fr_100px_120px] gap-4 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
                      <span className="font-mono text-sm font-medium">{risk.id}</span>
                      <span className="text-sm truncate" title={risk.title}>{risk.title}</span>
                      <Badge className={`${getRiskLevelColor(risk.riskLevel)} border text-xs w-fit`}>
                        {risk.riskLevel}
                      </Badge>
                      {getStatusBadge(risk.assessmentProgress.assess)}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Bulk Edit Panel */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Bulk Assessment Fields</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAISuggest} 
                  disabled={isGeneratingAI}
                  className="h-8"
                >
                  {isGeneratingAI ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-1.5 text-primary" />
                  )}
                  AI Auto-Fill
                </Button>
              </div>

              <div className="bg-card rounded-lg border border-border p-5 space-y-5">
                <div className="grid grid-cols-2 gap-6">
                  {/* Inherent Risk */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Inherent Risk Rating</Label>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="applyInherent"
                          checked={bulkInherentRisk.applyToAll}
                          onCheckedChange={(checked) => setBulkInherentRisk(prev => ({ ...prev, applyToAll: !!checked }))}
                        />
                        <Label htmlFor="applyInherent" className="text-xs text-muted-foreground cursor-pointer">Apply to all</Label>
                      </div>
                    </div>
                    <Select 
                      value={bulkInherentRisk.value} 
                      onValueChange={(v) => setBulkInherentRisk(prev => ({ ...prev, value: v }))}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Critical">Critical</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Residual Risk */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Residual Risk Rating</Label>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="applyResidual"
                          checked={bulkResidualRisk.applyToAll}
                          onCheckedChange={(checked) => setBulkResidualRisk(prev => ({ ...prev, applyToAll: !!checked }))}
                        />
                        <Label htmlFor="applyResidual" className="text-xs text-muted-foreground cursor-pointer">Apply to all</Label>
                      </div>
                    </div>
                    <Select 
                      value={bulkResidualRisk.value} 
                      onValueChange={(v) => setBulkResidualRisk(prev => ({ ...prev, value: v }))}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Critical">Critical</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Control Effectiveness */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Control Effectiveness</Label>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="applyControl"
                          checked={bulkControlEffectiveness.applyToAll}
                          onCheckedChange={(checked) => setBulkControlEffectiveness(prev => ({ ...prev, applyToAll: !!checked }))}
                        />
                        <Label htmlFor="applyControl" className="text-xs text-muted-foreground cursor-pointer">Apply to all</Label>
                      </div>
                    </div>
                    <Select 
                      value={bulkControlEffectiveness.value} 
                      onValueChange={(v) => setBulkControlEffectiveness(prev => ({ ...prev, value: v }))}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select effectiveness" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Design Effective">Design Effective</SelectItem>
                        <SelectItem value="Operating Effective">Operating Effective</SelectItem>
                        <SelectItem value="Partially Effective">Partially Effective</SelectItem>
                        <SelectItem value="Ineffective">Ineffective</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Comments */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Assessment Comments</Label>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="applyComments"
                          checked={bulkComments.applyToAll}
                          onCheckedChange={(checked) => setBulkComments(prev => ({ ...prev, applyToAll: !!checked }))}
                        />
                        <Label htmlFor="applyComments" className="text-xs text-muted-foreground cursor-pointer">Apply to all</Label>
                      </div>
                    </div>
                    <Textarea 
                      placeholder="Enter comments to apply to selected risks..."
                      value={bulkComments.value}
                      onChange={(e) => setBulkComments(prev => ({ ...prev, value: e.target.value }))}
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Individual Review (Optional Accordion) */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Individual Review <span className="font-normal">(Optional)</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Expand any risk below to override bulk values. Individual changes will take precedence over bulk settings.
              </p>

              <div className="space-y-2">
                {selectedRisks.map(risk => {
                  const isExpanded = expandedRisks.has(risk.id);
                  const override = riskOverrides[risk.id];
                  
                  return (
                    <Collapsible key={risk.id} open={isExpanded} onOpenChange={() => toggleRiskExpand(risk.id)}>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 rounded-lg border border-border/50 transition-colors">
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span className="font-mono text-sm font-medium">{risk.id}</span>
                            <Badge className={`${getRiskLevelColor(risk.riskLevel)} border text-xs`}>
                              {risk.riskLevel}
                            </Badge>
                            <span className="text-sm text-muted-foreground truncate max-w-[400px]">{risk.title}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">Click to override</span>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="mt-1 p-4 bg-card rounded-lg border border-border space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Inherent Risk Override</Label>
                              <Select 
                                value={override?.inherentRisk} 
                                onValueChange={(v) => updateRiskOverride(risk.id, "inherentRisk", v)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Critical">Critical</SelectItem>
                                  <SelectItem value="High">High</SelectItem>
                                  <SelectItem value="Medium">Medium</SelectItem>
                                  <SelectItem value="Low">Low</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Residual Risk Override</Label>
                              <Select 
                                value={override?.residualRisk} 
                                onValueChange={(v) => updateRiskOverride(risk.id, "residualRisk", v)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Critical">Critical</SelectItem>
                                  <SelectItem value="High">High</SelectItem>
                                  <SelectItem value="Medium">Medium</SelectItem>
                                  <SelectItem value="Low">Low</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Control Effectiveness Override</Label>
                              <Select 
                                value={override?.controlEffectiveness} 
                                onValueChange={(v) => updateRiskOverride(risk.id, "controlEffectiveness", v)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Design Effective">Design Effective</SelectItem>
                                  <SelectItem value="Operating Effective">Operating Effective</SelectItem>
                                  <SelectItem value="Partially Effective">Partially Effective</SelectItem>
                                  <SelectItem value="Ineffective">Ineffective</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Comments Override</Label>
                            <Textarea 
                              value={override?.comments}
                              onChange={(e) => updateRiskOverride(risk.id, "comments", e.target.value)}
                              placeholder="Enter specific comments for this risk..."
                              className="min-h-[60px] text-sm resize-none"
                            />
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
