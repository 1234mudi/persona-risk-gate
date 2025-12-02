import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
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
  isOverridden: boolean;
  aiSuggested: boolean;
  completed: boolean;
}

export const BulkAssessmentModal = ({ open, onOpenChange, selectedRisks, onComplete }: BulkAssessmentModalProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedRisks, setExpandedRisks] = useState<Set<string>>(new Set());
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [applyToAll, setApplyToAll] = useState(false);
  
  // Common fields
  const [commonInherentRisk, setCommonInherentRisk] = useState("");
  const [commonResidualRisk, setCommonResidualRisk] = useState("");
  const [commonControlEffectiveness, setCommonControlEffectiveness] = useState("");
  const [commonComments, setCommonComments] = useState("");

  // Individual risk states
  const [riskStates, setRiskStates] = useState<Record<string, RiskAssessmentState>>(() => {
    const initial: Record<string, RiskAssessmentState> = {};
    selectedRisks.forEach(risk => {
      initial[risk.id] = {
        inherentRisk: risk.inherentRisk.level,
        residualRisk: risk.residualRisk.level,
        controlEffectiveness: "Design Effective",
        comments: "",
        isOverridden: false,
        aiSuggested: false,
        completed: false,
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

  const getProgressIcon = (status: "not-started" | "in-progress" | "completed") => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "in-progress": return <Clock className="w-4 h-4 text-amber-500" />;
      default: return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const completedCount = Object.values(riskStates).filter(s => s.completed).length;
  const progressPercent = (completedCount / selectedRisks.length) * 100;

  const applyCommonToAll = () => {
    setRiskStates(prev => {
      const updated = { ...prev };
      selectedRisks.forEach(risk => {
        updated[risk.id] = {
          ...updated[risk.id],
          inherentRisk: commonInherentRisk || updated[risk.id].inherentRisk,
          residualRisk: commonResidualRisk || updated[risk.id].residualRisk,
          controlEffectiveness: commonControlEffectiveness || updated[risk.id].controlEffectiveness,
          comments: commonComments || updated[risk.id].comments,
          isOverridden: false,
        };
      });
      return updated;
    });
    toast.success("Common values applied to all risks");
  };

  const handleAISuggest = async () => {
    setIsGeneratingAI(true);
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setRiskStates(prev => {
      const updated = { ...prev };
      selectedRisks.forEach(risk => {
        // Simulate AI suggestions based on risk category
        const suggestions = {
          inherentRisk: risk.category === "Technology" ? "High" : risk.category === "Compliance" ? "Critical" : "Medium",
          residualRisk: risk.category === "Technology" ? "Medium" : "Low",
          controlEffectiveness: "Operating Effective",
          comments: `AI Assessment: Based on analysis of ${risk.title}, considering industry benchmarks and control maturity, the risk rating has been evaluated. Key factors include operational complexity, regulatory requirements, and historical incident data.`,
        };
        updated[risk.id] = {
          ...updated[risk.id],
          ...suggestions,
          aiSuggested: true,
        };
      });
      return updated;
    });
    
    setIsGeneratingAI(false);
    toast.success("AI suggestions generated for all risks");
  };

  const updateRiskState = (riskId: string, field: keyof RiskAssessmentState, value: string | boolean) => {
    setRiskStates(prev => ({
      ...prev,
      [riskId]: {
        ...prev[riskId],
        [field]: value,
        isOverridden: field !== "completed" && field !== "isOverridden" ? true : prev[riskId].isOverridden,
      },
    }));
  };

  const markAsComplete = (riskId: string) => {
    setRiskStates(prev => ({
      ...prev,
      [riskId]: { ...prev[riskId], completed: true },
    }));
    toast.success(`Risk ${riskId} marked as complete`);
  };

  const handleSubmitAll = () => {
    toast.success(`${completedCount} assessments submitted successfully`);
    onComplete();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">Bulk Risk Assessment</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Assessing {selectedRisks.length} selected risks
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{completedCount} / {selectedRisks.length} Complete</p>
                <Progress value={progressPercent} className="w-32 h-2 mt-1" />
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bulk-edit">Bulk Edit</TabsTrigger>
            <TabsTrigger value="individual">Individual Review</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="overview" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Selected Risks Summary</h4>
                  {selectedRisks.map(risk => (
                    <div key={risk.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                      <div className="flex items-center gap-3">
                        <Badge className={`${getRiskLevelColor(risk.riskLevel)} border text-xs`}>
                          {risk.riskLevel}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{risk.title}</p>
                          <p className="text-xs text-muted-foreground">{risk.id} • {risk.owner}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getProgressIcon(risk.assessmentProgress.assess)}
                        {riskStates[risk.id]?.completed && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                            Done
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <h4 className="font-medium">AI-Powered Assessment</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Let AI analyze and suggest ratings based on risk profiles, historical data, and industry benchmarks.
                    </p>
                    <Button 
                      onClick={handleAISuggest} 
                      disabled={isGeneratingAI}
                      className="w-full"
                    >
                      {isGeneratingAI ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating Suggestions...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate AI Suggestions
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                    <h4 className="font-medium mb-2">Completion Status</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fully Completed</span>
                        <span className="font-medium text-green-600">{completedCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Partially Completed</span>
                        <span className="font-medium text-amber-600">
                          {Object.values(riskStates).filter(s => s.aiSuggested && !s.completed).length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Not Started</span>
                        <span className="font-medium text-muted-foreground">
                          {Object.values(riskStates).filter(s => !s.aiSuggested && !s.completed).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bulk-edit" className="mt-0 space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Set common values below and apply them to all selected risks. Individual overrides can be made in the "Individual Review" tab.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Inherent Risk Rating</Label>
                  <Select value={commonInherentRisk} onValueChange={setCommonInherentRisk}>
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label>Residual Risk Rating</Label>
                  <Select value={commonResidualRisk} onValueChange={setCommonResidualRisk}>
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label>Control Effectiveness</Label>
                  <Select value={commonControlEffectiveness} onValueChange={setCommonControlEffectiveness}>
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label>Assessment Comments</Label>
                  <Textarea 
                    placeholder="Enter common comments..."
                    value={commonComments}
                    onChange={(e) => setCommonComments(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Button onClick={applyCommonToAll} className="flex-1">
                  Apply to All Selected Risks
                </Button>
                <Button variant="outline" onClick={handleAISuggest} disabled={isGeneratingAI}>
                  {isGeneratingAI ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  AI Auto-Fill
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="individual" className="mt-0 space-y-3">
              {selectedRisks.map(risk => {
                const state = riskStates[risk.id];
                const isExpanded = expandedRisks.has(risk.id);
                
                return (
                  <div key={risk.id} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleRiskExpand(risk.id)}
                      className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <Badge className={`${getRiskLevelColor(risk.riskLevel)} border text-xs`}>
                          {risk.riskLevel}
                        </Badge>
                        <span className="font-medium text-sm">{risk.id}</span>
                        <span className="text-sm text-muted-foreground">{risk.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {state?.aiSuggested && (
                          <Badge variant="outline" className="text-xs border-primary text-primary">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI Suggested
                          </Badge>
                        )}
                        {state?.isOverridden && (
                          <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                            Overridden
                          </Badge>
                        )}
                        {state?.completed ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Complete
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Pending</Badge>
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 space-y-4 border-t border-border">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Inherent Risk</Label>
                            <Select 
                              value={state?.inherentRisk} 
                              onValueChange={(v) => updateRiskState(risk.id, "inherentRisk", v)}
                            >
                              <SelectTrigger className="h-8">
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
                            <Label className="text-xs">Residual Risk</Label>
                            <Select 
                              value={state?.residualRisk} 
                              onValueChange={(v) => updateRiskState(risk.id, "residualRisk", v)}
                            >
                              <SelectTrigger className="h-8">
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
                            <Label className="text-xs">Control Effectiveness</Label>
                            <Select 
                              value={state?.controlEffectiveness} 
                              onValueChange={(v) => updateRiskState(risk.id, "controlEffectiveness", v)}
                            >
                              <SelectTrigger className="h-8">
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
                          <Label className="text-xs">Assessment Comments</Label>
                          <Textarea 
                            value={state?.comments}
                            onChange={(e) => updateRiskState(risk.id, "comments", e.target.value)}
                            placeholder="Enter assessment comments..."
                            className="min-h-[60px] text-sm"
                          />
                        </div>

                        <div className="flex justify-end">
                          <Button 
                            size="sm"
                            onClick={() => markAsComplete(risk.id)}
                            disabled={state?.completed}
                            className={state?.completed ? "bg-green-500" : ""}
                          >
                            {state?.completed ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Completed
                              </>
                            ) : (
                              "Mark as Complete"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitAll}
            disabled={completedCount === 0}
            className="bg-primary"
          >
            Submit {completedCount} Assessment{completedCount !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
