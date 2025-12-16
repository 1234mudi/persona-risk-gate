import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Info, Layers, Send, Search, ChevronLeft, ChevronRight, Filter, FileText, Users, TrendingUp, Shield, Plus, Pencil, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

// Risk field categories for display
const RISK_FIELD_CATEGORIES = [
  {
    id: 'basic',
    label: 'Basic Information',
    icon: FileText,
    color: 'blue',
    fields: [
      { key: 'title', label: 'Risk Title' },
      { key: 'id', label: 'Risk ID' },
      { key: 'status', label: 'Status' },
    ]
  },
  {
    id: 'classification',
    label: 'Classification',
    icon: Layers,
    color: 'purple',
    fields: [
      { key: 'category', label: 'Category' },
      { key: 'riskLevel1', label: 'Risk Level 1' },
      { key: 'riskLevel2', label: 'Risk Level 2' },
      { key: 'riskLevel3', label: 'Risk Level 3' },
    ]
  },
  {
    id: 'ownership',
    label: 'Ownership & Assignment',
    icon: Users,
    color: 'amber',
    fields: [
      { key: 'owner', label: 'Risk Owner' },
      { key: 'assessor', label: 'Assessor' },
      { key: 'businessUnit', label: 'Business Unit' },
    ]
  },
  {
    id: 'inherent',
    label: 'Inherent Risk',
    icon: AlertTriangle,
    color: 'red',
    fields: [
      { key: 'inherentRisk', label: 'Inherent Risk Rating' },
      { key: 'inherentTrend', label: 'Inherent Trend' },
    ]
  },
  {
    id: 'controls',
    label: 'Controls',
    icon: Shield,
    color: 'emerald',
    fields: [
      { key: 'controls', label: 'Controls' },
      { key: 'effectiveness', label: 'Control Effectiveness' },
      { key: 'testResults', label: 'Test Results' },
    ]
  },
  {
    id: 'residual',
    label: 'Residual Risk',
    icon: TrendingUp,
    color: 'orange',
    fields: [
      { key: 'residualRisk', label: 'Residual Risk Rating' },
      { key: 'residualTrend', label: 'Residual Trend' },
      { key: 'lastAssessed', label: 'Last Assessed' },
    ]
  },
];

