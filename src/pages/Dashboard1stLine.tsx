import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { getInitialRiskDataCopy, SharedRiskData, HistoricalAssessment, ControlRecord } from "@/data/initialRiskData";
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay, addDays, endOfWeek, endOfMonth, isToday } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ClipboardCheck, AlertTriangle, FileCheck, Clock, TrendingUp, TrendingDown, UserPlus, Users as UsersIcon, RotateCcw, Edit2, LogOut, User, ChevronDown, ChevronRight, ChevronUp, Sparkles, Plus, RefreshCw, MoreHorizontal, Link, CheckCircle, CheckSquare, AlertCircle, Lock, ArrowUp, ArrowDown, Mail, X, XCircle, Send, FileText, Upload, Menu, Check, CalendarCheck, BarChart, Target, FlaskConical, Shield, Eye, LayoutList, Building2, Filter, Layers, Search, Ban, Info, Activity, Lightbulb, Download, Presentation, Loader2, DollarSign } from "lucide-react";
import { downloadRiskDocx } from "@/lib/generateRiskDocx";
import { generateDashboardDocx, generateDashboardPptx, downloadBlob } from "@/lib/generateDashboardExport";
import { supabase } from "@/integrations/supabase/client";
import { BulkAssessmentModal } from "@/components/BulkAssessmentModal";
import { RiskAssessmentOverviewModal1stLine } from "@/components/RiskAssessmentOverviewModal1stLine";
import { AIDocumentAssessmentModal } from "@/components/AIDocumentAssessmentModal";
import { HistoricalAssessmentsModal } from "@/components/HistoricalAssessmentsModal";
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

// Use the shared type for consistency with 2nd Line dashboard
type RiskData = SharedRiskData;

interface MetricData {
  title: string;
  value: number | string;
  trend: string;
  trendUp: boolean;
  icon: React.ComponentType<{ className?: string }>;
  segments: Array<{ label: string; value: number; sublabel: string; color: string }>;
  segmentRows?: Array<{ label: string; segments: Array<{ label: string; value: number; color: string }> }>;
  description: string;
  tooltip: string;
  extendedDetails: {
    insight: string;
    breakdown: Array<{ label: string; value: number; action: string }>;
    recommendation: string;
  };
}

