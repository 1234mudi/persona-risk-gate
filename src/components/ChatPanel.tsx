import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Lock, Eye, Edit, Hash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Message {
  id: string;
  user: string;
  text: string;
  time: Date;
  tag?: string;
}

interface AuditEntry {
  id: string;
  user: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  time: Date;
  type: "edit" | "navigation" | "lock";
}

const ChatPanel: React.FC<ChatPanelProps> = ({ open, onOpenChange }) => {
  const [activeTab, setActiveTab] = useState("chat");
  const [messageText, setMessageText] = useState("");

  const messages: Message[] = [
    { 
      id: "1", 
      user: "Sarah Johnson", 
      text: "I've updated the inherent rating based on the latest data",
      time: new Date(Date.now() - 10 * 60000),
      tag: "Inherent Rating"
    },
    { 
      id: "2", 
      user: "Michael Chen", 
      text: "Can you review the control effectiveness scores?",
      time: new Date(Date.now() - 20 * 60000),
      tag: "Control Effectiveness"
    },
    { 
      id: "3", 
      user: "Emma Rodriguez", 
      text: "The residual rating looks good now",
      time: new Date(Date.now() - 35 * 60000),
      tag: "Residual Rating"
    },
  ];

  const auditTrail: AuditEntry[] = [
    {
      id: "1",
      user: "Sarah Johnson",
      action: "Updated field",
      field: "Likelihood Rating",
      oldValue: "3 - Medium",
      newValue: "4 - High",
      time: new Date(Date.now() - 8 * 60000),
      type: "edit"
    },
    {
      id: "2",
      user: "Michael Chen",
      action: "Navigated to",
      field: "Control Effectiveness",
      time: new Date(Date.now() - 18 * 60000),
      type: "navigation"
    },
    {
      id: "3",
      user: "Emma Rodriguez",
      action: "Locked section",
      field: "Residual Rating",
      time: new Date(Date.now() - 32 * 60000),
      type: "lock"
    },
    {
      id: "4",
      user: "Sarah Johnson",
      action: "Updated field",
      field: "Impact Rating",
      oldValue: "2 - Low",
      newValue: "3 - Medium",
      time: new Date(Date.now() - 45 * 60000),
      type: "edit"
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    // In real implementation, send message to backend
    setMessageText("");
  };

  const getAuditIcon = (type: AuditEntry["type"]) => {
    switch (type) {
      case "edit":
        return <Edit className="h-3 w-3" />;
      case "navigation":
        return <Eye className="h-3 w-3" />;
      case "lock":
        return <Lock className="h-3 w-3" />;
    }
  };

  const getAuditColor = (type: AuditEntry["type"]) => {
    switch (type) {
      case "edit":
        return "text-blue-600";
      case "navigation":
        return "text-green-600";
      case "lock":
        return "text-orange-600";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[500px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Communication</SheetTitle>
        </SheetHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col mt-4">
            <ScrollArea className="flex-1 pr-4 mb-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="text-xs">
                          {getInitials(message.user)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{message.user}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(message.time, { addSuffix: true })}
                          </span>
                        </div>
                        {message.tag && (
                          <Badge variant="secondary" className="text-xs mb-2">
                            <Hash className="h-3 w-3 mr-1" />
                            {message.tag}
                          </Badge>
                        )}
                        <p className="text-sm bg-muted p-3 rounded-lg">
                          {message.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2 pt-2 border-t">
              <Input
                placeholder="Type a message... Use #Section to tag"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                size="icon"
                disabled={!messageText.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="flex-1 mt-4">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-3">
                {auditTrail.map((entry) => (
                  <div 
                    key={entry.id} 
                    className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${getAuditColor(entry.type)}`}>
                        {getAuditIcon(entry.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{entry.user}</span>
                          <span className="text-xs text-muted-foreground">
                            {entry.action}
                          </span>
                        </div>
                        
                        {entry.field && (
                          <Badge variant="outline" className="text-xs mb-2">
                            {entry.field}
                          </Badge>
                        )}

                        {entry.oldValue && entry.newValue && (
                          <div className="text-xs space-y-1 bg-muted/50 p-2 rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">From:</span>
                              <span className="line-through text-red-600">{entry.oldValue}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">To:</span>
                              <span className="text-green-600 font-medium">{entry.newValue}</span>
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(entry.time, { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default ChatPanel;
