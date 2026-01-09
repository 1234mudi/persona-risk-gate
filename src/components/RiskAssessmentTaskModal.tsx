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
} from "lucide-react";
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
  const [inheritScope, setInheritScope] = useState(true);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl p-0 gap-0 max-h-[90vh] flex flex-col"
        hideCloseButton
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-cyan-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold">Risk Assessment Task</h2>
            <button className="text-muted-foreground hover:text-foreground">
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              CLOSE
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedPlanId}
            >
              SUBMIT
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {/* General Section */}
            <Collapsible open={generalOpen} onOpenChange={setGeneralOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full text-left font-medium text-base hover:text-primary py-2">
                {generalOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                General
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <div className="grid gap-4">
                  {/* Risk Assessment Plan */}
                  <div className="space-y-2">
                    <Label htmlFor="plan" className="text-sm font-medium">
                      Risk Assessment Plan <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={selectedPlanId}
                      onValueChange={setSelectedPlanId}
                    >
                      <SelectTrigger id="plan">
                        <SelectValue placeholder="Select a risk assessment plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockPlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Perspective */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Perspective</Label>
                    <div className="p-3 bg-muted rounded-md text-sm">
                      {selectedPlan?.perspective || "Select a plan to view perspective"}
                    </div>
                  </div>

                  {/* Assessment Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Assessment Type</Label>
                    <div className="p-3 bg-muted rounded-md text-sm">
                      {selectedPlan?.type || "Select a plan to view assessment type"}
                    </div>
                  </div>

                  {/* Inherit Assessment Scope */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="inheritScope"
                        checked={inheritScope}
                        onCheckedChange={(checked) =>
                          setInheritScope(checked === true)
                        }
                        className="mt-0.5"
                      />
                      <div className="space-y-1">
                        <Label
                          htmlFor="inheritScope"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Inherit Assessment Scope
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {inheritScope
                            ? "Select/update risks to be assessed from the original scope of the selected plan."
                            : "Select an existing library risk for assessment or type a new risk title."}
                        </p>
                      </div>
                    </div>

                    {/* Conditional Content Based on Inherit Scope */}
                    {!inheritScope && (
                      <div className="ml-6 space-y-4 pt-2">
                        {/* Search Library Risks */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Select from Risk Library
                          </Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="Search risks..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-9"
                            />
                          </div>
                          <div className="border rounded-md max-h-48 overflow-auto">
                            {filteredLibraryRisks.slice(0, 10).map((risk) => (
                              <div
                                key={risk.id}
                                className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                                onClick={() => toggleLibraryRisk(risk.id)}
                              >
                                <Checkbox
                                  checked={selectedLibraryRisks.includes(risk.id)}
                                  onCheckedChange={() => toggleLibraryRisk(risk.id)}
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{risk.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {risk.category}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Or Add New Risk */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Or Add New Risk Title
                          </Label>
                          <Input
                            placeholder="Enter a new risk title..."
                            value={newRiskTitle}
                            onChange={(e) => setNewRiskTitle(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Assessments Section */}
            <Collapsible open={assessmentsOpen} onOpenChange={setAssessmentsOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full text-left font-medium text-base hover:text-primary py-2">
                {assessmentsOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                Assessments
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Specify the scope of one or more assessments. Choose from
                  organizations, assessable items and risks that need to be
                  assessed.
                </p>

                {/* Action Bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={handleAddScope}
                    className="gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    ADD SCOPE
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      const selected = scopes.filter((s) => s.organization);
                      if (selected.length > 0) {
                        handleDeleteScope(selected[0].id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleRefresh}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <div className="flex-1" />
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search scopes..."
                      value={scopeSearch}
                      onChange={(e) => setScopeSearch(e.target.value)}
                      className="pl-9 h-8 w-48"
                    />
                  </div>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Scope Table */}
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox />
                        </TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Assessable Items</TableHead>
                        <TableHead>Risks</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scopes.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center text-muted-foreground py-8"
                          >
                            No scopes added. Click "ADD SCOPE" to begin.
                          </TableCell>
                        </TableRow>
                      ) : (
                        scopes.map((scope) => (
                          <TableRow key={scope.id}>
                            <TableCell>
                              <Checkbox />
                            </TableCell>
                            <TableCell>
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
                                className="h-8"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={scope.assessableItems}
                                onChange={(e) => {
                                  setScopes(
                                    scopes.map((s) =>
                                      s.id === scope.id
                                        ? { ...s, assessableItems: e.target.value }
                                        : s
                                    )
                                  );
                                }}
                                placeholder="Enter assessable items..."
                                className="h-8"
                              />
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {scope.risks}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDeleteScope(scope.id)}
                              >
                                <X className="w-4 h-4" />
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
  );
}
