import { useState, useRef, useMemo, useEffect } from "react";
import { getInitialRiskDataCopy, SharedRiskData } from "@/data/initialRiskData";
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay, addDays, endOfWeek, endOfMonth, isToday } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ClipboardCheck, AlertTriangle, FileCheck, Clock, TrendingUp, TrendingDown, UserPlus, Users as UsersIcon, RotateCcw, Edit2, LogOut, User, ChevronDown, ChevronRight, Sparkles, Plus, RefreshCw, MoreHorizontal, Link, CheckCircle, CheckSquare, AlertCircle, Lock, ArrowUp, ArrowDown, Mail, X, Send, FileText, Upload, Menu, Check } from "lucide-react";
import { downloadRiskDocx } from "@/lib/generateRiskDocx";
import { BulkAssessmentModal } from "@/components/BulkAssessmentModal";
import { RiskAssessmentOverviewModal1stLine } from "@/components/RiskAssessmentOverviewModal1stLine";
import { AIDocumentAssessmentModal } from "@/components/AIDocumentAssessmentModal";
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
  const [assessorFilter, setAssessorFilter] = useState<string>("all");
  const [orgLevelFilter, setOrgLevelFilter] = useState<"all" | "level1" | "level2" | "level3">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hierarchyViewMode, setHierarchyViewMode] = useState<"level1" | "level2" | "level3">("level1");
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

  // Initialize expanded rows with all Level 1 risks by default (only once)
  useEffect(() => {
    if (!expandedRowsInitialized && riskData.length > 0) {
      const level1Ids = riskData.filter(r => r.riskLevel === "Level 1").map(r => r.id);
      setExpandedRows(new Set(level1Ids));
      setExpandedRowsInitialized(true);
    }
  }, [riskData, expandedRowsInitialized]);

  const getFilteredByTab = (data: RiskData[], tab: "own" | "assess" | "approve") => {
    return data.filter(risk => risk.tabCategory === tab);
  };

  const visibleRisks = useMemo(() => {
    let filtered = getFilteredByTab(riskData, activeTab);
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(risk => 
        risk.title.toLowerCase().includes(query)
      );
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
    
    // Apply assessor filter (only on assess tab)
    if (activeTab === "assess" && assessorFilter !== "all") {
      filtered = filtered.filter(risk => risk.assessors.includes(assessorFilter));
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
  }, [riskData, activeTab, orgLevelFilter, assessorFilter, searchQuery, hierarchyViewMode, expandedRows]);

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
      relatedControls: { 
        id: parsed.controls?.split(':')[0] || 'CTRL-NEW', 
        name: parsed.controls?.split(':')[1]?.trim() || 'New Control', 
        type: 'Preventive', 
        nature: 'Manual' 
      },
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

  useState(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  // Calculate dynamic assessment due counts from risk data
  const assessmentDueCounts = useMemo(() => {
    const today = startOfDay(new Date());
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Monday start
    const monthEnd = endOfMonth(today);
    
    let overdue = 0;
    let dueThisWeek = 0;
    let dueThisMonth = 0;
    let future = 0;
    
    riskData.forEach(risk => {
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
    });
    
    return { overdue, dueThisWeek, dueThisMonth, future, total: riskData.length };
  }, [riskData]);

  // Calculate inherent risk rating counts from risk data
  const inherentRiskCounts = useMemo(() => {
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;
    
    riskData.forEach(risk => {
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
  }, [riskData]);

  // Calculate assessment progress counts based on risk status
  const assessmentProgressCounts = useMemo(() => {
    let notStarted = 0;
    let inProgress = 0;
    let pendingApproval = 0;
    let completed = 0;
    
    riskData.forEach(risk => {
      const status = risk.status?.toLowerCase() || "";
      if (status === "completed" || status === "complete" || status === "closed") {
        completed++;
      } else if (status === "pending approval" || status === "review & challenge" || status === "pending review") {
        pendingApproval++;
      } else if (status === "in progress" || status === "under review") {
        inProgress++;
      } else if (status === "sent for assessment") {
        notStarted++;
      } else {
        // Default to not started for any other status
        notStarted++;
      }
    });
    
    const total = notStarted + inProgress + pendingApproval + completed;
    return { notStarted, inProgress, pendingApproval, completed, total };
  }, [riskData]);

  // Calculate control evidence status from controlEffectiveness
  const controlEvidenceCounts = useMemo(() => {
    let effective = 0;
    let partiallyEffective = 0;
    let ineffective = 0;
    let notAssessed = 0;
    
    riskData.forEach(risk => {
      const label = risk.controlEffectiveness?.label?.toLowerCase() || "";
      if (label === "effective" || label === "design effective") {
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
  }, [riskData]);

  // 1st Line specific metrics
  const metrics = useMemo(() => [
    {
      title: "My Assessments Due",
      value: assessmentDueCounts.overdue + assessmentDueCounts.dueThisWeek,
      trend: `${assessmentDueCounts.overdue} overdue`,
      trendUp: assessmentDueCounts.overdue === 0,
      icon: Clock,
      segments: [
        { label: "Overdue", value: assessmentDueCounts.overdue, sublabel: `${assessmentDueCounts.overdue} Overdue`, color: "bg-red-600" },
        { label: "Due This Week", value: assessmentDueCounts.dueThisWeek, sublabel: `${assessmentDueCounts.dueThisWeek} Due This Week`, color: "bg-amber-500" },
        { label: "Due This Month", value: assessmentDueCounts.dueThisMonth + assessmentDueCounts.future, sublabel: `${assessmentDueCounts.dueThisMonth + assessmentDueCounts.future} Due This Month`, color: "bg-green-600" },
      ],
      description: "Complete overdue assessments first to maintain compliance.",
      tooltip: "Shows your assigned risk assessments by due date status. Focus on overdue and due today items to meet assessment deadlines.",
    },
    {
      title: "Inherent Risk Ratings",
      value: inherentRiskCounts.total,
      trend: `${inherentRiskCounts.critical + inherentRiskCounts.high} require attention`,
      trendUp: inherentRiskCounts.critical === 0,
      icon: AlertTriangle,
      segments: [
        { label: "Critical", value: inherentRiskCounts.critical, sublabel: `${inherentRiskCounts.critical} Critical`, color: "bg-red-600" },
        { label: "High", value: inherentRiskCounts.high, sublabel: `${inherentRiskCounts.high} High`, color: "bg-amber-500" },
        { label: "Medium", value: inherentRiskCounts.medium, sublabel: `${inherentRiskCounts.medium} Medium`, color: "bg-green-600" },
      ],
      description: "Review Critical and High ratings for control adequacy.",
      tooltip: "Distribution of inherent risk ratings across your assigned risks. Higher ratings require stronger controls to mitigate.",
    },
    {
      title: "Control Evidence Status",
      value: controlEvidenceCounts.total,
      trend: `${controlEvidenceCounts.effective} effective`,
      trendUp: controlEvidenceCounts.effective > controlEvidenceCounts.ineffective,
      icon: FileCheck,
      segments: [
        { label: "Effective", value: controlEvidenceCounts.effective, sublabel: `${controlEvidenceCounts.effective} Effective`, color: "bg-green-600" },
        { label: "Partially Effective", value: controlEvidenceCounts.partiallyEffective, sublabel: `${controlEvidenceCounts.partiallyEffective} Partially Effective`, color: "bg-amber-500" },
        { label: "Ineffective", value: controlEvidenceCounts.ineffective, sublabel: `${controlEvidenceCounts.ineffective} Ineffective`, color: "bg-red-600" },
        { label: "Not Assessed", value: controlEvidenceCounts.notAssessed, sublabel: `${controlEvidenceCounts.notAssessed} Not Assessed`, color: "bg-gray-400" },
      ],
      description: "Review ineffective and not assessed controls.",
      tooltip: "Control effectiveness ratings across your assigned risks. Focus on improving ineffective controls.",
    },
    {
      title: "Assessment Progress",
      value: assessmentProgressCounts.total,
      trend: `${assessmentProgressCounts.completed} completed`,
      trendUp: assessmentProgressCounts.completed > 0,
      icon: CheckSquare,
      segments: [
        { label: "Completed", value: assessmentProgressCounts.completed, sublabel: `${assessmentProgressCounts.completed} Completed`, color: "bg-green-600" },
        { label: "Pending Approval", value: assessmentProgressCounts.pendingApproval, sublabel: `${assessmentProgressCounts.pendingApproval} Pending Approval`, color: "bg-purple-500" },
        { label: "In Progress", value: assessmentProgressCounts.inProgress, sublabel: `${assessmentProgressCounts.inProgress} In Progress`, color: "bg-amber-500" },
        { label: "Not Started", value: assessmentProgressCounts.notStarted, sublabel: `${assessmentProgressCounts.notStarted} Not Started`, color: "bg-gray-400" },
      ],
      description: "Track assessment completion based on risk status.",
      tooltip: "Overall assessment progress based on the status of your assigned risks.",
    },
  ], [assessmentDueCounts, inherentRiskCounts, controlEvidenceCounts, assessmentProgressCounts]);

  // Get unique assessors for the filter dropdown (only from assess tab)
  const uniqueAssessors = useMemo(() => {
    const assessRisks = riskData.filter(risk => risk.tabCategory === "assess");
    const allAssessors = assessRisks.flatMap(risk => risk.assessors);
    return [...new Set(allAssessors)].sort();
  }, [riskData]);

  const filteredRiskData = useMemo(() => {
    let filtered = getFilteredByTab(riskData, activeTab);
    
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
    
    // Apply assessor filter (only on assess tab)
    if (activeTab === "assess" && assessorFilter !== "all") {
      filtered = filtered.filter(risk => risk.assessors.includes(assessorFilter));
    }
    
    return filtered;
  }, [riskData, activeTab, orgLevelFilter, assessorFilter, searchQuery]);

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
    // Return ALL Level 2 risks (not filtered by parentRisk)
    return filteredRiskData.filter(r => r.riskLevel === "Level 2");
  };

  const hasChildren = (risk: RiskData) => {
    // Check if there are any risks at a lower level (regardless of parentRisk naming)
    if (risk.riskLevel === "Level 1") {
      return filteredRiskData.some(r => r.riskLevel === "Level 2");
    }
    if (risk.riskLevel === "Level 2") {
      return filteredRiskData.some(r => r.riskLevel === "Level 3");
    }
    return false;
  };

  const getLevel3Children = (level2Risk: RiskData): RiskData[] => {
    // Return ALL Level 3 risks (not filtered by parentRisk)
    return filteredRiskData.filter(r => r.riskLevel === "Level 3");
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 dark:from-background dark:via-background dark:to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 dark:bg-card/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-first-line to-emerald-600 flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  1st Line Risk Analyst Dashboard
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
                    1st Line Analyst
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
          <Card className="lg:col-span-1 border-[3px] border-border/50 dark:border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-emerald-50 to-green-50/50 dark:from-card dark:to-card">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Link className="w-5 h-5 text-first-line" />
                Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex flex-col gap-y-1">
                <button onClick={() => handleQuickLinkClick("assess")} className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline text-sm w-full text-left min-h-[28px]">
                  <ClipboardCheck className="w-4 h-4" />
                  View My Pending Assessments
                </button>
                <button onClick={() => handleQuickLinkClick("own")} className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline text-sm w-full text-left min-h-[28px]">
                  <FileCheck className="w-4 h-4" />
                  View Control Evidence Tasks
                </button>
                <a href="#" className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline text-sm min-h-[28px]">
                  <AlertCircle className="w-4 h-4" />
                  View My Action Plans
                </a>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={() => setAiDocumentModalOpen(true)} 
                        className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline text-sm w-full text-left min-h-[28px] cursor-help"
                      >
                        <Sparkles className="w-4 h-4" />
                        Assess Documents with AI
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Upload CSV/DOCX files to automatically create risk assessments using AI analysis</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <button 
                  onClick={downloadRiskDocx} 
                  className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline text-sm min-h-[28px]"
                >
                  <FileText className="w-4 h-4" />
                  Download Risk Events (Word)
                </button>
                <a href="/downloads/hierarchical-risk-assessments.csv" download className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline text-sm min-h-[28px]">
                  <FileText className="w-4 h-4" />
                  Download Sample Hierarchy (CSV)
                </a>
              </div>
            </CardContent>
          </Card>

          {metrics.map((metric, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Card className="border-[3px] border-border/50 dark:border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-slate-50/50 dark:from-card dark:to-card relative cursor-help">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-foreground">{metric.title}</h3>
                      <div className="w-10 h-10 rounded-full bg-first-line/10 border-2 border-first-line/20 flex items-center justify-center flex-shrink-0">
                        <metric.icon className="w-5 h-5 text-first-line" />
                      </div>
                    </div>
                
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground">
                      {typeof metric.value === 'string' ? metric.value : `${metric.value}${'isPercentage' in metric && metric.isPercentage ? "%" : ""}`}
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
                  
                  {/* Chart - Pie or Bar */}
                  <div className="space-y-2">
                    {'chartType' in metric && metric.chartType === 'pie' ? (
                      // Filled Pie Chart
                      (() => {
                        const segments = metric.segments as Array<{ label: string; value: number; sublabel: string; color: string; chartColor?: string }>;
                        let total = 0;
                        for (const s of segments) total += s.value;
                        
                        // Calculate pie slices
                        const slices: Array<{ path: string; color: string; percent: number }> = [];
                        let currentAngle = 0;
                        const cx = 18, cy = 18, r = 16;
                        
                        segments.forEach((segment) => {
                          const percent = total > 0 ? (segment.value / total) * 100 : 0;
                          const angle = (percent / 100) * 360;
                          const startAngle = currentAngle;
                          const endAngle = currentAngle + angle;
                          
                          // Convert angles to radians
                          const startRad = (startAngle - 90) * (Math.PI / 180);
                          const endRad = (endAngle - 90) * (Math.PI / 180);
                          
                          // Calculate arc points
                          const x1 = cx + r * Math.cos(startRad);
                          const y1 = cy + r * Math.sin(startRad);
                          const x2 = cx + r * Math.cos(endRad);
                          const y2 = cy + r * Math.sin(endRad);
                          
                          // Large arc flag
                          const largeArc = angle > 180 ? 1 : 0;
                          
                          // Create path
                          const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                          
                          slices.push({ path, color: segment.chartColor || '#888', percent });
                          currentAngle = endAngle;
                        });
                        
                        return (
                          <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16">
                              <svg viewBox="0 0 36 36" className="w-16 h-16">
                                {slices.map((slice, idx) => (
                                  <path
                                    key={idx}
                                    d={slice.path}
                                    fill={slice.color}
                                    className="transition-all duration-500"
                                  />
                                ))}
                              </svg>
                            </div>
                            <div className="flex flex-col gap-1">
                              {segments.map((segment, idx) => {
                                const percent = total > 0 ? Math.round((segment.value / total) * 100) : 0;
                                return (
                                  <div key={idx} className="flex items-center gap-1.5">
                                    <div className={`w-2.5 h-2.5 rounded-full ${segment.color}`} />
                                    <span className="text-xs font-medium text-muted-foreground">
                                      {segment.value} {segment.label} ({percent}%)
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      // Bar Chart (default)
                      (() => {
                        const segments = metric.segments as Array<{ label: string; value: number; sublabel: string; color: string }>;
                        let total = 0;
                        for (const s of segments) total += s.value;
                        return (
                          <>
                            <div className="flex h-6 rounded-lg overflow-hidden">
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
                            <div className="flex flex-wrap gap-x-2 gap-y-1">
                              {segments.map((segment, idx) => (
                                <div key={idx} className="flex items-center gap-1.5">
                                  <div className={`w-3 h-3 rounded-sm ${segment.color}`} />
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {segment.sublabel || segment.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground leading-snug pt-2">
                    {metric.description}
                  </p>
                </div>
                
                {/* AI Generated Icon */}
                <div className="absolute bottom-3 right-3">
                  <div className="w-8 h-8 rounded-full bg-first-line/10 border border-first-line/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-first-line" />
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
              <CardTitle className="text-lg font-semibold">My Risk Assessments</CardTitle>
              <TooltipProvider>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="sm" 
                        className="h-7 bg-muted/50 hover:bg-muted border border-foreground/30 text-foreground"
                        onClick={() => {
                          if (selectedRisks.size === 0) {
                            toast.error("Please select at least one risk assessment first");
                          } else {
                            setActionDialog({ open: true, type: "collaborate", riskId: Array.from(selectedRisks).join(",") });
                          }
                        }}
                      >
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
                      <Button 
                        size="sm" 
                        className="h-7 bg-muted/50 hover:bg-muted border border-foreground/30 text-foreground"
                        onClick={() => {
                          if (selectedRisks.size === 0) {
                            toast.error("Please select at least one risk assessment first");
                          } else {
                            setActionDialog({ open: true, type: "reassign", riskId: Array.from(selectedRisks).join(",") });
                          }
                        }}
                      >
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
                        className="h-7 bg-gradient-to-r from-first-line to-emerald-600 hover:from-first-line/90 hover:to-emerald-600/90 text-white cursor-help"
                        onClick={() => setAiDocumentModalOpen(true)}
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        Assess Documents with AI
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Upload CSV/DOCX files to create risk assessments with AI</p>
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
                  } ${highlightedTab === "own" ? "animate-tab-flash animate-tab-pulse ring-2 ring-emerald-400 ring-offset-2" : ""}`}
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
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  } ${highlightedTab === "assess" ? "animate-tab-flash animate-tab-pulse ring-2 ring-emerald-400 ring-offset-2" : ""}`}
                >
                  Risks to Assess
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
                      ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  } ${highlightedTab === "approve" ? "animate-tab-flash animate-tab-pulse ring-2 ring-indigo-400 ring-offset-2" : ""}`}
                >
                  Pending Approval
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === "approve" ? "bg-white/20" : "bg-muted"
                  }`}>
                    {riskData.filter(r => r.tabCategory === "approve").length}
                  </span>
                </button>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 mb-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-emerald-600 dark:text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800 dark:text-emerald-200">
                  {activeTab === "own" && "These are risks within your business area that you are responsible for managing day-to-day. Ensure controls are documented and effective."}
                  {activeTab === "assess" && "These risks require your assessment input. Complete inherent risk ratings, document control evidence, and identify any gaps or weaknesses."}
                  {activeTab === "approve" && "These assessments have been submitted and are awaiting review by the 2nd Line team. Monitor status for any feedback or challenges."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Input 
                  placeholder="Search risks by title..." 
                  className="pl-10 h-8" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <ClipboardCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>


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
            </div>

            {/* Bulk Action Toolbar */}
            {selectedRisks.size > 0 && (
              <div className="mb-4 p-3 bg-first-line/5 border border-first-line/20 rounded-lg shadow-sm animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="font-medium">
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
                      className="h-8 border-blue-500/50 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={() => {
                        if (selectedRisks.size === 0) {
                          toast.error("Please select at least one risk first");
                          return;
                        }
                        setDirectAssessmentModalOpen(true);
                      }}
                    >
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      AI Risk Search
                    </Button>
                    <Button
                      size="sm" 
                      className="h-8 bg-indigo-500 hover:bg-indigo-600 text-white"
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
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="border-collapse">
                  <TableHeader className="bg-muted/50 sticky top-0">
                    <TableRow>
                      <TableHead className="w-14 min-w-[56px] py-2 border-r border-b border-border">
                        <div className="flex items-center justify-center px-2">
                          <Checkbox 
                            checked={visibleRisks.length > 0 && selectedRisks.size === visibleRisks.length}
                            onCheckedChange={toggleSelectAll}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[120px] py-2 border-r border-b border-border text-xs">Update Completed</TableHead>
                      <TableHead className="min-w-[220px] py-2 border-r border-b border-border">
                        Risk Title
                      </TableHead>
                      <TableHead className="min-w-[120px] py-2 border-r border-b border-border">Due Date</TableHead>
                      <TableHead className="min-w-[200px] py-2 border-r border-b border-border">Assessment Progress</TableHead>
                      <TableHead className="min-w-[100px] py-2 border-r border-b border-border">Risk ID</TableHead>
                      <TableHead className="min-w-[140px] py-2 border-r border-b border-border">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 hover:text-primary transition-colors">
                              <Menu className="w-4 h-4" />
                              <span>Risk Hierarchy</span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="bg-popover border border-border shadow-lg z-[100]">
                            <DropdownMenuLabel>Group by Level</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setHierarchyViewMode("level1")}
                              className={hierarchyViewMode === "level1" ? "bg-first-line/10 text-first-line" : ""}
                            >
                              <Check className={`w-4 h-4 mr-2 ${hierarchyViewMode === "level1" ? "opacity-100" : "opacity-0"}`} />
                              Level 1 (with L2 → L3 dropdowns)
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setHierarchyViewMode("level2")}
                              className={hierarchyViewMode === "level2" ? "bg-first-line/10 text-first-line" : ""}
                            >
                              <Check className={`w-4 h-4 mr-2 ${hierarchyViewMode === "level2" ? "opacity-100" : "opacity-0"}`} />
                              Level 2 (with L3 dropdown)
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setHierarchyViewMode("level3")}
                              className={hierarchyViewMode === "level3" ? "bg-first-line/10 text-first-line" : ""}
                            >
                              <Check className={`w-4 h-4 mr-2 ${hierarchyViewMode === "level3" ? "opacity-100" : "opacity-0"}`} />
                              Level 3 only (flat list)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableHead>
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
                    {visibleRisks.map((risk, index) => {
                      const isLevel1 = risk.riskLevel === "Level 1";
                      const isLevel3 = risk.riskLevel === "Level 3";
                      const isExpanded = expandedRows.has(risk.id);
                      const canExpand = hasChildren(risk);
                      
                      return (
                      <TableRow key={index} className={`hover:bg-muted/50 transition-colors ${
                        risk.riskLevel === "Level 1" ? 'bg-blue-50/30 dark:bg-blue-950/10' : 
                        risk.riskLevel === "Level 2" ? 'bg-purple-50/30 dark:bg-purple-950/10' :
                        'bg-orange-50/30 dark:bg-orange-950/10'
                      }`}>
                        <TableCell className="w-14 min-w-[56px] py-2 border-r border-b border-border">
                          <div className="flex items-center justify-center px-2">
                            <Checkbox 
                              checked={selectedRisks.has(risk.id)}
                              onCheckedChange={() => toggleRiskSelection(risk.id)}
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
                          <div className={`flex items-start gap-2 ${
                            hierarchyViewMode === "level1" ? (
                              risk.riskLevel === "Level 2" ? "pl-6" : 
                              risk.riskLevel === "Level 3" ? "pl-12" : ""
                            ) : hierarchyViewMode === "level2" ? (
                              risk.riskLevel === "Level 3" ? "pl-6" : ""
                            ) : ""
                          }`}>
                          {/* Tree line indicator for child risks - L-shaped connectors */}
                            {hierarchyViewMode === "level1" && risk.riskLevel === "Level 2" && (
                              <div className="flex items-center flex-shrink-0 text-purple-500 dark:text-purple-400 font-light text-lg leading-none mr-1">
                                └
                              </div>
                            )}
                            {hierarchyViewMode === "level1" && risk.riskLevel === "Level 3" && (
                              <div className="flex items-center flex-shrink-0 text-orange-500 dark:text-orange-400 font-light text-lg leading-none mr-1">
                                <span className="text-muted-foreground/50 mr-0.5">│</span>
                                └
                              </div>
                            )}
                            {hierarchyViewMode === "level2" && risk.riskLevel === "Level 3" && (
                              <div className="flex items-center flex-shrink-0 text-orange-500 dark:text-orange-400 font-light text-lg leading-none mr-1">
                                └
                              </div>
                            )}
                            
                            {/* Expand/collapse button - only show if risk has children */}
                            {hierarchyViewMode === "level1" && risk.riskLevel === "Level 1" && canExpand && (
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
                            {hierarchyViewMode === "level1" && risk.riskLevel === "Level 2" && canExpand && (
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
                            {hierarchyViewMode === "level2" && risk.riskLevel === "Level 2" && canExpand && (
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
                            
                            <div className="flex flex-col gap-1">
                              {/* Risk Title */}
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
                                  <p>Click to open the risk assessment overview</p>
                                </TooltipContent>
                              </Tooltip>
                              <span className="text-xs text-muted-foreground">{risk.owner}</span>
                            </div>
                          </div>
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
                                risk.assessmentProgress?.assess === "completed" ? "bg-green-500" :
                                risk.assessmentProgress?.assess === "in-progress" ? "bg-amber-500" :
                                "bg-gray-300 dark:bg-gray-600"
                              }`} />
                              <div className={`h-2 flex-1 rounded-sm ${
                                risk.assessmentProgress?.reviewChallenge === "completed" ? "bg-green-500" :
                                risk.assessmentProgress?.reviewChallenge === "in-progress" ? "bg-amber-500" :
                                "bg-gray-300 dark:bg-gray-600"
                              }`} />
                              <div className={`h-2 flex-1 rounded-sm ${
                                risk.assessmentProgress?.approve === "completed" ? "bg-green-500" :
                                risk.assessmentProgress?.approve === "in-progress" ? "bg-amber-500" :
                                "bg-gray-300 dark:bg-gray-600"
                              }`} />
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Assess</span>
                              <span>Review</span>
                              <span>Approve</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium py-2 border-r border-b border-border">
                          <span className="font-mono text-sm font-medium text-first-line">{risk.id}</span>
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
                                          idx === 0 ? 'bg-first-line' : 'bg-emerald-500'
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
                            <span className={`text-xs flex items-center gap-0.5 ${risk.inherentTrend.up ? 'text-red-600' : 'text-green-600'}`}>
                              {risk.inherentTrend.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                              {risk.inherentTrend.value}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          <div className="text-xs">
                            <div className="font-medium text-first-line">{risk.relatedControls.id}</div>
                            <div className="text-muted-foreground truncate max-w-[150px]">{risk.relatedControls.name}</div>
                            <div className="flex gap-1 mt-1">
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">{risk.relatedControls.type}</Badge>
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">{risk.relatedControls.nature}</Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 border-r border-b border-border">
                          {renderEditableCell(
                            risk.id,
                            'controlEffectiveness',
                            risk.controlEffectiveness.label,
                            getEffectivenessBadge(risk.controlEffectiveness.label, risk.controlEffectiveness.color),
                            'select',
                            ['Effective', 'Partially Effective', 'Ineffective', 'Not Assessed']
                          )}
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
                            <span className={`text-xs flex items-center gap-0.5 ${risk.residualTrend.up ? 'text-red-600' : 'text-green-600'}`}>
                              {risk.residualTrend.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                              {risk.residualTrend.value}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 border-b border-border">
                          {renderEditableCell(
                            risk.id,
                            'status',
                            risk.status,
                            <Badge className={getStatusColor(risk.status)}>{risk.status}</Badge>,
                            'select',
                            ['Sent for Assessment', 'In Progress', 'Pending Approval', 'Completed', 'Closed']
                          )}
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
