import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { getInitialRiskDataCopy, SharedRiskData, HistoricalAssessment, ControlRecord } from "@/data/initialRiskData";
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay, addDays, endOfWeek, endOfMonth, isToday } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ClipboardCheck, AlertTriangle, FileCheck, Clock, TrendingUp, TrendingDown, UserPlus, Users as UsersIcon, RotateCcw, Edit2, LogOut, User, ChevronDown, ChevronRight, ChevronUp, Sparkles, Plus, RefreshCw, MoreHorizontal, Link, CheckCircle, CheckSquare, AlertCircle, Lock, ArrowUp, ArrowDown, Mail, X, XCircle, Send, FileText, Upload, Menu, Check, CalendarCheck, BarChart, Target, FlaskConical, Shield, Eye, LayoutList, Building2, Filter, Layers, Search, Ban, Info, Activity, Lightbulb } from "lucide-react";
import { downloadRiskDocx } from "@/lib/generateRiskDocx";
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
  
  // Historical assessments modal state
  const [historicalModalOpen, setHistoricalModalOpen] = useState(false);
  const [selectedRiskForHistory, setSelectedRiskForHistory] = useState<RiskData | null>(null);
  const [bulkAssessmentOpen, setBulkAssessmentOpen] = useState(false);
  const [riskOverviewModalOpen, setRiskOverviewModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricData | null>(null);
  const [metricDetailsOpen, setMetricDetailsOpen] = useState(false);
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

  // Combined assessment status counts (deadline urgency + workflow progress)
  const assessmentStatusCounts = useMemo(() => {
    const today = startOfDay(new Date());
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Monday start
    const monthEnd = endOfMonth(today);
    
    // Deadline urgency counts
    let overdue = 0;
    let dueThisWeek = 0;
    let dueThisMonth = 0;
    let future = 0;
    
    // Workflow progress counts
    let notStarted = 0;
    let inProgress = 0;
    let pendingApproval = 0;
    let challenge = 0;
    let completed = 0;
    
    assessorFilteredRiskData.forEach(risk => {
      // Due date categorization
      try {
        const dueDate = parseISO(risk.dueDate);
        const dueDateStart = startOfDay(dueDate);
        
        if (isBefore(dueDateStart, today)) {
          overdue++;
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
      
      // Workflow status categorization
      const status = risk.status?.toLowerCase() || "";
      if (status === "completed" || status === "complete" || status === "closed") {
        completed++;
      } else if (status === "review/challenge" || status === "challenge") {
        challenge++;
      } else if (status === "pending approval" || status === "pending review") {
        pendingApproval++;
      } else if (status === "in progress" || status === "under review") {
        inProgress++;
      } else {
        notStarted++;
      }
    });
    
    return {
      // Deadline data
      overdue, dueThisWeek, dueThisMonth, future,
      // Workflow data
      notStarted, inProgress, pendingApproval, challenge, completed,
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
      case "Sent for Assessment": return "bg-[#0A8078] text-white";
      case "In Progress": return "bg-[#CE7900] text-white";
      case "Pending Approval": return "bg-[#A361CF] text-white";
      case "Review/Challenge": return "bg-[#F1BA50] text-white";
      case "Completed": return "bg-[#46AF6A] text-white";
      case "Complete": return "bg-[#46AF6A] text-white";
      case "Closed": return "bg-[#8B5993] text-white";
      case "Overdue": return "bg-[#D21C1C] text-white";
      case "Pending Review": return "bg-[#6A75D8] text-white";
      default: return "bg-[#0A8078] text-white";
    }
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case "Operational": return "bg-[#6A75D8]/10 dark:bg-[#6A75D8]/20";
      case "Technology": return "bg-[#0A8078]/10 dark:bg-[#0A8078]/20";
      case "Compliance": return "bg-[#A361CF]/10 dark:bg-[#A361CF]/20";
      case "Financial": return "bg-[#46AF6A]/10 dark:bg-[#46AF6A]/20";
      default: return "bg-muted/30";
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 dark:from-background dark:via-background dark:to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 dark:bg-card/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-6 py-1 sm:py-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-first-line flex items-center justify-center flex-shrink-0">
                <ClipboardCheck className="w-3 h-3 text-white" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-semibold text-black dark:text-white truncate">
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
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1.5 px-0">
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
              <button onClick={() => setAiDocumentModalOpen(true)} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs">
                <FileText className="w-3 h-3" />
                <span>AI Document Parser</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upload and parse documents to extract risk assessments using AI</p>
            </TooltipContent>
          </Tooltip>
          <span className="text-gray-400 dark:text-gray-500">|</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <a href="/downloads/hierarchical-risk-assessments.csv" download className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:underline text-xs italic">
                <FlaskConical className="w-3 h-3" />
                <span>Sample CSV for AI Assessment (Test Only)</span>
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download a sample CSV file to test the AI-powered risk assessment parser</p>
            </TooltipContent>
          </Tooltip>
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

          // Expanded card state
          const [expandedCard, setExpandedCard] = React.useState<string | null>(null);
          const toggleCardExpand = (cardId: string) => {
            setExpandedCard(prev => prev === cardId ? null : cardId);
          };

          // Placeholder data for new cards
          const naJustificationsCounts = { pending: 2, drafted: 1, awaiting: 1, approved: 1 };
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
                <Card className="border border-[#00897B] shadow-sm bg-card rounded-none">
                  <CardContent className="p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <CalendarCheck className="w-3 h-3 text-[#00897B]" />
                        </div>
                        <span className="text-[10px] font-bold text-[#10052F] dark:text-white uppercase tracking-wide">
                          ASSESSMENT STATUS
                        </span>
                      </div>
                      <button 
                        onClick={() => toggleCardExpand('assessment')}
                        className="flex items-center gap-2 text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-wide"
                      >
                        CLICK TO EXPAND
                        <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <ChevronDown className={cn("w-3 h-3 transition-transform", 
                            expandedCard === 'assessment' && "rotate-180")} />
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
                    
                    {/* Donut chart + Progress bars */}
                    <div className="flex gap-4 items-center">
                      {/* Donut chart */}
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <svg viewBox="0 0 36 36" className="w-16 h-16">
                          {/* Background circle - Gray track for incomplete */}
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                          {/* Progress circle - RED for complete portion */}
                          <circle 
                            cx="18" cy="18" r="15.9" fill="none" 
                            stroke="#EF4444" strokeWidth="3"
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
                      <div className="flex-1 space-y-2">
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">DEADLINE STATUS</span>
                          <div className="flex h-2 overflow-hidden mt-0.5 rounded-full shadow-sm">
                            {assessmentStatusCounts.overdue > 0 && (
                              <div className="bg-destructive first:rounded-l-full last:rounded-r-full" style={{width: `${(assessmentStatusCounts.overdue / totalAssessments) * 100}%`}} />
                            )}
                            {assessmentStatusCounts.dueThisWeek > 0 && (
                              <div className="bg-warning first:rounded-l-full last:rounded-r-full" style={{width: `${(assessmentStatusCounts.dueThisWeek / totalAssessments) * 100}%`}} />
                            )}
                            {assessmentStatusCounts.dueThisMonth > 0 && (
                              <div className="bg-success first:rounded-l-full last:rounded-r-full" style={{width: `${(assessmentStatusCounts.dueThisMonth / totalAssessments) * 100}%`}} />
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">WORKFLOW PROGRESS</span>
                          <div className="flex h-2 overflow-hidden mt-0.5 rounded-full shadow-sm">
                            {assessmentStatusCounts.completed > 0 && (
                              <div className="bg-success first:rounded-l-full last:rounded-r-full" style={{width: `${(assessmentStatusCounts.completed / totalAssessments) * 100}%`}} />
                            )}
                            {assessmentStatusCounts.pendingApproval > 0 && (
                              <div className="bg-[#A361CF] first:rounded-l-full last:rounded-r-full" style={{width: `${(assessmentStatusCounts.pendingApproval / totalAssessments) * 100}%`}} />
                            )}
                            {assessmentStatusCounts.inProgress > 0 && (
                              <div className="bg-warning first:rounded-l-full last:rounded-r-full" style={{width: `${(assessmentStatusCounts.inProgress / totalAssessments) * 100}%`}} />
                            )}
                            {assessmentStatusCounts.notStarted > 0 && (
                              <div className="bg-destructive first:rounded-l-full last:rounded-r-full" style={{width: `${(assessmentStatusCounts.notStarted / totalAssessments) * 100}%`}} />
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0 text-[9px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            {assessmentStatusCounts.completed} Done
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            {assessmentStatusCounts.overdue} Overdue
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-yellow-500" />
                            {assessmentStatusCounts.inProgress} In Progress
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-2">
                      <p className="text-[9px] text-muted-foreground">
                        Track assessment deadlines and workflow progress.
                      </p>
                    </div>
                    
                    {/* Expandable dropdown - shows risk table */}
                    {expandedCard === 'assessment' && (
                      <div className="mt-3 border-t pt-3 max-h-[400px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs py-2">Risk ID</TableHead>
                              <TableHead className="text-xs py-2">Title</TableHead>
                              <TableHead className="text-xs py-2">Status</TableHead>
                              <TableHead className="text-xs py-2">Due Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {visibleRisks.slice(0, 10).map((risk, idx) => (
                              <TableRow key={idx} className="hover:bg-muted/50">
                                <TableCell className="text-xs py-2 font-mono">{risk.id}</TableCell>
                                <TableCell className="text-xs py-2">
                                  <button 
                                    onClick={() => handleRiskNameClick(risk)}
                                    className="text-left hover:text-primary transition-colors hover:underline text-blue-600 dark:text-blue-400"
                                  >
                                    {risk.title}
                                  </button>
                                </TableCell>
                                <TableCell className="py-2">
                                  <Badge className={`${getStatusColor(risk.status)} text-[10px] px-2 py-0.5`}>{risk.status}</Badge>
                                </TableCell>
                                <TableCell className="text-xs py-2">{format(parseISO(risk.dueDate), 'MMM dd, yyyy')}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {visibleRisks.length > 10 && (
                          <p className="text-xs text-muted-foreground text-center mt-2">
                            Showing 10 of {visibleRisks.length} risks
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* N/A Justifications Card - Pipeline Flow Design */}
                <Card className="border border-[#00897B] shadow-sm bg-card rounded-none">
                  <CardContent className="p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <Ban className="w-3 h-3 text-[#00897B]" />
                        </div>
                        <span className="text-[10px] font-bold text-[#10052F] dark:text-white uppercase tracking-wide">
                          N/A JUSTIFICATIONS
                        </span>
                      </div>
                      <button className="flex items-center gap-1 text-xs text-muted-foreground cursor-not-allowed">
                        <span className="uppercase font-medium">Expand</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="mb-2">
                      <span className="text-xl font-bold text-[#10052F] dark:text-white">{naJustificationsCounts.pending + naJustificationsCounts.drafted}</span>
                      <span className="text-sm text-muted-foreground ml-1">Pending</span>
                    </div>
                    
                    {/* Pipeline-style status boxes */}
                    <div className="flex items-center justify-center mb-3">
                      {/* PENDING box */}
                      <div className="bg-[#FBC02D] text-white px-6 py-4 text-center min-w-[90px] rounded-xl shadow-sm">
                        <div className="text-2xl font-bold">{naJustificationsCounts.pending}</div>
                        <div className="text-[10px] uppercase font-semibold tracking-wide">PENDING</div>
                      </div>
                      {/* Chevron connector */}
                      <span className="text-gray-300 text-lg mx-0.5">&gt;</span>
                      {/* DRAFTED box */}
                      <div className="bg-[#E65100] text-white px-6 py-4 text-center min-w-[90px] rounded-xl shadow-sm">
                        <div className="text-2xl font-bold">{naJustificationsCounts.drafted}</div>
                        <div className="text-[10px] uppercase font-semibold tracking-wide">DRAFTED</div>
                      </div>
                      {/* Chevron connector */}
                      <span className="text-gray-300 text-lg mx-0.5">&gt;</span>
                      {/* AWAITING box */}
                      <div className="bg-[#7E57C2] text-white px-6 py-4 text-center min-w-[90px] rounded-xl shadow-sm">
                        <div className="text-2xl font-bold">{naJustificationsCounts.awaiting}</div>
                        <div className="text-[10px] uppercase font-semibold tracking-wide">AWAITING</div>
                      </div>
                      {/* Chevron connector */}
                      <span className="text-gray-300 text-lg mx-0.5">&gt;</span>
                      {/* APPROVED box */}
                      <div className="bg-[#43A047] text-white px-6 py-4 text-center min-w-[90px] rounded-xl shadow-sm">
                        <div className="text-2xl font-bold">{naJustificationsCounts.approved}</div>
                        <div className="text-[10px] uppercase font-semibold tracking-wide">APPROVED</div>
                      </div>
                    </div>
                    
                    {/* Progress bar with Start/Complete labels */}
                    <div className="mb-3">
                      <div className="flex h-2 overflow-hidden rounded-full bg-[#B2DFDB]">
                        <div className="bg-[#00897B] w-[25%]" />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[9px] text-muted-foreground">Start</span>
                        <span className="text-[9px] text-muted-foreground">Complete</span>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                      <p className="text-[9px] text-muted-foreground">
                        Review and approve N/A control justifications.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Bottom row: Loss+Drift | AI Root Cause */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
                  {/* Sub-column 1: Loss Events + Drift Alerts stacked */}
                  <div className="flex flex-col gap-3">
                    {/* Loss Events Card - Compact */}
                    <Card className="border-l-4 border-l-[#00897B] border border-[#00897B] shadow-sm bg-card rounded-none">
                      <CardContent className="p-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                              <Info className="w-3 h-3 text-[#00897B]" />
                            </div>
                            <span className="text-[10px] font-bold text-[#10052F] dark:text-white uppercase tracking-wide">
                              LOSS EVENTS
                            </span>
                          </div>
                          <button className="flex items-center gap-1 text-xs text-muted-foreground cursor-not-allowed">
                            CLICK TO EXPAND
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="mb-2">
                          <span className="text-2xl font-bold text-[#10052F] dark:text-white">{lossEventsCounts.pendingTriage}</span>
                          <span className="text-sm text-muted-foreground ml-1">Pending Triage</span>
                        </div>
                        
                        {/* Larger segmented bar with rounded outer corners */}
                        <div className="flex h-10 overflow-hidden rounded-lg mb-2">
                          {(() => {
                            const total = lossEventsCounts.pendingTriage + lossEventsCounts.inTriage + lossEventsCounts.closed;
                            const pendingPct = total > 0 ? (lossEventsCounts.pendingTriage / total) * 100 : 0;
                            const triagePct = total > 0 ? (lossEventsCounts.inTriage / total) * 100 : 0;
                            const closedPct = total > 0 ? (lossEventsCounts.closed / total) * 100 : 0;
                            return (
                              <>
                                {lossEventsCounts.pendingTriage > 0 && (
                                  <div 
                                    className="bg-red-500 flex items-center justify-center text-white text-lg font-bold rounded-l-lg"
                                    style={{width: `${pendingPct}%`, minWidth: '40px'}}
                                  >
                                    {lossEventsCounts.pendingTriage}
                                  </div>
                                )}
                                {lossEventsCounts.inTriage > 0 && (
                                  <div 
                                    className="bg-yellow-400 flex items-center justify-center text-white text-lg font-bold"
                                    style={{width: `${triagePct}%`, minWidth: '40px'}}
                                  >
                                    {lossEventsCounts.inTriage}
                                  </div>
                                )}
                                {lossEventsCounts.closed > 0 && (
                                  <div 
                                    className="bg-green-500 flex items-center justify-center text-white text-lg font-bold rounded-r-lg"
                                    style={{width: `${closedPct}%`, minWidth: '40px'}}
                                  >
                                    {lossEventsCounts.closed}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        
                        {/* Simple legend */}
                        <div className="flex flex-wrap gap-3 text-[9px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Pending
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> In Triage
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Closed
                          </span>
                        </div>
                        
                        <div className="border-t border-border mt-2 pt-1.5">
                          <p className="text-[9px] text-muted-foreground">
                            Monitor loss events requiring triage and analysis.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Drift Alerts Card */}
                    <Card className="border-l-4 border-l-[#00897B] border border-[#00897B] shadow-sm bg-card rounded-none flex-1">
                      <CardContent className="p-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                              <Activity className="w-3 h-3 text-[#00897B]" />
                            </div>
                            <span className="text-[10px] font-bold text-[#10052F] dark:text-white uppercase tracking-wide">
                              DRIFT ALERTS
                            </span>
                          </div>
                          <button className="flex items-center gap-1 text-xs text-muted-foreground cursor-not-allowed">
                            CLICK TO EXPAND
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="mb-2">
                          <span className="text-2xl font-bold text-[#10052F] dark:text-white">{driftAlertsCounts.critical + driftAlertsCounts.high + driftAlertsCounts.medium}</span>
                          <span className="text-sm text-muted-foreground ml-1">Active Alerts</span>
                        </div>
                        
                        {/* Larger segmented bar with numbers inside */}
                        <div className="flex h-10 overflow-hidden rounded-lg mb-2">
                          {(() => {
                            const total = driftAlertsCounts.critical + driftAlertsCounts.high + driftAlertsCounts.medium;
                            const criticalPct = total > 0 ? (driftAlertsCounts.critical / total) * 100 : 0;
                            const highPct = total > 0 ? (driftAlertsCounts.high / total) * 100 : 0;
                            const mediumPct = total > 0 ? (driftAlertsCounts.medium / total) * 100 : 0;
                            return (
                              <>
                                {driftAlertsCounts.critical > 0 && (
                                  <div 
                                    className="bg-red-500 flex items-center justify-center text-white text-lg font-bold rounded-l-lg"
                                    style={{width: `${criticalPct}%`, minWidth: '40px'}}
                                  >
                                    {driftAlertsCounts.critical}
                                  </div>
                                )}
                                {driftAlertsCounts.high > 0 && (
                                  <div 
                                    className="bg-yellow-500 flex items-center justify-center text-white text-lg font-bold"
                                    style={{width: `${highPct}%`, minWidth: '40px'}}
                                  >
                                    {driftAlertsCounts.high}
                                  </div>
                                )}
                                {driftAlertsCounts.medium > 0 && (
                                  <div 
                                    className="bg-[#9ACD32] flex items-center justify-center text-white text-lg font-bold rounded-r-lg"
                                    style={{width: `${mediumPct}%`, minWidth: '40px'}}
                                  >
                                    {driftAlertsCounts.medium}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        
                        <div className="flex gap-4 text-[9px] text-muted-foreground">
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Critical: {driftAlertsCounts.critical}</span>
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> High: {driftAlertsCounts.high}</span>
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#9ACD32]"></span> Medium: {driftAlertsCounts.medium}</span>
                        </div>
                        
                        <div className="border-t border-border mt-2 pt-1.5">
                          <p className="text-[9px] text-muted-foreground">
                            Address rating variances flagged by AI analysis.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sub-column 2: AI Root Cause - Full Height */}
                  <Card className="border-l-4 border-l-[#00897B] border border-[#00897B] shadow-sm bg-card rounded-none h-full flex flex-col">
                    <CardContent className="p-2.5 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-[#00897B]" />
                          </div>
                          <span className="text-[10px] font-bold text-[#10052F] dark:text-white uppercase tracking-wide">
                            AI ROOT CAUSE
                          </span>
                        </div>
                        <button className="flex items-center gap-1 text-xs text-primary cursor-not-allowed font-medium">
                          <Sparkles className="w-3 h-3" />
                          EXPAND
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Main stat */}
                      <div className="mb-2">
                        <span className="text-2xl font-bold text-[#10052F] dark:text-white">3</span>
                        <span className="text-sm text-muted-foreground ml-1">Mapped Events</span>
                      </div>
                      
                      {/* Event badge */}
                      <div className="flex items-center justify-between mb-3 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded border border-blue-200 dark:border-blue-800">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">LE-2025-001</span>
                        <span className="text-xs text-muted-foreground">Jan 8, 2025</span>
                      </div>
                      
                      {/* Timeline layout - grows to fill space */}
                      <div className="relative pl-5 space-y-2.5 flex-1">
                        {/* Vertical connector line */}
                        <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />
                        
                        {/* ROOT CAUSE */}
                        <div className="relative flex items-start gap-2">
                          <div className="absolute -left-5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center z-10">
                            <AlertCircle className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex-1 bg-red-50 dark:bg-red-900/20 rounded px-2.5 py-2">
                            <span className="text-[10px] font-semibold text-red-700 dark:text-red-400">ROOT CAUSE</span>
                            <p className="text-[9px] text-red-600 dark:text-red-400/80 mt-0.5 line-clamp-2">
                              Inadequate system access controls allowed unauthorized transactions...
                            </p>
                          </div>
                        </div>
                        
                        {/* CONTRIBUTING FACTORS */}
                        <div className="relative flex items-start gap-2">
                          <div className="absolute -left-5 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center z-10">
                            <Target className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex-1 bg-yellow-50 dark:bg-yellow-900/20 rounded px-2.5 py-2">
                            <span className="text-[10px] font-semibold text-yellow-700 dark:text-yellow-400">3 CONTRIBUTING FACTORS</span>
                          </div>
                        </div>
                        
                        {/* FAILED CONTROLS */}
                        <div className="relative flex items-start gap-2">
                          <div className="absolute -left-5 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center z-10">
                            <XCircle className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 rounded px-2.5 py-2">
                            <span className="text-[10px] font-semibold text-orange-700 dark:text-orange-400">2 FAILED CONTROLS</span>
                          </div>
                        </div>
                        
                        {/* ACTIONS */}
                        <div className="relative flex items-start gap-2">
                          <div className="absolute -left-5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center z-10">
                            <Lightbulb className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded px-2.5 py-2">
                            <span className="text-[10px] font-semibold text-green-700 dark:text-green-400">2 ACTIONS</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-border mt-3 pt-2">
                        <p className="text-[9px] text-muted-foreground">
                          AI-analyzed causal chains for <span className="underline cursor-pointer">loss events</span>.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right Column - 50% with equal height cards */}
              <div className="flex flex-col gap-3">
                {/* Inherent Risk Ratings Card */}
                <Card className="border border-[#00897B] shadow-sm bg-card rounded-none flex-1">
                  <CardContent className="p-2.5 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <AlertTriangle className="w-3 h-3 text-[#00897B]" />
                        </div>
                        <span className="text-[10px] font-bold text-[#10052F] dark:text-white uppercase tracking-wide">
                          INHERENT RISK RATINGS
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {inherentRiskCounts.critical} critical, {inherentRiskCounts.high} high
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 flex-1">
                      <div className="mb-1">
                        <span className="text-xl font-bold text-[#10052F] dark:text-white">{criticalHighTotal}</span>
                        <span className="text-sm text-muted-foreground ml-1">Critical & High</span>
                      </div>
                      
                      {/* Donut chart + Legend - Inline */}
                      <div className="flex items-center gap-3 flex-1">
                        <div className="relative w-16 h-16 flex-shrink-0">
                          {(() => {
                            const circumference = 2 * Math.PI * 14;
                            const total = inherentRiskCounts.total || 1;
                            const criticalPct = inherentRiskCounts.critical / total;
                            const highPct = inherentRiskCounts.high / total;
                            const mediumPct = inherentRiskCounts.medium / total;
                            const criticalAngle = criticalPct * 360;
                            const highAngle = highPct * 360;
                            
                            return (
                              <svg viewBox="0 0 36 36" className="w-16 h-16">
                                <circle cx="18" cy="18" r="14" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                                <circle 
                                  cx="18" cy="18" r="14" fill="none" 
                                  stroke="#EF4444" strokeWidth="3"
                                  strokeDasharray={`${criticalPct * circumference} ${circumference}`}
                                  transform="rotate(-90 18 18)"
                                />
                                <circle 
                                  cx="18" cy="18" r="14" fill="none" 
                                  stroke="#F97316" strokeWidth="3"
                                  strokeDasharray={`${highPct * circumference} ${circumference}`}
                                  transform={`rotate(${criticalAngle - 90} 18 18)`}
                                />
                                <circle 
                                  cx="18" cy="18" r="14" fill="none" 
                                  stroke="#F1BA50" strokeWidth="3"
                                  strokeDasharray={`${mediumPct * circumference} ${circumference}`}
                                  transform={`rotate(${criticalAngle + highAngle - 90} 18 18)`}
                                />
                              </svg>
                            );
                          })()}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold text-success">{criticalHighTotal}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-destructive" />
                            <span className="text-[10px] text-destructive">Critical</span>
                            <span className="text-[10px] text-gray-500">{inherentRiskCounts.critical}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            <span className="text-[10px] text-orange-500">High</span>
                            <span className="text-[10px] text-gray-500">{inherentRiskCounts.high}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-[#F1BA50]" />
                            <span className="text-[10px] text-[#F1BA50]">Medium</span>
                            <span className="text-[10px] text-gray-500">{inherentRiskCounts.medium}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-auto">
                      <p className="text-[9px] text-muted-foreground">
                        Review Critical and High ratings for control adequacy.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Control Effectiveness Card */}
                <Card className="border border-[#00897B] shadow-sm bg-card rounded-none flex-1">
                  <CardContent className="p-2.5 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <FileCheck className="w-3 h-3 text-[#00897B]" />
                        </div>
                        <span className="text-[10px] font-bold text-[#10052F] dark:text-white uppercase tracking-wide">
                          CONTROL EFFECTIVENESS
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{effectiveControls} effective</span>
                    </div>
                    
                    <div className="mb-1">
                      <span className="text-xl font-bold text-[#10052F] dark:text-white">{needsAttention}</span>
                      <span className="text-sm text-muted-foreground ml-1">Needing Attention</span>
                    </div>
                    
                    {/* Speedometer gauge with needle */}
                    <div className="flex flex-col items-center mb-2 flex-1 justify-center">
                      <div className="relative w-28 h-14">
                        <svg viewBox="0 0 100 55" className="w-28 h-14">
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
                        <span className="absolute left-0 bottom-0 text-[8px] text-muted-foreground">0%</span>
                        <span className="absolute right-0 bottom-0 text-[8px] text-muted-foreground">100%</span>
                      </div>
                      <div className="text-center">
                        <span className="text-xl font-bold text-success">{effectivenessPercent}%</span>
                        <span className="text-[9px] text-muted-foreground block">Effective</span>
                      </div>
                    </div>

                    {/* Horizontal Stacked Bar Chart */}
                    <div className="w-full h-2 flex rounded-sm overflow-hidden mb-1">
                      <div 
                        className="bg-green-500 h-full" 
                        style={{ width: `${totalControlRisks > 0 ? (effectiveControls / totalControlRisks) * 100 : 0}%` }}
                      />
                      <div 
                        className="bg-yellow-500 h-full" 
                        style={{ width: `${totalControlRisks > 0 ? (controlEvidenceCounts.partiallyEffective / totalControlRisks) * 100 : 0}%` }}
                      />
                      <div 
                        className="bg-red-500 h-full" 
                        style={{ width: `${totalControlRisks > 0 ? (controlEvidenceCounts.ineffective / totalControlRisks) * 100 : 0}%` }}
                      />
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-x-3 text-[8px] text-muted-foreground justify-center">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500" /> Effective: {effectiveControls}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-yellow-500" /> Partial: {controlEvidenceCounts.partiallyEffective}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500" /> Ineffective: {controlEvidenceCounts.ineffective}
                      </span>
                    </div>
                    
                    <div className="border-t border-border mt-auto pt-1.5">
                      <p className="text-[9px] text-muted-foreground">
                        Aggregate control effectiveness across all risks.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Remediation Tasks Card */}
                <Card className="border border-[#00897B] shadow-sm bg-card rounded-none flex-1">
                  <CardContent className="p-2.5 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <CheckSquare className="w-3 h-3 text-[#00897B]" />
                        </div>
                        <span className="text-[10px] font-bold text-[#10052F] dark:text-white uppercase tracking-wide">
                          REMEDIATION TASKS
                        </span>
                      </div>
                      <button className="flex items-center gap-1 text-xs text-muted-foreground cursor-not-allowed">
                        CLICK TO EXPAND
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="mb-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-[#10052F] dark:text-white">
                          {remediationTasksCounts.open + remediationTasksCounts.inProgress + remediationTasksCounts.validation}
                        </span>
                        <span className="text-sm text-muted-foreground">Open Tasks</span>
                      </div>
                      <span className="text-sm font-semibold text-red-500">1 critical</span>
                    </div>
                    
                    {/* Individual horizontal bars */}
                    {(() => {
                      const total = remediationTasksCounts.open + remediationTasksCounts.inProgress + remediationTasksCounts.validation + remediationTasksCounts.closed;
                      const maxVal = Math.max(remediationTasksCounts.open, remediationTasksCounts.inProgress, remediationTasksCounts.validation, remediationTasksCounts.closed, 1);
                      return (
                        <div className="flex flex-col gap-1.5 mb-2 flex-1">
                          {/* Open Bar */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground w-16 text-right">Open</span>
                            <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded-sm overflow-hidden">
                              <div 
                                className="h-full bg-red-500"
                                style={{ width: `${(remediationTasksCounts.open / maxVal) * 100}%` }}
                              />
                            </div>
                          </div>
                          
                          {/* In Progress Bar */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground w-16 text-right">In Progress</span>
                            <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded-sm overflow-hidden">
                              <div 
                                className="h-full bg-amber-500"
                                style={{ width: `${(remediationTasksCounts.inProgress / maxVal) * 100}%` }}
                              />
                            </div>
                          </div>
                          
                          {/* Validation Bar */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground w-16 text-right">Validation</span>
                            <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded-sm overflow-hidden">
                              <div 
                                className="h-full bg-blue-500"
                                style={{ width: `${(remediationTasksCounts.validation / maxVal) * 100}%` }}
                              />
                            </div>
                          </div>
                          
                          {/* Closed Bar */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground w-16 text-right">Closed</span>
                            <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded-sm overflow-hidden">
                              <div 
                                className="h-full bg-green-500"
                                style={{ width: `${(remediationTasksCounts.closed / maxVal) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Legend - 2 column grid with counts */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] mb-2">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="text-red-600 dark:text-red-400">Open</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">{remediationTasksCounts.open}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="text-amber-600 dark:text-amber-400">In Progress</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">{remediationTasksCounts.inProgress}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="text-blue-600 dark:text-blue-400">Validation</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{remediationTasksCounts.validation}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="text-green-600 dark:text-green-400">Closed</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">{remediationTasksCounts.closed}</span>
                      </span>
                    </div>
                    
                    <div className="border-t border-border mt-auto pt-1.5">
                      <p className="text-[9px] text-muted-foreground">
                        Track remediation progress across all risks.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })()}

        {/* Active Risk Profile Section */}
        <Card ref={reportSectionRef} className="border-[3px] border-border/50 dark:border-border shadow-sm bg-white dark:bg-card rounded-none">
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
          <div className="bg-emerald-50 dark:bg-emerald-900/10 border-b border-emerald-200 dark:border-emerald-800 px-4 py-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-emerald-600 dark:text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800 dark:text-emerald-200">
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
                                <CalendarCheck className="w-4 h-4 text-emerald-500" />
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
                                            idx === 0 ? 'bg-first-line' : 'bg-emerald-500'
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
                          const colors = ["bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-orange-500"];
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
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' 
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
    </div>
    </TooltipProvider>
  );
};


export default Dashboard1stLine;
