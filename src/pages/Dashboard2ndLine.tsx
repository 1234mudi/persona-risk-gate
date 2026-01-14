import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, Tooltip as RechartsTooltip, Legend, PieChart, Pie, LabelList } from "recharts";
import { getInitialRiskDataCopy, SharedRiskData, HistoricalAssessment } from "@/data/initialRiskData";
import { format } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, AlertTriangle, FileCheck, Clock, TrendingUp, TrendingDown, UserPlus, Users as UsersIcon, RotateCcw, Edit2, LogOut, User, ChevronDown, ChevronRight, DollarSign, Sparkles, Plus, RefreshCw, MoreHorizontal, Link, ClipboardCheck, CheckCircle, CheckSquare, AlertCircle, Lock, ArrowUp, ArrowDown, Mail, X, Building2, ClipboardList, Layers, List, Timer, BarChart3, Eye, Search, Filter, Menu, Grid3x3, ArrowLeft, Download, FileText, Presentation, Loader2 } from "lucide-react";
import { generateDashboardDocx, generateDashboardPptx, downloadBlob } from "@/lib/generateDashboardExport";
import { supabase } from "@/integrations/supabase/client";
import { BulkAssessmentModal } from "@/components/BulkAssessmentModal";
import { ChallengeHeatmap } from "@/components/ChallengeHeatmap";
import { OrganizationHeatmap } from "@/components/OrganizationHeatmap";
import { RiskAssessmentOverviewModal } from "@/components/RiskAssessmentOverviewModal";
import { PreviousAssessmentFloater } from "@/components/PreviousAssessmentFloater";
import { RiskAssessmentTaskModal } from "@/components/RiskAssessmentTaskModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import ManageCollaboratorsModal from "@/components/ManageCollaboratorsModal";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

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
  hasActionPlan?: boolean;
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
  const [riskAssessmentTaskOpen, setRiskAssessmentTaskOpen] = useState(false);
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
  
  // Global time period filter state
  const [timePeriodFilter, setTimePeriodFilter] = useState<string>("all-time");
  const [customDateRange, setCustomDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  
  // Global business unit filter state
  const [globalBusinessUnitFilter, setGlobalBusinessUnitFilter] = useState<string>("all");
  
  // Chart view toggle states
  const [openAssessmentsView, setOpenAssessmentsView] = useState<'org' | 'aggregate'>('org');
  const [risksAppetiteView, setRisksAppetiteView] = useState<'org' | 'aggregate'>('org');

  const timePeriodOptions = [
    { value: "all-time", label: "All Time" },
    { value: "this-month", label: "This Month" },
    { value: "last-month", label: "Last Month" },
    { value: "this-quarter", label: "This Quarter" },
    { value: "last-quarter", label: "Last Quarter" },
    { value: "this-year", label: "This Year" },
    { value: "last-year", label: "Last Year" },
    { value: "custom", label: "Custom Range..." },
  ];

  const businessUnitOptions = [
    { value: "all", label: "All Business Units" },
    { value: "Retail Banking", label: "Retail Banking" },
    { value: "Corporate Banking", label: "Corporate Banking" },
    { value: "Treasury", label: "Treasury" },
    { value: "Operations", label: "Operations" },
    { value: "Risk Analytics", label: "Risk Analytics" },
  ];

  // Helper to check if a date falls within the selected time period
  const isWithinTimePeriod = useCallback((dateString: string): boolean => {
    if (timePeriodFilter === "all-time") return true;
    
    const date = new Date(dateString);
    const now = new Date();
    
    switch (timePeriodFilter) {
      case "this-month":
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      case "last-month": {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
      }
      case "this-quarter": {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const dateQuarter = Math.floor(date.getMonth() / 3);
        return dateQuarter === currentQuarter && date.getFullYear() === now.getFullYear();
      }
      case "last-quarter": {
        let lqQuarter = Math.floor(now.getMonth() / 3) - 1;
        let lqYear = now.getFullYear();
        if (lqQuarter < 0) { lqQuarter = 3; lqYear--; }
        const dateQ = Math.floor(date.getMonth() / 3);
        return dateQ === lqQuarter && date.getFullYear() === lqYear;
      }
      case "this-year":
        return date.getFullYear() === now.getFullYear();
      case "last-year":
        return date.getFullYear() === now.getFullYear() - 1;
      case "custom":
        if (!customDateRange.start || !customDateRange.end) return true;
        return date >= customDateRange.start && date <= customDateRange.end;
      default:
        return true;
    }
  }, [timePeriodFilter, customDateRange]);

  
  // Risk traversal state for review mode
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewRiskIds, setReviewRiskIds] = useState<string[]>([]);
  
  // Control details dialog state
  const [selectedControl, setSelectedControl] = useState<RiskData["relatedControls"][0] | null>(null);
  const [controlDetailsOpen, setControlDetailsOpen] = useState(false);

  // Risk Coverage Report modal state
  const [riskCoverageModalOpen, setRiskCoverageModalOpen] = useState(false);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

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
    type: "reassign" | "reassess" | null;
    riskId: string | null;
  }>({
    open: false,
    type: null,
    riskId: null,
  });

  // Separate state for collaborators modal
  const [collaboratorsModalOpen, setCollaboratorsModalOpen] = useState(false);
  const [collaboratorsRiskId, setCollaboratorsRiskId] = useState<string | null>(null);
  const [riskData, setRiskData] = useState<RiskData[]>(() => getInitialRiskDataCopy() as RiskData[]);

  // Time-period and business unit filtered base dataset for metrics
  const timeFilteredRiskData = useMemo(() => {
    let filtered = riskData;
    
    // Apply time period filter
    if (timePeriodFilter !== "all-time") {
      filtered = filtered.filter(risk => {
        const matchesDueDate = isWithinTimePeriod(risk.dueDate);
        const matchesLastAssessed = isWithinTimePeriod(risk.lastAssessed);
        return matchesDueDate || matchesLastAssessed;
      });
    }
    
    // Apply global business unit filter
    if (globalBusinessUnitFilter !== "all") {
      filtered = filtered.filter(risk => risk.businessUnit === globalBusinessUnitFilter);
    }
    
    return filtered;
  }, [riskData, timePeriodFilter, isWithinTimePeriod, globalBusinessUnitFilter]);

  // Selection helpers
  const visibleRisks = useMemo(() => {
    const visible: RiskData[] = [];
    const filtered = timeFilteredRiskData.filter(risk => risk.tabCategory === activeTab);
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
  }, [timeFilteredRiskData, activeTab, expandedRows]);

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

  // Export handler function
  const handleExport = async (exportFormat: 'docx' | 'pptx') => {
    setIsExporting(true);
    try {
      // Prepare dashboard data for AI narrative generation
      const dashboardData = {
        metrics: metrics.map(m => ({
          title: m.title,
          value: m.value,
          trend: m.trend,
          segments: m.segments,
        })),
        filters: {
          businessUnit: globalBusinessUnitFilter === 'all' ? 'All Business Units' : globalBusinessUnitFilter,
          timePeriod: timePeriodOptions.find(o => o.value === timePeriodFilter)?.label || 'All Time',
        },
        riskAppetiteData,
        velocityMetrics,
        agingMetrics,
        workflowStatusCounts,
        heatmaps: {
          organizationHeatmap: "Residual Risk Distribution by Business Unit",
          controlScopingVariance: "N/A Controls % by Business Unit vs Enterprise Average",
        }
      };

      // Call edge function to generate AI narratives
      const response = await supabase.functions.invoke('generate-dashboard-narrative', {
        body: { dashboardData },
      });

      if (response.error) {
        console.error('Edge function error:', response.error);
        throw new Error(response.error.message || 'Failed to generate narratives');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to generate narratives');
      }

      // Prepare organization heatmap data for export
      const orgHeatmapData = {
        businessUnits: [
          { name: "Retail Banking", critical: 2, high: 5, medium: 8, low: 3, total: 18, trends: { critical: 0, high: 1, medium: -2, low: 1 } },
          { name: "Corporate Banking", critical: 1, high: 4, medium: 6, low: 4, total: 15, trends: { critical: 1, high: 0, medium: -1, low: 0 } },
          { name: "Treasury", critical: 0, high: 3, medium: 5, low: 5, total: 13, trends: { critical: 0, high: -1, medium: 1, low: -1 } },
          { name: "Operations", critical: 3, high: 6, medium: 7, low: 2, total: 18, trends: { critical: 1, high: 2, medium: 0, low: -1 } },
          { name: "Risk Analytics", critical: 1, high: 2, medium: 4, low: 6, total: 13, trends: { critical: -1, high: 0, medium: -1, low: 2 } },
        ],
        totals: { critical: 7, high: 20, medium: 30, low: 20, total: 77 },
      };

      const exportData = {
        narratives: response.data.narratives || [],
        executiveSummary: response.data.executiveSummary || 'Dashboard summary not available.',
        metrics: dashboardData.metrics,
        organizationHeatmap: orgHeatmapData,
        exportDate: format(new Date(), 'MMMM d, yyyy'),
        filters: dashboardData.filters,
      };

      // Generate and download file
      if (exportFormat === 'docx') {
        const blob = await generateDashboardDocx(exportData);
        downloadBlob(blob, `Risk-Dashboard-Report-${format(new Date(), 'yyyy-MM-dd')}.docx`);
      } else {
        const blob = await generateDashboardPptx(exportData);
        downloadBlob(blob, `Risk-Dashboard-Report-${format(new Date(), 'yyyy-MM-dd')}.pptx`);
      }

      toast.success(`${exportFormat.toUpperCase()} report generated successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setIsExporting(false);
      setExportModalOpen(false);
    }
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
    const actionName = actionDialog.type === "reassign" ? "Reassignment" : "Reassessment";
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
    
    timeFilteredRiskData.forEach(risk => {
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
  }, [timeFilteredRiskData]);

  // Risk Aging by Source calculations
  const agingMetrics = useMemo(() => {
    const today = new Date();
    const byCriticality = { critical: 0, high: 0, medium: 0, low: 0 };
    const bySource = { 
      'Risk Assessments': 0, 
      'Loss Events': 0, 
      'Control Testing': 0 
    };
    
    const overdueRisks90Plus: { id: string; title: string; daysOverdue: number; level: string }[] = [];
    const byBusinessUnit: Record<string, number> = {};
    const byCategory: Record<string, number> = { Operational: 0, Technology: 0, Compliance: 0, Financial: 0, Strategic: 0 };
    
    const bySourceAndCriticality: Record<string, Record<string, number>> = {
      'Risk Assessments': { critical: 0, high: 0, medium: 0, low: 0 },
      'Loss Events': { critical: 0, high: 0, medium: 0, low: 0 },
      'Control Testing': { critical: 0, high: 0, medium: 0, low: 0 },
    };

    timeFilteredRiskData.forEach(risk => {
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
        
        // Assign to source based on category and track criticality per source
        let source: string;
        if (risk.category === 'Financial') {
          source = 'Loss Events';
          bySource['Loss Events']++;
        } else if (risk.category === 'Technology') {
          source = 'Control Testing';
          bySource['Control Testing']++;
        } else {
          source = 'Risk Assessments';
          bySource['Risk Assessments']++;
        }
        bySourceAndCriticality[source][criticalityKey]++;
        
        // Track 90+ day overdue risks
        if (daysOverdue > 90) {
          overdueRisks90Plus.push({ id: risk.id, title: risk.title, daysOverdue, level });
        }
        
        // Aggregate by business unit
        byBusinessUnit[risk.businessUnit] = (byBusinessUnit[risk.businessUnit] || 0) + 1;
        
        // Aggregate by category
        if (risk.category in byCategory) {
          byCategory[risk.category]++;
        } else {
          byCategory['Operational']++;
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
      bySource,
      bySourceAndCriticality
    };
  }, [timeFilteredRiskData]);

  // Quarterly Loss Events timeline data
  const quarterlyLossData = [
    { quarter: "Q1 '24", total: 2.8, process: 1.1, system: 0.9, external: 0.8 },
    { quarter: "Q2 '24", total: 3.2, process: 1.4, system: 1.0, external: 0.8 },
    { quarter: "Q3 '24", total: 3.8, process: 1.6, system: 1.1, external: 1.1 },
    { quarter: "Q4 '24", total: 4.2, process: 1.8, system: 1.2, external: 1.2 },
  ];

  // Calculate root cause percentages from latest quarter
  const rootCauseBreakdown = useMemo(() => {
    const latestQuarter = quarterlyLossData[quarterlyLossData.length - 1];
    const total = latestQuarter.total;
    return {
      process: Math.round((latestQuarter.process / total) * 100),
      system: Math.round((latestQuarter.system / total) * 100),
      external: Math.round((latestQuarter.external / total) * 100),
    };
  }, []);

  // Risk Appetite calculation - Critical and High are outside appetite
  const riskAppetiteData = useMemo(() => {
    const outsideAppetite = timeFilteredRiskData.filter(r => 
      r.residualRisk.level === "Critical" || r.residualRisk.level === "High"
    );
    const withinAppetite = timeFilteredRiskData.filter(r => 
      r.residualRisk.level === "Medium" || r.residualRisk.level === "Low"
    );
    
    const critical = outsideAppetite.filter(r => r.residualRisk.level === "Critical").length;
    const high = outsideAppetite.filter(r => r.residualRisk.level === "High").length;
    const medium = withinAppetite.filter(r => r.residualRisk.level === "Medium").length;
    const low = withinAppetite.filter(r => r.residualRisk.level === "Low").length;
    
    const total = timeFilteredRiskData.length;
    const outsidePercentage = total > 0 ? Math.round((outsideAppetite.length / total) * 100) : 0;
    const withinPercentage = total > 0 ? Math.round((withinAppetite.length / total) * 100) : 0;
    
    // Action plan coverage for risks outside appetite
    const withActionPlan = outsideAppetite.filter(r => r.hasActionPlan === true).length;
    const actionPlanCoverage = outsideAppetite.length > 0 
      ? Math.round((withActionPlan / outsideAppetite.length) * 100) 
      : 0;
    
    // Donut chart data for all risk levels
    const donutData = [
      { name: "Critical", value: critical, fill: "hsl(var(--destructive))" },
      { name: "High", value: high, fill: "hsl(var(--warning))" },
      { name: "Medium", value: medium, fill: "hsl(var(--accent))" },
      { name: "Low", value: low, fill: "hsl(var(--success))" },
    ].filter(d => d.value > 0);
    
    // Group by business unit for organization breakdown
    const businessUnits = [...new Set(timeFilteredRiskData.map(r => r.businessUnit))];
    const byOrgData = businessUnits.map(bu => {
      const buRisks = timeFilteredRiskData.filter(r => r.businessUnit === bu);
      const criticalCount = buRisks.filter(r => r.residualRisk.level === "Critical").length;
      const highCount = buRisks.filter(r => r.residualRisk.level === "High").length;
      const within = buRisks.filter(r => 
        r.residualRisk.level === "Medium" || r.residualRisk.level === "Low"
      ).length;
      
      return {
        organization: bu,
        critical: criticalCount,
        high: highCount,
        outsideAppetite: criticalCount + highCount,
        withinAppetite: within,
        total: buRisks.length
      };
    });
    
    return {
      total,
      outsideAppetite: outsideAppetite.length,
      withinAppetite: withinAppetite.length,
      outsidePercentage,
      withinPercentage,
      breakdown: { critical, high, medium, low },
      withActionPlan,
      actionPlanCoverage,
      donutData,
      byOrgData,
      chartData: [
        { name: "Outside", value: outsideAppetite.length, fill: "hsl(var(--destructive))" },
        { name: "Within", value: withinAppetite.length, fill: "hsl(var(--success))" }
      ]
    };
  }, [timeFilteredRiskData]);

  const getColorFromClass = (colorClass: string): string => {
    const colorMap: Record<string, string> = {
      'bg-blue-500': 'hsl(217, 91%, 60%)',
      'bg-amber-500': 'hsl(38, 92%, 50%)',
      'bg-purple-500': 'hsl(271, 91%, 65%)',
      'bg-success': 'hsl(var(--success))',
      'bg-error': 'hsl(var(--destructive))',
      'bg-slate-500': 'hsl(215, 16%, 47%)',
      'bg-emerald-500': 'hsl(160, 84%, 39%)',
    };
    return colorMap[colorClass] || 'hsl(var(--primary))';
  };

  // Calculate workflow status counts from filtered data
  const workflowStatusCounts = useMemo(() => {
    const counts = {
      sentForAssessment: 0,
      pendingReview: 0,
      pendingApproval: 0,
      completed: 0,
      overdue: 0,
      reassigned: 0,
    };
    
    timeFilteredRiskData.forEach(risk => {
      const status = risk.status?.toLowerCase() || '';
      
      if (status.includes('sent') || status.includes('assessment')) {
        counts.sentForAssessment++;
      } else if (status.includes('review')) {
        counts.pendingReview++;
      } else if (status.includes('approval')) {
        counts.pendingApproval++;
      } else if (status.includes('completed')) {
        counts.completed++;
      } else if (status.includes('overdue')) {
        counts.overdue++;
      } else if (status.includes('reassigned')) {
        counts.reassigned++;
      }
    });
    
    return counts;
  }, [timeFilteredRiskData]);

  // Open Assessments by Organization for stacked bar chart
  const openAssessmentsByOrg = useMemo(() => {
    const businessUnits = [...new Set(timeFilteredRiskData.map(r => r.businessUnit))];
    
    return businessUnits.map(bu => {
      const buRisks = timeFilteredRiskData.filter(r => r.businessUnit === bu);
      
      return {
        organization: bu,
        sentForAssessment: buRisks.filter(r => {
          const status = r.status?.toLowerCase() || '';
          return status.includes('sent') || status.includes('assessment');
        }).length,
        pendingReview: buRisks.filter(r => r.status?.toLowerCase().includes('review')).length,
        pendingApproval: buRisks.filter(r => r.status?.toLowerCase().includes('approval')).length,
        completed: buRisks.filter(r => r.status?.toLowerCase().includes('completed')).length,
        overdue: buRisks.filter(r => r.status?.toLowerCase().includes('overdue')).length,
        reassigned: buRisks.filter(r => r.status?.toLowerCase().includes('reassigned')).length,
      };
    });
  }, [timeFilteredRiskData]);

  const openAssessmentsTotal = workflowStatusCounts.sentForAssessment + 
    workflowStatusCounts.pendingReview + 
    workflowStatusCounts.pendingApproval + 
    workflowStatusCounts.overdue + 
    workflowStatusCounts.reassigned;

  const metrics = [
    {
      title: "Open Risk Assessments",
      value: openAssessmentsTotal,
      trend: "+12% since last month",
      trendUp: true,
      icon: FileCheck,
      chartType: "workflowStatus" as const,
      segments: [
        { label: "Sent for Assessment", value: workflowStatusCounts.sentForAssessment, color: "#0A84FF" },
        { label: "Pending Review", value: workflowStatusCounts.pendingReview, color: "#FF9F0A" },
        { label: "Pending Approval", value: workflowStatusCounts.pendingApproval, color: "#BF5AF2" },
        { label: "Completed", value: workflowStatusCounts.completed, color: "#34C759" },
        { label: "Overdue", value: workflowStatusCounts.overdue, color: "#FF453A" },
        { label: "Reassigned", value: workflowStatusCounts.reassigned, color: "#64D2FF" },
      ],
      description: "Track assessment workflow stages. Address overdue and pending items promptly.",
      tooltip: "Displays open risk assessments by workflow status. Monitor each stage to ensure timely completion.",
      interpretation: "Bars represent workflow stages. Taller bars indicate bottlenecks. Red (Overdue) needs immediate attention. Compare organizations to identify lagging units.",
    },
    {
      title: "Risks Outside Appetite",
      value: riskAppetiteData.outsideAppetite,
      subLabel: `of ${riskAppetiteData.total} total risks`,
      trend: `${riskAppetiteData.outsidePercentage}% outside tolerance`,
      trendUp: false,
      icon: AlertTriangle,
      chartType: "riskAppetite" as const,
      riskAppetiteData: riskAppetiteData,
      segments: [
        { label: "Outside", value: riskAppetiteData.outsideAppetite, sublabel: `${riskAppetiteData.outsideAppetite} Outside`, color: "bg-error" },
        { label: "Within", value: riskAppetiteData.withinAppetite, sublabel: `${riskAppetiteData.withinAppetite} Within`, color: "bg-success" },
      ],
      description: "Risks exceeding defined tolerance require escalation and additional mitigation.",
      tooltip: "Shows risks outside the organization's defined risk appetite (Critical and High residual risks). Click to view details and remediation priorities.",
      interpretation: "Red bars show risks exceeding tolerance. A high ratio of red to green indicates elevated enterprise risk. Compare organizations to focus remediation efforts.",
    },
    {
      title: "Ongoing Review & Challenge",
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
      interpretation: "Green indicates completed reviews. Yellow shows pending items. Red shows challenged assessments requiring resolution. Higher green percentage means stronger oversight.",
    },
    {
      title: "Operational Loss Events",
      value: "$4.2M",
      subLabel: "Total Financial Loss (Q4)",
      trend: "+50% YoY",
      trendUp: false,
      icon: DollarSign,
      chartType: "lossEventsTimeline",
      quarterlyLossData: quarterlyLossData,
      rootCauseBreakdown: rootCauseBreakdown,
      segments: [
        { label: "Q4 '24", value: 4.2, sublabel: "Q4 '24: $4.2M", color: "bg-error" },
        { label: "Q3 '24", value: 3.8, sublabel: "Q3 '24: $3.8M", color: "bg-warning" },
        { label: "Q2 '24", value: 3.2, sublabel: "Q2 '24: $3.2M", color: "bg-accent" },
      ],
      description: "Quarterly loss trend with root cause breakdown.",
      tooltip: "Shows operational loss trends across quarters with breakdown by root cause category to identify patterns and escalating risks.",
      interpretation: "Line trend shows quarterly loss trajectory. Rising trend indicates worsening losses. Legend breakdown helps identify root causes (Process, System, External).",
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
      interpretation: "Lower avg days is better. Green (On Time) shows discipline. Red (Still Overdue) requires escalation. Compare against SLA targets.",
    },
    {
      title: "Issue Aging by Source",
      value: agingMetrics.totalOverdue,
      subLabel: "Total Aged Issues",
      trend: `${agingMetrics.overdueRisks90Plus.length} overdue 90+ days`,
      trendUp: false,
      icon: BarChart3,
      chartType: "issueAging" as const,
      combinedBarData: [
        { source: "Risk Assessments", ...agingMetrics.bySourceAndCriticality['Risk Assessments'] },
        { source: "Loss Events", ...agingMetrics.bySourceAndCriticality['Loss Events'] },
        { source: "Control Testing", ...agingMetrics.bySourceAndCriticality['Control Testing'] },
      ],
      description: "Aged issues by source, color-coded by criticality. Focus on red segments first.",
      tooltip: "Shows the distribution of aged issues by source (Risk Assessments, Loss Events, Control Testing) with criticality breakdown. Red = Critical, Orange = High.",
      interpretation: "Each bar represents a source. Color segments show criticality. Target red/orange segments first as they represent critical and high priority issues.",
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
      
      // Time period filter (using dueDate as primary date field)
      if (timePeriodFilter !== "all-time" && !isWithinTimePeriod(risk.dueDate)) {
        return false;
      }
      
      return true;
    });
  }, [riskData, activeTab, businessUnitFilter, statusFilter, riskHierarchyFilter, searchQuery, timePeriodFilter, isWithinTimePeriod]);

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
    return <Badge className={`${colorClass} rounded-full text-[10px] px-2 py-0.5`}>{label}</Badge>;
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
              {/* Global Business Unit Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden md:inline">Business Unit:</span>
                <Select 
                  value={globalBusinessUnitFilter} 
                  onValueChange={setGlobalBusinessUnitFilter}
                >
                  <SelectTrigger className="h-7 w-[150px] text-xs rounded-none">
                    <SelectValue placeholder="All Business Units" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {businessUnitOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Global Time Period Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden md:inline">View Data For:</span>
                <Popover open={showCustomDatePicker} onOpenChange={setShowCustomDatePicker}>
                  <PopoverTrigger asChild>
                    <div className="flex items-center">
                      <Select 
                        value={timePeriodFilter} 
                        onValueChange={(value) => {
                          setTimePeriodFilter(value);
                          if (value === "custom") {
                            setShowCustomDatePicker(true);
                          }
                        }}
                      >
                        <SelectTrigger className="h-7 w-[130px] text-xs rounded-none">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {timePeriodOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </PopoverTrigger>
                  {timePeriodFilter === "custom" && (
                    <PopoverContent className="w-auto p-4 bg-popover z-50" align="end">
                      <div className="space-y-3">
                        <div className="flex flex-col gap-2">
                          <Label className="text-xs font-medium">Start Date</Label>
                          <Calendar
                            mode="single"
                            selected={customDateRange.start || undefined}
                            onSelect={(date) => setCustomDateRange(prev => ({ ...prev, start: date || null }))}
                            className="pointer-events-auto border rounded-md"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label className="text-xs font-medium">End Date</Label>
                          <Calendar
                            mode="single"
                            selected={customDateRange.end || undefined}
                            onSelect={(date) => setCustomDateRange(prev => ({ ...prev, end: date || null }))}
                            className="pointer-events-auto border rounded-md"
                          />
                        </div>
                        <Button size="sm" className="w-full rounded-none" onClick={() => setShowCustomDatePicker(false)}>
                          Apply Range
                        </Button>
                      </div>
                    </PopoverContent>
                  )}
                </Popover>
              </div>
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
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-1.5 px-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#10052F] dark:text-white">
              <Link className="w-3 h-3 text-[#10052F] dark:text-white" />
              Quick Links:
            </div>
            <button onClick={() => handleQuickLinkClick("approve")} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs">
              <CheckCircle className="w-3 h-3" />
              <span>Schedule Risk Assessments</span>
            </button>
            <span className="text-gray-400 dark:text-gray-500">|</span>
            <button onClick={() => setRiskAssessmentTaskOpen(true)} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs">
              <AlertTriangle className="w-3 h-3" />
              <span>Assess Now</span>
            </button>
          </div>
          
          {/* Summarize and Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportModalOpen(true)}
            className="h-7 text-xs rounded-none border-primary text-primary hover:bg-primary/10 gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Summarize and Export
          </Button>
        </div>

        {/* Scorecards - 2 columns (50/50) layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 mb-4">
          {/* Left Column - Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[0, 1, 2, 3, 4].map((metricIndex, orderIndex) => {
            const metric = metrics[metricIndex];
            // Grid positions for sm+ screens within nested grid
            const gridPositions = [
              'sm:col-span-2', // metrics[0] - Open Risk Assessments - spans 2 cols
              'sm:col-span-2', // metrics[1] - Risks Outside Appetite - spans 2 cols
              'sm:col-span-2', // metrics[2] - Ongoing Review & Challenge - spans 2 cols
              'sm:col-span-2', // metrics[3] - Operational Loss Events - spans 2 cols
              'sm:col-span-2', // metrics[5] - Issue Aging by Source - full width
            ];
            const segments = metric.segments as Array<{ label: string; value: number; sublabel: string; color: string }>;
            let total = 0;
            for (const s of segments) total += s.value;
            const IconComponent = metric.icon;
            
            return (
              <Tooltip key={metricIndex}>
                <TooltipTrigger asChild>
                  <Card 
                    className={`${gridPositions[orderIndex]} border border-border/50 dark:border-border shadow-sm hover:shadow-md transition-all duration-200 bg-card dark:bg-card cursor-pointer rounded-none`}
                    onClick={() => {
                      if (metricIndex === 0) {
                        setRiskCoverageModalOpen(true);
                      }
                    }}
                  >
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
                      {/* Chart visualization */}
                      {'chartType' in metric && metric.chartType === 'lossEventsTimeline' ? (
                        <div className="space-y-1.5">
                          {/* Toggle between views - same as Open Risk Assessments */}
                          <div className="flex justify-end mb-1">
                            <ToggleGroup 
                              type="single" 
                              value="aggregate" 
                              size="sm"
                              className="h-5"
                            >
                              <ToggleGroupItem value="aggregate" className="text-[7px] px-1.5 h-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                                Quarterly
                              </ToggleGroupItem>
                            </ToggleGroup>
                          </div>
                          {/* Timeline line chart for quarterly loss events - same height as Open Risk Assessments */}
                          <div className="h-20 mb-1">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart 
                                data={(metric as any).quarterlyLossData} 
                                margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                                <XAxis 
                                  dataKey="quarter" 
                                  tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} 
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis 
                                  tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} 
                                  axisLine={false}
                                  tickLine={false}
                                  tickFormatter={(value) => `$${value}M`}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="total" 
                                  stroke="hsl(var(--primary))" 
                                  strokeWidth={2}
                                  dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="process" 
                                  stroke="hsl(var(--warning))" 
                                  strokeWidth={1.5}
                                  dot={{ r: 2, fill: 'hsl(var(--warning))' }}
                                  strokeDasharray="4 2"
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="external" 
                                  stroke="hsl(var(--destructive))" 
                                  strokeWidth={1.5}
                                  dot={{ r: 2, fill: 'hsl(var(--destructive))' }}
                                  strokeDasharray="4 2"
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          {/* Root Cause Analysis Summary - 3 col legend like Open Risk Assessments */}
                          <div className="grid grid-cols-3 gap-x-1 gap-y-0.5 mb-1">
                            <div className="flex items-center gap-0.5">
                              <div className="w-1.5 h-1.5 rounded-sm flex-shrink-0 bg-warning" />
                              <span className="text-[8px] font-medium text-muted-foreground truncate">
                                {(metric as any).rootCauseBreakdown.process}% Process
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <div className="w-1.5 h-1.5 rounded-sm flex-shrink-0 bg-accent" />
                              <span className="text-[8px] font-medium text-muted-foreground truncate">
                                {(metric as any).rootCauseBreakdown.system}% System
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <div className="w-1.5 h-1.5 rounded-sm flex-shrink-0 bg-destructive" />
                              <span className="text-[8px] font-medium text-muted-foreground truncate">
                                {(metric as any).rootCauseBreakdown.external}% External
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : 'chartType' in metric && metric.chartType === 'issueAging' ? (
                        <div className="space-y-1.5">
                          {/* Toggle between views - same as Open Risk Assessments */}
                          <div className="flex justify-end mb-1">
                            <ToggleGroup 
                              type="single" 
                              value="aggregate" 
                              size="sm"
                              className="h-5"
                            >
                              <ToggleGroupItem value="aggregate" className="text-[7px] px-1.5 h-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                                By Source
                              </ToggleGroupItem>
                            </ToggleGroup>
                          </div>
                          {/* Horizontal bar chart for issue aging - same height as Open Risk Assessments */}
                          <div className="h-20 mb-1">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart 
                                data={(metric as any).barData} 
                                layout="vertical"
                                margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
                              >
                                <XAxis type="number" hide />
                                <YAxis 
                                  type="category" 
                                  dataKey="source" 
                                  width={75} 
                                  tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} 
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <RechartsTooltip 
                                  contentStyle={{ 
                                    backgroundColor: 'hsl(var(--card))', 
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '6px',
                                    fontSize: '10px'
                                  }}
                                />
                                <Bar dataKey="count" radius={[0, 3, 3, 0]} maxBarSize={14}>
                                  {(metric as any).barData.map((entry: any, index: number) => (
                                    <Cell 
                                      key={`cell-${index}`} 
                                      fill={index === 0 ? 'hsl(var(--primary))' : index === 1 ? 'hsl(var(--warning))' : 'hsl(var(--accent))'}
                                    />
                                  ))}
                                  <LabelList dataKey="count" position="right" fill="hsl(var(--muted-foreground))" fontSize={8} />
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          {/* Legend - 3 col like Open Risk Assessments */}
                          <div className="grid grid-cols-3 gap-x-1 gap-y-0.5 mb-1">
                            {(metric as any).barData.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-0.5">
                                <div className={`w-1.5 h-1.5 rounded-sm flex-shrink-0 ${idx === 0 ? 'bg-primary' : idx === 1 ? 'bg-warning' : 'bg-accent'}`} />
                                <span className="text-[8px] font-medium text-muted-foreground truncate">
                                  {item.count} {item.source.split(' ')[0]}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : 'chartType' in metric && metric.chartType === 'riskAppetite' ? (
                        <div className="space-y-1.5">
                          {/* Toggle between views */}
                          <div className="flex justify-end mb-1">
                            <ToggleGroup 
                              type="single" 
                              value={risksAppetiteView} 
                              onValueChange={(v) => v && setRisksAppetiteView(v as 'org' | 'aggregate')} 
                              size="sm"
                              className="h-5"
                            >
                              <ToggleGroupItem value="org" className="text-[7px] px-1.5 h-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                                By Org
                              </ToggleGroupItem>
                              <ToggleGroupItem value="aggregate" className="text-[7px] px-1.5 h-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                                Aggregate
                              </ToggleGroupItem>
                            </ToggleGroup>
                          </div>
                          
                          {risksAppetiteView === 'org' ? (
                            <>
                              {/* Horizontal Stacked Bar Chart: Risks by Organization */}
                              <div className="h-32">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart 
                                    data={(metric as any).riskAppetiteData.byOrgData}
                                    layout="vertical"
                                    margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
                                  >
                                    <XAxis 
                                      type="number"
                                      tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                                      axisLine={false}
                                      tickLine={false}
                                    />
                                    <YAxis 
                                      type="category"
                                      dataKey="organization" 
                                      tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                                      axisLine={false}
                                      tickLine={false}
                                      width={85}
                                      interval={0}
                                    />
                                    <RechartsTooltip 
                                      contentStyle={{ 
                                        backgroundColor: 'hsl(var(--card))', 
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '6px',
                                        fontSize: '10px'
                                      }}
                                    />
                                    <Bar dataKey="critical" stackId="a" fill="hsl(var(--destructive))" name="Critical" radius={[0, 0, 0, 0]} maxBarSize={12} />
                                    <Bar dataKey="high" stackId="a" fill="hsl(var(--warning))" name="High" maxBarSize={12} />
                                    <Bar dataKey="withinAppetite" stackId="a" fill="hsl(var(--success))" name="Within Appetite" radius={[0, 3, 3, 0]} maxBarSize={12} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </>
                          ) : (
                            <>
                              {/* Aggregate View: Horizontal stacked bar for risk levels */}
                              <div className="h-20">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart 
                                    data={[{
                                      name: "Risk Levels",
                                      critical: (metric as any).riskAppetiteData.breakdown.critical,
                                      high: (metric as any).riskAppetiteData.breakdown.high,
                                      medium: (metric as any).riskAppetiteData.breakdown.medium,
                                      low: (metric as any).riskAppetiteData.breakdown.low,
                                    }]}
                                    layout="vertical"
                                    margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                                  >
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" hide />
                                    <RechartsTooltip 
                                      contentStyle={{ 
                                        backgroundColor: 'hsl(var(--card))', 
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '6px',
                                        fontSize: '10px'
                                      }}
                                    />
                                    <Bar dataKey="critical" stackId="a" fill="hsl(var(--destructive))" name="Critical" radius={[3, 0, 0, 3]} maxBarSize={24} />
                                    <Bar dataKey="high" stackId="a" fill="hsl(var(--warning))" name="High" maxBarSize={24} />
                                    <Bar dataKey="medium" stackId="a" fill="hsl(var(--accent))" name="Medium" maxBarSize={24} />
                                    <Bar dataKey="low" stackId="a" fill="hsl(var(--success))" name="Low" radius={[0, 3, 3, 0]} maxBarSize={24} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                              
                              {/* Legend grid for levels - 4 columns */}
                              <div className="grid grid-cols-4 gap-x-2 gap-y-1">
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-sm flex-shrink-0 bg-destructive" />
                                  <span className="text-[8px] text-muted-foreground">
                                    Crit: {(metric as any).riskAppetiteData.breakdown.critical}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-sm flex-shrink-0 bg-warning" />
                                  <span className="text-[8px] text-muted-foreground">
                                    High: {(metric as any).riskAppetiteData.breakdown.high}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-sm flex-shrink-0 bg-accent" />
                                  <span className="text-[8px] text-muted-foreground">
                                    Med: {(metric as any).riskAppetiteData.breakdown.medium}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-sm flex-shrink-0 bg-success" />
                                  <span className="text-[8px] text-muted-foreground">
                                    Low: {(metric as any).riskAppetiteData.breakdown.low}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                          
                          {/* Legend and Summary */}
                          <div className="flex items-center justify-between border-t border-border/30 pt-1">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-sm bg-destructive" />
                                <span className="text-[8px] text-muted-foreground">Critical ({(metric as any).riskAppetiteData.breakdown.critical})</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-sm bg-warning" />
                                <span className="text-[8px] text-muted-foreground">High ({(metric as any).riskAppetiteData.breakdown.high})</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-sm bg-success" />
                                <span className="text-[8px] text-muted-foreground">Within ({(metric as any).riskAppetiteData.withinAppetite})</span>
                              </div>
                            </div>
                            <span className="text-[8px] font-medium text-muted-foreground">
                              {(metric as any).riskAppetiteData.actionPlanCoverage}% with plans
                            </span>
                          </div>
                        </div>
                      ) : 'chartType' in metric && metric.chartType === 'bar' ? (
                        <div className="h-14 mb-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                              data={(metric as any).barData} 
                              layout="vertical"
                              margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
                            >
                              <XAxis type="number" hide />
                              <YAxis 
                                type="category" 
                                dataKey="source" 
                                width={75} 
                                tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} 
                                axisLine={false}
                                tickLine={false}
                              />
                              <Bar dataKey="count" radius={[0, 3, 3, 0]} maxBarSize={12}>
                                {(metric as any).barData.map((entry: any, index: number) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={index === 0 ? 'hsl(var(--primary))' : index === 1 ? 'hsl(var(--warning))' : 'hsl(var(--accent))'}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (metric as any).chartType === 'workflowStatus' ? (
                        <>
                          {/* Toggle between views */}
                          <div className="flex justify-end mb-1">
                            <ToggleGroup 
                              type="single" 
                              value={openAssessmentsView} 
                              onValueChange={(v) => v && setOpenAssessmentsView(v as 'org' | 'aggregate')} 
                              size="sm"
                              className="h-5"
                            >
                              <ToggleGroupItem value="org" className="text-[7px] px-1.5 h-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                                By Org
                              </ToggleGroupItem>
                              <ToggleGroupItem value="aggregate" className="text-[7px] px-1.5 h-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                                Aggregate
                              </ToggleGroupItem>
                            </ToggleGroup>
                          </div>
                          
                          {openAssessmentsView === 'org' ? (
                            <>
                              {/* Stacked bar chart for workflow status by organization */}
                              <div className="h-28 mb-1">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart 
                                    data={openAssessmentsByOrg}
                                    margin={{ top: 4, right: 4, bottom: 16, left: 4 }}
                                  >
                                    <XAxis 
                                      dataKey="organization" 
                                      tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                                      axisLine={{ stroke: 'hsl(var(--border))' }}
                                      tickLine={{ stroke: 'hsl(var(--border))' }}
                                      interval={0}
                                    />
                                    <YAxis 
                                      tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                                      axisLine={false}
                                      tickLine={false}
                                      width={20}
                                    />
                                    <RechartsTooltip 
                                      contentStyle={{ 
                                        backgroundColor: 'hsl(var(--card))', 
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '6px',
                                        fontSize: '10px'
                                      }}
                                    />
                                    <Bar dataKey="sentForAssessment" stackId="a" fill="#0A84FF" name="Sent" stroke="hsl(var(--card))" strokeWidth={1} radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="pendingReview" stackId="a" fill="#FF9F0A" name="Review" stroke="hsl(var(--card))" strokeWidth={1} />
                                    <Bar dataKey="pendingApproval" stackId="a" fill="#BF5AF2" name="Approval" stroke="hsl(var(--card))" strokeWidth={1} />
                                    <Bar dataKey="completed" stackId="a" fill="#34C759" name="Completed" stroke="hsl(var(--card))" strokeWidth={1} />
                                    <Bar dataKey="overdue" stackId="a" fill="#FF453A" name="Overdue" stroke="hsl(var(--card))" strokeWidth={1} />
                                    <Bar dataKey="reassigned" stackId="a" fill="#64D2FF" name="Reassigned" stroke="hsl(var(--card))" strokeWidth={1} radius={[2, 2, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </>
                          ) : (
                            <>
                              {/* Aggregate View: Horizontal bar chart by status */}
                              <div className="h-28 mb-1">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart 
                                    data={[
                                      { status: "Sent", value: workflowStatusCounts.sentForAssessment, fill: "#0A84FF" },
                                      { status: "Review", value: workflowStatusCounts.pendingReview, fill: "#FF9F0A" },
                                      { status: "Approval", value: workflowStatusCounts.pendingApproval, fill: "#BF5AF2" },
                                      { status: "Completed", value: workflowStatusCounts.completed, fill: "#34C759" },
                                      { status: "Overdue", value: workflowStatusCounts.overdue, fill: "#FF453A" },
                                      { status: "Reassigned", value: workflowStatusCounts.reassigned, fill: "#64D2FF" },
                                    ]}
                                    layout="vertical"
                                    margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
                                  >
                                    <XAxis type="number" hide />
                                    <YAxis 
                                      type="category" 
                                      dataKey="status" 
                                      width={50} 
                                      tick={{ fontSize: 7, fill: 'hsl(var(--muted-foreground))' }} 
                                      axisLine={false}
                                      tickLine={false}
                                    />
                                    <RechartsTooltip 
                                      contentStyle={{ 
                                        backgroundColor: 'hsl(var(--card))', 
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '6px',
                                        fontSize: '10px'
                                      }}
                                    />
                                    <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={10}>
                                      {[
                                        { status: "Sent", value: workflowStatusCounts.sentForAssessment, fill: "#0A84FF" },
                                        { status: "Review", value: workflowStatusCounts.pendingReview, fill: "#FF9F0A" },
                                        { status: "Approval", value: workflowStatusCounts.pendingApproval, fill: "#BF5AF2" },
                                        { status: "Completed", value: workflowStatusCounts.completed, fill: "#34C759" },
                                        { status: "Overdue", value: workflowStatusCounts.overdue, fill: "#FF453A" },
                                        { status: "Reassigned", value: workflowStatusCounts.reassigned, fill: "#64D2FF" },
                                      ].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </>
                          )}
                          
                          {/* 6-segment legend in 3 columns */}
                          <div className="grid grid-cols-3 gap-x-1 gap-y-0.5 mb-1">
                            {segments.map((segment, idx) => (
                              <div key={idx} className="flex items-center gap-0.5">
                                <div className="w-1.5 h-1.5 rounded-sm flex-shrink-0" style={{ backgroundColor: segment.color }} />
                                <span className="text-[8px] font-medium text-muted-foreground truncate">
                                  {segment.value} {segment.label.split(' ')[0]}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                      <p className="text-[10px] text-muted-foreground leading-tight">{metric.description}</p>
                      {'interpretation' in metric && metric.interpretation && (
                        <p className="text-[8px] text-muted-foreground/70 italic mt-1 border-t border-border/20 pt-1">
                          How to read: {(metric as { interpretation: string }).interpretation}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-sm">{metric.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
          </div>
          
          {/* Right Column - Issues Velocity + Heatmaps stacked */}
          <div className="flex flex-col gap-2">
            {/* Issue Aging by Source - moved from left column */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="border border-border/50 dark:border-border shadow-sm hover:shadow-md transition-all duration-200 bg-card dark:bg-card cursor-pointer rounded-none">
                  <CardContent className="p-2.5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded bg-primary/10 dark:bg-primary/20">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-[10px] font-bold uppercase tracking-wide text-[#10052F] dark:text-white leading-tight">
                            {metrics[5].title}
                          </h3>
                          <span className="text-[8px] text-muted-foreground">{metrics[5].subLabel}</span>
                        </div>
                      </div>
                      <Badge variant={metrics[5].trendUp ? "default" : "destructive"} className="text-[7px] px-1 py-0 h-3.5 rounded-none">
                        {metrics[5].trend}
                      </Badge>
                    </div>
                    {/* Big Number */}
                    <div className="mb-2">
                      <span className="text-2xl font-bold text-[#10052F] dark:text-white leading-none">
                        {metrics[5].value}
                      </span>
                      {metrics[5].valueSuffix && (
                        <span className="text-lg text-muted-foreground ml-0.5">{metrics[5].valueSuffix}</span>
                      )}
                    </div>
                    {/* Combined Horizontal Bar Chart: Source x Criticality */}
                    <div className="h-24 mb-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={(metrics[5] as any).combinedBarData}
                          layout="vertical"
                          margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
                        >
                          <XAxis 
                            type="number"
                            tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis 
                            type="category"
                            dataKey="source" 
                            tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                            width={85}
                          />
                          <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px',
                              fontSize: '10px'
                            }}
                          />
                          <Bar dataKey="critical" stackId="a" fill="hsl(var(--destructive))" name="Critical" maxBarSize={12} />
                          <Bar dataKey="high" stackId="a" fill="hsl(var(--warning))" name="High" maxBarSize={12} />
                          <Bar dataKey="medium" stackId="a" fill="hsl(var(--accent))" name="Medium" maxBarSize={12} />
                          <Bar dataKey="low" stackId="a" fill="hsl(var(--success))" name="Low" radius={[0, 3, 3, 0]} maxBarSize={12} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Single Criticality Legend */}
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 mb-1">
                      <div className="flex items-center gap-0.5">
                        <div className="w-1.5 h-1.5 rounded-sm bg-destructive" />
                        <span className="text-[9px] text-muted-foreground">Critical</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <div className="w-1.5 h-1.5 rounded-sm bg-warning" />
                        <span className="text-[9px] text-muted-foreground">High</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <div className="w-1.5 h-1.5 rounded-sm bg-accent" />
                        <span className="text-[9px] text-muted-foreground">Medium</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <div className="w-1.5 h-1.5 rounded-sm bg-success" />
                        <span className="text-[9px] text-muted-foreground">Low</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">{metrics[5].description}</p>
                    {'interpretation' in metrics[5] && metrics[5].interpretation && (
                      <p className="text-[8px] text-muted-foreground/70 italic mt-1 border-t border-border/20 pt-1">
                        How to read: {(metrics[5] as { interpretation: string }).interpretation}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-sm">{metrics[5].tooltip}</p>
              </TooltipContent>
            </Tooltip>

            {/* Organization Heat Map */}
            <Card className="border border-border/50 dark:border-border shadow-sm bg-card dark:bg-card rounded-none overflow-hidden">
              <CardHeader className="py-1.5 px-2.5 border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  <CardTitle className="text-[10px] font-bold uppercase tracking-wide text-[#10052F] dark:text-white">
                    Organization Heat Map
                  </CardTitle>
                </div>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  Residual Risk Distribution by Business Unit
                </p>
              </CardHeader>
              <CardContent className="p-2">
                <OrganizationHeatmap riskData={riskData} />
              </CardContent>
            </Card>

            {/* Control Scoping Variance Report */}
            <Card className="border border-border/50 dark:border-border shadow-sm bg-card dark:bg-card rounded-none overflow-hidden">
              <CardHeader className="py-1.5 px-2.5 border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-1.5">
                  <Grid3x3 className="w-3.5 h-3.5 text-primary" />
                  <CardTitle className="text-[10px] font-bold uppercase tracking-wide text-[#10052F] dark:text-white">
                    Control Scoping Variance Report
                  </CardTitle>
                </div>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  N/A Controls % by Business Unit vs Enterprise Average
                </p>
              </CardHeader>
              <CardContent className="p-2">
                <ChallengeHeatmap />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Risk Coverage by Business Unit Modal */}
        <Dialog open={riskCoverageModalOpen} onOpenChange={setRiskCoverageModalOpen}>
          <DialogContent 
            className="max-w-full w-full h-full max-h-full p-0 flex flex-col rounded-none border-0"
            hideCloseButton={true}
          >
            {/* Header with Back Button */}
            <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border/30 bg-muted/30 shrink-0">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setRiskCoverageModalOpen(false)}
                className="gap-1.5 h-7 px-2.5 text-xs border-border"
              >
                <ArrowLeft className="w-3 h-3" />
                Back
              </Button>
              <div className="h-5 w-px bg-border" />
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground tracking-tight">
                  Risk Coverage by Business Unit
                </span>
                <Badge variant="secondary" className="text-xs">
                  {filteredRiskData.length} risks
                </Badge>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-auto">
              <Card className="border-0 shadow-none bg-transparent rounded-none">
                {/* Action Buttons Row */}
            <CardHeader className="border-b border-border/30 space-y-0 py-0 px-0 bg-muted/20">
              <div className="flex items-center justify-end h-10">
                <div className="flex items-center gap-1.5 pr-2">
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
                        onClick={() => {
                          setCollaboratorsRiskId(Array.from(selectedRisks).join(","));
                          setCollaboratorsModalOpen(true);
                        }}
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
          <div className="border-b border-border/30 bg-muted/10 px-3 py-1.5">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab("own")}
                className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wide border transition-all ${
                  activeTab === "own"
                    ? "bg-primary text-white border-primary"
                    : "bg-transparent text-primary border-primary hover:bg-primary/10"
                } ${highlightedTab === "own" ? "animate-tab-flash animate-tab-pulse ring-2 ring-primary/50 ring-offset-2" : ""}`}
              >
                Completed Assessments ({timeFilteredRiskData.filter(r => r.tabCategory === "own").length})
              </button>
              <button
                onClick={() => setActiveTab("assess")}
                className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wide border transition-all ${
                  activeTab === "assess"
                    ? "bg-primary text-white border-primary"
                    : "bg-transparent text-primary border-primary hover:bg-primary/10"
                } ${highlightedTab === "assess" ? "animate-tab-flash animate-tab-pulse ring-2 ring-primary/50 ring-offset-2" : ""}`}
              >
                Risks to be Assessed ({timeFilteredRiskData.filter(r => r.tabCategory === "assess").length})
              </button>
              <button
                onClick={() => setActiveTab("approve")}
                className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wide border transition-all ${
                  activeTab === "approve"
                    ? "bg-primary text-white border-primary"
                    : "bg-transparent text-primary border-primary hover:bg-primary/10"
                } ${highlightedTab === "approve" ? "animate-tab-flash animate-tab-pulse ring-2 ring-primary/50 ring-offset-2" : ""}`}
              >
                Risks to be Approved ({timeFilteredRiskData.filter(r => r.tabCategory === "approve").length})
              </button>
            </div>
          </div>

          {/* Row 3: Info Banner */}
          <div className="bg-indigo-50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-800/50 px-3 py-1.5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-indigo-600 dark:text-indigo-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-800 dark:text-indigo-200 space-y-0.5">
{activeTab === "own" && (
                  <>
                    <p>These assessments have been completed by the users listed under 'Assessors/Collaborators'.</p>
                    <p>Report defaults to group view - grouped by 'Business Unit'. Click on the Business Unit column header to ungroup or re-group anytime.</p>
                    <p>Click on the Risk Title to view details and any open challenge comments.</p>
                    <p className="mt-1 px-2 py-0.5 bg-amber-100/50 dark:bg-amber-900/20 rounded border-l-2 border-amber-500">
                      <span className="font-medium text-amber-700 dark:text-amber-400">
                        💡 Tip: To update or adjust a completed assessment, click the ↻ icon in the 'Update Assessment' column to initiate a new assessment cycle.
                      </span>
                    </p>
                  </>
                )}
                {activeTab === "assess" && (
                  <>
                    <p>These risks are pending assessment by the users listed under 'Assessors/Collaborators'.</p>
                    <p>Report defaults to group view - grouped by 'Business Unit'. Click on the Business Unit column header to ungroup or re-group anytime.</p>
                    <p>Click on the Risk Title to begin your assessment and view any open challenge comments.</p>
                    <p>Click on the 'Update Assessment' for Completed records to initiate updates to a completed assessment.</p>
                  </>
                )}
                {activeTab === "approve" && (
                  <>
                    <p>These risk assessments require approval by the users listed under 'Assessors/Collaborators'.</p>
                    <p>Report defaults to group view - grouped by 'Business Unit'. Click on the Business Unit column header to ungroup or re-group anytime.</p>
                    <p>Click on the Risk Title to review and view any open challenge comments.</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Row 4: Filter Bar */}
          <div className="bg-muted/20 border-b border-border/30 px-3 py-1.5">
            <div className="flex items-center gap-3">
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
                                            <Badge className={`${getRiskBadgeColorBg(aggregation.avgInherentRisk.color)} border text-[10px] px-2 py-0.5 rounded-full`}>
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
                                            <Badge className={`${getRiskBadgeColorBg(aggregation.avgControlEffectiveness.color)} border text-[10px] px-2 py-0.5 rounded-full`}>
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
                                            <Badge className={`${getRiskBadgeColorBg(aggregation.avgResidualRisk.color)} border text-[10px] px-2 py-0.5 rounded-full`}>
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
                            {group.risks.flatMap((risk) => {
                              // Only process Level 1 risks in main iteration
                              if (risk.riskLevel !== "Level 1") return [];
                              const level2Children = getLevel2Children(risk);
                              // Return Level 1 followed by its Level 2 children
                              return [risk, ...level2Children];
                            }).map((risk, index) => {
                              const isLevel1 = risk.riskLevel === "Level 1";
                              const isLevel2 = risk.riskLevel === "Level 2";
                              const isLevel3 = risk.riskLevel === "Level 3";
                              const isExpanded = expandedRows.has(risk.id);
                              const canExpand = hasChildren(risk);
                              // Find parent risk for Level 2 to show relationship
                              const parentRisk = isLevel2 ? group.risks.find(r => r.id === risk.parentRisk) : null;
                              
                              return (
                              <TableRow key={`${group.businessUnit}-${risk.id}-${index}`} className={`hover:bg-muted/50 transition-colors ${
                                isLevel1 ? 'bg-blue-50/30 dark:bg-blue-950/10' : 
                                isLevel2 ? 'bg-blue-50/20 dark:bg-blue-950/5 border-l-4 border-l-blue-300 dark:border-l-blue-600' :
                                'bg-orange-50/10 dark:bg-orange-950/10'
                              }`}>
                        <TableCell className="py-1 border-r border-b border-border align-top">
                          <div className="flex items-start justify-center pt-0.5">
                            <Checkbox 
                              checked={selectedRisks.has(risk.id)}
                              onCheckedChange={() => toggleRiskSelection(risk.id)}
                              disabled={isRiskCompleted(risk)}
                              className={`h-3 w-3 ${isRiskCompleted(risk) ? "opacity-50 cursor-not-allowed" : ""}`}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-1 border-r border-b border-border align-top">
                          <div className="pt-0.5">
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
                          </div>
                        </TableCell>
                        {/* Risk ID / Title (combined) */}
                        <TableCell className="py-1 border-r border-b border-border align-top">
                          <div className={`flex items-start gap-1.5 ${isLevel2 ? 'pl-4' : ''}`}>
                            {isLevel1 && canExpand && (
                              <button
                                onClick={() => toggleRow(risk.id)}
                                className="p-0.5 hover:bg-muted rounded transition-colors flex-shrink-0"
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
                            
                            <div className="flex flex-col gap-0.5">
                              {/* Show parent relationship for Level 2 */}
                              {isLevel2 && parentRisk && (
                                <span className="text-[9px] text-muted-foreground">
                                  └ Child of: {parentRisk.title.substring(0, 30)}{parentRisk.title.length > 30 ? '...' : ''}
                                </span>
                              )}
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
                          </div>
                        </TableCell>
                        {/* Risk Hierarchy */}
                        <TableCell className="py-1 border-r border-b border-border align-top">
                          <div className="flex flex-wrap items-start gap-1">
                            <Badge className={`${getRiskLevelColor(risk.riskLevel)} w-fit px-1.5 py-0 text-[8px] font-medium`}>
                              {risk.riskLevel}
                            </Badge>
                          </div>
                        </TableCell>
                        {/* Due Date */}
                        <TableCell className="py-1 border-r border-b border-border align-top">
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
                        <TableCell className="py-1 border-r border-b border-border align-top">
                          <div className="text-[9px] font-medium text-foreground">
                            {risk.status.toLowerCase() === "complete" ? risk.lastAssessed : "-"}
                          </div>
                        </TableCell>
                        {/* Assessment Progress */}
                        <TableCell className="py-1 border-r border-b border-border align-top">
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
                        <TableCell className="py-1 border-r border-b border-border align-top">
                          <Badge variant="outline" className="text-[8px] font-medium bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 text-[#10052F] dark:text-white">
                            {risk.businessUnit}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-1 border-r border-b border-border align-top">
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
                              <Badge className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                                {risk.testResults.label}
                              </Badge>
                              {risk.testResults.sublabel && (
                                <Badge className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full">
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
                              <Badge className={`${getRiskBadgeColor(risk.residualRisk.color)} border text-[10px] px-2 py-0.5 rounded-full`}>
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
                          <Badge className={`${getStatusColor(risk.status)} shadow-sm text-[10px] px-2 py-0.5`}>
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
                            <Badge className={`${getRiskBadgeColor(risk.inherentRisk.color)} border text-[10px] px-2 py-0.5 rounded-full`}>
                              {risk.inherentRisk.level}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-1 border-r border-b border-border">
                            <span className="text-xs">{risk.relatedControls[0]?.name || '-'}</span>
                          </TableCell>
                          <TableCell className="py-1 border-r border-b border-border">
                            <Badge className={`${getRiskBadgeColor(risk.controlEffectiveness.color)} border text-[10px] px-2 py-0.5 rounded-full`}>
                              {risk.controlEffectiveness.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-1 border-r border-b border-border">
                            <span className="text-xs">{risk.testResults.label}</span>
                          </TableCell>
                          <TableCell className="py-1 border-r border-b border-border">
                            <Badge className={`${getRiskBadgeColor(risk.residualRisk.color)} border text-[10px] px-2 py-0.5 rounded-full`}>
                              {risk.residualRisk.level}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-1 border-b border-border">
                            <Badge className={`${getStatusColor(risk.status)} shadow-sm text-[10px] px-2 py-0.5`}>
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
            </div>
          </DialogContent>
        </Dialog>
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
              {actionDialog.type === "reassign" ? "Reassign Risk" : "Reassess Risk"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === "reassign" ? "Select a new owner for this risk assessment" :
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
              {actionDialog.type === "reassign" ? "Reassign" : "Schedule Assessment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Collaborators Modal */}
      <ManageCollaboratorsModal
        open={collaboratorsModalOpen}
        onOpenChange={setCollaboratorsModalOpen}
        riskId={collaboratorsRiskId}
        riskCount={collaboratorsRiskId?.split(",").length || selectedRisks.size}
      />

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

      {/* Risk Assessment Task Modal */}
      <RiskAssessmentTaskModal
        open={riskAssessmentTaskOpen}
        onOpenChange={setRiskAssessmentTaskOpen}
        onSubmit={(data) => {
          toast.success(`Risk Assessment Task created: ${data.planTitle}`);
          setRiskAssessmentTaskOpen(false);
        }}
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
      {/* Export Modal */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Summarize and Export Dashboard
            </DialogTitle>
            <DialogDescription>
              Generate an AI-powered executive summary with narratives for each chart. 
              Choose your preferred format below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-24 flex-col gap-1.5 rounded-none bg-blue-50 hover:bg-blue-100 border-blue-200"
              onClick={() => handleExport('docx')}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <FileText className="w-7 h-7 text-blue-600" />
              )}
              <span className="text-sm font-medium text-blue-700">Word Document</span>
              <span className="text-[10px] text-blue-500">.docx</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-1.5 rounded-none bg-orange-50 hover:bg-orange-100 border-orange-200"
              onClick={() => handleExport('pptx')}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <Presentation className="w-7 h-7 text-orange-600" />
              )}
              <span className="text-sm font-medium text-orange-700">PowerPoint</span>
              <span className="text-[10px] text-orange-500">.pptx</span>
            </Button>
          </div>
          <DialogFooter>
            <p className="text-xs text-muted-foreground">
              Reports include AI-generated narratives for all {metrics.length + 2} dashboard components.
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default Dashboard2ndLine;
