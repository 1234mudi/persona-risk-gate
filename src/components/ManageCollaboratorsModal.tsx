import React, { useState } from "react";
import { Users, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

interface ActiveCollaborator {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

interface ManageCollaboratorsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riskId?: string | null;
  riskCount?: number;
}

const availableCollaborators: Collaborator[] = [
  { id: "1", name: "Sarah Johnson", email: "sarah.j@company.com", avatar: "SJ", role: "Risk Analyst" },
  { id: "2", name: "Michael Chen", email: "m.chen@company.com", avatar: "MC", role: "Compliance Officer" },
  { id: "3", name: "Emma Rodriguez", email: "e.rodriguez@company.com", avatar: "ER", role: "Senior Auditor" },
  { id: "4", name: "James Wilson", email: "j.wilson@company.com", avatar: "JW", role: "Risk Manager" },
  { id: "5", name: "Lisa Park", email: "l.park@company.com", avatar: "LP", role: "Business Analyst" },
];

const activeCollaborators: ActiveCollaborator[] = [
  { id: "a1", name: "David Kim", avatar: "DK", role: "Risk Owner" },
  { id: "a2", name: "Anna Lee", avatar: "AL", role: "Reviewer" },
];

const ManageCollaboratorsModal: React.FC<ManageCollaboratorsModalProps> = ({
  open,
  onOpenChange,
  riskCount = 1,
}) => {
  const [fullEditAccess, setFullEditAccess] = useState(true);
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);

  const handleApply = () => {
    toast.success(`${selectedCollaborators.length} collaborator(s) added successfully`);
    setSelectedCollaborators([]);
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedCollaborators([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent position="top" className="max-w-lg !p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-4 shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            Manage Collaborators
          </DialogTitle>
          {riskCount > 1 && (
            <p className="text-sm text-muted-foreground mt-2">
              Managing collaborators for {riskCount} selected risks
            </p>
          )}
        </DialogHeader>
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
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
              <ScrollArea className="max-h-[min(180px,25dvh)]">
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
        </div>

        {/* Footer Buttons - Fixed at bottom */}
        <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t bg-muted/30 shrink-0">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={handleApply}
          >
            <Check className="w-4 h-4 mr-2" />
            Apply Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageCollaboratorsModal;
