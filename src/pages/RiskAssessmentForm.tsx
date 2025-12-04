import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  MessageSquare, 
  FileText, 
  Users, 
  Save, 
  Send, 
  X,
  TrendingUp,
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
  ThumbsDown
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
  const [rightPanelTab, setRightPanelTab] = useState<'chat' | 'comments' | 'activity'>('chat');
  const [collaborateOpen, setCollaborateOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [newCellComment, setNewCellComment] = useState("");
  const [activeCellComment, setActiveCellComment] = useState<{factorId: string; field: string} | null>(null);
  
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

  // Collaborators
  const [collaborators] = useState<Collaborator[]>([
    { id: "1", name: "Sarah Johnson", email: "sarah.j@company.com", avatar: "SJ", role: "Risk Manager", status: "editing", lastActive: "Now" },
    { id: "2", name: "Michael Chen", email: "m.chen@company.com", avatar: "MC", role: "Compliance Officer", status: "online", lastActive: "2 min ago" },
    { id: "3", name: "Emily Roberts", email: "e.roberts@company.com", avatar: "ER", role: "Auditor", status: "online", lastActive: "5 min ago" },
    { id: "4", name: "David Kim", email: "d.kim@company.com", avatar: "DK", role: "Business Analyst", status: "offline", lastActive: "1 hour ago" },
  ]);

  // Previous assessments
  const previousAssessments = [
    { id: "ASM-1042", date: "2024-10-15", inherent: 3.8, residual: 2.3, status: "Approved", assessor: "John Smith" },
    { id: "ASM-1035", date: "2024-07-20", inherent: 4.0, residual: 2.5, status: "Approved", assessor: "Sarah Johnson" },
    { id: "ASM-1028", date: "2024-04-12", inherent: 3.5, residual: 2.8, status: "Approved", assessor: "Michael Chen" },
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20 flex">
      {/* Main Content Area */}
      <div className="flex-1 pr-14">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Left - Back & Collaboration */}
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {collaborators.slice(0, 3).map((c) => (
                      <div 
                        key={c.id}
                        className={`w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-white text-xs font-medium ${
                          c.status === 'editing' ? 'bg-blue-500' : c.status === 'online' ? 'bg-emerald-500' : 'bg-gray-400'
                        }`}
                        title={`${c.name} - ${c.status}`}
                      >
                        {c.avatar}
                      </div>
                    ))}
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                    {collaborators.filter(c => c.status === 'editing').length} editing
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300">
                    {collaborators.filter(c => c.status === 'online').length} viewing
                  </Badge>
                </div>
              </div>
              
              {/* Right - Actions */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { setRightPanelOpen(true); setRightPanelTab('chat'); }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat
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
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Collaboration</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex gap-2">
                        <Input placeholder="Enter email..." value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                        <Button onClick={handleInvite}><UserPlus className="w-4 h-4 mr-2" />Invite</Button>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        {collaborators.map((c) => (
                          <div key={c.id} className="flex items-center justify-between p-2 border rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                                c.status === 'editing' ? 'bg-blue-500' : c.status === 'online' ? 'bg-emerald-500' : 'bg-gray-400'
                              }`}>{c.avatar}</div>
                              <div>
                                <div className="text-sm font-medium">{c.name}</div>
                                <div className="text-xs text-muted-foreground">{c.role}</div>
                              </div>
                            </div>
                            <Badge variant="outline" className={c.status === 'editing' ? 'bg-blue-50 text-blue-700' : c.status === 'online' ? 'bg-emerald-50 text-emerald-700' : ''}>
                              {c.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
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
        <div className="px-4 py-6">
          {/* Risk Info Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 rounded-full border-2 border-blue-500" />
              <h1 className="text-2xl font-bold">{riskName}</h1>
              <Badge className="bg-amber-100 text-amber-700">Pending Review</Badge>
              <span className="text-muted-foreground font-mono">{riskId}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span>Assessment ID: <span className="text-blue-600 font-medium">ASM-1043</span></span>
              <span>•</span>
              <span>Date: 2025-04-10</span>
            </div>
            
            {/* Score Cards */}
            <div className="flex items-center gap-4 flex-wrap">
              <Card className={`px-5 py-3 ${getRatingLabel(inherentScore).color} text-white`}>
                <div className="text-xs opacity-90">Inherent Risk</div>
                <div className="text-xl font-bold">{inherentScore}</div>
                <div className="text-xs">{getRatingLabel(inherentScore).label}</div>
              </Card>
              <Card className={`px-5 py-3 ${getRatingLabel(controlScore).color} text-white`}>
                <div className="text-xs opacity-90">Control Effectiveness</div>
                <div className="text-xl font-bold">{controlScore}</div>
                <div className="text-xs">{getRatingLabel(controlScore).label}</div>
              </Card>
              <Card className={`px-5 py-3 ${getRatingLabel(residualScore).color} text-white`}>
                <div className="text-xs opacity-90">Residual Risk</div>
                <div className="text-xl font-bold">{residualScore}</div>
                <div className="text-xs">{getRatingLabel(residualScore).label}</div>
              </Card>
              <Card className="px-5 py-3 bg-slate-100 dark:bg-slate-800">
                <div className="text-xs text-muted-foreground">Risk Reduction</div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-xl font-bold text-emerald-600">{riskReduction}</span>
                </div>
                <div className="text-xs text-muted-foreground">points</div>
              </Card>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
            <TabsContent value="inherent-rating" className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">Overall Inherent Risk Rating</h2>
                    <p className="text-sm text-muted-foreground">Calculated based on weighted impact factors</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowWeights(!showWeights)}>
                      {showWeights ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                      {showWeights ? "Hide" : "Show"} Weights
                    </Button>
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
                <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 mb-4">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">
                    Live collaboration active! Click on any cell to add review comments.
                  </span>
                </div>

                {/* Factors Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="w-10 p-3 text-left"><Checkbox /></th>
                        <th className="p-3 text-left text-sm font-medium">Factor & Description</th>
                        <th className="p-3 text-left text-sm font-medium w-36">Rating</th>
                        <th className="p-3 text-left text-sm font-medium">Comments</th>
                        {showWeights && <th className="p-3 text-left text-sm font-medium w-28">Weightage (%)</th>}
                        <th className="p-3 text-left text-sm font-medium w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inherentFactors.map((factor) => (
                        <tr key={factor.id} className="border-t hover:bg-muted/30">
                          <td className="p-3"><Checkbox /></td>
                          <td className="p-3">
                            <CellCommentPopover factorName={factor.name} field="Description">
                              <div>
                                <div className="font-medium">{factor.name}</div>
                                <div className="text-sm text-muted-foreground">{factor.description}</div>
                              </div>
                            </CellCommentPopover>
                          </td>
                          <td className="p-3">
                            <CellCommentPopover factorName={factor.name} field="Rating">
                              <Select value={factor.rating.toString()} onValueChange={(v) => updateFactorRating(inherentFactors, setInherentFactors, factor.id, parseInt(v))}>
                                <SelectTrigger className="w-full bg-background">
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
                          <td className="p-3">
                            <CellCommentPopover factorName={factor.name} field="Comments">
                              <Textarea 
                                value={factor.comments}
                                onChange={(e) => updateFactorComment(inherentFactors, setInherentFactors, factor.id, e.target.value)}
                                className="min-h-[50px] resize-none text-sm"
                              />
                            </CellCommentPopover>
                          </td>
                          {showWeights && <td className="p-3 text-center font-medium">{factor.weightage}</td>}
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600"><Edit2 className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600"><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
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
            <TabsContent value="control-effectiveness" className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">Control Effectiveness Assessment</h2>
                    <p className="text-sm text-muted-foreground">Evaluate design, operating effectiveness, and testing results</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white gap-2" onClick={handleAiAutofill} disabled={isAiLoading}>
                      <Sparkles className="w-4 h-4" />{isAiLoading ? "Analyzing..." : "AI Autofill All"}
                    </Button>
                    <div className={`px-3 py-1.5 rounded-lg ${getRatingLabel(controlScore).color} text-white`}>
                      <div className="text-xs opacity-90">Score: {controlScore}</div>
                      <div className="font-semibold text-sm">{getRatingLabel(controlScore).label}</div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="w-10 p-3 text-left"><Checkbox /></th>
                        <th className="p-3 text-left text-sm font-medium">Control ID</th>
                        <th className="p-3 text-left text-sm font-medium">Control Name</th>
                        <th className="p-3 text-left text-sm font-medium">Type</th>
                        <th className="p-3 text-left text-sm font-medium">Owner</th>
                        <th className="p-3 text-left text-sm font-medium w-24">Design</th>
                        <th className="p-3 text-left text-sm font-medium w-24">Operating</th>
                        <th className="p-3 text-left text-sm font-medium w-24">Testing</th>
                        <th className="p-3 text-left text-sm font-medium w-16">Avg</th>
                        <th className="p-3 text-left text-sm font-medium w-16">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {controls.map((control) => {
                        const avg = ((control.designRating + control.operatingRating + control.testingRating) / 3).toFixed(1);
                        return (
                          <tr key={control.id} className="border-t hover:bg-muted/30">
                            <td className="p-3"><Checkbox /></td>
                            <td className="p-3 font-mono text-sm text-blue-600">{control.id}</td>
                            <td className="p-3">
                              <CellCommentPopover factorName={control.id} field="Name">
                                <span className="font-medium">{control.name}</span>
                              </CellCommentPopover>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className={control.type === "Preventive" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}>
                                {control.type}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm">{control.owner}</td>
                            <td className="p-3">
                              <CellCommentPopover factorName={control.id} field="Design">
                                <Select value={control.designRating.toString()} onValueChange={(v) => updateControlRating(control.id, 'designRating', parseInt(v))}>
                                  <SelectTrigger className="w-full bg-background h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background border shadow-lg z-50">
                                    {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </CellCommentPopover>
                            </td>
                            <td className="p-3">
                              <CellCommentPopover factorName={control.id} field="Operating">
                                <Select value={control.operatingRating.toString()} onValueChange={(v) => updateControlRating(control.id, 'operatingRating', parseInt(v))}>
                                  <SelectTrigger className="w-full bg-background h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background border shadow-lg z-50">
                                    {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </CellCommentPopover>
                            </td>
                            <td className="p-3">
                              <CellCommentPopover factorName={control.id} field="Testing">
                                <Select value={control.testingRating.toString()} onValueChange={(v) => updateControlRating(control.id, 'testingRating', parseInt(v))}>
                                  <SelectTrigger className="w-full bg-background h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background border shadow-lg z-50">
                                    {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </CellCommentPopover>
                            </td>
                            <td className="p-3">
                              <Badge className={`${getRatingLabel(parseFloat(avg)).color} text-white`}>{avg}</Badge>
                            </td>
                            <td className="p-3">
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Button variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" />Add Control</Button>
              </Card>

              <div className="flex items-center justify-between">
                <Button variant="outline" className="gap-2" onClick={() => setActiveTab("inherent-rating")}><ChevronLeft className="w-4 h-4" />Previous</Button>
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => setActiveTab("residual-rating")}>
                  Continue to Residual Rating<ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Residual Rating Tab */}
            <TabsContent value="residual-rating" className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">Residual Risk Rating</h2>
                    <p className="text-sm text-muted-foreground">Risk rating after applying controls</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg ${getRatingLabel(residualScore).color} text-white`}>
                    <div className="text-xs opacity-90">Score: {residualScore}</div>
                    <div className="font-semibold text-sm">{getRatingLabel(residualScore).label}</div>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="w-10 p-3 text-left"><Checkbox /></th>
                        <th className="p-3 text-left text-sm font-medium">Factor & Description</th>
                        <th className="p-3 text-left text-sm font-medium w-36">Rating</th>
                        <th className="p-3 text-left text-sm font-medium">Comments</th>
                        {showWeights && <th className="p-3 text-left text-sm font-medium w-28">Weightage (%)</th>}
                        <th className="p-3 text-left text-sm font-medium w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {residualFactors.map((factor) => (
                        <tr key={factor.id} className="border-t hover:bg-muted/30">
                          <td className="p-3"><Checkbox /></td>
                          <td className="p-3">
                            <CellCommentPopover factorName={factor.name} field="Description">
                              <div>
                                <div className="font-medium">{factor.name}</div>
                                <div className="text-sm text-muted-foreground">{factor.description}</div>
                              </div>
                            </CellCommentPopover>
                          </td>
                          <td className="p-3">
                            <CellCommentPopover factorName={factor.name} field="Rating">
                              <Select value={factor.rating.toString()} onValueChange={(v) => updateFactorRating(residualFactors, setResidualFactors, factor.id, parseInt(v))}>
                                <SelectTrigger className="w-full bg-background">
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
                          <td className="p-3">
                            <CellCommentPopover factorName={factor.name} field="Comments">
                              <Textarea 
                                value={factor.comments}
                                onChange={(e) => updateFactorComment(residualFactors, setResidualFactors, factor.id, e.target.value)}
                                className="min-h-[50px] resize-none text-sm"
                              />
                            </CellCommentPopover>
                          </td>
                          {showWeights && <td className="p-3 text-center font-medium">{factor.weightage}</td>}
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600"><Edit2 className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600"><Trash2 className="w-3.5 h-3.5" /></Button>
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
            <TabsContent value="heat-map">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Risk Heat Map</h2>
                <div className="flex gap-8">
                  <div>
                    <div className="grid grid-cols-5 gap-1" style={{ width: '200px' }}>
                      {[5,4,3,2,1].map((impact) => [1,2,3,4,5].map((likelihood) => {
                        const score = impact * likelihood;
                        let bgColor = "bg-emerald-200";
                        if (score > 15) bgColor = "bg-red-500";
                        else if (score > 10) bgColor = "bg-orange-400";
                        else if (score > 5) bgColor = "bg-yellow-300";
                        return (
                          <div key={`${impact}-${likelihood}`} className={`aspect-square ${bgColor} rounded flex items-center justify-center text-xs font-medium`}>
                            {score}
                          </div>
                        );
                      }))}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded" />Critical (16-25)</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-400 rounded" />High (11-15)</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-300 rounded" />Medium (6-10)</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-emerald-200 rounded" />Low (1-5)</div>
                  </div>
                </div>
              </Card>
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

          {/* Bottom Tabs */}
          <div className="mt-8 border-t pt-6">
            <Tabs value={bottomTab} onValueChange={setBottomTab}>
              <TabsList className="bg-muted/50 mb-4">
                <TabsTrigger value="previous-assessments" className="gap-2"><History className="w-4 h-4" />Previous Assessments</TabsTrigger>
                <TabsTrigger value="treatment" className="gap-2"><Target className="w-4 h-4" />Treatment</TabsTrigger>
                <TabsTrigger value="metrics-losses" className="gap-2"><BarChart3 className="w-4 h-4" />Metrics & Losses</TabsTrigger>
              </TabsList>

              <TabsContent value="previous-assessments">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Assessment History</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-3 text-left text-sm font-medium">ID</th>
                          <th className="p-3 text-left text-sm font-medium">Date</th>
                          <th className="p-3 text-left text-sm font-medium">Inherent</th>
                          <th className="p-3 text-left text-sm font-medium">Residual</th>
                          <th className="p-3 text-left text-sm font-medium">Status</th>
                          <th className="p-3 text-left text-sm font-medium">Assessor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previousAssessments.map((a) => (
                          <tr key={a.id} className="border-t">
                            <td className="p-3 font-mono text-sm text-blue-600">{a.id}</td>
                            <td className="p-3 text-sm">{a.date}</td>
                            <td className="p-3"><Badge className={`${getRatingLabel(a.inherent).color} text-white`}>{a.inherent}</Badge></td>
                            <td className="p-3"><Badge className={`${getRatingLabel(a.residual).color} text-white`}>{a.residual}</Badge></td>
                            <td className="p-3"><Badge variant="outline" className="bg-emerald-50 text-emerald-700">{a.status}</Badge></td>
                            <td className="p-3 text-sm">{a.assessor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="treatment">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Risk Treatment Plans</h3>
                  <div className="space-y-3">
                    {treatmentPlans.map((plan) => (
                      <div key={plan.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-blue-600">{plan.id}</span>
                            <Badge variant="outline">{plan.status}</Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">Due: {plan.dueDate}</span>
                        </div>
                        <div className="font-medium mb-1">{plan.action}</div>
                        <div className="text-sm text-muted-foreground mb-2">Owner: {plan.owner}</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${plan.progress}%` }} />
                          </div>
                          <span className="text-sm font-medium">{plan.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="metrics-losses">
                <div className="grid grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">Key Risk Indicators</h3>
                    <div className="space-y-3">
                      {metricsData.kris.map((kri, idx) => (
                        <div key={idx} className="border rounded-lg p-3">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-sm">{kri.name}</span>
                            <span className="text-sm">{kri.current}% / {kri.target}%</span>
                          </div>
                          <div className="bg-muted rounded-full h-2">
                            <div className={`h-2 rounded-full ${kri.current >= kri.target ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min((kri.current/kri.target)*100, 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">Loss Events</h3>
                    <div className="space-y-2">
                      {metricsData.losses.map((loss) => (
                        <div key={loss.id} className="border rounded-lg p-3">
                          <div className="flex justify-between mb-1">
                            <span className="font-mono text-sm text-blue-600">{loss.id}</span>
                            <span className="text-sm text-muted-foreground">{loss.date}</span>
                          </div>
                          <div className="text-sm mb-1">{loss.description}</div>
                          <div className="text-lg font-bold text-red-600">${loss.amount.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Right Icon Toolbar - Fixed on right edge */}
      <div className="fixed top-0 right-0 h-full w-14 bg-background border-l border-border z-50 flex flex-col items-center py-4 gap-1">
        <Button 
          variant="ghost" 
          size="icon"
          className={`w-10 h-10 rounded-lg ${rightPanelOpen && rightPanelTab === 'chat' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : ''}`}
          onClick={() => { setRightPanelOpen(true); setRightPanelTab('chat'); }}
          title="Pending Assessment"
        >
          <ClipboardCheck className="w-5 h-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          className={`w-10 h-10 rounded-lg ${rightPanelOpen && rightPanelTab === 'comments' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : ''}`}
          onClick={() => { setRightPanelOpen(true); setRightPanelTab('comments'); }}
          title="Comments"
        >
          <MessageCircle className="w-5 h-5" />
          {cellComments.filter(c => c.status === 'pending').length > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center">
              {cellComments.filter(c => c.status === 'pending').length}
            </span>
          )}
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          className="w-10 h-10 rounded-lg"
          onClick={() => setCollaborateOpen(true)}
          title="Collaboration"
        >
          <Users className="w-5 h-5" />
        </Button>
        <Separator className="my-2 w-8" />
        <Button 
          variant="ghost" 
          size="icon"
          className={`w-10 h-10 rounded-lg ${rightPanelOpen && rightPanelTab === 'activity' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : ''}`}
          onClick={() => { setRightPanelOpen(true); setRightPanelTab('activity'); }}
          title="Activity Log"
        >
          <History className="w-5 h-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          className="w-10 h-10 rounded-lg"
          title="Metrics & Losses"
          onClick={() => setBottomTab('metrics-losses')}
        >
          <BarChart3 className="w-5 h-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          className="w-10 h-10 rounded-lg"
          title="Additional Details"
        >
          <FileText className="w-5 h-5" />
        </Button>
      </div>

      {/* Right Sliding Panel - Overlay */}
      <div className={`fixed top-0 right-14 h-full w-80 bg-background border-l border-border z-40 transition-transform duration-300 shadow-xl ${rightPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Panel Header */}
          <div className="p-3 border-b flex items-center justify-between bg-muted/30">
            <div className="flex gap-1">
              <Button 
                variant={rightPanelTab === 'chat' ? 'default' : 'ghost'} 
                size="sm" 
                className="h-8 px-3"
                onClick={() => setRightPanelTab('chat')}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Chat
              </Button>
              <Button 
                variant={rightPanelTab === 'comments' ? 'default' : 'ghost'} 
                size="sm" 
                className="h-8 px-3"
                onClick={() => setRightPanelTab('comments')}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Comments
                {cellComments.filter(c => c.status === 'pending').length > 0 && (
                  <Badge className="ml-1 bg-amber-500 text-white text-[10px] px-1">{cellComments.filter(c => c.status === 'pending').length}</Badge>
                )}
              </Button>
              <Button 
                variant={rightPanelTab === 'activity' ? 'default' : 'ghost'} 
                size="sm" 
                className="h-8 px-3"
                onClick={() => setRightPanelTab('activity')}
              >
                <Clock className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRightPanelOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Chat Tab */}
          {rightPanelTab === 'chat' && (
            <>
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`${msg.type === 'system' ? 'text-center' : 'flex gap-2'}`}>
                      {msg.type === 'system' ? (
                        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full inline-block">{msg.message}</div>
                      ) : (
                        <>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-medium shrink-0 ${msg.user === 'You' ? 'bg-blue-600' : 'bg-purple-500'}`}>
                            {msg.avatar}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-xs">{msg.user}</span>
                              <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                            </div>
                            <p className="text-sm">{msg.message}</p>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Type a message..." 
                    className="h-8 text-sm"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  />
                  <Button size="sm" className="h-8 px-2" onClick={handleSendChat}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Comments Tab */}
          {rightPanelTab === 'comments' && (
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {cellComments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-[10px]">{comment.avatar}</div>
                        <span className="font-medium text-xs">{comment.user}</span>
                      </div>
                      <Badge className={`text-[10px] px-1.5 py-0 ${
                        comment.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>{comment.status}</Badge>
                    </div>
                    <div className="text-[10px] text-blue-600 mb-1">{comment.field}</div>
                    <p className="text-sm mb-2">{comment.comment}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">{comment.timestamp}</span>
                      {comment.status === 'pending' && (
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => handleResolveCellComment(comment.id)}>
                          <Check className="w-3 h-3 mr-1" />Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Activity Tab */}
          {rightPanelTab === 'activity' && (
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {activityLog.map((activity) => (
                  <div key={activity.id} className="flex gap-2 text-sm">
                    <div className="w-6 h-6 rounded-full bg-slate-500 flex items-center justify-center text-white text-[10px] shrink-0">
                      {activity.avatar}
                    </div>
                    <div>
                      <span className="font-medium">{activity.user}</span>
                      <span className="text-muted-foreground"> {activity.action}</span>
                      <div className="text-[10px] text-muted-foreground">{activity.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskAssessmentForm;
