import { useState, useRef, useMemo, useEffect } from "react";
import { getInitialRiskDataCopy, SharedRiskData } from "@/data/initialRiskData";
import { format } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, AlertTriangle, FileCheck, Clock, TrendingUp, TrendingDown, UserPlus, Users as UsersIcon, RotateCcw, Edit2, LogOut, User, ChevronDown, ChevronRight, DollarSign, Sparkles, Plus, RefreshCw, MoreHorizontal, Link, ClipboardCheck, CheckCircle, CheckSquare, AlertCircle, Lock, ArrowUp, ArrowDown, Mail, X, Building2, ClipboardList, Layers, List, Timer, BarChart3 } from "lucide-react";
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
  
  // Control details dialog state
  const [selectedControl, setSelectedControl] = useState<RiskData["relatedControls"][0] | null>(null);
  const [controlDetailsOpen, setControlDetailsOpen] = useState(false);

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
        stillOverdue++;
        byBusinessUnit[risk.businessUnit].overdue++;
      }
    });
    
    const avgRemediationDays = completedCount > 0 ? Math.round(totalRemediationDays / completedCount) : 0;
    const completionRate = completedCount > 0 ? Math.round((completedOnTime / completedCount) * 100) : 0;
    
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
      title: "RCSA Review/Challenge Process",
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
    {
      title: "Issues Velocity & Efficiency",
      value: velocityMetrics.avgRemediationDays,
      valueSuffix: " days",
      subLabel: "Avg Time to Remediate",
      trend: `${velocityMetrics.completionRate}% on-time completion`,
      trendUp: velocityMetrics.completionRate >= 70,
      icon: Timer,
      segments: [
        { label: "On Time", value: velocityMetrics.completedOnTime || 1, sublabel: `${velocityMetrics.completedOnTime} On Time`, color: "bg-green-600" },
        { label: "Late", value: velocityMetrics.completedLate || 1, sublabel: `${velocityMetrics.completedLate} Late`, color: "bg-amber-500" },
        { label: "Still Overdue", value: velocityMetrics.stillOverdue || 1, sublabel: `${velocityMetrics.stillOverdue} Still Overdue`, color: "bg-red-600" },
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
        { label: "Critical", value: agingMetrics.byCriticality.critical || 1, sublabel: `${agingMetrics.byCriticality.critical} Critical`, color: "bg-red-800" },
        { label: "High", value: agingMetrics.byCriticality.high || 1, sublabel: `${agingMetrics.byCriticality.high} High`, color: "bg-red-500" },
        { label: "Medium", value: agingMetrics.byCriticality.medium || 1, sublabel: `${agingMetrics.byCriticality.medium} Medium`, color: "bg-amber-500" },
        { label: "Low", value: agingMetrics.byCriticality.low || 1, sublabel: `${agingMetrics.byCriticality.low} Low`, color: "bg-green-600" },
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

  const getRiskBadgeColorBg = (color: string) => {
    switch (color) {
      case "red":
        return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-300 dark:border-red-800";
      case "orange":
        return "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-800";
      case "yellow":
        return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800";
      case "cyan":
        return "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-300 dark:border-cyan-800";
      case "green":
        return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-300 dark:border-green-800";
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Quick Links Card */}
          <Card className="lg:col-span-1 border-[3px] border-border/50 dark:border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-card dark:to-card sm:col-span-1">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <Link className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex flex-col gap-y-1.5">
                <button onClick={() => handleQuickLinkClick("assess")} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-xs sm:text-sm w-full text-left min-h-[28px] touch-manipulation">
                  <ClipboardCheck className="w-4 h-4 flex-shrink-0" />
                  <span>View Risks to be Assessed</span>
                </button>
                <button onClick={() => handleQuickLinkClick("approve")} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-xs sm:text-sm w-full text-left min-h-[28px] touch-manipulation">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>View Risks to be Approved</span>
                </button>
                <button onClick={handleOpenChallengesClick} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-xs sm:text-sm w-full text-left min-h-[28px] touch-manipulation">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>View Open Challenges</span>
                </button>
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
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-bold text-foreground">
                      {typeof metric.value === 'string' ? metric.value : `${metric.value}${metric.isPercentage ? "%" : ""}`}
                    </span>
                    {metric.valueSuffix && (
                      <span className="text-sm sm:text-base font-medium text-muted-foreground">{metric.valueSuffix}</span>
                    )}
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

        {/* Risk Coverage by Business Unit Section */}
        <Card ref={reportSectionRef} className="border-[3px] border-border/50 dark:border-border shadow-sm bg-white dark:bg-card">
          <CardHeader className="border-b border-border/50 space-y-0 py-1.5 sm:py-2 px-3 sm:px-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-0">
              <CardTitle className="text-sm sm:text-base font-semibold">Risk Coverage by Business Unit</CardTitle>
                <TooltipProvider>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
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
                        <span className="hidden sm:inline">Review/Challenge</span>
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
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                    } ${highlightedTab === "own" ? "animate-tab-flash animate-tab-pulse ring-2 ring-blue-400 ring-offset-2" : ""}`}
                  >
                    <span className="hidden sm:inline">Completed Assessments</span>
                    <span className="sm:hidden">Completed</span>
                    <span className={`ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                      activeTab === "own" ? "bg-green-800/30" : "bg-green-200 dark:bg-green-800/40"
                    }`}>
                      {riskData.filter(r => r.tabCategory === "own").length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("assess")}
                    className={`px-3 sm:px-4 py-1.5 font-medium text-xs sm:text-sm transition-all border-r-2 border-muted-foreground/30 whitespace-nowrap ${
                      activeTab === "assess"
                        ? "bg-primary text-primary-foreground shadow-md"
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
                        ? "bg-primary text-primary-foreground shadow-md"
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
                <div className="text-[10px] sm:text-xs text-yellow-800 dark:text-yellow-200 leading-snug">
                  <p>
                    {activeTab === "own" && "These assessments have been completed by the users listed under 'Assessors/Collaborators'. Report defaults to group view - grouped by 'Business Unit'. Click on the Business Unit column header to ungroup or re-group anytime. Click on the Risk Title to view details and any open challenge comments."}
                    {activeTab === "assess" && "These risks are pending assessment by the users listed under 'Assessors/Collaborators'. Report defaults to group view - grouped by 'Business Unit'. Click on the Business Unit column header to ungroup or re-group anytime. Click on the Risk Title to begin your assessment and view any open challenge comments."}
                    {activeTab === "approve" && "These risk assessments require approval by the users listed under 'Assessors/Collaborators'. Report defaults to group view - grouped by 'Business Unit'. Click on the Business Unit column header to ungroup or re-group anytime. Click on the Risk Title to review and view any open challenge comments."}
                  </p>
                  <p className="mt-1">
                    <span className="font-medium">Note:</span> Values under 'Control Test Results' are auto-fetched from detailed control test results. These can be overridden in the 'Calculated Control Effectiveness' column.
                  </p>
                </div>
              </div>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 mb-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="business-unit" className="text-xs font-medium text-muted-foreground">
                  Business Unit
                </Label>
                <Select value={businessUnitFilter} onValueChange={setBusinessUnitFilter}>
                  <SelectTrigger id="business-unit" className="w-full sm:w-48 h-9 sm:h-8 bg-primary text-primary-foreground border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Business Units</SelectItem>
                    {Array.from(new Set(riskData.map(r => r.businessUnit))).sort().map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="status-filter" className="text-xs font-medium text-muted-foreground">
                  Status
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter" className="w-full sm:w-36 h-9 sm:h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-50">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="sent-for-assessment">Sent for Assessment</SelectItem>
                    <SelectItem value="review-challenge">Review/Challenge</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="risk-hierarchy-filter" className="text-xs font-medium text-muted-foreground">
                  Risk Hierarchy
                </Label>
                <Select value={riskHierarchyFilter} onValueChange={setRiskHierarchyFilter}>
                  <SelectTrigger id="risk-hierarchy-filter" className="w-full sm:w-32 h-9 sm:h-8">
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

              <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
                <Input 
                  placeholder="Search risks..." 
                  className="pl-10 h-9 sm:h-8 w-full" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
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
                      <span className="text-xs sm:text-sm">Assess Selected Risks</span>
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
                      <TableHead className="w-10 py-1.5 border-r border-b border-border">
                        <div className="flex items-center justify-center">
                          <Checkbox 
                            checked={selectableRisks.length > 0 && selectedRisks.size === selectableRisks.length}
                            onCheckedChange={toggleSelectAll}
                            disabled={selectableRisks.length === 0}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[100px] py-1.5 border-r border-b border-border text-xs">Revise Assessment</TableHead>
                      <TableHead className="min-w-[240px] py-1.5 border-r border-b border-border text-xs">Risk ID / Title</TableHead>
                      <TableHead className="min-w-[80px] py-1.5 border-r border-b border-border text-xs">Risk Hierarchy</TableHead>
                      <TableHead className="min-w-[90px] py-1.5 border-r border-b border-border text-xs">Due Date</TableHead>
                      <TableHead className="min-w-[100px] py-1.5 border-r border-b border-border text-xs">Completion Date</TableHead>
                      <TableHead className="min-w-[180px] py-1.5 border-r border-b border-border text-xs">Assessment Progress</TableHead>
                      <TableHead className="min-w-[120px] py-1.5 border-r border-b border-border text-xs">
                        <div className="flex items-center gap-1">
                          <span>Business Unit</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => setIsGroupedByBusinessUnit(!isGroupedByBusinessUnit)}
                                className={`p-0.5 rounded hover:bg-muted transition-colors ${isGroupedByBusinessUnit ? 'bg-primary/10' : ''}`}
                              >
                                {isGroupedByBusinessUnit ? (
                                  <Layers className="w-3.5 h-3.5 text-primary" />
                                ) : (
                                  <List className="w-3.5 h-3.5 text-muted-foreground" />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{isGroupedByBusinessUnit ? "Click to ungroup" : "Click to group by Business Unit"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[150px] py-1.5 border-r border-b border-border text-xs">Assessors/Collaborators</TableHead>
                      <TableHead className="min-w-[140px] py-1.5 border-r border-b border-border text-xs">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted decoration-muted-foreground underline-offset-2">
                              Inherent Rating
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs p-3 text-xs">
                            <div className="space-y-2">
                              <p className="font-semibold">Inherent Rating</p>
                              <p>The level of risk before considering the effectiveness of any controls. Calculated as:</p>
                              <p className="font-mono bg-muted px-2 py-1 rounded text-[10px]">Likelihood × Impact = Inherent Score</p>
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
                      <TableHead className="min-w-[150px] py-1.5 border-r border-b border-border text-xs">Related Controls</TableHead>
                      <TableHead className="min-w-[180px] py-1.5 border-r border-b border-border text-xs">Calculated Control Effectiveness</TableHead>
                      <TableHead className="min-w-[150px] py-1.5 border-r border-b border-border text-xs">Control Test Results</TableHead>
                      <TableHead className="min-w-[140px] py-1.5 border-r border-b border-border text-xs">Residual Risk</TableHead>
                      <TableHead className="min-w-[120px] py-1.5 border-b border-border text-xs">Status</TableHead>
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
                              <TableCell colSpan={14} className="py-3 border-b border-border">
                                <div className="flex items-center flex-wrap gap-4">
                                  {/* Business Unit info */}
                                  <div className="flex items-center gap-3">
                                    <Building2 className="w-5 h-5 text-primary" />
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Grouped by: Business Unit</span>
                                    <span className="font-bold text-base">{group.businessUnit}</span>
                                    <Badge variant="secondary" className="text-xs font-medium">{group.count} risks</Badge>
                                  </div>
                                  
                                  {/* Aggregated metrics cards - inline after BU info */}
                                  {aggregation && (
                                    <>
                                      <div className="h-6 w-px bg-border" />
                                      <div className="flex items-center gap-2 flex-wrap">
                                      {/* Inherent Rating Card */}
                                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/80 border border-border shadow-sm">
                                        <div className="flex flex-col">
                                          <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wide">Inherent Rating</span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-foreground">{aggregation.avgInherentRisk.score.toFixed(1)}</span>
                                            <Badge className={`${getRiskBadgeColorBg(aggregation.avgInherentRisk.color)} border rounded-full px-2 text-xs`}>
                                              {aggregation.avgInherentRisk.level}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Control Effectiveness Card */}
                                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/80 border border-border shadow-sm">
                                        <div className="flex flex-col">
                                          <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wide">Control Effectiveness</span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-foreground">{aggregation.avgControlEffectiveness.score.toFixed(1)}</span>
                                            <Badge className={`${getRiskBadgeColorBg(aggregation.avgControlEffectiveness.color)} border rounded-full px-2 text-xs`}>
                                              {aggregation.avgControlEffectiveness.level}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Residual Rating Card */}
                                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/80 border border-border shadow-sm">
                                        <div className="flex flex-col">
                                          <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wide">Residual Rating</span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-foreground">{aggregation.avgResidualRisk.score.toFixed(1)}</span>
                                            <Badge className={`${getRiskBadgeColorBg(aggregation.avgResidualRisk.color)} border rounded-full px-2 text-xs`}>
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
                        <TableCell className="py-1 border-r border-b border-border">
                          <div className="flex items-center justify-center">
                            <Checkbox 
                              checked={selectedRisks.has(risk.id)}
                              onCheckedChange={() => toggleRiskSelection(risk.id)}
                              disabled={isRiskCompleted(risk)}
                              className={isRiskCompleted(risk) ? "opacity-50 cursor-not-allowed" : ""}
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
                                    <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
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
                        <TableCell className="py-1 border-r border-b border-border">
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
                                <span className="text-xs font-medium text-primary">{risk.id}</span>
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
                                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400">{l2Risk.id}</span>
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
                        {/* Risk Hierarchy */}
                        <TableCell className="py-1 border-r border-b border-border">
                          <div className="flex flex-col gap-0.5">
                            <Badge className={`${getRiskLevelColor(risk.riskLevel)} border text-[10px] font-medium`}>
                              {risk.riskLevel}
                            </Badge>
                            {isLevel1 && getLevel2Children(risk).map((l2Risk) => (
                              <Badge key={l2Risk.id} className={`${getRiskLevelColor(l2Risk.riskLevel)} border text-[10px] font-medium`}>
                                {l2Risk.riskLevel}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        {/* Due Date */}
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
                        {/* Completion Date - Only show if status is complete */}
                        <TableCell className="py-1 border-r border-b border-border">
                          <div className="text-xs font-medium text-foreground">
                            {risk.status.toLowerCase() === "complete" ? risk.lastAssessed : "-"}
                          </div>
                        </TableCell>
                        {/* Assessment Progress */}
                        <TableCell className="py-1 border-r border-b border-border">
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
                        {/* Business Unit */}
                        <TableCell className="py-1 border-r border-b border-border">
                          <Badge variant="outline" className="text-[10px] font-medium bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700">
                            {risk.businessUnit}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-1 border-r border-b border-border">
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
                                <TooltipContent className="max-w-xs p-3">
                                  <div className="space-y-2.5">
                                    <div className="font-semibold text-sm border-b border-border pb-2">{assessor}</div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                                      <span>{assessorEmails[assessor] || `${assessor.toLowerCase().replace(' ', '.')}@company.com`}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                                      <span className="font-medium">{assessorDepartments[assessor] || "Risk Management"}</span>
                                    </div>
                                    <div className="pt-2 border-t border-border">
                                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                                        <ClipboardList className="w-3.5 h-3.5" />
                                        <span>Sections Worked On:</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {(assessorSections[idx] || ["Assess"]).map((section, sIdx) => (
                                          <Badge 
                                            key={sIdx} 
                                            variant="outline" 
                                            className={`text-xs ${
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
                        <TableCell className="py-1 border-r border-b border-border">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <Badge className={`${getRiskBadgeColor(risk.inherentRisk.color)} border rounded-full px-1.5 text-[10px]`}>
                                {risk.inherentRisk.level}
                              </Badge>
                              {risk.inherentTrend.up ? (
                                <TrendingUp className="w-3 h-3 text-red-600" />
                              ) : (
                                <TrendingDown className="w-3 h-3 text-green-600" />
                              )}
                              <span className={`text-[10px] font-medium ${risk.inherentTrend.up ? "text-red-600" : "text-green-600"}`}>
                                {risk.inherentTrend.value}
                              </span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-4 w-4"
                                      onClick={() => handleEdit("inherent", risk.id, risk.inherentRisk.level)}
                                    >
                                      <Edit2 className="w-2.5 h-2.5 text-muted-foreground hover:text-primary cursor-pointer" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit Inherent Risk</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <button className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline text-left">
                              View Previous
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="py-1 border-r border-b border-border min-w-[280px]">
                          <div className="text-xs max-h-24 overflow-y-auto">
                            <table className="w-full text-left table-fixed">
                              <thead>
                                <tr className="text-[10px] text-muted-foreground border-b border-border/50">
                                  <th className="pb-1 pr-1 font-medium w-[55px]">ID</th>
                                  <th className="pb-1 pr-1 font-medium w-[130px]">Name</th>
                                  <th className="pb-1 pr-1 font-medium w-[60px]">Key</th>
                                  <th className="pb-1 font-medium w-[55px]">Nature</th>
                                </tr>
                              </thead>
                              <tbody>
                                {risk.relatedControls.slice(0, 3).map((control, idx) => (
                                  <tr key={idx} className="border-b border-border/30 last:border-0">
                                    <td className="py-0.5 pr-1 text-primary font-medium overflow-hidden text-ellipsis whitespace-nowrap text-[10px]">{control.id.replace("Control-", "C-")}</td>
                                    <td className="py-0.5 pr-1 overflow-hidden text-ellipsis whitespace-nowrap">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button
                                              className="text-muted-foreground hover:text-primary hover:underline text-left truncate max-w-[120px] block text-[10px]"
                                              onClick={() => {
                                                setSelectedControl(control);
                                                setControlDetailsOpen(true);
                                              }}
                                            >
                                              {control.name}
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="top" className="max-w-[250px]">
                                            <p className="font-medium text-xs">{control.name}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </td>
                                    <td className="py-0.5 pr-1 overflow-hidden text-ellipsis whitespace-nowrap text-[10px]">{control.keyControl}</td>
                                    <td className="py-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-[10px]">{control.nature}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {risk.relatedControls.length > 3 && (
                              <div className="text-muted-foreground text-[10px] pt-1">
                                +{risk.relatedControls.length - 3} more
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-1 border-r border-b border-border">
                          <div className="flex items-center gap-1.5">
                            {getEffectivenessBadge(risk.controlEffectiveness.label, risk.controlEffectiveness.color)}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4"
                                    onClick={() => handleEdit("effectiveness", risk.id, risk.controlEffectiveness.label)}
                                  >
                                    <Edit2 className="w-2.5 h-2.5 text-muted-foreground hover:text-primary cursor-pointer" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit Control Effectiveness</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                        <TableCell className="py-1 border-r border-b border-border">
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap gap-0.5">
                              <Badge className="bg-green-500 text-white rounded-full px-2 py-0.5 text-[10px]">
                                {risk.testResults.label}
                              </Badge>
                              {risk.testResults.sublabel && (
                                <Badge className="bg-blue-500 text-white rounded-full px-2 py-0.5 text-[10px]">
                                  {risk.testResults.sublabel}
                                </Badge>
                              )}
                            </div>
                            <button className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline">
                              View Previous
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="py-1 border-r border-b border-border">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <Badge className={`${getRiskBadgeColor(risk.residualRisk.color)} border rounded-full px-1.5 text-[10px]`}>
                                {risk.residualRisk.level}
                              </Badge>
                              {risk.residualTrend.up ? (
                                <TrendingUp className="w-3 h-3 text-red-600" />
                              ) : (
                                <TrendingDown className="w-3 h-3 text-green-600" />
                              )}
                              <span className={`text-[10px] font-medium ${risk.residualTrend.up ? "text-red-600" : "text-green-600"}`}>
                                {risk.residualTrend.value}
                              </span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-4 w-4"
                                      onClick={() => handleEdit("residual", risk.id, risk.residualRisk.level)}
                                    >
                                      <Edit2 className="w-2.5 h-2.5 text-muted-foreground hover:text-primary cursor-pointer" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit Residual Risk</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <button className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline text-left">
                              View Previous
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="py-1 border-b border-border">
                          <Badge className={`${getStatusColor(risk.status)} rounded-full shadow-sm text-[10px]`}>
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
                          </TableCell>
                          <TableCell className="py-2 border-r border-b border-border">
                            <Badge variant="outline" className={`text-xs ${getRiskLevelColor(risk.riskLevel)}`}>
                              {risk.riskLevel}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2 border-r border-b border-border">
                            <span className="text-sm">{risk.businessUnit}</span>
                          </TableCell>
                          <TableCell className="py-2 border-r border-b border-border">
                            <span className="text-sm">{risk.assessors.join(", ")}</span>
                          </TableCell>
                          <TableCell className="py-2 border-r border-b border-border">
                            <span className="text-sm">{risk.lastAssessed}</span>
                          </TableCell>
                          <TableCell className="py-2 border-r border-b border-border">
                            <Badge className={`${getRiskBadgeColor(risk.inherentRisk.color)} border rounded-full px-2 text-xs`}>
                              {risk.inherentRisk.level}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2 border-r border-b border-border">
                            <span className="text-sm">{risk.relatedControls[0]?.name || '-'}</span>
                          </TableCell>
                          <TableCell className="py-2 border-r border-b border-border">
                            <Badge className={`${getRiskBadgeColor(risk.controlEffectiveness.color)} border rounded-full px-2 text-xs`}>
                              {risk.controlEffectiveness.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2 border-r border-b border-border">
                            <span className="text-sm">{risk.testResults.label}</span>
                          </TableCell>
                          <TableCell className="py-2 border-r border-b border-border">
                            <Badge className={`${getRiskBadgeColor(risk.residualRisk.color)} border rounded-full px-2 text-xs`}>
                              {risk.residualRisk.level}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2 border-b border-border">
                            <Badge className={`${getStatusColor(risk.status)} rounded-full shadow-sm`}>
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

export default Dashboard2ndLine;
