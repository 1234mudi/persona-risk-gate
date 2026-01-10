import React, { useState, useMemo, useEffect } from "react";
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
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskAssessmentTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (taskData: RiskAssessmentTaskData) => void;
}

interface RiskAssessmentTaskData {
  planId: string;
  planTitle: string;
  inheritScope: boolean;
  scopeData: OrganizationRiskScope[];
}

interface OrganizationRiskScope {
  id: string;
  organization: string;
  organizationId: string;
  risks: {
    id: string;
    title: string;
    selected: boolean;
  }[];
}

// Mock plans with their associated organization-risk scope data
const mockPlans = [
  {
    id: "plan-1",
    title: "Assess all Employee Related Risk for Retail Banking",
  },
  {
    id: "plan-2",
    title: "Quarterly Operational Risk Assessment",
  },
  {
    id: "plan-3",
    title: "Annual Compliance Review",
  },
];

// Plan scope data - hierarchical organization-risk mappings
const planScopeData: Record<string, OrganizationRiskScope[]> = {
  "plan-1": [
    {
      id: "org-1",
      organizationId: "org-1",
      organization: "Retail Banking",
      risks: [
        { id: "R-001", title: "Operational Process Failure", selected: true },
        { id: "R-002", title: "Cybersecurity Threat", selected: true },
        { id: "R-003", title: "Credit Risk Exposure", selected: true },
      ],
    },
    {
      id: "org-2",
      organizationId: "org-2",
      organization: "Corporate Banking",
      risks: [
        { id: "R-004", title: "Market Risk", selected: true },
        { id: "R-005", title: "Liquidity Risk", selected: true },
      ],
    },
    {
      id: "org-3",
      organizationId: "org-3",
      organization: "Investment Services",
      risks: [
        { id: "R-006", title: "Regulatory Compliance Risk", selected: true },
        { id: "R-007", title: "Fraud Risk", selected: true },
        { id: "R-008", title: "Third Party Risk", selected: true },
      ],
    },
  ],
  "plan-2": [
    {
      id: "org-4",
      organizationId: "org-4",
      organization: "Operations Division",
      risks: [
        { id: "R-009", title: "Business Continuity Risk", selected: true },
        { id: "R-010", title: "Technology Failure Risk", selected: true },
      ],
    },
    {
      id: "org-5",
      organizationId: "org-5",
      organization: "Risk Management",
      risks: [
        { id: "R-011", title: "Model Risk", selected: true },
        { id: "R-012", title: "Data Quality Risk", selected: true },
      ],
    },
  ],
  "plan-3": [
    {
      id: "org-6",
      organizationId: "org-6",
      organization: "Compliance Department",
      risks: [
        { id: "R-013", title: "AML Compliance Risk", selected: true },
        { id: "R-014", title: "KYC Risk", selected: true },
        { id: "R-015", title: "Sanctions Risk", selected: true },
      ],
    },
  ],
};

