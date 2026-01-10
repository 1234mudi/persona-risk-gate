import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  FileText,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Maximize2,
  X,
  Users,
  Calendar as CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitialRiskDataCopy } from "@/data/initialRiskData";

interface RiskAssessmentTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (taskData: RiskAssessmentTaskData) => void;
}

interface RiskAssessmentTaskData {
  planId: string;
  planTitle: string;
  perspective: string;
  assessmentType: string;
  inheritScope: boolean;
  selectedRisks: string[];
  newRiskTitle?: string;
  scopes: ScopeItem[];
}

interface ScopeItem {
  id: string;
  organization: string;
  assessableItems: string;
  risks: string;
}

interface ScopeFormData {
  name: string;
  organizations: string[];
  risks: string[];
  availableTo: string;
  assessor: string;
  approver: string;
  dueDate: Date | undefined;
}

const mockPlans = [
  {
    id: "plan-1",
    title: "Assess all Employee Related Risk for Retail Banking",
    perspective: "Enterprise Business Unit - Risk (Scoring Algorithm and Rating Method)",
    type: "Org - Risk",
  },
  {
    id: "plan-2",
    title: "Quarterly Operational Risk Assessment",
    perspective: "Corporate - Risk (Scoring Algorithm and Rating Method)",
    type: "Org - Risk",
  },
  {
    id: "plan-3",
    title: "Annual Compliance Review",
    perspective: "Regulatory - Compliance (Scoring Algorithm and Rating Method)",
    type: "Compliance",
  },
];

