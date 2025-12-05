import { useState, useEffect } from "react";
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
  Calendar
} from "lucide-react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

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

interface Control {
  id: string;
  name: string;
  type: string;
  owner: string;
  designRating: number;
  operatingRating: number;
  testingRating: number;
  cellComments?: CellComment[];
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
  
  const [activeTab, setActiveTab] = useState(section);
  const [bottomTab, setBottomTab] = useState("previous-assessments");
  const [showWeights, setShowWeights] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'assessments' | 'review' | 'treatment' | 'metrics' | 'details'>('assessments');
  const [collaborateOpen, setCollaborateOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [newCellComment, setNewCellComment] = useState("");
  const [fullEditAccess, setFullEditAccess] = useState(true);
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
  const [activeCellComment, setActiveCellComment] = useState<{factorId: string; field: string} | null>(null);
  
  // Real-time collaboration - simulated collaborator positions on fields
  const [collaboratorPositions] = useState<{
    cellId: string;
    collaborator: { name: string; avatar: string; color: string };
  }[]>([
    { cellId: "financial-impact-rating", collaborator: { name: "Sarah Johnson", avatar: "SJ", color: "bg-emerald-500" } },
    { cellId: "ctl-001-design", collaborator: { name: "Michael Chen", avatar: "MC", color: "bg-blue-500" } },
    { cellId: "operational-impact-comments", collaborator: { name: "Emily Roberts", avatar: "ER", color: "bg-purple-500" } },
  ]);
  
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
      score: 3.7, 
      factors: [
        { name: "Financial Impact", rating: 3, weight: 30 },
        { name: "Reputational Impact", rating: 4, weight: 25 },
        { name: "Operational Impact", rating: 3, weight: 20 },
        { name: "Regulatory Impact", rating: 4, weight: 25 },
      ]
    },
    { 
      date: "2023-12-10", 
      score: 3.9, 
      factors: [
        { name: "Financial Impact", rating: 4, weight: 30 },
        { name: "Reputational Impact", rating: 4, weight: 25 },
        { name: "Operational Impact", rating: 3, weight: 20 },
        { name: "Regulatory Impact", rating: 4, weight: 25 },
      ]
    },
    { 
      date: "2023-09-05", 
      score: 3.5, 
      factors: [
        { name: "Financial Impact", rating: 3, weight: 30 },
        { name: "Reputational Impact", rating: 3, weight: 25 },
        { name: "Operational Impact", rating: 4, weight: 20 },
        { name: "Regulatory Impact", rating: 3, weight: 25 },
      ]
    },
  ];

  const controlHistory = [
    { 
      date: "2024-03-15", 
      score: 2.8, 
      controls: [
        { name: "KYC Verification Process", design: 3, operating: 2, testing: 3 },
        { name: "Customer Due Diligence", design: 4, operating: 3, testing: 3 },
        { name: "Periodic Review Process", design: 3, operating: 3, testing: 2 },
      ]
    },
    { 
      date: "2023-12-10", 
      score: 2.5, 
      controls: [
        { name: "KYC Verification Process", design: 2, operating: 2, testing: 3 },
        { name: "Customer Due Diligence", design: 3, operating: 3, testing: 2 },
        { name: "Periodic Review Process", design: 2, operating: 3, testing: 2 },
      ]
    },
    { 
      date: "2023-09-05", 
      score: 3.0, 
      controls: [
        { name: "KYC Verification Process", design: 3, operating: 3, testing: 3 },
        { name: "Customer Due Diligence", design: 3, operating: 3, testing: 3 },
        { name: "Periodic Review Process", design: 3, operating: 3, testing: 3 },
      ]
    },
  ];

  const residualHistory = [
    { 
      date: "2024-03-15", 
      score: 2.4, 
      factors: [
        { name: "Post-Control Financial", rating: 2, weight: 30 },
        { name: "Post-Control Reputational", rating: 3, weight: 25 },
        { name: "Post-Control Operational", rating: 2, weight: 20 },
        { name: "Post-Control Regulatory", rating: 3, weight: 25 },
      ]
    },
    { 
      date: "2023-12-10", 
      score: 3.2, 
      factors: [
        { name: "Post-Control Financial", rating: 3, weight: 30 },
        { name: "Post-Control Reputational", rating: 3, weight: 25 },
        { name: "Post-Control Operational", rating: 3, weight: 20 },
        { name: "Post-Control Regulatory", rating: 4, weight: 25 },
      ]
    },
    { 
      date: "2023-09-05", 
      score: 3.5, 
      factors: [
        { name: "Post-Control Financial", rating: 3, weight: 30 },
        { name: "Post-Control Reputational", rating: 4, weight: 25 },
        { name: "Post-Control Operational", rating: 3, weight: 20 },
        { name: "Post-Control Regulatory", rating: 4, weight: 25 },
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

  // Treatment plans
  const [treatmentPlans] = useState([
    { id: "TRT-001", action: "Implement enhanced KYC verification system", owner: "IT Department", dueDate: "2025-06-30", status: "In Progress", progress: 65 },
    { id: "TRT-002", action: "Conduct staff training on new compliance procedures", owner: "HR & Training", dueDate: "2025-05-15", status: "Planned", progress: 20 },
    { id: "TRT-003", action: "Deploy automated monitoring tools", owner: "Operations", dueDate: "2025-08-01", status: "Not Started", progress: 0 },
  ]);

  // Metrics & Losses
  const [metricsData] = useState({
    kris: [
      { name: "KYC Completion Rate", current: 94.5, target: 98, trend: "up" },
      { name: "False Positive Rate", current: 12.3, target: 8, trend: "down" },
      { name: "Average Processing Time", current: 2.4, target: 2, trend: "stable" },
    ],
    losses: [
      { id: "LOSS-001", description: "Regulatory fine - incomplete KYC records", amount: 250000, date: "2024-08-15" },
      { id: "LOSS-002", description: "Operational loss - fraud incident", amount: 75000, date: "2024-06-20" },
    ]
  });
  
  // Inherent Risk Factors
  const [inherentFactors, setInherentFactors] = useState<Factor[]>([
    { id: "1", name: "Financial Impact", description: "Impact on financial performance", rating: 3, comments: "Significant financial impact due to penalties and remediation costs", weightage: 30, cellComments: [] },
    { id: "2", name: "Reputational Impact", description: "Impact on brand and reputation", rating: 4, comments: "Major reputational damage if regulatory issues become public", weightage: 25, cellComments: [] },
    { id: "3", name: "Operational Impact", description: "Impact on day-to-day operations", rating: 3, comments: "Operational disruptions due to compliance remediation activities", weightage: 20, cellComments: [] },
    { id: "4", name: "Regulatory Impact", description: "Impact related to regulatory oversight", rating: 4, comments: "High regulatory scrutiny and potential for enforcement actions", weightage: 25, cellComments: [] },
  ]);
  
  // Controls
  const [controls, setControls] = useState<Control[]>([
    { id: "CTL-001", name: "KYC Verification Process", type: "Preventive", owner: "Compliance Team", designRating: 3, operatingRating: 2, testingRating: 3, cellComments: [] },
    { id: "CTL-002", name: "Customer Due Diligence", type: "Detective", owner: "Risk Management", designRating: 4, operatingRating: 3, testingRating: 3, cellComments: [] },
    { id: "CTL-003", name: "Periodic Review Process", type: "Preventive", owner: "Operations", designRating: 3, operatingRating: 3, testingRating: 2, cellComments: [] },
  ]);
  
  // Residual Risk Factors
  const [residualFactors, setResidualFactors] = useState<Factor[]>([
    { id: "1", name: "Post-Control Financial Impact", description: "Financial impact after controls", rating: 2, comments: "Reduced financial exposure with controls in place", weightage: 30, cellComments: [] },
    { id: "2", name: "Post-Control Reputational Impact", description: "Reputational impact after controls", rating: 2, comments: "Better managed reputational risk", weightage: 25, cellComments: [] },
    { id: "3", name: "Post-Control Operational Impact", description: "Operational impact after controls", rating: 2, comments: "Streamlined operations with controls", weightage: 20, cellComments: [] },
    { id: "4", name: "Post-Control Regulatory Impact", description: "Regulatory impact after controls", rating: 2, comments: "Improved compliance posture", weightage: 25, cellComments: [] },
  ]);

  useEffect(() => {
    if (section) {
      setActiveTab(section);
    }
  }, [section]);

  // Calculate scores
  const calculateInherentScore = () => {
    const totalWeight = inherentFactors.reduce((sum, f) => sum + f.weightage, 0);
    const weightedSum = inherentFactors.reduce((sum, f) => sum + (f.rating * f.weightage), 0);
    return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(1) : "0.0";
  };

  const calculateControlScore = () => {
    if (controls.length === 0) return "0.0";
    const avg = controls.reduce((sum, c) => sum + (c.designRating + c.operatingRating + c.testingRating) / 3, 0) / controls.length;
    return avg.toFixed(1);
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

  const handleAiAutofill = async () => {
    setIsAiLoading(true);
    toast.info("AI is analyzing risk factors...");
    setTimeout(() => {
      setIsAiLoading(false);
      toast.success("AI suggestions applied successfully!");
    }, 2000);
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

  const handleExport = (format: string) => {
    toast.success(`Exporting assessment as ${format}...`);
    setExportOpen(false);
  };

  const handleSave = () => {
    toast.success("Assessment saved as draft");
  };

  const handleSubmit = () => {
    toast.success("Assessment submitted for review");
  };

  const updateFactorRating = (factors: Factor[], setFactors: React.Dispatch<React.SetStateAction<Factor[]>>, id: string, rating: number) => {
    setFactors(factors.map(f => f.id === id ? { ...f, rating } : f));
  };

  const updateFactorComment = (factors: Factor[], setFactors: React.Dispatch<React.SetStateAction<Factor[]>>, id: string, comments: string) => {
    setFactors(factors.map(f => f.id === id ? { ...f, comments } : f));
  };

  const updateControlRating = (id: string, field: 'designRating' | 'operatingRating' | 'testingRating', value: number) => {
    setControls(controls.map(c => c.id === id ? { ...c, [field]: value } : c));
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
      <div className="pr-[52px]">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
          <div className="px-4 py-2">
            <div className="flex items-center justify-between">
              {/* Left - Back & Collaboration */}
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/2nd-line-analyst?openOverview=true&riskId=${encodeURIComponent(riskId)}&riskName=${encodeURIComponent(riskName)}`)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                {/* Collaborative Status Indicators */}
                <div className="flex items-center gap-3 px-3 py-1.5 bg-primary/90 rounded-full">
                  {/* User Avatars - Overlapping */}
                  <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-primary flex items-center justify-center text-[10px] font-semibold text-white z-30">
                      SJ
                    </div>
                    <div className="w-7 h-7 rounded-full bg-blue-400 border-2 border-primary flex items-center justify-center text-[10px] font-semibold text-white z-20">
                      MC
                    </div>
                    <div className="w-7 h-7 rounded-full bg-slate-300 border-2 border-primary flex items-center justify-center text-[10px] font-semibold text-slate-700 z-10">
                      ER
                    </div>
                  </div>
                  
                  {/* Editing Status */}
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-background/20 rounded-full border border-emerald-400/50">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-medium text-emerald-400">1 editing</span>
                  </div>
                  
                  {/* Viewing Status */}
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-background/20 rounded-full border border-slate-400/50">
                    <Eye className="w-3 h-3 text-slate-300" />
                    <span className="text-xs font-medium text-slate-300">2 viewing</span>
                  </div>
                </div>
              </div>
              
              {/* Right - Actions */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { setRightPanelOpen(true); setRightPanelTab('review'); }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Review
                </Button>

                {/* Summarize & Export Dialog */}
                <Dialog open={exportOpen} onOpenChange={setExportOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Summarize & Export
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
                          <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => handleExport('JSON')}>
                            <Download className="w-5 h-5 text-purple-500" />
                            <span className="text-xs">JSON</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Collaborate Dialog */}
                <Dialog open={collaborateOpen} onOpenChange={setCollaborateOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300">
                      <Users className="w-4 h-4 mr-2" />
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
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800"
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

                <Button variant="outline" size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleSubmit}>
                  <Send className="w-4 h-4 mr-2" />
                  Submit
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-3">
          {/* Risk Info Header */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full border-2 border-blue-500" />
              <h1 className="text-2xl font-bold">{riskName}</h1>
              <Badge className="bg-amber-100 text-amber-700">Pending Review</Badge>
              <span className="text-muted-foreground font-mono">{riskId}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
              <span>Assessment ID: <span className="text-blue-600 font-medium">ASM-1043</span></span>
              <span>•</span>
              <span>Date: 2025-04-10</span>
            </div>
            
            {/* Score Cards */}
            <div className="flex items-center gap-3 flex-wrap">
              <Card className={`px-4 py-2 ${getRatingLabel(inherentScore).color} text-white`}>
                <div className="text-[10px] opacity-90">Inherent Risk</div>
                <div className="text-lg font-bold">{inherentScore}</div>
                <div className="text-[10px]">{getRatingLabel(inherentScore).label}</div>
              </Card>
              <Card className={`px-4 py-2 ${getRatingLabel(controlScore).color} text-white`}>
                <div className="text-[10px] opacity-90">Control Effectiveness</div>
                <div className="text-lg font-bold">{controlScore}</div>
                <div className="text-[10px]">{getRatingLabel(controlScore).label}</div>
              </Card>
              <Card className={`px-4 py-2 ${getRatingLabel(residualScore).color} text-white`}>
                <div className="text-[10px] opacity-90">Residual Risk</div>
                <div className="text-lg font-bold">{residualScore}</div>
                <div className="text-[10px]">{getRatingLabel(residualScore).label}</div>
              </Card>
              <Card className="px-4 py-2 bg-slate-100 dark:bg-slate-800">
                <div className="text-[10px] text-muted-foreground">Risk Reduction</div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-xl font-bold text-emerald-600">{riskReduction}</span>
                </div>
                <div className="text-xs text-muted-foreground">points</div>
              </Card>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
            <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 p-0 h-auto flex-wrap">
              <TabsTrigger value="inherent-rating" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent px-4 py-3 gap-2">
                <AlertTriangle className="w-4 h-4" />
                Inherent Rating
                <Badge variant="outline" className="ml-1 text-xs">1</Badge>
              </TabsTrigger>
              <TabsTrigger value="control-effectiveness" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-4 py-3 gap-2">
                <Shield className="w-4 h-4" />
                Control Effectiveness
                <Badge variant="outline" className="ml-1 text-xs">2</Badge>
              </TabsTrigger>
              <TabsTrigger value="residual-rating" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent px-4 py-3 gap-2">
                <CheckCircle className="w-4 h-4" />
                Residual Rating
                <Badge variant="outline" className="ml-1 text-xs">3</Badge>
              </TabsTrigger>
              <TabsTrigger value="heat-map" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent px-4 py-3 gap-2">
                Heat Map
              </TabsTrigger>
              <TabsTrigger value="issues" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent px-4 py-3 gap-2">
                Issues
                <Badge className="bg-red-100 text-red-700 ml-1 text-xs">5</Badge>
              </TabsTrigger>
            </TabsList>

            {/* Inherent Rating Tab */}
            <TabsContent value="inherent-rating" className="space-y-3">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-semibold">Overall Inherent Risk Rating</h2>
                    <p className="text-sm text-muted-foreground">Calculated based on weighted impact factors</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white gap-2" onClick={handleAiAutofill} disabled={isAiLoading}>
                      <Sparkles className="w-4 h-4" />
                      {isAiLoading ? "Analyzing..." : "AI Autofill All"}
                    </Button>
                    <div className={`px-3 py-1.5 rounded-lg ${getRatingLabel(inherentScore).color} text-white`}>
                      <div className="text-xs opacity-90">Score: {inherentScore}</div>
                      <div className="font-semibold text-sm">{getRatingLabel(inherentScore).label}</div>
                    </div>
                  </div>
                </div>

                {/* Collaboration Notice */}
                <div className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-700 dark:text-emerald-300">
                      Live collaboration active! Watch for colored badges on cells showing who's editing in real time.
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-1.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[8px] font-semibold text-white">SJ</div>
                      <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-[8px] font-semibold text-white">MC</div>
                      <div className="w-5 h-5 rounded-full bg-purple-500 border-2 border-white flex items-center justify-center text-[8px] font-semibold text-white">ER</div>
                    </div>
                  </div>
                </div>

                {/* Factors Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="w-10 p-1.5 text-left"><Checkbox /></th>
                        <th className="p-1.5 text-left text-xs font-medium">Factor & Description</th>
                        <th className="p-1.5 text-left text-xs font-medium w-32">Rating</th>
                        <th className="p-1.5 text-left text-xs font-medium">Comments</th>
                        {showWeights && <th className="p-1.5 text-left text-xs font-medium w-24">Weightage (%)</th>}
                        <th className="p-1.5 text-left text-xs font-medium w-16">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inherentFactors.map((factor) => {
                        const factorCellId = factor.name.toLowerCase().replace(/\s+/g, '-');
                        return (
                        <tr key={factor.id} className="border-t hover:bg-muted/30">
                          <td className="p-1.5"><Checkbox /></td>
                          <td className="p-1.5">
                            <CellCommentPopover factorName={factor.name} field="Description">
                              <div>
                                <div className="font-medium text-sm">{factor.name}</div>
                                <div className="text-xs text-muted-foreground">{factor.description}</div>
                              </div>
                            </CellCommentPopover>
                          </td>
                          <td className="p-1.5">
                            <CollaborativeCell cellId={`${factorCellId}-rating`}>
                              <CellCommentPopover factorName={factor.name} field="Rating">
                                <Select value={factor.rating.toString()} onValueChange={(v) => updateFactorRating(inherentFactors, setInherentFactors, factor.id, parseInt(v))}>
                                  <SelectTrigger className="w-full bg-background h-7 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background border shadow-lg z-50">
                                    <SelectItem value="1">Very Low (1)</SelectItem>
                                    <SelectItem value="2">Low (2)</SelectItem>
                                    <SelectItem value="3">Medium (3)</SelectItem>
                                    <SelectItem value="4">High (4)</SelectItem>
                                    <SelectItem value="5">Very High (5)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </CellCommentPopover>
                            </CollaborativeCell>
                          </td>
                          <td className="p-1.5">
                            <CollaborativeCell cellId={`${factorCellId}-comments`}>
                              <CellCommentPopover factorName={factor.name} field="Comments">
                                <Textarea 
                                  value={factor.comments}
                                  onChange={(e) => updateFactorComment(inherentFactors, setInherentFactors, factor.id, e.target.value)}
                                  className="min-h-[28px] resize-none text-xs"
                                />
                              </CellCommentPopover>
                            </CollaborativeCell>
                          </td>
                          {showWeights && <td className="p-1.5 text-center text-sm font-medium">{factor.weightage}</td>}
                          <td className="p-1.5">
                            <div className="flex items-center gap-0.5">
                              <Button variant="ghost" size="icon" className="h-5 w-5 text-blue-600"><Edit2 className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="icon" className="h-5 w-5 text-red-600"><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
                <Button variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" />Add Row</Button>
              </Card>

              <div className="flex items-center justify-between">
                <Button variant="outline" className="gap-2" disabled><ChevronLeft className="w-4 h-4" />Previous</Button>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setActiveTab("control-effectiveness")}>
                  Continue to Control Effectiveness<ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Control Effectiveness Tab */}
            <TabsContent value="control-effectiveness" className="space-y-3">
              <Card className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-base font-semibold">Control Effectiveness Assessment</h2>
                    <p className="text-xs text-muted-foreground">Evaluate design, operating effectiveness, and testing results</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white gap-2 h-8 text-sm" onClick={handleAiAutofill} disabled={isAiLoading}>
                      <Sparkles className="w-3.5 h-3.5" />{isAiLoading ? "Analyzing..." : "AI Autofill All"}
                    </Button>
                    <div className={`px-2.5 py-1 rounded-lg ${getRatingLabel(controlScore).color} text-white`}>
                      <div className="text-[10px] opacity-90">Score: {controlScore}</div>
                      <div className="font-semibold text-xs">{getRatingLabel(controlScore).label}</div>
                    </div>
                  </div>
                </div>

                {/* Collaboration Notice */}
                <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs text-blue-700 dark:text-blue-300">
                      Results displayed are from the latest control test performed on this control, with detailed responses to questions and samples.
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-1.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[8px] font-semibold text-white">SJ</div>
                      <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-[8px] font-semibold text-white">MC</div>
                      <div className="w-5 h-5 rounded-full bg-purple-500 border-2 border-white flex items-center justify-center text-[8px] font-semibold text-white">ER</div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="w-10 p-1.5 text-left"><Checkbox /></th>
                        <th className="p-1.5 text-left text-xs font-medium">Control ID</th>
                        <th className="p-1.5 text-left text-xs font-medium">Control Name</th>
                        <th className="p-1.5 text-left text-xs font-medium">Type</th>
                        <th className="p-1.5 text-left text-xs font-medium">Owner</th>
                        <th className="p-1.5 text-left text-xs font-medium w-20">Design</th>
                        <th className="p-1.5 text-left text-xs font-medium w-20">Operating</th>
                        <th className="p-1.5 text-left text-xs font-medium w-20">Testing</th>
                        <th className="p-1.5 text-left text-xs font-medium w-14">Avg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {controls.map((control) => {
                        const avg = ((control.designRating + control.operatingRating + control.testingRating) / 3).toFixed(1);
                        const controlCellId = control.id.toLowerCase();
                        return (
                          <tr key={control.id} className="border-t hover:bg-muted/30">
                            <td className="p-1.5"><Checkbox /></td>
                            <td className="p-1.5 font-mono text-xs text-blue-600">{control.id}</td>
                            <td className="p-1.5">
                              <CellCommentPopover factorName={control.id} field="Name">
                                <span className="font-medium text-sm">{control.name}</span>
                              </CellCommentPopover>
                            </td>
                            <td className="p-1.5">
                              <Badge variant="outline" className={`text-xs ${control.type === "Preventive" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                                {control.type}
                              </Badge>
                            </td>
                            <td className="p-1.5 text-xs">{control.owner}</td>
                            <td className="p-1.5">
                              <CollaborativeCell cellId={`${controlCellId}-design`}>
                                <CellCommentPopover factorName={control.id} field="Design">
                                  <Select value={control.designRating.toString()} onValueChange={(v) => updateControlRating(control.id, 'designRating', parseInt(v))}>
                                    <SelectTrigger className="w-full bg-background h-7 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border shadow-lg z-50">
                                      {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </CellCommentPopover>
                              </CollaborativeCell>
                            </td>
                            <td className="p-1.5">
                              <CollaborativeCell cellId={`${controlCellId}-operating`}>
                                <CellCommentPopover factorName={control.id} field="Operating">
                                  <Select value={control.operatingRating.toString()} onValueChange={(v) => updateControlRating(control.id, 'operatingRating', parseInt(v))}>
                                    <SelectTrigger className="w-full bg-background h-7 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border shadow-lg z-50">
                                      {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </CellCommentPopover>
                              </CollaborativeCell>
                            </td>
                            <td className="p-1.5">
                              <CollaborativeCell cellId={`${controlCellId}-testing`}>
                                <CellCommentPopover factorName={control.id} field="Testing">
                                  <Select value={control.testingRating.toString()} onValueChange={(v) => updateControlRating(control.id, 'testingRating', parseInt(v))}>
                                    <SelectTrigger className="w-full bg-background h-7 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border shadow-lg z-50">
                                      {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </CellCommentPopover>
                              </CollaborativeCell>
                            </td>
                            <td className="p-1.5">
                              <Badge className={`${getRatingLabel(parseFloat(avg)).color} text-white text-xs`}>{avg}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Button variant="outline" className="mt-3 gap-2 h-8 text-sm"><Plus className="w-3.5 h-3.5" />Add Control</Button>
              </Card>

              <div className="flex items-center justify-between">
                <Button variant="outline" className="gap-2" onClick={() => setActiveTab("inherent-rating")}><ChevronLeft className="w-4 h-4" />Previous</Button>
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => setActiveTab("residual-rating")}>
                  Continue to Residual Rating<ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Residual Rating Tab */}
            <TabsContent value="residual-rating" className="space-y-3">
              <Card className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-base font-semibold">Residual Risk Rating</h2>
                    <p className="text-xs text-muted-foreground">Risk rating after applying controls</p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg ${getRatingLabel(residualScore).color} text-white`}>
                    <div className="text-[10px] opacity-90">Score: {residualScore}</div>
                    <div className="font-semibold text-xs">{getRatingLabel(residualScore).label}</div>
                  </div>
                </div>

                {/* Collaboration Notice */}
                <div className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-700 dark:text-emerald-300">
                      Live collaboration active! Watch for colored badges on cells showing who's editing in real time.
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-1.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[8px] font-semibold text-white">SJ</div>
                      <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-[8px] font-semibold text-white">MC</div>
                      <div className="w-5 h-5 rounded-full bg-purple-500 border-2 border-white flex items-center justify-center text-[8px] font-semibold text-white">ER</div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="w-10 p-1.5 text-left"><Checkbox /></th>
                        <th className="p-1.5 text-left text-xs font-medium">Factor & Description</th>
                        <th className="p-1.5 text-left text-xs font-medium w-32">Rating</th>
                        <th className="p-1.5 text-left text-xs font-medium">Comments</th>
                        {showWeights && <th className="p-1.5 text-left text-xs font-medium w-24">Weightage (%)</th>}
                        <th className="p-1.5 text-left text-xs font-medium w-16">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {residualFactors.map((factor) => (
                        <tr key={factor.id} className="border-t hover:bg-muted/30">
                          <td className="p-1.5"><Checkbox /></td>
                          <td className="p-1.5">
                            <CellCommentPopover factorName={factor.name} field="Description">
                              <div>
                                <div className="font-medium text-sm">{factor.name}</div>
                                <div className="text-xs text-muted-foreground">{factor.description}</div>
                              </div>
                            </CellCommentPopover>
                          </td>
                          <td className="p-1.5">
                            <CellCommentPopover factorName={factor.name} field="Rating">
                              <Select value={factor.rating.toString()} onValueChange={(v) => updateFactorRating(residualFactors, setResidualFactors, factor.id, parseInt(v))}>
                                <SelectTrigger className="w-full bg-background h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-background border shadow-lg z-50">
                                  <SelectItem value="1">Very Low (1)</SelectItem>
                                  <SelectItem value="2">Low (2)</SelectItem>
                                  <SelectItem value="3">Medium (3)</SelectItem>
                                  <SelectItem value="4">High (4)</SelectItem>
                                  <SelectItem value="5">Very High (5)</SelectItem>
                                </SelectContent>
                              </Select>
                            </CellCommentPopover>
                          </td>
                          <td className="p-1.5">
                            <CellCommentPopover factorName={factor.name} field="Comments">
                              <Textarea 
                                value={factor.comments}
                                onChange={(e) => updateFactorComment(residualFactors, setResidualFactors, factor.id, e.target.value)}
                                className="min-h-[28px] resize-none text-xs"
                              />
                            </CellCommentPopover>
                          </td>
                          {showWeights && <td className="p-1.5 text-center text-sm font-medium">{factor.weightage}</td>}
                          <td className="p-1.5">
                            <div className="flex items-center gap-0.5">
                              <Button variant="ghost" size="icon" className="h-5 w-5 text-blue-600"><Edit2 className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="icon" className="h-5 w-5 text-red-600"><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="flex items-center justify-between">
                <Button variant="outline" className="gap-2" onClick={() => setActiveTab("control-effectiveness")}><ChevronLeft className="w-4 h-4" />Previous</Button>
                <Button className="gap-2 bg-purple-600 hover:bg-purple-700" onClick={() => setActiveTab("heat-map")}>
                  View Heat Map<ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Heat Map Tab */}
            <TabsContent value="heat-map" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Heat Map Chart */}
                <Card className="p-4 lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Risk Heat Map</h2>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </div>
                  
                  {/* Score Badges */}
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-slate-700 text-white hover:bg-slate-700">
                      Inherent: {inherentScore}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">
                      Residual: {residualScore}
                    </Badge>
                    <div className="ml-auto flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-sm text-muted-foreground">Appetite Threshold: 2.0</span>
                    </div>
                  </div>
                  
                  {/* Heat Map Scatter Plot */}
                  <div className="relative bg-gradient-to-tr from-emerald-50 via-yellow-50/50 via-60% to-red-100 dark:from-emerald-950/30 dark:via-yellow-950/20 dark:to-red-950/30 rounded-lg p-4 border">
                    {/* Risk Appetite Threshold Label */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Risk Appetite Threshold
                    </div>
                    
                    {/* Chart Area */}
                    <div className="relative" style={{ height: '280px' }}>
                      {/* Y-Axis */}
                      <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between items-end pr-2 text-xs text-muted-foreground">
                        <span>5</span>
                        <span>4</span>
                        <span>3</span>
                        <span>2</span>
                        <span>1</span>
                        <span>0</span>
                      </div>
                      
                      {/* Y-Axis Label */}
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium text-muted-foreground whitespace-nowrap">
                        Residual Risk
                      </div>
                      
                      {/* Plot Area */}
                      <div className="absolute left-10 right-4 top-4 bottom-8 border-l-2 border-b-2 border-slate-300 dark:border-slate-600">
                        {/* Horizontal Threshold Line */}
                        <div 
                          className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-500"
                          style={{ bottom: `${(2/5) * 100}%` }}
                        />
                        
                        {/* Vertical Threshold Line */}
                        <div 
                          className="absolute top-0 bottom-0 border-l-2 border-dashed border-emerald-500"
                          style={{ left: `${(2/5) * 100}%` }}
                        />
                        
                        {/* Previous Assessment Point (gray) */}
                        <div 
                          className="absolute w-6 h-6 rounded-full bg-slate-400 border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2"
                          style={{ 
                            left: `${(3.5/5) * 100}%`, 
                            bottom: `${(3/5) * 100}%`,
                            top: 'auto'
                          }}
                        />
                        
                        {/* Dotted line connecting previous to current */}
                        <svg className="absolute inset-0 w-full h-full overflow-visible" style={{ pointerEvents: 'none' }}>
                          <line 
                            x1={`${(3.5/5) * 100}%`} 
                            y1={`${100 - (3/5) * 100}%`}
                            x2={`${(inherentScore/5) * 100}%`} 
                            y2={`${100 - (residualScore/5) * 100}%`}
                            stroke="#94a3b8" 
                            strokeWidth="2" 
                            strokeDasharray="4 4"
                          />
                        </svg>
                        
                        {/* Current Assessment Point (blue) */}
                        <div 
                          className="absolute w-8 h-8 rounded-full bg-blue-500 border-4 border-blue-200 shadow-lg transform -translate-x-1/2 -translate-y-1/2 z-10"
                          style={{ 
                            left: `${(inherentScore/5) * 100}%`, 
                            bottom: `${(residualScore/5) * 100}%`,
                            top: 'auto'
                          }}
                        />
                      </div>
                      
                      {/* X-Axis */}
                      <div className="absolute left-10 right-4 bottom-0 flex justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                      </div>
                      
                      {/* X-Axis Label */}
                      <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-xs font-medium text-muted-foreground">
                        Inherent Risk
                      </div>
                    </div>
                  </div>
                  
                  {/* Risk Zone Legend */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <div className="font-medium text-sm">Very Low Risk Zone</div>
                      <div className="text-xs text-muted-foreground">Score: 0-2</div>
                    </div>
                    <div className="p-3 rounded-lg bg-lime-50 dark:bg-lime-950/30 border border-lime-200 dark:border-lime-800">
                      <div className="font-medium text-sm">Low Risk Zone</div>
                      <div className="text-xs text-muted-foreground">Score: 2-3</div>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <div className="font-medium text-sm">Medium Risk Zone</div>
                      <div className="text-xs text-muted-foreground">Score: 3-4</div>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                      <div className="font-medium text-sm">High Risk Zone</div>
                      <div className="text-xs text-muted-foreground">Score: 4-5</div>
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

              <div className="flex items-center justify-between">
                <Button variant="outline" className="gap-2" onClick={() => setActiveTab("residual-rating")}>
                  <ChevronLeft className="w-4 h-4" />Previous
                </Button>
                <Button className="gap-2 bg-slate-600 hover:bg-slate-700" onClick={() => setActiveTab("issues")}>
                  View Issues<ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Issues Tab */}
            <TabsContent value="issues">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Related Issues</h2>
                <div className="space-y-2">
                  {[
                    { id: "ISS-1001", title: "KYC documentation gaps", severity: "High", status: "Open" },
                    { id: "ISS-1002", title: "Delayed verification", severity: "Medium", status: "In Progress" },
                    { id: "ISS-1003", title: "Missing audit trail", severity: "High", status: "Open" },
                  ].map((issue) => (
                    <div key={issue.id} className="p-3 border rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-blue-600">{issue.id}</span>
                        <span>{issue.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={issue.severity === "High" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>{issue.severity}</Badge>
                        <Badge variant="outline">{issue.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>

        </div>
      </div>

      {/* Right Vertical Tab Bar - Fixed on right edge */}
      <div className="fixed top-0 right-0 h-full w-auto bg-background border-l border-border z-[60] flex flex-col pt-14">
        {[
          { id: 'assessments', label: 'Previous Assessments', icon: History },
          { id: 'review', label: 'Review & Challenge', icon: MessageSquare },
          { id: 'treatment', label: 'Treatment', icon: Clipboard },
          { id: 'metrics', label: 'Metrics & Losses', icon: BarChart3 },
          { id: 'details', label: 'Additional Details', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = rightPanelOpen && rightPanelTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (rightPanelOpen && rightPanelTab === tab.id) {
                  setRightPanelOpen(false);
                } else {
                  setRightPanelOpen(true);
                  setRightPanelTab(tab.id as any);
                  setSelectedHistoryDate(0);
                }
              }}
              className={`flex items-center gap-0 py-4 px-3 border-b border-border transition-colors ${
                isActive
                  ? 'bg-muted/50 text-primary' 
                  : 'hover:bg-muted/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              {/* Icon box */}
              <div className={`p-2.5 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-primary/10' 
                  : 'bg-muted/80'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              
              {/* Vertical text */}
              <span className="text-xs font-medium [writing-mode:vertical-rl] rotate-180 ml-1">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right Sliding Panel */}
      {rightPanelOpen && (
        <div className="fixed top-0 right-[52px] h-full w-[400px] bg-background border-l border-border z-[55] shadow-xl overflow-hidden">
        <div className="flex flex-col h-full w-full overflow-hidden">
          {/* Panel Header */}
          <div className="p-3 border-b flex items-center justify-between bg-muted/30">
            <h3 className="font-semibold text-sm">
              {rightPanelTab === 'assessments' && getHistoryTitle()}
              {rightPanelTab === 'review' && 'Review & Challenge'}
              {rightPanelTab === 'treatment' && 'Treatment Plans'}
              {rightPanelTab === 'metrics' && 'Metrics & Losses'}
              {rightPanelTab === 'details' && 'Additional Details'}
            </h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRightPanelOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Previous Assessments Tab */}
          {rightPanelTab === 'assessments' && (
            <ScrollArea className="flex-1 overflow-hidden">
              <div className="space-y-4 p-4 pr-3">
                {/* Section Title */}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{getHistoryTitle()}</span>
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </div>

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

                {/* Score and Copy Button */}
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

                {/* Data Table */}
                <div className="border rounded-lg overflow-hidden">
                  {activeTab === "control-effectiveness" ? (
                    // Control Effectiveness Table
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Control</th>
                          <th className="text-center px-2 py-2 font-medium text-muted-foreground">Design</th>
                          <th className="text-center px-2 py-2 font-medium text-muted-foreground">Operating</th>
                          <th className="text-center px-2 py-2 font-medium text-muted-foreground">Testing</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(getHistoryData()[selectedHistoryDate] as any)?.controls?.map((control: any, idx: number) => (
                          <tr key={idx} className="border-b last:border-b-0">
                            <td className="px-3 py-2.5 text-foreground">{control.name}</td>
                            <td className="px-2 py-2.5 text-center">
                              <Badge variant="outline" className={getHistoryRatingBadge(control.design).color}>
                                {control.design}
                              </Badge>
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              <Badge variant="outline" className={getHistoryRatingBadge(control.operating).color}>
                                {control.operating}
                              </Badge>
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              <Badge variant="outline" className={getHistoryRatingBadge(control.testing).color}>
                                {control.testing}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    // Factors Table (Inherent & Residual)
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Factor</th>
                          <th className="text-center px-3 py-2 font-medium text-muted-foreground">Rating</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground">Weight (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(getHistoryData()[selectedHistoryDate] as any)?.factors?.map((factor: any, idx: number) => (
                          <tr key={idx} className="border-b last:border-b-0">
                            <td className="px-3 py-2.5 text-foreground">{factor.name}</td>
                            <td className="px-3 py-2.5 text-center">
                              <Badge variant="outline" className={`${getHistoryRatingBadge(factor.rating).color}`}>
                                {getHistoryRatingBadge(factor.rating).label} ({factor.rating})
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5 text-right text-muted-foreground">{factor.weight}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Review & Challenge Tab */}
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
                <div className="space-y-2">
                  <div className="border rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <AtSign className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">Michael Chen</span> tagged you in a comment on <span className="font-medium">Impact rating</span>
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground">1 day ago</span>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                            <Check className="w-3 h-3" />
                            Resolve
                          </Button>
                        </div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    </div>
                  </div>

                  <div className="border rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <AtSign className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">Sarah Johnson</span> tagged you in a comment on <span className="font-medium">Control Effectiveness</span>
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground">about 12 hours ago</span>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                            <Check className="w-3 h-3" />
                            Resolve
                          </Button>
                        </div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Treatment Tab */}
          {rightPanelTab === 'treatment' && (
            <ScrollArea className="flex-1 overflow-hidden">
              <div className="space-y-6 p-4 pr-3">
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Risk Treatment Plan</h3>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-0">
                      How the risk will be managed
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    In this section, define how the identified risk will be treated, who owns the treatment actions, and the methodology to be used.
                  </p>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                <Button className="w-full gap-2 bg-slate-900 hover:bg-slate-800">
                  Continue to Inherent Rating
                  <ChevronRight className="w-4 h-4" />
                </Button>
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