const Dashboard1stLine = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const reportSectionRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"own" | "assess" | "approve">("assess");
  const [highlightedTab, setHighlightedTab] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedRowsInitialized, setExpandedRowsInitialized] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedRisks, setSelectedRisks] = useState<Set<string>>(new Set());
  
  const [selectedAssessor, setSelectedAssessor] = useState<string>("all");
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orgLevelFilter, setOrgLevelFilter] = useState<"all" | "level1" | "level2" | "level3">("all");
  const [businessUnitFilter, setBusinessUnitFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [riskIdFilter, setRiskIdFilter] = useState<string>("all");
  const [hierarchyViewMode, setHierarchyViewMode] = useState<"level1" | "level2" | "level3">("level1");
  const [deadlineFilter, setDeadlineFilter] = useState<string>("all");
  
  // Single expanded panel state - only one can be open at a time
  type ExpandedPanel = 'naJustifications' | 'lossEvents' | 'driftAlerts' | 'remediation' | null;
  const [expandedPanel, setExpandedPanel] = useState<ExpandedPanel>(null);
  
  // Expanded card state for metric cards
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  
  // N/A Justifications state
  const [naSearchQuery, setNaSearchQuery] = useState("");
  const [showApprovedNa, setShowApprovedNa] = useState(false);
  const naJustificationsRef = useRef<HTMLDivElement>(null);
  
  // Loss Events state
  const [lossEventSearchQuery, setLossEventSearchQuery] = useState("");
  const [showClosedLossEvents, setShowClosedLossEvents] = useState(false);
  const lossEventsRef = useRef<HTMLDivElement>(null);
  
  // Drift Alerts state
  const [driftAlertSearchQuery, setDriftAlertSearchQuery] = useState("");
  const [showResolvedAlerts, setShowResolvedAlerts] = useState(false);
  const driftAlertsRef = useRef<HTMLDivElement>(null);
  
  // Remediation Tasks state
  const [remediationSearchQuery, setRemediationSearchQuery] = useState("");
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const remediationRef = useRef<HTMLDivElement>(null);
  
  // Unified Loss Events with Root Cause data
  const [expandedLossEventRows, setExpandedLossEventRows] = useState<Set<string>>(new Set());
  
  // Unified loss events data with embedded root cause analysis
  const lossEventsData = [
    {
      id: "LE-2025-001",
      description: "Unauthorized wire transfer due to compromised credentials",
      amount: "$125,000",
      businessUnit: "Retail Banking",
      linkedRisk: "Operational Process Failure",
      status: "Pending",
      date: "Jan 10, 2025",
      rootCause: {
        summary: "Inadequate system access controls allowed unauthorized transactions",
        contributingFactors: [
          "Insufficient segregation of duties in transaction approval workflow",
          "Delayed patch deployment left known vulnerability unaddressed",
          "Weekend staffing reduction limited real-time monitoring capability"
        ],
        failedControls: [
          { id: "Control-015", name: "Access Management Control" },
          { id: "Control-023", name: "Transaction Monitoring Control" }
        ],
        recommendations: [
          "Implement mandatory dual authorization for high-value transactions",
          "Deploy real-time anomaly detection with automated alerts"
        ]
      }
    },
    {
      id: "LE-2025-002",
      description: "Customer data exposed during data synchronization",
      amount: "$89,500",
      businessUnit: "Operations",
      linkedRisk: "Data Privacy Breach",
      status: "Under Review",
      date: "Jan 5, 2025",
      rootCause: {
        summary: "Insufficient encryption protocols on data transfer endpoints",
        contributingFactors: [
          "Legacy systems lacking modern encryption standards",
          "Missing end-to-end encryption validation checks",
          "Inadequate third-party vendor security assessment"
        ],
        failedControls: [
          { id: "Control-008", name: "Data Encryption Control" },
          { id: "Control-019", name: "Vendor Security Assessment" }
        ],
        recommendations: [
          "Upgrade all data transfer endpoints to TLS 1.3",
          "Implement automated encryption compliance monitoring"
        ]
      }
    },
    {
      id: "LE-2025-003",
      description: "Critical system outage across multiple regions",
      amount: "$210,000",
      businessUnit: "Technology",
      linkedRisk: "System Availability",
      status: "Escalated",
      date: "Jan 2, 2025",
      rootCause: {
        summary: "Critical infrastructure dependency on single point of failure",
        contributingFactors: [
          "Insufficient redundancy in core network architecture",
          "Outdated disaster recovery procedures",
          "Delayed infrastructure modernization initiatives"
        ],
        failedControls: [
          { id: "Control-031", name: "Infrastructure Redundancy Control" },
          { id: "Control-027", name: "Disaster Recovery Testing" }
        ],
        recommendations: [
          "Deploy multi-region failover capabilities",
          "Conduct quarterly disaster recovery drills"
        ]
      }
    },
    {
      id: "LE-2024-047",
      description: "Payment processing delay affecting customer transactions",
      amount: "$45,000",
      businessUnit: "Retail Banking",
      linkedRisk: "Transaction Processing Risk",
      status: "Closed",
      date: "Dec 28, 2024",
      rootCause: null // No root cause analysis performed yet
    }
  ];
  
  const toggleLossEventRow = (eventId: string) => {
    setExpandedLossEventRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };
  
  // Calculate loss events stats
  const lossEventsStats = {
    totalAmount: lossEventsData.reduce((sum, e) => sum + parseFloat(e.amount.replace(/[$,]/g, '')), 0),
    analyzedCount: lossEventsData.filter(e => e.rootCause).length,
    totalCount: lossEventsData.length,
    pendingCount: lossEventsData.filter(e => e.status === "Pending" || e.status === "Under Review" || e.status === "Escalated").length
  };
  
  // Toggle panel helper - ensures only one panel is open at a time
  const togglePanel = (panel: ExpandedPanel, ref: React.RefObject<HTMLDivElement>) => {
    if (expandedPanel === panel) {
      setExpandedPanel(null);
    } else {
      setExpandedPanel(panel);
      setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };
  
  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  
  // Historical assessments modal state
  const [historicalModalOpen, setHistoricalModalOpen] = useState(false);
  const [selectedRiskForHistory, setSelectedRiskForHistory] = useState<RiskData | null>(null);
  const [bulkAssessmentOpen, setBulkAssessmentOpen] = useState(false);
  const [riskOverviewModalOpen, setRiskOverviewModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricData | null>(null);
  const [metricDetailsOpen, setMetricDetailsOpen] = useState(false);
  const [showRiskTable, setShowRiskTable] = useState(false);
  
  // AI Root Cause state (kept for compatibility, but now managed per-row)
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
  
  // Risk traversal state for review mode
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewRiskIds, setReviewRiskIds] = useState<string[]>([]);
  
  // Inline editing state
  const [editingCell, setEditingCell] = useState<{
    riskId: string;
    field: string;
    value: string;
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

  const [riskData, setRiskData] = useState<RiskData[]>(() => getInitialRiskDataCopy() as RiskData[]);

  // Initialize expanded rows as empty by default (all collapsed)
  useEffect(() => {
    if (!expandedRowsInitialized && riskData.length > 0) {
      setExpandedRows(new Set());
      setExpandedRowsInitialized(true);
    }
  }, [riskData, expandedRowsInitialized]);

  const getFilteredByTab = (data: RiskData[], tab: "own" | "assess" | "approve") => {
    return data.filter(risk => risk.tabCategory === tab);
  };

  // Get unique assessors from all risk data for the dropdown (must be before assessorFilteredRiskData)
  const uniqueAssessors = useMemo(() => {
    const allAssessors = riskData.flatMap(risk => risk.assessors);
    return [...new Set(allAssessors)].sort();
  }, [riskData]);

  // Filter risk data based on selected assessor - this affects ALL data on the page
  const assessorFilteredRiskData = useMemo(() => {
    if (selectedAssessor === "all") {
      return riskData;
    }
    return riskData.filter(risk => risk.assessors.includes(selectedAssessor));
  }, [riskData, selectedAssessor]);

  // Unique Risk IDs for filter dropdown (uses assessor-filtered data)
  const uniqueRiskIds = useMemo(() => {
    const tabRisks = getFilteredByTab(assessorFilteredRiskData, activeTab);
    return [...new Set(tabRisks.map(r => r.id))].sort();
  }, [assessorFilteredRiskData, activeTab]);

  // Total count for current tab (before filtering)
  const totalTabRisks = useMemo(() => {
    return assessorFilteredRiskData.filter(r => r.tabCategory === activeTab).length;
  }, [assessorFilteredRiskData, activeTab]);

  const visibleRisks = useMemo(() => {
    let filtered = getFilteredByTab(assessorFilteredRiskData, activeTab);
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(risk => 
        risk.title.toLowerCase().includes(query)
      );
    }

    // Apply risk ID filter
    if (riskIdFilter !== "all") {
      filtered = filtered.filter(risk => risk.id === riskIdFilter);
    }
    
    // Robust status normalization helper (matches 2nd Line Dashboard)
    const normalizeStatus = (status: string): string => {
      return status
        .trim()
        .toLowerCase()
        .replace(/[\u00A0\u2007\u202F]/g, ' ')
        .replace(/[／⁄∕]/g, '/')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    // Apply risk level filter
    if (riskLevelFilter !== "all") {
      filtered = filtered.filter(risk => {
        const normalizedLevel = risk.riskLevel.toLowerCase().replace(" ", "-");
        return normalizedLevel === riskLevelFilter;
      });
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(risk => {
        const normalizedRiskStatus = normalizeStatus(risk.status ?? "");
        return normalizedRiskStatus === statusFilter;
      });
    }
    
    // Apply deadline filter
    if (deadlineFilter !== "all") {
      const today = startOfDay(new Date());
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      const monthEnd = endOfMonth(today);
      
      filtered = filtered.filter(risk => {
        try {
          const dueDate = parseISO(risk.dueDate);
          const dueDateStart = startOfDay(dueDate);
          
          if (deadlineFilter === "overdue") {
            return isBefore(dueDateStart, today);
          } else if (deadlineFilter === "due-this-week") {
            return (isBefore(dueDateStart, weekEnd) || isToday(dueDate)) && !isBefore(dueDateStart, today);
          } else if (deadlineFilter === "due-this-month") {
            return isBefore(dueDateStart, monthEnd) && !isBefore(dueDateStart, weekEnd) && !isToday(dueDate);
          }
          return true;
        } catch (e) {
          return false;
        }
      });
    }
    
    // Apply org level filter - but don't filter out risks with empty orgLevel
    if (orgLevelFilter !== "all") {
      filtered = filtered.filter(risk => {
        // If risk has no orgLevel data (imported), show it in "all" mode only
        const hasOrgLevel = risk.orgLevel.level1 || risk.orgLevel.level2 || risk.orgLevel.level3;
        if (!hasOrgLevel) return false; // Hide when filtering by specific level
        if (orgLevelFilter === "level1") return risk.orgLevel.level1 !== "";
        if (orgLevelFilter === "level2") return risk.orgLevel.level2 !== "";
        if (orgLevelFilter === "level3") return risk.orgLevel.level3 !== "";
        return true;
      });
    }
    
    // Apply business unit filter
    if (businessUnitFilter !== "all") {
      filtered = filtered.filter(risk => risk.businessUnit === businessUnitFilter);
    }
    
    // Apply hierarchy view mode filtering - group by level based on riskLevel
    const level1Risks = filtered.filter(risk => risk.riskLevel === "Level 1");
    const level2Risks = filtered.filter(risk => risk.riskLevel === "Level 2");
    const level3Risks = filtered.filter(risk => risk.riskLevel === "Level 3");
    
    if (hierarchyViewMode === "level3") {
      // Show only Level 3 risks (flat list)
      return level3Risks;
    } else if (hierarchyViewMode === "level2") {
      // Show Level 2 risks as primary, with Level 3 children shown when expanded
      const visible: RiskData[] = [];
      const addedLevel3Ids = new Set<string>();
      
      level2Risks.forEach(l2Risk => {
        visible.push(l2Risk);
        if (expandedRows.has(l2Risk.id)) {
          // Only show Level 3 risks that belong to this Level 2 (matching parentRisk)
          const childLevel3Risks = level3Risks.filter(l3 => 
            l3.parentRisk === l2Risk.title && 
            !addedLevel3Ids.has(l3.id)
          );
          childLevel3Risks.forEach(l3 => addedLevel3Ids.add(l3.id));
          visible.push(...childLevel3Risks);
        }
      });
      // If no Level 2 risks but there are Level 3, show Level 3 directly
      if (level2Risks.length === 0) {
        return level3Risks;
      }
      return visible;
    } else {
      // Level 1 mode: Show Level 1 risks as primary with Level 2 and Level 3 nested
      const visible: RiskData[] = [];
      const addedLevel3Ids = new Set<string>();
      
      level1Risks.forEach(l1Risk => {
        visible.push(l1Risk);
        if (expandedRows.has(l1Risk.id)) {
          // Only show Level 2 risks that belong to this Level 1 (matching parentRisk)
          const childLevel2Risks = level2Risks.filter(l2 => 
            l2.parentRisk === l1Risk.title
          );
          
          childLevel2Risks.forEach(l2Risk => {
            visible.push(l2Risk);
            if (expandedRows.has(l2Risk.id)) {
              // Only show Level 3 risks that belong to this Level 2
              const childLevel3Risks = level3Risks.filter(l3 => 
                l3.parentRisk === l2Risk.title && 
                !addedLevel3Ids.has(l3.id)
              );
              childLevel3Risks.forEach(l3 => addedLevel3Ids.add(l3.id));
              visible.push(...childLevel3Risks);
            }
          });
        }
      });
      // If no Level 1 risks, fall back to showing Level 2 and Level 3
      if (level1Risks.length === 0) {
        level2Risks.forEach(l2Risk => {
          visible.push(l2Risk);
          if (expandedRows.has(l2Risk.id)) {
            const childLevel3Risks = level3Risks.filter(l3 => 
              l3.parentRisk === l2Risk.title && 
              !addedLevel3Ids.has(l3.id)
            );
            childLevel3Risks.forEach(l3 => addedLevel3Ids.add(l3.id));
            visible.push(...childLevel3Risks);
          }
        });
        if (level2Risks.length === 0) {
          return level3Risks;
        }
      }
      return visible;
    }
  }, [assessorFilteredRiskData, activeTab, orgLevelFilter, riskLevelFilter, statusFilter, searchQuery, riskIdFilter, hierarchyViewMode, expandedRows, deadlineFilter]);

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

  // Risk traversal logic
  const traversableRisks = useMemo(() => {
    if (isReviewMode && reviewRiskIds.length > 0) {
      return visibleRisks.filter(r => reviewRiskIds.includes(r.id)).map(r => ({
        id: r.id,
        title: r.title,
        sectionCompletion: r.sectionCompletion,
      }));
    }
    return visibleRisks.map(r => ({
      id: r.id,
      title: r.title,
      sectionCompletion: r.sectionCompletion,
    }));
  }, [visibleRisks, isReviewMode, reviewRiskIds]);

  const currentTraversalIndex = useMemo(() => {
    if (!selectedRiskForOverview) return -1;
    return traversableRisks.findIndex(r => r.id === selectedRiskForOverview.id);
  }, [traversableRisks, selectedRiskForOverview]);

  const isFirstRisk = currentTraversalIndex <= 0;
  const isLastRisk = currentTraversalIndex >= traversableRisks.length - 1;

  const goToNextRisk = useCallback(() => {
    if (isLastRisk || currentTraversalIndex === -1) return;
    const nextRisk = traversableRisks[currentTraversalIndex + 1];
    if (nextRisk) {
      setSelectedRiskForOverview(nextRisk);
    }
  }, [traversableRisks, currentTraversalIndex, isLastRisk]);

  const goToPreviousRisk = useCallback(() => {
    if (isFirstRisk || currentTraversalIndex === -1) return;
    const prevRisk = traversableRisks[currentTraversalIndex - 1];
    if (prevRisk) {
      setSelectedRiskForOverview(prevRisk);
    }
  }, [traversableRisks, currentTraversalIndex, isFirstRisk]);

  const startReviewMode = useCallback(() => {
    const ids = Array.from(selectedRisks);
    const validRisks = visibleRisks.filter(r => ids.includes(r.id));
    if (validRisks.length === 0) return;
    
    setReviewRiskIds(ids);
    setIsReviewMode(true);
    setSelectedRiskForOverview({
      id: validRisks[0].id,
      title: validRisks[0].title,
      sectionCompletion: validRisks[0].sectionCompletion,
    });
    setRiskOverviewModalOpen(true);
  }, [selectedRisks, visibleRisks]);

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
      // Prepare 1st Line dashboard data for AI narrative generation
      const dashboardData = {
        metrics: metrics.map(m => ({
          title: m.title,
          value: m.value,
          trend: m.trend,
          segments: m.segments,
        })),
        filters: {
          businessUnit: businessUnitFilter === 'all' ? 'All Business Units' : businessUnitFilter,
          timePeriod: 'Current Period',
        },
        // Include 1st line specific summary data
        naJustificationsSummary: '2 pending approvals',
        lossEventsSummary: '4 active events',
        driftAlertsSummary: '3 active alerts',
        remediationTasksSummary: '4 active tasks',
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
        downloadBlob(blob, `1st-Line-Risk-Dashboard-${format(new Date(), 'yyyy-MM-dd')}.docx`);
      } else {
        const blob = await generateDashboardPptx(exportData);
        downloadBlob(blob, `1st-Line-Risk-Dashboard-${format(new Date(), 'yyyy-MM-dd')}.pptx`);
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

  // Inline editing handlers
  const startInlineEdit = (riskId: string, field: string, value: string) => {
    setEditingCell({ riskId, field, value });
  };

  const saveInlineEdit = () => {
    if (!editingCell) return;
    
    setRiskData(prev => prev.map(risk => {
      if (risk.id !== editingCell.riskId) return risk;
      
      switch (editingCell.field) {
        case 'title':
          return { ...risk, title: editingCell.value };
        case 'businessUnit':
          return { ...risk, businessUnit: editingCell.value };
        case 'inherentRisk':
          return { ...risk, inherentRisk: { ...risk.inherentRisk, level: editingCell.value } };
        case 'residualRisk':
          return { ...risk, residualRisk: { ...risk.residualRisk, level: editingCell.value } };
        case 'controlEffectiveness':
          return { ...risk, controlEffectiveness: { ...risk.controlEffectiveness, label: editingCell.value } };
        case 'status':
          return { ...risk, status: editingCell.value };
        default:
          return risk;
      }
    }));
    
    toast.success("Updated successfully");
    setEditingCell(null);
  };

  const cancelInlineEdit = () => {
    setEditingCell(null);
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveInlineEdit();
    } else if (e.key === 'Escape') {
      cancelInlineEdit();
    }
  };

  const renderEditableCell = (
    riskId: string, 
    field: string, 
    value: string, 
    displayContent: React.ReactNode,
    type: 'text' | 'select' = 'text',
    options?: string[]
  ) => {
    const isEditing = editingCell?.riskId === riskId && editingCell?.field === field;
    
    if (isEditing) {
      if (type === 'select' && options) {
        return (
          <Select 
            value={editingCell.value} 
            onValueChange={(val) => {
              setRiskData(prev => prev.map(risk => {
                if (risk.id !== riskId) return risk;
                switch (field) {
                  case 'inherentRisk':
                    return { ...risk, inherentRisk: { ...risk.inherentRisk, level: val } };
                  case 'residualRisk':
                    return { ...risk, residualRisk: { ...risk.residualRisk, level: val } };
                  case 'controlEffectiveness':
                    return { ...risk, controlEffectiveness: { ...risk.controlEffectiveness, label: val } };
                  case 'status':
                    return { ...risk, status: val };
                  default:
                    return risk;
                }
              }));
              toast.success("Updated successfully");
              setEditingCell(null);
            }}
            onOpenChange={(open) => {
              if (!open) {
                setEditingCell(null);
              }
            }}
          >
            <SelectTrigger className="h-7 text-xs min-w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border shadow-lg z-[100]">
              {options.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      
      return (
        <Input
          value={editingCell.value}
          onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
          onKeyDown={handleInlineKeyDown}
          onBlur={saveInlineEdit}
          className="h-7 text-sm min-w-[120px]"
          autoFocus
        />
      );
    }
    
    return (
      <div 
        className="cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 -mx-1 transition-colors group"
        onClick={() => startInlineEdit(riskId, field, value)}
        title="Click to edit"
      >
        {displayContent}
        <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 inline-block ml-1 transition-opacity" />
      </div>
    );
  };

  const handleAction = (type: typeof actionDialog.type, riskId: string) => {
    setActionDialog({ open: true, type, riskId });
  };

  // Update closed assessment dialog state
  const [updateVersionDialogOpen, setUpdateVersionDialogOpen] = useState(false);
  const [selectedRiskForUpdate, setSelectedRiskForUpdate] = useState<RiskData | null>(null);
  
  // AI Document Assessment modal state
  const [aiDocumentModalOpen, setAiDocumentModalOpen] = useState(false);
  
  // Direct AI Risk Assessment modal state (skips review screen)
  const [directAssessmentModalOpen, setDirectAssessmentModalOpen] = useState(false);
  
  const handleImportedRisks = (parsedRisks: any[]) => {
    console.log("handleImportedRisks received:", parsedRisks.length, "risks");
    console.log("Sample parsed:", parsedRisks.slice(0, 3));
    
    // Convert parsed risks to RiskData format and add to the list
    const newRisks: RiskData[] = parsedRisks.map((parsed, index) => ({
      id: parsed.id || `IMPORT-${Date.now()}-${index}`,
      title: parsed.title || parsed.riskLevel3 || 'Imported Risk',
      dueDate: parsed.lastAssessed || new Date().toISOString().split('T')[0],
      riskLevel: parsed.level || 'Level 3',
      parentRisk: parsed.parentRisk || '',
      businessUnit: parsed.businessUnit || 'Unknown',
      category: parsed.category || 'Operational',
      owner: parsed.owner || 'Unassigned',
      assessors: [parsed.assessor || 'Unassigned'],
      orgLevel: {
        level1: parsed.riskLevel1 || '',
        level2: parsed.riskLevel2 || '',
        level3: parsed.riskLevel3 || '',
      },
      assessmentProgress: {
        assess: "not-started" as const,
        reviewChallenge: "not-started" as const,
        approve: "not-started" as const,
      },
      sectionCompletion: {
        inherentRating: 0,
        controlEffectiveness: 0,
        residualRating: 0,
        riskTreatment: 0,
      },
      inherentRisk: { 
        level: parsed.inherentRisk?.replace(/[\[\]]/g, '').split(',')[1]?.trim() || 'Medium', 
        color: parsed.inherentRisk?.toLowerCase().includes('high') ? 'red' : 
               parsed.inherentRisk?.toLowerCase().includes('low') ? 'green' : 'yellow' 
      },
      inherentTrend: { 
        value: parsed.inherentTrend?.includes('↑') ? '+5%' : 
               parsed.inherentTrend?.includes('↓') ? '-5%' : '0%', 
        up: parsed.inherentTrend?.includes('↑') 
      },
      relatedControls: [{ 
        id: parsed.controls?.split(':')[0] || 'CTRL-NEW', 
        name: parsed.controls?.split(':')[1]?.trim() || 'New Control', 
        type: 'Preventive', 
        nature: 'Manual',
        keyControl: 'Key' as const
      }],
      controlEffectiveness: { 
        label: parsed.effectiveness || 'Not Assessed', 
        color: parsed.effectiveness?.toLowerCase().includes('effective') && !parsed.effectiveness?.toLowerCase().includes('in') ? 'green' : 'yellow' 
      },
      testResults: { 
        label: parsed.testResults || 'Not Tested', 
        sublabel: 'Imported' 
      },
      residualRisk: { 
        level: parsed.residualRisk?.replace(/[\[\]]/g, '').split(',')[1]?.trim() || 'Medium', 
        color: parsed.residualRisk?.toLowerCase().includes('high') ? 'red' : 
               parsed.residualRisk?.toLowerCase().includes('low') ? 'green' : 'yellow' 
      },
      residualTrend: { 
        value: parsed.residualTrend?.includes('↑') ? '+3%' : 
               parsed.residualTrend?.includes('↓') ? '-3%' : '0%', 
        up: parsed.residualTrend?.includes('↑') 
      },
      status: parsed.status || 'Sent for Assessment',
      lastAssessed: parsed.lastAssessed || new Date().toLocaleDateString(),
      previousAssessments: 0,
      tabCategory: "assess" as const,
    }));

    console.log("Converted to RiskData:", newRisks.length);
    console.log("Sample converted:", newRisks.slice(0, 3).map(r => ({ id: r.id, title: r.title, riskLevel: r.riskLevel })));

    setRiskData(prev => {
      console.log("Previous riskData count:", prev.length);
      // Create a map of existing risk IDs for quick lookup
      const existingIds = new Set(prev.map(r => r.id));
      
      // Separate new risks from updates to existing risks
      const trulyNewRisks = newRisks.filter(r => !existingIds.has(r.id));
      const updatedRisks = newRisks.filter(r => existingIds.has(r.id));
      
      console.log("Truly new risks:", trulyNewRisks.length);
      console.log("Updated risks:", updatedRisks.length);
      
      // Update existing risks with new data, or keep them unchanged
      const updatedExisting = prev.map(existingRisk => {
        const update = updatedRisks.find(r => r.id === existingRisk.id);
        return update ? { ...existingRisk, ...update } : existingRisk;
      });
      
      // Return truly new risks prepended to the updated existing risks
      const finalData = [...trulyNewRisks, ...updatedExisting];
      console.log("Final riskData count:", finalData.length);
      return finalData;
    });
    
    toast.success(`${newRisks.length} risks imported`);
  };

  const handleUpdateClosedAssessment = (riskId: string) => {
    const risk = riskData.find(r => r.id === riskId);
    if (risk) {
      setSelectedRiskForUpdate(risk);
      setUpdateVersionDialogOpen(true);
    }
  };

  const handleProceedUpdateVersion = () => {
    if (selectedRiskForUpdate) {
      navigate(`/risk-assessment?riskId=${encodeURIComponent(selectedRiskForUpdate.id)}&riskName=${encodeURIComponent(selectedRiskForUpdate.title)}&mode=update-version&source=1st-line`);
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
    setShowRiskTable(true); // Show the risk table first
    setExpandedCard('assessment'); // Sync expanded card state
    
    setTimeout(() => {
      reportSectionRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 150); // Slightly longer delay to allow render
    
    setTimeout(() => {
      setHighlightedTab(null);
    }, 1500);
  };

  const handleActionPlansClick = () => {
    setActiveTab("assess");
    setStatusFilter("In Progress");
    setHighlightedTab("assess");
    
    setTimeout(() => {
      reportSectionRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
    
    setTimeout(() => {
      setHighlightedTab(null);
    }, 1500);
    
    toast.info("Showing risks with pending action items");
  };

  const handleSubmitForReview = () => {
    if (selectedRisks.size === 0) {
      toast.error("Please select at least one risk to submit for review");
      return;
    }
    toast.success(`${selectedRisks.size} assessment(s) submitted for 2nd Line review`);
    clearSelection();
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  // Handler for clicking on Assessment Status card segments
  const handleSegmentClick = (segmentLabel: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click from opening details modal
    
    // Map segment labels to status filter values
    const statusMap: Record<string, string> = {
      // Deadline segments - filter by due date status
      "Overdue": "overdue",
      "Due This Week": "due-this-week",
      "Due This Month": "due-this-month",
      // Workflow segments - filter by status (kebab-case to match filter values)
      "Completed": "completed",
      "Pending Approval": "pending-approval",
      "Challenge": "review-challenge",
      "In Progress": "in-progress",
      "Not Started": "sent-for-assessment",
    };
    
    const filterValue = statusMap[segmentLabel];
    if (filterValue) {
      // For deadline-based filters, we need special handling
      if (["overdue", "due-this-week", "due-this-month"].includes(filterValue)) {
        // Set a custom deadline filter (we'll add this state)
        setDeadlineFilter(filterValue);
        setStatusFilter("all");
      } else {
        // For status-based filters
        setStatusFilter(filterValue);
        setDeadlineFilter("all");
      }
      
      // Scroll to the risk table
      setTimeout(() => {
        reportSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
      
      toast.success(`Filtered by: ${segmentLabel}`);
    }
  };

  useState(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  // Workflow status colors (consistent with 2nd line dashboard)
  const WORKFLOW_COLORS = {
    sentForAssessment: "#0A84FF",  // Blue
    pendingReview: "#FF9F0A",       // Orange  
    pendingApproval: "#BF5AF2",     // Purple
    completed: "#34C759",           // Green
    overdue: "#FF453A",             // Red
    reassigned: "#64D2FF",          // Light Blue
  };

  // Combined assessment status counts (deadline urgency + workflow progress) - aligned with 2nd line
  const assessmentStatusCounts = useMemo(() => {
    const today = startOfDay(new Date());
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Monday start
    const monthEnd = endOfMonth(today);
    
    // Deadline urgency counts
    let overdueDeadline = 0;
    let dueThisWeek = 0;
    let dueThisMonth = 0;
    let future = 0;
    
    // Workflow progress counts (aligned with 2nd line dashboard)
    let sentForAssessment = 0;
    let pendingReview = 0;
    let pendingApproval = 0;
    let completed = 0;
    let overdue = 0;
    let reassigned = 0;
    
    assessorFilteredRiskData.forEach(risk => {
      // Due date categorization
      try {
        const dueDate = parseISO(risk.dueDate);
        const dueDateStart = startOfDay(dueDate);
        
        if (isBefore(dueDateStart, today)) {
          overdueDeadline++;
        } else if (isBefore(dueDateStart, weekEnd) || isToday(dueDate)) {
          dueThisWeek++;
        } else if (isBefore(dueDateStart, monthEnd)) {
          dueThisMonth++;
        } else {
          future++;
        }
      } catch (e) {
        // Skip invalid dates
      }
      
      // Workflow status categorization (aligned with 2nd line dashboard)
      const status = risk.status?.toLowerCase() || "";
      
      if (status.includes('sent') || status.includes('assessment') || status === 'not started') {
        sentForAssessment++;
      } else if (status.includes('review') && !status.includes('approval')) {
        pendingReview++;
      } else if (status.includes('approval')) {
        pendingApproval++;
      } else if (status.includes('completed') || status.includes('complete') || status.includes('closed')) {
        completed++;
      } else if (status.includes('overdue')) {
        overdue++;
      } else if (status.includes('reassigned')) {
        reassigned++;
      } else if (status.includes('in progress')) {
        pendingReview++; // Map "in progress" to pending review
      } else {
        sentForAssessment++; // Default to sent for assessment
      }
    });
    
    return {
      // Deadline data
      overdueDeadline, dueThisWeek, dueThisMonth, future,
      // Workflow data (aligned with 2nd line)
      sentForAssessment, pendingReview, pendingApproval, completed, overdue, reassigned,
      total: assessorFilteredRiskData.length
    };
  }, [assessorFilteredRiskData]);

  // Calculate inherent risk rating counts from risk data
  const inherentRiskCounts = useMemo(() => {
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;
    
    assessorFilteredRiskData.forEach(risk => {
      const level = risk.inherentRisk?.level?.toLowerCase() || "";
      if (level.includes("critical")) {
        critical++;
      } else if (level.includes("high")) {
        high++;
      } else if (level.includes("medium")) {
        medium++;
      } else if (level.includes("low")) {
        low++;
      }
    });
    
    return { critical, high, medium, low, total: critical + high + medium + low };
  }, [assessorFilteredRiskData]);

  // Calculate inherent risk trend counts
  const inherentTrendCounts = useMemo(() => {
    let increasing = 0;
    let stable = 0;
    let decreasing = 0;
    
    assessorFilteredRiskData.forEach(risk => {
      if (risk.inherentTrend?.up === true) {
        increasing++;
      } else if (risk.inherentTrend?.up === false) {
        decreasing++;
      } else {
        stable++;
      }
    });
    
    return { increasing, stable, decreasing, total: increasing + stable + decreasing };
  }, [assessorFilteredRiskData]);


  // Calculate control evidence status from controlEffectiveness
  const controlEvidenceCounts = useMemo(() => {
    let effective = 0;
    let partiallyEffective = 0;
    let ineffective = 0;
    let notAssessed = 0;
    
    assessorFilteredRiskData.forEach(risk => {
      const label = risk.controlEffectiveness?.label?.toLowerCase() || "";
      if (label === "effective" || label === "design effective" || label === "operating effective") {
        effective++;
      } else if (label === "partially effective") {
        partiallyEffective++;
      } else if (label === "ineffective") {
        ineffective++;
      } else {
        notAssessed++;
      }
    });
    
    const total = effective + partiallyEffective + ineffective + notAssessed;
    return { effective, partiallyEffective, ineffective, notAssessed, total };
  }, [assessorFilteredRiskData]);

  // Calculate control type counts (key vs non-key)
  const controlTypeCounts = useMemo(() => {
    let keyControls = 0;
    let nonKeyControls = 0;
    
    assessorFilteredRiskData.forEach(risk => {
      risk.relatedControls?.forEach(control => {
        if (control.keyControl === "Key") {
          keyControls++;
        } else {
          nonKeyControls++;
        }
      });
    });
    
    return { keyControls, nonKeyControls, total: keyControls + nonKeyControls };
  }, [assessorFilteredRiskData]);

  // 1st Line specific metrics
  const metrics = useMemo(() => [
    {
      title: "Assessment Status",
      value: "59 Requiring Action",
      trend: "59 overdue",
      trendUp: false,
      icon: CalendarCheck,
      segmentRows: [
        {
          label: "Workflow Progress",
          segments: [
            { label: "Completed", value: 13, color: "bg-[#2e8b2e]" },
            { label: "Pending Approval", value: 12, color: "bg-[#F1BA50]" },
            { label: "Challenge", value: 5, color: "bg-[#CE7900]" },
            { label: "In Progress", value: 0, color: "bg-[#6A75D8]" },
            { label: "Not Started", value: 29, color: "bg-[#D21C1C]" },
          ]
        },
        {
          label: "Deadline Status",
          segments: [
            { label: "Overdue", value: 59, color: "bg-[#D21C1C]" },
            { label: "Due This Week", value: 0, color: "bg-[#CE7900]" },
            { label: "Due This Month", value: 0, color: "bg-[#2e8b2e]" },
          ]
        }
      ],
      segments: [
        { label: "Overdue", value: 59, sublabel: "59 Overdue", color: "bg-[#D21C1C]" },
        { label: "Due This Week", value: 0, sublabel: "0 Due This Week", color: "bg-[#CE7900]" },
        { label: "Completed", value: 13, sublabel: "13 Completed", color: "bg-[#2e8b2e]" },
      ],
      description: "Track assessment deadlines and workflow progress together.",
      tooltip: "Combined view of assessment timing and workflow status.",
      extendedDetails: {
        insight: "Assessment management requires balancing urgency with progress tracking. Monitor both deadlines and completion rates.",
        breakdown: [
          { label: "Overdue", value: 59, action: "Immediate attention required" },
          { label: "Due This Week", value: 0, action: "Schedule for completion" },
          { label: "Due This Month", value: 0, action: "Plan ahead" },
          { label: "Completed", value: 13, action: "Ready for next cycle" },
          { label: "Pending Approval", value: 12, action: "Awaiting 2nd line review" },
          { label: "Challenge", value: 5, action: "Address 2nd line challenges" },
          { label: "In Progress", value: 0, action: "Continue work" },
          { label: "Not Started", value: 29, action: "Prioritize initiation" },
        ],
        recommendation: "Focus on clearing overdue assessments first to maintain compliance posture.",
      },
    },
    {
      title: "Inherent Risk Ratings",
      value: "30 Critical & High",
      trend: "6 critical, 24 high",
      trendUp: false,
      icon: AlertTriangle,
      segmentRows: [
        {
          label: "Risk Level Distribution",
          segments: [
            { label: "Critical", value: 6, color: "bg-[#D21C1C]" },
            { label: "High", value: 24, color: "bg-[#CE7900]" },
            { label: "Medium", value: 29, color: "bg-[#F1BA50]" },
            { label: "Low", value: 0, color: "bg-[#46AF6A]" },
          ]
        },
        {
          label: "Trend Analysis",
          segments: [
            { label: "Increasing", value: 37, color: "bg-[#D21C1C]" },
            { label: "Stable", value: 0, color: "bg-[#F1BA50]" },
            { label: "Decreasing", value: 22, color: "bg-[#46AF6A]" },
          ]
        }
      ],
      segments: [
        { label: "Critical", value: 6, sublabel: "6 Critical", color: "bg-[#D21C1C]" },
        { label: "High", value: 24, sublabel: "24 High", color: "bg-[#CE7900]" },
        { label: "Medium", value: 29, sublabel: "29 Medium", color: "bg-[#46AF6A]" },
      ],
      description: "Review Critical and High ratings for control adequacy.",
      tooltip: "Distribution of inherent risk ratings across your assigned risks. Higher ratings require stronger controls to mitigate.",
      extendedDetails: {
        insight: "Inherent risk represents the natural exposure before any controls are applied. Critical and High risks need robust mitigation strategies.",
        breakdown: [
          { label: "Critical", value: 6, action: "Requires executive oversight" },
          { label: "High", value: 24, action: "Enhanced monitoring needed" },
          { label: "Medium", value: 29, action: "Standard controls apply" },
          { label: "Low", value: 0, action: "Monitor periodically" },
        ],
        recommendation: "Critical risks detected. Ensure adequate controls and escalate to risk committee if needed.",
      },
    },
    {
      title: "Control Effectiveness by Risk",
      value: "14 Needing Attention",
      trend: "45 effective",
      trendUp: true,
      icon: FileCheck,
      segmentRows: [
        {
          label: "Effectiveness Rating",
          segments: [
            { label: "Effective", value: 45, color: "bg-[#46AF6A]" },
            { label: "Partially", value: 14, color: "bg-[#F1BA50]" },
            { label: "Ineffective", value: 0, color: "bg-[#D21C1C]" },
            { label: "Not Assessed", value: 0, color: "bg-[#8B8B8B]" },
          ]
        },
        {
          label: "Control Type",
          segments: [
            { label: "Key Controls", value: 72, color: "bg-[#A361CF]" },
            { label: "Non-Key", value: 23, color: "bg-[#6A75D8]" },
          ]
        }
      ],
      segments: [
        { label: "Effective", value: 45, sublabel: "45 Effective", color: "bg-[#46AF6A]" },
        { label: "Partially Effective", value: 14, sublabel: "14 Partially Effective", color: "bg-[#F1BA50]" },
        { label: "Ineffective", value: 0, sublabel: "0 Ineffective", color: "bg-[#D21C1C]" },
        { label: "Not Assessed", value: 0, sublabel: "0 Not Assessed", color: "bg-[#8B8B8B]" },
      ],
      description: "Review ineffective and not assessed controls.",
      tooltip: "Control effectiveness ratings across your assigned risks. Focus on improving ineffective controls.",
      extendedDetails: {
        insight: "Control effectiveness directly impacts residual risk. Ineffective controls should be remediated or replaced.",
        breakdown: [
          { label: "Effective", value: 45, action: "Maintain current practices" },
          { label: "Partially Effective", value: 14, action: "Identify improvement areas" },
          { label: "Ineffective", value: 0, action: "Remediation required" },
          { label: "Not Assessed", value: 0, action: "Schedule assessment" },
        ],
        recommendation: "Control effectiveness is healthy. Focus on assessing remaining controls.",
      },
    },
  ], []);


  const filteredRiskData = useMemo(() => {
    let filtered = getFilteredByTab(assessorFilteredRiskData, activeTab);
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(risk => 
        risk.title.toLowerCase().includes(query)
      );
    }
    
    // Apply org level filter
    if (orgLevelFilter !== "all") {
      filtered = filtered.filter(risk => {
        if (orgLevelFilter === "level1") return risk.orgLevel.level1 !== "";
        if (orgLevelFilter === "level2") return risk.orgLevel.level2 !== "";
        if (orgLevelFilter === "level3") return risk.orgLevel.level3 !== "";
        return true;
      });
    }
    
    
    return filtered;
  }, [assessorFilteredRiskData, activeTab, orgLevelFilter, searchQuery]);

  const getVisibleRisks = () => {
    const visible: RiskData[] = [];
    filteredRiskData.forEach(risk => {
      if (risk.riskLevel === "Level 1") {
        visible.push(risk);
        if (expandedRows.has(risk.id)) {
          const level2Risks = filteredRiskData.filter(r => r.riskLevel === "Level 2" && r.parentRisk === risk.title);
          level2Risks.forEach(l2 => {
            visible.push(l2);  // Add Level 2 as separate row
            const level3Risks = filteredRiskData.filter(r => r.riskLevel === "Level 3" && r.parentRisk === l2.title);
            visible.push(...level3Risks);  // Add Level 3 as separate rows
          });
        }
      }
    });
    return visible;
  };

  const getLevel2Children = (level1Risk: RiskData): RiskData[] => {
    return filteredRiskData.filter(r => 
      r.riskLevel === "Level 2" && r.parentRisk === level1Risk.title
    );
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

  const getLevel3Children = (level2Risk: RiskData): RiskData[] => {
    return filteredRiskData.filter(r => 
      r.riskLevel === "Level 3" && r.parentRisk === level2Risk.title
    );
  };

  // Calculate aggregated risk for Level 1 parents based on children
  const calculateAggregatedRisk = (parentRisk: RiskData, type: 'inherent' | 'residual') => {
    if (parentRisk.riskLevel !== "Level 1") return null;
    
    // Find all child risks (Level 2 that belong to this parent)
    const childRisks = riskData.filter(r => 
      r.riskLevel === "Level 2" && r.parentRisk === parentRisk.title
    );
    
    if (childRisks.length === 0) return null;
    
    // Get scores from children
    const scores = childRisks.map(r => {
      const risk = type === 'inherent' ? r.inherentRisk : r.residualRisk;
      return risk.score || 0;
    }).filter(s => s > 0);
    
    if (scores.length === 0) return null;
    
    // Calculate average score
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const maxScore = Math.max(...scores);
    
    return {
      avgScore,
      maxScore,
      childCount: childRisks.length
    };
  };

  // Calculate comprehensive aggregations for Level 1 parents
  const calculateLevel1Aggregations = (parentRisk: RiskData) => {
    if (parentRisk.riskLevel !== "Level 1") return null;
    
    // Get all Level 2 children that belong to this parent
    const level2Children = riskData.filter(r => 
      r.riskLevel === "Level 2" && r.parentRisk === parentRisk.title
    );
    
    // Get all Level 3 children of those Level 2 risks
    const level3Children = riskData.filter(r => 
      r.riskLevel === "Level 3" && level2Children.some(l2 => l2.title === r.parentRisk)
    );
    
    const allChildren = [...level2Children, ...level3Children];
    
    if (allChildren.length === 0) return null;
    
    // Controls aggregation
    const totalControls = allChildren.reduce((sum, r) => sum + r.relatedControls.length, 0);
    const automatedControls = allChildren.reduce((sum, r) => 
      sum + r.relatedControls.filter(c => c.type === 'Automated').length, 0
    );
    const manualControls = totalControls - automatedControls;
    
    // Control Effectiveness aggregation
    const effectivenessBreakdown = {
      effective: allChildren.filter(r => r.controlEffectiveness.label === 'Effective').length,
      partiallyEffective: allChildren.filter(r => r.controlEffectiveness.label === 'Partially Effective').length,
      ineffective: allChildren.filter(r => r.controlEffectiveness.label === 'Ineffective').length,
      notAssessed: allChildren.filter(r => r.controlEffectiveness.label === 'Not Assessed' || !r.controlEffectiveness.label).length,
    };
    
    // Assessment Progress aggregation
    const progressBreakdown = {
      completed: allChildren.filter(r => r.assessmentProgress?.assess === 'completed').length,
      inProgress: allChildren.filter(r => r.assessmentProgress?.assess === 'in-progress').length,
      notStarted: allChildren.filter(r => r.assessmentProgress?.assess === 'not-started' || !r.assessmentProgress?.assess).length,
    };
    
    // Status aggregation
    const statusBreakdown = {
      completed: allChildren.filter(r => r.status === 'Completed' || r.status === 'Complete').length,
      overdue: allChildren.filter(r => r.status === 'Overdue').length,
      inProgress: allChildren.filter(r => r.status === 'In Progress').length,
      pendingApproval: allChildren.filter(r => r.status === 'Pending Approval').length,
      other: allChildren.filter(r => !['Completed', 'Complete', 'Overdue', 'In Progress', 'Pending Approval'].includes(r.status)).length,
    };
    
    return {
      childCount: allChildren.length,
      level2Count: level2Children.length,
      level3Count: level3Children.length,
      totalControls,
      automatedControls,
      manualControls,
      effectivenessBreakdown,
      progressBreakdown,
      statusBreakdown,
    };
  };

  // Get risk level label based on score
  const getRiskLevelFromScore = (score: number): { level: string; color: string } => {
    if (score >= 15) return { level: 'Critical', color: 'red' };
    if (score >= 10) return { level: 'High', color: 'red' };
    if (score >= 5) return { level: 'Medium', color: 'yellow' };
    return { level: 'Low', color: 'green' };
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
      case "Pending Review": return "bg-blue-500 text-white";
      default: return "bg-cyan-500 text-white";
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
        return "bg-[#D21C1C]/20 text-[#D21C1C] border-[#D21C1C]/30";
      case "yellow":
        return "bg-[#F1BA50]/20 text-[#CE7900] border-[#F1BA50]/50 dark:bg-[#F1BA50]/20 dark:text-[#F1BA50]";
      case "green":
        return "bg-[#46AF6A]/20 text-[#46AF6A] border-[#46AF6A]/30 dark:bg-[#46AF6A]/20 dark:text-[#46AF6A]";
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
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-first-line flex items-center justify-center flex-shrink-0">
                <ClipboardCheck className="w-3 h-3 text-white" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-semibold text-[#10052F] dark:text-white truncate">
                  1st Line Risk Analyst Dashboard
                </h1>
                <p className="text-xs text-muted-foreground">
                  {selectedAssessor !== "all" 
                    ? `Viewing as: ${selectedAssessor}` 
                    : "Risk and Control Self Assessment"
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 px-3 rounded-none">
                    <User className="w-3.5 h-3.5 mr-2" />
                    1st Line Analyst
                    <ChevronDown className="w-3.5 h-3.5 ml-2" />
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
          {/* Quick Links - Left side */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#10052F] dark:text-white">
              <Link className="w-3 h-3 text-[#10052F] dark:text-white" />
              Quick Links:
            </div>
            <button onClick={() => handleQuickLinkClick("assess")} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs">
              <ClipboardCheck className="w-3 h-3" />
              <span>View My Pending Assessments</span>
            </button>
            <span className="text-gray-400 dark:text-gray-500">|</span>
            <button onClick={() => handleQuickLinkClick("own")} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs">
              <CheckCircle className="w-3 h-3" />
              <span>View Completed Assessments</span>
            </button>
            <span className="text-gray-400 dark:text-gray-500">|</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <a href="/downloads/sample-risk-import-data.csv" download className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:underline text-xs italic">
                  <FlaskConical className="w-3 h-3" />
                  <span>Download Sample Risk Data (for AI Parser Testing)</span>
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download sample risk assessment data to test the AI Document Parser feature</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          {/* Action Buttons - Right side */}
          <div className="flex items-center gap-2">
            {/* AI Document Parser Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAiDocumentModalOpen(true)}
              className="h-7 text-xs rounded-none border-primary text-primary hover:bg-primary/10 gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              AI Document Parser
            </Button>
            
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
        </div>

        {/* Scorecards - 3 columns */}
        {(() => {
          const getMetricAccentColor = (title: string) => {
            switch (title) {
              case "Assessment Status":
                return {
                  bg: "bg-[#6A75D8]/10",
                  border: "border-[#6A75D8]/20",
                  text: "text-[#6A75D8]"
                };
              case "Inherent Risk Ratings":
                return {
                  bg: "bg-[#CE7900]/10",
                  border: "border-[#CE7900]/20",
                  text: "text-[#CE7900]"
                };
              case "Control Effectiveness by Risk":
                return {
                  bg: "bg-[#0A8078]/10",
                  border: "border-[#0A8078]/20",
                  text: "text-[#0A8078]"
                };
              default:
                return {
                  bg: "bg-first-line/10",
                  border: "border-first-line/20",
                  text: "text-first-line"
                };
            }
          };

          const toggleCardExpand = (cardId: string) => {
            if (cardId === 'assessment') {
              const newShowState = !showRiskTable;
              setShowRiskTable(newShowState);
              setExpandedCard(newShowState ? 'assessment' : null);
              
              // Auto-scroll to table when showing
              if (newShowState) {
                setTimeout(() => {
                  reportSectionRef.current?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                  });
                }, 100);
              }
            } else {
              setExpandedCard(prev => prev === cardId ? null : cardId);
            }
          };

          // Placeholder data for new cards
          // Calculate N/A justifications from actual risk data
          const naJustificationsCounts = useMemo(() => {
            let pending = 0, drafted = 0, awaiting = 0, approved = 0;
            assessorFilteredRiskData.forEach(risk => {
              if (risk.naJustifications) {
                pending += risk.naJustifications.pending;
                drafted += risk.naJustifications.drafted;
                awaiting += risk.naJustifications.awaiting;
                approved += risk.naJustifications.approved;
              }
            });
            return { pending, drafted, awaiting, approved };
          }, [assessorFilteredRiskData]);
          const lossEventsCounts = { pendingTriage: 1, inTriage: 3, closed: 0 };
          const driftAlertsCounts = { critical: 1, high: 1, medium: 1 };
          const remediationTasksCounts = { open: 2, inProgress: 1, validation: 1, closed: 0 };

          // Calculate assessment percentages
          const totalAssessments = assessmentStatusCounts.total;
          const completedAssessments = assessmentStatusCounts.completed;
          const completionPercent = totalAssessments > 0 ? Math.round((completedAssessments / totalAssessments) * 100) : 0;
          const requiresAction = totalAssessments - completedAssessments;

          // Calculate control effectiveness percentage
          const totalControlRisks = controlEvidenceCounts.total;
          const effectiveControls = controlEvidenceCounts.effective;
          const effectivenessPercent = totalControlRisks > 0 ? Math.round((effectiveControls / totalControlRisks) * 100) : 0;
          const needsAttention = controlEvidenceCounts.partiallyEffective + controlEvidenceCounts.ineffective;

          // Calculate inherent risk critical+high total
          const criticalHighTotal = inherentRiskCounts.critical + inherentRiskCounts.high;

          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 mb-4">
              {/* Left Column - 50% */}
              <div className="flex flex-col gap-3">
                {/* Assessment Status Card */}
                <Card className="border border-border/50 dark:border-border shadow-sm bg-card rounded-none h-[260px]">
                  <CardContent className="p-2.5 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <CalendarCheck className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-[10px] font-bold text-[#10052F] dark:text-white uppercase tracking-wide">
                          ASSESSMENT STATUS
                        </span>
                      </div>
                      <button 
                        onClick={() => toggleCardExpand('assessment')}
                        className="flex items-center gap-2 text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-wide"
                      >
                        {showRiskTable ? 'CLICK TO COLLAPSE' : 'CLICK TO EXPAND'}
                        <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <ChevronDown className={cn("w-3 h-3 transition-transform", 
                            showRiskTable && "rotate-180")} />
                        </div>
                      </button>
                    </div>
                    
                    {/* Summary row */}
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-xl font-bold text-[#10052F] dark:text-white">{requiresAction}</span>
                        <span className="text-sm text-muted-foreground ml-1">Requiring Action</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-destructive" />
                        <span className="text-xs text-destructive font-medium">{assessmentStatusCounts.overdue} overdue</span>
                      </div>
                    </div>
                    
                    {/* Donut chart + Progress bars - Centered vertically */}
                    <div className="flex-1 flex items-center">
                      <div className="flex gap-5 items-center w-full">
                        {/* Donut chart - larger */}
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <svg viewBox="0 0 36 36" className="w-20 h-20">
                            {/* Background circle - Gray track for incomplete */}
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                            {/* Progress circle - RED for complete portion */}
                            <circle 
                              cx="18" cy="18" r="15.9" fill="none" 
                              stroke="hsl(var(--destructive))" strokeWidth="3"
                              strokeDasharray={`${completionPercent} ${100 - completionPercent}`}
                              strokeDashoffset="25"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-base font-bold text-success">{completionPercent}%</span>
                            <span className="text-[7px] text-muted-foreground uppercase">Complete</span>
                          </div>
                        </div>
                        
                        {/* Progress bars */}
                        <div className="flex-1 space-y-3">
                          {/* WORKFLOW PROGRESS - aligned with 2nd line dashboard (6 statuses) */}
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">WORKFLOW PROGRESS</span>
                            <div className="flex h-3 overflow-hidden mt-0.5 rounded-full shadow-sm">
                              {assessmentStatusCounts.sentForAssessment > 0 && (
                                <div style={{backgroundColor: WORKFLOW_COLORS.sentForAssessment, width: `${(assessmentStatusCounts.sentForAssessment / totalAssessments) * 100}%`}} className="first:rounded-l-full last:rounded-r-full" />
                              )}
                              {assessmentStatusCounts.pendingReview > 0 && (
                                <div style={{backgroundColor: WORKFLOW_COLORS.pendingReview, width: `${(assessmentStatusCounts.pendingReview / totalAssessments) * 100}%`}} className="first:rounded-l-full last:rounded-r-full" />
                              )}
                              {assessmentStatusCounts.pendingApproval > 0 && (
                                <div style={{backgroundColor: WORKFLOW_COLORS.pendingApproval, width: `${(assessmentStatusCounts.pendingApproval / totalAssessments) * 100}%`}} className="first:rounded-l-full last:rounded-r-full" />
                              )}
                              {assessmentStatusCounts.completed > 0 && (
                                <div style={{backgroundColor: WORKFLOW_COLORS.completed, width: `${(assessmentStatusCounts.completed / totalAssessments) * 100}%`}} className="first:rounded-l-full last:rounded-r-full" />
                              )}
                              {assessmentStatusCounts.overdue > 0 && (
                                <div style={{backgroundColor: WORKFLOW_COLORS.overdue, width: `${(assessmentStatusCounts.overdue / totalAssessments) * 100}%`}} className="first:rounded-l-full last:rounded-r-full" />
                              )}
                              {assessmentStatusCounts.reassigned > 0 && (
                                <div style={{backgroundColor: WORKFLOW_COLORS.reassigned, width: `${(assessmentStatusCounts.reassigned / totalAssessments) * 100}%`}} className="first:rounded-l-full last:rounded-r-full" />
                              )}
                            </div>
                          </div>
                          
                          {/* 6-segment legend in 3 columns (matching 2nd line) */}
                          <div className="grid grid-cols-3 gap-x-3 gap-y-0 text-[9px] text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full" style={{backgroundColor: WORKFLOW_COLORS.sentForAssessment}} />
                              {assessmentStatusCounts.sentForAssessment} Sent
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full" style={{backgroundColor: WORKFLOW_COLORS.pendingReview}} />
                              {assessmentStatusCounts.pendingReview} Review
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full" style={{backgroundColor: WORKFLOW_COLORS.pendingApproval}} />
                              {assessmentStatusCounts.pendingApproval} Approval
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full" style={{backgroundColor: WORKFLOW_COLORS.completed}} />
                              {assessmentStatusCounts.completed} Completed
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full" style={{backgroundColor: WORKFLOW_COLORS.overdue}} />
                              {assessmentStatusCounts.overdue} Overdue
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full" style={{backgroundColor: WORKFLOW_COLORS.reassigned}} />
                              {assessmentStatusCounts.reassigned} Reassigned
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Footer - pushed to bottom */}
                    <div className="border-t border-border pt-2 mt-auto">
                      <p className="text-[9px] text-muted-foreground">
                        Track assessment workflow stages. Address overdue and pending items promptly.
                      </p>
                      <p className="text-[8px] text-muted-foreground/70 italic mt-1 border-t border-border/20 pt-1">
                        How to read: Donut shows completion %. Progress bar shows workflow distribution. Prioritize overdue (red) and pending items first.
                      </p>
                    </div>
                    
                  </CardContent>
                </Card>


                {/* Bottom row: Loss Events | Inherent Risk Ratings - side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 flex-1">
                  {/* Loss Events & Root Cause Card */}
                  <Card className="border border-border/50 dark:border-border shadow-sm bg-card rounded-none h-full min-h-[260px]">
                    <CardContent className="p-3 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-[10px] font-bold text-[#10052F] dark:text-white uppercase tracking-wide">
                            LOSS EVENTS & ROOT CAUSE
                          </span>
                        </div>
                        <button 
                          onClick={() => togglePanel('lossEvents', lossEventsRef)}
                          className="flex items-center gap-2 text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-wide cursor-pointer"
                        >
                          EXPAND
                          <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", expandedPanel === 'lossEvents' && "rotate-180")} />
                          </div>
                        </button>
                      </div>
                      
                      {/* Main stats row */}
                      <div className="flex items-baseline gap-6 mb-4">
                        <div>
                          <span className="text-xl font-bold text-[#10052F] dark:text-white">{lossEventsData.length}</span>
                          <span className="text-xs text-muted-foreground ml-1.5">Events</span>
                        </div>
                        <div>
                          <span className="text-base font-bold text-destructive">${lossEventsStats.totalAmount.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground ml-1">Total Loss</span>
                        </div>
                      </div>
                      
                      {/* Analysis badge */}
                      <div className="flex items-center gap-2 mb-4 bg-primary/5 px-2.5 py-1.5 rounded-md border border-primary/20">
                        <Sparkles className="w-3 h-3 text-primary" />
                        <span className="text-xs text-primary font-medium">{lossEventsStats.analyzedCount}/{lossEventsStats.totalCount} AI analyzed</span>
                      </div>
                      
                      {/* Status breakdown - centered vertically */}
                      <div className="flex-1 flex items-center">
                        <div className="flex flex-wrap gap-5 text-[9px] text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-destructive" /> 
                            {lossEventsData.filter(e => e.status === "Pending").length} Pending
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-warning" /> 
                            {lossEventsData.filter(e => e.status === "Under Review" || e.status === "Escalated").length} Review
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-success" /> 
                            {lossEventsData.filter(e => e.status === "Closed").length} Closed
                          </span>
                        </div>
                      </div>
                      
                      <div className="border-t border-border mt-auto pt-2">
                        <p className="text-[9px] text-muted-foreground/70 italic">
                          Click expand to view events with AI root cause analysis.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Inherent Risk Ratings Card */}
                  <Card className="border border-border/50 dark:border-border shadow-sm bg-card rounded-none h-full min-h-[260px]">
                    <CardContent className="p-3 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <AlertTriangle className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-[10px] font-bold text-[#10052F] dark:text-white uppercase tracking-wide">
                            INHERENT RISK RATINGS
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {inherentRiskCounts.critical} crit, {inherentRiskCounts.high} high
                        </span>
                      </div>
                      
                      {/* Critical & High count */}
                      <div className="mb-4">
                        <span className="text-xl font-bold text-[#10052F] dark:text-white">{criticalHighTotal}</span>
                        <span className="text-xs text-muted-foreground ml-2">Critical & High</span>
                      </div>
                      
                      {/* Donut chart with legend - centered vertically */}
                      <div className="flex items-center justify-center gap-8 flex-1">
                        <div className="relative w-28 h-28 flex-shrink-0">
                          {(() => {
                            const circumference = 2 * Math.PI * 14;
                            const total = inherentRiskCounts.total || 1;
                            const criticalPct = inherentRiskCounts.critical / total;
                            const highPct = inherentRiskCounts.high / total;
                            const mediumPct = inherentRiskCounts.medium / total;
                            const criticalAngle = criticalPct * 360;
                            const highAngle = highPct * 360;
                            
                            return (
                              <svg viewBox="0 0 36 36" className="w-28 h-28">
                                <circle cx="18" cy="18" r="14" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                                <circle 
                                  cx="18" cy="18" r="14" fill="none" 
                                  stroke="hsl(var(--destructive))" strokeWidth="3"
                                  strokeDasharray={`${criticalPct * circumference} ${circumference}`}
                                  transform="rotate(-90 18 18)"
                                />
                                <circle 
                                  cx="18" cy="18" r="14" fill="none" 
                                  stroke="hsl(var(--warning))" strokeWidth="3"
                                  strokeDasharray={`${highPct * circumference} ${circumference}`}
                                  transform={`rotate(${criticalAngle - 90} 18 18)`}
                                />
                                <circle 
                                  cx="18" cy="18" r="14" fill="none" 
                                  stroke="hsl(var(--accent))" strokeWidth="3"
                                  strokeDasharray={`${mediumPct * circumference} ${circumference}`}
                                  transform={`rotate(${criticalAngle + highAngle - 90} 18 18)`}
                                />
                              </svg>
                            );
                          })()}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-base font-bold text-[#CE7900]">{criticalHighTotal}</span>
                            <span className="text-[8px] text-muted-foreground uppercase">CRIT+HIGH</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                            <span className="text-[9px] text-destructive font-medium">Critical</span>
                            <span className="text-[9px] font-bold text-gray-700 dark:text-gray-300">{inherentRiskCounts.critical}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-warning" />
                            <span className="text-[9px] text-warning font-medium">High</span>
                            <span className="text-[9px] font-bold text-gray-700 dark:text-gray-300">{inherentRiskCounts.high}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                            <span className="text-[9px] text-accent font-medium">Medium</span>
                            <span className="text-[9px] font-bold text-gray-700 dark:text-gray-300">{inherentRiskCounts.medium}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-border pt-2 mt-auto">
                        <p className="text-[9px] text-muted-foreground/70 italic">
                          Critical+High indicates exposure requiring strong controls.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right Column - 50% with equal height cards */}
              <div className="flex flex-col gap-3">
                {/* Control Effectiveness Card */}
                <Card className="border border-border/50 dark:border-border shadow-sm bg-card rounded-none h-[320px] overflow-hidden">
                  <CardContent className="p-2.5 pb-3 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <FileCheck className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-[10px] font-bold text-[#10052F] dark:text-white uppercase tracking-wide">
                          CONTROL EFFECTIVENESS
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{effectiveControls} effective</span>
                    </div>
                    
                    {/* "Needing Attention" on its own line */}
                    <div className="mb-2">
                      <span className="text-xl font-bold text-[#10052F] dark:text-white">{needsAttention}</span>
                      <span className="text-xs text-muted-foreground ml-2">Needing Attention</span>
                    </div>
                    
                    {/* Speedometer gauge - centered */}
                    <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                      <div className="w-44">
                        <svg viewBox="0 0 100 55" className="w-44 h-[88px]">
                          <defs>
                            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="hsl(143 57% 43%)" />
                              <stop offset="100%" stopColor="hsl(143 57% 55%)" />
                            </linearGradient>
                          </defs>
                          <path 
                            d="M 10 50 A 40 40 0 0 1 90 50" 
                            fill="none" 
                            stroke="hsl(143 30% 85%)" 
                            strokeWidth="6"
                            strokeLinecap="round"
                          />
                          <path 
                            d="M 10 50 A 40 40 0 0 1 90 50" 
                            fill="none" 
                            stroke="url(#gaugeGradient)" 
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${(effectivenessPercent / 100) * 126} 126`}
                          />
                          <line 
                            x1="50" y1="50" 
                            x2={50 + 30 * Math.cos(Math.PI - (effectivenessPercent / 100) * Math.PI)} 
                            y2={50 - 30 * Math.sin(Math.PI - (effectivenessPercent / 100) * Math.PI)}
                            stroke="hsl(143 57% 43%)" 
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <circle cx="50" cy="50" r="4" fill="hsl(143 57% 43%)" />
                        </svg>
                        <div className="flex justify-between px-3 -mt-0.5">
                          <span className="text-[8px] leading-none text-muted-foreground">0%</span>
                          <span className="text-[8px] leading-none text-muted-foreground">100%</span>
                        </div>
                      </div>
                      <div className="text-center mt-2">
                        <span className="text-xl font-bold text-success">{effectivenessPercent}%</span>
                        <span className="text-[10px] text-muted-foreground block">Effective</span>
                      </div>
                    </div>
                    
                    {/* Bottom section - pinned */}
                    <div className="mt-auto w-full flex-shrink-0">
                      {/* Horizontal Stacked Bar Chart */}
                      <div className="w-full h-[11px] flex rounded-full overflow-hidden shadow-sm bg-gray-200 dark:bg-gray-700 mt-3">
                        <div 
                          className="bg-success h-full" 
                          style={{ width: `${totalControlRisks > 0 ? (effectiveControls / totalControlRisks) * 100 : 0}%` }}
                        />
                        <div 
                          className="bg-warning h-full" 
                          style={{ width: `${totalControlRisks > 0 ? (controlEvidenceCounts.partiallyEffective / totalControlRisks) * 100 : 0}%` }}
                        />
                        <div 
                          className="bg-destructive h-full" 
                          style={{ width: `${totalControlRisks > 0 ? (controlEvidenceCounts.ineffective / totalControlRisks) * 100 : 0}%` }}
                        />
                        <div 
                          className="bg-gray-400 h-full" 
                          style={{ width: `${totalControlRisks > 0 ? 0 : 0}%` }}
                        />
                      </div>

                      {/* Legend */}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 w-full text-[9px] text-muted-foreground mt-2 mb-2">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-success" /> Effective: {effectiveControls}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-warning" /> Partial: {controlEvidenceCounts.partiallyEffective}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-destructive" /> Ineffective: {controlEvidenceCounts.ineffective}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-gray-400" /> N/A: 0
                        </span>
                      </div>
                      
                      <div className="border-t border-border pt-2">
                        <p className="text-[9px] text-muted-foreground">
                          Aggregate control effectiveness across all risks.
                        </p>
                        <p className="text-[8px] text-muted-foreground/70 italic mt-0.5">
                          How to read: Gauge shows overall %. Green=effective, orange=partial, red=ineffective.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Remediation Tasks Card */}
                <Card className="border border-border/50 dark:border-border shadow-sm bg-card rounded-none flex-1 min-h-[200px]">
                  <CardContent className="p-2.5 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <CheckSquare className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-[10px] font-bold text-[#10052F] dark:text-white uppercase tracking-wide">
                          REMEDIATION TASKS
                        </span>
                      </div>
                      <button 
                        onClick={() => togglePanel('remediation', remediationRef)}
                        className="flex items-center gap-2 text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-wide cursor-pointer"
                      >
                        EXPAND
                        <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", expandedPanel === 'remediation' && "rotate-180")} />
                        </div>
                      </button>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold text-[#10052F] dark:text-white">
                            {remediationTasksCounts.open + remediationTasksCounts.inProgress + remediationTasksCounts.validation}
                          </span>
                          <span className="text-xs text-muted-foreground">Open Tasks</span>
                        </div>
                        <span className="text-xs font-semibold text-red-500">1 critical</span>
                      </div>
                    </div>
                    
                    {/* Single segmented progress bar - centered vertically */}
                    <div className="flex-1 flex items-center">
                      {(() => {
                        const total = remediationTasksCounts.open + remediationTasksCounts.inProgress + remediationTasksCounts.validation + remediationTasksCounts.closed;
                        if (total === 0) return null;
                        
                        const segments = [
                          { label: "Open", value: remediationTasksCounts.open, color: "bg-red-500" },
                          { label: "In Progress", value: remediationTasksCounts.inProgress, color: "bg-amber-500" },
                          { label: "Validation", value: remediationTasksCounts.validation, color: "bg-blue-500" },
                          { label: "Closed", value: remediationTasksCounts.closed, color: "bg-green-500" },
                        ];
                        
                        return (
                          <div className="w-full">
                            {/* Progress bar */}
                            <div className="flex h-3 rounded-full overflow-hidden mb-2 shadow-sm">
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
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                              {segments.map((segment, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <div className={`w-2.5 h-2.5 rounded-sm ${segment.color}`} />
                                  <span className="text-[9px] font-medium text-muted-foreground">
                                    {segment.value} {segment.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    
                    <div className="border-t border-border mt-auto pt-2">
                      <p className="text-[8px] text-muted-foreground/70 italic">
                        Track remediation progress. Target zero open items.
                      </p>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>
          );
        })()}

        {/* N/A Justifications Expanded Panel */}
        {expandedPanel === 'naJustifications' && (
          <Card ref={naJustificationsRef} className="border border-border/50 shadow-md bg-card scroll-mt-24 rounded-none">
            <CardContent className="p-4">
              {/* Header with title, badges, close button */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setExpandedPanel(null)}
                    className="hover:bg-muted/50 rounded p-1"
                  >
                    <ChevronDown className="w-5 h-5 rotate-180" />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Ban className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-semibold text-lg text-foreground">N/A Controls Justifications</span>
                  <Badge variant="outline" className="text-xs">5 controls</Badge>
                  <Badge className="bg-red-500 text-white text-xs">2 pending</Badge>
                </div>
                <button 
                  onClick={() => setExpandedPanel(null)}
                  className="hover:bg-muted/50 rounded p-1"
                >
                  <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              {/* Info Banner */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-none p-3 mb-4 flex items-center gap-2">
                <Ban className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <span className="text-sm text-purple-700 dark:text-purple-300">
                  Controls marked as Not Applicable require documented justifications. Draft justifications and submit for Risk Owner approval.
                </span>
              </div>

              {/* Filter Row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search controls..." 
                      value={naSearchQuery}
                      onChange={(e) => setNaSearchQuery(e.target.value)}
                      className="pl-9 w-64 h-9"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="showApproved" 
                      checked={showApprovedNa}
                      onCheckedChange={(checked) => setShowApprovedNa(checked as boolean)}
                    />
                    <Label htmlFor="showApproved" className="text-sm cursor-pointer text-foreground">Show approved</Label>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    2 Pending
                  </span>
                  <span className="flex items-center gap-1.5 text-foreground">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    1 Drafted
                  </span>
                  <span className="flex items-center gap-1.5 text-foreground">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    1 Awaiting
                  </span>
                  <span className="flex items-center gap-1.5 text-foreground">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    1 Approved
                  </span>
                </div>
              </div>

              {/* Table */}
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[120px] text-xs font-semibold uppercase">Control ID</TableHead>
                    <TableHead className="w-[280px] text-xs font-semibold uppercase">Control Name</TableHead>
                    <TableHead className="w-[100px] text-xs font-semibold uppercase">Risk</TableHead>
                    <TableHead className="w-[140px] text-xs font-semibold uppercase">Status</TableHead>
                    <TableHead className="w-[140px] text-xs font-semibold uppercase">Drafted By</TableHead>
                    <TableHead className="w-[120px] text-xs font-semibold uppercase">Date</TableHead>
                    <TableHead className="w-[120px] text-xs font-semibold uppercase text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { id: "Control-NA-001", name: "Legacy System Check", description: null, riskId: "R-001", status: "Pending", draftedBy: null, date: null },
                    { id: "Control-NA-002", name: "Physical Access Review", description: null, riskId: "R-003", status: "Pending", draftedBy: null, date: null },
                    { id: "Control-NA-003", name: "Manual Reconciliation", description: "This control is not applicable as the process has been fully automated.", riskId: "R-004", status: "Drafted", draftedBy: "Sarah Johnson", date: "Jan 04, 2025" },
                    { id: "Control-NA-004", name: "Paper Trail Audit", description: "N/A - All documentation is now fully digital.", riskId: "R-002", status: "Awaiting Approval", draftedBy: "John Smith", date: "Jan 02, 2025" },
                    { id: "Control-NA-005", name: "Manual Backup Verification", description: "Automated cloud backups have replaced manual verification.", riskId: "R-005", status: "Approved", draftedBy: "Mike Davis", date: "Dec 28, 2024" },
                  ]
                    .filter(control => {
                      if (!showApprovedNa && control.status === "Approved") return false;
                      if (naSearchQuery) {
                        const query = naSearchQuery.toLowerCase();
                        return control.id.toLowerCase().includes(query) || 
                               control.name.toLowerCase().includes(query) ||
                               control.riskId.toLowerCase().includes(query);
                      }
                      return true;
                    })
                    .map((control) => (
                    <TableRow key={control.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-sm text-primary">{control.id}</TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium text-sm text-foreground">{control.name}</span>
                          {control.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{control.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700 text-xs">
                          {control.riskId}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {control.status === "Pending" && (
                          <Badge variant="outline" className="border-red-300 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 text-xs gap-1">
                            <Clock className="w-3 h-3" />
                            Pending
                          </Badge>
                        )}
                        {control.status === "Drafted" && (
                          <Badge variant="outline" className="border-orange-300 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 text-xs gap-1">
                            <FileText className="w-3 h-3" />
                            Drafted
                          </Badge>
                        )}
                        {control.status === "Awaiting Approval" && (
                          <Badge variant="outline" className="border-purple-300 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 text-xs gap-1">
                            <Clock className="w-3 h-3" />
                            Awaiting Approval
                          </Badge>
                        )}
                        {control.status === "Approved" && (
                          <Badge variant="outline" className="border-green-300 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 text-xs gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Approved
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {control.draftedBy ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-3 h-3 text-primary" />
                            </div>
                            <span className="text-sm text-foreground">{control.draftedBy}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {control.date || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {control.status === "Pending" && (
                            <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white gap-1">
                              <Edit2 className="w-3 h-3" />
                              Draft
                            </Button>
                          )}
                          {control.status === "Drafted" && (
                            <>
                              <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white gap-1">
                                <Send className="w-3 h-3" />
                                Submit
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                <Eye className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            </>
                          )}
                          {(control.status === "Awaiting Approval" || control.status === "Approved") && (
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Loss Events Triage Expanded Panel */}
        {expandedPanel === 'lossEvents' && (
          <Card ref={lossEventsRef} className="border border-border/50 shadow-md bg-card scroll-mt-24 rounded-none">
            <CardContent className="p-4">
              {/* Header with title, badges, close button */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setExpandedPanel(null)}
                    className="hover:bg-muted/50 rounded p-1"
                  >
                    <ChevronDown className="w-5 h-5 rotate-180" />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-semibold text-lg text-foreground">Loss Events & Root Cause Analysis</span>
                  <Badge variant="outline" className="text-xs">{lossEventsData.length} events</Badge>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{lossEventsStats.analyzedCount} analyzed</Badge>
                  <Badge className="bg-red-500 text-white text-xs">{lossEventsStats.pendingCount} pending</Badge>
                </div>
                <button 
                  onClick={() => setExpandedPanel(null)}
                  className="hover:bg-muted/50 rounded p-1"
                >
                  <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              {/* Summary Stats Banner */}
              <div className="bg-muted/30 border border-border rounded-none p-3 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total Loss:</span>
                    <span className="text-lg font-bold text-foreground">${lossEventsStats.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="h-6 w-px bg-border" />
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      {lossEventsData.filter(e => e.status === "Pending").length} Pending
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      {lossEventsData.filter(e => e.status === "Under Review" || e.status === "Escalated").length} Under Review
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      {lossEventsData.filter(e => e.status === "Closed").length} Closed
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{lossEventsStats.analyzedCount} of {lossEventsStats.totalCount} events have AI root cause analysis</span>
                </div>
              </div>

              {/* Info Banner */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-none p-3 mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Click on any event row to view the AI-analyzed causal chain showing root cause, contributing factors, failed controls, and recommendations.
                </span>
              </div>

              {/* Filter Row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search events..." 
                      value={lossEventSearchQuery}
                      onChange={(e) => setLossEventSearchQuery(e.target.value)}
                      className="pl-9 w-64 h-9"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="showClosed" 
                      checked={showClosedLossEvents}
                      onCheckedChange={(checked) => setShowClosedLossEvents(checked as boolean)}
                    />
                    <Label htmlFor="showClosed" className="text-sm cursor-pointer text-foreground">Show closed</Label>
                  </div>
                </div>
                <Button variant="outline" className="gap-2 text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  Run AI Analysis on All
                </Button>
              </div>

              {/* Table with Expandable Rows */}
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead className="w-[120px] text-xs font-semibold uppercase">Event ID</TableHead>
                    <TableHead className="w-[280px] text-xs font-semibold uppercase">Description</TableHead>
                    <TableHead className="w-[100px] text-xs font-semibold uppercase">Amount</TableHead>
                    <TableHead className="w-[120px] text-xs font-semibold uppercase">Business Unit</TableHead>
                    <TableHead className="w-[140px] text-xs font-semibold uppercase">Status</TableHead>
                    <TableHead className="w-[100px] text-xs font-semibold uppercase">Date</TableHead>
                    <TableHead className="w-[100px] text-xs font-semibold uppercase text-center">Analysis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lossEventsData
                    .filter(event => {
                      if (!showClosedLossEvents && event.status === "Closed") return false;
                      if (lossEventSearchQuery) {
                        const query = lossEventSearchQuery.toLowerCase();
                        return event.id.toLowerCase().includes(query) || 
                               event.description.toLowerCase().includes(query);
                      }
                      return true;
                    })
                    .map((event) => (
                    <React.Fragment key={event.id}>
                      {/* Main Row */}
                      <TableRow 
                        className={cn(
                          "hover:bg-muted/30 cursor-pointer transition-colors",
                          expandedLossEventRows.has(event.id) && "bg-muted/20 border-b-0"
                        )}
                        onClick={() => event.rootCause && toggleLossEventRow(event.id)}
                      >
                        <TableCell className="py-3">
                          {event.rootCause ? (
                            <ChevronDown className={cn(
                              "w-4 h-4 text-muted-foreground transition-transform duration-200",
                              expandedLossEventRows.has(event.id) && "rotate-180"
                            )} />
                          ) : (
                            <span className="w-4 h-4" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-primary font-medium">{event.id}</TableCell>
                        <TableCell>
                          <span className="font-medium text-sm text-foreground">{event.description}</span>
                        </TableCell>
                        <TableCell className="font-semibold text-sm text-foreground">{event.amount}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{event.businessUnit}</TableCell>
                        <TableCell>
                          {event.status === "Pending" && (
                            <Badge variant="outline" className="border-red-300 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 text-xs gap-1">
                              <Clock className="w-3 h-3" />
                              Pending
                            </Badge>
                          )}
                          {event.status === "Under Review" && (
                            <Badge variant="outline" className="border-orange-300 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 text-xs gap-1">
                              <Activity className="w-3 h-3" />
                              Under Review
                            </Badge>
                          )}
                          {event.status === "Escalated" && (
                            <Badge variant="outline" className="border-purple-300 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 text-xs gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Escalated
                            </Badge>
                          )}
                          {event.status === "Closed" && (
                            <Badge variant="outline" className="border-green-300 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 text-xs gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Closed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {event.date}
                        </TableCell>
                        <TableCell className="text-center">
                          {event.rootCause ? (
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs gap-1">
                              <Sparkles className="w-3 h-3" />
                              Analyzed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground text-xs">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Expanded Inline Causal Chain */}
                      {expandedLossEventRows.has(event.id) && event.rootCause && (
                        <TableRow className="bg-muted/10 hover:bg-muted/10">
                          <TableCell colSpan={8} className="p-0">
                            <div className="p-6 border-t border-border/50">
                              <div className="max-w-4xl mx-auto space-y-4">
                                {/* ROOT CAUSE Section */}
                                <div className="border-2 border-red-300 dark:border-red-700 rounded-lg p-4 bg-red-50/50 dark:bg-red-900/20">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                                      <AlertCircle className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="font-bold text-red-700 dark:text-red-400 uppercase text-sm">Root Cause</span>
                                  </div>
                                  <p className="text-sm text-red-600 dark:text-red-400/80">
                                    {event.rootCause.summary}
                                  </p>
                                </div>

                                {/* Arrow Connector */}
                                <div className="flex justify-center py-1">
                                  <div className="flex flex-col items-center">
                                    <div className="w-0.5 h-4 border-l-2 border-dashed border-muted-foreground/40" />
                                    <ChevronDown className="w-4 h-4 text-muted-foreground/40 -mt-1" />
                                  </div>
                                </div>

                                {/* CONTRIBUTING FACTORS Section */}
                                <div className="border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-4 bg-yellow-50/50 dark:bg-yellow-900/20">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                                        <Target className="w-4 h-4 text-white" />
                                      </div>
                                      <span className="font-bold text-yellow-700 dark:text-yellow-400 uppercase text-sm">Contributing Factors</span>
                                    </div>
                                    <Badge className="rounded-full bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600">{event.rootCause.contributingFactors.length}</Badge>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {event.rootCause.contributingFactors.map((factor, idx) => (
                                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-200 text-sm rounded-full border border-yellow-300 dark:border-yellow-600">
                                        <span className="w-5 h-5 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center font-semibold">{idx + 1}</span>
                                        {factor}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {/* Arrow Connector */}
                                <div className="flex justify-center py-1">
                                  <div className="flex flex-col items-center">
                                    <div className="w-0.5 h-4 border-l-2 border-dashed border-muted-foreground/40" />
                                    <ChevronDown className="w-4 h-4 text-muted-foreground/40 -mt-1" />
                                  </div>
                                </div>

                                {/* FAILED CONTROLS Section */}
                                <div className="border-2 border-purple-300 dark:border-purple-700 rounded-lg p-4 bg-purple-50/50 dark:bg-purple-900/20">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                                        <XCircle className="w-4 h-4 text-white" />
                                      </div>
                                      <span className="font-bold text-purple-700 dark:text-purple-400 uppercase text-sm">Failed Controls</span>
                                    </div>
                                    <Badge className="rounded-full bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-600">{event.rootCause.failedControls.length}</Badge>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {event.rootCause.failedControls.map((control, idx) => (
                                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-800/50 text-purple-800 dark:text-purple-200 text-sm rounded-full border border-purple-300 dark:border-purple-600">
                                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-300">{control.id}</span>
                                        {control.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {/* Arrow Connector */}
                                <div className="flex justify-center py-1">
                                  <div className="flex flex-col items-center">
                                    <div className="w-0.5 h-4 border-l-2 border-dashed border-muted-foreground/40" />
                                    <ChevronDown className="w-4 h-4 text-muted-foreground/40 -mt-1" />
                                  </div>
                                </div>

                                {/* RECOMMENDATIONS Section */}
                                <div className="border-2 border-green-300 dark:border-green-700 rounded-lg p-4 bg-green-50/50 dark:bg-green-900/20">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                        <Lightbulb className="w-4 h-4 text-white" />
                                      </div>
                                      <span className="font-bold text-green-700 dark:text-green-400 uppercase text-sm">Recommendations</span>
                                    </div>
                                    <Badge className="rounded-full bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600">{event.rootCause.recommendations.length}</Badge>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {event.rootCause.recommendations.map((rec, idx) => (
                                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-200 text-sm rounded-full border border-green-300 dark:border-green-600">
                                        <span className="w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-semibold">{idx + 1}</span>
                                        {rec}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {/* Event Details Footer */}
                                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span><strong>Linked Risk:</strong> {event.linkedRisk}</span>
                                    <span><strong>Business Unit:</strong> {event.businessUnit}</span>
                                    <span><strong>Date:</strong> {event.date}</span>
                                  </div>
                                  <Button size="sm" variant="outline" className="gap-2 text-xs">
                                    <Eye className="w-3.5 h-3.5" />
                                    View Full Details
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Control Drift Alerts Expanded Panel */}
        {expandedPanel === 'driftAlerts' && (
          <Card ref={driftAlertsRef} className="border-[3px] border-border/50 dark:border-border shadow-md bg-card rounded-none scroll-mt-24">
            {/* Header */}
            <CardHeader className="border-b border-border/50 space-y-0 py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setExpandedPanel(null)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <ChevronUp className="w-5 h-5 text-foreground" />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-base font-semibold text-foreground">
                    Control Drift Alerts
                  </span>
                  <Badge variant="outline" className="text-[10px] font-medium">
                    3 alerts
                  </Badge>
                  <Badge className="text-[10px] font-medium bg-destructive/10 text-destructive border-destructive/20">
                    1 critical
                  </Badge>
                </div>
                <button 
                  onClick={() => setExpandedPanel(null)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            </CardHeader>
            
            {/* Info Banner */}
            <div className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-800/50 px-4 py-2 rounded-none">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  Drift alerts highlight discrepancies between automated control testing results and manual RCSA assessments. Review and resolve to maintain control integrity.
                </p>
              </div>
            </div>
            
            {/* Filter Row */}
            <div className="bg-muted/20 border-b border-border/50 px-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search controls..." 
                    className="border-0 bg-transparent h-8 py-0 text-xs w-48 focus-visible:ring-0 placeholder:text-muted-foreground" 
                    value={driftAlertSearchQuery}
                    onChange={(e) => setDriftAlertSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-4 text-[10px] text-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-destructive"></span>
                    1 Critical
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-warning"></span>
                    1 High
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent"></span>
                    1 Medium
                  </span>
                </div>
              </div>
            </div>
            
            {/* Table */}
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-foreground py-2 px-3">Control ID</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-foreground py-2 px-3">Control Name</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-foreground py-2 px-3">RCSA Status</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-foreground py-2 px-3">Auto Test</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-foreground py-2 px-3">Variance</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-foreground py-2 px-3">Test Source</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-foreground py-2 px-3">Last Updated</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-foreground py-2 px-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { 
                      id: "Control-015", 
                      name: "Access Management", 
                      risk: "Cybersecurity Threat",
                      rcsaStatus: "Effective",
                      autoTest: "Fail",
                      variance: "Critical",
                      testSource: "SOX Testing",
                      lastUpdated: "Jan 07, 2025"
                    },
                    { 
                      id: "Control-023", 
                      name: "Transaction Monitoring", 
                      risk: "Operational Process Failure",
                      rcsaStatus: "Effective",
                      autoTest: "Partial",
                      variance: "High",
                      testSource: "GRC Automation",
                      lastUpdated: "Jan 05, 2025"
                    },
                    { 
                      id: "Control-008", 
                      name: "Change Management Review", 
                      risk: "Regulatory Compliance",
                      rcsaStatus: "Partial",
                      autoTest: "Fail",
                      variance: "Medium",
                      testSource: "Continuous Monitoring",
                      lastUpdated: "Jan 03, 2025"
                    }
                  ]
                  .filter(alert => 
                    !driftAlertSearchQuery.trim() || 
                    alert.name.toLowerCase().includes(driftAlertSearchQuery.toLowerCase()) ||
                    alert.id.toLowerCase().includes(driftAlertSearchQuery.toLowerCase())
                  )
                  .map((alert) => (
                    <TableRow key={alert.id} className="hover:bg-muted/20">
                      <TableCell className="text-xs font-medium text-foreground py-2 px-3">
                        {alert.id}
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <div>
                          <div className="text-xs font-medium text-foreground">{alert.name}</div>
                          <div className="text-[10px] text-muted-foreground">{alert.risk}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <Badge className={cn(
                          "text-[10px] font-medium",
                          alert.rcsaStatus === "Effective" 
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-warning/10 text-warning border-warning/20"
                        )}>
                          {alert.rcsaStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <Badge className={cn(
                          "text-[10px] font-medium",
                          alert.autoTest === "Fail" 
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : "bg-warning/10 text-warning border-warning/20"
                        )}>
                          {alert.autoTest}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <Badge className={cn(
                          "text-[10px] font-medium",
                          alert.variance === "Critical" && "bg-destructive/10 text-destructive border-destructive/20",
                          alert.variance === "High" && "bg-warning/10 text-warning border-warning/20",
                          alert.variance === "Medium" && "bg-accent/10 text-accent border-accent/20"
                        )}>
                          {alert.variance}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <Badge variant="outline" className="text-[10px] font-medium text-foreground">
                          {alert.testSource}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-foreground py-2 px-3">
                        {alert.lastUpdated}
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            size="sm" 
                            className="h-7 px-2 text-[10px] bg-success hover:bg-success/90 text-white"
                            onClick={() => toast.success(`Resolving drift for ${alert.name}`)}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Resolve
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Remediation Tasks Expanded Panel */}
        {expandedPanel === 'remediation' && (
          <Card ref={remediationRef} className="border border-border/50 shadow-md bg-card scroll-mt-24 rounded-none">
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setExpandedPanel(null)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <CheckSquare className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">My Remediation Tasks</h3>
                  <Badge variant="outline" className="text-xs">3 active</Badge>
                  <Badge className="text-xs bg-destructive text-white">4 overdue</Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setExpandedPanel(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Filter Row */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    value={remediationSearchQuery}
                    onChange={(e) => setRemediationSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="showCompleted" 
                      checked={showCompletedTasks}
                      onCheckedChange={(checked) => setShowCompletedTasks(!!checked)}
                    />
                    <Label htmlFor="showCompleted" className="text-xs text-foreground cursor-pointer">
                      Show completed
                    </Label>
                  </div>
                </div>
              </div>

              {/* Remediation Tasks Table */}
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold uppercase text-foreground py-2 px-3">Task ID</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-foreground py-2 px-3">Description</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-foreground py-2 px-3">Priority</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-foreground py-2 px-3">Due Date</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-foreground py-2 px-3">Status</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-foreground py-2 px-3">Linked Control</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-foreground py-2 px-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { 
                      id: "RT-001", 
                      description: "Implement dual-authorization for high-value transactions",
                      risk: "Cybersecurity Threat",
                      priority: "Critical",
                      dueDate: "Jan 14, 2025",
                      isOverdue: true,
                      status: "Open",
                      linkedControl: "Access Management"
                    },
                    { 
                      id: "RT-002", 
                      description: "Update vendor risk assessment documentation",
                      risk: "Third-Party Vendor Risk",
                      priority: "High",
                      dueDate: "Jan 19, 2025",
                      isOverdue: true,
                      status: "In Progress",
                      linkedControl: "Vendor Due Diligence"
                    },
                    { 
                      id: "RT-003", 
                      description: "Deploy automated transaction monitoring alerts",
                      risk: "Operational Process Failure",
                      priority: "High",
                      dueDate: "Jan 09, 2025",
                      isOverdue: true,
                      status: "Open",
                      linkedControl: "Transaction Monitoring"
                    },
                    { 
                      id: "RT-004", 
                      description: "Complete quarterly access review",
                      risk: "Cybersecurity Threat",
                      priority: "Medium",
                      dueDate: "Jan 31, 2025",
                      isOverdue: true,
                      status: "Pending Validation",
                      linkedControl: "Access Review"
                    }
                  ]
                    .filter(task => {
                      if (!remediationSearchQuery.trim()) return true;
                      const query = remediationSearchQuery.toLowerCase();
                      return task.id.toLowerCase().includes(query) || 
                             task.description.toLowerCase().includes(query) ||
                             task.linkedControl.toLowerCase().includes(query);
                    })
                    .map((task) => (
                    <TableRow key={task.id} className="hover:bg-muted/50">
                      <TableCell className="text-xs font-medium text-primary py-2 px-3">
                        {task.id}
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <div>
                          <p className="text-xs font-medium text-success">{task.description}</p>
                          <p className="text-[10px] text-muted-foreground">Risk: {task.risk}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[10px] font-medium bg-transparent",
                            task.priority === "Critical" && "border-red-500 text-red-600",
                            task.priority === "High" && "border-amber-500 text-amber-600",
                            task.priority === "Medium" && "border-yellow-500 text-yellow-600"
                          )}
                        >
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-foreground">{task.dueDate}</span>
                          {task.isOverdue && (
                            <Badge className="text-[10px] bg-red-500 text-white">
                              Overdue
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[10px] font-medium flex items-center gap-1 w-fit",
                            task.status === "Open" && "border-red-200 bg-white dark:bg-transparent text-red-600",
                            task.status === "In Progress" && "border-blue-200 bg-white dark:bg-transparent text-blue-600",
                            task.status === "Pending Validation" && "border-green-200 bg-green-100 dark:bg-green-900/20 text-green-700"
                          )}
                        >
                          {task.status === "Open" && <AlertTriangle className="w-3 h-3" />}
                          {task.status === "In Progress" && <Clock className="w-3 h-3" />}
                          {task.status === "Pending Validation" && <CheckCircle className="w-3 h-3" />}
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <div className="flex items-center gap-1 text-xs text-foreground">
                          <Link className="w-3 h-3 text-muted-foreground" />
                          {task.linkedControl}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <div className="flex items-center justify-end gap-1">
                          {task.status === "Open" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-7 px-2 text-[10px] border-success text-success hover:bg-success/10"
                              onClick={() => toast.success(`Starting task ${task.id}`)}
                            >
                              Start
                            </Button>
                          )}
                          {task.status === "In Progress" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-7 px-2 text-[10px] border-success text-success hover:bg-success/10"
                              onClick={() => toast.success(`Submitting task ${task.id}`)}
                            >
                              Submit
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Active Risk Profile Section */}
        {showRiskTable && (
        <Card ref={reportSectionRef} className="border-[3px] border-border/50 dark:border-border shadow-sm bg-white dark:bg-card rounded-none scroll-mt-24">
          {/* Title Bar with Tabs */}
          <CardHeader className="border-b border-border/50 space-y-0 py-0 px-0 bg-muted/30">
            <div className="flex items-center justify-between h-12">
              {/* Left: Title */}
              <div className="flex items-center gap-1.5 px-4">
                <span className="text-base font-semibold text-[#10052F] dark:text-white">
                  My Risk Assessments
                </span>
                <span className="text-base text-[#10052F] dark:text-white">
                  ({assessorFilteredRiskData.filter(r => r.tabCategory === activeTab).length})
                </span>
              </div>
              {/* Right: Close Button */}
              <button 
                onClick={() => {
                  setShowRiskTable(false);
                  setExpandedCard(null);
                }}
                className="mr-4 p-1.5 hover:bg-muted/50 rounded-full transition-colors"
                title="Close table"
              >
                <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </CardHeader>

          {/* Tabs Row */}
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
                Completed Assessments ({assessorFilteredRiskData.filter(r => r.tabCategory === "own").length})
              </button>
              <button
                onClick={() => setActiveTab("assess")}
                className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wide border transition-all ${
                  activeTab === "assess"
                    ? "bg-primary text-white border-primary"
                    : "bg-transparent text-primary border-primary hover:bg-primary/10"
                } ${highlightedTab === "assess" ? "animate-tab-flash animate-tab-pulse ring-2 ring-primary/50 ring-offset-2" : ""}`}
              >
                Risks to Assess ({assessorFilteredRiskData.filter(r => r.tabCategory === "assess").length})
              </button>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-indigo-50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-800/50 px-4 py-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-indigo-600 dark:text-indigo-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-800 dark:text-indigo-200">
                {activeTab === "own" && "These completed risk assessments can be edited. Click the edit icon to update any field values as needed."}
                {activeTab === "assess" && "These risks require your assessment input. Complete inherent risk ratings, document control evidence, and identify any gaps or weaknesses."}
              </p>
            </div>
          </div>

          {/* Filter Bar */}
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
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); if (val !== "all") setDeadlineFilter("all"); }}>
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
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="pending-approval">Pending Approval</SelectItem>
                        <SelectItem value="review-challenge">Review/Challenge</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Risk Hierarchy Filter */}
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
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
              {(statusFilter !== "all" || riskLevelFilter !== "all" || businessUnitFilter !== "all" || searchQuery.trim()) && (
                <button
                  className="text-xs uppercase tracking-wide font-medium text-first-line hover:text-first-line/80"
                  onClick={() => {
                    setStatusFilter("all");
                    setDeadlineFilter("all");
                    setRiskLevelFilter("all");
                    setRiskIdFilter("all");
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
                  Showing {visibleRisks.length} of {totalTabRisks} risk(s)
                </span>
              </div>
            </div>
          </div>

          <CardContent className="p-0">

            {/* Bulk Action Toolbar */}
            {selectedRisks.size > 0 && (
              <div className="mx-4 mt-3 p-3 bg-first-line/5 border border-first-line/20 rounded-none shadow-sm animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="font-medium rounded-none">
                      {selectedRisks.size} risk{selectedRisks.size !== 1 ? 's' : ''} selected
                    </Badge>
                    <button 
                      onClick={clearSelection}
                      className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      <X className="w-3 h-3" />
                      Clear selection
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 border-primary/50 text-primary hover:bg-primary/10 rounded-none"
                      onClick={startReviewMode}
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      Review Selected
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 border-primary/50 text-primary hover:bg-primary/10 rounded-none"
                      onClick={() => setActionDialog({ open: true, type: "collaborate", riskId: Array.from(selectedRisks).join(",") })}
                    >
                      <UsersIcon className="w-4 h-4 mr-1.5" />
                      Collaborate
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 border-primary/50 text-primary hover:bg-primary/10 rounded-none"
                      onClick={() => setActionDialog({ open: true, type: "reassign", riskId: Array.from(selectedRisks).join(",") })}
                    >
                      <UserPlus className="w-4 h-4 mr-1.5" />
                      Reassign
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 border-primary/50 text-primary hover:bg-primary/10 rounded-none"
                      onClick={() => setDirectAssessmentModalOpen(true)}
                    >
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      Find Risks in Document
                    </Button>
                    <Button
                      size="sm" 
                      className="h-8 bg-primary hover:bg-primary/90 text-white rounded-none"
                      onClick={handleSubmitForReview}
                    >
                      <Send className="w-4 h-4 mr-1.5" />
                      Submit for Review
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="border-collapse">
                  <TableHeader className="bg-muted/50 sticky top-0">
                    <TableRow>
                      {activeTab !== "own" && (
                        <TableHead className="w-14 min-w-[56px] py-1 border-r border-b border-border">
                          <div className="flex items-center justify-center px-2">
                            <Checkbox 
                              checked={visibleRisks.length > 0 && selectedRisks.size === visibleRisks.length}
                              onCheckedChange={toggleSelectAll}
                            />
                          </div>
                        </TableHead>
                      )}
                      <TableHead className="w-16 min-w-[64px] py-1 border-r border-b border-border text-xs text-center">Edit</TableHead>
                      <TableHead className="min-w-[280px] py-1 border-r border-b border-border text-xs">Risk ID / Title</TableHead>
                      <TableHead className="min-w-[140px] py-1 border-r border-b border-border text-xs">Risk Hierarchy</TableHead>
                      <TableHead className="min-w-[120px] py-1 border-r border-b border-border text-xs">Due Date</TableHead>
                      {activeTab === "own" && (
                        <TableHead className="min-w-[140px] py-1 border-r border-b border-border text-xs">Completion Date</TableHead>
                      )}
                      <TableHead className="min-w-[200px] py-1 border-r border-b border-border text-xs">Assessment Progress</TableHead>
                      <TableHead className="min-w-[140px] py-1 border-r border-b border-border text-xs">Business Unit</TableHead>
                      <TableHead className="min-w-[180px] py-1 border-r border-b border-border text-xs">Assessors/Collaborators</TableHead>
                      <TableHead className="min-w-[140px] py-1 border-r border-b border-border text-xs">Last Assessed Date</TableHead>
                      <TableHead className="min-w-[200px] py-1 border-r border-b border-border text-xs">Inherent Risk</TableHead>
                      <TableHead className="min-w-[200px] py-1 border-r border-b border-border text-xs">Residual Risk</TableHead>
                      <TableHead className="min-w-[200px] py-1 border-r border-b border-border text-xs">Related Controls</TableHead>
                      <TableHead className="min-w-[200px] py-1 border-r border-b border-border text-xs">Calculated Control Effectiveness</TableHead>
                      <TableHead className="min-w-[140px] py-1 border-r border-b border-border text-xs">N/A Justifications</TableHead>
                      <TableHead className="min-w-[180px] py-1 border-r border-b border-border text-xs">Control Test Results</TableHead>
                      <TableHead className="min-w-[160px] py-1 border-b border-border text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleRisks.map((risk, index) => {
                      const isLevel1 = risk.riskLevel === "Level 1";
                      const isLevel3 = risk.riskLevel === "Level 3";
                      const isExpanded = expandedRows.has(risk.id);
                      const canExpand = hasChildren(risk);
                      const inherentAgg = calculateAggregatedRisk(risk, 'inherent');
                      const residualAgg = calculateAggregatedRisk(risk, 'residual');
                      const level1Agg = calculateLevel1Aggregations(risk);
                      
                      return (
                      <TableRow key={index} className={cn(
                        "hover:bg-muted/50 transition-all duration-200",
                        risk.riskLevel === "Level 1" && 'bg-[#6A75D8]/5 dark:bg-[#6A75D8]/10',
                        risk.riskLevel === "Level 2" && 'bg-[#A361CF]/5 dark:bg-[#A361CF]/10',
                        risk.riskLevel === "Level 3" && 'bg-[#F1BA50]/5 dark:bg-[#F1BA50]/10',
                        // Hierarchy indentation styling for dropdown rows
                        risk.riskLevel === "Level 2" && hierarchyViewMode === "level1" && "border-l-4 border-l-blue-500 animate-fade-in",
                        risk.riskLevel === "Level 3" && hierarchyViewMode === "level1" && "border-l-4 border-l-orange-500 animate-fade-in",
                        risk.riskLevel === "Level 3" && hierarchyViewMode === "level2" && "border-l-4 border-l-orange-500 animate-fade-in"
                      )}>
                        {activeTab !== "own" && (
                          <TableCell className="w-14 min-w-[56px] py-2 border-r border-b border-border">
                            <div className="flex items-center justify-center px-2">
                              <Checkbox 
                                checked={selectedRisks.has(risk.id)}
                                onCheckedChange={() => toggleRiskSelection(risk.id)}
                              />
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="py-2 border-r border-b border-border">
                          {(risk.status === "Completed" || risk.status === "Complete" || risk.status === "Closed") && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    className="p-1.5 rounded-md bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 transition-colors"
                                    onClick={() => handleUpdateClosedAssessment(risk.id)}
                                  >
                                    <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit completed assessment</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="flex items-start gap-1.5">
                            {/* Expand/collapse button - only for Level 1 with children */}
                            {hierarchyViewMode === "level1" && risk.riskLevel === "Level 1" && canExpand && (
                              <button
                                onClick={() => toggleRow(risk.id)}
                                className="p-0.5 hover:bg-muted rounded transition-colors flex-shrink-0 mt-0.5"
                              >
                                <ChevronRight className={cn(
                                  "w-3 h-3 text-muted-foreground transition-transform duration-200",
                                  isExpanded && "rotate-90"
                                )} />
                              </button>
                            )}
                            
                            {/* Spacer for Level 1 without children */}
                            {hierarchyViewMode === "level1" && risk.riskLevel === "Level 1" && !canExpand && (
                              <div className="w-4" />
                            )}
                            
                            {/* Level 2 expand button (when viewing by Level 1) - to expand Level 3 children */}
                            {hierarchyViewMode === "level1" && risk.riskLevel === "Level 2" && canExpand && (
                              <button
                                onClick={() => toggleRow(risk.id)}
                                className="p-0.5 hover:bg-muted rounded transition-colors flex-shrink-0 mt-0.5"
                              >
                                <ChevronRight className={cn(
                                  "w-3 h-3 text-muted-foreground transition-transform duration-200",
                                  isExpanded && "rotate-90"
                                )} />
                              </button>
                            )}

                            {/* Level 2 spacer (when viewing by Level 1 and no children) */}
                            {hierarchyViewMode === "level1" && risk.riskLevel === "Level 2" && !canExpand && (
                              <div className="w-4" />
                            )}
                            
                            {/* Level 2 expand button (when viewing by Level 2) */}
                            {hierarchyViewMode === "level2" && risk.riskLevel === "Level 2" && canExpand && (
                              <button
                                onClick={() => toggleRow(risk.id)}
                                className="p-0.5 hover:bg-muted rounded transition-colors flex-shrink-0 mt-0.5"
                              >
                                <ChevronRight className={cn(
                                  "w-3 h-3 text-muted-foreground transition-transform duration-200",
                                  isExpanded && "rotate-90"
                                )} />
                              </button>
                            )}
                            
                            {/* Spacer + tree indicator for Level 3 */}
                            {hierarchyViewMode === "level1" && risk.riskLevel === "Level 3" && (
                              <>
                                <div className="w-4" />
                                <span className="text-orange-500 dark:text-orange-400 font-light text-sm leading-none mt-0.5">└</span>
                              </>
                            )}
                            {hierarchyViewMode === "level2" && risk.riskLevel === "Level 3" && (
                              <>
                                <div className="w-4" />
                                <span className="text-orange-500 dark:text-orange-400 font-light text-sm leading-none mt-0.5">└</span>
                              </>
                            )}
                            
                            {/* Main content wrapper */}
                            <div className="flex flex-col gap-2">
                              {/* Risk Title and Info */}
                              <div className="flex flex-col gap-1">
                                <span className="font-mono text-xs text-[#10052F] dark:text-white">{risk.id}</span>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button 
                                      onClick={() => handleRiskNameClick(risk)}
                                      className="text-left hover:text-primary transition-colors font-medium hover:underline cursor-pointer text-blue-600 dark:text-blue-400"
                                    >
                                      {risk.title}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Click to view risk assessment and open challenges/issues.</p>
                                  </TooltipContent>
                                </Tooltip>
                                <span className="text-xs text-muted-foreground">{risk.owner}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium inline-block w-fit text-[#10052F] dark:text-white ${getCategoryColor(risk.category)}`}>
                                  {risk.category}
                                </span>
                              </div>
                              
                            </div>
                          </div>
                        </TableCell>
                        {/* Risk Hierarchy - moved next to Risk Title */}
                        <TableCell className="py-2 border-r border-b border-border align-middle">
                          <Badge variant="outline" className={`text-xs ${getRiskLevelColor(risk.riskLevel)}`}>
                            {risk.riskLevel}
                          </Badge>
                        </TableCell>
                        {/* Due Date */}
                        <TableCell className="py-2 border-r border-b border-border">
                          {(() => {
                            const dueDate = new Date(risk.dueDate);
                            const completionDate = risk.completionDate ? new Date(risk.completionDate) : null;
                            const today = new Date();
                            
                            // Overdue if: completed after due date, OR not completed and due date has passed
                            const isOverdue = completionDate 
                              ? completionDate > dueDate 
                              : dueDate < today;
                              
                            return (
                              <>
                                <div className={`text-sm font-medium ${isOverdue ? 'text-destructive' : 'text-[#10052F] dark:text-white'}`}>
                                  {format(dueDate, 'MMM dd, yyyy')}
                                </div>
                                {isOverdue && (
                                  <Badge variant="destructive" className="text-xs mt-1">Overdue</Badge>
                                )}
                              </>
                            );
                          })()}
                        </TableCell>
                        {/* Completion Date - moved next to Due Date, only for "own" tab */}
                        {activeTab === "own" && (
                          <TableCell className="py-2 border-r border-b border-border">
                            {risk.completionDate ? (
                              <div className="flex items-center gap-2">
                                <CalendarCheck className="w-4 h-4 text-green-500" />
                                <span className="text-sm text-[#10052F] dark:text-white">{format(new Date(risk.completionDate), 'MMM dd, yyyy')}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                        )}
                        {/* Assessment Progress */}
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="space-y-1">
                            <div className="flex gap-1">
                              <div className={`h-2 flex-1 rounded-sm ${
                                risk.assessmentProgress?.assess === "completed" ? "bg-[#46AF6A]" :
                                risk.assessmentProgress?.assess === "in-progress" ? "bg-[#CE7900]" :
                                "bg-[#8B5993]/30 dark:bg-[#8B5993]/50"
                              }`} />
                              <div className={`h-2 flex-1 rounded-sm ${
                                risk.assessmentProgress?.reviewChallenge === "completed" ? "bg-[#46AF6A]" :
                                risk.assessmentProgress?.reviewChallenge === "in-progress" ? "bg-[#CE7900]" :
                                "bg-[#8B5993]/30 dark:bg-[#8B5993]/50"
                              }`} />
                              <div className={`h-2 flex-1 rounded-sm ${
                                risk.assessmentProgress?.approve === "completed" ? "bg-[#46AF6A]" :
                                risk.assessmentProgress?.approve === "in-progress" ? "bg-[#CE7900]" :
                                "bg-[#8B5993]/30 dark:bg-[#8B5993]/50"
                              }`} />
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Assess</span>
                              <span>Review</span>
                              <span>Approve</span>
                            </div>
                            {level1Agg && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded mt-1">
                                      <span className="text-[#10052F] dark:text-white font-medium">{level1Agg.progressBreakdown.completed}</span>
                                      <span className="text-[#10052F] dark:text-white">/</span>
                                      <span className="text-[#10052F] dark:text-white">{level1Agg.childCount}</span>
                                      <span className="ml-1">completed</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-xs space-y-1">
                                      <p className="font-medium">Assessment Progress Summary ({level1Agg.childCount} risks)</p>
                                      <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-[#46AF6A] rounded-sm"></span>
                                        <span>Completed: {level1Agg.progressBreakdown.completed}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-[#CE7900] rounded-sm"></span>
                                        <span>In Progress: {level1Agg.progressBreakdown.inProgress}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-[#8B5993] rounded-sm"></span>
                                        <span>Not Started: {level1Agg.progressBreakdown.notStarted}</span>
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        {/* Business Unit */}
                        <TableCell className="py-2 border-r border-b border-border">
                          <Badge variant="outline" className="text-[10px] font-medium bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 text-[#10052F] dark:text-white">
                            {risk.businessUnit}
                          </Badge>
                        </TableCell>
                        {/* Assessors */}
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="flex flex-col gap-1">
                            {risk.assessors.slice(0, 2).map((assessor, idx) => {
                              const initials = assessor.split(' ').map(n => n[0]).join('');
                              return (
                                <TooltipProvider key={idx}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-2">
                                        <div className="relative">
                                          <div className={`w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-medium text-white ${
                                            idx === 0 ? 'bg-first-line' : 'bg-green-500'
                                          }`}>
                                            {initials}
                                          </div>
                                          {risk.currentEditor === assessor && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-background" />
                                          )}
                                        </div>
                                        <span className="text-sm text-[#10052F] dark:text-white">{assessor} ({initials})</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="text-sm">
                                        <p className="text-xs text-muted-foreground">{assessorEmails[assessor]}</p>
                                        {risk.currentEditor === assessor && (
                                          <p className="text-xs text-green-500 mt-1">Currently editing</p>
                                        )}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            })}
                            {risk.assessors.length > 2 && (
                              <span className="text-xs text-muted-foreground">+{risk.assessors.length - 2} more</span>
                            )}
                          </div>
                        </TableCell>
                        {/* Last Assessed Date - clickable drilldown */}
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="text-sm text-[#10052F] dark:text-white">{format(new Date(risk.lastAssessed), 'MMM dd, yyyy')}</div>
                          {risk.previousAssessments > 0 && (
                            <button 
                              onClick={() => {
                                setSelectedRiskForHistory(risk);
                                setHistoricalModalOpen(true);
                              }}
                              className="text-xs text-blue-600 hover:underline cursor-pointer"
                            >
                              {risk.previousAssessments} previous
                            </button>
                          )}
                          {risk.previousAssessments === 0 && (
                            <div className="text-xs text-muted-foreground">No previous</div>
                          )}
                        </TableCell>
                        {/* Inherent Risk - enhanced with score + rating + trend + aggregation */}
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              {risk.inherentRisk.score && (
                                <span className="font-bold text-sm min-w-[20px] text-[#10052F] dark:text-white">{risk.inherentRisk.score}</span>
                              )}
                              {renderEditableCell(
                                risk.id,
                                'inherentRisk',
                                risk.inherentRisk.level,
                                <Badge variant="outline" className={`${getRiskBadgeColor(risk.inherentRisk.color)}`}>
                                  {risk.inherentRisk.level}
                                </Badge>,
                                'select',
                                ['Critical', 'High', 'Medium', 'Low']
                              )}
                              <span className={`text-xs flex items-center gap-0.5 ${risk.inherentTrend.up ? 'text-[#D21C1C]' : 'text-[#46AF6A]'}`}>
                                {risk.inherentTrend.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                {risk.inherentTrend.value}
                              </span>
                            </div>
                            {inherentAgg && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                      <span className="font-medium text-[#10052F] dark:text-white">Σ Avg: {inherentAgg.avgScore}</span>
                                      <span className="text-[#10052F] dark:text-white">|</span>
                                      <span className="text-[#10052F] dark:text-white">Max: {inherentAgg.maxScore}</span>
                                      <Badge variant="outline" className={`text-[9px] px-1 py-0 ${getRiskBadgeColor(getRiskLevelFromScore(inherentAgg.avgScore).color)}`}>
                                        {getRiskLevelFromScore(inherentAgg.avgScore).level}
                                      </Badge>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Aggregated from {inherentAgg.childCount} child risk(s)</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        {/* Residual Risk - enhanced with score + rating + trend + aggregation */}
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              {risk.residualRisk.score && (
                                <span className="font-bold text-sm min-w-[20px] text-[#10052F] dark:text-white">{risk.residualRisk.score}</span>
                              )}
                              {renderEditableCell(
                                risk.id,
                                'residualRisk',
                                risk.residualRisk.level,
                                <Badge variant="outline" className={`${getRiskBadgeColor(risk.residualRisk.color)}`}>
                                  {risk.residualRisk.level}
                                </Badge>,
                                'select',
                                ['Critical', 'High', 'Medium', 'Low']
                              )}
                              <span className={`text-xs flex items-center gap-0.5 ${risk.residualTrend.up ? 'text-[#D21C1C]' : 'text-[#46AF6A]'}`}>
                                {risk.residualTrend.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                {risk.residualTrend.value}
                              </span>
                            </div>
                            {residualAgg && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                      <span className="font-medium text-[#10052F] dark:text-white">Σ Avg: {residualAgg.avgScore}</span>
                                      <span className="text-[#10052F] dark:text-white">|</span>
                                      <span className="text-[#10052F] dark:text-white">Max: {residualAgg.maxScore}</span>
                                      <Badge variant="outline" className={`text-[9px] px-1 py-0 ${getRiskBadgeColor(getRiskLevelFromScore(residualAgg.avgScore).color)}`}>
                                        {getRiskLevelFromScore(residualAgg.avgScore).level}
                                      </Badge>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Aggregated from {residualAgg.childCount} child risk(s)</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        {/* Related Controls - tabular layout */}
                        <TableCell className="py-2 border-r border-b border-border min-w-[320px]">
                          <div className="text-xs max-h-32 overflow-y-auto">
                            {risk.relatedControls.length > 0 ? (
                              <table className="w-full text-left table-fixed">
                                <thead>
                                  <tr className="text-[10px] text-muted-foreground border-b border-border/50">
                                    <th className="pb-1 pr-2 font-medium w-[75px]">ID</th>
                                    <th className="pb-1 pr-2 font-medium w-[110px]">Name</th>
                                    <th className="pb-1 pr-2 font-medium w-[70px]">Key Control</th>
                                    <th className="pb-1 font-medium w-[65px]">Nature</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {risk.relatedControls.slice(0, 3).map((control, idx) => (
                                    <tr key={idx} className="border-b border-border/30 last:border-0">
                                      <td className="py-1 pr-2 font-medium text-[#10052F] dark:text-white overflow-hidden text-ellipsis whitespace-nowrap" title={control.id}>{control.id}</td>
                                      <td className="py-1 pr-2 text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap" title={control.name}>{control.name}</td>
                                      <td className="py-1 pr-2 overflow-hidden text-ellipsis whitespace-nowrap text-[#10052F] dark:text-white" title={control.keyControl}>{control.keyControl}</td>
                                      <td className="py-1 overflow-hidden text-ellipsis whitespace-nowrap text-[#10052F] dark:text-white" title={control.nature}>{control.nature}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <span className="text-muted-foreground">No controls</span>
                            )}
                            {risk.relatedControls.length > 3 && (
                              <div className="text-muted-foreground text-[10px] pt-1">
                                +{risk.relatedControls.length - 3} more
                              </div>
                            )}
                            {level1Agg && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded mt-1">
                                      <span className="font-medium">Σ {level1Agg.totalControls}</span>
                                      <span>controls</span>
                                      <span className="text-muted-foreground/60">({level1Agg.childCount} risks)</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-xs space-y-1">
                                      <p className="font-medium">Controls Summary ({level1Agg.childCount} child risks)</p>
                                      <p>Total Controls: {level1Agg.totalControls}</p>
                                      <p>Automated: {level1Agg.automatedControls}</p>
                                      <p>Manual: {level1Agg.manualControls}</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        {/* Control Effectiveness */}
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="space-y-1">
                            {renderEditableCell(
                              risk.id,
                              'controlEffectiveness',
                              risk.controlEffectiveness.label,
                              getEffectivenessBadge(risk.controlEffectiveness.label, risk.controlEffectiveness.color),
                              'select',
                              ['Effective', 'Partially Effective', 'Ineffective', 'Not Assessed']
                            )}
                            {level1Agg && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 text-[10px] bg-muted/50 px-1.5 py-0.5 rounded mt-1">
                                      <span className="text-green-600">{level1Agg.effectivenessBreakdown.effective}</span>
                                      <span className="text-muted-foreground/40">|</span>
                                      <span className="text-amber-600">{level1Agg.effectivenessBreakdown.partiallyEffective}</span>
                                      <span className="text-muted-foreground/40">|</span>
                                      <span className="text-red-600">{level1Agg.effectivenessBreakdown.ineffective}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-xs space-y-1">
                                      <p className="font-medium">Effectiveness Summary ({level1Agg.childCount} risks)</p>
                                      <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-[#46AF6A] rounded-full"></span>
                                        <span>Effective: {level1Agg.effectivenessBreakdown.effective}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-[#CE7900] rounded-full"></span>
                                        <span>Partially Effective: {level1Agg.effectivenessBreakdown.partiallyEffective}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-[#D21C1C] rounded-full"></span>
                                        <span>Ineffective: {level1Agg.effectivenessBreakdown.ineffective}</span>
                                      </div>
                                      {level1Agg.effectivenessBreakdown.notAssessed > 0 && (
                                        <div className="flex items-center gap-2">
                                          <span className="w-2 h-2 bg-[#8B5993] rounded-full"></span>
                                          <span>Not Assessed: {level1Agg.effectivenessBreakdown.notAssessed}</span>
                                        </div>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        {/* N/A Justifications */}
                        <TableCell className="py-2 border-r border-b border-border">
                          {risk.naJustifications && (risk.naJustifications.pending + risk.naJustifications.drafted + risk.naJustifications.awaiting) > 0 ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => togglePanel('naJustifications', naJustificationsRef)}
                                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                                  >
                                    <Ban className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                    <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                      {risk.naJustifications.pending + risk.naJustifications.drafted + risk.naJustifications.awaiting}
                                    </span>
                                    <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70">pending</span>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs space-y-1">
                                    <p className="font-medium">N/A Justification Status</p>
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-[#FBC02D]" />
                                      <span>{risk.naJustifications.pending} Pending</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-[#E65100]" />
                                      <span>{risk.naJustifications.drafted} Drafted</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-[#7E57C2]" />
                                      <span>{risk.naJustifications.awaiting} Awaiting Approval</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-[#43A047]" />
                                      <span>{risk.naJustifications.approved} Approved</span>
                                    </div>
                                    <p className="text-muted-foreground mt-1">Click to view details</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : risk.naJustifications && risk.naJustifications.approved > 0 ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1.5 px-2 py-1">
                                    <Ban className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                    <span className="text-xs text-green-600 dark:text-green-400">{risk.naJustifications.approved} approved</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs">
                                    <p className="font-medium">All N/A Justifications Approved</p>
                                    <p>{risk.naJustifications.approved} control(s) marked N/A with approved justification</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        {/* Test Results */}
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="space-y-1">
                            <Badge className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full">{risk.testResults.label}</Badge>
                            {risk.testResults.sublabel && (
                              <div className="text-xs text-muted-foreground">{risk.testResults.sublabel}</div>
                            )}
                          </div>
                        </TableCell>
                        {/* Status */}
                        <TableCell className="py-2 border-b border-border">
                          <div className="space-y-1">
                            {renderEditableCell(
                              risk.id,
                              'status',
                              risk.status,
                              <Badge className={`${getStatusColor(risk.status)} text-[10px] px-2 py-0.5`}>{risk.status}</Badge>,
                              'select',
                              ['Sent for Assessment', 'In Progress', 'Pending Approval', 'Completed', 'Closed']
                            )}
                            {level1Agg && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 text-[10px] bg-muted/50 px-1.5 py-0.5 rounded mt-1 flex-wrap">
                                      {level1Agg.statusBreakdown.completed > 0 && (
                                        <span className="text-[#46AF6A]">{level1Agg.statusBreakdown.completed} ✓</span>
                                      )}
                                      {level1Agg.statusBreakdown.inProgress > 0 && (
                                        <span className="text-[#CE7900]">{level1Agg.statusBreakdown.inProgress} ◐</span>
                                      )}
                                      {level1Agg.statusBreakdown.overdue > 0 && (
                                        <span className="text-[#D21C1C]">{level1Agg.statusBreakdown.overdue} !</span>
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-xs space-y-1">
                                      <p className="font-medium">Status Summary ({level1Agg.childCount} risks)</p>
                                      <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-[#46AF6A] rounded-full"></span>
                                        <span>Completed: {level1Agg.statusBreakdown.completed}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-[#CE7900] rounded-full"></span>
                                        <span>In Progress: {level1Agg.statusBreakdown.inProgress}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-[#D21C1C] rounded-full"></span>
                                        <span>Overdue: {level1Agg.statusBreakdown.overdue}</span>
                                      </div>
                                      {level1Agg.statusBreakdown.pendingApproval > 0 && (
                                        <div className="flex items-center gap-2">
                                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                          <span>Pending Approval: {level1Agg.statusBreakdown.pendingApproval}</span>
                                        </div>
                                      )}
                                      {level1Agg.statusBreakdown.other > 0 && (
                                        <div className="flex items-center gap-2">
                                          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                          <span>Other: {level1Agg.statusBreakdown.other}</span>
                                        </div>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
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
        )}
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
        userType="1st-line"
      />

      <RiskAssessmentOverviewModal1stLine
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
        showTraversal={traversableRisks.length > 1}
        currentIndex={currentTraversalIndex}
        totalCount={traversableRisks.length}
        isFirst={isFirstRisk}
        isLast={isLastRisk}
        onNext={goToNextRisk}
        onPrevious={goToPreviousRisk}
        isReviewMode={isReviewMode}
        reviewProgress={isReviewMode ? { current: currentTraversalIndex + 1, total: traversableRisks.length } : null}
      />

      {/* Historical Assessments Drilldown Modal */}
      <HistoricalAssessmentsModal
        open={historicalModalOpen}
        onOpenChange={setHistoricalModalOpen}
        riskId={selectedRiskForHistory?.id || ""}
        riskTitle={selectedRiskForHistory?.title || ""}
        historicalAssessments={selectedRiskForHistory?.historicalAssessments || []}
      />

      <AIDocumentAssessmentModal
        open={aiDocumentModalOpen}
        onOpenChange={setAiDocumentModalOpen}
        onRisksImported={handleImportedRisks}
        existingRisks={riskData.map(r => ({ 
          id: r.id, 
          title: r.title,
          businessUnit: r.businessUnit,
          category: r.category,
          owner: r.owner,
          inherentRisk: r.inherentRisk.level,
          residualRisk: r.residualRisk.level,
          status: r.status
        }))}
      />

      {/* AI Risk Search Modal - document upload then bulk assessment with selected risks */}
      <AIDocumentAssessmentModal
        open={directAssessmentModalOpen}
        onOpenChange={setDirectAssessmentModalOpen}
        onRisksImported={handleImportedRisks}
        existingRisks={riskData.map(r => ({ 
          id: r.id, 
          title: r.title,
          businessUnit: r.businessUnit,
          category: r.category,
          owner: r.owner,
          inherentRisk: r.inherentRisk.level,
          residualRisk: r.residualRisk.level,
          status: r.status
        }))}
        skipReviewScreen={true}
        filterByTitles={riskData.filter(r => selectedRisks.has(r.id)).map(r => r.title)}
      />

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
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "reassign" && "Reassign Assessors"}
              {actionDialog.type === "collaborate" && "Manage Collaborators"}
              {actionDialog.type === "reassess" && "Request Reassessment"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === "reassign" && `Update assessors for ${actionDialog.riskId?.split(",").length || 1} selected risk${(actionDialog.riskId?.split(",").length || 1) > 1 ? "s" : ""}`}
              {actionDialog.type === "collaborate" && `Manage collaborators for ${actionDialog.riskId?.split(",").length || 1} selected risk${(actionDialog.riskId?.split(",").length || 1) > 1 ? "s" : ""}`}
              {actionDialog.type === "reassess" && "Request a reassessment of this risk"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Current Assignees */}
            <div>
              <Label className="text-sm font-medium">
                {actionDialog.type === "collaborate" ? "Current Collaborators" : "Current Assessors"}
              </Label>
              <div className="mt-3 space-y-2">
                {actionDialog.riskId?.split(",").slice(0, 3).map((riskId) => {
                  const risk = riskData.find(r => r.id === riskId.trim());
                  if (!risk) return null;
                  return (
                    <div key={riskId} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <span className="text-xs font-medium truncate max-w-[120px]">{risk.id}</span>
                      <div className="flex items-center -space-x-2">
                        {risk.assessors.slice(0, 3).map((assessor, idx) => {
                          const initials = assessor.split(" ").map(n => n[0]).join("");
                          const colors = ["bg-green-500", "bg-blue-500", "bg-purple-500", "bg-orange-500"];
                          return (
                            <div
                              key={idx}
                              className={`w-8 h-8 rounded-full ${colors[idx % colors.length]} flex items-center justify-center text-white text-xs font-semibold border-2 border-background`}
                              title={assessor}
                            >
                              {initials}
                            </div>
                          );
                        })}
                        {risk.assessors.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-semibold border-2 border-background">
                            +{risk.assessors.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {(actionDialog.riskId?.split(",").length || 0) > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    ...and {(actionDialog.riskId?.split(",").length || 0) - 3} more risks
                  </p>
                )}
              </div>
            </div>

            {/* Add New User */}
            <div>
              <Label>{actionDialog.type === "collaborate" ? "Add Collaborator" : "Add/Replace Assessor"}</Label>
              <Select>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg z-50">
                  {Object.keys(assessorEmails).map((name) => {
                    const initials = name.split(" ").map(n => n[0]).join("");
                    return (
                      <SelectItem key={name} value={name}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                            {initials}
                          </div>
                          <span>{name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, type: null, riskId: null })}>
              Cancel
            </Button>
            <Button onClick={handleActionSubmit}>
              {actionDialog.type === "collaborate" ? "Add Collaborator" : "Update Assessors"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Metric Details Dialog */}
      <Dialog open={metricDetailsOpen} onOpenChange={setMetricDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-3 text-xl">
              {selectedMetric && (
                <>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-first-line/20 to-first-line/5 border border-first-line/20 flex items-center justify-center shadow-sm">
                    <selectedMetric.icon className="w-5 h-5 text-first-line" />
                  </div>
                  {selectedMetric.title}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMetric && (
            <div className="space-y-5 py-2">
              {/* Enhanced Header Section */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-first-line/10 via-first-line/5 to-transparent rounded-xl border border-first-line/10">
                <div className="space-y-1">
                  <span className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{selectedMetric.value}</span>
                  <p className="text-sm text-muted-foreground">{selectedMetric.description}</p>
                </div>
                <div className="text-right space-y-1">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                    selectedMetric.trendUp 
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' 
                      : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                  }`}>
                    {selectedMetric.trendUp ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    {selectedMetric.trend}
                  </div>
                  <p className="text-xs text-muted-foreground">vs last period</p>
                </div>
              </div>
              
              {/* Visual Distribution - Dual Progress Bars */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-first-line" />
                  Distribution Overview
                </h4>
                
                {selectedMetric.segmentRows ? (
                  <div className="space-y-3">
                    {selectedMetric.segmentRows.map((row: { label: string; segments: Array<{ label: string; value: number; color: string }> }, rowIdx: number) => {
                      let rowTotal = 0;
                      for (const seg of row.segments) rowTotal += seg.value;
                      
                      return (
                        <div key={rowIdx} className="p-3 bg-muted/30 rounded-lg border border-muted/50 space-y-2">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {row.label}
                          </span>
                          <div className="h-5 rounded-md overflow-hidden flex bg-muted/30">
                            {row.segments.map((seg, segIdx) => {
                              const pct = rowTotal > 0 ? (seg.value / rowTotal) * 100 : 0;
                              return (
                                <div
                                  key={segIdx}
                                  className={`${seg.color} transition-all duration-500 flex items-center justify-center`}
                                  style={{ width: `${pct}%` }}
                                >
                                  {pct > 12 && (
                                    <span className="text-[10px] font-medium text-white drop-shadow-sm">
                                      {seg.value}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {row.segments.map((seg, segIdx) => (
                              <div key={segIdx} className="flex items-center gap-1.5">
                                <div className={`w-2.5 h-2.5 rounded-sm ${seg.color}`} />
                                <span className="text-xs text-muted-foreground">
                                  {seg.label}: <span className="font-medium text-foreground">{seg.value}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-muted/30 rounded-lg border border-muted/50 space-y-2">
                    <div className="h-5 rounded-md overflow-hidden flex bg-muted/30">
                      {selectedMetric.segments.map((segment, idx) => {
                        const total = selectedMetric.segments.reduce((sum, s) => sum + s.value, 0);
                        const pct = total > 0 ? (segment.value / total) * 100 : 0;
                        return (
                          <div
                            key={idx}
                            className={`${segment.color} transition-all duration-500 flex items-center justify-center`}
                            style={{ width: `${pct}%` }}
                          >
                            {pct > 12 && (
                              <span className="text-[10px] font-medium text-white drop-shadow-sm">
                                {segment.value}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {selectedMetric.segments.map((segment, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <div className={`w-2.5 h-2.5 rounded-sm ${segment.color}`} />
                          <span className="text-xs text-muted-foreground">
                            {segment.label}: <span className="font-medium text-foreground">{segment.value}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Prioritized Breakdown */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-first-line" />
                  Action Items
                </h4>
                
                {(() => {
                  const breakdown = selectedMetric.extendedDetails.breakdown;
                  const total = breakdown.reduce((sum, s) => sum + s.value, 0);
                  const criticalItems = breakdown.filter(item => 
                    item.label.toLowerCase().includes('critical') || 
                    item.label.toLowerCase().includes('high') ||
                    item.label.toLowerCase().includes('overdue') ||
                    item.label.toLowerCase().includes('ineffective')
                  );
                  const otherItems = breakdown.filter(item => 
                    !item.label.toLowerCase().includes('critical') && 
                    !item.label.toLowerCase().includes('high') &&
                    !item.label.toLowerCase().includes('overdue') &&
                    !item.label.toLowerCase().includes('ineffective')
                  );
                  
                  return (
                    <div className="space-y-2">
                      {/* Critical/High Priority Items */}
                      {criticalItems.length > 0 && (
                        <div className="space-y-2">
                          {criticalItems.map((item, idx) => {
                            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                            const segmentColor = selectedMetric.segments.find(s => s.label === item.label)?.color || 'bg-gray-400';
                            return (
                              <div key={idx} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${segmentColor}`} />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-red-800 dark:text-red-200">{item.label}</span>
                                      <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                                        Priority
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-red-600 dark:text-red-400">{item.action}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xl font-bold text-red-700 dark:text-red-300">{item.value}</span>
                                  <span className="text-xs text-red-500 dark:text-red-400">({percentage}%)</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Other Items - Compact Grid */}
                      {otherItems.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {otherItems.map((item, idx) => {
                            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                            const segmentColor = selectedMetric.segments.find(s => s.label === item.label)?.color || 'bg-gray-400';
                            return (
                              <div key={idx} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg border border-muted/50 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${segmentColor}`} />
                                  <div className="min-w-0">
                                    <span className="text-sm font-medium truncate block">{item.label}</span>
                                    <p className="text-[10px] text-muted-foreground truncate">{item.action}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                  <span className="text-lg font-bold">{item.value}</span>
                                  <span className="text-[10px] text-muted-foreground">({percentage}%)</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              {/* Enhanced AI Insight Section */}
              <div className="p-4 bg-gradient-to-br from-first-line/10 via-emerald-500/5 to-transparent border border-first-line/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-first-line/30 to-emerald-500/20 flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-4 h-4 text-first-line" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h4 className="font-semibold text-first-line text-sm">AI Analysis</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedMetric.extendedDetails.insight}
                    </p>
                    <div className="p-2.5 bg-white/60 dark:bg-black/20 rounded-lg border border-first-line/10">
                      <p className="text-sm font-medium text-foreground flex items-start gap-2">
                        <Target className="w-4 h-4 text-first-line shrink-0 mt-0.5" />
                        {selectedMetric.extendedDetails.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setMetricDetailsOpen(false)}>
              Close
            </Button>
            <Button className="bg-first-line hover:bg-first-line/90" onClick={() => {
              setMetricDetailsOpen(false);
              reportSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}>
              View Related Risks
            </Button>
          </DialogFooter>
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
              className="h-24 flex-col gap-1.5 rounded-none bg-blue-50 hover:bg-blue-100 border-blue-200 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 dark:border-blue-800"
              onClick={() => handleExport('docx')}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <FileText className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              )}
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Word Document</span>
              <span className="text-[10px] text-blue-500 dark:text-blue-400">.docx</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-1.5 rounded-none bg-orange-50 hover:bg-orange-100 border-orange-200 dark:bg-orange-950/30 dark:hover:bg-orange-900/40 dark:border-orange-800"
              onClick={() => handleExport('pptx')}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <Presentation className="w-7 h-7 text-orange-600 dark:text-orange-400" />
              )}
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">PowerPoint</span>
              <span className="text-[10px] text-orange-500 dark:text-orange-400">.pptx</span>
            </Button>
          </div>
          <DialogFooter>
            <p className="text-xs text-muted-foreground">
              Reports include AI-generated narratives for all {metrics.length} dashboard components.
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
};


export default Dashboard1stLine;
