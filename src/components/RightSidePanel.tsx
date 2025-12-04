import React, { useState } from "react";
import { History, Scale, Target, Shield, Clipboard, BarChart3, FileText, MessageSquareWarning, Clock, Info, Copy, Bell, MessageSquare, AtSign, CheckCircle, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import TreatmentSection from "@/components/TreatmentSection";
import MetricsAndLossesSection from "@/components/MetricsAndLossesSection";
import CommentsAttachmentsSection from "@/components/CommentsAttachmentsSection";
import { getScoreColor, getScoreLabel } from "@/utils/rating-utils";
import { getRatingColor } from "@/utils/control-utils";
import { FactorType, Control } from "@/types/control-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "@/contexts/FormContext";
import { useCellComments, CellComment, CellNotification } from "@/contexts/CellCommentsContext";
import { format, formatDistanceToNow } from "date-fns";
import { useAssessmentNavigation } from "@/contexts/AssessmentNavigationContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Sample data for previous assessments
const INHERENT_HISTORICAL = [
  { date: "2024-03-15", score: "3.7", factors: [
    { id: "1", name: "Financial Impact", value: "3", weighting: "30", type: "child" as FactorType, comments: "" },
    { id: "2", name: "Reputational Impact", value: "4", weighting: "25", type: "child" as FactorType, comments: "" },
    { id: "3", name: "Operational Impact", value: "3", weighting: "20", type: "child" as FactorType, comments: "" },
    { id: "4", name: "Regulatory Impact", value: "4", weighting: "25", type: "child" as FactorType, comments: "" }
  ]},
  { date: "2023-12-10", score: "3.9", factors: [
    { id: "1", name: "Financial Impact", value: "4", weighting: "30", type: "child" as FactorType, comments: "" },
    { id: "2", name: "Reputational Impact", value: "4", weighting: "25", type: "child" as FactorType, comments: "" },
    { id: "3", name: "Operational Impact", value: "3", weighting: "20", type: "child" as FactorType, comments: "" },
    { id: "4", name: "Regulatory Impact", value: "4", weighting: "25", type: "child" as FactorType, comments: "" }
  ]},
  { date: "2023-09-05", score: "3.5", factors: [
    { id: "1", name: "Financial Impact", value: "3", weighting: "30", type: "child" as FactorType, comments: "" },
    { id: "2", name: "Reputational Impact", value: "3", weighting: "25", type: "child" as FactorType, comments: "" },
    { id: "3", name: "Operational Impact", value: "4", weighting: "20", type: "child" as FactorType, comments: "" },
    { id: "4", name: "Regulatory Impact", value: "3", weighting: "25", type: "child" as FactorType, comments: "" }
  ]},
];

const CONTROL_HISTORICAL: { date: string; score: string; controls: Control[] }[] = [
  { date: "2024-03-15", score: "2.3", controls: [
    { id: "1", controlId: "CTL-001", name: "Access Control Management", effectiveness: "3", weighting: "25", designEffect: "effective", operativeEffect: "partially", isKeyControl: true, category: "preventive", comments: "Works well" },
    { id: "2", controlId: "CTL-002", name: "Change Management Process", effectiveness: "2", weighting: "25", designEffect: "highly", operativeEffect: "effective", isKeyControl: false, category: "detective", comments: "Good process" },
    { id: "3", controlId: "CTL-003", name: "Incident Response", effectiveness: "2", weighting: "25", designEffect: "effective", operativeEffect: "effective", isKeyControl: true, category: "corrective", comments: "" },
    { id: "4", controlId: "CTL-004", name: "Monitoring & Logging", effectiveness: "3", weighting: "25", designEffect: "partially", operativeEffect: "effective", isKeyControl: false, category: "detective", comments: "" }
  ]},
  { date: "2023-12-10", score: "2.5", controls: [
    { id: "1", controlId: "CTL-001", name: "Access Control Management", effectiveness: "3", weighting: "25", designEffect: "effective", operativeEffect: "partially", isKeyControl: true, category: "preventive", comments: "" },
    { id: "2", controlId: "CTL-002", name: "Change Management Process", effectiveness: "2", weighting: "25", designEffect: "effective", operativeEffect: "effective", isKeyControl: false, category: "detective", comments: "" }
  ]},
  { date: "2023-09-05", score: "2.8", controls: [] },
];

const RESIDUAL_HISTORICAL = [
  { date: "2024-03-15", score: "2.4", factors: [
    { id: "1", name: "Adjusted Financial Impact", value: "2", weighting: "30", type: "child" as FactorType, comments: "" },
    { id: "2", name: "Adjusted Reputational Impact", value: "3", weighting: "25", type: "child" as FactorType, comments: "" },
    { id: "3", name: "Adjusted Operational Impact", value: "2", weighting: "20", type: "child" as FactorType, comments: "" },
    { id: "4", name: "Adjusted Regulatory Impact", value: "3", weighting: "25", type: "child" as FactorType, comments: "" }
  ]},
  { date: "2023-12-10", score: "3.2", factors: [
    { id: "1", name: "Adjusted Financial Impact", value: "3", weighting: "30", type: "child" as FactorType, comments: "" },
    { id: "2", name: "Adjusted Reputational Impact", value: "3", weighting: "25", type: "child" as FactorType, comments: "" }
  ]},
  { date: "2023-09-05", score: "3.5", factors: [] },
];

type PanelTab = "assessments" | "review" | "treatment" | "metrics" | "details";

interface TabConfig {
  id: PanelTab;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  { id: "assessments", label: "Previous Assessments", icon: <History className="h-4 w-4" /> },
  { id: "review", label: "Review & Challenge", icon: <MessageSquareWarning className="h-4 w-4" /> },
  { id: "treatment", label: "Treatment", icon: <Clipboard className="h-4 w-4" /> },
  { id: "metrics", label: "Metrics & Losses", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "details", label: "Additional Details", icon: <FileText className="h-4 w-4" /> },
];

const SECTION_LABELS: Record<string, string> = {
  inherent: "Inherent Risk",
  control: "Control Effectiveness",
  residual: "Residual Rating",
};

const NotificationsList = ({ 
  notifications, 
  onMarkRead,
  onResolve,
  comments
}: { 
  notifications: CellNotification[]; 
  onMarkRead: (id: string) => void;
  onResolve: (commentId: string) => void;
  comments: CellComment[];
}) => {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Bell className="h-6 w-6 mb-2 opacity-50" />
        <p className="text-xs">No notifications</p>
      </div>
    );
  }

  const getRelatedComment = (notification: CellNotification) => {
    return comments.find(c => c.id === notification.commentId && !c.resolved);
  };

  return (
    <div className="divide-y">
      {notifications.map(notification => {
        const relatedComment = getRelatedComment(notification);
        return (
          <div
            key={notification.id}
            className={cn(
              "p-2.5 hover:bg-muted/50 transition-colors cursor-pointer",
              !notification.read && "bg-blue-50/50"
            )}
            onClick={() => onMarkRead(notification.id)}
          >
            <div className="flex items-start gap-2">
              <div className={cn(
                "p-1 rounded-full flex-shrink-0",
                notification.type === 'tag' && "bg-blue-100",
                notification.type === 'reply' && "bg-green-100",
                notification.type === 'resolve' && "bg-amber-100",
              )}>
                {notification.type === 'tag' && <AtSign className="h-3 w-3 text-blue-600" />}
                {notification.type === 'reply' && <MessageSquare className="h-3 w-3 text-green-600" />}
                {notification.type === 'resolve' && <CheckCircle className="h-3 w-3 text-amber-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs">{notification.message}</p>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                </span>
                {relatedComment && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-1.5 h-6 text-[10px] gap-1 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      onResolve(relatedComment.id);
                      onMarkRead(notification.id);
                    }}
                  >
                    <Check className="h-2.5 w-2.5" />
                    Resolve
                  </Button>
                )}
              </div>
              {!notification.read && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CommentsList = ({ comments, resolved = false, onResolve }: { comments: CellComment[]; resolved?: boolean; onResolve?: (id: string) => void }) => {
  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <MessageSquare className="h-6 w-6 mb-2 opacity-50" />
        <p className="text-xs">{resolved ? "No resolved comments" : "No active comments"}</p>
      </div>
    );
  }

  const groupedComments = comments.reduce((acc, comment) => {
    if (!acc[comment.sectionId]) acc[comment.sectionId] = [];
    acc[comment.sectionId].push(comment);
    return acc;
  }, {} as Record<string, CellComment[]>);

  return (
    <div className="divide-y">
      {Object.entries(groupedComments).map(([sectionId, sectionComments]) => (
        <div key={sectionId}>
          <div className="px-2.5 py-1.5 bg-muted/30 sticky top-0">
            <span className="text-[10px] font-medium text-muted-foreground">
              {SECTION_LABELS[sectionId] || sectionId}
            </span>
          </div>
          {sectionComments.map(comment => (
            <div key={comment.id} className="p-2.5 hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-2">
                <Avatar className="h-5 w-5 flex-shrink-0">
                  <AvatarFallback className="text-[8px] bg-primary/10">
                    {comment.author.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-medium">{comment.author.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(comment.createdAt, 'MMM d, h:mm a')}
                    </span>
                    {resolved && (
                      <Badge variant="secondary" className="text-[8px] px-1 py-0 bg-green-50 text-green-700">
                        Resolved
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs mt-0.5 text-foreground/90 break-words">
                    {comment.content}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <ExternalLink className="h-2.5 w-2.5" />
                      <span>{comment.field}</span>
                    </div>
                    {!resolved && onResolve && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 text-[10px] gap-0.5 hover:bg-green-50 hover:text-green-600"
                        onClick={() => onResolve(comment.id)}
                      >
                        <Check className="h-2.5 w-2.5" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const ActivityCommentsSection = () => {
  const { comments, notifications, unreadCount, markNotificationRead, markAllNotificationsRead, resolveComment } = useCellComments();
  
  const activeComments = comments.filter(c => !c.resolved);
  const resolvedComments = comments.filter(c => c.resolved);

  return (
    <div className="border-t pt-3 mt-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Activity & Comments
        </h4>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={markAllNotificationsRead}>
            Mark all read
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="w-full justify-start h-8 bg-slate-100 p-0.5 rounded-md">
          <TabsTrigger value="notifications" className="text-[10px] h-7 px-2 gap-1 data-[state=active]:bg-white">
            <AtSign className="h-3 w-3" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[8px]">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="comments" className="text-[10px] h-7 px-2 gap-1 data-[state=active]:bg-white">
            <MessageSquare className="h-3 w-3" />
            Comments
            <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[8px]">
              {activeComments.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="resolved" className="text-[10px] h-7 px-2 gap-1 data-[state=active]:bg-white">
            <CheckCircle className="h-3 w-3" />
            Resolved
            <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[8px]">
              {resolvedComments.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <div className="mt-2 border rounded-md max-h-[300px] overflow-auto">
          <TabsContent value="notifications" className="m-0">
            <NotificationsList 
              notifications={notifications} 
              onMarkRead={markNotificationRead}
              onResolve={resolveComment}
              comments={comments}
            />
          </TabsContent>

          <TabsContent value="comments" className="m-0">
            <CommentsList comments={activeComments} onResolve={resolveComment} />
          </TabsContent>

          <TabsContent value="resolved" className="m-0">
            <CommentsList comments={resolvedComments} resolved />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

const RightSidePanel = () => {
  const [activeTab, setActiveTab] = useState<PanelTab | null>(null);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const { formState } = useForm();
  const { activeTab: activeFormSection } = useAssessmentNavigation();

  const handleTabClick = (tabId: PanelTab) => {
    if (activeTab === tabId) {
      setActiveTab(null);
    } else {
      setActiveTab(tabId);
      setSelectedDateIndex(0);
    }
  };

  const getAssessmentTitle = () => {
    switch (activeFormSection) {
      case "inherent":
        return "Inherent Risk History";
      case "control":
        return "Control Effectiveness History";
      case "residual":
        return "Residual Risk History";
      default:
        return "Previous Assessments";
    }
  };

  const getAssessmentIcon = () => {
    switch (activeFormSection) {
      case "inherent":
        return <Scale className="h-4 w-4 text-amber-600" />;
      case "control":
        return <Shield className="h-4 w-4 text-green-600" />;
      case "residual":
        return <Target className="h-4 w-4 text-blue-600" />;
      default:
        return <History className="h-4 w-4 text-slate-600" />;
    }
  };

  const getRatingBadge = (value: string) => {
    const numVal = parseFloat(value);
    const label = getScoreLabel(value);
    const colorClass = numVal <= 2 ? "bg-green-100 text-green-700 border-green-200" :
                       numVal <= 3 ? "bg-amber-100 text-amber-700 border-amber-200" :
                       "bg-red-100 text-red-700 border-red-200";
    return (
      <Badge variant="outline" className={cn("text-xs font-medium", colorClass)}>
        {label} ({value})
      </Badge>
    );
  };

  const renderFactorsTable = (factors: { id: string; name: string; value: string; weighting: string }[]) => (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-3 py-2 font-medium text-slate-600">Factor</th>
            <th className="text-center px-3 py-2 font-medium text-slate-600">Rating</th>
            <th className="text-right px-3 py-2 font-medium text-slate-600">Weight (%)</th>
          </tr>
        </thead>
        <tbody>
          {factors.map((factor, idx) => (
            <tr key={factor.id} className={cn(idx !== factors.length - 1 && "border-b border-slate-100")}>
              <td className="px-3 py-2.5 text-slate-700">{factor.name}</td>
              <td className="px-3 py-2.5 text-center">{getRatingBadge(factor.value)}</td>
              <td className="px-3 py-2.5 text-right text-slate-600">{factor.weighting}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderControlsTable = (controls: Control[]) => (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-3 py-2 font-medium text-slate-600">Control</th>
            <th className="text-center px-3 py-2 font-medium text-slate-600">Effectiveness</th>
            <th className="text-right px-3 py-2 font-medium text-slate-600">Weight (%)</th>
          </tr>
        </thead>
        <tbody>
          {controls.map((control, idx) => (
            <tr key={control.id} className={cn(idx !== controls.length - 1 && "border-b border-slate-100")}>
              <td className="px-3 py-2.5 text-slate-700">
                <div className="flex items-center gap-1.5">
                  {control.name}
                  {control.isKeyControl && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 bg-blue-50 text-blue-600 border-blue-200">Key</Badge>
                  )}
                </div>
              </td>
              <td className="px-3 py-2.5 text-center">{getRatingBadge(control.effectiveness)}</td>
              <td className="px-3 py-2.5 text-right text-slate-600">{control.weighting}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAssessmentsContent = () => {
    let data: { date: string; score: string; factors?: any[]; controls?: Control[] }[] = [];
    let isControl = false;

    switch (activeFormSection) {
      case "inherent":
        data = INHERENT_HISTORICAL;
        break;
      case "control":
        data = CONTROL_HISTORICAL;
        isControl = true;
        break;
      case "residual":
        data = RESIDUAL_HISTORICAL;
        break;
      default:
        return (
          <div className="text-center py-8 text-slate-500">
            <History className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium">No Historical Data</p>
            <p className="text-xs mt-1">Select Inherent Rating, Control Effectiveness, or Residual Rating to view historical assessments</p>
          </div>
        );
    }

    const selectedAssessment = data[selectedDateIndex];
    const hasDetails = isControl 
      ? (selectedAssessment as any).controls?.length > 0 
      : selectedAssessment.factors?.length > 0;

    return (
      <div className="space-y-4">
        {/* Title with icon */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">{getAssessmentTitle()}</h3>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3.5 w-3.5 text-slate-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Historical assessment data for comparison</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Date badges */}
        <div className="flex flex-wrap gap-2">
          {data.map((assessment, idx) => (
            <Badge
              key={assessment.date}
              variant={selectedDateIndex === idx ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-all text-xs",
                selectedDateIndex === idx 
                  ? "bg-slate-800 text-white hover:bg-slate-700" 
                  : "bg-white hover:bg-slate-50"
              )}
              onClick={() => setSelectedDateIndex(idx)}
            >
              {assessment.date}
            </Badge>
          ))}
        </div>

        {/* Score and Copy button */}
        <div className="flex items-center justify-between">
          <Badge 
            variant="outline" 
            className={cn(
              "text-sm font-medium px-3 py-1",
              getScoreColor(selectedAssessment.score)
            )}
          >
            Score: {selectedAssessment.score} ({getScoreLabel(selectedAssessment.score)})
          </Badge>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <Copy className="h-3.5 w-3.5" />
            Copy to current
          </Button>
        </div>

        {/* Details table */}
        {hasDetails ? (
          isControl 
            ? renderControlsTable((selectedAssessment as any).controls)
            : renderFactorsTable(selectedAssessment.factors!)
        ) : (
          <div className="text-center py-6 text-slate-400 text-sm border border-dashed border-slate-200 rounded-lg">
            No detailed data available for this assessment
          </div>
        )}
      </div>
    );
  };

  const renderReviewContent = () => {
    const challenge = formState.challengeDetails;
    
    return (
      <div className="space-y-4">
        {challenge && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                  Challenge Active
                </Badge>
              </div>
              <p className="text-sm text-amber-800">{challenge.justification}</p>
              <p className="text-xs text-amber-600 mt-2">
                By {challenge.reviewer} • {challenge.date.toLocaleDateString()}
              </p>
            </div>
            
            {challenge.reasons && challenge.reasons.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-600 mb-2">Challenged Sections</h4>
                <div className="flex flex-wrap gap-1">
                  {challenge.reasons.map((reason, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {reason}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Activity & Comments Section */}
        <ActivityCommentsSection />
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "assessments":
        return renderAssessmentsContent();
      case "review":
        return renderReviewContent();
      case "treatment":
        return <TreatmentSection onNext={() => {}} />;
      case "metrics":
        return <MetricsAndLossesSection />;
      case "details":
        return <CommentsAttachmentsSection />;
      default:
        return null;
    }
  };

  const isExpanded = activeTab !== null;

  return (
    <div className="fixed right-0 top-[140px] bottom-0 flex z-30">
      {/* Expanded Panel Content */}
      {isExpanded && (
        <div className="w-[380px] bg-background border-l border-border shadow-md overflow-hidden flex flex-col rounded-l-lg">
          <div className="px-4 py-3 border-b border-border bg-slate-50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700 text-sm">
              {activeTab === "assessments" ? getAssessmentTitle() : TABS.find(t => t.id === activeTab)?.label}
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 hover:bg-slate-200"
              onClick={() => setActiveTab(null)}
            >
              ×
            </Button>
          </div>
          <ScrollArea className="flex-1 p-4 bg-background">
            {renderContent()}
          </ScrollArea>
        </div>
      )}
      
      {/* Vertical Tab Strip */}
      <div className="w-11 bg-slate-50 border-l border-border flex flex-col items-center pt-2 gap-0.5 shadow-md">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={cn(
              "w-9 py-3 flex flex-col items-center justify-center rounded-l-md transition-all duration-200",
              "hover:bg-slate-100",
              activeTab === tab.id
                ? "bg-white text-primary border-r-2 border-primary shadow-sm"
                : "text-slate-500"
            )}
            title={tab.label}
          >
            {tab.icon}
            <span 
              className="text-[8px] font-medium mt-1.5 leading-tight text-center px-0.5"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RightSidePanel;
