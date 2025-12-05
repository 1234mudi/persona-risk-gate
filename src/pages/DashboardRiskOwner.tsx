import { useState, useRef, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UserCheck, AlertTriangle, FileCheck, Clock, TrendingUp, TrendingDown, UserPlus, Users as UsersIcon, RotateCcw, Edit2, LogOut, User, ChevronDown, ChevronRight, Sparkles, Plus, RefreshCw, MoreHorizontal, Link, CheckCircle, CheckSquare, AlertCircle, Lock, ArrowUp, ArrowDown, Mail, X, Send, FileText, ShieldCheck } from "lucide-react";
import { BulkAssessmentModal } from "@/components/BulkAssessmentModal";
import { RiskAssessmentOverviewModal } from "@/components/RiskAssessmentOverviewModal";
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
  dueDate: string;
  riskLevel: string;
  parentRisk?: string;
  businessUnit: string;
  category: string;
  owner: string;
  assessors: string[];
  currentEditor?: string;
  orgLevel: {
    level1: string;
    level2: string;
    level3: string;
  };
  assessmentProgress: {
    assess: "not-started" | "in-progress" | "completed";
    reviewChallenge: "not-started" | "in-progress" | "completed";
    approve: "not-started" | "in-progress" | "completed";
  };
  sectionCompletion: {
    inherentRating: number;
    controlEffectiveness: number;
    residualRating: number;
    riskTreatment: number;
  };
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

