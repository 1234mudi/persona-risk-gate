import { useState, useEffect } from "react";
import pptxgen from "pptxgenjs";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  ArrowRight,
  MessageSquare, 
  FileText, 
  Users, 
  Save, 
  Send, 
  X,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Shield,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Download,
  Share2,
  History,
  Target,
  BarChart3,
  ClipboardCheck,
  MessageCircle,
  UserPlus,
  Check,
  Clock,
  AlertCircle,
  Reply,
  PanelRightClose,
  PanelRightOpen,
  MoreHorizontal,
  Flag,
  ThumbsUp,
  ThumbsDown,
  Info,
  Copy,
  Clipboard,
  Bell,
  AtSign,
  Upload,
  Calendar,
  Maximize2,
  Minimize2,
  HelpCircle,
  Paperclip,
  XCircle,
  RefreshCw,
  Library,
  PenLine
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { AIFieldIndicator } from "@/components/AIFieldIndicator";
import { AIFieldSuggestion } from "@/components/AIFieldSuggestion";
import { AddControlModal } from "@/components/AddControlModal";
import { cn } from "@/lib/utils";
import { initialRiskData, SharedRiskData } from "@/data/initialRiskData";
import { useMemo } from "react";

// Types
interface Factor {
  id: string;
  name: string;
  description: string;
  rating: number;
  comments: string;
  weightage: number;
  cellComments?: CellComment[];
}

interface ControlEvidence {
  name: string;
  type: string;
  date: string;
}

interface Control {
  id: string;
  name: string;
  description: string;
  type: string;
  owner: string;
  designRating: number;
  operatingRating: number;
  testingRating: number;
  evidences: ControlEvidence[];
  cellComments?: CellComment[];
  isNotApplicable: boolean;
  naJustification: string;
}

interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  message: string;
  timestamp: string;
  type: 'message' | 'system';
}

interface CellComment {
  id: string;
  user: string;
  avatar: string;
  field: string;
  comment: string;
  status: 'pending' | 'resolved' | 'disputed';
  timestamp: string;
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  status: 'online' | 'offline' | 'editing';
  lastActive: string;
}

const RiskAssessmentForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const section = searchParams.get("section") || "inherent-rating";
  const riskId = searchParams.get("riskId") || "RISK-2025-001";
  const riskName = searchParams.get("riskName") || "KYC Risk Assessment Inadequacy";
  const aiAssessed = searchParams.get("aiAssessed");
  const mode = searchParams.get("mode"); // 'update-version' for new version creation
  const source = searchParams.get("source") || "1st-line"; // Track where user came from
  const openPanel = searchParams.get("openPanel"); // Open specific panel on load
  const isUpdateVersionMode = mode === "update-version";
  
  const [activeTab, setActiveTab] = useState(section);
  const [bottomTab, setBottomTab] = useState("previous-assessments");
  const [showWeights, setShowWeights] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'review' | 'treatment' | 'metrics' | 'details'>('review');
  const [expandedPreviousFloater, setExpandedPreviousFloater] = useState<{
    inherent: boolean;
    control: boolean;
    residual: boolean;
  }>({ inherent: false, control: false, residual: false });
  const [collaborateOpen, setCollaborateOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [newCellComment, setNewCellComment] = useState("");
  const [fullEditAccess, setFullEditAccess] = useState(true);
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
  const [activeCellComment, setActiveCellComment] = useState<{factorId: string; field: string} | null>(null);
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);
  const [addControlModalOpen, setAddControlModalOpen] = useState(false);
  const [showAddControlOptions, setShowAddControlOptions] = useState(false);
  const [showNewControlForm, setShowNewControlForm] = useState(false);
  const [newControlTitle, setNewControlTitle] = useState("");
  const [newControlType, setNewControlType] = useState<"Preventive" | "Detective">("Preventive");
  const [addToLibrary, setAddToLibrary] = useState(false);
  const [orgScoresPanelExpanded, setOrgScoresPanelExpanded] = useState(false);
  const [expandedRightPanelSections, setExpandedRightPanelSections] = useState<{
    review: boolean;
    treatment: boolean;
    metrics: boolean;
    details: boolean;
  }>({
    review: false,
    treatment: false,
    metrics: false,
    details: false,
  });
  
  // Review/Challenge panel state
  const [resolvingItemId, setResolvingItemId] = useState<string | null>(null);
  const [resolutionComment, setResolutionComment] = useState("");
  const [challengeComment, setChallengeComment] = useState("");
  const pendingReviewComments = 2; // Count of unresolved review comments
  
  // AI field tracking - tracks which fields have been AI-filled and which have been manually edited
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set());
  const [aiAssessedProcessed, setAiAssessedProcessed] = useState(false);
  
  // Update version mode - track initial values and changed fields
  const [updateVersionChangedFields, setUpdateVersionChangedFields] = useState<Set<string>>(new Set());
  const [initialValuesStored, setInitialValuesStored] = useState(false);
  const [initialInherentFactors, setInitialInherentFactors] = useState<Factor[]>([]);
  const [initialControls, setInitialControls] = useState<Control[]>([]);
  const [initialResidualFactors, setInitialResidualFactors] = useState<Factor[]>([]);
  
  // Real-time collaboration - simulated collaborator positions on fields
  const [collaboratorPositions] = useState<{
    cellId: string;
    collaborator: { name: string; avatar: string; color: string };
  }[]>([
    // Inherent Rating section collaborators
    { cellId: "financial-impact-rating", collaborator: { name: "Sarah Johnson", avatar: "SJ", color: "bg-emerald-500" } },
    { cellId: "operational-impact-comments", collaborator: { name: "Emily Roberts", avatar: "ER", color: "bg-purple-500" } },
    // Control Effectiveness section collaborators
    { cellId: "ctl-001-design", collaborator: { name: "Michael Chen", avatar: "MC", color: "bg-blue-500" } },
    // Residual Rating section collaborators
    { cellId: "residual-financial-impact-rating", collaborator: { name: "Anna Lee", avatar: "AL", color: "bg-amber-500" } },
  ]);
  
  // Helper to determine which section a cellId belongs to
  const getSectionFromCellId = (cellId: string): 'inherent' | 'control' | 'residual' | null => {
    // Control fields - match control IDs (ctl-xxx)
    if (cellId.startsWith('ctl-')) {
      return 'control';
    }
    // Residual risk fields - match residual factor names
    if (cellId.startsWith('residual-')) {
      return 'residual';
    }
    // Inherent risk fields - all other factor fields
    const inherentPatterns = ['financial-impact', 'operational-impact', 'reputational-impact', 'regulatory-impact', 'strategic-impact'];
    if (inherentPatterns.some(pattern => cellId.includes(pattern))) {
      return 'inherent';
    }
    return null;
  };

  // Get collaborators active in a specific section
  const getCollaboratorsForSection = (section: 'inherent' | 'control' | 'residual') => {
    return collaboratorPositions.filter(pos => getSectionFromCellId(pos.cellId) === section);
  };
  
  // Track which sections have active editors
  const [activeSections] = useState<{ section: string; color: string }[]>([
    { section: "inherent-rating", color: "ring-emerald-500/30" },
  ]);
  
  // Chat messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "1", user: "Sarah Johnson", avatar: "SJ", message: "I've updated the financial impact rating based on the latest audit findings.", timestamp: "10:32 AM", type: "message" },
    { id: "2", user: "System", avatar: "S", message: "Michael Chen joined the assessment", timestamp: "10:35 AM", type: "system" },
    { id: "3", user: "Michael Chen", avatar: "MC", message: "Looks good. Should we increase the regulatory impact given the new compliance requirements?", timestamp: "10:38 AM", type: "message" },
    { id: "4", user: "Emily Roberts", avatar: "ER", message: "I agree with Michael. The regulatory landscape has changed significantly.", timestamp: "10:42 AM", type: "message" },
  ]);

  // Cell-level comments
  const [cellComments, setCellComments] = useState<CellComment[]>([
    { id: "cc1", user: "QA Team", avatar: "QA", field: "Financial Impact - Rating", comment: "Please justify the Medium rating given recent losses.", status: "pending", timestamp: "2 hours ago" },
    { id: "cc2", user: "Risk Committee", avatar: "RC", field: "Reputational Impact - Rating", comment: "High rating approved after review.", status: "resolved", timestamp: "Yesterday" },
  ]);

  // Activity log
  const [activityLog] = useState([
    { id: "a1", user: "Sarah Johnson", avatar: "SJ", action: "Updated Financial Impact rating from 2 to 3", timestamp: "10:32 AM" },
    { id: "a2", user: "Michael Chen", avatar: "MC", action: "Added comment on Regulatory Impact", timestamp: "10:38 AM" },
    { id: "a3", user: "Emily Roberts", avatar: "ER", action: "Resolved comment on Control CTL-001", timestamp: "10:45 AM" },
    { id: "a4", user: "System", avatar: "SY", action: "Auto-saved assessment", timestamp: "10:50 AM" },
  ]);

  // Available collaborators to select from
  const [availableCollaborators] = useState<Collaborator[]>([
    { id: "1", name: "Sarah Johnson", email: "sarah.j@company.com", avatar: "SJ", role: "Risk Analyst", status: "offline", lastActive: "Now" },
    { id: "2", name: "Michael Chen", email: "m.chen@company.com", avatar: "MC", role: "Compliance Officer", status: "offline", lastActive: "2 min ago" },
    { id: "3", name: "Emma Rodriguez", email: "e.rodriguez@company.com", avatar: "ER", role: "Senior Auditor", status: "offline", lastActive: "5 min ago" },
    { id: "4", name: "David Park", email: "d.park@company.com", avatar: "DP", role: "Risk Manager", status: "offline", lastActive: "1 hour ago" },
    { id: "5", name: "Lisa Thompson", email: "l.thompson@company.com", avatar: "LT", role: "Business Analyst", status: "offline", lastActive: "30 min ago" },
  ]);

  // Current active collaborators
  const [activeCollaborators] = useState<Collaborator[]>([
    { id: "c1", name: "John Smith", email: "j.smith@company.com", avatar: "JS", role: "Risk Owner", status: "editing", lastActive: "Now" },
    { id: "c2", name: "Anna Lee", email: "a.lee@company.com", avatar: "AL", role: "Reviewer", status: "online", lastActive: "2 min ago" },
    { id: "c3", name: "Robert Wilson", email: "r.wilson@company.com", avatar: "RW", role: "Approver", status: "online", lastActive: "5 min ago" },
  ]);

  // Previous assessments
  const previousAssessments = [
    { id: "ASM-1042", date: "2024-10-15", inherent: 3.8, residual: 2.3, status: "Approved", assessor: "John Smith" },
    { id: "ASM-1035", date: "2024-07-20", inherent: 4.0, residual: 2.5, status: "Approved", assessor: "Sarah Johnson" },
    { id: "ASM-1028", date: "2024-04-12", inherent: 3.5, residual: 2.8, status: "Approved", assessor: "Michael Chen" },
  ];

  // Historical data for section-specific assessments
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(0);
  
  const inherentHistory = [
    { 
      date: "2024-03-15", 
      score: 3.5, 
      factors: [
        { name: "Impact", rating: 3, weight: 50 },
        { name: "Likelihood", rating: 4, weight: 50 },
      ]
    },
    { 
      date: "2023-12-10", 
      score: 4.0, 
      factors: [
        { name: "Impact", rating: 4, weight: 50 },
        { name: "Likelihood", rating: 4, weight: 50 },
      ]
    },
    { 
      date: "2023-09-05", 
      score: 3.0, 
      factors: [
        { name: "Impact", rating: 3, weight: 50 },
        { name: "Likelihood", rating: 3, weight: 50 },
      ]
    },
  ];

  const controlHistory = [
    { 
      date: "2024-03-15", 
      score: 2.8, 
      controls: [
        { name: "KYC Verification Process", design: 3, operating: 2, overall: 3 },
        { name: "Customer Due Diligence", design: 4, operating: 3, overall: 3 },
        { name: "Periodic Review Process", design: 3, operating: 3, overall: 2 },
      ]
    },
    { 
      date: "2023-12-10", 
      score: 2.5, 
      controls: [
        { name: "KYC Verification Process", design: 2, operating: 2, overall: 3 },
        { name: "Customer Due Diligence", design: 3, operating: 3, overall: 2 },
        { name: "Periodic Review Process", design: 2, operating: 3, overall: 2 },
      ]
    },
    { 
      date: "2023-09-05", 
      score: 3.0, 
      controls: [
        { name: "KYC Verification Process", design: 3, operating: 3, overall: 3 },
        { name: "Customer Due Diligence", design: 3, operating: 3, overall: 3 },
        { name: "Periodic Review Process", design: 3, operating: 3, overall: 3 },
      ]
    },
  ];

  const residualHistory = [
    { 
      date: "2024-03-15", 
      score: 2.0, 
      factors: [
        { name: "Impact", rating: 2, weight: 50 },
        { name: "Likelihood", rating: 2, weight: 50 },
      ]
    },
    { 
      date: "2023-12-10", 
      score: 3.0, 
      factors: [
        { name: "Impact", rating: 3, weight: 50 },
        { name: "Likelihood", rating: 3, weight: 50 },
      ]
    },
    { 
      date: "2023-09-05", 
      score: 3.5, 
      factors: [
        { name: "Impact", rating: 3, weight: 50 },
        { name: "Likelihood", rating: 4, weight: 50 },
      ]
    },
  ];

  const getHistoryTitle = () => {
    switch (activeTab) {
      case "inherent-rating": return "Inherent Risk History";
      case "control-effectiveness": return "Control Effectiveness History";
      case "residual-rating": return "Residual Risk History";
      default: return "Previous Assessments";
    }
  };

  const getHistoryData = () => {
    switch (activeTab) {
      case "inherent-rating": return inherentHistory;
      case "control-effectiveness": return controlHistory;
      case "residual-rating": return residualHistory;
      default: return inherentHistory;
    }
  };

  const getHistoryRatingBadge = (rating: number) => {
    if (rating >= 4) return { label: "High", color: "bg-red-100 text-red-700 border-red-200" };
    if (rating >= 3) return { label: "Medium", color: "bg-amber-100 text-amber-700 border-amber-200" };
    return { label: "Low", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  };

  // Copy history handlers
  const handleCopyHistoryToInherent = (historyItem: typeof inherentHistory[0]) => {
    setInherentFactors(prevFactors => 
      prevFactors.map(factor => {
        const historyFactor = historyItem.factors.find(f => f.name === factor.name);
        if (historyFactor) {
          return { ...factor, rating: historyFactor.rating };
        }
        return factor;
      })
    );
    setExpandedPreviousFloater(prev => ({ ...prev, inherent: false }));
    toast.success(`Inherent risk values from ${historyItem.date} copied to current assessment`);
  };

  const handleCopyHistoryToControl = (historyItem: typeof controlHistory[0]) => {
    setControls(prevControls => 
      prevControls.map(control => {
        const historyControl = historyItem.controls.find(c => c.name === control.name);
        if (historyControl) {
          return { 
            ...control, 
            designRating: historyControl.design, 
            operatingRating: historyControl.operating,
            testingRating: historyControl.overall
          };
        }
        return control;
      })
    );
    setExpandedPreviousFloater(prev => ({ ...prev, control: false }));
    toast.success(`Control effectiveness values from ${historyItem.date} copied to current assessment`);
  };

  const handleCopyHistoryToResidual = (historyItem: typeof residualHistory[0]) => {
    setResidualFactors(prevFactors => 
      prevFactors.map(factor => {
        const historyFactor = historyItem.factors.find(f => f.name === factor.name);
        if (historyFactor) {
          return { ...factor, rating: historyFactor.rating };
        }
        return factor;
      })
    );
    setExpandedPreviousFloater(prev => ({ ...prev, residual: false }));
    toast.success(`Residual risk values from ${historyItem.date} copied to current assessment`);
  };

  // Previous Assessment Floater Component for tabs - Hover tooltip version
  const FormPreviousAssessmentFloater = ({
    type,
    historyData
  }: {
    type: 'inherent' | 'control' | 'residual';
    historyData: any[];
  }) => {
    if (!historyData || historyData.length === 0) return null;

    const hasData = historyData.length > 0;

    return (
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          <button className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md border transition-all ${
            hasData 
              ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 animate-glow-blue hover:animate-none hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:scale-105 shadow-sm' 
              : 'text-blue-600 dark:text-blue-400 border-transparent'
          }`}>
            <History className="w-3.5 h-3.5" />
            <span>Previous Assessments ({historyData.length})</span>
            {hasData && <ChevronRight className="w-3 h-3 animate-bounce-x" />}
          </button>
        </HoverCardTrigger>
        <HoverCardContent side="bottom" align="start" className="w-64 max-w-[256px] max-h-[50vh] overflow-y-auto p-2">
          <div className="pb-1.5 mb-1.5 border-b border-border">
            <h3 className="text-[10px] font-semibold text-primary">
              {type === 'inherent' && 'Inherent Risk History'}
              {type === 'control' && 'Control Effectiveness History'}
              {type === 'residual' && 'Residual Risk History'}
            </h3>
          </div>
          <div className="space-y-2.5">
            {historyData.map((item, idx) => {
              const ratingInfo = getHistoryRatingBadge(item.score);
              const borderColor = ratingInfo.label === 'High' ? 'border-l-red-500' : 
                                  ratingInfo.label === 'Medium' ? 'border-l-amber-500' : 'border-l-emerald-500';
              return (
                <div key={idx} className={`p-2 rounded-md border-2 border-border bg-card shadow-sm hover:bg-muted/50 transition-colors border-l-4 ${borderColor}`}>
                  <div className="flex items-center justify-between pb-1 mb-1 border-b border-dashed border-border/50">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5 text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground font-semibold">{item.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge className={`${ratingInfo.color} text-[8px] px-1 py-0 font-bold`}>
                        {item.score}
                      </Badge>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              className="p-0.5 rounded hover:bg-muted transition-colors"
                              onClick={() => {
                                if (type === 'inherent') handleCopyHistoryToInherent(item);
                                if (type === 'control') handleCopyHistoryToControl(item);
                                if (type === 'residual') handleCopyHistoryToResidual(item);
                              }}
                            >
                              <Copy className="w-2.5 h-2.5 text-blue-600" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="text-[9px]">Copy to Current</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  {/* Factor/Control details based on type */}
                  {type !== 'control' && item.factors && (
                    <div className="mt-1">
                      {item.factors.map((factor: any, fIdx: number) => (
                        <div key={fIdx} className="flex items-center justify-between text-[8px] py-0.5 border-b border-border/30 last:border-b-0">
                          <span className="text-muted-foreground">{factor.name}</span>
                          <div className="flex items-center gap-0.5">
                            <Badge variant="outline" className={`${getHistoryRatingBadge(factor.rating).color} text-[7px] px-1 py-0`}>
                              {factor.rating}
                            </Badge>
                            <span className="text-muted-foreground/70 text-[7px]">({factor.weight}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {type === 'control' && item.controls && (
                    <div className="mt-1">
                      {item.controls.map((control: any, cIdx: number) => (
                        <div key={cIdx} className="flex items-center justify-between text-[8px] py-0.5 border-b border-border/30 last:border-b-0">
                          <span className="text-muted-foreground truncate max-w-[90px]">{control.name}</span>
                          <div className="flex items-center gap-0.5">
                            <Badge variant="outline" className={`${getHistoryRatingBadge(control.design).color} text-[7px] px-0.5 py-0`}>
                              D:{control.design}
                            </Badge>
                            <Badge variant="outline" className={`${getHistoryRatingBadge(control.operating).color} text-[7px] px-0.5 py-0`}>
                              O:{control.operating}
                            </Badge>
                            <Badge variant="outline" className={`${getHistoryRatingBadge(control.overall).color} text-[7px] px-0.5 py-0`}>
                              Ov:{control.overall}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  // Treatment plans
  const [treatmentPlans] = useState([
    { id: "TRT-001", action: "Implement enhanced KYC verification system", owner: "IT Department", dueDate: "2025-06-30", status: "In Progress", progress: 65 },
    { id: "TRT-002", action: "Conduct staff training on new compliance procedures", owner: "HR & Training", dueDate: "2025-05-15", status: "Planned", progress: 20 },
    { id: "TRT-003", action: "Deploy automated monitoring tools", owner: "Operations", dueDate: "2025-08-01", status: "Not Started", progress: 0 },
  ]);

  // Metrics & Losses - Enhanced with detailed information
  const [metricsData] = useState({
    kris: [
      { id: "KRI-001", name: "KYC Completion Rate", description: "Percentage of customer onboarding with complete KYC documentation", current: 94.5, target: 98, threshold: "≥ 98%", breachType: "Below Threshold", trend: "up", unit: "%" },
      { id: "KRI-002", name: "False Positive Rate", description: "Rate of incorrectly flagged transactions in AML screening", current: 12.3, target: 8, threshold: "≤ 8%", breachType: "Above Threshold", trend: "down", unit: "%" },
      { id: "KRI-003", name: "Average Processing Time", description: "Mean time to complete customer verification process", current: 2.4, target: 2, threshold: "≤ 2 days", breachType: "Above Threshold", trend: "stable", unit: "days" },
      { id: "KRI-004", name: "Document Verification Accuracy", description: "Accuracy rate of automated document verification", current: 89.2, target: 95, threshold: "≥ 95%", breachType: "Below Threshold", trend: "up", unit: "%" },
      { id: "KRI-005", name: "Customer Data Update Rate", description: "Percentage of customer records updated within refresh cycle", current: 76.8, target: 90, threshold: "≥ 90%", breachType: "Below Threshold", trend: "stable", unit: "%" },
      { id: "KRI-006", name: "Sanction Screening Coverage", description: "Percentage of transactions screened against sanction lists", current: 99.8, target: 100, threshold: "= 100%", breachType: "Below Threshold", trend: "up", unit: "%" },
      { id: "KRI-007", name: "Alert Investigation Time", description: "Average time to investigate and close alerts", current: 4.2, target: 3, threshold: "≤ 3 days", breachType: "Above Threshold", trend: "down", unit: "days" },
      { id: "KRI-008", name: "Periodic Review Completion", description: "Completion rate of scheduled customer reviews", current: 82.5, target: 95, threshold: "≥ 95%", breachType: "Below Threshold", trend: "up", unit: "%" },
    ],
    losses: [
      { id: "LOSS-2024-001", name: "Regulatory Fine - KYC Non-Compliance", description: "Regulatory fine for incomplete KYC records identified during examination", amount: 250000, date: "2024-08-15", category: "Regulatory", status: "Approved" },
      { id: "LOSS-2024-002", name: "Fraud Incident - Identity Verification Gap", description: "Operational loss due to fraud incident resulting from identity verification weakness", amount: 75000, date: "2024-06-20", category: "Fraud", status: "Approved" },
      { id: "LOSS-2024-003", name: "System Downtime - Verification Platform", description: "Business disruption loss from extended platform outage affecting customer onboarding", amount: 180000, date: "2024-09-05", category: "Operational", status: "Approved" },
      { id: "LOSS-2024-004", name: "Customer Compensation - Processing Delays", description: "Goodwill payments to customers affected by excessive verification delays", amount: 45000, date: "2024-10-12", category: "Customer Impact", status: "Approved" },
    ]
  });
  
  // Inherent Risk Factors - Impact and Likelihood based
  const [inherentFactors, setInherentFactors] = useState<Factor[]>([
    { id: "1", name: "Impact", description: "Potential severity of consequences if the risk materializes (1=Very Low, 2=Low, 3=Medium, 4=High, 5=Extreme)", rating: 4, comments: "High impact expected due to significant financial penalties and regulatory scrutiny", weightage: 50, cellComments: [] },
    { id: "2", name: "Likelihood", description: "Probability of the risk occurring (1=Rare, 2=Unlikely, 3=Moderate, 4=Likely, 5=Almost Certain)", rating: 3, comments: "Moderate likelihood based on current control gaps and industry trends", weightage: 50, cellComments: [] },
  ]);
  
  // Controls
  const [controls, setControls] = useState<Control[]>([
    { 
      id: "CTL-001", 
      name: "KYC Verification Process", 
      description: "Verification of customer identity documents and background checks performed during onboarding. Includes document validation, sanction screening, and PEP checks to ensure regulatory compliance.",
      type: "Preventive", 
      owner: "Compliance Team", 
      designRating: 3, 
      operatingRating: 2, 
      testingRating: 3, 
      evidences: [
        { name: "Process Flow Diagram", type: "Document", date: "2024-10-15" },
        { name: "Last Audit Report", type: "Report", date: "2024-09-20" },
        { name: "Testing Documentation", type: "Evidence", date: "2024-11-01" },
      ],
      cellComments: [],
      isNotApplicable: false,
      naJustification: "",
    },
    { 
      id: "CTL-002", 
      name: "Customer Due Diligence", 
      description: "Enhanced due diligence procedures for high-risk customers including source of funds verification, ongoing monitoring, and periodic risk reassessment based on customer behavior patterns.",
      type: "Detective", 
      owner: "Risk Management", 
      designRating: 4, 
      operatingRating: 3, 
      testingRating: 3, 
      evidences: [
        { name: "CDD Checklist Template", type: "Template", date: "2024-08-10" },
        { name: "Training Completion Records", type: "Record", date: "2024-10-25" },
      ],
      cellComments: [],
      isNotApplicable: false,
      naJustification: "",
    },
    { 
      id: "CTL-003", 
      name: "Periodic Review Process", 
      description: "Scheduled review of customer information and risk profiles to identify changes in risk level. Includes annual refresh of KYC documentation and transaction pattern analysis.",
      type: "Preventive", 
      owner: "Operations", 
      designRating: 3, 
      operatingRating: 3, 
      testingRating: 2, 
      evidences: [
        { name: "Review Schedule 2024", type: "Schedule", date: "2024-01-05" },
        { name: "Exception Report Q3", type: "Report", date: "2024-10-01" },
        { name: "Management Sign-off", type: "Approval", date: "2024-10-30" },
        { name: "Sample Testing Results", type: "Evidence", date: "2024-11-10" },
      ],
      cellComments: [],
      isNotApplicable: false,
      naJustification: "",
    },
  ]);

  // Expanded controls state for collapsible rows
  const [expandedControls, setExpandedControls] = useState<Set<string>>(new Set());

  const toggleControlExpanded = (controlId: string) => {
    setExpandedControls(prev => {
      const newSet = new Set(prev);
      if (newSet.has(controlId)) {
        newSet.delete(controlId);
      } else {
        newSet.add(controlId);
      }
      return newSet;
    });
  };

  // Issues data - categorized with expanded attributes
  const [assessmentIssues] = useState([
    { 
      id: "ISS-2025-001", 
      title: "Control testing failure identified", 
      description: "KYC verification control failed 3 out of 10 sample tests", 
      detailedDescription: "During the Q4 2024 control testing cycle, the KYC verification control (CTL-001) failed 3 out of 10 sample tests. The failures were primarily due to incomplete documentation and inconsistent application of verification procedures. This represents a 30% failure rate, significantly above the acceptable threshold of 5%.",
      severity: "High", 
      status: "Open", 
      dateIdentified: "2025-01-15", 
      owner: "Compliance Team",
      ownerEmail: "compliance.team@company.com",
      ownerDepartment: "Risk & Compliance",
      actionPlan: {
        steps: [
          "Conduct root cause analysis of failed tests",
          "Update verification procedures documentation",
          "Retrain staff on updated procedures",
          "Implement automated checklist validation"
        ],
        targetDate: "2025-03-15",
        progress: 25
      },
      attachments: [
        { name: "Control_Testing_Report_Q4.pdf", type: "Report", size: "2.4 MB", uploadedDate: "2025-01-16" },
        { name: "Failed_Samples_Evidence.xlsx", type: "Evidence", size: "856 KB", uploadedDate: "2025-01-16" }
      ]
    },
    { 
      id: "ISS-2025-002", 
      title: "Documentation gap in verification process", 
      description: "Missing audit trail for 15% of customer verifications", 
      detailedDescription: "Internal audit identified that 15% of customer verifications completed in 2024 lack complete audit trails. The missing documentation includes timestamp records, approver signatures, and source document references. This gap creates compliance risk and hinders regulatory examination readiness.",
      severity: "Medium", 
      status: "Open", 
      dateIdentified: "2025-01-18", 
      owner: "Operations",
      ownerEmail: "ops.manager@company.com",
      ownerDepartment: "Operations",
      actionPlan: {
        steps: [
          "Identify all affected customer records",
          "Implement automated audit trail capture",
          "Backfill missing documentation where possible",
          "Establish monitoring dashboard"
        ],
        targetDate: "2025-04-30",
        progress: 10
      },
      attachments: [
        { name: "Audit_Trail_Gap_Analysis.docx", type: "Analysis", size: "1.1 MB", uploadedDate: "2025-01-19" }
      ]
    },
  ]);

  const [activeRelatedIssues] = useState([
    { 
      id: "ISS-2024-015", 
      title: "KYC documentation gaps", 
      description: "Incomplete customer documentation in legacy system records", 
      detailedDescription: "Legacy system migration revealed significant gaps in customer documentation. Approximately 2,500 customer records from pre-2020 onboarding lack complete KYC documentation packages.",
      severity: "High", 
      status: "In Progress", 
      dateIdentified: "2024-08-22", 
      owner: "IT Department",
      ownerEmail: "it.lead@company.com",
      ownerDepartment: "Information Technology",
      actionPlan: {
        steps: [
          "Complete data extraction from legacy system",
          "Validate and cleanse migrated records",
          "Request missing documents from customers",
          "Update customer profiles in new system"
        ],
        targetDate: "2025-06-30",
        progress: 45
      },
      attachments: [
        { name: "Legacy_Migration_Status.xlsx", type: "Status Report", size: "3.2 MB", uploadedDate: "2024-12-01" }
      ]
    },
    { 
      id: "ISS-2024-022", 
      title: "Delayed verification process", 
      description: "Average verification time exceeds SLA by 40%", 
      detailedDescription: "Current average verification time is 7 days versus the 5-day SLA target. Root causes include manual handoffs, lack of automation, and resource constraints during peak periods.",
      severity: "Medium", 
      status: "Open", 
      dateIdentified: "2024-09-10", 
      owner: "Operations",
      ownerEmail: "ops.manager@company.com",
      ownerDepartment: "Operations",
      actionPlan: {
        steps: [
          "Process mapping and bottleneck identification",
          "Implement workflow automation",
          "Add surge capacity procedures"
        ],
        targetDate: "2025-05-15",
        progress: 30
      },
      attachments: []
    },
    { 
      id: "ISS-2024-028", 
      title: "Missing audit trail records", 
      description: "Transaction monitoring gaps identified during internal audit", 
      detailedDescription: "Internal audit found 8% of high-value transactions lack complete monitoring records. This includes missing alert investigation notes and disposition documentation.",
      severity: "High", 
      status: "Open", 
      dateIdentified: "2024-10-05", 
      owner: "Compliance Team",
      ownerEmail: "compliance.team@company.com",
      ownerDepartment: "Risk & Compliance",
      actionPlan: {
        steps: [
          "Implement mandatory field validation",
          "Deploy automated record completeness checks",
          "Conduct targeted staff training"
        ],
        targetDate: "2025-03-31",
        progress: 55
      },
      attachments: [
        { name: "Internal_Audit_Report.pdf", type: "Audit Report", size: "4.8 MB", uploadedDate: "2024-10-10" }
      ]
    },
  ]);

  const [closedRelatedIssues] = useState([
    { 
      id: "ISS-2024-005", 
      title: "Incomplete customer records", 
      description: "Address verification missing for batch of onboarded customers", 
      severity: "Medium", 
      status: "Closed", 
      dateIdentified: "2024-06-15", 
      closedDate: "2024-09-15", 
      owner: "Data Management",
      ownerEmail: "data.mgmt@company.com",
      ownerDepartment: "Data Management"
    },
    { 
      id: "ISS-2024-011", 
      title: "System access control weakness", 
      description: "Excessive user privileges in KYC system", 
      severity: "High", 
      status: "Closed", 
      dateIdentified: "2024-07-20", 
      closedDate: "2024-11-20", 
      owner: "IT Security",
      ownerEmail: "it.security@company.com",
      ownerDepartment: "IT Security"
    },
    { 
      id: "ISS-2023-089", 
      title: "Training gap identified", 
      description: "New staff missing AML certification", 
      severity: "Low", 
      status: "Closed", 
      dateIdentified: "2023-11-10", 
      closedDate: "2024-01-10", 
      owner: "HR & Training",
      ownerEmail: "hr.training@company.com",
      ownerDepartment: "Human Resources"
    },
  ]);

  // Issues accordion state
  const [expandedIssueSections, setExpandedIssueSections] = useState<Set<string>>(new Set(['assessment']));

  const toggleIssueSection = (section: string) => {
    setExpandedIssueSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };
  
  // Residual Risk Factors - Impact and Likelihood after controls
  const [residualFactors, setResidualFactors] = useState<Factor[]>([
    { id: "1", name: "Impact", description: "Potential severity after applying controls (1=Very Low, 2=Low, 3=Medium, 4=High, 5=Extreme)", rating: 2, comments: "Controls have significantly reduced potential impact severity", weightage: 50, cellComments: [] },
    { id: "2", name: "Likelihood", description: "Probability after controls are applied (1=Rare, 2=Unlikely, 3=Moderate, 4=Likely, 5=Almost Certain)", rating: 2, comments: "Control effectiveness has reduced occurrence probability", weightage: 50, cellComments: [] },
  ]);

  useEffect(() => {
    if (section) {
      setActiveTab(section);
    }
  }, [section]);

  // Store initial values when in update-version mode
  useEffect(() => {
    if (isUpdateVersionMode && !initialValuesStored) {
      setInitialInherentFactors(JSON.parse(JSON.stringify(inherentFactors)));
      setInitialControls(JSON.parse(JSON.stringify(controls)));
      setInitialResidualFactors(JSON.parse(JSON.stringify(residualFactors)));
      setInitialValuesStored(true);
    }
  }, [isUpdateVersionMode, initialValuesStored, inherentFactors, controls, residualFactors]);

  // Process AI assessment from popup navigation
  useEffect(() => {
    if (aiAssessed && !aiAssessedProcessed) {
      const newAiFields = new Set(aiFilledFields);
      
      if (aiAssessed === "inherent-rating") {
        inherentFactors.forEach(factor => {
          newAiFields.add(`inherent-${factor.id}-rating`);
          newAiFields.add(`inherent-${factor.id}-comments`);
        });
      } else if (aiAssessed === "control-effectiveness") {
        controls.forEach(control => {
          newAiFields.add(`control-${control.id}-design`);
          newAiFields.add(`control-${control.id}-operating`);
          newAiFields.add(`control-${control.id}-testing`);
        });
      } else if (aiAssessed === "residual-rating") {
        residualFactors.forEach(factor => {
          newAiFields.add(`residual-${factor.id}-rating`);
          newAiFields.add(`residual-${factor.id}-comments`);
        });
      }
      
      setAiFilledFields(newAiFields);
      setAiAssessedProcessed(true);
    }
  }, [aiAssessed, aiAssessedProcessed, inherentFactors, controls, residualFactors]);

  // Calculate scores
  const calculateInherentScore = () => {
    const totalWeight = inherentFactors.reduce((sum, f) => sum + f.weightage, 0);
    const weightedSum = inherentFactors.reduce((sum, f) => sum + (f.rating * f.weightage), 0);
    return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(1) : "0.0";
  };

  const calculateControlScore = () => {
    const applicableControls = controls.filter(c => !c.isNotApplicable);
    if (applicableControls.length === 0) return "0.0";
    const avg = applicableControls.reduce((sum, c) => sum + (c.designRating + c.operatingRating + c.testingRating) / 3, 0) / applicableControls.length;
    return avg.toFixed(1);
  };

  // Toggle control N/A status
  const toggleControlNA = (controlId: string, isNA: boolean) => {
    setControls(prev => prev.map(c => 
      c.id === controlId ? { ...c, isNotApplicable: isNA, naJustification: isNA ? c.naJustification : "" } : c
    ));
  };

  // Update control N/A justification
  const updateControlNAJustification = (controlId: string, justification: string) => {
    setControls(prev => prev.map(c => 
      c.id === controlId ? { ...c, naJustification: justification } : c
    ));
  };

  const calculateResidualScore = () => {
    const totalWeight = residualFactors.reduce((sum, f) => sum + f.weightage, 0);
    const weightedSum = residualFactors.reduce((sum, f) => sum + (f.rating * f.weightage), 0);
    return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(1) : "0.0";
  };

  const getRatingLabel = (score: number) => {
    if (score >= 4) return { label: "High", color: "bg-red-500" };
    if (score >= 3) return { label: "Medium", color: "bg-orange-500" };
    if (score >= 2) return { label: "Low", color: "bg-emerald-500" };
    return { label: "Very Low", color: "bg-blue-500" };
  };

  // ===== Org Risk Summary Calculations =====
  const currentOrganization = "Retail Banking";
  
  // Get all risks belonging to the current organization
  const orgRisks = useMemo(() => {
    return initialRiskData.filter(risk => risk.businessUnit === currentOrganization);
  }, []);
  
  // Get current risk's live scores from form state for dynamic updates
  const currentRiskInherentScore = useMemo(() => {
    const totalWeight = inherentFactors.reduce((sum, f) => sum + f.weightage, 0);
    const weightedSum = inherentFactors.reduce((sum, f) => sum + (f.rating * f.weightage), 0);
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }, [inherentFactors]);

  const currentRiskControlScore = useMemo(() => {
    const applicableControls = controls.filter(c => !c.isNotApplicable);
    if (applicableControls.length === 0) return 0;
    const total = applicableControls.reduce((sum, c) => {
      const designScore = c.designRating || 0;
      const operatingScore = c.operatingRating || 0;
      return sum + (designScore + operatingScore) / 2;
    }, 0);
    return total / applicableControls.length;
  }, [controls]);

  const currentRiskResidualScore = useMemo(() => {
    const totalWeight = residualFactors.reduce((sum, f) => sum + f.weightage, 0);
    const weightedSum = residualFactors.reduce((sum, f) => sum + (f.rating * f.weightage), 0);
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }, [residualFactors]);

  // Calculate aggregated scores for the organization dynamically (including live form values)
  const orgAggregates = useMemo(() => {
    const totalRisks = orgRisks.length;
    if (totalRisks === 0) return { 
      totalRisks: 0, 
      avgInherent: "0.0", 
      avgResidual: "0.0", 
      avgControlEffectiveness: "N/A",
      risksByLevel: { high: 0, medium: 0, low: 0 },
      withinAppetite: 0,
      outsideAppetite: 0
    };
    
    // Calculate sums with live values for current risk
    let inherentSum = 0;
    let residualSum = 0;
    let effectiveCount = 0;
    let partialCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let withinAppetiteCount = 0;
    
    orgRisks.forEach(risk => {
      const isCurrentRisk = risk.id === riskId || risk.title === riskName;
      
      if (isCurrentRisk) {
        // Use live form values for current risk
        inherentSum += currentRiskInherentScore;
        residualSum += currentRiskResidualScore;
        
        // Control effectiveness from live score
        if (currentRiskControlScore >= 4) effectiveCount++;
        else if (currentRiskControlScore >= 2.5) partialCount++;
        
        // Risk level based on live residual score
        if (currentRiskResidualScore >= 9) highCount++;
        else if (currentRiskResidualScore >= 5) mediumCount++;
        else lowCount++;
        
        // Appetite based on live residual
        if (currentRiskResidualScore <= 6) withinAppetiteCount++;
      } else {
        // Use static data for other risks
        inherentSum += risk.inherentRisk.score || 0;
        residualSum += risk.residualRisk.score || 0;
        
        if (risk.controlEffectiveness.label.includes("Effective") && 
            !risk.controlEffectiveness.label.includes("Partially")) {
          effectiveCount++;
        } else if (risk.controlEffectiveness.label.includes("Partially")) {
          partialCount++;
        }
        
        if (risk.residualRisk.level === 'High') highCount++;
        else if (risk.residualRisk.level === 'Medium') mediumCount++;
        else lowCount++;
        
        if ((risk.residualRisk.score || 0) <= 6) withinAppetiteCount++;
      }
    });
    
    const avgInherent = inherentSum / totalRisks;
    const avgResidual = residualSum / totalRisks;
    const avgControlEffectiveness = effectiveCount / totalRisks >= 0.5 ? "Effective" : 
                                    partialCount / totalRisks >= 0.3 ? "Partially Effective" : "Ineffective";
    
    return { 
      totalRisks, 
      avgInherent: avgInherent.toFixed(1), 
      avgResidual: avgResidual.toFixed(1), 
      avgControlEffectiveness,
      risksByLevel: { high: highCount, medium: mediumCount, low: lowCount },
      withinAppetite: withinAppetiteCount,
      outsideAppetite: totalRisks - withinAppetiteCount
    };
  }, [orgRisks, riskId, riskName, currentRiskInherentScore, currentRiskResidualScore, currentRiskControlScore]);

  // Helper to get level label and color for a score
  const getScoreLevelLabel = (score: number) => {
    if (score >= 9) return { label: "High", color: "bg-red-500" };
    if (score >= 5) return { label: "Med", color: "bg-amber-500" };
    return { label: "Low", color: "bg-emerald-500" };
  };

  // Helper to get control effectiveness badge info
  const getControlEffBadge = (label: string) => {
    if (label.includes("Effective") && !label.includes("Partially")) return { text: "Eff", color: "bg-emerald-500" };
    if (label.includes("Partially")) return { text: "Part", color: "bg-amber-500" };
    return { text: "Ineff", color: "bg-red-500" };
  };

  const handleAiAutofill = async () => {
    setIsAiLoading(true);
    toast.info("AI is analyzing risk factors...");
    setTimeout(() => {
      // Mark all fields in the current section as AI-filled
      const newAiFields = new Set(aiFilledFields);
      
      if (activeTab === "inherent-rating") {
        inherentFactors.forEach(factor => {
          newAiFields.add(`inherent-${factor.id}-rating`);
          newAiFields.add(`inherent-${factor.id}-comments`);
        });
      } else if (activeTab === "control-effectiveness") {
        controls.forEach(control => {
          newAiFields.add(`control-${control.id}-design`);
          newAiFields.add(`control-${control.id}-operating`);
          newAiFields.add(`control-${control.id}-testing`);
        });
      } else if (activeTab === "residual-rating") {
        residualFactors.forEach(factor => {
          newAiFields.add(`residual-${factor.id}-rating`);
          newAiFields.add(`residual-${factor.id}-comments`);
        });
      }
      
      setAiFilledFields(newAiFields);
      // Clear edited status for newly AI-filled fields
      setEditedFields(prev => {
        const updated = new Set(prev);
        newAiFields.forEach(field => updated.delete(field));
        return updated;
      });
      
      // Clear the manually edited sections for this risk when AI is run
      const storedEdits = JSON.parse(localStorage.getItem('manuallyEditedSections') || '{}');
      if (storedEdits[riskId]) {
        delete storedEdits[riskId][activeTab];
        localStorage.setItem('manuallyEditedSections', JSON.stringify(storedEdits));
      }
      
      setIsAiLoading(false);
      toast.success("AI suggestions applied successfully!");
    }, 2000);
  };

  // Individual AI suggestion handlers for each field
  const suggestInherentRating = async (factorId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate AI-generated rating (1-5)
        const aiRating = Math.floor(Math.random() * 3) + 2; // 2-4 range for more realistic suggestions
        setInherentFactors(prev => prev.map(f => 
          f.id === factorId ? { ...f, rating: aiRating } : f
        ));
        setAiFilledFields(prev => new Set(prev).add(`inherent-${factorId}-rating`));
        setEditedFields(prev => {
          const updated = new Set(prev);
          updated.delete(`inherent-${factorId}-rating`);
          return updated;
        });
        toast.success("AI suggestion applied");
        resolve();
      }, 600);
    });
  };

  const suggestInherentComment = async (factorId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const factor = inherentFactors.find(f => f.id === factorId);
        const commentSuggestions: Record<string, string> = {
          "Impact": "Based on analysis of historical data and current market conditions, the impact is assessed as significant due to potential financial and regulatory consequences.",
          "Likelihood": "Current control environment and external factors suggest a moderate probability of occurrence within the assessment period."
        };
        const aiComment = commentSuggestions[factor?.name || ''] || `Analysis indicates ${factor?.name || 'this factor'} warrants attention based on risk profile.`;
        setInherentFactors(prev => prev.map(f => 
          f.id === factorId ? { ...f, comments: aiComment } : f
        ));
        setAiFilledFields(prev => new Set(prev).add(`inherent-${factorId}-comments`));
        setEditedFields(prev => {
          const updated = new Set(prev);
          updated.delete(`inherent-${factorId}-comments`);
          return updated;
        });
        toast.success("AI suggestion applied");
        resolve();
      }, 800);
    });
  };

  const suggestControlRating = async (controlId: string, ratingType: 'designRating' | 'operatingRating' | 'testingRating'): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const aiRating = Math.floor(Math.random() * 3) + 2; // 2-4 range
        setControls(prev => prev.map(c => 
          c.id === controlId ? { ...c, [ratingType]: aiRating } : c
        ));
        const fieldKey = `control-${controlId}-${ratingType === 'designRating' ? 'design' : ratingType === 'operatingRating' ? 'operating' : 'testing'}`;
        setAiFilledFields(prev => new Set(prev).add(fieldKey));
        setEditedFields(prev => {
          const updated = new Set(prev);
          updated.delete(fieldKey);
          return updated;
        });
        toast.success("AI suggestion applied");
        resolve();
      }, 600);
    });
  };

  const suggestResidualRating = async (factorId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Residual rating should generally be lower than inherent due to controls
        const aiRating = Math.floor(Math.random() * 2) + 1; // 1-2 range for residual
        setResidualFactors(prev => prev.map(f => 
          f.id === factorId ? { ...f, rating: aiRating } : f
        ));
        setAiFilledFields(prev => new Set(prev).add(`residual-${factorId}-rating`));
        setEditedFields(prev => {
          const updated = new Set(prev);
          updated.delete(`residual-${factorId}-rating`);
          return updated;
        });
        toast.success("AI suggestion applied");
        resolve();
      }, 600);
    });
  };

  const suggestResidualComment = async (factorId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const factor = residualFactors.find(f => f.id === factorId);
        const commentSuggestions: Record<string, string> = {
          "Impact": "After applying existing controls, residual impact has been significantly reduced. Remaining exposure is within acceptable tolerance levels.",
          "Likelihood": "Control effectiveness has materially reduced the likelihood of occurrence. Ongoing monitoring recommended."
        };
        const aiComment = commentSuggestions[factor?.name || ''] || `Post-control assessment of ${factor?.name || 'this factor'} indicates reduced risk exposure.`;
        setResidualFactors(prev => prev.map(f => 
          f.id === factorId ? { ...f, comments: aiComment } : f
        ));
        setAiFilledFields(prev => new Set(prev).add(`residual-${factorId}-comments`));
        setEditedFields(prev => {
          const updated = new Set(prev);
          updated.delete(`residual-${factorId}-comments`);
          return updated;
        });
        toast.success("AI suggestion applied");
        resolve();
      }, 800);
    });
  };
  

  const markFieldAsEdited = (fieldKey: string) => {
    if (aiFilledFields.has(fieldKey)) {
      setEditedFields(prev => new Set(prev).add(fieldKey));
      
      // Determine which section this field belongs to and persist to localStorage
      let sectionKey = '';
      if (fieldKey.startsWith('inherent-')) {
        sectionKey = 'inherent-rating';
      } else if (fieldKey.startsWith('control-')) {
        sectionKey = 'control-effectiveness';
      } else if (fieldKey.startsWith('residual-')) {
        sectionKey = 'residual-rating';
      }
      
      if (sectionKey) {
        const storedEdits = JSON.parse(localStorage.getItem('manuallyEditedSections') || '{}');
        if (!storedEdits[riskId]) {
          storedEdits[riskId] = {};
        }
        storedEdits[riskId][sectionKey] = true;
        localStorage.setItem('manuallyEditedSections', JSON.stringify(storedEdits));
      }
    }
  };
  
  // Helper to check field status
  const isFieldAIFilled = (fieldKey: string) => aiFilledFields.has(fieldKey);
  const isFieldEdited = (fieldKey: string) => editedFields.has(fieldKey);
  
  // Update version mode helpers - track when fields change from their initial values
  const markFieldAsUpdatedVersion = (fieldKey: string) => {
    if (isUpdateVersionMode) {
      setUpdateVersionChangedFields(prev => new Set(prev).add(fieldKey));
    }
  };
  
  const isFieldChangedInUpdateVersion = (fieldKey: string) => {
    return isUpdateVersionMode && updateVersionChangedFields.has(fieldKey);
  };
  
  // Get original value for tooltip display in update-version mode
  const getOriginalValue = (type: 'inherent' | 'control' | 'residual', id: string, field: string): string | number | null => {
    if (!isUpdateVersionMode || !initialValuesStored) return null;
    
    if (type === 'inherent') {
      const factor = initialInherentFactors.find(f => f.id === id);
      if (!factor) return null;
      if (field === 'rating') return factor.rating;
      if (field === 'comments') return factor.comments;
    } else if (type === 'control') {
      const control = initialControls.find(c => c.id === id);
      if (!control) return null;
      if (field === 'designRating') return control.designRating;
      if (field === 'operatingRating') return control.operatingRating;
      if (field === 'testingRating') return control.testingRating;
    } else if (type === 'residual') {
      const factor = initialResidualFactors.find(f => f.id === id);
      if (!factor) return null;
      if (field === 'rating') return factor.rating;
      if (field === 'comments') return factor.comments;
    }
    return null;
  };

  const handleSendChat = () => {
    if (!chatMessage.trim()) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user: "You",
      avatar: "YO",
      message: chatMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'message'
    };
    setChatMessages([...chatMessages, newMessage]);
    setChatMessage("");
  };

  const handleAddCellComment = (factorId: string, field: string) => {
    if (!newCellComment.trim()) return;
    const newComment: CellComment = {
      id: Date.now().toString(),
      user: "You",
      avatar: "YO",
      field: field,
      comment: newCellComment,
      status: 'pending',
      timestamp: "Just now"
    };
    setCellComments([...cellComments, newComment]);
    setNewCellComment("");
    setActiveCellComment(null);
    toast.success("Comment added");
  };

  const handleResolveCellComment = (commentId: string) => {
    setCellComments(cellComments.map(c => c.id === commentId ? { ...c, status: 'resolved' } : c));
    toast.success("Comment resolved");
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail("");
  };

  // Prepare export data with section summaries
  const prepareExportData = () => {
    const inherentImpact = inherentFactors.find(f => f.name === "Impact");
    const inherentLikelihood = inherentFactors.find(f => f.name === "Likelihood");
    const residualImpact = residualFactors.find(f => f.name === "Impact");
    const residualLikelihood = residualFactors.find(f => f.name === "Likelihood");

    const designAvg = controls.length > 0 
      ? (controls.reduce((sum, c) => sum + c.designRating, 0) / controls.length).toFixed(1) 
      : "0";
    const operatingAvg = controls.length > 0 
      ? (controls.reduce((sum, c) => sum + c.operatingRating, 0) / controls.length).toFixed(1) 
      : "0";

    return {
      riskName,
      exportDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      sections: {
        inherentRating: {
          title: "Inherent Rating",
          factors: inherentFactors,
          score: inherentScore,
          rating: getRatingLabel(inherentScore).label,
          summary: `The inherent risk is rated ${getRatingLabel(inherentScore).label} (${inherentScore}) based on Impact (${inherentImpact?.rating || 0}/5) and Likelihood (${inherentLikelihood?.rating || 0}/5). This assessment reflects the potential exposure before any controls are applied, considering factors such as regulatory requirements, financial implications, and operational complexity.`
        },
        controlEffectiveness: {
          title: "Control Effectiveness",
          controls: controls,
          score: controlScore,
          rating: getRatingLabel(controlScore).label,
          summary: `${controls.length} controls are in place with an overall effectiveness rating of ${getRatingLabel(controlScore).label} (${controlScore}). Design effectiveness averages ${designAvg}/5, while operating effectiveness averages ${operatingAvg}/5. Key controls include ${controls.slice(0, 2).map(c => c.name).join(' and ')}.`
        },
        residualRating: {
          title: "Residual Rating",
          factors: residualFactors,
          score: residualScore,
          rating: getRatingLabel(residualScore).label,
          riskReduction: riskReduction,
          summary: `After applying controls, the residual risk is reduced to ${getRatingLabel(residualScore).label} (${residualScore}), representing a ${riskReduction} point improvement from the inherent risk level. The residual Impact is ${residualImpact?.rating || 0}/5 and Likelihood is ${residualLikelihood?.rating || 0}/5.`
        },
        heatMap: {
          title: "Heat Map",
          inherentPosition: { impact: inherentImpact?.rating || 0, likelihood: inherentLikelihood?.rating || 0 },
          residualPosition: { impact: residualImpact?.rating || 0, likelihood: residualLikelihood?.rating || 0 },
          summary: `The risk position moved from Inherent (Impact: ${inherentImpact?.rating || 0}, Likelihood: ${inherentLikelihood?.rating || 0}) to Residual (Impact: ${residualImpact?.rating || 0}, Likelihood: ${residualLikelihood?.rating || 0}). This represents a ${Number(riskReduction) > 1 ? 'significant' : Number(riskReduction) > 0.5 ? 'moderate' : 'minor'} risk reduction through the implementation of controls.`
        },
        issues: {
          title: "Issues",
          assessmentIssues: assessmentIssues,
          activeRelatedIssues: activeRelatedIssues,
          closedRelatedIssues: closedRelatedIssues,
          totalOpen: assessmentIssues.filter(i => i.status === 'Open').length + activeRelatedIssues.filter(i => i.status === 'Open' || i.status === 'In Progress').length,
          totalClosed: closedRelatedIssues.length,
          summary: `${assessmentIssues.length} assessment issues identified, ${activeRelatedIssues.length} active related issues, and ${closedRelatedIssues.length} closed issues. High severity items include ${[...assessmentIssues, ...activeRelatedIssues].filter(i => i.severity === 'High').map(i => i.title).slice(0, 2).join(', ') || 'none identified'}.`
        }
      }
    };
  };

  // Generate sanitized filename
  const getSanitizedFilename = () => {
    return riskName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  };

  // Generate Heat Map HTML visualization
  const generateHeatMapHTML = (inherentImpact: number, inherentLikelihood: number, residualImpact: number, residualLikelihood: number) => {
    const getCellColor = (row: number, col: number) => {
      // row is impact (1-5 from bottom), col is likelihood (1-5 from left)
      const riskScore = row * col;
      if (riskScore >= 15) return '#ef4444'; // High - Red
      if (riskScore >= 8) return '#f59e0b'; // Medium - Amber
      if (riskScore >= 4) return '#eab308'; // Low-Medium - Yellow
      return '#22c55e'; // Low - Green
    };

    let heatMapHTML = `
      <div style="margin: 20px 0;">
        <table style="border-collapse: collapse; width: 350px;">
          <tr>
            <td style="width: 30px; border: none; vertical-align: middle; text-align: center; transform: rotate(-90deg); font-weight: bold; color: #374151;">Impact</td>
            <td style="border: none;">
              <table style="border-collapse: collapse; width: 100%;">`;
    
    // Build 5x5 grid (row 5 at top, row 1 at bottom)
    for (let row = 5; row >= 1; row--) {
      heatMapHTML += '<tr>';
      for (let col = 1; col <= 5; col++) {
        const isInherent = row === inherentImpact && col === inherentLikelihood;
        const isResidual = row === residualImpact && col === residualLikelihood;
        const cellColor = getCellColor(row, col);
        let marker = '';
        if (isInherent && isResidual) {
          marker = '<span style="font-weight: bold; color: #1a1a1a;">I/R</span>';
        } else if (isInherent) {
          marker = '<span style="font-weight: bold; color: #1a1a1a; background: white; padding: 2px 6px; border-radius: 4px;">I</span>';
        } else if (isResidual) {
          marker = '<span style="font-weight: bold; color: #1a1a1a; background: white; padding: 2px 6px; border-radius: 4px;">R</span>';
        }
        heatMapHTML += `<td style="width: 50px; height: 50px; background: ${cellColor}; border: 1px solid #d1d5db; text-align: center; vertical-align: middle;">${marker}</td>`;
      }
      heatMapHTML += '</tr>';
    }
    
    heatMapHTML += `
              </table>
            </td>
          </tr>
          <tr>
            <td style="border: none;"></td>
            <td style="border: none; text-align: center; font-weight: bold; color: #374151; padding-top: 8px;">Likelihood</td>
          </tr>
        </table>
        <div style="margin-top: 10px; font-size: 12px; color: #6b7280;">
          <span style="background: white; padding: 2px 6px; border: 1px solid #d1d5db; margin-right: 10px;"><strong>I</strong> = Inherent</span>
          <span style="background: white; padding: 2px 6px; border: 1px solid #d1d5db;"><strong>R</strong> = Residual</span>
        </div>
      </div>`;
    
    return heatMapHTML;
  };

  // Generate PDF content
  const generatePDF = (data: ReturnType<typeof prepareExportData>) => {
    const heatMapHTML = generateHeatMapHTML(
      data.sections.heatMap.inherentPosition.impact,
      data.sections.heatMap.inherentPosition.likelihood,
      data.sections.heatMap.residualPosition.impact,
      data.sections.heatMap.residualPosition.likelihood
    );

    const content = `
      <html>
      <head>
        <title>${data.riskName} - Risk Assessment</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
          h1 { color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; background: #f3f4f6; padding: 10px; }
          .summary { background: #eff6ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 15px 0; }
          .score { font-size: 24px; font-weight: bold; color: #3b82f6; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
          th { background: #f9fafb; }
          .meta { color: #6b7280; font-size: 14px; margin-bottom: 30px; }
        </style>
      </head>
      <body>
        <h1>${data.riskName}</h1>
        <div class="meta">Generated on ${data.exportDate}</div>
        
        <h2>1. ${data.sections.inherentRating.title}</h2>
        <p><strong>Score:</strong> <span class="score">${data.sections.inherentRating.score}</span> (${data.sections.inherentRating.rating})</p>
        <table>
          <tr><th>Factor</th><th>Rating</th><th>Weight</th><th>Comments</th></tr>
          ${data.sections.inherentRating.factors.map(f => `<tr><td>${f.name}</td><td>${f.rating}/5</td><td>${f.weightage}%</td><td>${f.comments}</td></tr>`).join('')}
        </table>
        <div class="summary"><strong>Summary:</strong> ${data.sections.inherentRating.summary}</div>
        
        <h2>2. ${data.sections.controlEffectiveness.title}</h2>
        <p><strong>Score:</strong> <span class="score">${data.sections.controlEffectiveness.score}</span> (${data.sections.controlEffectiveness.rating})</p>
        <table>
          <tr><th>Control</th><th>Type</th><th>Owner</th><th>Design</th><th>Operating</th><th>Testing</th></tr>
          ${data.sections.controlEffectiveness.controls.map(c => `<tr><td>${c.name}</td><td>${c.type}</td><td>${c.owner}</td><td>${c.designRating}/5</td><td>${c.operatingRating}/5</td><td>${c.testingRating}/5</td></tr>`).join('')}
        </table>
        <div class="summary"><strong>Summary:</strong> ${data.sections.controlEffectiveness.summary}</div>
        
        <h2>3. ${data.sections.residualRating.title}</h2>
        <p><strong>Score:</strong> <span class="score">${data.sections.residualRating.score}</span> (${data.sections.residualRating.rating}) - Reduced by ${data.sections.residualRating.riskReduction} points</p>
        <table>
          <tr><th>Factor</th><th>Rating</th><th>Weight</th><th>Comments</th></tr>
          ${data.sections.residualRating.factors.map(f => `<tr><td>${f.name}</td><td>${f.rating}/5</td><td>${f.weightage}%</td><td>${f.comments}</td></tr>`).join('')}
        </table>
        <div class="summary"><strong>Summary:</strong> ${data.sections.residualRating.summary}</div>
        
        <h2>4. ${data.sections.heatMap.title}</h2>
        <p><strong>Inherent Position:</strong> Impact ${data.sections.heatMap.inherentPosition.impact}, Likelihood ${data.sections.heatMap.inherentPosition.likelihood}</p>
        <p><strong>Residual Position:</strong> Impact ${data.sections.heatMap.residualPosition.impact}, Likelihood ${data.sections.heatMap.residualPosition.likelihood}</p>
        ${heatMapHTML}
        <div class="summary"><strong>Summary:</strong> ${data.sections.heatMap.summary}</div>
        
        <h2>5. ${data.sections.issues.title}</h2>
        <p><strong>Open Issues:</strong> ${data.sections.issues.totalOpen} | <strong>Closed Issues:</strong> ${data.sections.issues.totalClosed}</p>
        <table>
          <tr><th>ID</th><th>Title</th><th>Severity</th><th>Status</th><th>Owner</th></tr>
          ${[...data.sections.issues.assessmentIssues, ...data.sections.issues.activeRelatedIssues].map(i => `<tr><td>${i.id}</td><td>${i.title}</td><td>${i.severity}</td><td>${i.status}</td><td>${i.owner}</td></tr>`).join('')}
        </table>
        <div class="summary"><strong>Summary:</strong> ${data.sections.issues.summary}</div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Generate ASCII Heat Map for Excel
  const generateHeatMapASCII = (inherentImpact: number, inherentLikelihood: number, residualImpact: number, residualLikelihood: number) => {
    let ascii = '\nHEAT MAP VISUALIZATION\n';
    ascii += '     L1   L2   L3   L4   L5\n';
    ascii += '    +----+----+----+----+----+\n';
    
    for (let row = 5; row >= 1; row--) {
      ascii += ` I${row} |`;
      for (let col = 1; col <= 5; col++) {
        const isInherent = row === inherentImpact && col === inherentLikelihood;
        const isResidual = row === residualImpact && col === residualLikelihood;
        if (isInherent && isResidual) {
          ascii += 'I/R |';
        } else if (isInherent) {
          ascii += ' I  |';
        } else if (isResidual) {
          ascii += ' R  |';
        } else {
          ascii += '    |';
        }
      }
      ascii += '\n    +----+----+----+----+----+\n';
    }
    ascii += 'Legend: I = Inherent Position, R = Residual Position\n';
    ascii += 'Axis: L = Likelihood (1-5), I = Impact (1-5)\n';
    return ascii;
  };

  // Generate Excel/CSV content
  const generateExcel = (data: ReturnType<typeof prepareExportData>) => {
    let csvContent = `${data.riskName} - Risk Assessment\nGenerated: ${data.exportDate}\n\n`;
    
    // Inherent Rating
    csvContent += `INHERENT RATING\nScore,${data.sections.inherentRating.score},Rating,${data.sections.inherentRating.rating}\n`;
    csvContent += `Factor,Rating,Weight,Comments\n`;
    data.sections.inherentRating.factors.forEach(f => {
      csvContent += `"${f.name}",${f.rating},${f.weightage}%,"${f.comments}"\n`;
    });
    csvContent += `Summary,"${data.sections.inherentRating.summary}"\n\n`;
    
    // Control Effectiveness
    csvContent += `CONTROL EFFECTIVENESS\nScore,${data.sections.controlEffectiveness.score},Rating,${data.sections.controlEffectiveness.rating}\n`;
    csvContent += `Control,Type,Owner,Design,Operating,Testing\n`;
    data.sections.controlEffectiveness.controls.forEach(c => {
      csvContent += `"${c.name}","${c.type}","${c.owner}",${c.designRating},${c.operatingRating},${c.testingRating}\n`;
    });
    csvContent += `Summary,"${data.sections.controlEffectiveness.summary}"\n\n`;
    
    // Residual Rating
    csvContent += `RESIDUAL RATING\nScore,${data.sections.residualRating.score},Rating,${data.sections.residualRating.rating},Reduction,${data.sections.residualRating.riskReduction}\n`;
    csvContent += `Factor,Rating,Weight,Comments\n`;
    data.sections.residualRating.factors.forEach(f => {
      csvContent += `"${f.name}",${f.rating},${f.weightage}%,"${f.comments}"\n`;
    });
    csvContent += `Summary,"${data.sections.residualRating.summary}"\n\n`;
    
    // Heat Map with ASCII visualization
    csvContent += `HEAT MAP\n`;
    csvContent += `Position,Impact,Likelihood\n`;
    csvContent += `Inherent,${data.sections.heatMap.inherentPosition.impact},${data.sections.heatMap.inherentPosition.likelihood}\n`;
    csvContent += `Residual,${data.sections.heatMap.residualPosition.impact},${data.sections.heatMap.residualPosition.likelihood}\n`;
    csvContent += generateHeatMapASCII(
      data.sections.heatMap.inherentPosition.impact,
      data.sections.heatMap.inherentPosition.likelihood,
      data.sections.heatMap.residualPosition.impact,
      data.sections.heatMap.residualPosition.likelihood
    );
    csvContent += `Summary,"${data.sections.heatMap.summary}"\n\n`;
    
    // Issues
    csvContent += `ISSUES\nOpen,${data.sections.issues.totalOpen},Closed,${data.sections.issues.totalClosed}\n`;
    csvContent += `ID,Title,Severity,Status,Owner\n`;
    [...data.sections.issues.assessmentIssues, ...data.sections.issues.activeRelatedIssues].forEach(i => {
      csvContent += `"${i.id}","${i.title}","${i.severity}","${i.status}","${i.owner}"\n`;
    });
    csvContent += `Summary,"${data.sections.issues.summary}"\n`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${getSanitizedFilename()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Generate Word/HTML content
  const generateWord = (data: ReturnType<typeof prepareExportData>) => {
    const heatMapHTML = generateHeatMapHTML(
      data.sections.heatMap.inherentPosition.impact,
      data.sections.heatMap.inherentPosition.likelihood,
      data.sections.heatMap.residualPosition.impact,
      data.sections.heatMap.residualPosition.likelihood
    );

    const content = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
      <head><meta charset="utf-8"><title>${data.riskName}</title>
      <style>
        body { font-family: Calibri, sans-serif; padding: 20px; }
        h1 { color: #1a1a1a; }
        h2 { color: #374151; background: #f3f4f6; padding: 8px; }
        .summary { background: #eff6ff; padding: 12px; border-left: 3px solid #3b82f6; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #d1d5db; padding: 8px; }
        th { background: #f9fafb; }
      </style></head>
      <body>
        <h1>${data.riskName}</h1>
        <p><em>Generated: ${data.exportDate}</em></p>
        
        <h2>1. Inherent Rating</h2>
        <p><strong>Score: ${data.sections.inherentRating.score}</strong> (${data.sections.inherentRating.rating})</p>
        <table><tr><th>Factor</th><th>Rating</th><th>Weight</th><th>Comments</th></tr>
        ${data.sections.inherentRating.factors.map(f => `<tr><td>${f.name}</td><td>${f.rating}/5</td><td>${f.weightage}%</td><td>${f.comments}</td></tr>`).join('')}</table>
        <div class="summary"><strong>Summary:</strong> ${data.sections.inherentRating.summary}</div>
        
        <h2>2. Control Effectiveness</h2>
        <p><strong>Score: ${data.sections.controlEffectiveness.score}</strong> (${data.sections.controlEffectiveness.rating})</p>
        <table><tr><th>Control</th><th>Type</th><th>Owner</th><th>Design</th><th>Operating</th><th>Testing</th></tr>
        ${data.sections.controlEffectiveness.controls.map(c => `<tr><td>${c.name}</td><td>${c.type}</td><td>${c.owner}</td><td>${c.designRating}/5</td><td>${c.operatingRating}/5</td><td>${c.testingRating}/5</td></tr>`).join('')}</table>
        <div class="summary"><strong>Summary:</strong> ${data.sections.controlEffectiveness.summary}</div>
        
        <h2>3. Residual Rating</h2>
        <p><strong>Score: ${data.sections.residualRating.score}</strong> (${data.sections.residualRating.rating}) - Reduced by ${data.sections.residualRating.riskReduction} points</p>
        <table><tr><th>Factor</th><th>Rating</th><th>Weight</th><th>Comments</th></tr>
        ${data.sections.residualRating.factors.map(f => `<tr><td>${f.name}</td><td>${f.rating}/5</td><td>${f.weightage}%</td><td>${f.comments}</td></tr>`).join('')}</table>
        <div class="summary"><strong>Summary:</strong> ${data.sections.residualRating.summary}</div>
        
        <h2>4. Heat Map</h2>
        <p><strong>Inherent:</strong> Impact ${data.sections.heatMap.inherentPosition.impact}, Likelihood ${data.sections.heatMap.inherentPosition.likelihood}<br/>
        <strong>Residual:</strong> Impact ${data.sections.heatMap.residualPosition.impact}, Likelihood ${data.sections.heatMap.residualPosition.likelihood}</p>
        ${heatMapHTML}
        <div class="summary"><strong>Summary:</strong> ${data.sections.heatMap.summary}</div>
        
        <h2>5. Issues</h2>
        <p><strong>Open:</strong> ${data.sections.issues.totalOpen} | <strong>Closed:</strong> ${data.sections.issues.totalClosed}</p>
        <table><tr><th>ID</th><th>Title</th><th>Severity</th><th>Status</th><th>Owner</th></tr>
        ${[...data.sections.issues.assessmentIssues, ...data.sections.issues.activeRelatedIssues].map(i => `<tr><td>${i.id}</td><td>${i.title}</td><td>${i.severity}</td><td>${i.status}</td><td>${i.owner}</td></tr>`).join('')}</table>
        <div class="summary"><strong>Summary:</strong> ${data.sections.issues.summary}</div>
      </body></html>
    `;
    
    const blob = new Blob([content], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${getSanitizedFilename()}.doc`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Generate PPT using pptxgenjs
  const generatePPT = (data: ReturnType<typeof prepareExportData>) => {
    const pptx = new pptxgen();
    pptx.title = data.riskName;
    pptx.author = "Risk Assessment System";
    
    // Helper to get cell color based on risk score
    const getCellColor = (row: number, col: number): string => {
      const riskScore = row * col;
      if (riskScore >= 15) return 'ef4444'; // High - Red
      if (riskScore >= 8) return 'f59e0b'; // Medium - Amber
      if (riskScore >= 4) return 'eab308'; // Low-Medium - Yellow
      return '22c55e'; // Low - Green
    };
    
    // Slide 1: Title
    const slide1 = pptx.addSlide();
    slide1.addText(data.riskName, { x: 0.5, y: 2, w: 9, h: 1.2, fontSize: 36, bold: true, color: '1d4ed8' });
    slide1.addText('Risk Assessment Summary', { x: 0.5, y: 3.3, w: 9, fontSize: 20, color: '6b7280' });
    slide1.addText(`Generated: ${data.exportDate}`, { x: 0.5, y: 4, w: 9, fontSize: 14, color: '9ca3af' });
    
    // Slide 2: Assessment Summary (AI-generated overview)
    const slideSummary = pptx.addSlide();
    slideSummary.addText('Assessment Summary', { x: 0.5, y: 0.3, w: 9, fontSize: 28, bold: true, color: '1d4ed8' });
    
    // Calculate issues data for summary
    const allIssues = [...data.sections.issues.assessmentIssues, ...data.sections.issues.activeRelatedIssues];
    const newIssuesCount = data.sections.issues.assessmentIssues.length;
    const highCount = allIssues.filter(i => i.severity === 'High').length;
    const mediumCount = allIssues.filter(i => i.severity === 'Medium').length;
    const lowCount = allIssues.filter(i => i.severity === 'Low').length;
    
    const issuesSummaryText = newIssuesCount > 0 
      ? `${newIssuesCount} new issues have been identified requiring review. Criticality breakdown: ${highCount > 0 ? `${highCount} High` : ''}${highCount > 0 && (mediumCount > 0 || lowCount > 0) ? ', ' : ''}${mediumCount > 0 ? `${mediumCount} Medium` : ''}${mediumCount > 0 && lowCount > 0 ? ', ' : ''}${lowCount > 0 ? `${lowCount} Low` : ''}.`
      : 'No new issues identified during this assessment cycle.';
    
    const summaryContent = [
      { title: 'Inherent Rating Review', text: `The inherent risk level remains elevated due to the nature of operations and external market conditions. Historical data indicates consistent exposure patterns with minor fluctuations in risk scoring without controls. Current Score: ${data.sections.inherentRating.score} (${data.sections.inherentRating.rating})` },
      { title: 'Control Effectiveness Review', text: `Current controls demonstrate moderate effectiveness. Design and operating effectiveness evaluation suggests opportunities to enhance control reliability and reduce manual intervention points. Current Score: ${data.sections.controlEffectiveness.score} (${data.sections.controlEffectiveness.rating})` },
      { title: 'Residual Rating Validation', text: `After applying existing controls, the post-control risk scoring falls within acceptable tolerance levels. Continuous monitoring is advised to maintain this position. Current Score: ${data.sections.residualRating.score} (${data.sections.residualRating.rating})` },
      { title: 'Issues', text: issuesSummaryText }
    ];
    
    let yPos = 0.8;
    summaryContent.forEach((section) => {
      slideSummary.addText(section.title, { x: 0.5, y: yPos, w: 9, fontSize: 14, bold: true, color: '374151' });
      slideSummary.addText(section.text, { x: 0.5, y: yPos + 0.3, w: 9, fontSize: 11, color: '6b7280' });
      yPos += 1.15;
    });
    
    slideSummary.addText('Overall: This risk is currently being managed within established parameters. Proactive measures should be considered for the upcoming cycle.', { x: 0.5, y: yPos + 0.1, w: 9, h: 0.5, fontSize: 11, fill: { color: 'eff6ff' }, color: '374151', bold: true });
    
    // Slide 3: Inherent Rating
    const slideInherent = pptx.addSlide();
    slideInherent.addText('Inherent Rating Review', { x: 0.5, y: 0.3, w: 9, fontSize: 28, bold: true, color: '1d4ed8' });
    slideInherent.addText(`Score: ${data.sections.inherentRating.score} (${data.sections.inherentRating.rating})`, { x: 0.5, y: 0.9, w: 9, fontSize: 24, bold: true, color: '3b82f6' });
    const inherentRows: pptxgen.TableRow[] = [
      [{ text: 'Factor', options: { bold: true, fill: { color: '3b82f6' }, color: 'ffffff' } }, 
       { text: 'Rating', options: { bold: true, fill: { color: '3b82f6' }, color: 'ffffff' } }, 
       { text: 'Weight', options: { bold: true, fill: { color: '3b82f6' }, color: 'ffffff' } }]
    ];
    data.sections.inherentRating.factors.forEach(f => {
      inherentRows.push([{ text: f.name }, { text: `${f.rating}/5` }, { text: `${f.weightage}%` }]);
    });
    slideInherent.addTable(inherentRows, { x: 0.5, y: 1.5, w: 9, fontSize: 12, border: { pt: 0.5, color: 'e5e7eb' } });
    slideInherent.addText(data.sections.inherentRating.summary, { x: 0.5, y: 4.2, w: 9, h: 1, fontSize: 11, fill: { color: 'eff6ff' }, color: '374151' });
    
    // Slide 4: Control Effectiveness
    const slideControl = pptx.addSlide();
    slideControl.addText('Control Effectiveness Review', { x: 0.5, y: 0.3, w: 9, fontSize: 28, bold: true, color: '1d4ed8' });
    slideControl.addText(`Score: ${data.sections.controlEffectiveness.score} (${data.sections.controlEffectiveness.rating})`, { x: 0.5, y: 0.9, w: 9, fontSize: 24, bold: true, color: '3b82f6' });
    const controlRows: pptxgen.TableRow[] = [
      [{ text: 'Control', options: { bold: true, fill: { color: '3b82f6' }, color: 'ffffff' } }, 
       { text: 'Type', options: { bold: true, fill: { color: '3b82f6' }, color: 'ffffff' } }, 
       { text: 'Design', options: { bold: true, fill: { color: '3b82f6' }, color: 'ffffff' } }, 
       { text: 'Operating', options: { bold: true, fill: { color: '3b82f6' }, color: 'ffffff' } },
       { text: 'Testing', options: { bold: true, fill: { color: '3b82f6' }, color: 'ffffff' } }]
    ];
    data.sections.controlEffectiveness.controls.forEach(c => {
      controlRows.push([{ text: c.name }, { text: c.type }, { text: `${c.designRating}/5` }, { text: `${c.operatingRating}/5` }, { text: `${c.testingRating}/5` }]);
    });
    slideControl.addTable(controlRows, { x: 0.5, y: 1.5, w: 9, fontSize: 11, border: { pt: 0.5, color: 'e5e7eb' } });
    slideControl.addText(data.sections.controlEffectiveness.summary, { x: 0.5, y: 4.2, w: 9, h: 1, fontSize: 11, fill: { color: 'eff6ff' }, color: '374151' });
    
    // Slide 5: Residual Rating
    const slideResidual = pptx.addSlide();
    slideResidual.addText('Residual Rating Validation', { x: 0.5, y: 0.3, w: 9, fontSize: 28, bold: true, color: '1d4ed8' });
    slideResidual.addText(`Score: ${data.sections.residualRating.score} (${data.sections.residualRating.rating}) - Reduced by ${data.sections.residualRating.riskReduction} points`, { x: 0.5, y: 0.9, w: 9, fontSize: 20, bold: true, color: '3b82f6' });
    const residualRows: pptxgen.TableRow[] = [
      [{ text: 'Factor', options: { bold: true, fill: { color: '3b82f6' }, color: 'ffffff' } }, 
       { text: 'Rating', options: { bold: true, fill: { color: '3b82f6' }, color: 'ffffff' } }, 
       { text: 'Weight', options: { bold: true, fill: { color: '3b82f6' }, color: 'ffffff' } }]
    ];
    data.sections.residualRating.factors.forEach(f => {
      residualRows.push([{ text: f.name }, { text: `${f.rating}/5` }, { text: `${f.weightage}%` }]);
    });
    slideResidual.addTable(residualRows, { x: 0.5, y: 1.5, w: 9, fontSize: 12, border: { pt: 0.5, color: 'e5e7eb' } });
    slideResidual.addText(data.sections.residualRating.summary, { x: 0.5, y: 4.2, w: 9, h: 1, fontSize: 11, fill: { color: 'eff6ff' }, color: '374151' });
    
    // Slide 6: Heat Map with visual grid (moved after Issues in the modal, but Heat Map is still useful here)
    const slideHeatMap = pptx.addSlide();
    slideHeatMap.addText('Heat Map', { x: 0.5, y: 0.3, w: 9, fontSize: 28, bold: true, color: '1d4ed8' });
    
    // Create 5x5 heat map grid
    const heatMapRows: pptxgen.TableRow[] = [];
    const inherentImpact = data.sections.heatMap.inherentPosition.impact;
    const inherentLikelihood = data.sections.heatMap.inherentPosition.likelihood;
    const residualImpact = data.sections.heatMap.residualPosition.impact;
    const residualLikelihood = data.sections.heatMap.residualPosition.likelihood;
    
    for (let row = 5; row >= 1; row--) {
      const tableRow: pptxgen.TableCell[] = [{ text: `I${row}`, options: { bold: true, fill: { color: 'f3f4f6' } } }];
      for (let col = 1; col <= 5; col++) {
        const isInherent = row === inherentImpact && col === inherentLikelihood;
        const isResidual = row === residualImpact && col === residualLikelihood;
        let cellText = '';
        if (isInherent && isResidual) cellText = 'I/R';
        else if (isInherent) cellText = 'I';
        else if (isResidual) cellText = 'R';
        tableRow.push({ 
          text: cellText, 
          options: { 
            fill: { color: getCellColor(row, col) }, 
            bold: true, 
            color: '1a1a1a',
            align: 'center',
            valign: 'middle'
          } 
        });
      }
      heatMapRows.push(tableRow);
    }
    // Add header row for likelihood
    heatMapRows.push([
      { text: '', options: { fill: { color: 'ffffff' } } },
      { text: 'L1', options: { bold: true, fill: { color: 'f3f4f6' }, align: 'center' } },
      { text: 'L2', options: { bold: true, fill: { color: 'f3f4f6' }, align: 'center' } },
      { text: 'L3', options: { bold: true, fill: { color: 'f3f4f6' }, align: 'center' } },
      { text: 'L4', options: { bold: true, fill: { color: 'f3f4f6' }, align: 'center' } },
      { text: 'L5', options: { bold: true, fill: { color: 'f3f4f6' }, align: 'center' } }
    ]);
    
    slideHeatMap.addTable(heatMapRows, { x: 1.5, y: 1, w: 5, h: 3, fontSize: 14, border: { pt: 1, color: 'd1d5db' } });
    slideHeatMap.addText('Impact (I1-I5) ↑', { x: 0.3, y: 2.5, w: 1, fontSize: 10, color: '6b7280', rotate: 270 });
    slideHeatMap.addText('Likelihood (L1-L5) →', { x: 3.5, y: 4.2, w: 2, fontSize: 10, color: '6b7280' });
    slideHeatMap.addText('Legend: I = Inherent Position, R = Residual Position', { x: 1.5, y: 4.5, w: 5, fontSize: 10, color: '6b7280' });
    slideHeatMap.addText(data.sections.heatMap.summary, { x: 0.5, y: 4.8, w: 9, h: 0.7, fontSize: 11, fill: { color: 'eff6ff' }, color: '374151' });
    
    // Slide 7: Issues Overview
    const slideIssues = pptx.addSlide();
    slideIssues.addText('Issues', { x: 0.5, y: 0.3, w: 9, fontSize: 28, bold: true, color: '1d4ed8' });
    slideIssues.addText(`Open: ${data.sections.issues.totalOpen}  |  Closed: ${data.sections.issues.totalClosed}`, { x: 0.5, y: 0.9, w: 9, fontSize: 20, bold: true, color: '3b82f6' });
    const issueRows: pptxgen.TableRow[] = [
      [{ text: 'ID', options: { bold: true, fill: { color: '3b82f6' }, color: 'ffffff' } }, 
       { text: 'Title', options: { bold: true, fill: { color: '3b82f6' }, color: 'ffffff' } }, 
       { text: 'Severity', options: { bold: true, fill: { color: '3b82f6' }, color: 'ffffff' } }, 
       { text: 'Status', options: { bold: true, fill: { color: '3b82f6' }, color: 'ffffff' } }]
    ];
    [...data.sections.issues.assessmentIssues, ...data.sections.issues.activeRelatedIssues].slice(0, 6).forEach(i => {
      issueRows.push([{ text: i.id }, { text: i.title }, { text: i.severity }, { text: i.status }]);
    });
    slideIssues.addTable(issueRows, { x: 0.5, y: 1.5, w: 9, fontSize: 11, border: { pt: 0.5, color: 'e5e7eb' } });
    slideIssues.addText(data.sections.issues.summary, { x: 0.5, y: 4.2, w: 9, h: 1, fontSize: 11, fill: { color: 'eff6ff' }, color: '374151' });
    
    // Save the file
    pptx.writeFile({ fileName: `${getSanitizedFilename()}.pptx` });
  };

  const handleExport = (format: string) => {
    const data = prepareExportData();
    const filename = getSanitizedFilename();
    
    switch(format) {
      case 'PDF':
        generatePDF(data);
        toast.success(`PDF "${filename}.pdf" ready for printing`);
        break;
      case 'Excel':
        generateExcel(data);
        toast.success(`Excel file "${filename}.csv" downloaded`);
        break;
      case 'Word':
        generateWord(data);
        toast.success(`Word document "${filename}.doc" downloaded`);
        break;
      case 'PPT':
        generatePPT(data);
        toast.success(`PowerPoint "${filename}.pptx" downloaded`);
        break;
    }
    setExportOpen(false);
  };

  const handleSave = () => {
    toast.success("Assessment saved as draft");
  };

  const handleSubmit = () => {
    toast.success("Assessment submitted for review");
  };

  // Generate contextual comment based on factor and rating
  const generateRatingComment = (factorName: string, rating: number, factorType: 'inherent' | 'residual'): string => {
    if (factorType === 'inherent') {
      if (factorName === 'Impact') {
        const comments: Record<number, string> = {
          0: 'Impact assessment not applicable for this risk.',
          1: 'Very low impact expected; minimal effect on operations or financials.',
          2: 'Low impact anticipated; minor operational disruptions possible.',
          3: 'Moderate impact expected; noticeable effect on operations and resources.',
          4: 'High impact expected due to significant financial penalties and regulatory scrutiny.',
          5: 'Critical impact anticipated; severe operational, financial, and reputational consequences.',
        };
        return comments[rating] || '';
      }
      if (factorName === 'Likelihood') {
        const comments: Record<number, string> = {
          0: 'Likelihood assessment not applicable for this risk.',
          1: 'Rare occurrence expected; highly unlikely based on historical data.',
          2: 'Unlikely to occur; minimal evidence of triggering conditions.',
          3: 'Moderate likelihood based on current control gaps and industry trends.',
          4: 'Likely to occur; frequent triggering conditions observed.',
          5: 'Almost certain to occur; imminent risk indicators present.',
        };
        return comments[rating] || '';
      }
    }
    
    if (factorType === 'residual') {
      if (factorName === 'Impact') {
        const comments: Record<number, string> = {
          0: 'Residual impact assessment not applicable.',
          1: 'Minimal residual impact after controls; negligible effect expected.',
          2: 'Low residual impact; existing controls substantially reduce potential consequences.',
          3: 'Moderate residual impact remains despite control measures.',
          4: 'Significant residual impact persists; additional mitigation needed.',
          5: 'Critical residual impact; controls insufficient to address risk magnitude.',
        };
        return comments[rating] || '';
      }
      if (factorName === 'Likelihood') {
        const comments: Record<number, string> = {
          0: 'Residual likelihood assessment not applicable.',
          1: 'Very low residual likelihood; controls effectively reduce occurrence probability.',
          2: 'Low residual likelihood; minor probability remains after controls.',
          3: 'Moderate residual likelihood; control effectiveness partially reduces probability.',
          4: 'High residual likelihood; controls do not adequately address occurrence probability.',
          5: 'Very high residual likelihood; near-certain occurrence despite controls.',
        };
        return comments[rating] || '';
      }
    }
    
    return '';
  };

  const updateFactorRating = (factors: Factor[], setFactors: React.Dispatch<React.SetStateAction<Factor[]>>, id: string, rating: number, factorType: 'inherent' | 'residual') => {
    setFactors(factors.map(f => {
      if (f.id === id) {
        const newComment = generateRatingComment(f.name, rating, factorType);
        return { ...f, rating, comments: newComment };
      }
      return f;
    }));
    markFieldAsUpdatedVersion(`${factorType}-${id}-rating`);
    markFieldAsUpdatedVersion(`${factorType}-${id}-comments`);
  };

  const updateFactorComment = (factors: Factor[], setFactors: React.Dispatch<React.SetStateAction<Factor[]>>, id: string, comments: string, factorType: 'inherent' | 'residual') => {
    setFactors(factors.map(f => f.id === id ? { ...f, comments } : f));
    markFieldAsUpdatedVersion(`${factorType}-${id}-comments`);
  };

  const updateControlRating = (id: string, field: 'designRating' | 'operatingRating' | 'testingRating', value: number) => {
    setControls(controls.map(c => c.id === id ? { ...c, [field]: value } : c));
    markFieldAsUpdatedVersion(`control-${id}-${field}`);
  };

  const getFieldComments = (field: string) => {
    return cellComments.filter(c => c.field === field);
  };

  // Get collaborator editing a specific cell
  const getCollaboratorOnCell = (cellId: string) => {
    return collaboratorPositions.find(p => p.cellId === cellId)?.collaborator;
  };

  // Check if section has active editors
  const isSectionActive = (section: string) => {
    return activeSections.some(s => s.section === section);
  };

  // Collaborator Badge Component for cells
  const CollaboratorBadge = ({ cellId }: { cellId: string }) => {
    const collaborator = getCollaboratorOnCell(cellId);
    if (!collaborator) return null;
    
    return (
      <div className={`absolute -top-2 -left-2 z-50 flex items-center gap-1 ${collaborator.color} text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full shadow-lg animate-pulse`}>
        <span>{collaborator.avatar}</span>
      </div>
    );
  };

  // Cell wrapper with collaborator indicator
  const CollaborativeCell = ({ cellId, children, className = "" }: { cellId: string; children: React.ReactNode; className?: string }) => {
    const collaborator = getCollaboratorOnCell(cellId);
    const isBeingEdited = !!collaborator;
    
    return (
      <div className={`relative ${isBeingEdited ? `ring-2 ring-offset-1 rounded-md ${collaborator?.color.replace('bg-', 'ring-')}` : ''} ${className}`}>
        <CollaboratorBadge cellId={cellId} />
        {children}
      </div>
    );
  };

  // Update Version Field Indicator - wraps fields that have been changed in update-version mode
  const UpdateVersionIndicator = ({ fieldKey, children, originalValue }: { fieldKey: string; children: React.ReactNode; originalValue?: string | number | null }) => {
    const isChanged = isFieldChangedInUpdateVersion(fieldKey);
    
    if (!isUpdateVersionMode) {
      return <>{children}</>;
    }
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`relative overflow-visible ${isChanged ? 'ring-2 ring-blue-400 ring-offset-2 rounded-md bg-blue-50/50 dark:bg-blue-950/30' : ''}`}>
              {isChanged && (
                <div className="absolute -top-3 -right-3 z-50">
                  <Badge className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 h-5 shadow-md border border-blue-400">
                    Updated
                  </Badge>
                </div>
              )}
              {children}
            </div>
          </TooltipTrigger>
          {isChanged && originalValue !== null && originalValue !== undefined && (
            <TooltipContent side="top" className="max-w-xs z-[100]">
              <p className="text-xs">
                <span className="text-muted-foreground">Previous value: </span>
                <span className="font-medium">{String(originalValue)}</span>
              </p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  const inherentScore = parseFloat(calculateInherentScore());
  const controlScore = parseFloat(calculateControlScore());
  const residualScore = parseFloat(calculateResidualScore());
  const riskReduction = (inherentScore - residualScore).toFixed(1);

  // Cell Comment Popover Component
  const CellCommentPopover = ({ factorName, field, children }: { factorName: string; field: string; children: React.ReactNode }) => {
    const fieldKey = `${factorName} - ${field}`;
    const comments = getFieldComments(fieldKey);
    const hasComments = comments.length > 0;
    const hasPending = comments.some(c => c.status === 'pending');

    return (
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative group cursor-pointer">
            {children}
            {hasComments && (
              <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white ${hasPending ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                {comments.length}
              </div>
            )}
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
              <MessageCircle className="w-2.5 h-2.5" />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-3 border-b bg-muted/50">
            <div className="font-medium text-sm">Review Comments</div>
            <div className="text-xs text-muted-foreground">{fieldKey}</div>
          </div>
          <ScrollArea className="max-h-60">
            <div className="p-3 space-y-3">
              {comments.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-2">No comments yet</div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-2 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white text-[10px]">
                          {comment.avatar}
                        </div>
                        <span className="font-medium text-xs">{comment.user}</span>
                      </div>
                      <Badge className={`text-[10px] px-1.5 py-0 ${
                        comment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        comment.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {comment.status}
                      </Badge>
                    </div>
                    <p className="text-xs mb-1">{comment.comment}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">{comment.timestamp}</span>
                      {comment.status === 'pending' && (
                        <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={() => handleResolveCellComment(comment.id)}>
                          <Check className="w-3 h-3 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input 
                placeholder="Add a comment..." 
                className="h-8 text-sm"
                value={activeCellComment?.factorId === factorName && activeCellComment?.field === field ? newCellComment : ""}
                onChange={(e) => {
                  setActiveCellComment({ factorId: factorName, field });
                  setNewCellComment(e.target.value);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCellComment(factorName, fieldKey)}
              />
              <Button size="sm" className="h-8 px-2" onClick={() => handleAddCellComment(factorName, fieldKey)}>
                <Send className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex gap-1 mt-2">
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">
                <Flag className="w-3 h-3 mr-1" />
                Flag for Review
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">
                <AlertCircle className="w-3 h-3 mr-1" />
                Challenge
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20">
      {/* Main Content Area */}
      <div className={`${rightPanelOpen ? 'pr-[540px]' : 'pr-14'} transition-all duration-300`}>
        {/* Update Version Banner */}
        {isUpdateVersionMode && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                      New Assessment Version
                    </span>
                    <Badge className="bg-amber-500 text-white text-[10px] px-2">
                      Version 2
                    </Badge>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Assessment ID: {riskId} • Fields from previous version have been pre-filled. Updated fields will be highlighted.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-amber-700 dark:text-amber-300">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-amber-900/50 rounded-md border border-amber-200 dark:border-amber-700">
                  <div className="w-4 h-4 rounded ring-2 ring-blue-400 ring-offset-1 bg-blue-50 dark:bg-blue-950" />
                  <span className="font-medium">Blue ring = Updated field</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-amber-900/50 rounded-md border border-amber-200 dark:border-amber-700">
                  <Badge className="bg-blue-500 text-white text-[8px] px-1 py-0 h-4">Updated</Badge>
                  <span className="font-medium">Badge shows on changed fields</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
          <div className="px-3 py-1">
            <div className="flex items-center justify-between">
              {/* Left - Back & Collaboration */}
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2" onClick={() => {
                  const dashboardPath = source === "2nd-line" ? "/dashboard/2nd-line-analyst" : "/dashboard/1st-line-analyst";
                  navigate(`${dashboardPath}?openOverview=true&riskId=${encodeURIComponent(riskId)}&riskName=${encodeURIComponent(riskName)}`);
                }}>
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Back
                </Button>
                
                {/* Collaborative Status Indicators */}
                <div className="flex items-center gap-2 px-2 py-0.5 bg-primary/90 rounded-full">
                  {/* User Avatars - Overlapping with Tooltips */}
                  <div className="flex -space-x-1.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-5 h-5 rounded-full bg-emerald-500 border-[1.5px] border-primary flex items-center justify-center text-[8px] font-semibold text-white z-30 cursor-pointer">
                            SJ
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="p-2">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-xs">Sarah Johnson</p>
                            <p className="text-[10px] text-muted-foreground">Risk Analyst</p>
                            <div className="flex items-center gap-1 mt-1 pt-1 border-t">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[10px]">Editing: Inherent Rating</span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-5 h-5 rounded-full bg-blue-400 border-[1.5px] border-primary flex items-center justify-center text-[8px] font-semibold text-white z-20 cursor-pointer">
                            MC
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="p-2">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-xs">Michael Chen</p>
                            <p className="text-[10px] text-muted-foreground">Compliance Officer</p>
                            <div className="flex items-center gap-1 mt-1 pt-1 border-t">
                              <Eye className="w-2.5 h-2.5 text-muted-foreground" />
                              <span className="text-[10px]">Viewing: Control Effectiveness</span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-5 h-5 rounded-full bg-slate-300 border-[1.5px] border-primary flex items-center justify-center text-[8px] font-semibold text-slate-700 z-10 cursor-pointer">
                            ER
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="p-2">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-xs">Emily Roberts</p>
                            <p className="text-[10px] text-muted-foreground">Senior Auditor</p>
                            <div className="flex items-center gap-1 mt-1 pt-1 border-t">
                              <Eye className="w-2.5 h-2.5 text-muted-foreground" />
                              <span className="text-[10px]">Viewing: Residual Rating</span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  {/* Editing Status */}
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-background/20 rounded-full border border-emerald-400/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-medium text-emerald-400">1 editing</span>
                  </div>
                  
                  {/* Viewing Status */}
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-background/20 rounded-full border border-slate-400/50">
                    <Eye className="w-2.5 h-2.5 text-slate-300" />
                    <span className="text-[10px] font-medium text-slate-300">2 viewing</span>
                  </div>
                </div>
              </div>
              
              {/* Right - Actions */}
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={() => { setRightPanelOpen(true); setRightPanelTab('review'); }}
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Comments
                </Button>

                {/* Summarize & Export Dialog */}
                <Dialog open={exportOpen} onOpenChange={setExportOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">
                      <FileText className="w-3 h-3 mr-1" />
                      Export
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Summarize & Export Assessment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div>
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          AI-Generated Summary
                        </h3>
                        <Card className="p-4 bg-muted/50">
                          <p className="text-sm">
                            <strong>Risk Assessment Summary for {riskName}</strong><br/><br/>
                            The assessment identifies a <strong>Medium ({inherentScore})</strong> inherent risk level. 
                            With controls achieving <strong>{getRatingLabel(controlScore).label} ({controlScore})</strong> effectiveness, 
                            residual risk is <strong>{getRatingLabel(residualScore).label} ({residualScore})</strong>, 
                            a <strong>{riskReduction} point</strong> reduction.
                          </p>
                        </Card>
                      </div>
                      <div>
                        <h3 className="font-medium mb-3">Export Options</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => handleExport('PDF')}>
                            <FileText className="w-5 h-5 text-red-500" />
                            <span className="text-xs">PDF</span>
                          </Button>
                          <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => handleExport('Excel')}>
                            <BarChart3 className="w-5 h-5 text-emerald-500" />
                            <span className="text-xs">Excel</span>
                          </Button>
                          <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => handleExport('Word')}>
                            <FileText className="w-5 h-5 text-blue-500" />
                            <span className="text-xs">Word</span>
                          </Button>
                          <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => handleExport('PPT')}>
                            <FileText className="w-5 h-5 text-purple-500" />
                            <span className="text-xs">PPT</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Collaborate Dialog */}
                <Dialog open={collaborateOpen} onOpenChange={setCollaborateOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300">
                      <Users className="w-3 h-3 mr-1" />
                      Collaborate
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg p-0 gap-0">
                    <DialogHeader className="p-6 pb-4">
                      <DialogTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                          <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        Manage Collaborators
                      </DialogTitle>
                    </DialogHeader>
                    
                    {/* Full Edit Access Toggle */}
                    <div className="mx-6 mb-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-blue-900 dark:text-blue-100">Collaborators can edit the full assessment form</div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">Selected collaborators will have access to all form sections</div>
                        </div>
                        <button
                          onClick={() => setFullEditAccess(!fullEditAccess)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            fullEditAccess ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              fullEditAccess ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Select Collaborators Section */}
                    <div className="mx-6 mb-4">
                      <Card className="border shadow-sm">
                        <div className="p-4 border-b">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Select Collaborators</h3>
                            <Badge className="bg-purple-600 text-white">{selectedCollaborators.length} selected</Badge>
                          </div>
                        </div>
                        <ScrollArea className="h-[240px]">
                          <div className="p-2 space-y-1">
                            {availableCollaborators.map((c) => (
                              <div 
                                key={c.id} 
                                onClick={() => {
                                  setSelectedCollaborators(prev => 
                                    prev.includes(c.id) 
                                      ? prev.filter(id => id !== c.id)
                                      : [...prev, c.id]
                                  );
                                }}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                  selectedCollaborators.includes(c.id) 
                                    ? 'border-purple-300 bg-purple-50 dark:bg-purple-950/30' 
                                    : 'border-border hover:bg-muted/50'
                                }`}
                              >
                                <Checkbox 
                                  checked={selectedCollaborators.includes(c.id)}
                                  className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                />
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-medium text-sm">
                                  {c.avatar}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">{c.name}</div>
                                  <div className="text-sm text-muted-foreground">{c.email}</div>
                                </div>
                                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-0">
                                  {c.role}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </Card>
                    </div>

                    {/* Current Access Section */}
                    <div className="mx-6 mb-6">
                      <Card className="border shadow-sm bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-amber-200 dark:bg-amber-800 flex items-center justify-center">
                                <Users className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                              </div>
                              <h3 className="font-semibold text-amber-900 dark:text-amber-100">Current Access</h3>
                            </div>
                            <Badge className="bg-amber-500 text-white">{activeCollaborators.length} active</Badge>
                          </div>
                          <div className="flex -space-x-2">
                            {activeCollaborators.map((c) => (
                              <div 
                                key={c.id} 
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800"
                                title={`${c.name} - ${c.role}`}
                              >
                                {c.avatar}
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t bg-muted/30">
                      <Button variant="outline" onClick={() => setCollaborateOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => {
                          toast.success(`${selectedCollaborators.length} collaborator(s) added successfully`);
                          setCollaborateOpen(false);
                        }}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Apply Settings
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={handleSave}>
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" className="h-6 text-[10px] px-2 bg-blue-600 hover:bg-blue-700" onClick={handleSubmit}>
                  <Send className="w-3 h-3 mr-1" />
                  Submit
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigate(-1)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-3 py-2">
          {/* Risk Info Header */}
          <div className="mb-2">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              {/* Left side - Risk Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full border-2 border-blue-500" />
                  <h1 className="text-xl font-bold">{riskName}</h1>
                  <Badge className="bg-amber-100 text-amber-700 text-xs">Pending Review</Badge>
                  <span className="text-muted-foreground font-mono text-sm">{riskId}</span>
                </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Assessment ID: <span className="text-blue-600 font-medium">ASM-1043</span></span>
                  <span>•</span>
                  <span>Date: 2025-04-10</span>
                </div>
                {/* Organization Banner with Embedded Org Risk Summary */}
                <Collapsible open={orgScoresPanelExpanded} onOpenChange={setOrgScoresPanelExpanded}>
                  <div className="flex items-center justify-between gap-1.5 mt-1.5 px-2 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 rounded border border-indigo-200 dark:border-indigo-800">
                    {/* Left side - Org Name */}
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <Library className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wide font-medium">Org:</span>
                        <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-200">Retail Banking - Consumer Services</span>
                      </div>
                    </div>
                    
                    {/* Right side - Org Risk Summary Trigger with Average Badges */}
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 px-1.5 text-[9px] gap-1 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                      >
                        <BarChart3 className="w-3 h-3" />
                        <span className="hidden sm:inline">Org Summary</span>
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400">{orgAggregates.totalRisks}</Badge>
                        <Badge className="bg-amber-500 text-[7px] px-1 py-0 h-4 text-white">
                          Avg Inh: {orgAggregates.avgInherent}
                        </Badge>
                        <Badge className="bg-emerald-500 text-[7px] px-1 py-0 h-4 text-white">
                          Avg Res: {orgAggregates.avgResidual}
                        </Badge>
                        <Badge className={`text-[7px] px-1 py-0 h-4 text-white ${
                          orgAggregates.avgControlEffectiveness === "Effective" ? "bg-emerald-500" : 
                          orgAggregates.avgControlEffectiveness === "Partially Effective" ? "bg-amber-500" : "bg-red-500"
                        }`}>
                          {orgAggregates.avgControlEffectiveness === "Partially Effective" ? "Part. Eff" : orgAggregates.avgControlEffectiveness}
                        </Badge>
                        {orgScoresPanelExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  
                  {/* Expanded Org Summary Panel */}
                  <CollapsibleContent className="animate-accordion-down">
                    <Card className="mt-1 p-2 border border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
                      <div className="space-y-2">
                        {/* Header with Org Name and Aggregate Summary */}
                        <div className="flex items-center justify-between pb-1.5 border-b border-border">
                          <div className="flex items-center gap-1.5">
                            <Library className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span className="font-semibold text-xs text-indigo-800 dark:text-indigo-200">{currentOrganization}</span>
                            <Badge variant="outline" className="text-[8px] px-1.5 border-indigo-300 text-indigo-600 dark:text-indigo-400">{orgAggregates.totalRisks} Risks</Badge>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge className="bg-amber-500 text-[8px] px-1.5 py-0 text-white">Avg Inh: {orgAggregates.avgInherent}</Badge>
                            <Badge className="bg-emerald-500 text-[8px] px-1.5 py-0 text-white">Avg Res: {orgAggregates.avgResidual}</Badge>
                            <Badge className={`text-[8px] px-1.5 py-0 text-white ${orgAggregates.avgControlEffectiveness === "Effective" ? "bg-emerald-500" : orgAggregates.avgControlEffectiveness === "Partially Effective" ? "bg-amber-500" : "bg-red-500"}`}>
                              {orgAggregates.avgControlEffectiveness}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Individual Risks Table */}
                        <ScrollArea className="h-[180px]">
                          <table className="w-full text-[9px]">
                            <thead className="sticky top-0 bg-muted/90 z-10">
                              <tr>
                                <th className="text-left py-1 px-1.5 font-medium">Risk Title</th>
                                <th className="text-center py-1 px-1 font-medium w-14">Inherent</th>
                                <th className="text-center py-1 px-1 font-medium w-14">Residual</th>
                                <th className="text-center py-1 px-1 font-medium w-16">Control Eff.</th>
                                <th className="text-center py-1 px-1 font-medium w-14">Appetite</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orgRisks.map((risk, idx) => {
                                const isCurrentRisk = risk.id === riskId || risk.title === riskName;
                                
                                // Use live form values for current risk, static for others
                                const displayInherent = isCurrentRisk ? currentRiskInherentScore : (risk.inherentRisk.score || 0);
                                const displayResidual = isCurrentRisk ? currentRiskResidualScore : (risk.residualRisk.score || 0);
                                const displayControlEff = isCurrentRisk 
                                  ? (currentRiskControlScore >= 4 ? "Eff" : currentRiskControlScore >= 2.5 ? "Part" : "Ineff")
                                  : getControlEffBadge(risk.controlEffectiveness.label).text;
                                const displayControlColor = isCurrentRisk
                                  ? (currentRiskControlScore >= 4 ? "bg-emerald-500" : currentRiskControlScore >= 2.5 ? "bg-amber-500" : "bg-red-500")
                                  : getControlEffBadge(risk.controlEffectiveness.label).color;
                                
                                const isWithinAppetite = displayResidual <= 6;
                                const inherentInfo = getScoreLevelLabel(displayInherent);
                                const residualInfo = getScoreLevelLabel(displayResidual);
                                
                                return (
                                  <tr 
                                    key={risk.id} 
                                    className={cn(
                                      "border-b border-border/30 hover:bg-muted/50 transition-colors",
                                      isCurrentRisk && "bg-indigo-100/70 dark:bg-indigo-900/40 ring-1 ring-indigo-400"
                                    )}
                                  >
                                    <td className="py-1 px-1.5 max-w-[140px]" title={risk.title}>
                                      <div className="flex items-center gap-1">
                                        {isCurrentRisk && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />}
                                        <span className="truncate">{risk.title.length > 28 ? risk.title.substring(0, 28) + '...' : risk.title}</span>
                                      </div>
                                    </td>
                                    <td className="text-center py-1">
                                      <Badge className={`${inherentInfo.color} text-[7px] px-1.5 py-0 text-white`}>
                                        {displayInherent.toFixed(1)}
                                      </Badge>
                                    </td>
                                    <td className="text-center py-1">
                                      <Badge className={`${residualInfo.color} text-[7px] px-1.5 py-0 text-white`}>
                                        {displayResidual.toFixed(1)}
                                      </Badge>
                                    </td>
                                    <td className="text-center py-1">
                                      <Badge className={`${displayControlColor} text-[7px] px-1.5 py-0 text-white`}>
                                        {displayControlEff}
                                      </Badge>
                                    </td>
                                    <td className="text-center py-1">
                                      <Badge className={`${isWithinAppetite ? 'bg-emerald-500' : 'bg-red-500'} text-[7px] px-1.5 py-0 text-white`}>
                                        {isWithinAppetite ? 'Within' : 'Outside'}
                                      </Badge>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </ScrollArea>
                        
                        {/* Footer - Risk Distribution Summary */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-border">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-muted-foreground font-medium">Distribution:</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 cursor-help">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    <span className="text-[9px]">{orgAggregates.risksByLevel.high}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">High Risk</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 cursor-help">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span className="text-[9px]">{orgAggregates.risksByLevel.medium}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">Medium Risk</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 cursor-help">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-[9px]">{orgAggregates.risksByLevel.low}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">Low Risk</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge className="bg-emerald-500 text-[8px] px-1.5 py-0 text-white">{orgAggregates.withinAppetite} Within</Badge>
                            <Badge className="bg-red-500 text-[8px] px-1.5 py-0 text-white">{orgAggregates.outsideAppetite} Outside</Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              </div>
              
              {/* Right side - Score Cards (compact) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Card className={`px-1.5 py-0.5 border-l-2 min-w-fit ${getRatingLabel(inherentScore).color === 'bg-red-500' ? 'border-l-red-500 bg-red-50 dark:bg-red-950/40' : getRatingLabel(inherentScore).color === 'bg-amber-500' ? 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/40' : getRatingLabel(inherentScore).color === 'bg-slate-400' ? 'border-l-slate-400 bg-slate-50 dark:bg-slate-950/40' : 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'} border border-border`}>
                  <div className="text-[8px] text-muted-foreground leading-tight">Inherent</div>
                  <div className="text-xs font-bold leading-tight">{inherentScore}</div>
                  <div className="text-[8px] text-muted-foreground leading-tight">{getRatingLabel(inherentScore).label}</div>
                </Card>
                <Card className={`px-1.5 py-0.5 border-l-2 min-w-fit ${getRatingLabel(controlScore).color === 'bg-red-500' ? 'border-l-red-500 bg-red-50 dark:bg-red-950/40' : getRatingLabel(controlScore).color === 'bg-amber-500' ? 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/40' : getRatingLabel(controlScore).color === 'bg-slate-400' ? 'border-l-slate-400 bg-slate-50 dark:bg-slate-950/40' : 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'} border border-border`}>
                  <div className="text-[8px] text-muted-foreground leading-tight">Control</div>
                  <div className="text-xs font-bold leading-tight">{controlScore}</div>
                  <div className="text-[8px] text-muted-foreground leading-tight">{getRatingLabel(controlScore).label}</div>
                </Card>
                <Card className={`px-1.5 py-0.5 border-l-2 min-w-fit ${getRatingLabel(residualScore).color === 'bg-red-500' ? 'border-l-red-500 bg-red-50 dark:bg-red-950/40' : getRatingLabel(residualScore).color === 'bg-amber-500' ? 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/40' : getRatingLabel(residualScore).color === 'bg-slate-400' ? 'border-l-slate-400 bg-slate-50 dark:bg-slate-950/40' : 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'} border border-border`}>
                  <div className="text-[8px] text-muted-foreground leading-tight">Residual</div>
                  <div className="text-xs font-bold leading-tight">{residualScore}</div>
                  <div className="text-[8px] text-muted-foreground leading-tight">{getRatingLabel(residualScore).label}</div>
                </Card>
                <Card className="px-1.5 py-0.5 border-l-2 border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border border-border min-w-fit">
                  <div className="text-[8px] text-muted-foreground leading-tight">Reduction</div>
                  <div className="flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 leading-tight">{riskReduction}</span>
                  </div>
                  <div className="text-[8px] text-muted-foreground leading-tight">pts</div>
                </Card>
                <Popover>
                  <PopoverTrigger asChild>
                    <Card className="px-1.5 py-0.5 border-l-2 border-l-blue-500 bg-blue-50 dark:bg-blue-950/40 border border-border cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/60 transition-colors min-w-fit">
                      <div className="text-[8px] text-muted-foreground leading-tight">Appetite</div>
                      <div className="flex items-center">
                        <Badge className={`text-[8px] px-1 py-0 ${residualScore <= 2 ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"}`}>
                          {residualScore <= 2 ? "Within" : "Outside"}
                        </Badge>
                      </div>
                      <div className="text-[8px] text-muted-foreground leading-tight">≤2.0</div>
                    </Card>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 z-[100]" align="end" sideOffset={5} collisionPadding={60}>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-xs">Risk Appetite</h4>
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[10px]">Low</Badge>
                      </div>
                      <Separator />
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">Threshold</span>
                          <span className="font-medium">2.0</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">Current</span>
                          <span className="font-medium">{residualScore}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">Status</span>
                          <Badge variant="outline" className={`text-[9px] ${residualScore <= 2 ? "border-emerald-500 text-emerald-600" : "border-red-500 text-red-600"}`}>
                            {residualScore <= 2 ? "Within" : "Outside"}
                          </Badge>
                        </div>
                      </div>
                      <Separator />
                      <p className="text-[9px] text-muted-foreground">
                        Low appetite for compliance risks. Residual rating above 2.0 is outside appetite.
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2">
            <TabsList className="bg-transparent border border-border rounded-md w-full justify-start gap-0 p-0 h-auto flex-wrap">
              <TabsTrigger value="inherent-rating" className="rounded-none border-r border-border data-[state=active]:bg-muted/50 data-[state=active]:border-b-2 data-[state=active]:border-b-orange-500 px-2.5 py-1.5 gap-1.5 text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                Inherent Rating
                <Badge variant="outline" className="ml-0.5 text-[10px] px-1 py-0">1</Badge>
              </TabsTrigger>
              <TabsTrigger value="control-effectiveness" className="rounded-none border-r border-border data-[state=active]:bg-muted/50 data-[state=active]:border-b-2 data-[state=active]:border-b-blue-500 px-2.5 py-1.5 gap-1.5 text-xs">
                <Shield className="w-3.5 h-3.5" />
                Control Effectiveness
                <Badge variant="outline" className="ml-0.5 text-[10px] px-1 py-0">2</Badge>
              </TabsTrigger>
              <TabsTrigger value="residual-rating" className="rounded-none border-r border-border data-[state=active]:bg-muted/50 data-[state=active]:border-b-2 data-[state=active]:border-b-emerald-500 px-2.5 py-1.5 gap-1.5 text-xs">
                <CheckCircle className="w-3.5 h-3.5" />
                Residual Rating
                <Badge variant="outline" className="ml-0.5 text-[10px] px-1 py-0">3</Badge>
              </TabsTrigger>
              <TabsTrigger value="heat-map" className="rounded-none border-r border-border data-[state=active]:bg-muted/50 data-[state=active]:border-b-2 data-[state=active]:border-b-purple-500 px-2.5 py-1.5 gap-1.5 text-xs">
                Heat Map
              </TabsTrigger>
              <TabsTrigger value="issues" className="rounded-none data-[state=active]:bg-muted/50 data-[state=active]:border-b-2 data-[state=active]:border-b-red-500 px-2.5 py-1.5 gap-1.5 text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                Issues
              </TabsTrigger>
            </TabsList>

            {/* Inherent Rating Tab */}
            <TabsContent value="inherent-rating" className="space-y-2">
              <Card className="p-2 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-sm font-semibold">Overall Inherent Risk Rating</h2>
                    <p className="text-[11px] text-muted-foreground">Calculated based on weighted impact factors</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpandedPanel('inherent-rating')}>
                            <Maximize2 className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Expand to full screen</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className={`px-2 py-0.5 rounded-md ${getRatingLabel(inherentScore).color} text-white flex-shrink-0 min-w-fit`}>
                      <div className="text-[9px] opacity-90 whitespace-nowrap">Score: {inherentScore}</div>
                      <div className="font-semibold text-[10px] whitespace-nowrap">{getRatingLabel(inherentScore).label}</div>
                    </div>
                  </div>
                </div>

                {/* Previous Assessments Floater */}
                <div className="relative mb-2">
                  <FormPreviousAssessmentFloater
                    type="inherent"
                    historyData={inherentHistory}
                  />
                </div>

                {/* Collaboration Notice */}
                <div className="flex items-center justify-between px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 rounded-md border border-emerald-200 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300">
                      Live collaboration active! Watch for colored badges on cells showing who's editing in real time.
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-1">
                      {getCollaboratorsForSection('inherent').map((pos, idx) => (
                        <div 
                          key={idx}
                          className={`w-4 h-4 rounded-full ${pos.collaborator.color} border border-white dark:border-background flex items-center justify-center text-[7px] font-semibold text-white`}
                          title={pos.collaborator.name}
                        >
                          {pos.collaborator.avatar}
                        </div>
                      ))}
                      {getCollaboratorsForSection('inherent').length === 0 && (
                        <span className="text-[10px] text-muted-foreground">No active editors</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Factors Table */}
                <div className="border rounded-lg overflow-visible">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="w-6 px-0.5 py-0.5 text-left border-r border-border"><Checkbox className="h-3 w-3" /></th>
                        <th className="px-1 py-0.5 text-left text-[10px] font-medium w-36 border-r border-border">Factor & Description</th>
                        <th className="px-1 py-0.5 text-left text-[10px] font-medium w-28 border-r border-border">Rating</th>
                        <th className="px-1 py-0.5 text-left text-[10px] font-medium w-48 border-r border-border">Comments</th>
                        {showWeights && <th className="px-1 py-0.5 text-left text-[10px] font-medium w-20">Weightage (%)</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {inherentFactors.map((factor) => {
                        const factorCellId = factor.name.toLowerCase().replace(/\s+/g, '-');
                        return (
                        <tr key={factor.id} className="border-t hover:bg-muted/30">
                          <td className="px-1 py-1 border-r border-border"><Checkbox /></td>
                          <td className="px-1.5 py-1 border-r border-border">
                            <div className="flex items-start gap-1">
                              <CellCommentPopover factorName={factor.name} field="Description">
                                <div className="flex-1">
                                  <div className="font-medium text-xs">{factor.name}</div>
                                  <div className="text-[10px] text-muted-foreground leading-tight">{factor.description}</div>
                                </div>
                              </CellCommentPopover>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button className="mt-0.5 text-muted-foreground hover:text-foreground flex-shrink-0">
                                      <HelpCircle className="w-3 h-3" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-xs p-3">
                                    <p className="font-medium text-sm mb-1">{factor.name} Guidance</p>
                                    <p className="text-xs text-muted-foreground mb-2">{factor.description}</p>
                                    <div className="text-xs space-y-1">
                                      <p><strong>1 - Very Low:</strong> Minimal impact expected</p>
                                      <p><strong>2 - Low:</strong> Minor impact, easily managed</p>
                                      <p><strong>3 - Medium:</strong> Moderate impact requiring attention</p>
                                      <p><strong>4 - High:</strong> Significant impact on operations</p>
                                      <p><strong>5 - Very High:</strong> Critical impact, immediate action needed</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </td>
                          <td className="px-1.5 py-1 overflow-visible border-r border-border">
                            <CollaborativeCell cellId={`${factorCellId}-rating`}>
                              <CellCommentPopover factorName={factor.name} field="Rating">
                                <UpdateVersionIndicator 
                                  fieldKey={`inherent-${factor.id}-rating`}
                                  originalValue={getOriginalValue('inherent', factor.id, 'rating')}
                                >
                                  <AIFieldSuggestion
                                    onSuggest={() => suggestInherentRating(factor.id)}
                                    fieldType="rating"
                                  >
                                    <AIFieldIndicator 
                                      isAIFilled={isFieldAIFilled(`inherent-${factor.id}-rating`)} 
                                      isEdited={isFieldEdited(`inherent-${factor.id}-rating`)}
                                    >
                                      <Select 
                                        value={factor.rating.toString()} 
                                        onValueChange={(v) => {
                                          markFieldAsEdited(`inherent-${factor.id}-rating`);
                                          updateFactorRating(inherentFactors, setInherentFactors, factor.id, parseInt(v), 'inherent');
                                        }}
                                      >
                                        <SelectTrigger className="w-full bg-background h-6 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-background border shadow-lg z-50">
                                          <SelectItem value="0">Not Applicable (N/A)</SelectItem>
                                          <SelectItem value="1">Very Low (1)</SelectItem>
                                          <SelectItem value="2">Low (2)</SelectItem>
                                          <SelectItem value="3">Medium (3)</SelectItem>
                                          <SelectItem value="4">High (4)</SelectItem>
                                          <SelectItem value="5">Very High (5)</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </AIFieldIndicator>
                                  </AIFieldSuggestion>
                                </UpdateVersionIndicator>
                              </CellCommentPopover>
                            </CollaborativeCell>
                          </td>
                          <td className="px-1.5 py-1 overflow-visible border-r border-border">
                            <CollaborativeCell cellId={`${factorCellId}-comments`}>
                              <CellCommentPopover factorName={factor.name} field="Comments">
                                <UpdateVersionIndicator 
                                  fieldKey={`inherent-${factor.id}-comments`}
                                  originalValue={getOriginalValue('inherent', factor.id, 'comments')}
                                >
                                  <AIFieldSuggestion
                                    onSuggest={() => suggestInherentComment(factor.id)}
                                    fieldType="comment"
                                  >
                                    <AIFieldIndicator
                                      isAIFilled={isFieldAIFilled(`inherent-${factor.id}-comments`)} 
                                      isEdited={isFieldEdited(`inherent-${factor.id}-comments`)}
                                    >
                                      <Textarea 
                                        value={factor.comments}
                                        onChange={(e) => {
                                          markFieldAsEdited(`inherent-${factor.id}-comments`);
                                          updateFactorComment(inherentFactors, setInherentFactors, factor.id, e.target.value, 'inherent');
                                        }}
                                        className="min-h-[22px] h-[22px] resize-none text-xs py-0.5"
                                      />
                                    </AIFieldIndicator>
                                  </AIFieldSuggestion>
                                </UpdateVersionIndicator>
                              </CellCommentPopover>
                            </CollaborativeCell>
                          </td>
                          {showWeights && <td className="px-1.5 py-1 text-center text-xs font-medium">{factor.weightage}</td>}
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </Card>

            </TabsContent>

            {/* Control Effectiveness Tab */}
            <TabsContent value="control-effectiveness" className="space-y-2">
              <Card className="p-2 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-sm font-semibold">Control Effectiveness Assessment</h2>
                    <p className="text-[11px] text-muted-foreground">Evaluate design, operating effectiveness, and testing results</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      To mark a control as N/A: Click the icon in the 'N/A' column, check the 'Mark as Not Applicable' box, and provide a justification.
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Click the expander icon (▶) next to a control name to view additional details including control description and supporting evidences.
                    </p>
                  </div>

                {/* Previous Assessments Floater */}
                <div className="relative mb-2">
                  <FormPreviousAssessmentFloater
                    type="control"
                    historyData={controlHistory}
                  />
                </div>
                  <div className="flex items-center gap-1.5">
                    {/* Add Control Button with Options */}
                    <Popover open={showAddControlOptions} onOpenChange={setShowAddControlOptions}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="gap-1.5 h-7 text-xs px-2.5 border border-border"
                        >
                          <Plus className="w-3 h-3" />Add Control
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-1.5" align="end">
                        <div className="space-y-0.5">
                          <button
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-muted transition-colors text-left"
                            onClick={() => {
                              setShowAddControlOptions(false);
                              setAddControlModalOpen(true);
                            }}
                          >
                            <Library className="w-3.5 h-3.5 text-blue-500" />
                            <div>
                              <div className="font-medium">Select from Library</div>
                              <div className="text-[10px] text-muted-foreground">Choose existing controls</div>
                            </div>
                          </button>
                          <button
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-muted transition-colors text-left"
                            onClick={() => {
                              setShowAddControlOptions(false);
                              setShowNewControlForm(true);
                            }}
                          >
                            <PenLine className="w-3.5 h-3.5 text-emerald-500" />
                            <div>
                              <div className="font-medium">Create New Control</div>
                              <div className="text-[10px] text-muted-foreground">Add a custom control</div>
                            </div>
                          </button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpandedPanel('control-effectiveness')}>
                            <Maximize2 className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Expand to full screen</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className={`px-2 py-0.5 rounded-md ${getRatingLabel(controlScore).color} text-white min-w-fit`}>
                      <div className="text-[9px] opacity-90 whitespace-nowrap">Score: {controlScore}</div>
                      <div className="font-semibold text-[10px] whitespace-nowrap">{getRatingLabel(controlScore).label}</div>
                    </div>
                  </div>
                </div>

                {/* Collaboration Notice */}
                <div className="flex items-center justify-between px-2 py-1 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] text-blue-700 dark:text-blue-300">
                      Results displayed are from the latest control test performed on this control, with detailed responses to questions and samples.
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-1">
                      {getCollaboratorsForSection('control').map((pos, idx) => (
                        <div 
                          key={idx}
                          className={`w-4 h-4 rounded-full ${pos.collaborator.color} border border-white dark:border-background flex items-center justify-center text-[7px] font-semibold text-white`}
                          title={pos.collaborator.name}
                        >
                          {pos.collaborator.avatar}
                        </div>
                      ))}
                      {getCollaboratorsForSection('control').length === 0 && (
                        <span className="text-[10px] text-muted-foreground">No active editors</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg overflow-visible">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="w-6 px-0.5 py-0.5 text-left border-r border-border"><Checkbox className="h-3 w-3" /></th>
                        <th className="px-1 py-0.5 text-left text-[10px] font-medium w-16 border-r border-border">Control ID</th>
                        <th className="px-1 py-0.5 text-left text-[10px] font-medium w-32 border-r border-border">Control Name</th>
                        <th className="px-1 py-0.5 text-left text-[10px] font-medium w-20 border-r border-border">Type</th>
                        <th className="px-1 py-0.5 text-left text-[10px] font-medium w-32 border-r border-border">Owner</th>
                        <th className="px-1 py-0.5 text-center text-[10px] font-medium w-10 border-r border-border">N/A</th>
                        <th className="px-1 py-0.5 text-left text-[10px] font-medium w-28 border-r border-border">Design Effectiveness</th>
                        <th className="px-1 py-0.5 text-left text-[10px] font-medium w-28 border-r border-border">Operational Effectiveness</th>
                        <th className="px-1 py-0.5 text-left text-[10px] font-medium w-24 border-r border-border">Overall</th>
                        <th className="px-1 py-0.5 text-left text-[10px] font-medium w-16">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {controls.map((control) => {
                        const avg = ((control.designRating + control.operatingRating + control.testingRating) / 3).toFixed(1);
                        const controlCellId = control.id.toLowerCase();
                        const isExpanded = expandedControls.has(control.id);
                        return (
                          <>
                            <tr key={control.id} className={cn("border-t hover:bg-muted/30", control.isNotApplicable && "bg-muted/20 opacity-75")}>
                              <td className="px-1 py-1 border-r border-border"><Checkbox /></td>
                              <td className="px-1.5 py-1 font-mono text-[10px] text-blue-600 border-r border-border">{control.id}</td>
                              <td className="px-1.5 py-1 border-r border-border">
                                <button 
                                  className="flex items-center gap-1 text-left hover:text-blue-600 transition-colors group w-full"
                                  onClick={() => toggleControlExpanded(control.id)}
                                >
                                  <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                                  <CellCommentPopover factorName={control.id} field="Name">
                                    <span className="font-medium text-xs group-hover:text-blue-600 truncate">{control.name}</span>
                                  </CellCommentPopover>
                                </button>
                              </td>
                              <td className="px-1.5 py-1 border-r border-border">
                                <Badge variant="outline" className={`text-[10px] px-1 py-0 ${control.type === "Preventive" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                                  {control.type}
                                </Badge>
                              </td>
                              <td className="px-1.5 py-1 border-r border-border">
                                <div className="flex items-center gap-1">
                                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-muted/50 rounded-full border border-border">
                                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-medium text-primary">
                                      {control.owner.split(' ').map(w => w[0]).join('').substring(0, 2) || control.owner.substring(0, 2)}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-medium leading-tight">{control.owner === "Compliance Team" ? "J. Smith" : control.owner === "Risk Management" ? "S. Lee" : "M. Davis"}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              {/* N/A Toggle Column */}
                              <td className="px-1.5 py-1 border-r border-border">
                                <div className="flex justify-center">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button 
                                        className={cn(
                                          "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                          control.isNotApplicable 
                                            ? "bg-amber-100 border-amber-300 text-amber-700" 
                                            : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                                        )}
                                      >
                                        {control.isNotApplicable ? (
                                          <X className="w-3 h-3" />
                                        ) : (
                                          <span className="text-[8px] font-medium">—</span>
                                        )}
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3" align="start">
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-medium">Mark as Not Applicable</span>
                                          <Checkbox
                                            checked={control.isNotApplicable}
                                            onCheckedChange={(checked) => toggleControlNA(control.id, checked as boolean)}
                                          />
                                        </div>
                                        {control.isNotApplicable && (
                                          <div className="space-y-1.5">
                                            <label className="text-[10px] font-medium text-muted-foreground">
                                              Justification <span className="text-red-500">*</span>
                                            </label>
                                            <Textarea
                                              placeholder="Enter justification for marking as N/A..."
                                              value={control.naJustification}
                                              onChange={(e) => updateControlNAJustification(control.id, e.target.value)}
                                              className="min-h-[60px] text-xs"
                                            />
                                            {control.isNotApplicable && !control.naJustification.trim() && (
                                              <p className="text-[10px] text-red-500">Justification is required</p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </td>
                              {/* Design Effectiveness */}
                              <td className={cn("px-1.5 py-1 overflow-visible border-r border-border", control.isNotApplicable && "opacity-50 pointer-events-none")}>
                                <CollaborativeCell cellId={`${controlCellId}-design`}>
                                  <CellCommentPopover factorName={control.id} field="Design">
                                    <UpdateVersionIndicator 
                                      fieldKey={`control-${control.id}-design`}
                                      originalValue={getOriginalValue('control', control.id, 'designRating')}
                                    >
                                      <AIFieldSuggestion
                                        onSuggest={() => suggestControlRating(control.id, 'designRating')}
                                        fieldType="design"
                                        disabled={control.isNotApplicable}
                                      >
                                        <AIFieldIndicator 
                                          isAIFilled={isFieldAIFilled(`control-${control.id}-design`)} 
                                          isEdited={isFieldEdited(`control-${control.id}-design`)}
                                        >
                                          <Select 
                                            value={control.designRating.toString()} 
                                            onValueChange={(v) => {
                                              markFieldAsEdited(`control-${control.id}-design`);
                                              updateControlRating(control.id, 'designRating', parseInt(v));
                                            }}
                                            disabled={control.isNotApplicable}
                                          >
                                            <SelectTrigger className="w-full bg-background h-6 text-xs">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-background border shadow-lg z-50">
                                              <SelectItem value="1">Ineffective (1)</SelectItem>
                                              <SelectItem value="2">Partially Effective (2)</SelectItem>
                                              <SelectItem value="3">Moderately Effective (3)</SelectItem>
                                              <SelectItem value="4">Effective (4)</SelectItem>
                                              <SelectItem value="5">Highly Effective (5)</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </AIFieldIndicator>
                                      </AIFieldSuggestion>
                                    </UpdateVersionIndicator>
                                  </CellCommentPopover>
                                </CollaborativeCell>
                              </td>
                              {/* Operational Effectiveness */}
                              <td className={cn("px-1.5 py-1 overflow-visible border-r border-border", control.isNotApplicable && "opacity-50 pointer-events-none")}>
                                <CollaborativeCell cellId={`${controlCellId}-operating`}>
                                  <CellCommentPopover factorName={control.id} field="Operating">
                                    <UpdateVersionIndicator 
                                      fieldKey={`control-${control.id}-operating`}
                                      originalValue={getOriginalValue('control', control.id, 'operatingRating')}
                                    >
                                      <AIFieldSuggestion
                                        onSuggest={() => suggestControlRating(control.id, 'operatingRating')}
                                        fieldType="operating"
                                        disabled={control.isNotApplicable}
                                      >
                                        <AIFieldIndicator 
                                          isAIFilled={isFieldAIFilled(`control-${control.id}-operating`)} 
                                          isEdited={isFieldEdited(`control-${control.id}-operating`)}
                                        >
                                          <Select 
                                            value={control.operatingRating.toString()} 
                                            onValueChange={(v) => {
                                              markFieldAsEdited(`control-${control.id}-operating`);
                                              updateControlRating(control.id, 'operatingRating', parseInt(v));
                                            }}
                                            disabled={control.isNotApplicable}
                                          >
                                            <SelectTrigger className="w-full bg-background h-6 text-xs">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-background border shadow-lg z-50">
                                              <SelectItem value="1">Ineffective (1)</SelectItem>
                                              <SelectItem value="2">Partially Effective (2)</SelectItem>
                                              <SelectItem value="3">Moderately Effective (3)</SelectItem>
                                              <SelectItem value="4">Effective (4)</SelectItem>
                                              <SelectItem value="5">Highly Effective (5)</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </AIFieldIndicator>
                                      </AIFieldSuggestion>
                                    </UpdateVersionIndicator>
                                  </CellCommentPopover>
                                </CollaborativeCell>
                              </td>
                              {/* Overall/Testing Effectiveness */}
                              <td className={cn("px-1.5 py-1 overflow-visible border-r border-border", control.isNotApplicable && "opacity-50 pointer-events-none")}>
                                <CollaborativeCell cellId={`${controlCellId}-testing`}>
                                  <CellCommentPopover factorName={control.id} field="Testing">
                                    <UpdateVersionIndicator 
                                      fieldKey={`control-${control.id}-testing`}
                                      originalValue={getOriginalValue('control', control.id, 'testingRating')}
                                    >
                                      <AIFieldSuggestion
                                        onSuggest={() => suggestControlRating(control.id, 'testingRating')}
                                        fieldType="testing"
                                        disabled={control.isNotApplicable}
                                      >
                                        <AIFieldIndicator 
                                          isAIFilled={isFieldAIFilled(`control-${control.id}-testing`)} 
                                          isEdited={isFieldEdited(`control-${control.id}-testing`)}
                                        >
                                          <Select 
                                            value={control.testingRating.toString()} 
                                            onValueChange={(v) => {
                                              markFieldAsEdited(`control-${control.id}-testing`);
                                              updateControlRating(control.id, 'testingRating', parseInt(v));
                                            }}
                                            disabled={control.isNotApplicable}
                                          >
                                            <SelectTrigger className="w-full bg-background h-6 text-xs">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-background border shadow-lg z-50">
                                              {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                                            </SelectContent>
                                          </Select>
                                        </AIFieldIndicator>
                                      </AIFieldSuggestion>
                                    </UpdateVersionIndicator>
                                  </CellCommentPopover>
                                </CollaborativeCell>
                              </td>
                              {/* Score */}
                              <td className="px-1.5 py-1">
                                {control.isNotApplicable ? (
                                  <Badge className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0">N/A</Badge>
                                ) : (
                                  <Badge className={`${getRatingLabel(parseFloat(avg)).color} text-white text-[10px] px-1.5 py-0`}>{avg}</Badge>
                                )}
                              </td>
                            </tr>
                            {/* Expandable row for control details */}
                            {isExpanded && (
                              <tr key={`${control.id}-expanded`} className="bg-slate-50 dark:bg-slate-900/50">
                                <td colSpan={9} className="p-0">
                                  <div className="p-4 border-l-4 border-blue-500 ml-4 mr-4 my-2 bg-background rounded-r-lg shadow-sm animate-fade-in">
                                    {/* Description */}
                                    <div className="mb-3">
                                      <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">DESCRIPTION</h4>
                                      <p className="text-xs text-foreground leading-relaxed">{control.description}</p>
                                    </div>
                                    
                                    {/* Supporting Evidences */}
                                    <div>
                                      <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                                        <Paperclip className="w-3 h-3" />
                                        SUPPORTING EVIDENCES ({control.evidences.length})
                                      </h4>
                                      <div className="flex flex-wrap gap-2">
                                        {control.evidences.map((evidence, idx) => (
                                          <div 
                                            key={idx} 
                                            className="flex items-center gap-2 px-2.5 py-1.5 bg-muted/50 rounded-lg border hover:border-blue-300 transition-colors cursor-pointer group"
                                          >
                                            <FileText className="w-3.5 h-3.5 text-blue-500" />
                                            <div className="flex flex-col">
                                              <span className="text-xs font-medium group-hover:text-blue-600">{evidence.name}</span>
                                              <span className="text-[10px] text-muted-foreground">{evidence.type} • {evidence.date}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Add Control Modal */}
                <AddControlModal 
                  open={addControlModalOpen}
                  onOpenChange={setAddControlModalOpen}
                  existingControlIds={controls.map(c => c.id)}
                  onAddControls={(newControls) => {
                    const controlsToAdd: Control[] = newControls.map(c => ({
                      id: c.id,
                      name: c.name,
                      description: `${c.name} - Control added from available controls library`,
                      type: c.type,
                      owner: c.type === "Preventive" ? "Compliance Team" : "Risk Management",
                      designRating: c.prevDesign,
                      operatingRating: c.prevOperating,
                      testingRating: Math.round((c.prevDesign + c.prevOperating) / 2),
                      evidences: [],
                      cellComments: [],
                      isNotApplicable: false,
                      naJustification: "",
                    }));
                    setControls([...controls, ...controlsToAdd]);
                    toast.success(`${newControls.length} control(s) added successfully`);
                  }}
                />

                {/* Create New Control Dialog */}
                <Dialog open={showNewControlForm} onOpenChange={setShowNewControlForm}>
                  <DialogContent className="sm:max-w-sm p-0">
                    <div className="px-3 py-1.5 border-b bg-gradient-to-r from-emerald-500 to-teal-600">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
                          <PenLine className="w-3.5 h-3.5 text-white" />
                        </div>
                        <DialogTitle className="text-white text-xs">Create New Control</DialogTitle>
                      </div>
                    </div>
                    
                    <div className="p-3 space-y-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium">Control Title</label>
                        <Input 
                          placeholder="Enter control title..."
                          value={newControlTitle}
                          onChange={(e) => setNewControlTitle(e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium">Control Type</label>
                        <Select value={newControlType} onValueChange={(val) => setNewControlType(val as "Preventive" | "Detective")}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Preventive">Preventive</SelectItem>
                            <SelectItem value="Detective">Detective</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Add to Library Checkbox */}
                      <div className="flex items-center gap-1.5 p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-sm border border-blue-200 dark:border-blue-800">
                        <Checkbox 
                          id="addToLibrary" 
                          checked={addToLibrary}
                          onCheckedChange={(checked) => setAddToLibrary(checked as boolean)}
                          className="h-3 w-3"
                        />
                        <label htmlFor="addToLibrary" className="text-[11px] cursor-pointer">
                          <span className="font-medium">Add to control library</span>
                          <span className="block text-[9px] text-muted-foreground">
                            Make this control available for future assessments
                          </span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-2 px-3 py-1.5 border-t bg-muted/30">
                      <Button variant="outline" className="h-6 text-[11px] px-2" onClick={() => setShowNewControlForm(false)}>
                        Cancel
                      </Button>
                      <Button 
                        className="gap-1 h-6 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          if (!newControlTitle.trim()) return;
                          const newId = `CTL-${String(controls.length + 4).padStart(3, '0')}`;
                          const newControl: Control = {
                            id: newId,
                            name: newControlTitle,
                            description: `${newControlTitle} - Custom control`,
                            type: newControlType,
                            owner: "Assigned Owner",
                            designRating: 3,
                            operatingRating: 3,
                            testingRating: 3,
                            evidences: [],
                            cellComments: [],
                            isNotApplicable: false,
                            naJustification: "",
                          };
                          setControls([...controls, newControl]);
                          if (addToLibrary) {
                            toast.success(`Control "${newControlTitle}" created and added to library`);
                          } else {
                            toast.success(`Control "${newControlTitle}" created`);
                          }
                          setNewControlTitle("");
                          setNewControlType("Preventive");
                          setAddToLibrary(false);
                          setShowNewControlForm(false);
                        }}
                        disabled={!newControlTitle.trim()}
                      >
                        <Plus className="w-3 h-3" />Create Control
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </Card>

            </TabsContent>

            {/* Residual Rating Tab */}
            <TabsContent value="residual-rating" className="space-y-2">
              <Card className="p-2 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-sm font-semibold">Residual Risk Rating</h2>
                    <p className="text-[11px] text-muted-foreground">Risk rating after applying controls</p>
                </div>

                {/* Previous Assessments Floater */}
                <div className="relative mb-2">
                  <FormPreviousAssessmentFloater
                    type="residual"
                    historyData={residualHistory}
                  />
                </div>
                  <div className="flex items-center gap-1.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpandedPanel('residual-rating')}>
                            <Maximize2 className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Expand to full screen</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className={`px-2 py-0.5 rounded-md ${getRatingLabel(residualScore).color} text-white min-w-fit`}>
                      <div className="text-[9px] opacity-90 whitespace-nowrap">Score: {residualScore}</div>
                      <div className="font-semibold text-[10px] whitespace-nowrap">{getRatingLabel(residualScore).label}</div>
                    </div>
                  </div>
                </div>

                {/* Collaboration Notice */}
                <div className="flex items-center justify-between px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 rounded-md border border-emerald-200 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300">
                      Live collaboration active! Watch for colored badges on cells showing who's editing in real time.
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-1">
                      {getCollaboratorsForSection('residual').map((pos, idx) => (
                        <div 
                          key={idx}
                          className={`w-4 h-4 rounded-full ${pos.collaborator.color} border border-white dark:border-background flex items-center justify-center text-[7px] font-semibold text-white`}
                          title={pos.collaborator.name}
                        >
                          {pos.collaborator.avatar}
                        </div>
                      ))}
                      {getCollaboratorsForSection('residual').length === 0 && (
                        <span className="text-[10px] text-muted-foreground">No active editors</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg overflow-visible">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="w-6 px-0.5 py-0.5 text-left border-r border-border"><Checkbox className="h-3 w-3" /></th>
                        <th className="px-1 py-0.5 text-left text-[10px] font-medium w-36 border-r border-border">Factor & Description</th>
                        <th className="px-1 py-0.5 text-left text-[10px] font-medium w-28 border-r border-border">Rating</th>
                        <th className="px-1 py-0.5 text-left text-[10px] font-medium w-48 border-r border-border">Comments</th>
                        {showWeights && <th className="px-1 py-0.5 text-left text-[10px] font-medium w-20">Weightage (%)</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {residualFactors.map((factor) => (
                        <tr key={factor.id} className="border-t hover:bg-muted/30">
                          <td className="px-1 py-1 border-r border-border"><Checkbox /></td>
                          <td className="px-1.5 py-1 border-r border-border">
                            <div className="flex items-start gap-1">
                              <CellCommentPopover factorName={factor.name} field="Description">
                                <div className="flex-1">
                                  <div className="font-medium text-xs">{factor.name}</div>
                                  <div className="text-[10px] text-muted-foreground leading-tight">{factor.description}</div>
                                </div>
                              </CellCommentPopover>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button className="mt-0.5 text-muted-foreground hover:text-foreground flex-shrink-0">
                                      <HelpCircle className="w-3 h-3" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-xs p-3">
                                    <p className="font-medium text-sm mb-1">{factor.name} Guidance</p>
                                    <p className="text-xs text-muted-foreground mb-2">{factor.description}</p>
                                    <div className="text-xs space-y-1">
                                      <p><strong>1 - Very Low:</strong> Minimal residual impact</p>
                                      <p><strong>2 - Low:</strong> Minor residual impact after controls</p>
                                      <p><strong>3 - Medium:</strong> Moderate residual impact</p>
                                      <p><strong>4 - High:</strong> Significant residual impact</p>
                                      <p><strong>5 - Very High:</strong> Critical residual impact</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </td>
                          <td className="px-1.5 py-1 overflow-visible border-r border-border">
                            <CellCommentPopover factorName={factor.name} field="Rating">
                              <UpdateVersionIndicator 
                                fieldKey={`residual-${factor.id}-rating`}
                                originalValue={getOriginalValue('residual', factor.id, 'rating')}
                              >
                                <AIFieldSuggestion
                                  onSuggest={() => suggestResidualRating(factor.id)}
                                  fieldType="rating"
                                >
                                  <AIFieldIndicator 
                                    isAIFilled={isFieldAIFilled(`residual-${factor.id}-rating`)} 
                                    isEdited={isFieldEdited(`residual-${factor.id}-rating`)}
                                  >
                                    <Select 
                                      value={factor.rating.toString()} 
                                      onValueChange={(v) => {
                                        markFieldAsEdited(`residual-${factor.id}-rating`);
                                        updateFactorRating(residualFactors, setResidualFactors, factor.id, parseInt(v), 'residual');
                                      }}
                                    >
                                      <SelectTrigger className="w-full bg-background h-6 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-background border shadow-lg z-50">
                                        <SelectItem value="0">Not Applicable (N/A)</SelectItem>
                                        <SelectItem value="1">Very Low (1)</SelectItem>
                                        <SelectItem value="2">Low (2)</SelectItem>
                                        <SelectItem value="3">Medium (3)</SelectItem>
                                        <SelectItem value="4">High (4)</SelectItem>
                                        <SelectItem value="5">Very High (5)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </AIFieldIndicator>
                                </AIFieldSuggestion>
                              </UpdateVersionIndicator>
                            </CellCommentPopover>
                          </td>
                          <td className="px-1.5 py-1 overflow-visible border-r border-border">
                            <CellCommentPopover factorName={factor.name} field="Comments">
                              <UpdateVersionIndicator 
                                fieldKey={`residual-${factor.id}-comments`}
                                originalValue={getOriginalValue('residual', factor.id, 'comments')}
                              >
                                <AIFieldSuggestion
                                  onSuggest={() => suggestResidualComment(factor.id)}
                                  fieldType="comment"
                                >
                                  <AIFieldIndicator 
                                    isAIFilled={isFieldAIFilled(`residual-${factor.id}-comments`)} 
                                    isEdited={isFieldEdited(`residual-${factor.id}-comments`)}
                                  >
                                    <Textarea 
                                      value={factor.comments}
                                      onChange={(e) => {
                                        markFieldAsEdited(`residual-${factor.id}-comments`);
                                        updateFactorComment(residualFactors, setResidualFactors, factor.id, e.target.value, 'residual');
                                      }}
                                      className="min-h-[22px] h-[22px] resize-none text-xs py-0.5"
                                    />
                                  </AIFieldIndicator>
                                </AIFieldSuggestion>
                              </UpdateVersionIndicator>
                            </CellCommentPopover>
                          </td>
                          {showWeights && <td className="px-1.5 py-1 text-center text-xs font-medium">{factor.weightage}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="flex items-center justify-between">
                <Button variant="outline" className="gap-1 h-7 text-xs px-2.5" onClick={() => setActiveTab("control-effectiveness")}><ChevronLeft className="w-3 h-3" />Back to Previous Section</Button>
                <Button className="gap-1 bg-purple-600 hover:bg-purple-700 h-7 text-xs px-2.5" onClick={() => setActiveTab("heat-map")}>
                  View Heat Map<ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </TabsContent>

            {/* Heat Map Tab */}
            <TabsContent value="heat-map" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Heat Map Chart - Compact 5x5 Grid */}
                <Card className="p-3 lg:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-semibold">Risk Heat Map</h2>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedPanel('heat-map')}>
                              <Maximize2 className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Expand to full screen</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  
                  {/* Score Badges - Compact */}
                  <div className="flex items-center gap-2 mb-2 text-xs">
                    <Badge className="bg-slate-700 text-white hover:bg-slate-700 text-[10px] px-1.5 py-0.5">
                      Inherent: {inherentScore}
                    </Badge>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <Badge className="bg-emerald-500 text-white hover:bg-emerald-500 text-[10px] px-1.5 py-0.5">
                      Residual: {residualScore}
                    </Badge>
                  </div>
                  
                  {/* 5x5 Heat Map Grid */}
                  <div className="flex gap-2">
                    {/* Y-Axis Label */}
                    <div className="flex flex-col justify-center items-center w-6">
                      <span className="text-[10px] font-medium text-muted-foreground [writing-mode:vertical-rl] rotate-180">Likelihood</span>
                    </div>
                    
                    <div className="flex-1">
                      {/* Y-Axis Values + Grid */}
                      <div className="flex gap-1">
                        <div className="flex flex-col justify-around w-16 text-[9px] text-muted-foreground pr-1">
                          <span className="text-right leading-tight">5 - Almost Certain</span>
                          <span className="text-right leading-tight">4 - Likely</span>
                          <span className="text-right leading-tight">3 - Moderate</span>
                          <span className="text-right leading-tight">2 - Unlikely</span>
                          <span className="text-right leading-tight">1 - Rare</span>
                        </div>
                        
                        {/* 5x5 Grid */}
                        <div className="flex-1 relative">
                          <div className="grid grid-cols-5 gap-0.5">
                            {/* Row 5 (Likelihood = 5 - Almost Certain) */}
                            {[1,2,3,4,5].map(impact => {
                              const cellColor = impact <= 2 ? 'bg-amber-400' : impact <= 3 ? 'bg-orange-500' : 'bg-red-500';
                              const inherentImpact = inherentFactors.find(f => f.name === 'Impact')?.rating || 0;
                              const inherentLikelihood = inherentFactors.find(f => f.name === 'Likelihood')?.rating || 0;
                              const residualImpact = residualFactors.find(f => f.name === 'Impact')?.rating || 0;
                              const residualLikelihood = residualFactors.find(f => f.name === 'Likelihood')?.rating || 0;
                              const isInherent = inherentImpact === impact && inherentLikelihood === 5;
                              const isResidual = residualImpact === impact && residualLikelihood === 5;
                              return (
                                <div key={`5-${impact}`} className={`h-8 ${cellColor} rounded-sm flex items-center justify-center relative`}>
                                  {isInherent && <div className="w-4 h-4 rounded-full bg-slate-800 border-2 border-white shadow-md z-10" />}
                                  {isResidual && <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md z-10" />}
                                </div>
                              );
                            })}
                            {/* Row 4 (Likelihood = 4 - Likely) */}
                            {[1,2,3,4,5].map(impact => {
                              const cellColor = impact <= 1 ? 'bg-lime-400' : impact <= 2 ? 'bg-amber-400' : impact <= 4 ? 'bg-orange-500' : 'bg-red-500';
                              const inherentImpact = inherentFactors.find(f => f.name === 'Impact')?.rating || 0;
                              const inherentLikelihood = inherentFactors.find(f => f.name === 'Likelihood')?.rating || 0;
                              const residualImpact = residualFactors.find(f => f.name === 'Impact')?.rating || 0;
                              const residualLikelihood = residualFactors.find(f => f.name === 'Likelihood')?.rating || 0;
                              const isInherent = inherentImpact === impact && inherentLikelihood === 4;
                              const isResidual = residualImpact === impact && residualLikelihood === 4;
                              return (
                                <div key={`4-${impact}`} className={`h-8 ${cellColor} rounded-sm flex items-center justify-center relative`}>
                                  {isInherent && <div className="w-4 h-4 rounded-full bg-slate-800 border-2 border-white shadow-md z-10" />}
                                  {isResidual && <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md z-10" />}
                                </div>
                              );
                            })}
                            {/* Row 3 (Likelihood = 3 - Moderate) */}
                            {[1,2,3,4,5].map(impact => {
                              const cellColor = impact <= 2 ? 'bg-lime-400' : impact <= 3 ? 'bg-amber-400' : 'bg-orange-500';
                              const inherentImpact = inherentFactors.find(f => f.name === 'Impact')?.rating || 0;
                              const inherentLikelihood = inherentFactors.find(f => f.name === 'Likelihood')?.rating || 0;
                              const residualImpact = residualFactors.find(f => f.name === 'Impact')?.rating || 0;
                              const residualLikelihood = residualFactors.find(f => f.name === 'Likelihood')?.rating || 0;
                              const isInherent = inherentImpact === impact && inherentLikelihood === 3;
                              const isResidual = residualImpact === impact && residualLikelihood === 3;
                              return (
                                <div key={`3-${impact}`} className={`h-8 ${cellColor} rounded-sm flex items-center justify-center relative`}>
                                  {isInherent && <div className="w-4 h-4 rounded-full bg-slate-800 border-2 border-white shadow-md z-10" />}
                                  {isResidual && <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md z-10" />}
                                </div>
                              );
                            })}
                            {/* Row 2 (Likelihood = 2 - Unlikely) */}
                            {[1,2,3,4,5].map(impact => {
                              const cellColor = impact <= 3 ? 'bg-emerald-400' : impact <= 4 ? 'bg-lime-400' : 'bg-amber-400';
                              const inherentImpact = inherentFactors.find(f => f.name === 'Impact')?.rating || 0;
                              const inherentLikelihood = inherentFactors.find(f => f.name === 'Likelihood')?.rating || 0;
                              const residualImpact = residualFactors.find(f => f.name === 'Impact')?.rating || 0;
                              const residualLikelihood = residualFactors.find(f => f.name === 'Likelihood')?.rating || 0;
                              const isInherent = inherentImpact === impact && inherentLikelihood === 2;
                              const isResidual = residualImpact === impact && residualLikelihood === 2;
                              return (
                                <div key={`2-${impact}`} className={`h-8 ${cellColor} rounded-sm flex items-center justify-center relative`}>
                                  {isInherent && <div className="w-4 h-4 rounded-full bg-slate-800 border-2 border-white shadow-md z-10" />}
                                  {isResidual && <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md z-10" />}
                                </div>
                              );
                            })}
                            {/* Row 1 (Likelihood = 1 - Rare) */}
                            {[1,2,3,4,5].map(impact => {
                              const cellColor = impact <= 4 ? 'bg-emerald-400' : 'bg-lime-400';
                              const inherentImpact = inherentFactors.find(f => f.name === 'Impact')?.rating || 0;
                              const inherentLikelihood = inherentFactors.find(f => f.name === 'Likelihood')?.rating || 0;
                              const residualImpact = residualFactors.find(f => f.name === 'Impact')?.rating || 0;
                              const residualLikelihood = residualFactors.find(f => f.name === 'Likelihood')?.rating || 0;
                              const isInherent = inherentImpact === impact && inherentLikelihood === 1;
                              const isResidual = residualImpact === impact && residualLikelihood === 1;
                              return (
                                <div key={`1-${impact}`} className={`h-8 ${cellColor} rounded-sm flex items-center justify-center relative`}>
                                  {isInherent && <div className="w-4 h-4 rounded-full bg-slate-800 border-2 border-white shadow-md z-10" />}
                                  {isResidual && <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md z-10" />}
                                </div>
                              );
                            })}
                          </div>
                          {/* Risk Appetite Threshold Line (Orange Dotted) */}
                          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                            <line 
                              x1="0%" y1="40%" 
                              x2="20%" y2="40%" 
                              stroke="#f97316" 
                              strokeWidth="2" 
                              strokeDasharray="4 2"
                            />
                            <line 
                              x1="20%" y1="40%" 
                              x2="20%" y2="60%" 
                              stroke="#f97316" 
                              strokeWidth="2" 
                              strokeDasharray="4 2"
                            />
                            <line 
                              x1="20%" y1="60%" 
                              x2="40%" y2="60%" 
                              stroke="#f97316" 
                              strokeWidth="2" 
                              strokeDasharray="4 2"
                            />
                            <line 
                              x1="40%" y1="60%" 
                              x2="40%" y2="80%" 
                              stroke="#f97316" 
                              strokeWidth="2" 
                              strokeDasharray="4 2"
                            />
                            <line 
                              x1="40%" y1="80%" 
                              x2="60%" y2="80%" 
                              stroke="#f97316" 
                              strokeWidth="2" 
                              strokeDasharray="4 2"
                            />
                            <line 
                              x1="60%" y1="80%" 
                              x2="60%" y2="100%" 
                              stroke="#f97316" 
                              strokeWidth="2" 
                              strokeDasharray="4 2"
                            />
                            <line 
                              x1="60%" y1="100%" 
                              x2="100%" y2="100%" 
                              stroke="#f97316" 
                              strokeWidth="2" 
                              strokeDasharray="4 2"
                            />
                          </svg>
                          
                          {/* X-Axis Values */}
                          <div className="grid grid-cols-5 gap-0.5 mt-1">
                            <span className="text-[9px] text-muted-foreground text-center">1<br/>Very Low</span>
                            <span className="text-[9px] text-muted-foreground text-center">2<br/>Low</span>
                            <span className="text-[9px] text-muted-foreground text-center">3<br/>Medium</span>
                            <span className="text-[9px] text-muted-foreground text-center">4<br/>High</span>
                            <span className="text-[9px] text-muted-foreground text-center">5<br/>Extreme</span>
                          </div>
                          
                          {/* X-Axis Label */}
                          <div className="text-center mt-1">
                            <span className="text-[10px] font-medium text-muted-foreground">Impact</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Compact Legend */}
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t text-[10px]">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-slate-800 border border-white" />
                      <span className="text-muted-foreground">Inherent</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-blue-500 border border-white" />
                      <span className="text-muted-foreground">Residual</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-3">
                        <line x1="0" y1="6" x2="16" y2="6" stroke="#f97316" strokeWidth="2" strokeDasharray="4 2" />
                      </svg>
                      <span className="text-muted-foreground">Risk Appetite</span>
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                      <div className="w-3 h-3 rounded-sm bg-emerald-400" />
                      <span>Low</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-amber-400" />
                      <span>Medium</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-orange-500" />
                      <span>High</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-red-500" />
                      <span>Critical</span>
                    </div>
                  </div>
                </Card>

                {/* Risk Appetite Card */}
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Risk Appetite</h3>
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Risk Appetite</span>
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-muted-foreground">Threshold:</div>
                        <div className="font-mono font-bold">2.0</div>
                      </div>
                    </div>
                    
                    <Badge className="bg-emerald-500 text-white hover:bg-emerald-500 mb-3">Low</Badge>
                    
                    <p className="text-sm text-muted-foreground mb-4">
                      The organization has a low appetite for compliance risks. Residual risk rating above 2.0 is considered outside appetite.
                    </p>
                    
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Current:</span>
                        <span className="font-mono font-bold ml-2">{residualScore}</span>
                      </div>
                      <Badge 
                        className={residualScore <= 2 
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" 
                          : "bg-red-100 text-red-700 hover:bg-red-100"
                        }
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {residualScore <= 2 ? "Within Appetite" : "Outside Appetite"}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Heat Map Interpretation */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-3">Heat Map Interpretation</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  The Risk Heat Map visualizes the relationship between inherent risk (x-axis) and residual risk (y-axis). The movement from inherent to residual risk shows the effect of controls on reducing the overall risk.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border bg-muted/20">
                    <h4 className="font-medium mb-3">Reading the Heat Map</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 shrink-0" />
                        The blue circle shows your current risk assessment position
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 shrink-0" />
                        The dotted orange lines show your risk appetite threshold
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 shrink-0" />
                        The colored zones represent different risk levels (Very Low to High)
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 shrink-0" />
                        The gray circle (if present) shows your previous assessment
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-4 rounded-lg border bg-muted/20">
                    <h4 className="font-medium mb-3">Interpretation</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 shrink-0" />
                        Risks in the red zone (top-right) require immediate attention
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 shrink-0" />
                        Risks above the appetite threshold may need additional controls
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 shrink-0" />
                        Effective controls move risks from top-right to bottom-left
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5 shrink-0" />
                        The larger the vertical drop, the more effective your controls
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>

            </TabsContent>

            {/* Issues Tab */}
            <TabsContent value="issues">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Related Issues</h2>
                  <Badge className="bg-red-100 text-red-700">{assessmentIssues.length + activeRelatedIssues.length} Open</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Issues and findings related to this risk assessment.
                </p>

                {/* Issues from This Assessment */}
                <div className="border rounded-lg overflow-hidden mb-4">
                  <button 
                    className="w-full flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                    onClick={() => toggleIssueSection('assessment')}
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${expandedIssueSections.has('assessment') ? 'rotate-0' : '-rotate-90'}`} />
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-sm text-blue-800 dark:text-blue-200">New issues identified</span>
                    </div>
                    <Badge className="bg-blue-600 text-white">{assessmentIssues.length}</Badge>
                  </button>
                  {expandedIssueSections.has('assessment') && (
                    <div className="p-3 space-y-2 bg-background animate-fade-in">
                      {assessmentIssues.map((issue) => (
                        <div key={issue.id} className="p-3 border-l-4 border-l-blue-500 border rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-sm text-blue-600">{issue.id}</span>
                            <Badge className={
                              issue.severity === "High" ? "bg-red-100 text-red-700" : 
                              issue.severity === "Medium" ? "bg-amber-100 text-amber-700" : 
                              "bg-slate-100 text-slate-700"
                            }>{issue.severity}</Badge>
                          </div>
                          <p className="text-sm font-medium">{issue.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{issue.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">{issue.status}</Badge>
                            <span className="text-xs text-muted-foreground">• {issue.owner}</span>
                            <span className="text-xs text-muted-foreground">• {issue.dateIdentified}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Other Active Issues Related to the Risk */}
                <div className="border rounded-lg overflow-hidden mb-4">
                  <button 
                    className="w-full flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
                    onClick={() => toggleIssueSection('active')}
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown className={`w-4 h-4 text-amber-600 transition-transform duration-200 ${expandedIssueSections.has('active') ? 'rotate-0' : '-rotate-90'}`} />
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="font-medium text-sm text-amber-800 dark:text-amber-200">Other Active Issues related to the Risk</span>
                    </div>
                    <Badge className="bg-amber-600 text-white">{activeRelatedIssues.length}</Badge>
                  </button>
                  {expandedIssueSections.has('active') && (
                    <div className="p-3 space-y-2 bg-background animate-fade-in">
                      {activeRelatedIssues.map((issue) => (
                        <div key={issue.id} className="p-3 border-l-4 border-l-amber-500 border rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-sm text-blue-600">{issue.id}</span>
                            <Badge className={
                              issue.severity === "High" ? "bg-red-100 text-red-700" : 
                              issue.severity === "Medium" ? "bg-amber-100 text-amber-700" : 
                              "bg-slate-100 text-slate-700"
                            }>{issue.severity}</Badge>
                          </div>
                          <p className="text-sm font-medium">{issue.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{issue.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">{issue.status}</Badge>
                            <span className="text-xs text-muted-foreground">• {issue.owner}</span>
                            <span className="text-xs text-muted-foreground">• {issue.dateIdentified}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Closed Issues Related to the Risk */}
                <div className="border rounded-lg overflow-hidden">
                  <button 
                    className="w-full flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => toggleIssueSection('closed')}
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${expandedIssueSections.has('closed') ? 'rotate-0' : '-rotate-90'}`} />
                      <XCircle className="w-4 h-4 text-slate-500" />
                      <span className="font-medium text-sm text-slate-700 dark:text-slate-300">Closed Issues related to the Risk</span>
                    </div>
                    <Badge variant="secondary" className="bg-slate-300 text-slate-700 dark:bg-slate-600 dark:text-slate-200">{closedRelatedIssues.length}</Badge>
                  </button>
                  {expandedIssueSections.has('closed') && (
                    <div className="p-3 space-y-2 bg-background animate-fade-in">
                      {closedRelatedIssues.map((issue) => (
                        <div key={issue.id} className="p-3 border-l-4 border-l-slate-400 border rounded-lg bg-muted/20 opacity-80">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-sm text-slate-500">{issue.id}</span>
                            <Badge variant="outline" className="text-xs text-slate-500 border-slate-300">{issue.severity}</Badge>
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">{issue.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{issue.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                              <Check className="w-3 h-3 mr-1" />
                              Closed
                            </Badge>
                            <span className="text-xs text-muted-foreground">• {issue.closedDate}</span>
                            <span className="text-xs text-muted-foreground">• {issue.owner}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>

        </div>
      </div>

      {/* Right Vertical Tab Bar - Fixed on right edge with Collapsible Sections */}
      <div className="fixed top-0 right-0 h-full w-auto bg-muted/30 border-l-2 border-l-primary/20 shadow-[-4px_0_12px_-2px_rgba(0,0,0,0.1)] z-[60] flex flex-col pt-14">
        {[
          { id: 'review', label: 'Review/Challenge', icon: MessageSquare, number: 5 },
          { id: 'treatment', label: 'Treatment', icon: Clipboard, number: 6 },
          { id: 'metrics', label: 'Metrics & Losses', icon: BarChart3, number: 7 },
          { id: 'details', label: 'Additional Details', icon: FileText, number: 8 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isExpanded = expandedRightPanelSections[tab.id as keyof typeof expandedRightPanelSections];
          const hasReviewNotifications = tab.id === 'review' && pendingReviewComments > 0;
          
          return (
            <Collapsible 
              key={tab.id}
              open={isExpanded}
              onOpenChange={(open) => setExpandedRightPanelSections(prev => ({ ...prev, [tab.id]: open }))}
            >
              <CollapsibleTrigger asChild>
                <button
                  className={`relative flex items-center gap-0 py-4 px-3 border-b border-border transition-colors w-full ${
                    isExpanded
                      ? 'bg-muted/50 text-primary' 
                      : hasReviewNotifications
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-l-2 border-l-blue-500 hover:bg-blue-100 dark:hover:bg-blue-950/50 text-blue-600'
                        : 'hover:bg-muted/30 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {/* Section Number Badge */}
                  <Badge variant="outline" className="absolute -top-1 -left-0.5 w-4 h-4 p-0 text-[8px] flex items-center justify-center bg-background">
                    {tab.number}
                  </Badge>
                  
                  {/* Notification Badge for Review/Challenge */}
                  {hasReviewNotifications && (
                    <span className="absolute -top-0.5 right-1 w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg">
                      {pendingReviewComments}
                    </span>
                  )}
                  
                  {/* Icon box */}
                  <div className={`p-2.5 rounded-lg transition-colors ${
                    isExpanded 
                      ? 'bg-primary/10' 
                      : hasReviewNotifications
                        ? 'bg-blue-100 dark:bg-blue-900/50'
                        : 'bg-muted/80'
                  }`}>
                    <Icon className={`w-5 h-5 ${hasReviewNotifications && !isExpanded ? 'text-blue-600' : ''}`} />
                  </div>
                  
                  {/* Vertical text with chevron */}
                  <span className={`text-xs font-medium [writing-mode:vertical-rl] rotate-180 ml-1 ${hasReviewNotifications && !isExpanded ? 'text-blue-600 font-semibold' : ''}`}>
                    {tab.label}
                  </span>
                  
                  {/* Expand/Collapse Chevron */}
                  {isExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                </button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="animate-accordion-down">
                <div className="p-2 bg-background border-b border-border text-[10px] max-w-[180px]">
                  {tab.id === 'review' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Badge className="text-[8px] px-1 bg-blue-500">{pendingReviewComments} pending</Badge>
                      </div>
                      <p className="text-muted-foreground truncate text-[9px]">Michael Chen tagged you...</p>
                    </div>
                  )}
                  {tab.id === 'treatment' && (
                    <div className="space-y-1">
                      <p className="font-medium text-[9px]">3 Action Items</p>
                      <p className="text-muted-foreground truncate text-[9px]">TRT-001: 65% complete</p>
                    </div>
                  )}
                  {tab.id === 'metrics' && (
                    <div className="space-y-1">
                      <p className="font-medium text-[9px]">4 KRIs</p>
                      <p className="text-muted-foreground truncate text-[9px]">2 below threshold</p>
                    </div>
                  )}
                  {tab.id === 'details' && (
                    <div className="space-y-1">
                      <p className="font-medium text-[9px]">Attachments</p>
                      <p className="text-muted-foreground truncate text-[9px]">3 files attached</p>
                    </div>
                  )}
                  
                  {/* Button to open full panel */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-1.5 h-6 text-[9px] gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRightPanelOpen(true);
                      setRightPanelTab(tab.id as any);
                      setSelectedHistoryDate(0);
                    }}
                  >
                    <Maximize2 className="w-2.5 h-2.5" />
                    Expand Full View
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* Expanded Panel Dialog for Previous Assessments */}
      <Dialog open={expandedPanel === 'assessments'} onOpenChange={(open) => !open && setExpandedPanel(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 gap-0">
          {/* Colored Header Bar */}
          <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-white text-lg">{getHistoryTitle()}</DialogTitle>
                  <p className="text-slate-200 text-sm">Full screen view • Historical assessment data</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-white/20" 
                onClick={() => setExpandedPanel(null)}
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
            <div className="space-y-4">
            {/* Date Selection Badges */}
            <div className="flex flex-wrap gap-2">
              {getHistoryData().map((item, idx) => (
                <Badge
                  key={item.date}
                  variant={selectedHistoryDate === idx ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    selectedHistoryDate === idx 
                      ? "bg-slate-900 text-white hover:bg-slate-800" 
                      : "bg-background hover:bg-muted"
                  }`}
                  onClick={() => setSelectedHistoryDate(idx)}
                >
                  {item.date}
                </Badge>
              ))}
            </div>
            {/* Score */}
            <div className="flex items-center justify-between">
              <Badge 
                variant="outline" 
                className={`text-sm px-3 py-1 ${getHistoryRatingBadge(getHistoryData()[selectedHistoryDate]?.score || 0).color}`}
              >
                Score: {getHistoryData()[selectedHistoryDate]?.score} ({getHistoryRatingBadge(getHistoryData()[selectedHistoryDate]?.score || 0).label})
              </Badge>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <Copy className="w-3.5 h-3.5" />
                Copy to current
              </Button>
            </div>
            {/* Data Table - Expanded */}
            <div className="border rounded-lg overflow-hidden">
              {activeTab === "control-effectiveness" ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Control</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground w-28">Design</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground w-28">Operating</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground w-28">Overall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(getHistoryData()[selectedHistoryDate] as any)?.controls?.map((control: any, idx: number) => (
                      <tr key={idx} className="border-b last:border-b-0">
                        <td className="px-4 py-3 text-foreground">{control.name}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className={getHistoryRatingBadge(control.design).color}>{control.design}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className={getHistoryRatingBadge(control.operating).color}>{control.operating}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className={getHistoryRatingBadge(control.overall).color}>{control.overall}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Factor</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">Rating</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Weight (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(getHistoryData()[selectedHistoryDate] as any)?.factors?.map((factor: any, idx: number) => (
                      <tr key={idx} className="border-b last:border-b-0">
                        <td className="px-4 py-3 text-foreground">{factor.name}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className={`${getHistoryRatingBadge(factor.rating).color}`}>
                            {getHistoryRatingBadge(factor.rating).label} ({factor.rating})
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{factor.weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Panel Dialog for Metrics & Losses */}
      <Dialog open={expandedPanel === 'metrics'} onOpenChange={(open) => !open && setExpandedPanel(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0 gap-0">
          {/* Colored Header Bar */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 dark:from-amber-700 dark:to-amber-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-white text-lg">Metrics and Losses</DialogTitle>
                  <p className="text-white/80 text-sm">Full screen view • Risk metrics and loss data</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-white/20" 
                onClick={() => setExpandedPanel(null)}
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Risk metrics and associated loss data help quantify the current risk exposure.
              </p>
              
              {/* AI-Generated Insights for Metrics & Losses */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                      AI-Generated Insights
                      <Badge variant="outline" className="text-xs border-purple-300 text-purple-600 dark:border-purple-700 dark:text-purple-400">
                        Auto-analyzed
                      </Badge>
                    </h4>
                    <div className="mt-3 space-y-2 text-sm text-purple-800 dark:text-purple-200">
                      <p>• <strong>Critical Pattern:</strong> 3 KRIs related to document verification are consistently breaching thresholds, suggesting a systemic issue in the verification workflow.</p>
                      <p>• <strong>Trend Alert:</strong> False Positive Rate has increased by 4.3 percentage points over the last quarter - consider recalibrating AML screening parameters.</p>
                      <p>• <strong>Loss Correlation:</strong> 60% of loss events are linked to regulatory fines. Strengthening compliance controls could reduce exposure by an estimated $300K annually.</p>
                      <p>• <strong>Priority Action:</strong> KYC Completion Rate (94.5%) is closest to threshold recovery - targeted intervention here could move this metric to compliant status within 30 days.</p>
                      <p>• <strong>Root Cause:</strong> Customer Data Update Rate breach likely stems from delayed batch processing in legacy systems. Consider API-based real-time updates.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Detailed Outlier Metrics Table */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <h4 className="font-semibold text-lg">Key Risk Indicators (KRIs) - Threshold Breaches</h4>
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {metricsData.kris.length} metrics outside threshold
                  </Badge>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-3 text-left font-medium">Metric ID</th>
                        <th className="p-3 text-left font-medium">Metric Name</th>
                        <th className="p-3 text-center font-medium">Current</th>
                        <th className="p-3 text-center font-medium">Threshold</th>
                        <th className="p-3 text-center font-medium">Breach Type</th>
                        <th className="p-3 text-center font-medium">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricsData.kris.map((metric) => (
                        <tr key={metric.id} className="border-t hover:bg-muted/30">
                          <td className="p-3 font-mono text-xs text-blue-600">{metric.id}</td>
                          <td className="p-3">
                            <div className="font-medium">{metric.name}</div>
                            <div className="text-xs text-muted-foreground">{metric.description}</div>
                          </td>
                          <td className="p-3 text-center font-semibold">
                            {metric.current}{metric.unit === "%" ? "%" : ` ${metric.unit}`}
                          </td>
                          <td className="p-3 text-center text-muted-foreground">{metric.threshold}</td>
                          <td className="p-3 text-center">
                            <Badge className={
                              metric.breachType === "Above Threshold" 
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            }>
                              {metric.breachType}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            {metric.trend === "up" && <TrendingUp className="w-4 h-4 text-green-500 mx-auto" />}
                            {metric.trend === "down" && <TrendingDown className="w-4 h-4 text-red-500 mx-auto" />}
                            {metric.trend === "stable" && <span className="text-muted-foreground">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-md p-3 text-sm text-amber-700 dark:text-amber-300">
                  <strong>Summary:</strong> {metricsData.kris.filter(m => m.breachType === "Above Threshold").length} metrics above threshold, {metricsData.kris.filter(m => m.breachType === "Below Threshold").length} metrics below threshold. Overall breach rate: {Math.round((metricsData.kris.length / 12) * 100)}% of monitored KRIs.
                </div>
              </div>

              {/* Detailed Loss Events Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-red-500" />
                    <h4 className="font-semibold text-lg">Loss Events</h4>
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      {metricsData.losses.length} events
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    Total: ${metricsData.losses.reduce((sum, l) => sum + l.amount, 0).toLocaleString()}
                  </div>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-3 text-left font-medium">Event ID</th>
                        <th className="p-3 text-left font-medium">Event Name</th>
                        <th className="p-3 text-center font-medium">Category</th>
                        <th className="p-3 text-center font-medium">Date</th>
                        <th className="p-3 text-center font-medium">Status</th>
                        <th className="p-3 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricsData.losses.map((loss) => (
                        <tr key={loss.id} className="border-t hover:bg-muted/30">
                          <td className="p-3 font-mono text-xs text-red-600">{loss.id}</td>
                          <td className="p-3">
                            <div className="font-medium">{loss.name}</div>
                            <div className="text-xs text-muted-foreground">{loss.description}</div>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="outline" className={
                              loss.category === "Regulatory" ? "border-purple-300 text-purple-700 dark:text-purple-400" :
                              loss.category === "Fraud" ? "border-red-300 text-red-700 dark:text-red-400" :
                              loss.category === "Operational" ? "border-blue-300 text-blue-700 dark:text-blue-400" :
                              "border-amber-300 text-amber-700 dark:text-amber-400"
                            }>
                              {loss.category}
                            </Badge>
                          </td>
                          <td className="p-3 text-center text-muted-foreground">{loss.date}</td>
                          <td className="p-3 text-center">
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              {loss.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right font-bold text-red-600 dark:text-red-400">
                            ${loss.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/30">
                      <tr className="border-t-2">
                        <td colSpan={5} className="p-3 text-right font-semibold">Total Losses:</td>
                        <td className="p-3 text-right font-bold text-lg text-red-600 dark:text-red-400">
                          ${metricsData.losses.reduce((sum, l) => sum + l.amount, 0).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 rounded-md p-3 text-sm text-red-700 dark:text-red-300">
                  <strong>Trend Analysis:</strong> Losses have increased by 18% compared to the previous assessment period. Regulatory fines account for 45% of total losses.
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Panel Dialog for Inherent Rating */}
      <Dialog open={expandedPanel === 'inherent-rating'} onOpenChange={(open) => !open && setExpandedPanel(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0 gap-0">
          {/* Colored Header Bar */}
          <div className="bg-gradient-to-r from-rose-600 to-rose-700 dark:from-rose-700 dark:to-rose-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-white text-lg">Inherent Risk Rating</DialogTitle>
                  <p className="text-white/80 text-sm">Full screen view • Calculated based on weighted impact factors</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1.5 rounded-lg ${getRatingLabel(inherentScore).color} text-white border border-white/30`}>
                  <div className="text-xs opacity-90">Score: {inherentScore}</div>
                  <div className="font-semibold text-sm">{getRatingLabel(inherentScore).label}</div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-white/20" 
                  onClick={() => setExpandedPanel(null)}
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
            <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Calculated based on weighted impact factors</p>
              <div className={`px-3 py-1.5 rounded-lg ${getRatingLabel(inherentScore).color} text-white`}>
                <div className="text-xs opacity-90">Score: {inherentScore}</div>
                <div className="font-semibold text-sm">{getRatingLabel(inherentScore).label}</div>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">Factor & Description</th>
                    <th className="p-3 text-left text-sm font-medium w-40">Rating</th>
                    <th className="p-3 text-left text-sm font-medium">Comments</th>
                    <th className="p-3 text-left text-sm font-medium w-28">Weightage (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {inherentFactors.map((factor) => (
                    <tr key={factor.id} className="border-t">
                      <td className="p-3">
                        <div className="font-medium">{factor.name}</div>
                        <div className="text-sm text-muted-foreground">{factor.description}</div>
                      </td>
                      <td className="p-3">
                        <Badge className={`${getRatingLabel(factor.rating).color} text-white`}>
                          {factor.rating} - {getRatingLabel(factor.rating).label}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">{factor.comments}</td>
                      <td className="p-3 text-center font-medium">{factor.weightage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Panel Dialog for Control Effectiveness */}
      <Dialog open={expandedPanel === 'control-effectiveness'} onOpenChange={(open) => !open && setExpandedPanel(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0 gap-0">
          {/* Colored Header Bar */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-white text-lg">Control Effectiveness Assessment</DialogTitle>
                  <p className="text-blue-100 text-sm">Full screen view • Design, operating effectiveness, and testing results</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1.5 rounded-lg ${getRatingLabel(controlScore).color} text-white border border-white/30`}>
                  <div className="text-xs opacity-90">Score: {controlScore}</div>
                  <div className="font-semibold text-sm">{getRatingLabel(controlScore).label}</div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-white/20" 
                  onClick={() => setExpandedPanel(null)}
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
            <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Evaluate design, operating effectiveness, and testing results</p>
              <div className={`px-3 py-1.5 rounded-lg ${getRatingLabel(controlScore).color} text-white`}>
                <div className="text-xs opacity-90">Score: {controlScore}</div>
                <div className="font-semibold text-sm">{getRatingLabel(controlScore).label}</div>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">Control ID</th>
                    <th className="p-3 text-left text-sm font-medium">Control Name</th>
                    <th className="p-3 text-left text-sm font-medium">Type</th>
                    <th className="p-3 text-left text-sm font-medium">Owner</th>
                    <th className="p-3 text-center text-sm font-medium">Design</th>
                    <th className="p-3 text-center text-sm font-medium">Operating</th>
                    <th className="p-3 text-center text-sm font-medium">Testing</th>
                    <th className="p-3 text-center text-sm font-medium">Average Control Score</th>
                  </tr>
                </thead>
                <tbody>
                  {controls.map((control) => {
                    const avg = ((control.designRating + control.operatingRating + control.testingRating) / 3).toFixed(1);
                    return (
                      <tr key={control.id} className="border-t">
                        <td className="p-3 font-mono text-sm text-blue-600">{control.id}</td>
                        <td className="p-3">
                          <div className="font-medium">{control.name}</div>
                          <div className="text-sm text-muted-foreground">{control.description}</div>
                        </td>
                        <td className="p-3"><Badge variant="outline">{control.type}</Badge></td>
                        <td className="p-3 text-sm">{control.owner}</td>
                        <td className="p-3 text-center">
                          <Badge className={`${getRatingLabel(control.designRating).color} text-white`}>{control.designRating}</Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Badge className={`${getRatingLabel(control.operatingRating).color} text-white`}>{control.operatingRating}</Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Badge className={`${getRatingLabel(control.testingRating).color} text-white`}>{control.testingRating}</Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Badge className={`${getRatingLabel(parseFloat(avg)).color} text-white`}>{avg}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Panel Dialog for Residual Rating */}
      <Dialog open={expandedPanel === 'residual-rating'} onOpenChange={(open) => !open && setExpandedPanel(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0 gap-0">
          {/* Colored Header Bar */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-white text-lg">Residual Risk Rating</DialogTitle>
                  <p className="text-emerald-100 text-sm">Full screen view • Risk rating after applying controls</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1.5 rounded-lg ${getRatingLabel(residualScore).color} text-white border border-white/30`}>
                  <div className="text-xs opacity-90">Score: {residualScore}</div>
                  <div className="font-semibold text-sm">{getRatingLabel(residualScore).label}</div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-white/20" 
                  onClick={() => setExpandedPanel(null)}
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
            <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Risk rating after applying controls</p>
              <div className={`px-3 py-1.5 rounded-lg ${getRatingLabel(residualScore).color} text-white`}>
                <div className="text-xs opacity-90">Score: {residualScore}</div>
                <div className="font-semibold text-sm">{getRatingLabel(residualScore).label}</div>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">Factor & Description</th>
                    <th className="p-3 text-left text-sm font-medium w-40">Rating</th>
                    <th className="p-3 text-left text-sm font-medium">Comments</th>
                    <th className="p-3 text-left text-sm font-medium w-28">Weightage (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {residualFactors.map((factor) => (
                    <tr key={factor.id} className="border-t">
                      <td className="p-3">
                        <div className="font-medium">{factor.name}</div>
                        <div className="text-sm text-muted-foreground">{factor.description}</div>
                      </td>
                      <td className="p-3">
                        <Badge className={`${getRatingLabel(factor.rating).color} text-white`}>
                          {factor.rating} - {getRatingLabel(factor.rating).label}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">{factor.comments}</td>
                      <td className="p-3 text-center font-medium">{factor.weightage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Panel Dialog for Heat Map */}
      <Dialog open={expandedPanel === 'heat-map'} onOpenChange={(open) => !open && setExpandedPanel(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 gap-0">
          {/* Colored Header Bar */}
          <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-white text-lg">Risk Heat Map</DialogTitle>
                  <p className="text-violet-100 text-sm">Full screen view • Visual risk positioning</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-slate-700 text-white hover:bg-slate-700 border border-white/30">Inherent: {inherentScore}</Badge>
                  <ArrowRight className="w-4 h-4 text-white/70" />
                  <Badge className="bg-emerald-500 text-white hover:bg-emerald-500 border border-white/30">Residual: {residualScore}</Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-white/20" 
                  onClick={() => setExpandedPanel(null)}
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
            <div className="space-y-4">
            <div className="relative bg-gradient-to-tr from-emerald-50 via-yellow-50/50 via-60% to-red-100 dark:from-emerald-950/30 dark:via-yellow-950/20 dark:to-red-950/30 rounded-lg p-6 border" style={{ height: '400px' }}>
              <div className="absolute left-0 top-0 bottom-10 w-10 flex flex-col justify-between items-end pr-3 text-sm text-muted-foreground">
                <span>5</span><span>4</span><span>3</span><span>2</span><span>1</span><span>0</span>
              </div>
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-medium text-muted-foreground whitespace-nowrap">Residual Risk</div>
              <div className="absolute left-12 right-6 top-6 bottom-10 border-l-2 border-b-2 border-slate-300 dark:border-slate-600">
                <div className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-500" style={{ bottom: `${(2/5) * 100}%` }} />
                <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-emerald-500" style={{ left: `${(2/5) * 100}%` }} />
                <div 
                  className="absolute w-8 h-8 rounded-full bg-blue-600 border-3 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                  style={{ left: `${(inherentScore/5) * 100}%`, bottom: `${(residualScore/5) * 100}%`, top: 'auto' }}
                >
                  <span className="text-white text-xs font-bold">R</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-12 right-6 flex justify-between text-sm text-muted-foreground">
                <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-sm font-medium text-muted-foreground">Inherent Risk</div>
            </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Panel Dialog for Treatment */}
      <Dialog open={expandedPanel === 'treatment'} onOpenChange={(open) => !open && setExpandedPanel(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 gap-0">
          {/* Colored Header Bar */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Clipboard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-white text-lg">Risk Treatment Plan</DialogTitle>
                  <p className="text-purple-100 text-sm">Full screen view • Treatment actions and methodology</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-white/20" 
                onClick={() => setExpandedPanel(null)}
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
            <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Define how the identified risk will be treated, who owns the treatment actions, and the methodology to be used.</p>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">Action ID</th>
                    <th className="p-3 text-left text-sm font-medium">Action</th>
                    <th className="p-3 text-left text-sm font-medium">Owner</th>
                    <th className="p-3 text-left text-sm font-medium">Due Date</th>
                    <th className="p-3 text-left text-sm font-medium">Status</th>
                    <th className="p-3 text-left text-sm font-medium">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {treatmentPlans.map((plan) => (
                    <tr key={plan.id} className="border-t">
                      <td className="p-3 font-mono text-sm text-blue-600">{plan.id}</td>
                      <td className="p-3">{plan.action}</td>
                      <td className="p-3 text-sm">{plan.owner}</td>
                      <td className="p-3 text-sm">{plan.dueDate}</td>
                      <td className="p-3">
                        <Badge variant="outline" className={
                          plan.status === "In Progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          plan.status === "Planned" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-slate-50 text-slate-700 border-slate-200"
                        }>{plan.status}</Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${plan.progress}%` }} />
                          </div>
                          <span className="text-sm text-muted-foreground">{plan.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Panel Dialog for Issues */}
      <Dialog open={expandedPanel === 'issues'} onOpenChange={(open) => !open && setExpandedPanel(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 gap-0">
          {/* Colored Header Bar */}
          <div className="bg-gradient-to-r from-rose-600 to-rose-700 dark:from-rose-700 dark:to-rose-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-white text-lg">Related Issues</DialogTitle>
                  <p className="text-white/80 text-sm">Full screen view • Issues and findings</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-white/20 text-white border border-white/30">
                  {assessmentIssues.length + activeRelatedIssues.length} Open
                </Badge>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-white/20" 
                  onClick={() => setExpandedPanel(null)}
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
            <div className="space-y-6">
              
              {/* AI-Generated Insights Section */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                      AI-Generated Insights
                      <Badge variant="outline" className="text-xs border-purple-300 text-purple-600 dark:text-purple-400">Auto-analyzed</Badge>
                    </h4>
                    <div className="mt-3 space-y-2 text-sm text-purple-800 dark:text-purple-200">
                      <p>• <strong>Pattern detected:</strong> 60% of open issues relate to documentation and audit trail gaps - suggesting systemic process weakness</p>
                      <p>• <strong>Root cause analysis:</strong> Legacy system migration created verification gaps; incomplete data transfer protocols affected 2,500+ records</p>
                      <p>• <strong>Recommended priority:</strong> ISS-2024-015 should be addressed first as it impacts 3 downstream controls and has cascading effects on compliance metrics</p>
                      <p>• <strong>Trend alert:</strong> High severity issues increased by 25% compared to last quarter - escalation to Risk Committee recommended</p>
                      <p>• <strong>Resource insight:</strong> IT Department owns 40% of open issues - consider capacity planning review</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Issues from Assessment - Enhanced */}
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  New issues identified
                  <Badge className="bg-blue-600 text-white">{assessmentIssues.length}</Badge>
                </h3>
                <div className="space-y-3">
                  {assessmentIssues.map((issue: any) => (
                    <div key={issue.id} className="p-4 border-l-4 border-l-blue-500 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm text-blue-600">{issue.id}</span>
                        <Badge className={issue.severity === "High" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}>{issue.severity}</Badge>
                      </div>
                      <p className="font-medium">{issue.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                      
                      {/* Detailed Description */}
                      {issue.detailedDescription && (
                        <div className="mt-3 p-3 bg-background/50 rounded-md text-sm">
                          <p className="text-muted-foreground">{issue.detailedDescription}</p>
                        </div>
                      )}
                      
                      {/* Owner Details */}
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {issue.owner}
                        </span>
                        {issue.ownerEmail && (
                          <span className="flex items-center gap-1">
                            <AtSign className="w-3 h-3" />
                            {issue.ownerEmail}
                          </span>
                        )}
                        {issue.ownerDepartment && (
                          <Badge variant="outline" className="text-xs">{issue.ownerDepartment}</Badge>
                        )}
                      </div>
                      
                      {/* Action Plan */}
                      {issue.actionPlan && (
                        <div className="mt-4 p-3 border rounded-md bg-background/30">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-medium flex items-center gap-1">
                              <ClipboardCheck className="w-4 h-4 text-blue-500" />
                              Action Plan
                            </h5>
                            <span className="text-xs text-muted-foreground">Target: {issue.actionPlan.targetDate}</span>
                          </div>
                          <ul className="text-sm space-y-1 mb-3">
                            {issue.actionPlan.steps.map((step: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-muted-foreground">{idx + 1}.</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${issue.actionPlan.progress}%` }} />
                            </div>
                            <span className="text-xs font-medium">{issue.actionPlan.progress}%</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Attachments */}
                      {issue.attachments && issue.attachments.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <Paperclip className="w-3 h-3" />
                            Attachments ({issue.attachments.length})
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {issue.attachments.map((att: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded text-xs">
                                <FileText className="w-3 h-3 text-blue-500" />
                                <span>{att.name}</span>
                                <span className="text-muted-foreground">({att.size})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Active Related Issues - Enhanced */}
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Other Active Issues related to the Risk
                  <Badge className="bg-amber-600 text-white">{activeRelatedIssues.length}</Badge>
                </h3>
                <div className="space-y-3">
                  {activeRelatedIssues.map((issue: any) => (
                    <div key={issue.id} className="p-4 border-l-4 border-l-amber-500 border rounded-lg bg-amber-50/50 dark:bg-amber-950/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm text-blue-600">{issue.id}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{issue.status}</Badge>
                          <Badge className={issue.severity === "High" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}>{issue.severity}</Badge>
                        </div>
                      </div>
                      <p className="font-medium">{issue.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                      
                      {/* Owner and Action Plan Progress */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {issue.owner}
                          </span>
                          {issue.ownerDepartment && (
                            <Badge variant="outline" className="text-xs">{issue.ownerDepartment}</Badge>
                          )}
                        </div>
                        {issue.actionPlan && (
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${issue.actionPlan.progress}%` }} />
                            </div>
                            <span className="text-xs font-medium">{issue.actionPlan.progress}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Closed Issues */}
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-slate-500" />
                  Closed Issues related to the Risk
                  <Badge variant="secondary">{closedRelatedIssues.length}</Badge>
                </h3>
                <div className="space-y-2">
                  {closedRelatedIssues.map((issue: any) => (
                    <div key={issue.id} className="p-4 border-l-4 border-l-slate-400 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 opacity-80">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm text-slate-500">{issue.id}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Closed: {issue.closedDate}</span>
                          <Badge variant="outline" className="text-slate-500">{issue.severity}</Badge>
                        </div>
                      </div>
                      <p className="font-medium text-muted-foreground">{issue.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Panel Dialog for Review/Challenge */}
      <Dialog open={expandedPanel === 'review'} onOpenChange={(open) => !open && setExpandedPanel(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 gap-0">
          {/* Colored Header Bar */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-white text-lg">Review/Challenge</DialogTitle>
                  <p className="text-indigo-100 text-sm">Full screen view • Discussion and activity</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-white/20" 
                onClick={() => setExpandedPanel(null)}
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
            <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Chat Messages */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Discussion Thread</h4>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={`p-3 rounded-lg ${msg.type === 'system' ? 'bg-muted/50 text-center' : 'bg-muted/30'}`}>
                        {msg.type !== 'system' && (
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">{msg.avatar}</div>
                            <span className="font-medium text-sm">{msg.user}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{msg.timestamp}</span>
                          </div>
                        )}
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              {/* Activity Log */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Activity Log</h4>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {activityLog.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 text-sm">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">{activity.avatar}</div>
                        <div className="flex-1">
                          <p><span className="font-medium">{activity.user}</span> {activity.action}</p>
                          <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Panel Dialog for Additional Details */}
      <Dialog open={expandedPanel === 'details'} onOpenChange={(open) => !open && setExpandedPanel(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 gap-0">
          {/* Colored Header Bar */}
          <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-white text-lg">Additional Details</DialogTitle>
                  <p className="text-slate-200 text-sm">Full screen view • Comments and attachments</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-white/20" 
                onClick={() => setExpandedPanel(null)}
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
            <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Comments</label>
              <Textarea 
                placeholder="Add any additional comments or notes related to this risk assessment..."
                className="min-h-[150px] resize-none"
              />
            </div>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Attachments</h4>
              <div className="border-2 border-dashed rounded-lg p-10 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">Drop files here or click to upload</p>
                <p className="text-sm text-muted-foreground">Upload any relevant documents</p>
              </div>
            </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Right Sliding Panel */}
      {rightPanelOpen && (
        <div className="fixed top-0 right-[52px] h-full w-[480px] bg-background border-l border-border z-[55] shadow-xl overflow-hidden">
        <div className="flex flex-col h-full w-full overflow-hidden">
          {/* Panel Header */}
          <div className="p-3 border-b flex items-center justify-between bg-muted/30">
            <h3 className="font-semibold text-sm truncate flex-1 mr-2">
              {rightPanelTab === 'review' && 'Review/Challenge'}
              {rightPanelTab === 'treatment' && 'Risk Treatment Plan'}
              {rightPanelTab === 'metrics' && 'Metrics & Losses'}
              {rightPanelTab === 'details' && 'Additional Details'}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => {
                  setExpandedPanel(rightPanelTab);
                  setRightPanelOpen(false);
                }}
                title="Expand to full view"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRightPanelOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Review/Challenge Tab */}
          {rightPanelTab === 'review' && (
            <ScrollArea className="flex-1 overflow-hidden">
              <div className="space-y-4 p-4 pr-3">
                {/* Section Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Activity & Comments</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground">
                    Mark all read
                  </Button>
                </div>

                {/* Sub-tabs */}
                <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
                  <Button variant="secondary" size="sm" className="h-7 text-xs gap-1.5 flex-1">
                    <AtSign className="w-3 h-3" />
                    Notifications
                    <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">2</Badge>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 flex-1">
                    <MessageSquare className="w-3 h-3" />
                    Comments
                    <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">2</Badge>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 flex-1">
                    <CheckCircle className="w-3 h-3" />
                    Resolved
                    <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">0</Badge>
                  </Button>
                </div>

                {/* Notification Items */}
                <div className="space-y-3">
                  {/* First notification item */}
                  <div className="border rounded-lg p-3 bg-card">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <AtSign className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">Michael Chen</span> tagged you in a comment on <span className="font-medium text-primary">Impact rating</span>
                        </p>
                        
                        {/* Current Field Value Display */}
                        <div className="mt-2 p-2 bg-muted/50 rounded border border-border/50">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Current value:</span>
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                              Rating: 3 (Medium)
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            "Please review the impact rating - I believe it should be higher given recent regulatory changes."
                          </p>
                        </div>

                        {/* Resolution mode for this item */}
                        {resolvingItemId === 'item-1' ? (
                          <div className="mt-3 space-y-2">
                            <Textarea 
                              placeholder="Enter resolution comments..."
                              value={resolutionComment}
                              onChange={(e) => setResolutionComment(e.target.value)}
                              className="min-h-[60px] text-xs"
                            />
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-xs"
                                onClick={() => {
                                  setResolvingItemId(null);
                                  setResolutionComment("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button 
                                size="sm" 
                                className="h-7 text-xs gap-1"
                                onClick={() => {
                                  toast.success("Comment resolved successfully");
                                  setResolvingItemId(null);
                                  setResolutionComment("");
                                }}
                              >
                                <Check className="w-3 h-3" />
                                Confirm Resolution
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-muted-foreground">1 day ago</span>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-xs gap-1"
                              onClick={() => setResolvingItemId('item-1')}
                            >
                              <Check className="w-3 h-3" />
                              Resolve
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    </div>
                  </div>

                  {/* Second notification item */}
                  <div className="border rounded-lg p-3 bg-card">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <AtSign className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">Sarah Johnson</span> tagged you in a comment on <span className="font-medium text-primary">Control Effectiveness</span>
                        </p>
                        
                        {/* Current Field Value Display */}
                        <div className="mt-2 p-2 bg-muted/50 rounded border border-border/50">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Current value:</span>
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                              Design: 4 (Strong)
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            "The control design rating seems too high. Recent testing revealed some gaps."
                          </p>
                        </div>

                        {/* Resolution mode for this item */}
                        {resolvingItemId === 'item-2' ? (
                          <div className="mt-3 space-y-2">
                            <Textarea 
                              placeholder="Enter resolution comments..."
                              value={resolutionComment}
                              onChange={(e) => setResolutionComment(e.target.value)}
                              className="min-h-[60px] text-xs"
                            />
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-xs"
                                onClick={() => {
                                  setResolvingItemId(null);
                                  setResolutionComment("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button 
                                size="sm" 
                                className="h-7 text-xs gap-1"
                                onClick={() => {
                                  toast.success("Comment resolved successfully");
                                  setResolvingItemId(null);
                                  setResolutionComment("");
                                }}
                              >
                                <Check className="w-3 h-3" />
                                Confirm Resolution
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-muted-foreground">about 12 hours ago</span>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-xs gap-1"
                              onClick={() => setResolvingItemId('item-2')}
                            >
                              <Check className="w-3 h-3" />
                              Resolve
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Add Challenge Comment Section */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Add Challenge Comment
                  </h4>
                  <div className="space-y-2">
                    <Textarea 
                      placeholder="Enter your challenge comments... Describe why you believe a rating or value should be reconsidered."
                      value={challengeComment}
                      onChange={(e) => setChallengeComment(e.target.value)}
                      className="min-h-[80px] text-xs"
                    />
                    <Button 
                      size="sm" 
                      className="h-8 text-xs gap-1.5"
                      disabled={!challengeComment.trim()}
                      onClick={() => {
                        toast.success("Challenge submitted successfully");
                        setChallengeComment("");
                      }}
                    >
                      <Send className="w-3 h-3" />
                      Submit Challenge
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Treatment Tab */}
          {rightPanelTab === 'treatment' && (
            <ScrollArea className="flex-1 overflow-hidden">
              <div className="space-y-4 p-4 pr-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Risk Treatment Plan</h3>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-0">
                      How the risk will be managed
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Define how the identified risk will be treated, who owns the treatment actions, and the methodology to be used.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Risk Treatment Approach</label>
                    <Select>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select approach" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mitigate">Mitigate</SelectItem>
                        <SelectItem value="accept">Accept</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                        <SelectItem value="avoid">Avoid</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">The high-level strategy for handling this risk.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Risk Treatment Owner</label>
                    <Select>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compliance">Compliance Team</SelectItem>
                        <SelectItem value="risk">Risk Management</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                        <SelectItem value="it">IT Department</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">The person responsible for implementing the treatment plan.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Treatment Methodology/Strategy</label>
                    <Select>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select methodology" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="controls">Enhanced Controls</SelectItem>
                        <SelectItem value="training">Staff Training</SelectItem>
                        <SelectItem value="automation">Process Automation</SelectItem>
                        <SelectItem value="monitoring">Continuous Monitoring</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">The specific approach to implementing the treatment plan.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Assessment Date</label>
                    <Button variant="outline" className="w-full h-9 justify-start text-left font-normal">
                      <Calendar className="w-4 h-4 mr-2" />
                      April 10th, 2025
                    </Button>
                    <p className="text-xs text-muted-foreground">The date when this assessment was conducted.</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Metrics & Losses Tab */}
          {rightPanelTab === 'metrics' && (
            <ScrollArea className="flex-1 overflow-hidden">
              <div className="space-y-4 p-4 pr-3">
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Metrics and Losses</h3>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-0">
                      Risk Performance Indicators
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Risk metrics and associated loss data help quantify the current risk exposure.
                  </p>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Outlier Metrics Card */}
                  <div className="border-l-4 border-l-amber-500 border rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                      <div>
                        <h4 className="font-semibold">Outlier Metrics</h4>
                        <p className="text-xs text-muted-foreground">Metrics outside defined thresholds</p>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold">8</span>
                      <span className="text-xs text-muted-foreground">of 12 metrics</span>
                    </div>
                    <div className="space-y-1 text-xs mb-3">
                      <div className="flex items-center gap-1 text-amber-600">
                        <TrendingUp className="w-3 h-3" />
                        <span>5 Above Threshold</span>
                      </div>
                      <div className="flex items-center gap-1 text-blue-600">
                        <TrendingDown className="w-3 h-3" />
                        <span>3 Below Threshold</span>
                      </div>
                    </div>
                    <div className="bg-amber-50 rounded-md p-2 text-xs text-amber-700">
                      42% of metrics are currently exceeding their defined thresholds.
                    </div>
                  </div>

                  {/* Loss Incurred Card */}
                  <div className="border-l-4 border-l-red-500 border rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <Target className="w-5 h-5 text-red-500" />
                      <div>
                        <h4 className="font-semibold">Loss Incurred</h4>
                        <p className="text-xs text-muted-foreground">Due to Risk</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Total approved loss amount</p>
                    <div className="text-2xl font-bold text-red-600 mb-3">
                      $2,450,000
                    </div>
                    <div className="bg-red-50 rounded-md p-2 text-xs text-red-700">
                      Losses have increased by 18% compared to the previous assessment period.
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Additional Details Tab */}
          {rightPanelTab === 'details' && (
            <ScrollArea className="flex-1 overflow-hidden">
              <div className="space-y-6 p-4 pr-3">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Additional Details</span>
                </div>

                {/* Comments Section */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Comments</label>
                  <Textarea 
                    placeholder="Add any additional comments or notes related to this risk assessment..."
                    className="min-h-[120px] resize-none"
                  />
                </div>

                <Separator />

                {/* Attachments Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Attachments</h4>
                  <p className="text-xs text-muted-foreground">Upload Files</p>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Drop files here or click to upload</p>
                    <p className="text-xs text-muted-foreground">Upload any relevant documents</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
        </div>
      )}
      
    </div>
  );
};

export default RiskAssessmentForm;