export const DocumentParserBulkAssessmentModal = ({ 
  open, 
  onOpenChange, 
  selectedRisks, 
  onApplyAssessments 
}: DocumentParserBulkAssessmentModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [checkedRisks, setCheckedRisks] = useState<Set<string>>(() => new Set(selectedRisks.map(r => r.id)));
  
  // Editable risk data - track modifications
  const [editedRiskData, setEditedRiskData] = useState<Map<string, Partial<ParsedRisk>>>(() => new Map());
  
  // Original risk data for comparison (to detect modifications)
  const originalRiskData = useMemo(() => {
    const map = new Map<string, ParsedRisk>();
    selectedRisks.forEach(r => map.set(r.id, { ...r }));
    return map;
  }, [selectedRisks]);

  // Update checked risks when selectedRisks changes
  useMemo(() => {
    setCheckedRisks(new Set(selectedRisks.map(r => r.id)));
  }, [selectedRisks]);

  // Get unique categories from risks
  const categories = useMemo(() => {
    const cats = new Set(selectedRisks.map(r => r.category || 'Uncategorized'));
    return Array.from(cats).sort();
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

  // Filter risks based on search query and category
  const filteredRisks = useMemo(() => {
    let filtered = selectedRisks;
    
    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(risk => (risk.category || 'Uncategorized') === categoryFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(risk => 
        risk.id.toLowerCase().includes(query) ||
        risk.title.toLowerCase().includes(query) ||
        risk.category.toLowerCase().includes(query) ||
        risk.owner.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [selectedRisks, searchQuery, categoryFilter]);

  // Calculate progress for each risk based on filled fields
  const calculateRiskProgress = (riskId: string): number => {
    if (!checkedRisks.has(riskId)) return 0;
    
    const risk = selectedRisks.find(r => r.id === riskId);
    if (!risk) return 0;
    
    const edited = editedRiskData.get(riskId) || {};
    const allFields = RISK_FIELD_CATEGORIES.flatMap(c => c.fields.map(f => f.key));
    
    let filledCount = 0;
    allFields.forEach(key => {
      const value = (edited as any)[key] ?? (risk as any)[key];
      if (value && String(value).trim() !== '') filledCount++;
    });
    
    return Math.round((filledCount / allFields.length) * 100);
  };

  const handleApply = () => {
    const assessments = new Map<string, RiskAssessmentData>();
    
    checkedRisks.forEach(riskId => {
      const edited = editedRiskData.get(riskId) || {};
      assessments.set(riskId, {
        inherent: edited as any,
        residual: {},
        controls: {},
      });
    });
    
    onApplyAssessments(assessments);
    toast.success(`Applied assessments to ${checkedCount} risk(s)`);
    onOpenChange(false);
  };

  // Get the current value of a field for a risk (edited or original)
  const getFieldValue = (riskId: string, fieldKey: string): string => {
    const edited = editedRiskData.get(riskId);
    if (edited && fieldKey in edited) {
      return (edited as any)[fieldKey] || '';
    }
    const original = originalRiskData.get(riskId);
    return original ? (original as any)[fieldKey] || '' : '';
  };

  // Update a field value for a risk
  const updateFieldValue = (riskId: string, fieldKey: string, value: string) => {
    setEditedRiskData(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(riskId) || {};
      newMap.set(riskId, { ...existing, [fieldKey]: value });
      return newMap;
    });
  };

  // Get the status of a field (new, modified, missing)
  const getFieldStatus = (riskId: string, fieldKey: string): 'new' | 'modified' | 'missing' | null => {
    const original = originalRiskData.get(riskId);
    const originalValue = original ? (original as any)[fieldKey] : undefined;
    const currentValue = getFieldValue(riskId, fieldKey);
    
    // Missing: original value is empty/undefined
    if (!originalValue || originalValue.trim() === '') {
      if (currentValue && currentValue.trim() !== '') {
        return 'new'; // Was empty, now has value
      }
      return 'missing';
    }
    
    // Modified: current differs from original
    const edited = editedRiskData.get(riskId);
    if (edited && fieldKey in edited && (edited as any)[fieldKey] !== originalValue) {
      return 'modified';
    }
    
    return null; // No special status
  };

  const getStatusBadge = (status: 'new' | 'modified' | 'missing' | null) => {
    if (!status) return null;
    
    switch (status) {
      case 'new':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1 text-xs">
            <Plus className="w-3 h-3" />
            New
          </Badge>
        );
      case 'modified':
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1 text-xs">
            <Pencil className="w-3 h-3" />
            Modified
          </Badge>
        );
      case 'missing':
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 gap-1 text-xs">
            <AlertCircle className="w-3 h-3" />
            Missing
          </Badge>
        );
    }
  };

  const getCategoryColorClasses = (color: string) => {
    const colors: Record<string, { border: string; bg: string; iconBg: string }> = {
      blue: { border: 'border-blue-200 dark:border-blue-900/50', bg: 'from-blue-500/10', iconBg: 'bg-blue-500' },
      purple: { border: 'border-purple-200 dark:border-purple-900/50', bg: 'from-purple-500/10', iconBg: 'bg-purple-500' },
      amber: { border: 'border-amber-200 dark:border-amber-900/50', bg: 'from-amber-500/10', iconBg: 'bg-amber-500' },
      red: { border: 'border-red-200 dark:border-red-900/50', bg: 'from-red-500/10', iconBg: 'bg-red-500' },
      emerald: { border: 'border-emerald-200 dark:border-emerald-900/50', bg: 'from-emerald-500/10', iconBg: 'bg-emerald-500' },
      orange: { border: 'border-orange-200 dark:border-orange-900/50', bg: 'from-orange-500/10', iconBg: 'bg-orange-500' },
    };
    return colors[color] || colors.blue;
  };

  // Get checked risks that match current filters
  const checkedFilteredRisks = useMemo(() => {
    return filteredRisks.filter(r => checkedRisks.has(r.id));
  }, [filteredRisks, checkedRisks]);

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
            {/* Left Sidebar - Risk List (Collapsible) */}
            <div className={`border-r border-border bg-muted/30 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'w-12' : 'w-80'}`}>
              {/* Collapse Toggle */}
              <div className="px-2 py-2 border-b border-border flex items-center justify-between">
                {!isSidebarCollapsed && (
                  <div className="flex items-center gap-2 text-sm">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Selected:</span>
                    <span className="text-primary">{checkedCount}/{selectedRisks.length}</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 ml-auto"
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                >
                  {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
              </div>

              {!isSidebarCollapsed && (
                <>
                  {/* Category Filter */}
                  <div className="px-3 py-2 border-b border-border">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="h-9 bg-background">
                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4 text-muted-foreground" />
                          <SelectValue placeholder="All Categories" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Search */}
                  <div className="px-3 py-2 border-b border-border">
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

                  {/* Select All */}
                  <div className="px-3 py-2 border-b border-border flex items-center justify-end gap-2">
                    <Checkbox
                      checked={checkedCount === filteredRisks.length && filteredRisks.length > 0}
                      onCheckedChange={toggleAllRisks}
                      id="select-all"
                    />
                    <label htmlFor="select-all" className="text-sm text-muted-foreground">Select All</label>
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
                </>
              )}

              {/* Collapsed state indicator */}
              {isSidebarCollapsed && (
                <div className="flex-1 flex flex-col items-center pt-4 gap-2">
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center p-0">
                        {checkedCount}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {checkedCount} risks selected
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>

            {/* Right Content - Category-based Assessment Form */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Note Banner */}
              <div className="px-6 py-3 bg-muted/50 border-b border-border">
                <p className="text-sm text-muted-foreground">
                  Review and edit risk details below. Fields are organized by category with status indicators.
                </p>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  {checkedFilteredRisks.length === 0 ? (
                    <div className="text-center py-12">
                      <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground">No risks selected</p>
                      <p className="text-sm text-muted-foreground">Select risks from the sidebar to view and edit their details.</p>
                    </div>
                  ) : (
                    RISK_FIELD_CATEGORIES.map((category, categoryIndex) => {
                      const IconComponent = category.icon;
                      const colorClasses = getCategoryColorClasses(category.color);
                      
                      return (
                        <div key={category.id} className={`border ${colorClasses.border} rounded-lg overflow-hidden`}>
                          {/* Category Header */}
                          <div className={`bg-gradient-to-r ${colorClasses.bg} to-transparent px-4 py-3 border-b ${colorClasses.border} flex items-center gap-3`}>
                            <div className={`w-7 h-7 rounded-full ${colorClasses.iconBg} text-white flex items-center justify-center text-sm font-semibold`}>
                              {categoryIndex + 1}
                            </div>
                            <IconComponent className={`w-5 h-5 text-${category.color}-500`} />
                            <span className="font-semibold text-foreground">{category.label}</span>
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {checkedFilteredRisks.length} risk{checkedFilteredRisks.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          
                          {/* Category Fields */}
                          <div className="p-4 space-y-4">
                            {category.fields.map((field) => (
                              <div key={field.key} className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <label className="text-sm font-medium text-foreground">{field.label}</label>
                                </div>
                                
                                {/* Show each selected risk's field value */}
                                <div className="space-y-2">
                                  {checkedFilteredRisks.map((risk) => {
                                    const status = getFieldStatus(risk.id, field.key);
                                    const value = getFieldValue(risk.id, field.key);
                                    
                                    return (
                                      <div key={`${risk.id}-${field.key}`} className="flex items-start gap-3">
                                        <Badge variant="outline" className="font-mono text-xs shrink-0 mt-2">
                                          {risk.id}
                                        </Badge>
                                        <div className="flex-1">
                                          <Textarea
                                            value={value}
                                            onChange={(e) => updateFieldValue(risk.id, field.key, e.target.value)}
                                            placeholder={`Enter ${field.label.toLowerCase()}...`}
                                            className={`min-h-[40px] resize-none bg-background ${
                                              status === 'missing' ? 'border-red-300 dark:border-red-800' :
                                              status === 'modified' ? 'border-amber-300 dark:border-amber-800' :
                                              status === 'new' ? 'border-emerald-300 dark:border-emerald-800' :
                                              ''
                                            }`}
                                            rows={1}
                                          />
                                        </div>
                                        <div className="shrink-0 w-20 mt-2">
                                          {getStatusBadge(status)}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
};
