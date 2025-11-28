import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, AlertTriangle, FileCheck, Clock, TrendingUp, TrendingDown, UserPlus, Users as UsersIcon, RotateCcw, Edit2, LogOut, User, ChevronDown, ChevronRight, DollarSign, Sparkles, Plus, RefreshCw, MoreHorizontal, Link, ClipboardCheck, CheckCircle, CheckSquare, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface RiskData {
  id: string;
  title: string;
  riskLevel: string;
  parentRisk?: string;
  businessUnit: string;
  category: string;
  owner: string;
  assessors: string[];
  inherentRisk: { level: string; color: string };
  inherentTrend: { value: string; up: boolean };
  relatedControls: { id: string; name: string; type: string; nature: string };
  controlEffectiveness: { label: string; color: string };
  testResults: { label: string; sublabel: string };
  residualRisk: { level: string; color: string };
  residualTrend: { value: string; up: boolean };
  status: string;
  lastAssessed: string;
  previousAssessments: number;
  tabCategory: "own" | "assess" | "approve";
}

const Dashboard2ndLine = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"own" | "assess" | "approve">("assess");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(["R-001", "R-002", "R-003"]));
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    type: "inherent" | "controls" | "effectiveness" | "residual" | "trend" | null;
    riskId: string | null;
    currentValue: string;
  }>({
    open: false,
    type: null,
    riskId: null,
    currentValue: "",
  });
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: "reassign" | "collaborate" | "reassess" | null;
    riskId: string | null;
  }>({
    open: false,
    type: null,
    riskId: null,
  });
  const [riskData, setRiskData] = useState<RiskData[]>(initialRiskData);

  const toggleRow = (riskId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(riskId)) {
        newSet.delete(riskId);
      } else {
        newSet.add(riskId);
      }
      return newSet;
    });
  };

  const handleEdit = (type: typeof editDialog.type, riskId: string, currentValue: string) => {
    setEditDialog({ open: true, type, riskId, currentValue });
  };

  const handleSaveEdit = () => {
    toast.success("Changes saved successfully");
    setEditDialog({ open: false, type: null, riskId: null, currentValue: "" });
  };

  const handleAction = (type: typeof actionDialog.type, riskId: string) => {
    setActionDialog({ open: true, type, riskId });
  };

  const handleActionSubmit = () => {
    const actionName = actionDialog.type === "reassign" ? "Reassignment" : 
                       actionDialog.type === "collaborate" ? "Collaboration request" : 
                       "Reassessment";
    toast.success(`${actionName} completed successfully`);
    setActionDialog({ open: false, type: null, riskId: null });
  };

  const handleLogout = () => {
    navigate("/");
  };
  const metrics = [
    {
      title: "Assessments Pending Review",
      value: 24,
      trend: "+12% since last month",
      trendUp: true,
      icon: FileCheck,
      segments: [
        { label: "Overdue", value: 4, sublabel: "4 Overdue", color: "bg-red-600" },
        { label: "Due Today", value: 3, sublabel: "3 Due Today", color: "bg-amber-500" },
        { label: "Not Due Yet", value: 17, sublabel: "17 Not Due Yet", color: "bg-green-600" },
      ],
      description: "Prioritize \"Overdue\" and \"Due Today\" to maintain timely risk validation.",
    },
    {
      title: "High Residual Risks",
      value: 24,
      trend: "+5 since last quarter",
      trendUp: false,
      icon: AlertTriangle,
      segments: [
        { label: "Critical", value: 8, sublabel: "8 Critical", color: "bg-red-600" },
        { label: "High", value: 16, sublabel: "16 High", color: "bg-amber-500" },
        { label: "Medium", value: 45, sublabel: "45 Medium", color: "bg-green-600" },
      ],
      description: "Immediately prioritize review of Critical & High risks.",
    },
    {
      title: "RCSA Review & Challenge Process",
      value: 88,
      isPercentage: true,
      trend: "+7% since last month",
      trendUp: true,
      icon: FileCheck,
      segments: [
        { label: "Agreed (88%)", value: 155, sublabel: "155 Agreed", color: "bg-green-600" },
        { label: "Pending (8%)", value: 15, sublabel: "15 Pending", color: "bg-amber-500" },
        { label: "Challenged (4%)", value: 8, sublabel: "8 Challenged", color: "bg-red-600" },
      ],
      description: "Focus on challenged & pending items to maintain robust oversight.",
    },
    {
      title: "Operational Loss Events",
      value: "$4.2M",
      subLabel: "Total Financial Loss",
      trend: "+15% vs. Last Quarter",
      trendUp: false,
      icon: DollarSign,
      segments: [
        { label: "External Fraud", value: 1.2, sublabel: "External Fraud: $1.2M", color: "bg-red-800" },
        { label: "Process Error", value: 1.8, sublabel: "Process Error: $1.8M", color: "bg-orange-500" },
        { label: "System Failures", value: 1.2, sublabel: "System Failures: $1.2M", color: "bg-orange-300" },
      ],
      description: "Top 3 drivers caused over 90% of losses. Validate RCSA focus.",
    },
  ];

  const filteredRiskData = riskData.filter(risk => risk.tabCategory === activeTab);

  // Filter and organize risks by hierarchy
  const getVisibleRisks = () => {
    const visible: RiskData[] = [];
    filteredRiskData.forEach(risk => {
      if (risk.riskLevel === "Level 1") {
        visible.push(risk);
        if (expandedRows.has(risk.id)) {
          const level2Risks = filteredRiskData.filter(r => r.riskLevel === "Level 2" && r.parentRisk === risk.title);
          level2Risks.forEach(l2 => {
            visible.push(l2);
            if (expandedRows.has(l2.id)) {
              const level3Risks = filteredRiskData.filter(r => r.riskLevel === "Level 3" && r.parentRisk === l2.title);
              visible.push(...level3Risks);
            }
          });
        }
      }
    });
    return visible;
  };

  const hasChildren = (risk: RiskData) => {
    if (risk.riskLevel === "Level 1") {
      return filteredRiskData.some(r => r.riskLevel === "Level 2" && r.parentRisk === risk.title);
    }
    if (risk.riskLevel === "Level 2") {
      return filteredRiskData.some(r => r.riskLevel === "Level 3" && r.parentRisk === risk.title);
    }
    return false;
  };

  const getRiskLevelColor = (level: string) => {
    switch(level) {
      case "Level 1": return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400";
      case "Level 2": return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400";
      case "Level 3": return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Sent for Assessment": return "bg-cyan-500 text-white";
      case "In Progress": return "bg-amber-500 text-white";
      case "Pending Approval": return "bg-purple-500 text-white";
      case "Completed": return "bg-green-500 text-white";
      case "Overdue": return "bg-red-500 text-white";
      default: return "bg-blue-500 text-white";
    }
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case "Operational": return "bg-indigo-50 dark:bg-indigo-950/30";
      case "Technology": return "bg-cyan-50 dark:bg-cyan-950/30";
      case "Compliance": return "bg-purple-50 dark:bg-purple-950/30";
      case "Financial": return "bg-green-50 dark:bg-green-950/30";
      default: return "bg-muted/30";
    }
  };

  const getRiskBadgeColor = (color: string) => {
    switch (color) {
      case "red":
        return "bg-destructive/20 text-destructive border-destructive/30";
      case "yellow":
        return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "green":
        return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getEffectivenessBadge = (label: string, color: string) => {
    const colorClass = color === "green" 
      ? "bg-green-500 text-white" 
      : "bg-yellow-500 text-white";
    return <Badge className={`${colorClass} rounded-full`}>{label}</Badge>;
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-second-line to-primary flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  2nd Line Risk Analyst Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">Risk and Control Self Assessment</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="outline" size="sm">
                <UsersIcon className="w-4 h-4 mr-2" />
                My Team
              </Button>
              <Button size="sm">
                Export Report
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    2nd Line Analyst
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Current Persona</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Switch Persona / Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Scorecards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Quick Links Card */}
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Link className="w-5 h-5 text-primary" />
                Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button onClick={() => setActiveTab("assess")} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm w-full text-left">
                <ClipboardCheck className="w-4 h-4" />
                View Risks to be Assessed
              </button>
              <button onClick={() => setActiveTab("approve")} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm w-full text-left">
                <CheckCircle className="w-4 h-4" />
                View Risks to be Approved
              </button>
              <a href="#" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm">
                <AlertTriangle className="w-4 h-4" />
                View Open Challenges
              </a>
              <a href="#" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm">
                <CheckSquare className="w-4 h-4" />
                View Completed Challenges
              </a>
              <a href="#" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm">
                <AlertCircle className="w-4 h-4" />
                View Open Risk Events
              </a>
            </CardContent>
          </Card>

          {metrics.map((metric, index) => (
            <Card key={index} className="border-border/50 shadow-sm hover:shadow-md transition-shadow bg-card relative">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-foreground">{metric.title}</h3>
                  <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center flex-shrink-0">
                    <metric.icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground">
                      {typeof metric.value === 'string' ? metric.value : `${metric.value}${metric.isPercentage ? "%" : ""}`}
                    </span>
                  </div>
                  {metric.subLabel && (
                    <p className="text-sm font-medium text-muted-foreground">{metric.subLabel}</p>
                  )}
                  
                  <div className="flex items-center gap-2">
                    {metric.trendUp ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${metric.trendUp ? "text-green-600" : "text-red-600"}`}>
                      {metric.trend}
                    </span>
                  </div>
                  
                  {/* Status Bar */}
                  <div className="space-y-2">
                    <div className="flex h-6 rounded-lg overflow-hidden">
                      {metric.segments.map((segment, idx) => {
                        const total = metric.segments.reduce((sum, s) => sum + s.value, 0);
                        const percentage = (segment.value / total) * 100;
                        return (
                          <div
                            key={idx}
                            className={segment.color}
                            style={{ width: `${percentage}%` }}
                          />
                        );
                      })}
                    </div>
                    
                    {/* Legend */}
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                      {metric.segments.map((segment, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <div className={`w-3 h-3 rounded-sm ${segment.color}`} />
                          <span className="text-xs font-medium text-muted-foreground">
                            {segment.sublabel || segment.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground leading-snug pt-2">
                    {metric.description}
                  </p>
                </div>
                
                {/* AI Generated Icon */}
                <div className="absolute bottom-3 right-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Active Risk Profile Section */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/50 space-y-0 py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Active Risk Profile</CardTitle>
              <TooltipProvider>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" className="h-7 bg-blue-500 hover:bg-blue-600 text-white">
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add New Risk
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Create a new risk entry</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" className="h-7 bg-cyan-500 hover:bg-cyan-600 text-white">
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                        Reassess
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reassess selected risks</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" className="h-7 bg-green-500 hover:bg-green-600 text-white">
                        <UsersIcon className="h-3.5 w-3.5 mr-1" />
                        Collaborate
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Invite collaborators to work on risks</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" className="h-7 bg-purple-500 hover:bg-purple-600 text-white">
                        <UserPlus className="h-3.5 w-3.5 mr-1" />
                        Reassign
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reassign risks to another owner</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" className="h-7 bg-orange-500 hover:bg-orange-600 text-white">
                        <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                        Review & Challenge
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Review and challenge risk assessments</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Modern Segmented Tabs */}
            <div className="mb-3">
              <div className="inline-flex items-center gap-0 p-1 bg-muted/50 rounded-lg border border-border/50">
                <button
                  onClick={() => setActiveTab("own")}
                  className={`px-4 py-1.5 rounded-l-md font-medium text-sm transition-all border-r-2 border-muted-foreground/30 ${
                    activeTab === "own"
                      ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  Risks I Own
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === "own" ? "bg-white/20" : "bg-muted"
                  }`}>
                    {riskData.filter(r => r.tabCategory === "own").length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("assess")}
                  className={`px-4 py-1.5 font-medium text-sm transition-all border-r-2 border-muted-foreground/30 ${
                    activeTab === "assess"
                      ? "bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  Risks to be Assessed
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === "assess" ? "bg-white/20" : "bg-muted"
                  }`}>
                    {riskData.filter(r => r.tabCategory === "assess").length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("approve")}
                  className={`px-4 py-1.5 rounded-r-md font-medium text-sm transition-all ${
                    activeTab === "approve"
                      ? "bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  Risks to be Approved
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === "approve" ? "bg-white/20" : "bg-muted"
                  }`}>
                    {riskData.filter(r => r.tabCategory === "approve").length}
                  </span>
                </button>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2.5 mb-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  {activeTab === "own" && "These are risks you own and are responsible for managing. Review control effectiveness and ensure residual risks remain within acceptable tolerance."}
                  {activeTab === "assess" && "These risks require your assessment and input. Evaluate risk ratings, validate controls, and provide your professional judgment on the adequacy of mitigation measures."}
                  {activeTab === "approve" && "These risk assessments are awaiting your approval. Review completeness, validate assessment quality, and ensure alignment with enterprise risk appetite before approving."}
                </p>
              </div>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="assessment-context" className="text-xs font-medium text-muted-foreground">
                  Assessment Context
                </Label>
                <Select defaultValue="retail">
                  <SelectTrigger id="assessment-context" className="w-48 h-8 bg-primary text-primary-foreground border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Retail Banking</SelectItem>
                    <SelectItem value="corporate">Corporate Banking</SelectItem>
                    <SelectItem value="investment">Investment Banking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select defaultValue="all">
                <SelectTrigger className="w-40 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative flex-1 min-w-[200px]">
                <Input placeholder="Search risks..." className="pl-10 h-8" />
                <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="border-collapse">
                  <TableHeader className="bg-muted/50 sticky top-0">
                    <TableRow>
                      <TableHead className="w-12 py-2 border-r border-b border-border">
                        <Checkbox />
                      </TableHead>
                      <TableHead className="min-w-[100px] py-2 border-r border-b border-border">Risk ID</TableHead>
                      <TableHead className="min-w-[220px] py-2 border-r border-b border-border">Risk Title</TableHead>
                      <TableHead className="min-w-[100px] py-2 border-r border-b border-border">Risk Hierarchy</TableHead>
                      <TableHead className="min-w-[180px] py-2 border-r border-b border-border">Assessors/Collaborators</TableHead>
                      <TableHead className="min-w-[140px] py-2 border-r border-b border-border">Last Assessed Date</TableHead>
                      <TableHead className="min-w-[180px] py-2 border-r border-b border-border">Inherent Risk</TableHead>
                      <TableHead className="min-w-[180px] py-2 border-r border-b border-border">Related Controls</TableHead>
                      <TableHead className="min-w-[200px] py-2 border-r border-b border-border">Calculated Control Effectiveness</TableHead>
                      <TableHead className="min-w-[180px] py-2 border-r border-b border-border">Control Test Results</TableHead>
                      <TableHead className="min-w-[180px] py-2 border-r border-b border-border">Residual Risk</TableHead>
                      <TableHead className="min-w-[160px] py-2 border-b border-border">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getVisibleRisks().map((risk, index) => {
                      const isLevel1 = risk.riskLevel === "Level 1";
                      const isLevel2 = risk.riskLevel === "Level 2";
                      const isLevel3 = risk.riskLevel === "Level 3";
                      const isExpanded = expandedRows.has(risk.id);
                      const canExpand = hasChildren(risk);
                      
                      return (
                      <TableRow key={index} className={`hover:bg-muted/50 transition-colors ${
                        isLevel1 ? 'bg-blue-50/30 dark:bg-blue-950/10' : 
                        isLevel2 ? 'bg-purple-50/20 dark:bg-purple-950/10' : 
                        'bg-orange-50/10 dark:bg-orange-950/10'
                      }`}>
                        <TableCell className="py-2 border-r border-b border-border">
                          <Checkbox />
                        </TableCell>
                        <TableCell className="font-medium py-2 border-r border-b border-border">{risk.id}</TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className={`flex items-start gap-2 ${isLevel2 ? 'pl-8' : isLevel3 ? 'pl-16' : ''}`}>
                            {canExpand && (
                              <button
                                onClick={() => toggleRow(risk.id)}
                                className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0 mt-0.5"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                              </button>
                            )}
                            {!canExpand && <div className="w-6" />}
                            <div className="flex flex-col gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a 
                                    href="https://preview--enhanced-risk-assessment.lovable.app/?__lovable_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoib3ZwQ1lDNkp4aGFGeG9VRWhaS00yZU9XQUV4MiIsInByb2plY3RfaWQiOiIxNTIxYjFjMi03NGJhLTQ4NGYtOWYzNi02MmNkZTMwMjExM2IiLCJub25jZSI6IjZhOGIzMjVlMDNhNDQ0MjkyYzcwMDIxOTNjNzIyNTI5IiwiaXNzIjoibG92YWJsZS1hcGkiLCJzdWIiOiIxNTIxYjFjMi03NGJhLTQ4NGYtOWYzNi02MmNkZTMwMjExM2IiLCJhdWQiOlsibG92YWJsZS1hcHAiXSwiZXhwIjoxNzY0OTEzOTQ0LCJuYmYiOjE3NjQzMDkxNDQsImlhdCI6MTc2NDMwOTE0NH0.s8EKKWcZzjfA00Q1h1pLUyOPYdraiiGgKajQVcg4XdM/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-left hover:text-primary transition-colors font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                  >
                                    {risk.title}
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Click on this link to open the risk assessment form</p>
                                </TooltipContent>
                              </Tooltip>
                              <span className="text-xs text-muted-foreground">{risk.owner}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-md font-medium inline-block w-fit ${getCategoryColor(risk.category)}`}>
                                {risk.category}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <Badge className={`${getRiskLevelColor(risk.riskLevel)} border text-xs font-medium`}>
                            {risk.riskLevel}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="flex flex-wrap gap-1">
                            {risk.assessors.map((assessor, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                                {assessor}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="space-y-0.5">
                            <div className="text-sm">{risk.lastAssessed}</div>
                            <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              View History ({risk.previousAssessments})
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={`${getRiskBadgeColor(risk.inherentRisk.color)} border rounded-full px-2`}>
                                {risk.inherentRisk.level}
                              </Badge>
                              {risk.inherentTrend.up ? (
                                <TrendingUp className="w-3 h-3 text-red-600" />
                              ) : (
                                <TrendingDown className="w-3 h-3 text-green-600" />
                              )}
                              <span className={`text-xs font-medium ${risk.inherentTrend.up ? "text-red-600" : "text-green-600"}`}>
                                {risk.inherentTrend.value}
                              </span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={() => handleEdit("inherent", risk.id, risk.inherentRisk.level)}
                                    >
                                      <Edit2 className="w-3 h-3 text-muted-foreground hover:text-primary cursor-pointer" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit Inherent Risk</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline text-left">
                              View Previous
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="flex items-center gap-2">
                            <div className="space-y-0.5">
                              <div className="text-xs text-muted-foreground">{risk.relatedControls.id}</div>
                              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">{risk.relatedControls.name}</div>
                              <div className="flex gap-2 text-xs text-muted-foreground">
                                <span>{risk.relatedControls.type}</span>
                                <span>{risk.relatedControls.nature}</span>
                              </div>
                            </div>
...
                          </div>
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="flex items-center gap-2">
                            {getEffectivenessBadge(risk.controlEffectiveness.label, risk.controlEffectiveness.color)}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => handleEdit("effectiveness", risk.id, risk.controlEffectiveness.label)}
                                  >
                                    <Edit2 className="w-3 h-3 text-muted-foreground hover:text-primary cursor-pointer" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit Control Effectiveness</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-1">
                              <Badge className="bg-green-500 text-white rounded-full px-2.5 py-1 text-xs">
                                {risk.testResults.label}
                              </Badge>
...
                            </div>
                            <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              View Previous
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={`${getRiskBadgeColor(risk.residualRisk.color)} border rounded-full px-2`}>
                                {risk.residualRisk.level}
                              </Badge>
                              {risk.residualTrend.up ? (
                                <TrendingUp className="w-3 h-3 text-red-600" />
                              ) : (
                                <TrendingDown className="w-3 h-3 text-green-600" />
                              )}
                              <span className={`text-xs font-medium ${risk.residualTrend.up ? "text-red-600" : "text-green-600"}`}>
                                {risk.residualTrend.value}
                              </span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={() => handleEdit("residual", risk.id, risk.residualRisk.level)}
                                    >
                                      <Edit2 className="w-3 h-3 text-muted-foreground hover:text-primary cursor-pointer" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit Residual Risk</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline text-left">
                              View Previous
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 border-b border-border">
                          <Badge className={`${getStatusColor(risk.status)} rounded-full shadow-sm`}>
                            {risk.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ ...editDialog, open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit {editDialog.type === "inherent" ? "Inherent Risk" : 
                    editDialog.type === "controls" ? "Related Controls" :
                    editDialog.type === "effectiveness" ? "Control Effectiveness" :
                    editDialog.type === "residual" ? "Residual Risk" : "Residual Trend"}
            </DialogTitle>
            <DialogDescription>
              Update the value for risk {editDialog.riskId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-value">New Value</Label>
              <Input
                id="edit-value"
                defaultValue={editDialog.currentValue}
                placeholder="Enter new value"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ ...editDialog, open: false })}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ ...actionDialog, open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "reassign" ? "Reassign Risk" :
               actionDialog.type === "collaborate" ? "Collaborate on Risk" :
               "Reassess Risk"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === "reassign" ? "Select a new owner for this risk assessment" :
               actionDialog.type === "collaborate" ? "Invite team members to collaborate on this risk" :
               "Schedule a new assessment for this risk"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {actionDialog.type === "reassign" && (
              <div className="space-y-2">
                <Label htmlFor="assignee">Assign To</Label>
                <Select>
                  <SelectTrigger id="assignee">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="analyst1">Risk Analyst 1</SelectItem>
                    <SelectItem value="analyst2">Risk Analyst 2</SelectItem>
                    <SelectItem value="manager">Risk Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {actionDialog.type === "collaborate" && (
              <div className="space-y-2">
                <Label htmlFor="collaborators">Add Collaborators</Label>
                <Input
                  id="collaborators"
                  placeholder="Enter email addresses (comma separated)"
                />
              </div>
            )}
            {actionDialog.type === "reassess" && (
              <div className="space-y-2">
                <Label htmlFor="assessment-date">Assessment Date</Label>
                <Input
                  id="assessment-date"
                  type="date"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ ...actionDialog, open: false })}>
              Cancel
            </Button>
            <Button onClick={handleActionSubmit}>
              {actionDialog.type === "reassign" ? "Reassign" :
               actionDialog.type === "collaborate" ? "Send Invites" :
               "Schedule Assessment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
};

// Sample data with 10 rows across different tabs and hierarchy levels
const initialRiskData: RiskData[] = [
  {
    id: "R-001",
    title: "Operational Process Failure",
    riskLevel: "Level 1",
    businessUnit: "Retail Banking",
    category: "Operational",
    owner: "Michael Chen (Operations)",
    assessors: ["Sarah Johnson", "David Kim"],
    inherentRisk: { level: "Medium", color: "yellow" },
    inherentTrend: { value: "13%", up: false },
    relatedControls: { id: "Control-003", name: "Quality Assurance", type: "Manual", nature: "Detective" },
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Low", color: "green" },
    residualTrend: { value: "7%", up: true },
    status: "Sent for Assessment",
    lastAssessed: "2025-10-20",
    previousAssessments: 5,
    tabCategory: "assess",
  },
  {
    id: "R-001-A",
    title: "Branch Transaction Processing",
    riskLevel: "Level 2",
    parentRisk: "Operational Process Failure",
    businessUnit: "Retail Banking",
    category: "Operational",
    owner: "Branch Manager",
    assessors: ["Emily White"],
    inherentRisk: { level: "High", color: "red" },
    inherentTrend: { value: "12%", up: false },
    relatedControls: { id: "Control-009", name: "Branch Audits", type: "Manual", nature: "Detective" },
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "" },
    residualRisk: { level: "Medium", color: "yellow" },
    residualTrend: { value: "14%", up: true },
    status: "Sent for Assessment",
    lastAssessed: "2025-10-18",
    previousAssessments: 6,
    tabCategory: "assess",
  },
  {
    id: "R-001-A-1",
    title: "Cash Handling Errors",
    riskLevel: "Level 3",
    parentRisk: "Branch Transaction Processing",
    businessUnit: "Retail Banking",
    category: "Operational",
    owner: "Teller Supervisor",
    assessors: ["James Brown", "Lisa Martinez", "Tom Wilson"],
    inherentRisk: { level: "Medium", color: "yellow" },
    inherentTrend: { value: "8%", up: true },
    relatedControls: { id: "Control-012", name: "Dual Authorization", type: "Automated", nature: "Preventive" },
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Low", color: "green" },
    residualTrend: { value: "5%", up: false },
    status: "In Progress",
    lastAssessed: "2025-10-15",
    previousAssessments: 8,
    tabCategory: "assess",
  },
  {
    id: "R-002",
    title: "Cybersecurity Threat",
    riskLevel: "Level 1",
    businessUnit: "Retail Banking",
    category: "Technology",
    owner: "CISO Office",
    assessors: ["Alex Turner", "Maria Garcia"],
    inherentRisk: { level: "Critical", color: "red" },
    inherentTrend: { value: "20%", up: true },
    relatedControls: { id: "Control-015", name: "Firewall & IDS", type: "Automated", nature: "Preventive" },
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "Design Effective" },
    residualRisk: { level: "High", color: "red" },
    residualTrend: { value: "18%", up: true },
    status: "Pending Approval",
    lastAssessed: "2025-10-22",
    previousAssessments: 12,
    tabCategory: "approve",
  },
  {
    id: "R-002-A",
    title: "Phishing Attacks",
    riskLevel: "Level 2",
    parentRisk: "Cybersecurity Threat",
    businessUnit: "Retail Banking",
    category: "Technology",
    owner: "Security Team",
    assessors: ["Robert Chen", "Nina Patel"],
    inherentRisk: { level: "High", color: "red" },
    inherentTrend: { value: "15%", up: true },
    relatedControls: { id: "Control-018", name: "Email Filtering", type: "Automated", nature: "Preventive" },
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "" },
    residualRisk: { level: "Medium", color: "yellow" },
    residualTrend: { value: "12%", up: false },
    status: "Pending Approval",
    lastAssessed: "2025-10-21",
    previousAssessments: 9,
    tabCategory: "approve",
  },
  {
    id: "R-003",
    title: "Regulatory Compliance Risk",
    riskLevel: "Level 1",
    businessUnit: "Retail Banking",
    category: "Compliance",
    owner: "Compliance Officer",
    assessors: ["Kevin Lee"],
    inherentRisk: { level: "High", color: "red" },
    inherentTrend: { value: "10%", up: false },
    relatedControls: { id: "Control-020", name: "Policy Framework", type: "Manual", nature: "Preventive" },
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Low", color: "green" },
    residualTrend: { value: "6%", up: false },
    status: "Completed",
    lastAssessed: "2025-10-19",
    previousAssessments: 15,
    tabCategory: "own",
  },
  {
    id: "R-003-A",
    title: "AML Reporting Gaps",
    riskLevel: "Level 2",
    parentRisk: "Regulatory Compliance Risk",
    businessUnit: "Retail Banking",
    category: "Compliance",
    owner: "AML Team Lead",
    assessors: ["Patricia Adams", "Daniel Foster"],
    inherentRisk: { level: "Critical", color: "red" },
    inherentTrend: { value: "22%", up: true },
    relatedControls: { id: "Control-023", name: "Transaction Monitoring", type: "Automated", nature: "Detective" },
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "" },
    residualRisk: { level: "High", color: "red" },
    residualTrend: { value: "19%", up: true },
    status: "Overdue",
    lastAssessed: "2025-09-28",
    previousAssessments: 11,
    tabCategory: "own",
  },
  {
    id: "R-004",
    title: "Market Risk Exposure",
    riskLevel: "Level 1",
    businessUnit: "Corporate Banking",
    category: "Financial",
    owner: "Treasury Department",
    assessors: ["Michelle Wong"],
    inherentRisk: { level: "Medium", color: "yellow" },
    inherentTrend: { value: "9%", up: false },
    relatedControls: { id: "Control-025", name: "Hedging Strategy", type: "Manual", nature: "Preventive" },
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Low", color: "green" },
    residualTrend: { value: "4%", up: false },
    status: "In Progress",
    lastAssessed: "2025-10-17",
    previousAssessments: 7,
    tabCategory: "approve",
  },
  {
    id: "R-005",
    title: "Third-Party Vendor Risk",
    riskLevel: "Level 1",
    businessUnit: "Retail Banking",
    category: "Operational",
    owner: "Procurement Manager",
    assessors: ["Rachel Green", "Steven Park"],
    inherentRisk: { level: "High", color: "red" },
    inherentTrend: { value: "16%", up: true },
    relatedControls: { id: "Control-028", name: "Vendor Due Diligence", type: "Manual", nature: "Preventive" },
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "Design Effective" },
    residualRisk: { level: "Medium", color: "yellow" },
    residualTrend: { value: "13%", up: true },
    status: "Sent for Assessment",
    lastAssessed: "2025-10-16",
    previousAssessments: 4,
    tabCategory: "assess",
  },
  {
    id: "R-006",
    title: "Data Privacy Breach",
    riskLevel: "Level 1",
    businessUnit: "Retail Banking",
    category: "Technology",
    owner: "Data Protection Officer",
    assessors: ["Angela Smith"],
    inherentRisk: { level: "Critical", color: "red" },
    inherentTrend: { value: "25%", up: true },
    relatedControls: { id: "Control-030", name: "Encryption & Access Controls", type: "Automated", nature: "Preventive" },
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "" },
    residualRisk: { level: "Medium", color: "yellow" },
    residualTrend: { value: "11%", up: false },
    status: "Completed",
    lastAssessed: "2025-10-23",
    previousAssessments: 10,
    tabCategory: "own",
  },
];

export default Dashboard2ndLine;