const DashboardRiskOwner = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const reportSectionRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"own" | "assess" | "approve">("own");
  const [highlightedTab, setHighlightedTab] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(["R-RO-001", "R-RO-002", "R-RO-003"]));
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedRisks, setSelectedRisks] = useState<Set<string>>(new Set());
  const [assessorFilter, setAssessorFilter] = useState<string>("all");
  const [orgLevelFilter, setOrgLevelFilter] = useState<"all" | "level1" | "level2" | "level3">("all");
  const [bulkAssessmentOpen, setBulkAssessmentOpen] = useState(false);
  const [riskOverviewModalOpen, setRiskOverviewModalOpen] = useState(false);
  const [selectedRiskForOverview, setSelectedRiskForOverview] = useState<{ 
    id: string; 
    title: string;
    sectionCompletion: {
      inherentRating: number;
      controlEffectiveness: number;
      residualRating: number;
      riskTreatment: number;
    };
  } | null>(null);

  useEffect(() => {
    const openOverview = searchParams.get("openOverview");
    const riskId = searchParams.get("riskId");
    const riskName = searchParams.get("riskName");
    
    if (openOverview === "true" && riskId && riskName) {
      const foundRisk = riskData.find(r => r.id === riskId);
      setSelectedRiskForOverview({ 
        id: riskId, 
        title: riskName,
        sectionCompletion: foundRisk?.sectionCompletion || {
          inherentRating: 0,
          controlEffectiveness: 0,
          residualRating: 0,
          riskTreatment: 0
        }
      });
      setRiskOverviewModalOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleRiskNameClick = (risk: RiskData) => {
    setSelectedRiskForOverview({ 
      id: risk.id, 
      title: risk.title,
      sectionCompletion: risk.sectionCompletion
    });
    setRiskOverviewModalOpen(true);
  };

  const assessorEmails: Record<string, string> = {
    "John Smith": "john.smith@company.com",
    "Sarah Johnson": "sarah.johnson@company.com",
    "Mike Davis": "mike.davis@company.com",
    "James Brown": "james.brown@company.com",
    "Lisa Martinez": "lisa.martinez@company.com",
    "Tom Wilson": "tom.wilson@company.com",
    "Alex Turner": "alex.turner@company.com",
    "Maria Garcia": "maria.garcia@company.com",
    "Robert Chen": "robert.chen@company.com",
    "Nina Patel": "nina.patel@company.com",
    "David Lee": "david.lee@company.com",
    "Emma White": "emma.white@company.com",
    "Chris Anderson": "chris.anderson@company.com",
    "Sophia Taylor": "sophia.taylor@company.com",
    "Daniel Kim": "daniel.kim@company.com",
    "Olivia Brown": "olivia.brown@company.com",
    "George Harris": "george.harris@company.com",
  };

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

  const [riskData, setRiskData] = useState<RiskData[]>(initialRiskDataRiskOwner);

  const visibleRisks = useMemo(() => {
    const visible: RiskData[] = [];
    let filtered = riskData.filter(risk => risk.tabCategory === activeTab);
    
    // Apply org level filter
    if (orgLevelFilter !== "all") {
      filtered = filtered.filter(risk => {
        if (orgLevelFilter === "level1") return risk.orgLevel.level1 !== "";
        if (orgLevelFilter === "level2") return risk.orgLevel.level2 !== "";
        if (orgLevelFilter === "level3") return risk.orgLevel.level3 !== "";
        return true;
      });
    }
    
    filtered.forEach(risk => {
      if (risk.riskLevel === "Level 1") {
        visible.push(risk);
        if (expandedRows.has(risk.id)) {
          const level2Risks = filtered.filter(r => r.riskLevel === "Level 2" && r.parentRisk === risk.title);
          level2Risks.forEach(l2 => {
            const level3Risks = filtered.filter(r => r.riskLevel === "Level 3" && r.parentRisk === l2.title);
            visible.push(...level3Risks);
          });
        }
      }
    });
    return visible;
  }, [riskData, activeTab, expandedRows, orgLevelFilter]);

  const toggleRiskSelection = (riskId: string) => {
    setSelectedRisks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(riskId)) {
        newSet.delete(riskId);
      } else {
        newSet.add(riskId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRisks.size === visibleRisks.length) {
      setSelectedRisks(new Set());
    } else {
      setSelectedRisks(new Set(visibleRisks.map(r => r.id)));
    }
  };

  const clearSelection = () => {
    setSelectedRisks(new Set());
  };

  const getSelectedRiskData = () => {
    return riskData.filter(r => selectedRisks.has(r.id));
  };

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

  const handleUpdateClosedAssessment = (riskId: string) => {
    toast.success(`Opening closed assessment update for ${riskId}`);
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

  const handleQuickLinkClick = (tab: "own" | "assess" | "approve") => {
    setActiveTab(tab);
    setHighlightedTab(tab);
    
    setTimeout(() => {
      reportSectionRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
    
    setTimeout(() => {
      setHighlightedTab(null);
    }, 1500);
  };

  const handleApproveAssessment = () => {
    if (selectedRisks.size === 0) {
      toast.error("Please select at least one risk to approve");
      return;
    }
    toast.success(`${selectedRisks.size} assessment(s) approved successfully`);
    clearSelection();
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  useState(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  // Risk Owner specific metrics
  const metrics = [
    {
      title: "Pending Approvals",
      value: 12,
      trend: "+4 since last week",
      trendUp: false,
      icon: ShieldCheck,
      segments: [
        { label: "Urgent", value: 4, sublabel: "4 Urgent", color: "bg-red-600" },
        { label: "Normal", value: 6, sublabel: "6 Normal", color: "bg-amber-500" },
        { label: "Low Priority", value: 2, sublabel: "2 Low Priority", color: "bg-green-600" },
      ],
      description: "Review and approve submitted assessments promptly.",
      tooltip: "Shows assessments awaiting your approval as Risk Owner. Urgent items may have compliance deadlines.",
    },
    {
      title: "Owned Risk Status",
      value: 28,
      trend: "+5 new this quarter",
      trendUp: true,
      icon: AlertTriangle,
      segments: [
        { label: "Critical/High", value: 8, sublabel: "8 Critical/High", color: "bg-red-600" },
        { label: "Medium", value: 12, sublabel: "12 Medium", color: "bg-amber-500" },
        { label: "Low", value: 8, sublabel: "8 Low", color: "bg-green-600" },
      ],
      description: "Monitor high-severity risks within your business area.",
      tooltip: "Distribution of risk severity levels for risks you own. Focus on Critical/High risks for remediation.",
    },
    {
      title: "Remediation Actions",
      value: 15,
      trend: "+3 closed this month",
      trendUp: true,
      icon: CheckSquare,
      segments: [
        { label: "Overdue", value: 3, sublabel: "3 Overdue", color: "bg-red-600" },
        { label: "In Progress", value: 7, sublabel: "7 In Progress", color: "bg-amber-500" },
        { label: "On Track", value: 5, sublabel: "5 On Track", color: "bg-green-600" },
      ],
      description: "Ensure overdue actions are escalated and resolved.",
      tooltip: "Tracks remediation action plans for risks in your area. Overdue items require immediate attention.",
    },
    {
      title: "Assessment Completion",
      value: 82,
      isPercentage: true,
      trend: "+15% since last month",
      trendUp: true,
      icon: FileCheck,
      segments: [
        { label: "Completed (82%)", value: 23, sublabel: "23 Completed", color: "bg-green-600" },
        { label: "In Progress (11%)", value: 3, sublabel: "3 In Progress", color: "bg-amber-500" },
        { label: "Not Started (7%)", value: 2, sublabel: "2 Not Started", color: "bg-red-600" },
      ],
      description: "Drive completion of remaining assessments.",
      tooltip: "Overall assessment completion rate for your business area. Target is 100% by quarter end.",
    },
  ];

  // Get unique assessors for the filter dropdown (only from assess tab)
  const uniqueAssessors = useMemo(() => {
    const assessRisks = riskData.filter(risk => risk.tabCategory === "assess");
    const allAssessors = assessRisks.flatMap(risk => risk.assessors);
    return [...new Set(allAssessors)].sort();
  }, [riskData]);

  const filteredRiskData = useMemo(() => {
    let filtered = riskData.filter(risk => risk.tabCategory === activeTab);
    
    // Apply org level filter
    if (orgLevelFilter !== "all") {
      filtered = filtered.filter(risk => {
        if (orgLevelFilter === "level1") return risk.orgLevel.level1 !== "";
        if (orgLevelFilter === "level2") return risk.orgLevel.level2 !== "";
        if (orgLevelFilter === "level3") return risk.orgLevel.level3 !== "";
        return true;
      });
    }
    
    // Apply assessor filter (only on assess tab)
    if (activeTab === "assess" && assessorFilter !== "all") {
      filtered = filtered.filter(risk => risk.assessors.includes(assessorFilter));
    }
    
    return filtered;
  }, [riskData, activeTab, orgLevelFilter, assessorFilter]);

  const getVisibleRisks = () => {
    const visible: RiskData[] = [];
    filteredRiskData.forEach(risk => {
      if (risk.riskLevel === "Level 1") {
        visible.push(risk);
        if (expandedRows.has(risk.id)) {
          const level2Risks = filteredRiskData.filter(r => r.riskLevel === "Level 2" && r.parentRisk === risk.title);
          level2Risks.forEach(l2 => {
            const level3Risks = filteredRiskData.filter(r => r.riskLevel === "Level 3" && r.parentRisk === l2.title);
            visible.push(...level3Risks);
          });
        }
      }
    });
    return visible;
  };

  const getLevel2Children = (level1Risk: RiskData): RiskData[] => {
    return filteredRiskData.filter(r => r.riskLevel === "Level 2" && r.parentRisk === level1Risk.title);
  };

  const hasChildren = (risk: RiskData) => {
    if (risk.riskLevel === "Level 1") {
      const level2Risks = filteredRiskData.filter(r => r.riskLevel === "Level 2" && r.parentRisk === risk.title);
      return level2Risks.some(l2 => 
        filteredRiskData.some(r => r.riskLevel === "Level 3" && r.parentRisk === l2.title)
      );
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
      case "Review & Challenge": return "bg-orange-500 text-white";
      case "Completed": return "bg-green-500 text-white";
      case "Complete": return "bg-green-500 text-white";
      case "Closed": return "bg-slate-500 text-white";
      case "Overdue": return "bg-red-500 text-white";
      case "Pending Review": return "bg-indigo-500 text-white";
      case "Awaiting Approval": return "bg-violet-500 text-white";
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-100 dark:from-background dark:via-background dark:to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 dark:bg-card/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  Risk Owner Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">Risk and Control Self Assessment</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    Risk Owner
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
          <Card className="border-[3px] border-border/50 dark:border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-card dark:to-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Link className="w-5 h-5 text-amber-600" />
                Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button onClick={() => handleQuickLinkClick("approve")} className="flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:underline text-sm w-full text-left">
                <ShieldCheck className="w-4 h-4" />
                View Pending Approvals
              </button>
              <button onClick={() => handleQuickLinkClick("own")} className="flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:underline text-sm w-full text-left">
                <AlertTriangle className="w-4 h-4" />
                View Owned Risks
              </button>
              <a href="#" className="flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:underline text-sm">
                <CheckSquare className="w-4 h-4" />
                View Remediation Actions
              </a>
              <a href="#" className="flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:underline text-sm">
                <FileCheck className="w-4 h-4" />
                Assessment Reports
              </a>
            </CardContent>
          </Card>

          {metrics.map((metric, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Card className="border-[3px] border-border/50 dark:border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-slate-50/50 dark:from-card dark:to-card relative cursor-help">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-foreground">{metric.title}</h3>
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <metric.icon className="w-5 h-5 text-amber-600" />
                      </div>
                    </div>
                
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground">
                      {typeof metric.value === 'string' ? metric.value : `${metric.value}${metric.isPercentage ? "%" : ""}`}
                    </span>
                  </div>
                  
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
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-sm">
            <p>{metric.tooltip}</p>
          </TooltipContent>
        </Tooltip>
          ))}
        </div>

        {/* Active Risk Profile Section */}
        <Card ref={reportSectionRef} className="border-[3px] border-border/50 dark:border-border shadow-sm bg-white dark:bg-card">
          <CardHeader className="border-b border-border/50 space-y-0 py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">My Risk Portfolio</CardTitle>
              <TooltipProvider>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" className="h-7 bg-muted/50 hover:bg-muted border border-foreground/30 text-foreground">
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
                      <Button size="sm" className="h-7 bg-muted/50 hover:bg-muted border border-foreground/30 text-foreground">
                        <UsersIcon className="h-3.5 w-3.5 mr-1" />
                        Delegate
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delegate risk assessment tasks</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" className="h-7 bg-muted/50 hover:bg-muted border border-foreground/30 text-foreground">
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
                      <Button 
                        size="sm" 
                        className="h-7 bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={handleApproveAssessment}
                      >
                        <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                        Approve Assessment
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Approve selected risk assessments</p>
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
                      ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  } ${highlightedTab === "own" ? "animate-tab-flash animate-tab-pulse ring-2 ring-amber-400 ring-offset-2" : ""}`}
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
                      ? "bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  } ${highlightedTab === "assess" ? "animate-tab-flash animate-tab-pulse ring-2 ring-orange-400 ring-offset-2" : ""}`}
                >
                  In Progress
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
                      ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  } ${highlightedTab === "approve" ? "animate-tab-flash animate-tab-pulse ring-2 ring-violet-400 ring-offset-2" : ""}`}
                >
                  Awaiting Approval
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === "approve" ? "bg-white/20" : "bg-muted"
                  }`}>
                    {riskData.filter(r => r.tabCategory === "approve").length}
                  </span>
                </button>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5 mb-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  {activeTab === "own" && "These are risks within your business area that you own and are accountable for. Monitor control effectiveness and ensure remediation plans are progressing."}
                  {activeTab === "assess" && "These assessments are currently being worked on by your team. Track progress and provide guidance where needed."}
                  {activeTab === "approve" && "These assessments have been completed and require your approval as Risk Owner before final submission to 2nd Line."}
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
                  <SelectTrigger id="assessment-context" className="w-48 h-8 bg-amber-500 text-white border-amber-500">
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

              {activeTab === "assess" && (
                <Select value={assessorFilter} onValueChange={setAssessorFilter}>
                  <SelectTrigger className="w-48 h-8">
                    <SelectValue placeholder="All Assessors" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-50">
                    <SelectItem value="all">All Assessors</SelectItem>
                    {uniqueAssessors.map((assessor) => (
                      <SelectItem key={assessor} value={assessor}>
                        {assessor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="relative flex-1 min-w-[200px]">
                <Input placeholder="Search risks..." className="pl-10 h-8" />
                <UserCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {/* Bulk Action Toolbar */}
            {selectedRisks.size > 0 && (
              <div className="mb-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg shadow-sm animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="font-medium">
                      {selectedRisks.size} risk{selectedRisks.size !== 1 ? 's' : ''} selected
                    </Badge>
                    <button 
                      onClick={clearSelection}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Clear selection
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7"
                      onClick={() => setBulkAssessmentOpen(true)}
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" />
                      Bulk Update
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-7 bg-amber-500 hover:bg-amber-600"
                      onClick={handleApproveAssessment}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      Approve Selected
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Risk Table */}
            <div className="rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-[40px] py-2 text-xs font-semibold border-r border-b border-border">
                        <Checkbox 
                          checked={selectedRisks.size === filteredRiskData.length && filteredRiskData.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-[60px] py-2 text-xs font-semibold border-r border-b border-border">Progress</TableHead>
                      <TableHead className="w-[100px] py-2 text-xs font-semibold border-r border-b border-border">Risk ID</TableHead>
                      <TableHead className="min-w-[200px] py-2 text-xs font-semibold border-r border-b border-border">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-1 hover:text-amber-600 transition-colors">
                              Risk Title
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuLabel>Filter by Org Level</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setOrgLevelFilter("all")} className={orgLevelFilter === "all" ? "bg-amber-100 dark:bg-amber-900/30" : ""}>
                              All Levels
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setOrgLevelFilter("level1")} className={orgLevelFilter === "level1" ? "bg-amber-100 dark:bg-amber-900/30" : ""}>
                              Org Level 1 (Operational)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setOrgLevelFilter("level2")} className={orgLevelFilter === "level2" ? "bg-amber-100 dark:bg-amber-900/30" : ""}>
                              Org Level 2 (Retail Banking)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setOrgLevelFilter("level3")} className={orgLevelFilter === "level3" ? "bg-amber-100 dark:bg-amber-900/30" : ""}>
                              Org Level 3 (ATM)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableHead>
                      <TableHead className="w-[80px] py-2 text-xs font-semibold border-r border-b border-border">Level</TableHead>
                      <TableHead className="w-[120px] py-2 text-xs font-semibold border-r border-b border-border">Assessor</TableHead>
                      <TableHead className="w-[120px] py-2 text-xs font-semibold border-r border-b border-border">Last Assessed</TableHead>
                      <TableHead className="w-[100px] py-2 text-xs font-semibold border-r border-b border-border">Inherent Risk</TableHead>
                      <TableHead className="min-w-[180px] py-2 text-xs font-semibold border-r border-b border-border">Related Controls</TableHead>
                      <TableHead className="w-[120px] py-2 text-xs font-semibold border-r border-b border-border">Effectiveness</TableHead>
                      <TableHead className="w-[120px] py-2 text-xs font-semibold border-r border-b border-border">Test Results</TableHead>
                      <TableHead className="w-[100px] py-2 text-xs font-semibold border-r border-b border-border">Residual Risk</TableHead>
                      <TableHead className="w-[120px] py-2 text-xs font-semibold border-b border-border">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRiskData.map((risk, index) => {
                      const isLevel1 = risk.riskLevel === "Level 1";
                      const isExpanded = expandedRows.has(risk.id);
                      const canExpand = hasChildren(risk);
                      const isSelected = selectedRisks.has(risk.id);
                      
                      return (
                        <TableRow 
                          key={risk.id} 
                          className={`
                            ${getCategoryColor(risk.category)}
                            ${isSelected ? 'bg-amber-100/50 dark:bg-amber-900/20' : ''}
                            hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors
                          `}
                        >
                        <TableCell className="py-2 border-r border-b border-border">
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => toggleRiskSelection(risk.id)}
                          />
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="space-y-1">
                            <div className="flex gap-0.5">
                              <div className={`w-5 h-1.5 rounded-l ${
                                risk.assessmentProgress.assess === "completed" ? "bg-green-500" :
                                risk.assessmentProgress.assess === "in-progress" ? "bg-amber-500" : "bg-muted"
                              }`} />
                              <div className={`w-5 h-1.5 ${
                                risk.assessmentProgress.reviewChallenge === "completed" ? "bg-green-500" :
                                risk.assessmentProgress.reviewChallenge === "in-progress" ? "bg-amber-500" : "bg-muted"
                              }`} />
                              <div className={`w-5 h-1.5 rounded-r ${
                                risk.assessmentProgress.approve === "completed" ? "bg-green-500" :
                                risk.assessmentProgress.approve === "in-progress" ? "bg-amber-500" : "bg-muted"
                              }`} />
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Assess</span>
                              <span>Review</span>
                              <span>Approve</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="flex items-center gap-2">
                            {isLevel1 && canExpand && (
                              <button
                                onClick={() => toggleRow(risk.id)}
                                className="p-0.5 hover:bg-muted rounded"
                              >
                                <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              </button>
                            )}
                            <span className="font-mono text-sm font-medium text-amber-600">{risk.id}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <button 
                            onClick={() => handleRiskNameClick(risk)}
                            className="text-sm font-medium text-foreground hover:text-amber-600 hover:underline cursor-pointer text-left transition-colors"
                          >
                            {risk.title}
                          </button>
                          <div className="text-xs text-muted-foreground">{risk.businessUnit}</div>
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <Badge variant="outline" className={`text-xs ${getRiskLevelColor(risk.riskLevel)}`}>
                            {risk.riskLevel}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="flex items-center gap-1">
                            <div className="flex -space-x-2">
                              {risk.assessors.slice(0, 2).map((assessor, idx) => (
                                <TooltipProvider key={idx}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="relative">
                                        <div className={`w-7 h-7 rounded-full border-2 border-background flex items-center justify-center text-xs font-medium text-white ${
                                          idx === 0 ? 'bg-amber-500' : 'bg-orange-500'
                                        }`}>
                                          {assessor.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        {risk.currentEditor === assessor && (
                                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="text-sm">
                                        <p className="font-medium">{assessor}</p>
                                        <p className="text-xs text-muted-foreground">{assessorEmails[assessor]}</p>
                                        {risk.currentEditor === assessor && (
                                          <p className="text-xs text-green-500 mt-1">Currently editing</p>
                                        )}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ))}
                            </div>
                            {risk.assessors.length > 2 && (
                              <span className="text-xs text-muted-foreground">+{risk.assessors.length - 2}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="text-sm">{format(new Date(risk.lastAssessed), 'MMM dd, yyyy')}</div>
                          <div className="text-xs text-muted-foreground">{risk.previousAssessments} previous</div>
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`${getRiskBadgeColor(risk.inherentRisk.color)}`}>
                              {risk.inherentRisk.level}
                            </Badge>
                            <span className={`text-xs flex items-center gap-0.5 ${risk.inherentTrend.up ? 'text-red-600' : 'text-green-600'}`}>
                              {risk.inherentTrend.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                              {risk.inherentTrend.value}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="text-xs">
                            <div className="font-medium text-amber-600">{risk.relatedControls.id}</div>
                            <div className="text-muted-foreground truncate max-w-[150px]">{risk.relatedControls.name}</div>
                            <div className="flex gap-1 mt-1">
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">{risk.relatedControls.type}</Badge>
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">{risk.relatedControls.nature}</Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          {getEffectivenessBadge(risk.controlEffectiveness.label, risk.controlEffectiveness.color)}
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="space-y-1">
                            <Badge className="bg-green-500 text-white text-xs">{risk.testResults.label}</Badge>
                            {risk.testResults.sublabel && (
                              <div className="text-xs text-muted-foreground">{risk.testResults.sublabel}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`${getRiskBadgeColor(risk.residualRisk.color)}`}>
                              {risk.residualRisk.level}
                            </Badge>
                            <span className={`text-xs flex items-center gap-0.5 ${risk.residualTrend.up ? 'text-red-600' : 'text-green-600'}`}>
                              {risk.residualTrend.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                              {risk.residualTrend.value}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 border-b border-border">
                          <Badge className={getStatusColor(risk.status)}>{risk.status}</Badge>
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

      {/* Modals */}
      <BulkAssessmentModal
        open={bulkAssessmentOpen}
        onOpenChange={setBulkAssessmentOpen}
        selectedRisks={getSelectedRiskData()}
        onComplete={() => {
          clearSelection();
          toast.success("Bulk assessment completed successfully");
        }}
      />

      <RiskAssessmentOverviewModal
        open={riskOverviewModalOpen}
        onOpenChange={setRiskOverviewModalOpen}
        risk={selectedRiskForOverview}
      />

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ open: false, type: null, riskId: null, currentValue: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editDialog.type}</DialogTitle>
            <DialogDescription>
              Update the {editDialog.type} for risk {editDialog.riskId}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>New Value</Label>
            <Input 
              value={editDialog.currentValue} 
              onChange={(e) => setEditDialog(prev => ({ ...prev, currentValue: e.target.value }))}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, type: null, riskId: null, currentValue: "" })}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null, riskId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "reassign" && "Reassign Risk"}
              {actionDialog.type === "collaborate" && "Add Collaborator"}
              {actionDialog.type === "reassess" && "Request Reassessment"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === "reassign" && "Select a new owner for this risk assessment"}
              {actionDialog.type === "collaborate" && "Invite someone to collaborate on this assessment"}
              {actionDialog.type === "reassess" && "Request a reassessment of this risk"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>Select User</Label>
              <Select>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="john">John Smith</SelectItem>
                  <SelectItem value="sarah">Sarah Johnson</SelectItem>
                  <SelectItem value="mike">Mike Davis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, type: null, riskId: null })}>
              Cancel
            </Button>
            <Button onClick={handleActionSubmit}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
};

// Risk Owner specific risk data
const initialRiskDataRiskOwner: RiskData[] = [
  {
    id: "R-RO-001",
    title: "Strategic Business Planning",
    dueDate: "2025-12-15",
    riskLevel: "Level 1",
    businessUnit: "Executive Office",
    category: "Operational",
    owner: "Risk Owner - Strategy",
    assessors: ["Sarah Johnson", "Mike Davis"],
    currentEditor: "Sarah Johnson",
    orgLevel: { level1: "Operational", level2: "Retail Banking", level3: "ATM" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 100,
      residualRating: 100,
      riskTreatment: 80,
    },
    inherentRisk: { level: "High", color: "red" },
    inherentTrend: { value: "12%", up: true },
    relatedControls: { id: "Control-201", name: "Strategic Review Process", type: "Manual", nature: "Preventive" },
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Medium", color: "yellow" },
    residualTrend: { value: "8%", up: false },
    status: "Awaiting Approval",
    lastAssessed: "2025-10-15",
    previousAssessments: 5,
    tabCategory: "approve",
  },
  {
    id: "R-RO-002",
    title: "Vendor Management Risk",
    dueDate: "2025-12-10",
    riskLevel: "Level 1",
    businessUnit: "Procurement",
    category: "Operational",
    owner: "Risk Owner - Procurement",
    assessors: ["Emma White", "Chris Anderson"],
    currentEditor: "Emma White",
    orgLevel: { level1: "Operational", level2: "Retail Banking", level3: "" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 100,
      residualRating: 95,
      riskTreatment: 75,
    },
    inherentRisk: { level: "Critical", color: "red" },
    inherentTrend: { value: "18%", up: true },
    relatedControls: { id: "Control-202", name: "Vendor Due Diligence", type: "Manual", nature: "Preventive" },
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "Design Effective" },
    residualRisk: { level: "High", color: "red" },
    residualTrend: { value: "14%", up: true },
    status: "Awaiting Approval",
    lastAssessed: "2025-10-18",
    previousAssessments: 8,
    tabCategory: "approve",
  },
  {
    id: "R-RO-003",
    title: "Business Continuity Planning",
    dueDate: "2025-12-08",
    riskLevel: "Level 1",
    businessUnit: "Operations",
    category: "Operational",
    owner: "Risk Owner - Operations",
    assessors: ["Daniel Kim"],
    orgLevel: { level1: "Operational", level2: "", level3: "" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "completed",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 100,
      residualRating: 100,
      riskTreatment: 100,
    },
    inherentRisk: { level: "Medium", color: "yellow" },
    inherentTrend: { value: "6%", up: false },
    relatedControls: { id: "Control-203", name: "BCP Framework", type: "Manual", nature: "Detective" },
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "" },
    residualRisk: { level: "Low", color: "green" },
    residualTrend: { value: "3%", up: false },
    status: "Completed",
    lastAssessed: "2025-11-01",
    previousAssessments: 12,
    tabCategory: "own",
  },
  {
    id: "R-RO-004",
    title: "Market Expansion Risk",
    dueDate: "2025-12-20",
    riskLevel: "Level 1",
    businessUnit: "Strategy",
    category: "Financial",
    owner: "Risk Owner - Strategy",
    assessors: ["Sophia Taylor", "George Harris"],
    orgLevel: { level1: "Operational", level2: "Retail Banking", level3: "ATM" },
    assessmentProgress: {
      assess: "in-progress",
      reviewChallenge: "not-started",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 60,
      controlEffectiveness: 40,
      residualRating: 20,
      riskTreatment: 0,
    },
    inherentRisk: { level: "High", color: "red" },
    inherentTrend: { value: "15%", up: true },
    relatedControls: { id: "Control-204", name: "Market Analysis Framework", type: "Manual", nature: "Preventive" },
    controlEffectiveness: { label: "Design Effective", color: "yellow" },
    testResults: { label: "Design Effective", sublabel: "" },
    residualRisk: { level: "Medium", color: "yellow" },
    residualTrend: { value: "10%", up: false },
    status: "In Progress",
    lastAssessed: "2025-09-15",
    previousAssessments: 4,
    tabCategory: "assess",
  },
  {
    id: "R-RO-005",
    title: "Talent Retention Risk",
    dueDate: "2025-11-28",
    riskLevel: "Level 1",
    businessUnit: "Human Resources",
    category: "Operational",
    owner: "Risk Owner - HR",
    assessors: ["John Smith"],
    currentEditor: "John Smith",
    orgLevel: { level1: "", level2: "Retail Banking", level3: "ATM" },
    assessmentProgress: {
      assess: "in-progress",
      reviewChallenge: "not-started",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 75,
      controlEffectiveness: 50,
      residualRating: 25,
      riskTreatment: 0,
    },
    inherentRisk: { level: "High", color: "red" },
    inherentTrend: { value: "10%", up: true },
    relatedControls: { id: "Control-205", name: "Employee Engagement Program", type: "Manual", nature: "Preventive" },
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "" },
    residualRisk: { level: "Medium", color: "yellow" },
    residualTrend: { value: "7%", up: false },
    status: "In Progress",
    lastAssessed: "2025-10-20",
    previousAssessments: 6,
    tabCategory: "assess",
  },
  {
    id: "R-RO-006",
    title: "Regulatory Change Impact",
    dueDate: "2025-12-05",
    riskLevel: "Level 1",
    businessUnit: "Compliance",
    category: "Compliance",
    owner: "Risk Owner - Compliance",
    assessors: ["Lisa Martinez", "Tom Wilson"],
    orgLevel: { level1: "Operational", level2: "", level3: "ATM" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 100,
      residualRating: 90,
      riskTreatment: 70,
    },
    inherentRisk: { level: "Critical", color: "red" },
    inherentTrend: { value: "20%", up: true },
    relatedControls: { id: "Control-206", name: "Regulatory Monitoring System", type: "Automated", nature: "Detective" },
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "Design Effective" },
    residualRisk: { level: "Medium", color: "yellow" },
    residualTrend: { value: "12%", up: false },
    status: "Awaiting Approval",
    lastAssessed: "2025-10-28",
    previousAssessments: 9,
    tabCategory: "approve",
  },
  {
    id: "R-RO-007",
    title: "Technology Infrastructure",
    dueDate: "2025-12-18",
    riskLevel: "Level 1",
    businessUnit: "IT",
    category: "Technology",
    owner: "Risk Owner - IT",
    assessors: ["Robert Chen", "Nina Patel"],
    orgLevel: { level1: "", level2: "Retail Banking", level3: "" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "completed",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 100,
      residualRating: 100,
      riskTreatment: 100,
    },
    inherentRisk: { level: "High", color: "red" },
    inherentTrend: { value: "8%", up: false },
    relatedControls: { id: "Control-207", name: "IT Governance Framework", type: "Manual", nature: "Preventive" },
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "Design Effective" },
    residualRisk: { level: "Medium", color: "yellow" },
    residualTrend: { value: "5%", up: false },
    status: "Completed",
    lastAssessed: "2025-11-05",
    previousAssessments: 11,
    tabCategory: "own",
  },
  {
    id: "R-RO-008",
    title: "Data Privacy & Protection",
    dueDate: "2025-12-12",
    riskLevel: "Level 1",
    businessUnit: "Legal",
    category: "Compliance",
    owner: "Risk Owner - Legal",
    assessors: ["Alex Turner", "Maria Garcia"],
    currentEditor: "Maria Garcia",
    orgLevel: { level1: "Operational", level2: "Retail Banking", level3: "ATM" },
    assessmentProgress: {
      assess: "in-progress",
      reviewChallenge: "not-started",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 83,
      controlEffectiveness: 58,
      residualRating: 17,
      riskTreatment: 0,
    },
    inherentRisk: { level: "Critical", color: "red" },
    inherentTrend: { value: "15%", up: true },
    relatedControls: { id: "Control-208", name: "Data Protection Framework", type: "Automated", nature: "Preventive" },
    controlEffectiveness: { label: "Design Effective", color: "yellow" },
    testResults: { label: "Design Effective", sublabel: "" },
    residualRisk: { level: "High", color: "red" },
    residualTrend: { value: "12%", up: true },
    status: "In Progress",
    lastAssessed: "2025-10-22",
    previousAssessments: 7,
    tabCategory: "assess",
  },
  {
    id: "R-RO-009",
    title: "Financial Reporting Accuracy",
    dueDate: "2025-12-25",
    riskLevel: "Level 1",
    businessUnit: "Finance",
    category: "Financial",
    owner: "Risk Owner - Finance",
    assessors: ["Olivia Brown"],
    orgLevel: { level1: "", level2: "", level3: "ATM" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 100,
      residualRating: 92,
      riskTreatment: 67,
    },
    inherentRisk: { level: "Medium", color: "yellow" },
    inherentTrend: { value: "3%", up: false },
    relatedControls: { id: "Control-209", name: "Financial Controls Framework", type: "Automated", nature: "Preventive" },
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "Design Effective" },
    residualRisk: { level: "Low", color: "green" },
    residualTrend: { value: "1%", up: false },
    status: "Awaiting Approval",
    lastAssessed: "2025-11-02",
    previousAssessments: 8,
    tabCategory: "approve",
  },
  {
    id: "R-RO-010",
    title: "Customer Experience Risk",
    dueDate: "2025-11-30",
    riskLevel: "Level 1",
    businessUnit: "Customer Service",
    category: "Operational",
    owner: "Risk Owner - CX",
    assessors: ["David Lee"],
    orgLevel: { level1: "Operational", level2: "Retail Banking", level3: "" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "completed",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 100,
      residualRating: 100,
      riskTreatment: 100,
    },
    inherentRisk: { level: "Medium", color: "yellow" },
    inherentTrend: { value: "5%", up: false },
    relatedControls: { id: "Control-210", name: "CX Monitoring Dashboard", type: "Automated", nature: "Detective" },
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "Design Effective" },
    residualRisk: { level: "Low", color: "green" },
    residualTrend: { value: "2%", up: false },
    status: "Completed",
    lastAssessed: "2025-10-30",
    previousAssessments: 14,
    tabCategory: "own",
  },
];

export default DashboardRiskOwner;
