import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Sparkles, AlertTriangle, CheckCircle, Info, Layers, X, Save, Send, Loader2, Search } from "lucide-react";
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
  sectionCompletion?: {
    inherentRating: number;
    controlEffectiveness: number;
    residualRating: number;
    riskTreatment: number;
  };
  inherentRisk: { level: string; color: string };
  residualRisk: { level: string; color: string };
}

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

export const BulkAssessmentModal = ({ open, onOpenChange, selectedRisks, onComplete, userType = "1st-line" }: BulkAssessmentModalProps) => {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
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

  // Filter risks based on search query
  const filteredRisks = useMemo(() => {
    if (!searchQuery.trim()) return selectedRisks;
    const query = searchQuery.toLowerCase();
    return selectedRisks.filter(risk => 
      risk.id.toLowerCase().includes(query) ||
      risk.title.toLowerCase().includes(query) ||
      risk.category.toLowerCase().includes(query) ||
      risk.owner.toLowerCase().includes(query) ||
      risk.riskLevel.toLowerCase().includes(query)
    );
  }, [selectedRisks, searchQuery]);

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

  const handleSaveAsDraft = () => {
    toast.success(`${selectedRisks.length} assessments saved as draft`);
  };

  const handleSubmitAll = () => {
    toast.success(`${selectedRisks.length} assessments submitted successfully`);
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
            <Button variant="outline" size="sm" onClick={handleSaveAsDraft} className="h-9">
              <Save className="w-4 h-4 mr-1.5" />
              Save as Draft
            </Button>
            <Button size="sm" onClick={handleSubmitAll} className="h-9 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white">
              <Send className="w-4 h-4 mr-1.5" />
              Submit Assessment ({selectedRisks.length})
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Selected Risks */}
          <div className="w-[280px] border-r border-border bg-background/50 flex flex-col shrink-0">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Info className="w-4 h-4 text-muted-foreground" />
                Selected Risks
              </div>
              <p className="text-xs text-primary mt-1">{selectedRisks.length} risks selected</p>
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
                      className="p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => {
                        // Open the To-Do popup in a new tab by navigating to the correct dashboard based on user type
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
                      <Badge variant="outline" className="text-xs font-mono mb-2 border-primary/50 text-primary">
                        {highlightMatch(risk.id, searchQuery)}
                      </Badge>
                      <p className="text-sm font-medium leading-tight mb-1 group-hover:text-primary transition-colors">
                        {highlightMatch(risk.title, searchQuery)}
                      </p>
                      <p className="text-xs text-muted-foreground">{highlightMatch(risk.category, searchQuery)}</p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content - Assessment Sections */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* AI Suggestions Button */}
            <div className="px-6 py-3 flex justify-end border-b border-border/50">
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
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-[200px]">Factor</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Description</th>
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
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-[120px]">Control ID</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-[200px]">Control Name</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-[120px]">Control Type</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-[120px]">Owner</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground w-[100px]">
                            Design <span className="text-destructive">*</span>
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground w-[100px]">
                            Operating <span className="text-destructive">*</span>
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground w-[100px]">
                            Testing <span className="text-destructive">*</span>
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground w-[80px]">Avg Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockControls.map((control) => (
                          <tr key={control.id} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="font-mono text-xs">{control.id}</Badge>
                            </td>
                            <td className="py-3 px-4 font-medium text-sm">{control.name}</td>
                            <td className="py-3 px-4">{getControlTypeBadge(control.type)}</td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">{control.owner}</td>
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
                        ))}
                      </tbody>
                    </table>
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
                      Applies to all {selectedRisks.length} selected risks
                    </Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-[200px]">Factor</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Description</th>
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
