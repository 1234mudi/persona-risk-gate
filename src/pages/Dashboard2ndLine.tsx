import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { getInitialRiskDataCopy, SharedRiskData, HistoricalAssessment } from "@/data/initialRiskData";
import { format } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, AlertTriangle, FileCheck, Clock, TrendingUp, TrendingDown, UserPlus, Users as UsersIcon, RotateCcw, Edit2, LogOut, User, ChevronDown, ChevronRight, DollarSign, Sparkles, Plus, RefreshCw, MoreHorizontal, Link, ClipboardCheck, CheckCircle, CheckSquare, AlertCircle, Lock, ArrowUp, ArrowDown, Mail, X, Building2, ClipboardList, Layers, List, Timer, BarChart3, Eye, Search, Filter, Menu, Grid3x3 } from "lucide-react";
import { BulkAssessmentModal } from "@/components/BulkAssessmentModal";
import { ChallengeHeatmap } from "@/components/ChallengeHeatmap";
import { RiskAssessmentOverviewModal } from "@/components/RiskAssessmentOverviewModal";
import { PreviousAssessmentFloater } from "@/components/PreviousAssessmentFloater";
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
  orgLevel?: {
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
  inherentRisk: { level: string; color: string; score?: number };
  inherentTrend: { value: string; up: boolean };
  relatedControls: { id: string; name: string; type: string; nature: string; keyControl: "Key" | "Non-Key"; description?: string; designEffectiveness?: "Effective" | "Partially Effective" | "Ineffective"; operatingEffectiveness?: "Effective" | "Partially Effective" | "Ineffective"; overallScore?: number; lastTestDate?: string; testFrequency?: string; testingStatus?: "Tested" | "Not Tested" | "Pending" }[];
  controlEffectiveness: { label: string; color: string };
  testResults: { label: string; sublabel: string };
  residualRisk: { level: string; color: string; score?: number };
  residualTrend: { value: string; up: boolean };
  status: string;
  lastAssessed: string;
  previousAssessments: number;
  tabCategory: "own" | "assess" | "approve";
  historicalAssessments?: any[];
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
  
  // Filter states
  const [businessUnitFilter, setBusinessUnitFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [riskHierarchyFilter, setRiskHierarchyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Risk traversal state for review mode
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewRiskIds, setReviewRiskIds] = useState<string[]>([]);
  
  // Control details dialog state
  const [selectedControl, setSelectedControl] = useState<RiskData["relatedControls"][0] | null>(null);
  const [controlDetailsOpen, setControlDetailsOpen] = useState(false);

  // Previous assessment floater state
  const [expandedPreviousAssessments, setExpandedPreviousAssessments] = useState<Record<string, { inherent: boolean; control: boolean; residual: boolean }>>({});

  // Reset status filter when switching tabs to avoid invalid filter values
  useEffect(() => {
    setStatusFilter("all");
  }, [activeTab]);

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

  // Department mapping for assessors
  const assessorDepartments: Record<string, string> = {
    "John Smith": "Risk Analytics",
    "Sarah Johnson": "Compliance & Governance",
    "Mike Davis": "Internal Audit",
    "James Brown": "Credit Risk Management",
    "Lisa Martinez": "Operational Risk",
    "Tom Wilson": "Market Risk",
    "Alex Turner": "Financial Controls",
    "Maria Garcia": "Enterprise Risk",
    "Robert Chen": "Technology Risk",
    "Nina Patel": "Regulatory Affairs",
    "David Lee": "Business Continuity",
    "Emma White": "Strategic Risk",
    "Chris Anderson": "Fraud Prevention",
    "Sophia Taylor": "Liquidity Risk",
    "Daniel Kim": "Vendor Management",
    "Olivia Brown": "Data Governance",
    "George Harris": "Legal & Compliance",
  };

  // Section mapping for assessors (based on index)
  const assessorSections: Record<number, string[]> = {
    0: ["Assess", "Review/Challenge"],
    1: ["Review/Challenge"],
    2: ["Assess"],
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
  const [riskData, setRiskData] = useState<RiskData[]>(() => getInitialRiskDataCopy() as RiskData[]);

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

  const handleModalClose = useCallback((open: boolean) => {
    setRiskOverviewModalOpen(open);
    if (!open) {
      setIsReviewMode(false);
      setReviewRiskIds([]);
    }
  }, []);

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

  const handleOpenChallengesClick = () => {
    setActiveTab("assess");
    setStatusFilter("review-challenge");
    setTimeout(() => {
      reportSectionRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
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
  // Issues Velocity & Efficiency calculations
  const velocityMetrics = useMemo(() => {
    const today = new Date();
    let totalRemediationDays = 0;
    let totalOpenOverdueDays = 0;
    let completedCount = 0;
    let completedOnTime = 0;
    let completedLate = 0;
    let stillOverdue = 0;
    
    const byBusinessUnit: Record<string, { onTime: number; late: number; overdue: number; totalDays: number; count: number }> = {};
    const slowestRisks: { id: string; title: string; days: number }[] = [];
    
    riskData.forEach(risk => {
      const dueDate = new Date(risk.dueDate);
      const isCompleted = isRiskCompleted(risk);
      
      // Initialize business unit tracking
      if (!byBusinessUnit[risk.businessUnit]) {
        byBusinessUnit[risk.businessUnit] = { onTime: 0, late: 0, overdue: 0, totalDays: 0, count: 0 };
      }
      
      if (isCompleted) {
        // Calculate remediation time using lastAssessed as proxy for completion
        const lastAssessDate = new Date(risk.lastAssessed);
        const remediationDays = Math.max(0, Math.floor((lastAssessDate.getTime() - dueDate.getTime() + 30 * 24 * 60 * 60 * 1000) / (1000 * 60 * 60 * 24)));
        totalRemediationDays += remediationDays;
        completedCount++;
        
        slowestRisks.push({ id: risk.id, title: risk.title, days: remediationDays });
        byBusinessUnit[risk.businessUnit].totalDays += remediationDays;
        byBusinessUnit[risk.businessUnit].count++;
        
        if (lastAssessDate <= dueDate) {
          completedOnTime++;
          byBusinessUnit[risk.businessUnit].onTime++;
        } else {
          completedLate++;
          byBusinessUnit[risk.businessUnit].late++;
        }
      } else if (dueDate < today) {
        // Track open overdue items and their overdue days
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        totalOpenOverdueDays += daysOverdue;
        stillOverdue++;
        byBusinessUnit[risk.businessUnit].overdue++;
      }
    });
    
    // Calculate avgRemediationDays: prioritize open overdue items when they exist
    let avgRemediationDays: number;
    if (stillOverdue > 0) {
      // When there are open overdue items, show average days overdue (minimum 1)
      avgRemediationDays = Math.max(1, Math.round(totalOpenOverdueDays / stillOverdue));
    } else if (completedCount > 0) {
      // Fall back to completed items average
      avgRemediationDays = Math.round(totalRemediationDays / completedCount);
    } else {
      // Default baseline when no data
      avgRemediationDays = 14;
    }

    // Calculate completion rate with denominator including overdue items
    const denominator = completedCount + stillOverdue;
    const completionRate = denominator > 0 
      ? Math.round((completedOnTime / denominator) * 100) 
      : 85; // Default baseline when no data
    
    // Sort to get slowest risks
    slowestRisks.sort((a, b) => b.days - a.days);
    
    return {
      avgRemediationDays,
      completionRate,
      completedOnTime,
      completedLate,
      stillOverdue,
      totalCompleted: completedCount,
      byBusinessUnit,
      slowestRisks: slowestRisks.slice(0, 5)
    };
  }, [riskData]);

  // Risk Exposure & Aging calculations
  const agingMetrics = useMemo(() => {
    const today = new Date();
    const byCriticality = { critical: 0, high: 0, medium: 0, low: 0 };
    const agingBuckets = {
      critical: { '30': 0, '60': 0, '90+': 0 },
      high: { '30': 0, '60': 0, '90+': 0 },
      medium: { '30': 0, '60': 0, '90+': 0 },
      low: { '30': 0, '60': 0, '90+': 0 }
    };
    
    const overdueRisks90Plus: { id: string; title: string; daysOverdue: number; level: string }[] = [];
    const byBusinessUnit: Record<string, number> = {};
    const byCategory: Record<string, number> = { Operational: 0, Technology: 0, Compliance: 0, Financial: 0, Strategic: 0 };
    
    riskData.forEach(risk => {
      const dueDate = new Date(risk.dueDate);
      const isCompleted = isRiskCompleted(risk);
      
      if (!isCompleted && dueDate < today) {
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const level = (risk.residualRisk?.level || risk.inherentRisk?.level || "Medium").toLowerCase();
        
        // Determine criticality bucket
        const criticalityKey = level === "critical" ? "critical" : 
                               level === "high" ? "high" : 
                               level === "low" ? "low" : "medium";
        
        byCriticality[criticalityKey]++;
        
        // Bucket by age
        if (daysOverdue > 90) {
          agingBuckets[criticalityKey]['90+']++;
          overdueRisks90Plus.push({ id: risk.id, title: risk.title, daysOverdue, level });
        } else if (daysOverdue > 60) {
          agingBuckets[criticalityKey]['60']++;
        } else if (daysOverdue > 30) {
          agingBuckets[criticalityKey]['30']++;
        }
        
        // Aggregate by business unit
        byBusinessUnit[risk.businessUnit] = (byBusinessUnit[risk.businessUnit] || 0) + 1;
        
        // Aggregate by category
        if (risk.category in byCategory) {
          byCategory[risk.category]++;
        } else {
          byCategory['Operational']++; // Default fallback
        }
      }
    });
    
    // Sort business units by count
    const sortedBusinessUnits = Object.entries(byBusinessUnit)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // Sort categories by count
    const sortedCategories = Object.entries(byCategory)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
    
    const totalOverdue = byCriticality.critical + byCriticality.high + byCriticality.medium + byCriticality.low;
    
    return {
      totalOverdue,
      overdueRisks90Plus: overdueRisks90Plus.sort((a, b) => b.daysOverdue - a.daysOverdue),
      byBusinessUnit: sortedBusinessUnits,
      byCategory: sortedCategories,
      byCriticality,
      agingBuckets
    };
  }, [riskData]);

  const metrics = [
    {
      title: "Assessments Pending Review/Approval",
      value: 24,
      trend: "+12% since last month",
      trendUp: true,
      icon: FileCheck,
      segments: [
        { label: "Overdue", value: 4, sublabel: "4 Overdue", color: "bg-error" },
        { label: "Due Today", value: 3, sublabel: "3 Due Today", color: "bg-warning" },
        { label: "Not Due Yet", value: 17, sublabel: "17 Not Due Yet", color: "bg-success" },
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
        { label: "Critical", value: 8, sublabel: "8 Critical", color: "bg-error" },
        { label: "High", value: 16, sublabel: "16 High", color: "bg-warning" },
        { label: "Medium", value: 45, sublabel: "45 Medium", color: "bg-success" },
      ],
      description: "Immediately prioritize review of Critical & High risks.",
      tooltip: "Displays risks that remain elevated even after controls are applied. Critical and High residual risks indicate areas where additional mitigation strategies may be needed.",
    },
    {
      title: "2nd Line Challenges",
      value: 88,
      isPercentage: true,
      trend: "+7% since last month",
      trendUp: true,
      icon: FileCheck,
      segments: [
        { label: "Agreed (88%)", value: 155, sublabel: "155 Agreed", color: "bg-success" },
        { label: "Pending (8%)", value: 15, sublabel: "15 Pending", color: "bg-warning" },
        { label: "Challenged (4%)", value: 8, sublabel: "8 Challenged", color: "bg-error" },
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
        { label: "External Fraud", value: 1.2, sublabel: "External Fraud: $1.2M", color: "bg-error-dark" },
        { label: "Process Error", value: 1.8, sublabel: "Process Error: $1.8M", color: "bg-warning" },
        { label: "System Failures", value: 1.2, sublabel: "System Failures: $1.2M", color: "bg-warning-light" },
      ],
      description: "Top 3 drivers caused over 90% of losses. Validate RCSA focus.",
      tooltip: "Summarizes financial losses from operational events across your risk portfolio. Use this to validate that your RCSA coverage aligns with actual loss drivers.",
    },
    {
      title: "Issues Velocity & Efficiency",
      value: velocityMetrics.avgRemediationDays,
      valueSuffix: " days",
      subLabel: "Avg Time to Remediate",
      trend: `${velocityMetrics.completionRate}% on-time completion`,
      trendUp: velocityMetrics.completionRate >= 70,
      icon: Timer,
      segments: [
        { label: "On Time", value: velocityMetrics.completedOnTime, sublabel: `${velocityMetrics.completedOnTime} On Time`, color: "bg-success" },
        { label: "Late", value: velocityMetrics.completedLate, sublabel: `${velocityMetrics.completedLate} Late`, color: "bg-warning" },
        { label: "Still Overdue", value: velocityMetrics.stillOverdue, sublabel: `${velocityMetrics.stillOverdue} Still Overdue`, color: "bg-error" },
      ],
      description: "High ATTR suggests resource gaps. Late completions indicate planning issues.",
      tooltip: "Tracks remediation speed and discipline. Average Time to Remediate shows how quickly issues are resolved. On-time completion rate indicates accountability in business units.",
    },
    {
      title: "Risk Exposure & Aging",
      value: agingMetrics.totalOverdue,
      subLabel: "Total Aged Issues",
      trend: `${agingMetrics.overdueRisks90Plus.length} overdue 90+ days`,
      trendUp: false,
      icon: BarChart3,
      segments: [
        { label: "Critical", value: agingMetrics.byCriticality.critical, sublabel: `${agingMetrics.byCriticality.critical} Critical`, color: "bg-error-dark" },
        { label: "High", value: agingMetrics.byCriticality.high, sublabel: `${agingMetrics.byCriticality.high} High`, color: "bg-error" },
        { label: "Medium", value: agingMetrics.byCriticality.medium, sublabel: `${agingMetrics.byCriticality.medium} Medium`, color: "bg-warning" },
        { label: "Low", value: agingMetrics.byCriticality.low, sublabel: `${agingMetrics.byCriticality.low} Low`, color: "bg-success" },
      ],
      description: "Focus on Critical & High items past 30+ days. Escalate 90+ day items.",
      tooltip: "Highlights backlog risks by criticality and age. Items overdue 90+ days are candidates for immediate escalation to Risk Committee or senior management.",
    },
  ];

  // Robust status normalization helper
  const normalizeStatus = (status: string): string => {
    return status
      .trim()
      .toLowerCase()
      .replace(/[\u00A0\u2007\u202F]/g, ' ') // normalize non-breaking spaces
      .replace(/[／⁄∕]/g, '/') // normalize unicode slashes to standard slash
      .replace(/[^a-z0-9]+/g, '-') // replace any non-alphanumeric run with single dash
      .replace(/^-+|-+$/g, ''); // trim leading/trailing dashes
  };

  const filteredRiskData = useMemo(() => {
    return riskData.filter(risk => {
      // Tab filter
      if (risk.tabCategory !== activeTab) return false;
      
      // Business Unit filter
      if (businessUnitFilter !== "all" && risk.businessUnit !== businessUnitFilter) return false;
      
      // Status filter
      if (statusFilter !== "all") {
        const normalizedRiskStatus = normalizeStatus(risk.status ?? "");
        if (normalizedRiskStatus !== statusFilter) return false;
      }
      
      // Risk Hierarchy filter
      if (riskHierarchyFilter !== "all") {
        const normalizedLevel = risk.riskLevel.toLowerCase().replace(" ", "-");
        if (normalizedLevel !== riskHierarchyFilter) return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          risk.title.toLowerCase().includes(query) ||
          risk.id.toLowerCase().includes(query) ||
          risk.owner.toLowerCase().includes(query) ||
          risk.businessUnit.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      return true;
    });
  }, [riskData, activeTab, businessUnitFilter, statusFilter, riskHierarchyFilter, searchQuery]);

  // Risk traversal logic - must be after filteredRiskData is declared
  const traversableRisks = useMemo(() => {
    const risksToTraverse = isReviewMode && reviewRiskIds.length > 0
      ? filteredRiskData.filter(r => reviewRiskIds.includes(r.id))
      : filteredRiskData;
    return risksToTraverse.map(r => ({
      id: r.id,
      title: r.title,
      sectionCompletion: r.sectionCompletion,
    }));
  }, [filteredRiskData, isReviewMode, reviewRiskIds]);

  const currentTraversalIndex = useMemo(() => {
    if (!selectedRiskForOverview) return -1;
    return traversableRisks.findIndex(r => r.id === selectedRiskForOverview.id);
  }, [traversableRisks, selectedRiskForOverview]);

  const isFirstRisk = currentTraversalIndex <= 0;
  const isLastRisk = currentTraversalIndex >= traversableRisks.length - 1;

  const goToNextRisk = useCallback(() => {
    if (isLastRisk || currentTraversalIndex === -1) return;
    const nextRisk = traversableRisks[currentTraversalIndex + 1];
    if (nextRisk) setSelectedRiskForOverview(nextRisk);
  }, [traversableRisks, currentTraversalIndex, isLastRisk]);

  const goToPreviousRisk = useCallback(() => {
    if (isFirstRisk || currentTraversalIndex === -1) return;
    const prevRisk = traversableRisks[currentTraversalIndex - 1];
    if (prevRisk) setSelectedRiskForOverview(prevRisk);
  }, [traversableRisks, currentTraversalIndex, isFirstRisk]);

  const startReviewMode = useCallback(() => {
    const ids = Array.from(selectedRisks);
    const validRisks = filteredRiskData.filter(r => ids.includes(r.id));
    if (validRisks.length === 0) return;
    setReviewRiskIds(ids);
    setIsReviewMode(true);
    setSelectedRiskForOverview({
      id: validRisks[0].id,
      title: validRisks[0].title,
      sectionCompletion: validRisks[0].sectionCompletion,
    });
    setRiskOverviewModalOpen(true);
  }, [selectedRisks, filteredRiskData]);

  // Get unique business units for grouping
  const businessUnitsInView = useMemo(() => {
    const units = [...new Set(filteredRiskData.map(r => r.businessUnit))];
    return units.sort();
  }, [filteredRiskData]);

  // State to track if grouped by business unit (default: true)
  const [isGroupedByBusinessUnit, setIsGroupedByBusinessUnit] = useState(true);

  // Filter and organize risks by hierarchy
  const getVisibleRisks = () => {
    const visible: RiskData[] = [];
    filteredRiskData.forEach(risk => {
      if (risk.riskLevel === "Level 1") {
        visible.push(risk);
        if (expandedRows.has(risk.id)) {
          // Get Level 2 children
          const level2Risks = filteredRiskData.filter(r => r.riskLevel === "Level 2" && r.parentRisk === risk.title);
          // For each Level 2, add it and its Level 3 children
          level2Risks.forEach(l2 => {
            visible.push(l2);  // Add Level 2 risk
            const level3Risks = filteredRiskData.filter(r => r.riskLevel === "Level 3" && r.parentRisk === l2.title);
            visible.push(...level3Risks);
          });
        }
      }
    });
    return visible;
  };

  // Get risks grouped by business unit
  const getGroupedRisks = useMemo(() => {
    const visibleRisks = getVisibleRisks();
    const grouped: { [key: string]: RiskData[] } = {};
    
    visibleRisks.forEach(risk => {
      if (!grouped[risk.businessUnit]) {
        grouped[risk.businessUnit] = [];
      }
      grouped[risk.businessUnit].push(risk);
    });
    
    // Sort business units alphabetically
    const sortedKeys = Object.keys(grouped).sort();
    return sortedKeys.map(unit => ({
      businessUnit: unit,
      risks: grouped[unit],
      count: grouped[unit].length
    }));
  }, [filteredRiskData, expandedRows]);

  // Helper function to convert risk level to numeric score
  const getRiskScore = (level: string): number => {
    const levelMap: Record<string, number> = {
      "Critical": 5,
      "High": 4,
      "Medium-High": 3,
      "Medium": 3,
      "Low-Medium": 2,
      "Low": 1,
    };
    return levelMap[level] || 3;
  };

  // Helper function to convert numeric score back to level
  const getAggregatedLevel = (avgScore: number): { level: string; color: string } => {
    if (avgScore >= 4.5) return { level: "Critical", color: "red" };
    if (avgScore >= 3.5) return { level: "High", color: "orange" };
    if (avgScore >= 2.5) return { level: "Medium", color: "yellow" };
    if (avgScore >= 1.5) return { level: "Low-Medium", color: "cyan" };
    return { level: "Low", color: "green" };
  };

  // Helper function to convert control effectiveness to numeric score
  const getControlScore = (effectiveness: { label: string; color: string }): number => {
    const map: Record<string, number> = {
      "Strong": 5,
      "Effective": 5,
      "Adequate": 4,
      "Partially Effective": 3,
      "Moderate": 3,
      "Needs Improvement": 2,
      "Ineffective": 2,
      "Weak": 1,
      "Not Assessed": 3,
    };
    return map[effectiveness.label] || 3;
  };

  // Helper function to convert numeric score back to control effectiveness
  const getAggregatedControlEffectiveness = (avgScore: number): { level: string; color: string } => {
    if (avgScore >= 4.5) return { level: "Strong", color: "green" };
    if (avgScore >= 3.5) return { level: "Adequate", color: "cyan" };
    if (avgScore >= 2.5) return { level: "Moderate", color: "yellow" };
    if (avgScore >= 1.5) return { level: "Needs Improvement", color: "orange" };
    return { level: "Weak", color: "red" };
  };

  // Business Unit Aggregation
  const businessUnitAggregations = useMemo(() => {
    const aggregations: Record<string, {
      riskCount: number;
      avgInherentRisk: { level: string; color: string; score: number };
      avgControlEffectiveness: { level: string; color: string; score: number };
      avgResidualRisk: { level: string; color: string; score: number };
    }> = {};

    businessUnitsInView.forEach(unit => {
      const unitRisks = filteredRiskData.filter(r => r.businessUnit === unit);
      if (unitRisks.length === 0) return;

      // Calculate average inherent risk
      const inherentScores = unitRisks.map(r => getRiskScore(r.inherentRisk.level));
      const avgInherent = inherentScores.reduce((a, b) => a + b, 0) / inherentScores.length;

      // Calculate average control effectiveness
      const controlScores = unitRisks.map(r => getControlScore(r.controlEffectiveness));
      const avgControl = controlScores.reduce((a, b) => a + b, 0) / controlScores.length;

      // Calculate average residual risk
      const residualScores = unitRisks.map(r => getRiskScore(r.residualRisk.level));
      const avgResidual = residualScores.reduce((a, b) => a + b, 0) / residualScores.length;

      aggregations[unit] = {
        riskCount: unitRisks.length,
        avgInherentRisk: { ...getAggregatedLevel(avgInherent), score: avgInherent },
        avgControlEffectiveness: { ...getAggregatedControlEffectiveness(avgControl), score: avgControl },
        avgResidualRisk: { ...getAggregatedLevel(avgResidual), score: avgResidual },
      };
    });

    return aggregations;
  }, [filteredRiskData, businessUnitsInView]);

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
      case "Level 1": return "bg-[#6A75D8]/20 text-[#6A75D8] border-[#979EE4] dark:bg-[#6A75D8]/20 dark:text-[#979EE4]";
      case "Level 2": return "bg-[#A361CF]/20 text-[#A361CF] border-[#A361CF]/50 dark:bg-[#A361CF]/20 dark:text-[#A361CF]";
      case "Level 3": return "bg-[#F1BA50]/20 text-[#CE7900] border-[#F1BA50] dark:bg-[#F1BA50]/20 dark:text-[#F1BA50]";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Sent for Assessment": return "bg-cyan-500 text-white";
      case "In Progress": return "bg-amber-500 text-white";
      case "Pending Approval": return "bg-purple-500 text-white";
      case "Review/Challenge": return "bg-orange-500 text-white";
      case "Completed": return "bg-green-500 text-white";
      case "Complete": return "bg-green-500 text-white";
      case "Closed": return "bg-slate-500 text-white";
      case "Overdue": return "bg-red-500 text-white";
      default: return "bg-blue-500 text-white";
    }
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case "Operational": return "bg-[#6A75D8]/10 dark:bg-[#6A75D8]/20 text-[#10052F] dark:text-white";
      case "Technology": return "bg-[#0A8078]/10 dark:bg-[#0A8078]/20 text-[#10052F] dark:text-white";
      case "Compliance": return "bg-[#A361CF]/10 dark:bg-[#A361CF]/20 text-[#10052F] dark:text-white";
      case "Financial": return "bg-[#46AF6A]/10 dark:bg-[#46AF6A]/20 text-[#10052F] dark:text-white";
      default: return "bg-muted/30 text-[#10052F] dark:text-white";
    }
  };

  const getRiskBadgeColor = (color: string) => {
    switch (color) {
      case "red":
        return "bg-[#D21C1C]/20 text-[#D21C1C] border-[#D21C1C]/30 dark:bg-[#D21C1C]/20 dark:text-[#D21C1C]";
      case "yellow":
        return "bg-[#F1BA50]/20 text-[#CE7900] border-[#F1BA50]/50 dark:bg-[#F1BA50]/20 dark:text-[#F1BA50]";
    case "green":
      return "bg-[#46AF6A]/20 text-[#10052F] border-[#46AF6A]/30 dark:bg-[#46AF6A]/20 dark:text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getRiskBadgeColorBg = (color: string) => {
    switch (color) {
      case "red":
        return "bg-[#D21C1C]/20 text-[#D21C1C] border-[#D21C1C]/30 dark:text-[#D21C1C]";
      case "orange":
        return "bg-[#F1BA50]/20 text-[#CE7900] border-[#CE7900]/30 dark:text-[#F1BA50]";
      case "yellow":
        return "bg-[#F1BA50]/20 text-[#CE7900] border-[#F1BA50]/50 dark:text-[#F1BA50]";
      case "cyan":
        return "bg-[#0A8078]/20 text-[#0A8078] border-[#0A8078]/30 dark:text-[#0A8078]";
    case "green":
      return "bg-[#46AF6A]/20 text-[#10052F] border-[#46AF6A]/30 dark:text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getEffectivenessBadge = (label: string, color: string) => {
    let colorClass = "bg-[#8B5993] text-white";
    if (color === "green") {
      colorClass = "bg-[#46AF6A] text-white";
    } else if (color === "yellow" || label === "Partially Effective") {
      colorClass = "bg-[#CE7900] text-white";
    } else if (label === "Ineffective") {
      colorClass = "bg-[#D21C1C] text-white";
    }
    return <Badge className={`${colorClass} rounded-full`}>{label}</Badge>;
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-background dark:via-background dark:to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 dark:bg-card/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-6 py-1 sm:py-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-second-line flex items-center justify-center flex-shrink-0">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-semibold text-[#10052F] dark:text-white truncate">
                  <span className="hidden sm:inline">2nd Line Risk Analyst Dashboard</span>
                  <span className="sm:hidden">2nd Line Dashboard</span>
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Risk and Control Self Assessment</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 px-2 sm:px-3 rounded-none">
                    <User className="w-3.5 h-3.5 sm:mr-2" />
                    <span className="hidden sm:inline">2nd Line Analyst</span>
                    <ChevronDown className="w-3.5 h-3.5 ml-1 sm:ml-2" />
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
      <main className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
        {/* Quick Links - Horizontal Strip */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1.5 px-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#10052F] dark:text-white">
              <Link className="w-3 h-3 text-[#10052F] dark:text-white" />
              Quick Links:
            </div>
            <button onClick={() => handleQuickLinkClick("assess")} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs">
              <ClipboardCheck className="w-3 h-3" />
              <span>Open Risk Assessments</span>
            </button>
            <span className="text-gray-400 dark:text-gray-500">|</span>
            <button onClick={() => handleQuickLinkClick("approve")} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs">
              <CheckCircle className="w-3 h-3" />
              <span>Assessments Awaiting Approval</span>
            </button>
            <span className="text-gray-400 dark:text-gray-500">|</span>
            <button onClick={handleOpenChallengesClick} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs">
              <AlertTriangle className="w-3 h-3" />
              <span>View 2nd Line Challenged Risks</span>
            </button>
          </div>

        {/* Scorecards - 3 columns x 3 rows with specific positioning */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-4">
          {/* Render metrics in specific grid positions:
              Column 1: metrics[0] (row 1), metrics[3] (row 2), metrics[2] (row 3)
              Column 2: metrics[4] (row 1), metrics[1] (row 2), metrics[5] (row 3)
              Column 3: Challenge Heatmap (spans 3 rows)
          */}
          {[0, 4, 3, 1, 2, 5].map((metricIndex, orderIndex) => {
            const metric = metrics[metricIndex];
            // Grid positions for lg screens
            const gridPositions = [
              'lg:col-start-1 lg:row-start-1', // metrics[0] - Col 1, Row 1
              'lg:col-start-2 lg:row-start-1', // metrics[4] - Col 2, Row 1
              'lg:col-start-1 lg:row-start-2', // metrics[3] - Col 1, Row 2
              'lg:col-start-2 lg:row-start-2', // metrics[1] - Col 2, Row 2
              'lg:col-start-1 lg:row-start-3', // metrics[2] - Col 1, Row 3
              'lg:col-start-2 lg:row-start-3', // metrics[5] - Col 2, Row 3
            ];
            const segments = metric.segments as Array<{ label: string; value: number; sublabel: string; color: string }>;
            let total = 0;
            for (const s of segments) total += s.value;
            const IconComponent = metric.icon;
            
            return (
              <Tooltip key={metricIndex}>
                <TooltipTrigger asChild>
                  <Card className={`${gridPositions[orderIndex]} border border-border/50 dark:border-border shadow-sm hover:shadow-md transition-all duration-200 bg-card dark:bg-card cursor-pointer rounded-none`}>
                    <CardContent className="p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <IconComponent className="w-3 h-3 text-primary" />
                          </div>
                          <h3 className="text-[10px] font-bold text-[#10052F] dark:text-white uppercase tracking-wide">{metric.title}</h3>
                        </div>
                        {metric.trend && (
                          <span className={`text-[10px] font-medium ${metric.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                            {metric.trend}
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <p className="text-xl font-bold text-[#10052F] dark:text-white">
                          {typeof metric.value === 'string' ? metric.value : `${metric.value}${'isPercentage' in metric && metric.isPercentage ? "%" : ""}`}
                          {'valueSuffix' in metric && (metric as any).valueSuffix}
                        </p>
                        {'subLabel' in metric && (
                          <span className="text-xs text-muted-foreground">{(metric as any).subLabel}</span>
                        )}
                      </div>
                      {/* Progress bar */}
                      <div className="flex h-1.5 rounded overflow-hidden mb-1">
                        {segments.map((segment, idx) => {
                          const percentage = total > 0 ? (segment.value / total) * 100 : 0;
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
                      <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 mb-1">
                        {segments.map((segment, idx) => (
                          <div key={idx} className="flex items-center gap-0.5">
                            <div className={`w-1.5 h-1.5 rounded-sm ${segment.color}`} />
                            <span className="text-[9px] font-medium text-muted-foreground">
                              {segment.sublabel || segment.label}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight">{metric.description}</p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-sm">{metric.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
          
          {/* Column 3: Challenge Heatmap spanning 3 rows */}
          <Card className="lg:col-start-3 lg:row-start-1 lg:row-span-3 border border-border/50 dark:border-border shadow-sm bg-card dark:bg-card rounded-none order-last lg:order-none overflow-hidden">
            <CardHeader className="py-1.5 px-2.5 border-b border-border/50 bg-muted/30">
              <div className="flex items-center gap-1.5">
                <Grid3x3 className="w-3.5 h-3.5 text-primary" />
                <CardTitle className="text-[10px] font-bold uppercase tracking-wide text-[#10052F] dark:text-white">
                  Challenge Heatmap
                </CardTitle>
              </div>
              <p className="text-[9px] text-muted-foreground mt-0.5">
                N/A Controls % by Business Unit vs Enterprise Average
              </p>
            </CardHeader>
            <CardContent className="p-2 h-[calc(100%-50px)]">
              <ChallengeHeatmap />
            </CardContent>
          </Card>
        </div>

        {/* Risk Coverage by Business Unit Section */}
        <Card ref={reportSectionRef} className="border-[3px] border-border/50 dark:border-border shadow-sm bg-white dark:bg-card rounded-none">
          {/* Row 1: Title + Action Buttons */}
          <CardHeader className="border-b border-border/50 space-y-0 py-0 px-0 bg-muted/30">
            <div className="flex items-center justify-between h-12">
              {/* Left: Title */}
              <div className="flex items-center gap-1.5 px-4">
              <span className="text-base font-semibold text-[#10052F] dark:text-white">
                  Risk Coverage by Business Unit
                </span>
                <span className="text-base text-[#10052F] dark:text-white">
                  ({filteredRiskData.length})
                </span>
              </div>
              
              {/* Right: Action Buttons */}
              <div className="flex items-center gap-2 pr-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10 rounded-none"
                  onClick={() => setActionDialog({ open: true, type: "reassign", riskId: null })}
                  disabled={selectedRisks.size === 0}
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  Reassign
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10 rounded-none"
                  onClick={() => setActionDialog({ open: true, type: "collaborate", riskId: null })}
                  disabled={selectedRisks.size === 0}
                >
                  <UsersIcon className="w-3.5 h-3.5 mr-1.5" />
                  Collaborate
                </Button>
                <Button 
                  size="sm"
                  className="h-8 text-xs bg-primary text-white hover:bg-primary/90 rounded-none"
                  onClick={startReviewMode}
                  disabled={selectedRisks.size === 0}
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  Review Selected ({selectedRisks.size})
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Row 2: Tabs */}
          <div className="border-b border-border/50 bg-muted/10 px-4 py-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("own")}
                className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wide border transition-all ${
                  activeTab === "own"
                    ? "bg-primary text-white border-primary"
                    : "bg-transparent text-primary border-primary hover:bg-primary/10"
                } ${highlightedTab === "own" ? "animate-tab-flash animate-tab-pulse ring-2 ring-primary/50 ring-offset-2" : ""}`}
              >
                Completed Assessments ({riskData.filter(r => r.tabCategory === "own").length})
              </button>
              <button
                onClick={() => setActiveTab("assess")}
                className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wide border transition-all ${
                  activeTab === "assess"
                    ? "bg-primary text-white border-primary"
                    : "bg-transparent text-primary border-primary hover:bg-primary/10"
                } ${highlightedTab === "assess" ? "animate-tab-flash animate-tab-pulse ring-2 ring-primary/50 ring-offset-2" : ""}`}
              >
                Risks to be Assessed ({riskData.filter(r => r.tabCategory === "assess").length})
              </button>
              <button
                onClick={() => setActiveTab("approve")}
                className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wide border transition-all ${
                  activeTab === "approve"
                    ? "bg-primary text-white border-primary"
                    : "bg-transparent text-primary border-primary hover:bg-primary/10"
                } ${highlightedTab === "approve" ? "animate-tab-flash animate-tab-pulse ring-2 ring-primary/50 ring-offset-2" : ""}`}
              >
                Risks to be Approved ({riskData.filter(r => r.tabCategory === "approve").length})
              </button>
            </div>
          </div>

          {/* Row 3: Info Banner */}
          <div className="bg-indigo-50 dark:bg-indigo-900/10 border-b border-indigo-200 dark:border-indigo-800 px-4 py-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-indigo-600 dark:text-indigo-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-800 dark:text-indigo-200">
                {activeTab === "own" && "These assessments have been completed by the users listed under 'Assessors/Collaborators'. Report defaults to group view - grouped by 'Business Unit'. Click on the Business Unit column header to ungroup or re-group anytime. Click on the Risk Title to view details and any open challenge comments."}
                {activeTab === "assess" && "These risks are pending assessment by the users listed under 'Assessors/Collaborators'. Report defaults to group view - grouped by 'Business Unit'. Click on the Business Unit column header to ungroup or re-group anytime. Click on the Risk Title to begin your assessment and view any open challenge comments."}
                {activeTab === "approve" && "These risk assessments require approval by the users listed under 'Assessors/Collaborators'. Report defaults to group view - grouped by 'Business Unit'. Click on the Business Unit column header to ungroup or re-group anytime. Click on the Risk Title to review and view any open challenge comments."}
              </p>
            </div>
          </div>

          {/* Row 4: Filter Bar */}
          <div className="bg-muted/20 border-b border-border/50 px-4 py-2">
            <div className="flex items-center gap-4">
              {/* Business Unit Filter */}
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <Select value={businessUnitFilter} onValueChange={setBusinessUnitFilter}>
                  <SelectTrigger className="border-0 bg-transparent h-auto p-0 text-xs uppercase tracking-wide font-medium text-muted-foreground hover:text-foreground focus:ring-0 gap-1 w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-50 max-h-[300px]">
                    <SelectItem value="all">All Business Units</SelectItem>
                    {Array.from(new Set(riskData.map(r => r.businessUnit))).sort().map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-0 bg-transparent h-auto p-0 text-xs uppercase tracking-wide font-medium text-muted-foreground hover:text-foreground focus:ring-0 gap-1 w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-50">
                    <SelectItem value="all">All Statuses</SelectItem>
                    {activeTab === "own" ? (
                      <SelectItem value="completed">Completed</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="sent-for-assessment">Sent for Assessment</SelectItem>
                        <SelectItem value="review-challenge">Review/Challenge</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Risk Hierarchy Filter */}
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <Select value={riskHierarchyFilter} onValueChange={setRiskHierarchyFilter}>
                  <SelectTrigger className="border-0 bg-transparent h-auto p-0 text-xs uppercase tracking-wide font-medium text-muted-foreground hover:text-foreground focus:ring-0 gap-1 w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-50">
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="level-1">Level 1</SelectItem>
                    <SelectItem value="level-2">Level 2</SelectItem>
                    <SelectItem value="level-3">Level 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="flex items-center gap-1.5">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  className="border-0 bg-transparent h-auto py-0 text-xs w-32 focus-visible:ring-0 placeholder:text-muted-foreground" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Reset Button */}
              {(statusFilter !== "all" || riskHierarchyFilter !== "all" || businessUnitFilter !== "all" || searchQuery.trim()) && (
                <button
                  className="text-xs uppercase tracking-wide font-medium text-second-line hover:text-second-line/80"
                  onClick={() => {
                    setStatusFilter("all");
                    setRiskHierarchyFilter("all");
                    setBusinessUnitFilter("all");
                    setSearchQuery("");
                    toast.success("Filters cleared");
                  }}
                >
                  Reset
                </button>
              )}

              {/* Row Count - Right aligned */}
              <div className="flex-1 flex justify-end">
                <span className="text-xs text-muted-foreground">
                  Showing {filteredRiskData.length} of {riskData.filter(r => r.tabCategory === activeTab).length} risk(s)
                </span>
              </div>
            </div>
          </div>

          {/* Row 5: Table Headers + Content */}
          <CardContent className="p-0">

            {/* Table with horizontal scroll */}
            <div className="border overflow-hidden -mx-2 sm:mx-0">
              <div className="overflow-x-auto">
                <Table className="border-collapse text-[#10052F] dark:text-white">
                  <TableHeader className="bg-muted/50 sticky top-0">
                    <TableRow>
                      <TableHead className="w-8 py-1 border-r border-b border-border">
                        <div className="flex items-center justify-center">
                          <Checkbox 
                            checked={selectableRisks.length > 0 && selectedRisks.size === selectableRisks.length}
                            onCheckedChange={toggleSelectAll}
                            disabled={selectableRisks.length === 0}
                            className="h-3 w-3"
                          />
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[80px] py-1 border-r border-b border-border text-xs">Update Assessment</TableHead>
                      <TableHead className="min-w-[200px] py-1 border-r border-b border-border text-xs">Risk ID / Title</TableHead>
                      <TableHead className="min-w-[70px] py-1 border-r border-b border-border text-xs">Risk Hierarchy</TableHead>
                      <TableHead className="min-w-[80px] py-1 border-r border-b border-border text-xs">Due Date</TableHead>
                      <TableHead className="min-w-[90px] py-1 border-r border-b border-border text-xs">Completion Date</TableHead>
                      <TableHead className="min-w-[150px] py-1 border-r border-b border-border text-xs">Assessment Progress</TableHead>
                      <TableHead className="min-w-[100px] py-1 border-r border-b border-border text-xs">
                        <div className="flex items-center gap-0.5">
                          <span>Business Unit</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => setIsGroupedByBusinessUnit(!isGroupedByBusinessUnit)}
                                className={`p-0.5 rounded hover:bg-muted transition-colors ${isGroupedByBusinessUnit ? 'bg-primary/10' : ''}`}
                              >
                                {isGroupedByBusinessUnit ? (
                                  <Layers className="w-3 h-3 text-primary" />
                                ) : (
                                  <List className="w-3 h-3 text-muted-foreground" />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{isGroupedByBusinessUnit ? "Click to ungroup" : "Click to group by Business Unit"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[130px] py-1 border-r border-b border-border text-xs">Assessors/Collaborators</TableHead>
                      <TableHead className="min-w-[120px] py-1 border-r border-b border-border text-xs">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted decoration-muted-foreground underline-offset-2">
                              Inherent Rating
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs p-2 text-xs">
                            <div className="space-y-1">
                              <p className="font-semibold">Inherent Rating</p>
                              <p>The level of risk before considering the effectiveness of any controls. Calculated as:</p>
                              <p className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">Likelihood × Impact = Inherent Score</p>
                              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                                <li><span className="text-red-600 font-medium">Critical</span>: Score 15-25</li>
                                <li><span className="text-orange-500 font-medium">High</span>: Score 10-14</li>
                                <li><span className="text-yellow-600 font-medium">Medium</span>: Score 5-9</li>
                                <li><span className="text-green-600 font-medium">Low</span>: Score 1-4</li>
                              </ul>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="min-w-[130px] py-1 border-r border-b border-border text-xs">Related Controls</TableHead>
                      <TableHead className="min-w-[150px] py-1 border-r border-b border-border text-xs">Calculated Control Effectiveness</TableHead>
                      <TableHead className="min-w-[130px] py-1 border-r border-b border-border text-xs">Control Test Results</TableHead>
                      <TableHead className="min-w-[120px] py-1 border-r border-b border-border text-xs">Residual Risk</TableHead>
                      <TableHead className="min-w-[100px] py-1 border-b border-border text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isGroupedByBusinessUnit ? (
                      // Grouped view - Business Unit headers with risks underneath
                      getGroupedRisks.map((group) => {
                        const aggregation = businessUnitAggregations[group.businessUnit];
                        return (
                          <>
                            {/* Business Unit Group Header Row - Unified with Aggregation Cards */}
                            <TableRow key={`agg-${group.businessUnit}`} className="bg-slate-100 dark:bg-slate-800 border-t-2 border-l-4 border-l-primary border-primary/30">
                              <TableCell colSpan={14} className="py-1 sm:py-1.5 border-b border-border">
                                <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                                  {/* Business Unit info */}
                                  <div className="flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-primary" />
                                    <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">Grouped by: Business Unit</span>
                                    <span className="font-bold text-xs">{group.businessUnit}</span>
                                    <Badge variant="secondary" className="text-[9px] font-medium">{group.count} risks</Badge>
                                  </div>
                                  
                                  {/* Aggregated metrics cards - inline after BU info */}
                                  {aggregation && (
                                    <>
                                      <div className="h-3.5 w-px bg-border" />
                                      <div className="flex items-center gap-1 flex-wrap">
                                      {/* Inherent Rating Card */}
                                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-background/80 border border-border shadow-sm">
                                        <div className="flex flex-col">
                                          <span className="text-[8px] text-muted-foreground uppercase font-medium tracking-wide">Inherent Rating</span>
                                          <div className="flex items-center gap-1">
                                            <span className="text-[10px] font-bold text-[#10052F] dark:text-white">{aggregation.avgInherentRisk.score.toFixed(1)}</span>
                                            <Badge className={`${getRiskBadgeColorBg(aggregation.avgInherentRisk.color)} border px-1 text-[9px]`}>
                                              {aggregation.avgInherentRisk.level}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Control Effectiveness Card */}
                                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-background/80 border border-border shadow-sm">
                                        <div className="flex flex-col">
                                          <span className="text-[8px] text-muted-foreground uppercase font-medium tracking-wide">Control Effectiveness</span>
                                          <div className="flex items-center gap-1">
                                            <span className="text-[10px] font-bold text-[#10052F] dark:text-white">{aggregation.avgControlEffectiveness.score.toFixed(1)}</span>
                                            <Badge className={`${getRiskBadgeColorBg(aggregation.avgControlEffectiveness.color)} border px-1 text-[9px]`}>
                                              {aggregation.avgControlEffectiveness.level}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Residual Rating Card */}
                                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-background/80 border border-border shadow-sm">
                                        <div className="flex flex-col">
                                          <span className="text-[8px] text-muted-foreground uppercase font-medium tracking-wide">Residual Rating</span>
                                          <div className="flex items-center gap-1">
                                            <span className="text-[10px] font-bold text-[#10052F] dark:text-white">{aggregation.avgResidualRisk.score.toFixed(1)}</span>
                                            <Badge className={`${getRiskBadgeColorBg(aggregation.avgResidualRisk.color)} border px-1 text-[9px]`}>
                                              {aggregation.avgResidualRisk.level}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                            
                            {/* Individual Risk Rows - Always visible */}
                            {group.risks.map((risk, index) => {
                              const isLevel1 = risk.riskLevel === "Level 1";
                              const isLevel2 = risk.riskLevel === "Level 2";
                              const isLevel3 = risk.riskLevel === "Level 3";
                              const isExpanded = expandedRows.has(risk.id);
                              const canExpand = hasChildren(risk);
                              
                              return (
                              <TableRow key={`${group.businessUnit}-${index}`} className={`hover:bg-muted/50 transition-colors ${
                                isLevel1 ? 'bg-blue-50/30 dark:bg-blue-950/10' : 
                                'bg-orange-50/10 dark:bg-orange-950/10'
                              }`}>
                        <TableCell className="py-[2px] border-r border-b border-border">
                          <div className="flex items-center justify-center">
                            <Checkbox 
                              checked={selectedRisks.has(risk.id)}
                              onCheckedChange={() => toggleRiskSelection(risk.id)}
                              disabled={isRiskCompleted(risk)}
                              className={`h-3 w-3 ${isRiskCompleted(risk) ? "opacity-50 cursor-not-allowed" : ""}`}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-[2px] border-r border-b border-border">
                          {(risk.status === "Completed" || risk.status === "Complete" || risk.status === "Closed") && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    className="p-0.5 rounded-md bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 transition-colors"
                                    onClick={() => handleUpdateClosedAssessment(risk.id)}
                                  >
                                    <RefreshCw className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Update this closed assessment</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                        {/* Risk ID / Title (combined) */}
                        <TableCell className="py-[2px] border-r border-b border-border">
                          <div className="flex items-start gap-1.5">
                            {isLevel1 && canExpand && (
                              <button
                                onClick={() => toggleRow(risk.id)}
                                className="p-0.5 hover:bg-muted rounded transition-colors flex-shrink-0 mt-0.5"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                )}
                              </button>
                            )}
                            {isLevel1 && !canExpand && <div className="w-6" />}
                            {isLevel3 && <div className="w-6 ml-4" />}
                            
                            <div className="flex flex-col gap-2">
                              {/* Level 1 Title */}
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-medium text-primary">{risk.id}</span>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button 
                                      onClick={() => handleRiskNameClick(risk)}
                                      className="text-left hover:text-primary transition-colors font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-[10px]"
                                    >
                                      {risk.title}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Click to view risk assessment and open challenges/issues.</p>
                                  </TooltipContent>
                                </Tooltip>
                                <span className="text-[10px] text-muted-foreground">{risk.owner}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium inline-block w-fit ${getCategoryColor(risk.category)}`}>
                                  {risk.category}
                                </span>
                              </div>
                              
                              {/* Level 2 Children (displayed within Level 1 row) */}
                              {isLevel1 && getLevel2Children(risk).map((l2Risk) => (
                              <div key={l2Risk.id} className="flex flex-col gap-0.5 pl-3 border-l-2 border-blue-300 dark:border-blue-600 ml-1 mt-0.5">
                                  <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">{l2Risk.id}</span>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button 
                                        onClick={() => handleRiskNameClick(l2Risk)}
                                      className="text-left hover:text-primary transition-colors font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-[10px]"
                                    >
                                      └ {l2Risk.title}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Click to view risk assessment and open challenges/issues.</p>
                                  </TooltipContent>
                                </Tooltip>
                                  <span className="text-[10px] text-muted-foreground">{l2Risk.owner}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        {/* Risk Hierarchy */}
                        <TableCell className="py-[2px] border-r border-b border-border">
                          <div className="flex flex-col items-center gap-0.5">
                          <Badge className={`${getRiskLevelColor(risk.riskLevel)} w-fit px-1.5 py-0 text-[8px] font-medium`}>
                              {risk.riskLevel}
                            </Badge>
                            {isLevel1 && getLevel2Children(risk).map((l2Risk) => (
                              <Badge key={l2Risk.id} className={`${getRiskLevelColor(l2Risk.riskLevel)} w-fit px-1.5 py-0 text-[8px] font-medium`}>
                                {l2Risk.riskLevel}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        {/* Due Date */}
                        <TableCell className="py-[2px] border-r border-b border-border">
                          <div className={`text-[9px] font-medium ${
                            new Date(risk.dueDate) < new Date() 
                              ? 'text-destructive' 
                              : 'text-foreground'
                          }`}>
                            {format(new Date(risk.dueDate), 'MMM dd, yyyy')}
                          </div>
                          {new Date(risk.dueDate) < new Date() && (
                            <Badge variant="destructive" className="text-[8px] mt-0.5">Overdue</Badge>
                          )}
                        </TableCell>
                        {/* Completion Date - Only show if status is complete */}
                        <TableCell className="py-[2px] border-r border-b border-border">
                          <div className="text-[9px] font-medium text-foreground">
                            {risk.status.toLowerCase() === "complete" ? risk.lastAssessed : "-"}
                          </div>
                        </TableCell>
                        {/* Assessment Progress */}
                        <TableCell className="py-[2px] border-r border-b border-border">
                          <div className="space-y-0.5">
                            <div className="flex gap-0.5">
                              <div className={`h-1 flex-1 rounded-sm ${
                                risk.assessmentProgress.assess === "completed" ? "bg-green-500" :
                                risk.assessmentProgress.assess === "in-progress" ? "bg-amber-500" :
                                "bg-gray-300 dark:bg-gray-600"
                              }`} />
                              <div className={`h-1 flex-1 rounded-sm ${
                                risk.assessmentProgress.reviewChallenge === "completed" ? "bg-green-500" :
                                risk.assessmentProgress.reviewChallenge === "in-progress" ? "bg-amber-500" :
                                "bg-gray-300 dark:bg-gray-600"
                              }`} />
                              <div className={`h-1 flex-1 rounded-sm ${
                                risk.assessmentProgress.approve === "completed" ? "bg-green-500" :
                                risk.assessmentProgress.approve === "in-progress" ? "bg-amber-500" :
                                "bg-gray-300 dark:bg-gray-600"
                              }`} />
                            </div>
                            <div className="flex justify-between text-[8px] text-muted-foreground">
                              <span>Assess</span>
                              <span>Review/Challenge</span>
                              <span>Approve</span>
                            </div>
                          </div>
                        </TableCell>
                        {/* Business Unit */}
                        <TableCell className="py-[2px] border-r border-b border-border">
                          <Badge variant="outline" className="text-[8px] font-medium bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 text-[#10052F] dark:text-white">
                            {risk.businessUnit}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-[2px] border-r border-b border-border">
                          <div className="flex flex-wrap gap-0.5">
                            {risk.assessors.map((assessor, idx) => (
                              <Tooltip key={idx}>
                                <TooltipTrigger asChild>
                                  <Badge 
                                    variant="outline" 
                                    className="text-[9px] bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 cursor-pointer"
                                  >
                                    {assessor}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs p-2">
                                  <div className="space-y-1.5">
                                    <div className="font-semibold text-xs border-b border-border pb-1">{assessor}</div>
                                    <div className="flex items-center gap-1.5 text-[10px]">
                                      <Mail className="w-3 h-3 text-muted-foreground" />
                                      <span>{assessorEmails[assessor] || `${assessor.toLowerCase().replace(' ', '.')}@company.com`}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px]">
                                      <Building2 className="w-3 h-3 text-muted-foreground" />
                                      <span className="font-medium">{assessorDepartments[assessor] || "Risk Management"}</span>
                                    </div>
                                    <div className="pt-1 border-t border-border">
                                      <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground mb-1">
                                        <ClipboardList className="w-3 h-3" />
                                        <span>Sections Worked On:</span>
                                      </div>
                                      <div className="flex flex-wrap gap-0.5">
                                        {(assessorSections[idx] || ["Assess"]).map((section, sIdx) => (
                                          <Badge 
                                            key={sIdx} 
                                            variant="outline" 
                                            className={`text-[10px] ${
                                              section === "Assess" 
                                                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700" 
                                                : "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700"
                                            }`}
                                          >
                                            {section}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="py-[2px] border-r border-b border-border">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              {getEffectivenessBadge(risk.inherentRisk.level, risk.inherentRisk.color)}
                              {risk.inherentTrend.up ? (
                                <TrendingUp className="w-2.5 h-2.5 text-red-600" />
                              ) : (
                                <TrendingDown className="w-2.5 h-2.5 text-green-600" />
                              )}
                              <span className={`text-[8px] font-medium ${risk.inherentTrend.up ? "text-red-600" : "text-green-600"}`}>
                                {risk.inherentTrend.value}
                              </span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-3 w-3"
                                      onClick={() => handleEdit("inherent", risk.id, risk.inherentRisk.level)}
                                    >
                                      <Edit2 className="w-2 h-2 text-muted-foreground hover:text-primary cursor-pointer" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit Inherent Risk</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <div className="relative">
                              <PreviousAssessmentFloater
                                type="inherent"
                                historicalAssessments={risk.historicalAssessments || []}
                                isExpanded={expandedPreviousAssessments[risk.id]?.inherent || false}
                                onToggle={() => setExpandedPreviousAssessments(prev => ({
                                  ...prev,
                                  [risk.id]: { ...prev[risk.id], inherent: !prev[risk.id]?.inherent, control: false, residual: false }
                                }))}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-[2px] border-r border-b border-border min-w-[250px]">
                          <div className="text-[9px] max-h-16 overflow-y-auto">
                            <table className="w-full text-left table-fixed">
                              <thead>
                                <tr className="text-[8px] text-muted-foreground border-b border-border/50">
                                  <th className="pb-0.5 pr-0.5 font-medium w-[45px]">ID</th>
                                  <th className="pb-0.5 pr-0.5 font-medium w-[100px]">Name</th>
                                  <th className="pb-0.5 pr-0.5 font-medium w-[45px]">Key</th>
                                  <th className="pb-0.5 font-medium w-[45px]">Nature</th>
                                </tr>
                              </thead>
                              <tbody>
                                {risk.relatedControls.slice(0, 3).map((control, idx) => (
                                  <tr key={idx} className="border-b border-border/30 last:border-0">
                                    <td className="py-0.5 pr-0.5 text-primary font-medium overflow-hidden text-ellipsis whitespace-nowrap text-[8px]">{control.id.replace("Control-", "C-")}</td>
                                    <td className="py-0.5 pr-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button
                                              className="text-[#10052F] dark:text-white hover:text-primary hover:underline text-left truncate max-w-[90px] block text-[8px]"
                                              onClick={() => {
                                                setSelectedControl(control);
                                                setControlDetailsOpen(true);
                                              }}
                                            >
                                              {control.name}
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="top" className="max-w-[220px]">
                                            <p className="font-medium text-[9px]">{control.name}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </td>
                                    <td className="py-0.5 pr-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-[8px]">{control.keyControl}</td>
                                    <td className="py-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-[8px]">{control.nature}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {risk.relatedControls.length > 3 && (
                              <div className="text-muted-foreground text-[8px] pt-0.5">
                                +{risk.relatedControls.length - 3} more
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-[2px] border-r border-b border-border">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              {getEffectivenessBadge(risk.controlEffectiveness.label, risk.controlEffectiveness.color)}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-3 w-3"
                                      onClick={() => handleEdit("effectiveness", risk.id, risk.controlEffectiveness.label)}
                                    >
                                      <Edit2 className="w-2 h-2 text-muted-foreground hover:text-primary cursor-pointer" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit Control Effectiveness</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <div className="relative">
                              <PreviousAssessmentFloater
                                type="control"
                                historicalAssessments={risk.historicalAssessments || []}
                                isExpanded={expandedPreviousAssessments[risk.id]?.control || false}
                                onToggle={() => setExpandedPreviousAssessments(prev => ({
                                  ...prev,
                                  [risk.id]: { ...prev[risk.id], control: !prev[risk.id]?.control, inherent: false, residual: false }
                                }))}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-[2px] border-r border-b border-border">
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap gap-0.5">
                              <Badge className="bg-green-500 text-white px-1.5 py-0 text-[8px]">
                                {risk.testResults.label}
                              </Badge>
                              {risk.testResults.sublabel && (
                                <Badge className="bg-blue-500 text-white px-1.5 py-0 text-[8px]">
                                  {risk.testResults.sublabel}
                                </Badge>
                              )}
                            </div>
                            <button className="text-[8px] text-blue-600 dark:text-blue-400 hover:underline">
                              View Previous
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="py-[2px] border-r border-b border-border">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              <Badge className={`${getRiskBadgeColor(risk.residualRisk.color)} border px-1 text-[8px]`}>
                                {risk.residualRisk.level}
                              </Badge>
                              {risk.residualTrend.up ? (
                                <TrendingUp className="w-2 h-2 text-red-600" />
                              ) : (
                                <TrendingDown className="w-2 h-2 text-green-600" />
                              )}
                              <span className={`text-[8px] font-medium ${risk.residualTrend.up ? "text-red-600" : "text-green-600"}`}>
                                {risk.residualTrend.value}
                              </span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-3 w-3"
                                      onClick={() => handleEdit("residual", risk.id, risk.residualRisk.level)}
                                    >
                                      <Edit2 className="w-2 h-2 text-muted-foreground hover:text-primary cursor-pointer" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit Residual Risk</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <div className="relative">
                              <PreviousAssessmentFloater
                                type="residual"
                                historicalAssessments={risk.historicalAssessments || []}
                                isExpanded={expandedPreviousAssessments[risk.id]?.residual || false}
                                onToggle={() => setExpandedPreviousAssessments(prev => ({
                                  ...prev,
                                  [risk.id]: { ...prev[risk.id], residual: !prev[risk.id]?.residual, inherent: false, control: false }
                                }))}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-[2px] border-b border-border">
                          <Badge className={`${getStatusColor(risk.status)} shadow-sm text-[8px]`}>
                            {risk.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                            );
                          })}
                        </>
                      );
                    })
                  ) : (
                    // Ungrouped view - flat list of all risks
                    getVisibleRisks().map((risk, index) => {
                      const isLevel1 = risk.riskLevel === "Level 1";
                      const isLevel2 = risk.riskLevel === "Level 2";
                      const isLevel3 = risk.riskLevel === "Level 3";
                      const isExpanded = expandedRows.has(risk.id);
                      const canExpand = hasChildren(risk);
                      
                      return (
                        <TableRow key={`flat-${risk.id}-${index}`} className={`hover:bg-muted/50 transition-colors ${
                          isLevel1 ? 'bg-blue-50/30 dark:bg-blue-950/10' : 
                          'bg-orange-50/10 dark:bg-orange-950/10'
                        }`}>
                          <TableCell className="py-1 border-r border-b border-border">
                            <div className="flex items-center justify-center">
                              <Checkbox 
                                checked={selectedRisks.has(risk.id)}
                                onCheckedChange={() => toggleRiskSelection(risk.id)}
                                disabled={isRiskCompleted(risk)}
                                className={`h-3 w-3 ${isRiskCompleted(risk) ? "opacity-50 cursor-not-allowed" : ""}`}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="py-1 border-r border-b border-border">
                            {(risk.status === "Completed" || risk.status === "Complete" || risk.status === "Closed") && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      className="p-1 rounded-md bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 transition-colors"
                                      onClick={() => handleUpdateClosedAssessment(risk.id)}
                                    >
                                      <RefreshCw className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Update this closed assessment</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </TableCell>
                          <TableCell className="py-1 border-r border-b border-border">
                            <div className={`text-xs font-medium ${
                              new Date(risk.dueDate) < new Date() 
                                ? 'text-destructive' 
                                : 'text-foreground'
                            }`}>
                              {format(new Date(risk.dueDate), 'MMM dd, yyyy')}
                            </div>
                            {new Date(risk.dueDate) < new Date() && (
                              <Badge variant="destructive" className="text-[10px] mt-0.5">Overdue</Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-1 border-r border-b border-border">
                            <div className="space-y-0.5">
                              <div className="flex gap-0.5">
                                <div className={`h-1.5 flex-1 rounded-sm ${
                                  risk.assessmentProgress.assess === "completed" ? "bg-green-500" :
                                  risk.assessmentProgress.assess === "in-progress" ? "bg-amber-500" :
                                  "bg-gray-300 dark:bg-gray-600"
                                }`} />
                                <div className={`h-1.5 flex-1 rounded-sm ${
                                  risk.assessmentProgress.reviewChallenge === "completed" ? "bg-green-500" :
                                  risk.assessmentProgress.reviewChallenge === "in-progress" ? "bg-amber-500" :
                                  "bg-gray-300 dark:bg-gray-600"
                                }`} />
                                <div className={`h-1.5 flex-1 rounded-sm ${
                                  risk.assessmentProgress.approve === "completed" ? "bg-green-500" :
                                  risk.assessmentProgress.approve === "in-progress" ? "bg-amber-500" :
                                  "bg-gray-300 dark:bg-gray-600"
                                }`} />
                              </div>
                              <div className="flex justify-between text-[9px] text-muted-foreground">
                                <span>Assess</span>
                                <span>Review/Challenge</span>
                                <span>Approve</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium py-1 border-r border-b border-border text-[10px]">{risk.id}</TableCell>
                          <TableCell className="py-1 border-r border-b border-border">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button 
                                  onClick={() => handleRiskNameClick(risk)}
                                  className="text-left hover:text-primary transition-colors font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-xs"
                                >
                                  {risk.title}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Click to view risk assessment and open challenges/issues.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="py-1 border-r border-b border-border">
                            <Badge variant="outline" className={`text-[10px] ${getRiskLevelColor(risk.riskLevel)}`}>
                              {risk.riskLevel}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-1 border-r border-b border-border">
                            <span className="text-xs">{risk.businessUnit}</span>
                          </TableCell>
                          <TableCell className="py-1 border-r border-b border-border">
                            <span className="text-xs">{risk.assessors.join(", ")}</span>
                          </TableCell>
                          <TableCell className="py-1 border-r border-b border-border">
                            <span className="text-xs">{risk.lastAssessed}</span>
                          </TableCell>
                          <TableCell className="py-1 border-r border-b border-border">
                            <Badge className={`${getRiskBadgeColor(risk.inherentRisk.color)} border px-1.5 text-[10px]`}>
                              {risk.inherentRisk.level}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-1 border-r border-b border-border">
                            <span className="text-xs">{risk.relatedControls[0]?.name || '-'}</span>
                          </TableCell>
                          <TableCell className="py-1 border-r border-b border-border">
                            <Badge className={`${getRiskBadgeColor(risk.controlEffectiveness.color)} border px-1.5 text-[10px]`}>
                              {risk.controlEffectiveness.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-1 border-r border-b border-border">
                            <span className="text-xs">{risk.testResults.label}</span>
                          </TableCell>
                          <TableCell className="py-1 border-r border-b border-border">
                            <Badge className={`${getRiskBadgeColor(risk.residualRisk.color)} border px-1.5 text-[10px]`}>
                              {risk.residualRisk.level}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-1 border-b border-border">
                            <Badge className={`${getStatusColor(risk.status)} shadow-sm text-[10px]`}>
                              {risk.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                  {/* Empty state when no results match */}
                  {filteredRiskData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={14} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <AlertCircle className="w-10 h-10 text-muted-foreground/50" />
                          <div className="text-muted-foreground">
                            No records match the selected filters.
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setBusinessUnitFilter("all");
                              setStatusFilter("all");
                              setRiskHierarchyFilter("all");
                              setSearchQuery("");
                            }}
                          >
                            Clear all filters
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
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
        onOpenChange={handleModalClose}
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
        showTraversal={true}
        currentIndex={currentTraversalIndex}
        totalCount={traversableRisks.length}
        isFirst={isFirstRisk}
        isLast={isLastRisk}
        onNext={goToNextRisk}
        onPrevious={goToPreviousRisk}
        isReviewMode={isReviewMode}
        reviewProgress={isReviewMode ? { current: currentTraversalIndex + 1, total: traversableRisks.length } : null}
      />

      {/* Control Details Dialog */}
      <Dialog open={controlDetailsOpen} onOpenChange={setControlDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {selectedControl?.name}
            </DialogTitle>
            <DialogDescription>
              Control ID: {selectedControl?.id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Description */}
            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <p className="text-sm mt-1">{selectedControl?.description || "No description available."}</p>
            </div>
            
            {/* Control Properties */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Type</Label>
                <p className="text-sm font-medium">{selectedControl?.type}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Nature</Label>
                <p className="text-sm font-medium">{selectedControl?.nature}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Key Control</Label>
                <Badge variant={selectedControl?.keyControl === "Key" ? "default" : "secondary"} className="mt-1">
                  {selectedControl?.keyControl}
                </Badge>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Testing Status</Label>
                <Badge variant={selectedControl?.testingStatus === "Tested" ? "default" : "outline"} className="mt-1">
                  {selectedControl?.testingStatus || "Not Tested"}
                </Badge>
              </div>
            </div>
            
            {/* Control Test Results Section */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">Control Test Results</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Design Effectiveness</Label>
                  <Badge className={`mt-1 ${
                    selectedControl?.designEffectiveness === "Effective" ? "bg-green-500 text-white" :
                    selectedControl?.designEffectiveness === "Partially Effective" ? "bg-amber-500 text-white" :
                    selectedControl?.designEffectiveness === "Ineffective" ? "bg-red-500 text-white" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {selectedControl?.designEffectiveness || "N/A"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Operating Effectiveness</Label>
                  <Badge className={`mt-1 ${
                    selectedControl?.operatingEffectiveness === "Effective" ? "bg-green-500 text-white" :
                    selectedControl?.operatingEffectiveness === "Partially Effective" ? "bg-amber-500 text-white" :
                    selectedControl?.operatingEffectiveness === "Ineffective" ? "bg-red-500 text-white" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {selectedControl?.operatingEffectiveness || "N/A"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Overall Score</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-lg font-bold">{selectedControl?.overallScore || "—"}</span>
                    <span className="text-xs text-muted-foreground">/5</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Test Frequency</Label>
                  <p className="text-sm mt-1">{selectedControl?.testFrequency || "N/A"}</p>
                </div>
              </div>
              {selectedControl?.lastTestDate && (
                <p className="text-xs text-muted-foreground mt-3">
                  Last tested: {selectedControl.lastTestDate}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
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

export default Dashboard2ndLine;