export function RiskAssessmentTaskModal({
  open,
  onOpenChange,
  onSubmit,
}: RiskAssessmentTaskModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [inheritScope, setInheritScope] = useState(false);
  const [scopeData, setScopeData] = useState<OrganizationRiskScope[]>([]);
  const [expandedOrgs, setExpandedOrgs] = useState<string[]>([]);
  const [assessmentScopeOpen, setAssessmentScopeOpen] = useState(true);

  // Reset all state when modal opens to ensure fresh form
  useEffect(() => {
    if (open) {
      setInheritScope(false);
      setSelectedPlanId("");
      setScopeData([]);
      setExpandedOrgs([]);
      setAssessmentScopeOpen(true);
    }
  }, [open]);

  const selectedPlan = useMemo(
    () => mockPlans.find((p) => p.id === selectedPlanId),
    [selectedPlanId]
  );

  // Check if at least one risk is selected for validation
  const hasSelectedRisks = useMemo(() => {
    return scopeData.some((org) => org.risks.some((r) => r.selected));
  }, [scopeData]);

  // Can proceed only if checkbox checked, plan selected, and at least one risk selected
  const canProceed = inheritScope && selectedPlanId && hasSelectedRisks;

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    // Load scope data from the selected plan
    const planScope = planScopeData[planId] || [];
    // Deep copy to allow modifications
    const scopeCopy = planScope.map((org) => ({
      ...org,
      risks: org.risks.map((risk) => ({ ...risk })),
    }));
    setScopeData(scopeCopy);
    // Expand all organizations by default
    setExpandedOrgs(scopeCopy.map((org) => org.id));
  };

  const handleInheritScopeChange = (checked: boolean) => {
    setInheritScope(checked);
    if (!checked) {
      // Reset plan and scope when unchecked
      setSelectedPlanId("");
      setScopeData([]);
      setExpandedOrgs([]);
    }
  };

  const handleSubmit = () => {
    if (!selectedPlan || !canProceed) return;

    const taskData: RiskAssessmentTaskData = {
      planId: selectedPlan.id,
      planTitle: selectedPlan.title,
      inheritScope,
      scopeData: scopeData.filter((org) => org.risks.some((r) => r.selected)),
    };

    onSubmit?.(taskData);
  };

  const toggleOrgExpanded = (orgId: string) => {
    setExpandedOrgs((prev) =>
      prev.includes(orgId)
        ? prev.filter((id) => id !== orgId)
        : [...prev, orgId]
    );
  };

  const handleRemoveOrg = (orgId: string) => {
    setScopeData((prev) => prev.filter((org) => org.id !== orgId));
  };

  const handleToggleRisk = (orgId: string, riskId: string) => {
    setScopeData((prev) =>
      prev.map((org) => {
        if (org.id === orgId) {
          return {
            ...org,
            risks: org.risks.map((risk) =>
              risk.id === riskId ? { ...risk, selected: !risk.selected } : risk
            ),
          };
        }
        return org;
      })
    );
  };

  const handleToggleOrg = (orgId: string, checked: boolean) => {
    setScopeData((prev) =>
      prev.map((org) => {
        if (org.id === orgId) {
          return {
            ...org,
            risks: org.risks.map((risk) => ({ ...risk, selected: checked })),
          };
        }
        return org;
      })
    );
  };

  const getSelectedRiskCount = (org: OrganizationRiskScope) => {
    return org.risks.filter((r) => r.selected).length;
  };

  const isOrgFullySelected = (org: OrganizationRiskScope) => {
    return org.risks.every((r) => r.selected);
  };

  const isOrgPartiallySelected = (org: OrganizationRiskScope) => {
    const selectedCount = getSelectedRiskCount(org);
    return selectedCount > 0 && selectedCount < org.risks.length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl p-0 gap-0 max-h-[85vh] flex flex-col overflow-hidden"
        hideCloseButton
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1 border-b border-primary/30 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
              <FileText className="w-3 h-3 text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">
              Ad-Hoc Risk Assessment
            </h2>
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
              disabled={!canProceed}
              className="h-6 px-2 text-[10px]"
            >
              PROCEED
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          <div className="space-y-3">
            {/* Inherit Assessment Scope - Primary Control (Always visible) */}
            <div className="flex items-start gap-2 p-3 border rounded bg-muted/20">
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
                  Inherit Existing Assessment Scope via Plan
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  {inheritScope
                    ? "Select a plan to inherit its scope for assessment."
                    : "A risk has to be selected to begin the assessment process."}
                </p>
              </div>
            </div>

            {/* Show Risk Assessment Plan dropdown when checkbox is checked */}
            {inheritScope && (
              <div className="space-y-1 pl-3">
                <Label className="text-primary font-medium text-xs">
                  Risk Assessment Plan <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedPlanId} onValueChange={handlePlanChange}>
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
            )}

            {/* Show Assessment Scope section when a plan is selected */}
            {inheritScope && selectedPlanId && scopeData.length > 0 && (
              <Collapsible
                open={assessmentScopeOpen}
                onOpenChange={setAssessmentScopeOpen}
              >
                <CollapsibleTrigger className="flex items-center gap-2 w-full text-left font-semibold text-sm text-foreground border-l-[3px] border-primary pl-2 py-1 bg-muted/40 rounded-r-sm hover:bg-muted/60 transition-colors">
                  {assessmentScopeOpen ? (
                    <ChevronDown className="w-4 h-4 text-primary" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-primary" />
                  )}
                  Assessment Scope
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-2">
                  <p className="text-[10px] text-muted-foreground">
                    The following organizations and risks are scoped for
                    assessment based on the selected plan. You can edit the
                    scope by selecting/deselecting risks or removing
                    organizations.
                  </p>

                  {/* Hierarchical Scope Table */}
                  <div className="border rounded overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead className="w-8 py-1.5"></TableHead>
                          <TableHead className="w-8 py-1.5"></TableHead>
                          <TableHead className="text-xs py-1.5 font-semibold">
                            Organization / Risk
                          </TableHead>
                          <TableHead className="text-xs py-1.5 font-semibold text-right">
                            Selected
                          </TableHead>
                          <TableHead className="w-8 py-1.5"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scopeData.map((org) => (
                          <React.Fragment key={org.id}>
                            {/* Organization Row */}
                            <TableRow className="bg-muted/20 hover:bg-muted/30">
                              <TableCell className="py-1.5 w-8">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0"
                                  onClick={() => toggleOrgExpanded(org.id)}
                                >
                                  {expandedOrgs.includes(org.id) ? (
                                    <ChevronDown className="w-3 h-3 text-primary" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 text-primary" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell className="py-1.5 w-8">
                                <Checkbox
                                  checked={isOrgFullySelected(org)}
                                  className={cn(
                                    isOrgPartiallySelected(org) &&
                                      "data-[state=unchecked]:bg-primary/30"
                                  )}
                                  onCheckedChange={(checked) =>
                                    handleToggleOrg(org.id, checked === true)
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-xs py-1.5 font-medium">
                                {org.organization}
                              </TableCell>
                              <TableCell className="text-xs py-1.5 text-right text-muted-foreground">
                                {getSelectedRiskCount(org)} of {org.risks.length}{" "}
                                risks
                              </TableCell>
                              <TableCell className="py-1.5 w-8">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleRemoveOrg(org.id)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                            {/* Risk Rows (nested under organization) */}
                            {expandedOrgs.includes(org.id) &&
                              org.risks.map((risk) => (
                                <TableRow
                                  key={risk.id}
                                  className="hover:bg-muted/10"
                                >
                                  <TableCell className="py-1 w-8"></TableCell>
                                  <TableCell className="py-1 w-8 pl-4">
                                    <Checkbox
                                      checked={risk.selected}
                                      onCheckedChange={() =>
                                        handleToggleRisk(org.id, risk.id)
                                      }
                                    />
                                  </TableCell>
                                  <TableCell
                                    colSpan={2}
                                    className="text-xs py-1 pl-6 text-muted-foreground"
                                  >
                                    <span className="text-muted-foreground/60 mr-1">
                                      └
                                    </span>
                                    {risk.title}
                                  </TableCell>
                                  <TableCell className="py-1 w-8"></TableCell>
                                </TableRow>
                              ))}
                          </React.Fragment>
                        ))}
                        {scopeData.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center text-xs text-muted-foreground py-4"
                            >
                              No scope data available for this plan.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Summary */}
                  {scopeData.length > 0 && (
                    <div className="text-[10px] text-muted-foreground bg-muted/30 p-2 rounded">
                      <strong>Summary:</strong> {scopeData.length} organization
                      {scopeData.length !== 1 ? "s" : ""},{" "}
                      {scopeData.reduce(
                        (acc, org) => acc + getSelectedRiskCount(org),
                        0
                      )}{" "}
                      risk
                      {scopeData.reduce(
                        (acc, org) => acc + getSelectedRiskCount(org),
                        0
                      ) !== 1
                        ? "s"
                        : ""}{" "}
                      selected for assessment
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