export function RiskAssessmentTaskModal({
  open,
  onOpenChange,
  onSubmit,
}: RiskAssessmentTaskModalProps) {
  const [generalOpen, setGeneralOpen] = useState(true);
  const [assessmentsOpen, setAssessmentsOpen] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [inheritScope, setInheritScope] = useState(false);
  const [showRiskList, setShowRiskList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeSearch, setScopeSearch] = useState("");
  const [newRiskTitle, setNewRiskTitle] = useState("");
  const [selectedLibraryRisks, setSelectedLibraryRisks] = useState<string[]>([]);
  const [scopes, setScopes] = useState<ScopeItem[]>([
    {
      id: "scope-1",
      organization: "Retail Banking",
      assessableItems: "Employee Processes",
      risks: "3 risks selected",
    },
  ]);

  // Scope modal state
  const [scopeModalOpen, setScopeModalOpen] = useState(false);
  const [scopeFormData, setScopeFormData] = useState<ScopeFormData>({
    name: "",
    organizations: [],
    risks: [],
    availableTo: "assessor",
    assessor: "",
    approver: "",
    dueDate: undefined,
  });
  const [selectedScopeOrgs, setSelectedScopeOrgs] = useState<string[]>([]);
  const [selectedScopeRisks, setSelectedScopeRisks] = useState<string[]>([]);

  const selectedPlan = useMemo(
    () => mockPlans.find((p) => p.id === selectedPlanId),
    [selectedPlanId]
  );

  const libraryRisks = useMemo(() => {
    const risks = getInitialRiskDataCopy();
    return risks.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
    }));
  }, []);

  const filteredLibraryRisks = useMemo(() => {
    if (!searchQuery) return libraryRisks;
    return libraryRisks.filter(
      (r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [libraryRisks, searchQuery]);

  const handleSubmit = () => {
    if (!selectedPlan) return;

    const taskData: RiskAssessmentTaskData = {
      planId: selectedPlan.id,
      planTitle: selectedPlan.title,
      perspective: selectedPlan.perspective,
      assessmentType: selectedPlan.type,
      inheritScope,
      selectedRisks: inheritScope ? selectedLibraryRisks : selectedLibraryRisks,
      newRiskTitle: !inheritScope ? newRiskTitle : undefined,
      scopes,
    };

    onSubmit?.(taskData);
  };

  const handleAddScope = () => {
    const newScope: ScopeItem = {
      id: `scope-${Date.now()}`,
      organization: "",
      assessableItems: "",
      risks: "0 risks selected",
    };
    setScopes([...scopes, newScope]);
  };

  const handleDeleteScope = (id: string) => {
    setScopes(scopes.filter((s) => s.id !== id));
  };

  const handleRefresh = () => {
    // Refresh logic
  };

  const toggleLibraryRisk = (riskId: string) => {
    setSelectedLibraryRisks((prev) =>
      prev.includes(riskId)
        ? prev.filter((id) => id !== riskId)
        : [...prev, riskId]
    );
  };

  const handleInheritScopeChange = (checked: boolean) => {
    setInheritScope(checked);
    if (checked && selectedPlanId) {
      // Pre-populate scope form with plan data
      setScopeFormData({
        name: selectedPlan?.title || "",
        organizations: ["org-1", "org-2"],
        risks: ["risk-1", "risk-3"],
        availableTo: "assessor",
        assessor: "",
        approver: "",
        dueDate: undefined,
      });
      setSelectedScopeOrgs(["org-1", "org-2"]);
      setSelectedScopeRisks(["risk-1", "risk-3"]);
      setScopeModalOpen(true);
    }
  };

  const handleScopeAdd = () => {
    setScopeModalOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-4xl p-0 gap-0 max-h-[90vh] flex flex-col"
          hideCloseButton
        >
          {/* Header */}
        <div className="flex items-center justify-between px-3 py-1 border-b border-primary/30 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
              <FileText className="w-3 h-3 text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Ad-Hoc Risk Assessment</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-6 px-2 text-[10px]"
              >
                CLOSE
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!selectedPlanId}
                className="h-6 px-2 text-[10px]"
              >
                PROCEED
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {/* General Section */}
              <Collapsible open={generalOpen} onOpenChange={setGeneralOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 w-full text-left font-semibold text-sm text-foreground border-l-[3px] border-primary pl-2 py-1 bg-muted/40 rounded-r-sm hover:bg-muted/60 transition-colors">
                  {generalOpen ? (
                    <ChevronDown className="w-4 h-4 text-primary" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-primary" />
                  )}
                  General
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 pl-3 space-y-3">
                  {/* Risk Assessment Plan */}
                  <div className="space-y-1">
                    <Label className="text-primary font-medium text-xs">
                      Risk Assessment Plan <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={selectedPlanId}
                      onValueChange={setSelectedPlanId}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select a risk assessment plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockPlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id} className="text-xs">
                            {plan.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Perspective & Assessment Type */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-primary font-medium text-xs">Perspective</Label>
                    <div className="p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                      {selectedPlan?.perspective || "Ad-Hoc Assessment"}
                    </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-primary font-medium text-xs">Assessment Type</Label>
                    <div className="p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                      {selectedPlan?.type || "Org-Risk"}
                    </div>
                    </div>
                  </div>

                  {/* Inherit Assessment Scope */}
                  <div className="flex items-start gap-2 pt-1">
                    <Checkbox
                      id="inheritScope"
                      checked={inheritScope}
                      onCheckedChange={(checked) =>
                        handleInheritScopeChange(checked === true)
                      }
                      className="mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="inheritScope"
                        className="text-primary font-medium text-xs cursor-pointer"
                      >
                        Inherit Assessment Scope
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        {inheritScope
                          ? "Select/update risks to be assessed from the original scope of the selected plan."
                          : "Select an existing library risk for assessment or type a new risk title."}
                      </p>
                    </div>
                  </div>

                  {/* Conditional Content Based on Inherit Scope */}
                  {!inheritScope && (
                    <div className="space-y-3 pt-1">
                      {/* Search Library Risks */}
                      <div className="space-y-1.5">
                        <Label className="text-primary font-medium text-xs">
                          Select from Risk Library
                        </Label>
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                          <Input
                            placeholder="Search risks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setShowRiskList(true)}
                            className="pl-7 h-8 text-sm"
                          />
                        </div>
                        {showRiskList && (
                          <div className="border rounded max-h-32 overflow-auto">
                            {filteredLibraryRisks.slice(0, 10).map((risk) => (
                              <div
                                key={risk.id}
                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                                onClick={() => toggleLibraryRisk(risk.id)}
                              >
                                <Checkbox
                                  checked={selectedLibraryRisks.includes(risk.id)}
                                  onCheckedChange={() => toggleLibraryRisk(risk.id)}
                                />
                                <div className="flex-1">
                                  <p className="text-xs font-medium">{risk.title}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {risk.category}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Or Add New Risk */}
                      <div className="space-y-1">
                        <Label className="text-primary font-medium text-xs">
                          Or Add New Risk Title
                        </Label>
                        <Input
                          placeholder="Enter a new risk title..."
                          value={newRiskTitle}
                          onChange={(e) => setNewRiskTitle(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Assessments Section */}
              <Collapsible open={assessmentsOpen} onOpenChange={setAssessmentsOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 w-full text-left font-semibold text-sm text-foreground border-l-[3px] border-primary pl-2 py-1 bg-muted/40 rounded-r-sm hover:bg-muted/60 transition-colors">
                  {assessmentsOpen ? (
                    <ChevronDown className="w-4 h-4 text-primary" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-primary" />
                  )}
                  Assessments
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-2">
                  <p className="text-[10px] text-muted-foreground">
                    Specify the scope of one or more assessments. Choose from
                    organizations, assessable items and risks that need to be assessed.
                  </p>

                  {/* Action Bar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={handleAddScope}
                      className="gap-1 h-7 px-2 text-xs"
                    >
                      <Plus className="w-3 h-3" />
                      ADD SCOPE
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        const selected = scopes.filter((s) => s.organization);
                        if (selected.length > 0) {
                          handleDeleteScope(selected[0].id);
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={handleRefresh}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                    <div className="flex-1" />
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <Input
                        placeholder="Search scopes..."
                        value={scopeSearch}
                        onChange={(e) => setScopeSearch(e.target.value)}
                        className="pl-7 h-7 w-40 text-xs"
                      />
                    </div>
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                      <Maximize2 className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Scope Table */}
                  <div className="border rounded overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead className="w-8 py-1.5">
                            <Checkbox />
                          </TableHead>
                          <TableHead className="text-primary text-xs font-semibold py-1.5">
                            Organization <span className="text-destructive">*</span>
                          </TableHead>
                          <TableHead className="text-primary text-xs font-semibold py-1.5">
                            Risks
                          </TableHead>
                          <TableHead className="w-10 py-1.5"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scopes.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="text-center text-muted-foreground py-4 text-xs"
                            >
                              No scopes added. Click "ADD SCOPE" to begin.
                            </TableCell>
                          </TableRow>
                        ) : (
                          scopes.map((scope) => (
                            <TableRow key={scope.id} className="hover:bg-muted/20">
                              <TableCell className="py-1.5">
                                <Checkbox />
                              </TableCell>
                              <TableCell className="py-1.5">
                                <Input
                                  value={scope.organization}
                                  onChange={(e) => {
                                    setScopes(
                                      scopes.map((s) =>
                                        s.id === scope.id
                                          ? { ...s, organization: e.target.value }
                                          : s
                                      )
                                    );
                                  }}
                                  placeholder="Enter organization..."
                                  className="h-7 text-xs"
                                />
                              </TableCell>
                              <TableCell className="py-1.5">
                                <Input
                                  value={scope.risks || ""}
                                  onChange={(e) => {
                                    setScopes(
                                      scopes.map((s) =>
                                        s.id === scope.id
                                          ? { ...s, risks: e.target.value }
                                          : s
                                      )
                                    );
                                  }}
                                  placeholder="Enter risks..."
                                  className="h-7 text-xs"
                                />
                              </TableCell>
                              <TableCell className="py-1.5">
                                <span className="text-xs text-muted-foreground">
                                  {scope.risks}
                                </span>
                              </TableCell>
                              <TableCell className="py-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleDeleteScope(scope.id)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Scope Selection Modal */}
      <Dialog open={scopeModalOpen} onOpenChange={setScopeModalOpen}>
        <DialogContent className="max-w-md p-0 gap-0" hideCloseButton>
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-primary/30 bg-muted/30">
            <h3 className="text-sm font-semibold text-foreground">Scope</h3>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Maximize2 className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScopeModalOpen(false)}
                className="h-6 px-2 text-xs"
              >
                CANCEL
              </Button>
              <Button
                size="sm"
                onClick={handleScopeAdd}
                className="h-6 px-2 text-xs"
              >
                ADD
              </Button>
            </div>
          </div>

          <ScrollArea className="max-h-[70vh]">
            <div className="p-3 space-y-3">
              {/* Name */}
              <div className="space-y-1">
                <Label className="text-primary font-medium text-xs">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={scopeFormData.name}
                  onChange={(e) =>
                    setScopeFormData({ ...scopeFormData, name: e.target.value })
                  }
                  className="h-8 text-sm"
                />
              </div>

              {/* Organizations */}
              <div className="border rounded p-2 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-primary text-xs font-medium">
                    Organizations <span className="text-destructive">*</span>
                  </span>
                  {selectedScopeOrgs.length > 0 && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {selectedScopeOrgs.length} selected
                    </span>
                  )}
                </div>
                <Plus className="w-3 h-3 text-muted-foreground" />
              </div>

              {/* Risks */}
              <div className="border rounded p-2 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-primary text-xs font-medium">
                    Risks <span className="text-destructive">*</span>
                  </span>
                  {selectedScopeRisks.length > 0 && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {selectedScopeRisks.length} selected
                    </span>
                  )}
                </div>
                <Plus className="w-3 h-3 text-muted-foreground" />
              </div>

              {/* Assessors Section */}
              <div className="pt-1">
                <div className="border-l-[3px] border-primary pl-2 py-0.5 bg-muted/40 rounded-r-sm">
                  <h4 className="font-semibold text-xs text-foreground">Assessors</h4>
                </div>
              </div>

              {/* Available To */}
              <div className="space-y-1">
                <Label className="text-primary font-medium text-xs">
                  Available To <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={scopeFormData.availableTo}
                  onValueChange={(value) =>
                    setScopeFormData({ ...scopeFormData, availableTo: value })
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assessor">Assessor</SelectItem>
                    <SelectItem value="reviewer">Reviewer</SelectItem>
                    <SelectItem value="approver">Approver</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assessor */}
              <div className="border rounded p-2 flex items-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors">
                <Users className="w-3 h-3 text-muted-foreground" />
                <span className="text-primary text-xs font-medium flex-1">
                  Assessor <span className="text-destructive">*</span>
                </span>
                <Plus className="w-3 h-3 text-muted-foreground" />
              </div>

              {/* Approver */}
              <div className="border rounded p-2 flex items-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors">
                <Users className="w-3 h-3 text-muted-foreground" />
                <span className="text-primary text-xs font-medium flex-1">
                  Approver
                </span>
                <Plus className="w-3 h-3 text-muted-foreground" />
              </div>

              {/* Due Date Section */}
              <div className="pt-1">
                <div className="border-l-[3px] border-primary pl-2 py-0.5 bg-muted/40 rounded-r-sm">
                  <h4 className="font-semibold text-xs text-foreground">Due Date</h4>
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <Label className="text-primary font-medium text-xs">
                  Due Date <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-8 justify-start text-left font-normal text-sm",
                        !scopeFormData.dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {scopeFormData.dueDate
                        ? format(scopeFormData.dueDate, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scopeFormData.dueDate}
                      onSelect={(date) =>
                        setScopeFormData({ ...scopeFormData, dueDate: date })
                      }
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
