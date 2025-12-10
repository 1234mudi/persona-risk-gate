import { useState, useRef, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, AlertTriangle, FileCheck, Clock, TrendingUp, TrendingDown, UserPlus, Users as UsersIcon, RotateCcw, Edit2, LogOut, User, ChevronDown, ChevronRight, DollarSign, Sparkles, Plus, RefreshCw, MoreHorizontal, Link, ClipboardCheck, CheckCircle, CheckSquare, AlertCircle, Lock, ArrowUp, ArrowDown, Mail, X } from "lucide-react";
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

const Dashboard2ndLine = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const reportSectionRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"own" | "assess" | "approve">("assess");
  const [highlightedTab, setHighlightedTab] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(["R-001", "R-002", "R-003"]));
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedRisks, setSelectedRisks] = useState<Set<string>>(new Set());
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

  // Check URL params to auto-open modal on navigation back
  useEffect(() => {
    const openOverview = searchParams.get("openOverview");
    const riskId = searchParams.get("riskId");
    const riskName = searchParams.get("riskName");
    
    if (openOverview === "true" && riskId && riskName) {
      // Find the risk data to get sectionCompletion, fallback to defaults
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
      // Clear the params after opening
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

  // Email mapping for assessors
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
  const [riskData, setRiskData] = useState<RiskData[]>(initialRiskData);

  // Selection helpers
  const visibleRisks = useMemo(() => {
    const visible: RiskData[] = [];
    const filtered = riskData.filter(risk => risk.tabCategory === activeTab);
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
  }, [riskData, activeTab, expandedRows]);

  // Helper to check if a risk is completed/closed
  const isRiskCompleted = (risk: RiskData): boolean => {
    const status = risk.status?.toLowerCase() || "";
    return status === "completed" || status === "complete" || status === "closed";
  };

  // Get selectable risks (exclude completed/closed)
  const selectableRisks = useMemo(() => 
    visibleRisks.filter(r => !isRiskCompleted(r)),
    [visibleRisks]
  );

  const toggleRiskSelection = (riskId: string) => {
    const risk = riskData.find(r => r.id === riskId);
    if (risk && isRiskCompleted(risk)) return; // Don't toggle completed/closed risks
    
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
    if (selectedRisks.size === selectableRisks.length && selectableRisks.length > 0) {
      setSelectedRisks(new Set());
    } else {
      setSelectedRisks(new Set(selectableRisks.map(r => r.id)));
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

  // Update closed assessment dialog state
  const [updateVersionDialogOpen, setUpdateVersionDialogOpen] = useState(false);
  const [selectedRiskForUpdate, setSelectedRiskForUpdate] = useState<RiskData | null>(null);

  const handleUpdateClosedAssessment = (riskId: string) => {
    const risk = riskData.find(r => r.id === riskId);
    if (risk) {
      setSelectedRiskForUpdate(risk);
      setUpdateVersionDialogOpen(true);
    }
  };

  const handleProceedUpdateVersion = () => {
    if (selectedRiskForUpdate) {
      navigate(`/risk-assessment?riskId=${encodeURIComponent(selectedRiskForUpdate.id)}&riskName=${encodeURIComponent(selectedRiskForUpdate.title)}&mode=update-version&source=2nd-line`);
      setUpdateVersionDialogOpen(false);
      setSelectedRiskForUpdate(null);
    }
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
    
    // Scroll to the report section smoothly
    setTimeout(() => {
      reportSectionRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
    
    // Clear highlight after animation completes
    setTimeout(() => {
      setHighlightedTab(null);
    }, 1500);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  // Track scroll position for scroll button
  useState(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });
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
      tooltip: "Shows the total number of risk assessments awaiting your review. Overdue items require immediate attention to ensure timely validation and compliance with assessment cycles.",
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
      tooltip: "Displays risks that remain elevated even after controls are applied. Critical and High residual risks indicate areas where additional mitigation strategies may be needed.",
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
      tooltip: "Tracks the 2nd Line review and challenge completion rate. A higher percentage indicates stronger oversight and quality assurance of 1st Line risk assessments.",
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
      tooltip: "Summarizes financial losses from operational events across your risk portfolio. Use this to validate that your RCSA coverage aligns with actual loss drivers.",
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
          // Get Level 2 children
          const level2Risks = filteredRiskData.filter(r => r.riskLevel === "Level 2" && r.parentRisk === risk.title);
          // For each Level 2, get its Level 3 children and add them directly
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
      // Check if there are any Level 3 grandchildren through Level 2
      const level2Risks = filteredRiskData.filter(r => r.riskLevel === "Level 2" && r.parentRisk === risk.title);
      return level2Risks.some(l2 => 
        filteredRiskData.some(r => r.riskLevel === "Level 3" && r.parentRisk === l2.title)
      );
    }
    return false; // Level 2 and Level 3 no longer expandable as separate rows
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-background dark:via-background dark:to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 dark:bg-card/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-6 py-2 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-second-line to-primary flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-semibold text-foreground truncate">
                  <span className="hidden sm:inline">2nd Line Risk Analyst Dashboard</span>
                  <span className="sm:hidden">2nd Line Dashboard</span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Risk and Control Self Assessment</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 sm:h-9 px-2 sm:px-3">
                    <User className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">2nd Line Analyst</span>
                    <ChevronDown className="w-4 h-4 ml-1 sm:ml-2" />
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
      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Scorecards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Quick Links Card */}
          <Card className="lg:col-span-2 border-[3px] border-border/50 dark:border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-card dark:to-card sm:col-span-1">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <Link className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-1">
                <button onClick={() => handleQuickLinkClick("assess")} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-xs sm:text-sm w-full text-left min-h-[28px] touch-manipulation">
                  <ClipboardCheck className="w-4 h-4 flex-shrink-0" />
                  <span>View Risks to be Assessed</span>
                </button>
                <button onClick={() => handleQuickLinkClick("approve")} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-xs sm:text-sm w-full text-left min-h-[28px] touch-manipulation">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>View Risks to be Approved</span>
                </button>
                <a href="#" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-xs sm:text-sm min-h-[28px] touch-manipulation">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>View Open Challenges</span>
                </a>
                <a href="#" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-xs sm:text-sm min-h-[28px] touch-manipulation">
                  <CheckSquare className="w-4 h-4 flex-shrink-0" />
                  <span>View Completed Challenges</span>
                </a>
                <a href="#" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-xs sm:text-sm min-h-[28px] touch-manipulation">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>View Open Risk Events</span>
                </a>
              </div>
            </CardContent>
          </Card>

          {metrics.map((metric, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Card className="border-[3px] border-border/50 dark:border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-slate-50/50 dark:from-card dark:to-card relative cursor-help">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <h3 className="text-sm sm:text-lg font-bold text-foreground leading-tight">{metric.title}</h3>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center flex-shrink-0">
                        <metric.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                    </div>
                
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-foreground">
                      {typeof metric.value === 'string' ? metric.value : `${metric.value}${metric.isPercentage ? "%" : ""}`}
                    </span>
                  </div>
                  {metric.subLabel && (
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">{metric.subLabel}</p>
                  )}
                  
                  <div className="flex items-center gap-2">
                    {metric.trendUp ? (
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                    )}
                    <span className={`text-xs sm:text-sm font-medium ${metric.trendUp ? "text-green-600" : "text-red-600"}`}>
                      {metric.trend}
                    </span>
                  </div>
                  
                  {/* Status Bar */}
                  <div className="space-y-2">
                    <div className="flex h-4 sm:h-6 rounded-lg overflow-hidden">
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
                    
                    {/* Legend - Collapsible on mobile */}
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                      {metric.segments.map((segment, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-sm ${segment.color}`} />
                          <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                            {segment.sublabel || segment.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-snug pt-1 sm:pt-2 hidden sm:block">
                    {metric.description}
                  </p>
                </div>
                
                {/* AI Generated Icon */}
                <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
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
          <CardHeader className="border-b border-border/50 space-y-0 py-2 sm:py-3 px-3 sm:px-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
              <CardTitle className="text-base sm:text-lg font-semibold">Active Risk Profile</CardTitle>
              <TooltipProvider>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" className="h-8 sm:h-7 text-xs sm:text-sm bg-muted/50 hover:bg-muted border border-foreground/30 text-foreground">
                        <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5 sm:mr-1" />
                        <span className="hidden sm:inline">Add New Risk</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Create a new risk entry</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" className="h-8 sm:h-7 text-xs sm:text-sm bg-muted/50 hover:bg-muted border border-foreground/30 text-foreground">
                        <UsersIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 sm:mr-1" />
                        <span className="hidden sm:inline">Collaborate</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Invite collaborators to work on risks</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" className="h-8 sm:h-7 text-xs sm:text-sm bg-muted/50 hover:bg-muted border border-foreground/30 text-foreground">
                        <UserPlus className="h-3 w-3 sm:h-3.5 sm:w-3.5 sm:mr-1" />
                        <span className="hidden sm:inline">Reassign</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reassign risks to another owner</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" className="h-8 sm:h-7 text-xs sm:text-sm bg-muted/50 hover:bg-muted border border-foreground/30 text-foreground">
                        <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 sm:mr-1" />
                        <span className="hidden sm:inline">Review & Challenge</span>
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
          <CardContent className="p-3 sm:p-4">
            {/* Modern Segmented Tabs */}
            <div className="mb-3">
              <div className="flex overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
                <div className="inline-flex items-center gap-0 p-1 bg-muted/50 rounded-lg border border-border/50 min-w-max">
                  <button
                    onClick={() => setActiveTab("own")}
                    className={`px-3 sm:px-4 py-1.5 rounded-l-md font-medium text-xs sm:text-sm transition-all border-r-2 border-muted-foreground/30 whitespace-nowrap ${
                      activeTab === "own"
                        ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    } ${highlightedTab === "own" ? "animate-tab-flash animate-tab-pulse ring-2 ring-blue-400 ring-offset-2" : ""}`}
                  >
                    <span className="hidden sm:inline">Risks I Own</span>
                    <span className="sm:hidden">Own</span>
                    <span className={`ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                      activeTab === "own" ? "bg-white/20" : "bg-muted"
                    }`}>
                      {riskData.filter(r => r.tabCategory === "own").length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("assess")}
                    className={`px-3 sm:px-4 py-1.5 font-medium text-xs sm:text-sm transition-all border-r-2 border-muted-foreground/30 whitespace-nowrap ${
                      activeTab === "assess"
                        ? "bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    } ${highlightedTab === "assess" ? "animate-tab-flash animate-tab-pulse ring-2 ring-blue-400 ring-offset-2" : ""}`}
                  >
                    <span className="hidden sm:inline">Risks to be Assessed</span>
                    <span className="sm:hidden">Assess</span>
                    <span className={`ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                      activeTab === "assess" ? "bg-white/20" : "bg-muted"
                    }`}>
                      {riskData.filter(r => r.tabCategory === "assess").length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("approve")}
                    className={`px-3 sm:px-4 py-1.5 rounded-r-md font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                      activeTab === "approve"
                        ? "bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    } ${highlightedTab === "approve" ? "animate-tab-flash animate-tab-pulse ring-2 ring-blue-400 ring-offset-2" : ""}`}
                  >
                    <span className="hidden sm:inline">Risks to be Approved</span>
                    <span className="sm:hidden">Approve</span>
                    <span className={`ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                      activeTab === "approve" ? "bg-white/20" : "bg-muted"
                    }`}>
                      {riskData.filter(r => r.tabCategory === "approve").length}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2 sm:p-2.5 mb-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] sm:text-xs text-yellow-800 dark:text-yellow-200 leading-snug">
                  {activeTab === "own" && "These are risks you own and are responsible for managing."}
                  {activeTab === "assess" && "These risks require your assessment and input."}
                  {activeTab === "approve" && "These risk assessments are awaiting your approval."}
                </p>
              </div>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 mb-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="assessment-context" className="text-xs font-medium text-muted-foreground">
                  Assessment Context
                </Label>
                <Select defaultValue="retail">
                  <SelectTrigger id="assessment-context" className="w-full sm:w-48 h-9 sm:h-8 bg-primary text-primary-foreground border-primary">
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
                <SelectTrigger className="w-full sm:w-48 h-9 sm:h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg z-50">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="sent-for-assessment">Sent for Assessment</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="pending-approval">Pending Approval</SelectItem>
                  <SelectItem value="review-challenge">Review & Challenge</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
                <Input placeholder="Search risks..." className="pl-10 h-9 sm:h-8 w-full" />
                <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {/* Bulk Action Toolbar - Shows when items are selected */}
            {selectedRisks.size > 0 && (
              <div className="mb-4 p-2 sm:p-3 bg-primary/5 border border-primary/20 rounded-lg shadow-sm animate-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Badge variant="secondary" className="font-medium text-xs sm:text-sm">
                      {selectedRisks.size} selected
                    </Badge>
                    <button 
                      onClick={clearSelection}
                      className="text-xs sm:text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      <X className="w-3 h-3" />
                      Clear
                    </button>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button 
                      size="sm" 
                      className="h-9 sm:h-8 flex-1 sm:flex-none bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md hover:shadow-lg transition-all"
                      onClick={() => setBulkAssessmentOpen(true)}
                    >
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                      <span className="text-xs sm:text-sm">Perform Assessment</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Table with horizontal scroll */}
            <div className="border rounded-lg overflow-hidden -mx-3 sm:mx-0">
              <div className="overflow-x-auto">
                <Table className="border-collapse">
                  <TableHeader className="bg-muted/50 sticky top-0">
                    <TableRow>
                      <TableHead className="w-12 py-2 border-r border-b border-border">
                        <div className="flex items-center justify-center">
                          <Checkbox 
                            checked={selectableRisks.length > 0 && selectedRisks.size === selectableRisks.length}
                            onCheckedChange={toggleSelectAll}
                            disabled={selectableRisks.length === 0}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[120px] py-2 border-r border-b border-border text-xs">Update Completed</TableHead>
                      <TableHead className="min-w-[120px] py-2 border-r border-b border-border">Due Date</TableHead>
                      <TableHead className="min-w-[200px] py-2 border-r border-b border-border">Assessment Progress</TableHead>
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
                        'bg-orange-50/10 dark:bg-orange-950/10'
                      }`}>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="flex items-center justify-center">
                            <Checkbox 
                              checked={selectedRisks.has(risk.id)}
                              onCheckedChange={() => toggleRiskSelection(risk.id)}
                              disabled={isRiskCompleted(risk)}
                              className={isRiskCompleted(risk) ? "opacity-50 cursor-not-allowed" : ""}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          {(risk.status === "Completed" || risk.status === "Complete" || risk.status === "Closed") && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    className="p-1.5 rounded-md bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 transition-colors"
                                    onClick={() => handleUpdateClosedAssessment(risk.id)}
                                  >
                                    <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Update this closed assessment</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className={`text-sm font-medium ${
                            new Date(risk.dueDate) < new Date() 
                              ? 'text-destructive' 
                              : 'text-foreground'
                          }`}>
                            {format(new Date(risk.dueDate), 'MMM dd, yyyy')}
                          </div>
                          {new Date(risk.dueDate) < new Date() && (
                            <Badge variant="destructive" className="text-xs mt-1">Overdue</Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="space-y-1">
                            <div className="flex gap-1">
                              <div className={`h-2 flex-1 rounded-sm ${
                                risk.assessmentProgress.assess === "completed" ? "bg-green-500" :
                                risk.assessmentProgress.assess === "in-progress" ? "bg-amber-500" :
                                "bg-gray-300 dark:bg-gray-600"
                              }`} />
                              <div className={`h-2 flex-1 rounded-sm ${
                                risk.assessmentProgress.reviewChallenge === "completed" ? "bg-green-500" :
                                risk.assessmentProgress.reviewChallenge === "in-progress" ? "bg-amber-500" :
                                "bg-gray-300 dark:bg-gray-600"
                              }`} />
                              <div className={`h-2 flex-1 rounded-sm ${
                                risk.assessmentProgress.approve === "completed" ? "bg-green-500" :
                                risk.assessmentProgress.approve === "in-progress" ? "bg-amber-500" :
                                "bg-gray-300 dark:bg-gray-600"
                              }`} />
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Assess</span>
                              <span>Review/Challenge</span>
                              <span>Approve</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium py-2 border-r border-b border-border">{risk.id}</TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="flex items-start gap-2">
                            {isLevel1 && canExpand && (
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
                            {isLevel1 && !canExpand && <div className="w-6" />}
                            {isLevel3 && <div className="w-6 ml-4" />}
                            
                            <div className="flex flex-col gap-2">
                              {/* Level 1 Title */}
                              <div className="flex flex-col gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button 
                                      onClick={() => handleRiskNameClick(risk)}
                                      className="text-left hover:text-primary transition-colors font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                    >
                                      {risk.title}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Click to open the risk assessment overview</p>
                                  </TooltipContent>
                                </Tooltip>
                                <span className="text-xs text-muted-foreground">{risk.owner}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-md font-medium inline-block w-fit ${getCategoryColor(risk.category)}`}>
                                  {risk.category}
                                </span>
                              </div>
                              
                              {/* Level 2 Children (displayed within Level 1 row) */}
                              {isLevel1 && getLevel2Children(risk).map((l2Risk) => (
                                <div key={l2Risk.id} className="flex flex-col gap-1 pl-4 border-l-2 border-purple-300 dark:border-purple-600 ml-1 mt-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button 
                                        onClick={() => handleRiskNameClick(l2Risk)}
                                        className="text-left hover:text-primary transition-colors font-medium text-purple-600 dark:text-purple-400 hover:underline cursor-pointer text-sm"
                                      >
                                        └ {l2Risk.title}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Click to open the risk assessment overview</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <span className="text-xs text-muted-foreground">{l2Risk.owner}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="flex flex-col gap-1">
                            <Badge className={`${getRiskLevelColor(risk.riskLevel)} border text-xs font-medium`}>
                              {risk.riskLevel}
                            </Badge>
                            {isLevel1 && getLevel2Children(risk).map((l2Risk) => (
                              <Badge key={l2Risk.id} className={`${getRiskLevelColor(l2Risk.riskLevel)} border text-xs font-medium`}>
                                {l2Risk.riskLevel}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="flex flex-wrap gap-1">
                            {risk.assessors.map((assessor, idx) => (
                              <Tooltip key={idx}>
                                <TooltipTrigger asChild>
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 cursor-pointer"
                                  >
                                    {assessor}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <div className="space-y-2">
                                    <div className="font-medium text-sm">{assessor}</div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <Mail className="w-3 h-3" />
                                      <span>{assessorEmails[assessor] || `${assessor.toLowerCase().replace(' ', '.')}@company.com`}</span>
                                    </div>
                                    <div className="pt-1 border-t border-border">
                                      <div className="text-xs font-medium text-muted-foreground mb-1">Sections Updated:</div>
                                      <div className="flex flex-wrap gap-1">
                                        {idx === 0 && (
                                          <>
                                            <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">Assess</Badge>
                                            <Badge variant="outline" className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300">Review & Challenge</Badge>
                                          </>
                                        )}
                                        {idx === 1 && (
                                          <Badge variant="outline" className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300">Review & Challenge</Badge>
                                        )}
                                        {idx === 2 && (
                                          <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">Assess</Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
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
                              {risk.testResults.sublabel && (
                                <Badge className="bg-blue-500 text-white rounded-full px-2.5 py-1 text-xs">
                                  {risk.testResults.sublabel}
                                </Badge>
                              )}
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

      {/* Scroll to Top/Bottom Button */}
      {showScrollTop && (
        <div className="fixed bottom-8 right-8 flex flex-col gap-2 z-50">
          <Button
            size="icon"
            onClick={scrollToTop}
            className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            onClick={scrollToBottom}
            className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Bulk Assessment Modal */}
      <BulkAssessmentModal
        open={bulkAssessmentOpen}
        onOpenChange={setBulkAssessmentOpen}
        selectedRisks={getSelectedRiskData()}
        onComplete={clearSelection}
        userType="2nd-line"
      />

      {/* Risk Assessment Overview Modal */}
      <RiskAssessmentOverviewModal
        open={riskOverviewModalOpen}
        onOpenChange={setRiskOverviewModalOpen}
        risk={selectedRiskForOverview}
        assessmentIssues={[
          { id: "ISS-2025-001", title: "Control testing failure identified", description: "KYC verification control failed 3 out of 10 sample tests", severity: "High", status: "Open", dateIdentified: "2025-01-15", owner: "Compliance Team" },
          { id: "ISS-2025-002", title: "Documentation gap in verification process", description: "Missing audit trail for 15% of customer verifications", severity: "Medium", status: "Open", dateIdentified: "2025-01-18", owner: "Operations" },
        ]}
        activeRelatedIssues={[
          { id: "ISS-2024-015", title: "KYC documentation gaps", description: "Incomplete customer documentation in legacy system records", severity: "High", status: "In Progress", dateIdentified: "2024-08-22", owner: "IT Department" },
          { id: "ISS-2024-022", title: "Delayed verification process", description: "Average verification time exceeds SLA by 40%", severity: "Medium", status: "Open", dateIdentified: "2024-09-10", owner: "Operations" },
          { id: "ISS-2024-028", title: "Missing audit trail records", description: "Transaction monitoring gaps identified during internal audit", severity: "High", status: "Open", dateIdentified: "2024-10-05", owner: "Compliance Team" },
        ]}
      />

      {/* Update Version Confirmation Dialog */}
      <Dialog open={updateVersionDialogOpen} onOpenChange={setUpdateVersionDialogOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-amber-600" />
              Create New Assessment Version
            </DialogTitle>
            <DialogDescription className="pt-2 text-left">
              This will create a new version of the assessment with the same Assessment ID 
              <span className="font-semibold text-foreground"> ({selectedRiskForUpdate?.id})</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">What happens next:</h4>
              <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1.5">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>All data from the previous version will be pre-filled</span>
                </li>
                <li className="flex items-start gap-2">
                  <Edit2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>All fields will be editable for updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Changed fields will be highlighted for easy identification</span>
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateVersionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleProceedUpdateVersion} className="bg-amber-600 hover:bg-amber-700 text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Proceed
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
    dueDate: "2025-11-20",
    riskLevel: "Level 1",
    businessUnit: "Retail Banking",
    category: "Operational",
    owner: "Michael Chen (Operations)",
    assessors: ["Sarah Johnson", "David Kim"],
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "not-started",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 25,
      residualRating: 0,
      riskTreatment: 0,
    },
    inherentRisk: { level: "Medium", color: "yellow" },
    inherentTrend: { value: "13%", up: false },
    relatedControls: { id: "Control-003", name: "Quality Assurance", type: "Manual", nature: "Detective" },
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Low", color: "green" },
    residualTrend: { value: "7%", up: true },
    status: "Overdue",
    lastAssessed: "2025-10-20",
    previousAssessments: 5,
    tabCategory: "assess",
  },
  {
    id: "R-001-A",
    title: "Branch Transaction Processing",
    dueDate: "2025-11-28",
    riskLevel: "Level 2",
    parentRisk: "Operational Process Failure",
    businessUnit: "Retail Banking",
    category: "Operational",
    owner: "Branch Manager",
    assessors: ["Emily White"],
    assessmentProgress: {
      assess: "not-started",
      reviewChallenge: "not-started",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 0,
      controlEffectiveness: 0,
      residualRating: 0,
      riskTreatment: 0,
    },
    inherentRisk: { level: "High", color: "red" },
    inherentTrend: { value: "12%", up: false },
    relatedControls: { id: "Control-009", name: "Branch Audits", type: "Manual", nature: "Detective" },
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
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
    dueDate: "2025-12-08",
    riskLevel: "Level 3",
    parentRisk: "Branch Transaction Processing",
    businessUnit: "Retail Banking",
    category: "Operational",
    owner: "Teller Supervisor",
    assessors: ["James Brown", "Lisa Martinez", "Tom Wilson"],
    currentEditor: "James Brown",
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
    inherentTrend: { value: "8%", up: true },
    relatedControls: { id: "Control-012", name: "Dual Authorization", type: "Automated", nature: "Preventive" },
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Low", color: "green" },
    residualTrend: { value: "5%", up: false },
    status: "Completed",
    lastAssessed: "2025-10-15",
    previousAssessments: 8,
    tabCategory: "assess",
  },
  {
    id: "R-002",
    title: "Cybersecurity Threat",
    dueDate: "2025-12-20",
    riskLevel: "Level 1",
    businessUnit: "Retail Banking",
    category: "Technology",
    owner: "CISO Office",
    assessors: ["Alex Turner", "Maria Garcia"],
    currentEditor: "Alex Turner",
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "in-progress",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 100,
      residualRating: 75,
      riskTreatment: 50,
    },
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
    dueDate: "2025-11-25",
    riskLevel: "Level 2",
    parentRisk: "Cybersecurity Threat",
    businessUnit: "Retail Banking",
    category: "Technology",
    owner: "Security Team",
    assessors: ["Robert Chen", "Nina Patel"],
    currentEditor: "Nina Patel",
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "in-progress",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 83,
      residualRating: 67,
      riskTreatment: 33,
    },
    inherentRisk: { level: "High", color: "red" },
    inherentTrend: { value: "15%", up: true },
    relatedControls: { id: "Control-018", name: "Email Filtering", type: "Automated", nature: "Preventive" },
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
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
    dueDate: "2025-12-01",
    riskLevel: "Level 1",
    businessUnit: "Retail Banking",
    category: "Compliance",
    owner: "Compliance Officer",
    assessors: ["Kevin Lee"],
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
    dueDate: "2025-11-30",
    riskLevel: "Level 2",
    parentRisk: "Regulatory Compliance Risk",
    businessUnit: "Retail Banking",
    category: "Compliance",
    owner: "AML Team Lead",
    assessors: ["Patricia Adams", "Daniel Foster"],
    currentEditor: "Patricia Adams",
    assessmentProgress: {
      assess: "in-progress",
      reviewChallenge: "not-started",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 50,
      controlEffectiveness: 17,
      residualRating: 0,
      riskTreatment: 0,
    },
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
    dueDate: "2025-12-10",
    riskLevel: "Level 1",
    businessUnit: "Corporate Banking",
    category: "Financial",
    owner: "Treasury Department",
    assessors: ["Michelle Wong"],
    currentEditor: "Michelle Wong",
    assessmentProgress: {
      assess: "in-progress",
      reviewChallenge: "not-started",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 75,
      controlEffectiveness: 33,
      residualRating: 0,
      riskTreatment: 0,
    },
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
    dueDate: "2025-12-05",
    riskLevel: "Level 1",
    businessUnit: "Retail Banking",
    category: "Operational",
    owner: "Procurement Manager",
    assessors: ["Rachel Green", "Steven Park"],
    assessmentProgress: {
      assess: "not-started",
      reviewChallenge: "not-started",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 0,
      controlEffectiveness: 0,
      residualRating: 0,
      riskTreatment: 0,
    },
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
    dueDate: "2025-11-20",
    riskLevel: "Level 1",
    businessUnit: "Retail Banking",
    category: "Technology",
    owner: "Data Protection Officer",
    assessors: ["Angela Smith"],
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
  {
    id: "R-007",
    title: "Credit Risk Management",
    dueDate: "2025-12-18",
    riskLevel: "Level 1",
    businessUnit: "Corporate Banking",
    category: "Financial",
    owner: "Credit Risk Manager",
    assessors: ["Thomas Anderson", "Jennifer Lee"],
    currentEditor: "Thomas Anderson",
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "in-progress",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 67,
      residualRating: 25,
      riskTreatment: 0,
    },
    inherentRisk: { level: "High", color: "red" },
    inherentTrend: { value: "18%", up: true },
    relatedControls: { id: "Control-032", name: "Credit Scoring Model", type: "Automated", nature: "Preventive" },
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Medium", color: "yellow" },
    residualTrend: { value: "10%", up: false },
    status: "Review & Challenge",
    lastAssessed: "2025-10-24",
    previousAssessments: 8,
    tabCategory: "assess",
  },
  {
    id: "R-008",
    title: "Liquidity Risk",
    dueDate: "2025-11-22",
    riskLevel: "Level 1",
    businessUnit: "Treasury",
    category: "Financial",
    owner: "Treasury Manager",
    assessors: ["Brian Wilson", "Sandra Martinez"],
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "in-progress",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 100,
      residualRating: 83,
      riskTreatment: 50,
    },
    inherentRisk: { level: "High", color: "red" },
    inherentTrend: { value: "14%", up: false },
    relatedControls: { id: "Control-035", name: "Cash Flow Monitoring", type: "Manual", nature: "Detective" },
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "" },
    residualRisk: { level: "Low", color: "green" },
    residualTrend: { value: "5%", up: false },
    status: "Pending Approval",
    lastAssessed: "2025-10-25",
    previousAssessments: 6,
    tabCategory: "approve",
  },
  {
    id: "R-009",
    title: "Business Continuity Planning",
    dueDate: "2025-12-12",
    riskLevel: "Level 1",
    businessUnit: "Operations",
    category: "Operational",
    owner: "BCP Coordinator",
    assessors: ["Mark Thompson"],
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "in-progress",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 58,
      residualRating: 17,
      riskTreatment: 0,
    },
    inherentRisk: { level: "Medium", color: "yellow" },
    inherentTrend: { value: "11%", up: true },
    relatedControls: { id: "Control-037", name: "Disaster Recovery Plan", type: "Manual", nature: "Preventive" },
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Low", color: "green" },
    residualTrend: { value: "6%", up: false },
    status: "Review & Challenge",
    lastAssessed: "2025-10-26",
    previousAssessments: 4,
    tabCategory: "assess",
  },
  {
    id: "R-010",
    title: "Fraud Detection Systems",
    dueDate: "2025-11-15",
    riskLevel: "Level 1",
    businessUnit: "Retail Banking",
    category: "Technology",
    owner: "Fraud Prevention Team",
    assessors: ["Linda Chen", "Paul Roberts"],
    currentEditor: "Linda Chen",
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "in-progress",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 92,
      residualRating: 75,
      riskTreatment: 42,
    },
    inherentRisk: { level: "Critical", color: "red" },
    inherentTrend: { value: "23%", up: true },
    relatedControls: { id: "Control-040", name: "AI Fraud Detection", type: "Automated", nature: "Detective" },
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "Design Effective" },
    residualRisk: { level: "High", color: "red" },
    residualTrend: { value: "16%", up: false },
    status: "Pending Approval",
    lastAssessed: "2025-10-27",
    previousAssessments: 9,
    tabCategory: "approve",
  },
  {
    id: "R-011",
    title: "Model Risk Management",
    dueDate: "2025-12-25",
    riskLevel: "Level 1",
    businessUnit: "Risk Analytics",
    category: "Financial",
    owner: "Model Risk Officer",
    assessors: ["George Harris"],
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
    inherentTrend: { value: "17%", up: false },
    relatedControls: { id: "Control-042", name: "Model Validation", type: "Manual", nature: "Detective" },
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "" },
    residualRisk: { level: "Medium", color: "yellow" },
    residualTrend: { value: "12%", up: true },
    status: "Complete",
    lastAssessed: "2025-10-28",
    previousAssessments: 7,
    tabCategory: "assess",
  },
  {
    id: "R-012",
    title: "Interest Rate Risk",
    dueDate: "2025-11-18",
    riskLevel: "Level 1",
    businessUnit: "Treasury",
    category: "Financial",
    owner: "ALM Manager",
    assessors: ["Catherine Wright", "William Davis"],
    currentEditor: "Catherine Wright",
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "in-progress",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 100,
      residualRating: 67,
      riskTreatment: 33,
    },
    inherentRisk: { level: "Medium", color: "yellow" },
    inherentTrend: { value: "9%", up: false },
    relatedControls: { id: "Control-045", name: "Interest Rate Derivatives", type: "Automated", nature: "Preventive" },
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "Design Effective" },
    residualRisk: { level: "Low", color: "green" },
    residualTrend: { value: "4%", up: false },
    status: "Pending Approval",
    lastAssessed: "2025-10-29",
    previousAssessments: 11,
    tabCategory: "approve",
  },
];

export default Dashboard2ndLine;
