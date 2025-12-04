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
  ThumbsUp,
  ThumbsDown,
  Reply,
  ChevronDown,
  ChevronUp
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
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger 
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
}

interface Control {
  id: string;
  name: string;
  type: string;
  owner: string;
  designRating: number;
  operatingRating: number;
  testingRating: number;
}

interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  message: string;
  timestamp: string;
  type: 'message' | 'system';
}

interface ReviewComment {
  id: string;
  user: string;
  avatar: string;
  section: string;
  comment: string;
  status: 'pending' | 'resolved' | 'disputed';
  timestamp: string;
  replies: { user: string; avatar: string; message: string; timestamp: string }[];
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
  const [chatOpen, setChatOpen] = useState(false);
  const [collaborateOpen, setCollaborateOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  
  // Chat messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "1", user: "Sarah Johnson", avatar: "SJ", message: "I've updated the financial impact rating based on the latest audit findings.", timestamp: "10:32 AM", type: "message" },
    { id: "2", user: "System", avatar: "S", message: "Michael Chen joined the assessment", timestamp: "10:35 AM", type: "system" },
    { id: "3", user: "Michael Chen", avatar: "MC", message: "Looks good. Should we increase the regulatory impact given the new compliance requirements?", timestamp: "10:38 AM", type: "message" },
    { id: "4", user: "Emily Roberts", avatar: "ER", message: "I agree with Michael. The regulatory landscape has changed significantly.", timestamp: "10:42 AM", type: "message" },
  ]);

  // Collaborators
  const [collaborators] = useState<Collaborator[]>([
    { id: "1", name: "Sarah Johnson", email: "sarah.j@company.com", avatar: "SJ", role: "Risk Manager", status: "editing", lastActive: "Now" },
    { id: "2", name: "Michael Chen", email: "m.chen@company.com", avatar: "MC", role: "Compliance Officer", status: "online", lastActive: "2 min ago" },
    { id: "3", name: "Emily Roberts", email: "e.roberts@company.com", avatar: "ER", role: "Auditor", status: "online", lastActive: "5 min ago" },
    { id: "4", name: "David Kim", email: "d.kim@company.com", avatar: "DK", role: "Business Analyst", status: "offline", lastActive: "1 hour ago" },
  ]);

  // Review comments
  const [reviewComments, setReviewComments] = useState<ReviewComment[]>([
    { 
      id: "1", 
      user: "Quality Assurance Team", 
      avatar: "QA", 
      section: "Inherent Rating", 
      comment: "Please provide more detailed justification for the High (4) reputational impact rating.", 
      status: "pending", 
      timestamp: "Yesterday at 3:45 PM",
      replies: []
    },
    { 
      id: "2", 
      user: "Risk Committee", 
      avatar: "RC", 
      section: "Control Effectiveness", 
      comment: "The KYC Verification Process control seems underrated. Recent test results show better performance.", 
      status: "resolved", 
      timestamp: "2 days ago",
      replies: [
        { user: "Sarah Johnson", avatar: "SJ", message: "Updated the rating based on the latest test results.", timestamp: "Yesterday" }
      ]
    },
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
    { id: "1", name: "Financial Impact", description: "Impact on financial performance", rating: 3, comments: "Significant financial impact due to penalties and remediation costs", weightage: 30 },
    { id: "2", name: "Reputational Impact", description: "Impact on brand and reputation", rating: 4, comments: "Major reputational damage if regulatory issues become public", weightage: 25 },
    { id: "3", name: "Operational Impact", description: "Impact on day-to-day operations", rating: 3, comments: "Operational disruptions due to compliance remediation activities", weightage: 20 },
    { id: "4", name: "Regulatory Impact", description: "Impact related to regulatory oversight", rating: 4, comments: "High regulatory scrutiny and potential for enforcement actions", weightage: 25 },
  ]);
  
  // Controls
  const [controls, setControls] = useState<Control[]>([
    { id: "CTL-001", name: "KYC Verification Process", type: "Preventive", owner: "Compliance Team", designRating: 3, operatingRating: 2, testingRating: 3 },
    { id: "CTL-002", name: "Customer Due Diligence", type: "Detective", owner: "Risk Management", designRating: 4, operatingRating: 3, testingRating: 3 },
    { id: "CTL-003", name: "Periodic Review Process", type: "Preventive", owner: "Operations", designRating: 3, operatingRating: 3, testingRating: 2 },
  ]);
  
  // Residual Risk Factors
  const [residualFactors, setResidualFactors] = useState<Factor[]>([
    { id: "1", name: "Post-Control Financial Impact", description: "Financial impact after controls", rating: 2, comments: "Reduced financial exposure with controls in place", weightage: 30 },
    { id: "2", name: "Post-Control Reputational Impact", description: "Reputational impact after controls", rating: 2, comments: "Better managed reputational risk", weightage: 25 },
    { id: "3", name: "Post-Control Operational Impact", description: "Operational impact after controls", rating: 2, comments: "Streamlined operations with controls", weightage: 20 },
    { id: "4", name: "Post-Control Regulatory Impact", description: "Regulatory impact after controls", rating: 2, comments: "Improved compliance posture", weightage: 25 },
  ]);

  // Set active tab from URL
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
    toast.success("Message sent");
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

  const inherentScore = parseFloat(calculateInherentScore());
  const controlScore = parseFloat(calculateControlScore());
  const residualScore = parseFloat(calculateResidualScore());
  const riskReduction = (inherentScore - residualScore).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-[1800px] mx-auto px-4 py-3">
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
              {/* Chat Button */}
              <Sheet open={chatOpen} onOpenChange={setChatOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat
                    <Badge className="ml-2 bg-red-500 text-white text-xs px-1.5">{chatMessages.length}</Badge>
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Team Chat
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col h-[calc(100vh-120px)] mt-4">
                    <ScrollArea className="flex-1 pr-4">
                      <div className="space-y-4">
                        {chatMessages.map((msg) => (
                          <div key={msg.id} className={`flex gap-3 ${msg.type === 'system' ? 'justify-center' : ''}`}>
                            {msg.type === 'system' ? (
                              <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                {msg.message}
                              </div>
                            ) : (
                              <>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0 ${
                                  msg.user === 'You' ? 'bg-blue-600' : 'bg-purple-500'
                                }`}>
                                  {msg.avatar}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{msg.user}</span>
                                    <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                                  </div>
                                  <p className="text-sm text-foreground mt-1">{msg.message}</p>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="border-t pt-4 mt-4">
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Type a message..." 
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                        />
                        <Button onClick={handleSendChat}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

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
                    {/* AI Summary */}
                    <div>
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        AI-Generated Summary
                      </h3>
                      <Card className="p-4 bg-muted/50">
                        <p className="text-sm text-foreground">
                          <strong>Risk Assessment Summary for {riskName}</strong><br/><br/>
                          The assessment identifies a <strong>Medium ({inherentScore})</strong> inherent risk level, primarily driven by high regulatory and reputational impacts. 
                          With current controls achieving <strong>{getRatingLabel(controlScore).label} ({controlScore})</strong> effectiveness, the residual risk stands at <strong>{getRatingLabel(residualScore).label} ({residualScore})</strong>, 
                          representing a <strong>{riskReduction} point</strong> risk reduction.<br/><br/>
                          <strong>Key Findings:</strong>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Financial impact rated Medium due to potential penalties</li>
                            <li>Reputational impact rated High - requires attention</li>
                            <li>Control effectiveness could be improved in operating procedures</li>
                          </ul>
                        </p>
                      </Card>
                    </div>

                    {/* Export Options */}
                    <div>
                      <h3 className="font-medium mb-3">Export Options</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleExport('PDF')}>
                          <FileText className="w-6 h-6 text-red-500" />
                          <span>Export as PDF</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleExport('Excel')}>
                          <BarChart3 className="w-6 h-6 text-emerald-500" />
                          <span>Export as Excel</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleExport('Word')}>
                          <FileText className="w-6 h-6 text-blue-500" />
                          <span>Export as Word</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleExport('JSON')}>
                          <Download className="w-6 h-6 text-purple-500" />
                          <span>Export as JSON</span>
                        </Button>
                      </div>
                    </div>

                    {/* Share Options */}
                    <div>
                      <h3 className="font-medium mb-3">Share</h3>
                      <div className="flex gap-2">
                        <Input placeholder="Enter email addresses..." className="flex-1" />
                        <Button>
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
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
                  <div className="space-y-6 py-4">
                    {/* Invite */}
                    <div>
                      <h3 className="font-medium mb-3">Invite Collaborators</h3>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Enter email address..." 
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                        <Button onClick={handleInvite}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Invite
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Current Collaborators */}
                    <div>
                      <h3 className="font-medium mb-3">Current Collaborators ({collaborators.length})</h3>
                      <div className="space-y-3">
                        {collaborators.map((c) => (
                          <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                c.status === 'editing' ? 'bg-blue-500' : c.status === 'online' ? 'bg-emerald-500' : 'bg-gray-400'
                              }`}>
                                {c.avatar}
                              </div>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {c.name}
                                  {c.status === 'editing' && (
                                    <Badge className="bg-blue-100 text-blue-700 text-xs">Editing</Badge>
                                  )}
                                  {c.status === 'online' && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">{c.role}</div>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">{c.lastActive}</div>
                          </div>
                        ))}
                      </div>
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
      <div className="max-w-[1800px] mx-auto px-4 py-6">
        {/* Risk Info Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-6 h-6 rounded-full border-2 border-blue-500" />
                <h1 className="text-2xl font-bold text-foreground">
                  Assess Risk: {riskName}
                </h1>
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                  Pending Review
                </Badge>
                <span className="text-muted-foreground font-mono">{riskId}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Assessment ID: <span className="text-blue-600 font-medium">ASM-1043</span></span>
                <span>•</span>
                <span>Date: 2025-04-10</span>
              </div>
            </div>
          </div>
          
          {/* Risk Hierarchy & Appetite */}
          <div className="flex items-center gap-6 mb-6 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Risk Hierarchy:</span>
              <span className="text-blue-600">Compliance Risk</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="text-blue-600">Regulatory Risk</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="text-blue-600">KYC Risk</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Risk Appetite:</span>
              <Badge className="bg-red-100 text-red-700">Low</Badge>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Within Appetite
              </Badge>
            </div>
          </div>

          {/* Score Cards */}
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <Card className={`px-6 py-4 ${getRatingLabel(inherentScore).color} text-white`}>
              <div className="text-xs opacity-90 mb-1">Inherent Risk</div>
              <div className="text-2xl font-bold">{inherentScore}</div>
              <div className="text-sm">{getRatingLabel(inherentScore).label}</div>
            </Card>
            <Card className={`px-6 py-4 ${getRatingLabel(controlScore).color} text-white`}>
              <div className="text-xs opacity-90 mb-1">Control Effectiveness</div>
              <div className="text-2xl font-bold">{controlScore}</div>
              <div className="text-sm">{getRatingLabel(controlScore).label}</div>
            </Card>
            <Card className={`px-6 py-4 ${getRatingLabel(residualScore).color} text-white`}>
              <div className="text-xs opacity-90 mb-1">Residual Risk</div>
              <div className="text-2xl font-bold">{residualScore}</div>
              <div className="text-sm">{getRatingLabel(residualScore).label}</div>
            </Card>
            <Card className="px-6 py-4 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900">
              <div className="text-xs text-muted-foreground mb-1">Risk Reduction</div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-2xl font-bold text-emerald-600">{riskReduction}</span>
              </div>
              <div className="text-sm text-muted-foreground">points</div>
            </Card>
            <div className="ml-auto">
              <Button variant="outline" className="gap-2">
                <Shield className="w-4 h-4" />
                Associated Risks
                <Badge className="bg-blue-100 text-blue-700 ml-1">3</Badge>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 p-0 h-auto flex-wrap">
            <TabsTrigger 
              value="inherent-rating" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent px-4 py-3 gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Inherent Rating
              <Badge variant="outline" className="ml-1 text-xs">1</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="control-effectiveness" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-4 py-3 gap-2"
            >
              <Shield className="w-4 h-4" />
              Control Effectiveness
              <Badge variant="outline" className="ml-1 text-xs">2</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="residual-rating" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent px-4 py-3 gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Residual Rating
              <Badge variant="outline" className="ml-1 text-xs">3</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="heat-map" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent px-4 py-3 gap-2"
            >
              Heat Map
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </TabsTrigger>
            <TabsTrigger 
              value="issues" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent px-4 py-3 gap-2"
            >
              Issues
              <Badge className="bg-red-100 text-red-700 ml-1 text-xs">5</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Inherent Rating Tab */}
          <TabsContent value="inherent-rating" className="space-y-4">
            <Card className="p-6">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">Overall Inherent Risk Rating</h2>
                  <p className="text-sm text-muted-foreground">Calculated based on weighted impact factors</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" className="gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Show Trend
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setShowWeights(!showWeights)}
                  >
                    {showWeights ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showWeights ? "Hide" : "Show"} Weights
                  </Button>
                  <div className={`px-4 py-2 rounded-lg ${getRatingLabel(inherentScore).color} text-white`}>
                    <div className="text-xs opacity-90">Score: {inherentScore}</div>
                    <div className="font-semibold">{getRatingLabel(inherentScore).label}</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Configure impact factors and ratings for inherent risk assessment
                </p>
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white gap-2"
                  onClick={handleAiAutofill}
                  disabled={isAiLoading}
                >
                  <Sparkles className="w-4 h-4" />
                  {isAiLoading ? "Analyzing..." : "AI Autofill All"}
                </Button>
              </div>

              {/* Collaboration Notice */}
              <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm text-emerald-700 dark:text-emerald-300">
                  Live collaboration active! Watch for colored badges on cells showing who's editing in real time.
                </span>
                <div className="ml-auto flex -space-x-1">
                  {collaborators.filter(c => c.status !== 'offline').slice(0, 3).map((c) => (
                    <div key={c.id} className={`w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-white text-[10px] font-medium ${
                      c.status === 'editing' ? 'bg-blue-500' : 'bg-emerald-500'
                    }`}>
                      {c.avatar}
                    </div>
                  ))}
                </div>
              </div>

              {/* Factors Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="w-10 p-3 text-left">
                        <Checkbox />
                      </th>
                      <th className="p-3 text-left text-sm font-medium">Factor & Description</th>
                      <th className="p-3 text-left text-sm font-medium w-32">Rating</th>
                      <th className="p-3 text-left text-sm font-medium">Comments</th>
                      {showWeights && (
                        <th className="p-3 text-left text-sm font-medium w-32">Factor Weightage (%)</th>
                      )}
                      <th className="p-3 text-left text-sm font-medium w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inherentFactors.map((factor) => (
                      <tr key={factor.id} className="border-t hover:bg-muted/30">
                        <td className="p-3">
                          <Checkbox />
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{factor.name}</div>
                          <div className="text-sm text-muted-foreground">{factor.description}</div>
                        </td>
                        <td className="p-3">
                          <Select 
                            value={factor.rating.toString()} 
                            onValueChange={(v) => updateFactorRating(inherentFactors, setInherentFactors, factor.id, parseInt(v))}
                          >
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
                        </td>
                        <td className="p-3">
                          <Textarea 
                            value={factor.comments}
                            onChange={(e) => updateFactorComment(inherentFactors, setInherentFactors, factor.id, e.target.value)}
                            className="min-h-[60px] resize-none"
                          />
                        </td>
                        {showWeights && (
                          <td className="p-3 text-center font-medium">{factor.weightage}</td>
                        )}
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button variant="outline" className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Add Row
              </Button>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" className="gap-2" disabled>
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setActiveTab("control-effectiveness")}>
                Continue to Control Effectiveness
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Control Effectiveness Tab */}
          <TabsContent value="control-effectiveness" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">Control Effectiveness Assessment</h2>
                  <p className="text-sm text-muted-foreground">Evaluate design, operating effectiveness, and testing results</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 rounded-lg ${getRatingLabel(controlScore).color} text-white`}>
                    <div className="text-xs opacity-90">Score: {controlScore}</div>
                    <div className="font-semibold">{getRatingLabel(controlScore).label}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Rate controls based on design effectiveness, operating effectiveness, and testing results
                </p>
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white gap-2"
                  onClick={handleAiAutofill}
                  disabled={isAiLoading}
                >
                  <Sparkles className="w-4 h-4" />
                  {isAiLoading ? "Analyzing..." : "AI Autofill All"}
                </Button>
              </div>

              {/* Controls Table */}
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="w-10 p-3 text-left">
                        <Checkbox />
                      </th>
                      <th className="p-3 text-left text-sm font-medium">Control ID</th>
                      <th className="p-3 text-left text-sm font-medium">Control Name</th>
                      <th className="p-3 text-left text-sm font-medium">Type</th>
                      <th className="p-3 text-left text-sm font-medium">Owner</th>
                      <th className="p-3 text-left text-sm font-medium w-28">Design</th>
                      <th className="p-3 text-left text-sm font-medium w-28">Operating</th>
                      <th className="p-3 text-left text-sm font-medium w-28">Testing</th>
                      <th className="p-3 text-left text-sm font-medium w-20">Avg</th>
                      <th className="p-3 text-left text-sm font-medium w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {controls.map((control) => {
                      const avg = ((control.designRating + control.operatingRating + control.testingRating) / 3).toFixed(1);
                      return (
                        <tr key={control.id} className="border-t hover:bg-muted/30">
                          <td className="p-3">
                            <Checkbox />
                          </td>
                          <td className="p-3 font-mono text-sm text-blue-600">{control.id}</td>
                          <td className="p-3 font-medium">{control.name}</td>
                          <td className="p-3">
                            <Badge variant="outline" className={control.type === "Preventive" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}>
                              {control.type}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">{control.owner}</td>
                          <td className="p-3">
                            <Select 
                              value={control.designRating.toString()} 
                              onValueChange={(v) => updateControlRating(control.id, 'designRating', parseInt(v))}
                            >
                              <SelectTrigger className="w-full bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-background border shadow-lg z-50">
                                {[1, 2, 3, 4, 5].map(n => (
                                  <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3">
                            <Select 
                              value={control.operatingRating.toString()} 
                              onValueChange={(v) => updateControlRating(control.id, 'operatingRating', parseInt(v))}
                            >
                              <SelectTrigger className="w-full bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-background border shadow-lg z-50">
                                {[1, 2, 3, 4, 5].map(n => (
                                  <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3">
                            <Select 
                              value={control.testingRating.toString()} 
                              onValueChange={(v) => updateControlRating(control.id, 'testingRating', parseInt(v))}
                            >
                              <SelectTrigger className="w-full bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-background border shadow-lg z-50">
                                {[1, 2, 3, 4, 5].map(n => (
                                  <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3">
                            <Badge className={`${getRatingLabel(parseFloat(avg)).color} text-white`}>
                              {avg}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Button variant="outline" className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Add Control
              </Button>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" className="gap-2" onClick={() => setActiveTab("inherent-rating")}>
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => setActiveTab("residual-rating")}>
                Continue to Residual Rating
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Residual Rating Tab */}
          <TabsContent value="residual-rating" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">Residual Risk Rating</h2>
                  <p className="text-sm text-muted-foreground">Risk rating after applying controls</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 rounded-lg ${getRatingLabel(residualScore).color} text-white`}>
                    <div className="text-xs opacity-90">Score: {residualScore}</div>
                    <div className="font-semibold">{getRatingLabel(residualScore).label}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Assess residual risk factors after control mitigation
                </p>
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white gap-2"
                  onClick={handleAiAutofill}
                  disabled={isAiLoading}
                >
                  <Sparkles className="w-4 h-4" />
                  {isAiLoading ? "Analyzing..." : "AI Autofill All"}
                </Button>
              </div>

              {/* Factors Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="w-10 p-3 text-left">
                        <Checkbox />
                      </th>
                      <th className="p-3 text-left text-sm font-medium">Factor & Description</th>
                      <th className="p-3 text-left text-sm font-medium w-32">Rating</th>
                      <th className="p-3 text-left text-sm font-medium">Comments</th>
                      {showWeights && (
                        <th className="p-3 text-left text-sm font-medium w-32">Factor Weightage (%)</th>
                      )}
                      <th className="p-3 text-left text-sm font-medium w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {residualFactors.map((factor) => (
                      <tr key={factor.id} className="border-t hover:bg-muted/30">
                        <td className="p-3">
                          <Checkbox />
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{factor.name}</div>
                          <div className="text-sm text-muted-foreground">{factor.description}</div>
                        </td>
                        <td className="p-3">
                          <Select 
                            value={factor.rating.toString()} 
                            onValueChange={(v) => updateFactorRating(residualFactors, setResidualFactors, factor.id, parseInt(v))}
                          >
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
                        </td>
                        <td className="p-3">
                          <Textarea 
                            value={factor.comments}
                            onChange={(e) => updateFactorComment(residualFactors, setResidualFactors, factor.id, e.target.value)}
                            className="min-h-[60px] resize-none"
                          />
                        </td>
                        {showWeights && (
                          <td className="p-3 text-center font-medium">{factor.weightage}</td>
                        )}
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button variant="outline" className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Add Row
              </Button>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" className="gap-2" onClick={() => setActiveTab("control-effectiveness")}>
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button className="gap-2 bg-purple-600 hover:bg-purple-700" onClick={() => setActiveTab("heat-map")}>
                View Heat Map
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Heat Map Tab */}
          <TabsContent value="heat-map" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Risk Heat Map</h2>
              <div className="flex gap-8">
                <div>
                  <div className="text-sm text-muted-foreground mb-2 text-center">Impact ↑</div>
                  <div className="grid grid-cols-5 gap-1" style={{ width: '250px' }}>
                    {[5, 4, 3, 2, 1].map((impact) => (
                      [1, 2, 3, 4, 5].map((likelihood) => {
                        const score = impact * likelihood;
                        let bgColor = "bg-emerald-200 dark:bg-emerald-900";
                        if (score > 15) bgColor = "bg-red-500";
                        else if (score > 10) bgColor = "bg-orange-400";
                        else if (score > 5) bgColor = "bg-yellow-300 dark:bg-yellow-600";
                        
                        const isCurrentInherent = Math.round(inherentScore) === likelihood && impact === Math.round(inherentScore);
                        const isCurrentResidual = Math.round(residualScore) === likelihood && impact === Math.round(residualScore);
                        
                        return (
                          <div 
                            key={`${impact}-${likelihood}`} 
                            className={`aspect-square ${bgColor} rounded flex items-center justify-center text-xs font-medium relative`}
                          >
                            {score}
                            {isCurrentInherent && (
                              <div className="absolute inset-0 border-2 border-orange-600 rounded" />
                            )}
                            {isCurrentResidual && (
                              <div className="absolute inset-0 border-2 border-emerald-600 rounded" />
                            )}
                          </div>
                        );
                      })
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2 text-center">Likelihood →</div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-orange-600 rounded" />
                      <span className="text-sm">Inherent Risk ({inherentScore})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-emerald-600 rounded" />
                      <span className="text-sm">Residual Risk ({residualScore})</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded" />
                      <span className="text-sm">Critical (16-25)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-400 rounded" />
                      <span className="text-sm">High (11-15)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-300 rounded" />
                      <span className="text-sm">Medium (6-10)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-emerald-200 rounded" />
                      <span className="text-sm">Low (1-5)</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Issues Tab */}
          <TabsContent value="issues" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Related Issues</h2>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Link Issue
                </Button>
              </div>
              <div className="space-y-3">
                {[
                  { id: "ISS-1001", title: "KYC documentation gaps identified", severity: "High", status: "Open", owner: "Compliance" },
                  { id: "ISS-1002", title: "Delayed customer verification process", severity: "Medium", status: "In Progress", owner: "Operations" },
                  { id: "ISS-1003", title: "Missing audit trail for customer updates", severity: "High", status: "Open", owner: "IT" },
                  { id: "ISS-1004", title: "Training gaps in new compliance requirements", severity: "Medium", status: "Resolved", owner: "HR" },
                  { id: "ISS-1005", title: "System integration errors", severity: "Low", status: "Open", owner: "IT" },
                ].map((issue) => (
                  <div key={issue.id} className="p-4 border rounded-lg flex items-center justify-between hover:bg-muted/30">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm text-blue-600">{issue.id}</span>
                      <div>
                        <div className="font-medium">{issue.title}</div>
                        <div className="text-sm text-muted-foreground">Owner: {issue.owner}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={
                        issue.severity === "High" ? "bg-red-100 text-red-700" :
                        issue.severity === "Medium" ? "bg-amber-100 text-amber-700" :
                        "bg-blue-100 text-blue-700"
                      }>
                        {issue.severity}
                      </Badge>
                      <Badge variant="outline" className={
                        issue.status === "Open" ? "bg-red-50 text-red-700 border-red-200" :
                        issue.status === "In Progress" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }>
                        {issue.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom Section Tabs */}
        <div className="mt-8 border-t pt-6">
          <Tabs value={bottomTab} onValueChange={setBottomTab}>
            <TabsList className="bg-muted/50 mb-4">
              <TabsTrigger value="previous-assessments" className="gap-2">
                <History className="w-4 h-4" />
                Previous Assessments
              </TabsTrigger>
              <TabsTrigger value="review-challenge" className="gap-2">
                <ClipboardCheck className="w-4 h-4" />
                Review & Challenge
              </TabsTrigger>
              <TabsTrigger value="treatment" className="gap-2">
                <Target className="w-4 h-4" />
                Treatment
              </TabsTrigger>
              <TabsTrigger value="metrics-losses" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Metrics & Losses
              </TabsTrigger>
              <TabsTrigger value="additional-details" className="gap-2">
                <FileText className="w-4 h-4" />
                Additional Details
              </TabsTrigger>
            </TabsList>

            {/* Previous Assessments */}
            <TabsContent value="previous-assessments">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Assessment History</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-3 text-left text-sm font-medium">Assessment ID</th>
                        <th className="p-3 text-left text-sm font-medium">Date</th>
                        <th className="p-3 text-left text-sm font-medium">Inherent Risk</th>
                        <th className="p-3 text-left text-sm font-medium">Residual Risk</th>
                        <th className="p-3 text-left text-sm font-medium">Status</th>
                        <th className="p-3 text-left text-sm font-medium">Assessor</th>
                        <th className="p-3 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previousAssessments.map((assessment) => (
                        <tr key={assessment.id} className="border-t hover:bg-muted/30">
                          <td className="p-3 font-mono text-sm text-blue-600">{assessment.id}</td>
                          <td className="p-3 text-sm">{assessment.date}</td>
                          <td className="p-3">
                            <Badge className={`${getRatingLabel(assessment.inherent).color} text-white`}>
                              {assessment.inherent}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={`${getRatingLabel(assessment.residual).color} text-white`}>
                              {assessment.residual}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                              {assessment.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">{assessment.assessor}</td>
                          <td className="p-3">
                            <Button variant="ghost" size="sm">View</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            {/* Review & Challenge */}
            <TabsContent value="review-challenge">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Review Comments & Challenges</h3>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Comment
                  </Button>
                </div>
                <div className="space-y-4">
                  {reviewComments.map((comment) => (
                    <div key={comment.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-medium">
                            {comment.avatar}
                          </div>
                          <div>
                            <div className="font-medium">{comment.user}</div>
                            <div className="text-sm text-muted-foreground">{comment.timestamp}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{comment.section}</Badge>
                          <Badge className={
                            comment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            comment.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {comment.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm mb-3">{comment.comment}</p>
                      {comment.replies.length > 0 && (
                        <div className="ml-8 space-y-2 border-l-2 border-muted pl-4">
                          {comment.replies.map((reply, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-medium">
                                {reply.avatar}
                              </div>
                              <div>
                                <div className="text-sm">
                                  <span className="font-medium">{reply.user}</span>
                                  <span className="text-muted-foreground ml-2">{reply.timestamp}</span>
                                </div>
                                <p className="text-sm">{reply.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Reply className="w-3 h-3" />
                          Reply
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1 text-emerald-600">
                          <Check className="w-3 h-3" />
                          Resolve
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1 text-amber-600">
                          <AlertCircle className="w-3 h-3" />
                          Dispute
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Treatment */}
            <TabsContent value="treatment">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Risk Treatment Plans</h3>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Treatment
                  </Button>
                </div>
                <div className="space-y-4">
                  {treatmentPlans.map((plan) => (
                    <div key={plan.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm text-blue-600">{plan.id}</span>
                            <Badge variant="outline" className={
                              plan.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                              plan.status === 'Planned' ? 'bg-amber-50 text-amber-700' :
                              'bg-gray-50 text-gray-700'
                            }>
                              {plan.status}
                            </Badge>
                          </div>
                          <div className="font-medium">{plan.action}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Owner: {plan.owner} | Due: {plan.dueDate}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${plan.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{plan.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Metrics & Losses */}
            <TabsContent value="metrics-losses">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Key Risk Indicators (KRIs)</h3>
                  <div className="space-y-4">
                    {metricsData.kris.map((kri, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{kri.name}</span>
                          <Badge variant="outline" className={
                            kri.trend === 'up' ? 'text-emerald-700' :
                            kri.trend === 'down' ? 'text-red-700' :
                            'text-amber-700'
                          }>
                            {kri.trend === 'up' ? '↑' : kri.trend === 'down' ? '↓' : '→'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Current: <strong>{kri.current}%</strong></span>
                          <span className="text-muted-foreground">Target: {kri.target}%</span>
                        </div>
                        <div className="mt-2 bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${kri.current >= kri.target ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min((kri.current / kri.target) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Loss Events</h3>
                  <div className="space-y-3">
                    {metricsData.losses.map((loss) => (
                      <div key={loss.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm text-blue-600">{loss.id}</span>
                          <span className="text-sm text-muted-foreground">{loss.date}</span>
                        </div>
                        <div className="font-medium mb-1">{loss.description}</div>
                        <div className="text-lg font-bold text-red-600">
                          ${loss.amount.toLocaleString()}
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-3 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Total Losses</span>
                        <span className="text-xl font-bold text-red-600">
                          ${metricsData.losses.reduce((sum, l) => sum + l.amount, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Additional Details */}
            <TabsContent value="additional-details">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Risk Owner</label>
                      <Input defaultValue="John Smith - Chief Risk Officer" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Business Unit</label>
                      <Input defaultValue="Retail Banking Operations" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Risk Category</label>
                      <Input defaultValue="Compliance / Regulatory" className="mt-1" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Review Date</label>
                      <Input defaultValue="2024-10-15" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Next Review Date</label>
                      <Input defaultValue="2025-04-15" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Regulatory Reference</label>
                      <Input defaultValue="AML/KYC Directive 2018/843" className="mt-1" />
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <label className="text-sm font-medium text-muted-foreground">Notes & Comments</label>
                  <Textarea 
                    className="mt-1 min-h-[100px]" 
                    defaultValue="This risk assessment covers the KYC compliance framework for retail banking operations. Key focus areas include customer onboarding, ongoing due diligence, and regulatory reporting requirements."
                  />
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default RiskAssessmentForm;
