import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NAControlDetails {
  id: string;
  name: string;
  riskId: string;
  riskName: string;
  justification: string;
  markedBy: string;
  markedDate: string;
}

interface NAControlsDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessUnit: string;
  category: string;
  controls: NAControlDetails[];
  totalControls: number;
}

export const NAControlsDrilldownModal: React.FC<NAControlsDrilldownModalProps> = ({
  isOpen,
  onClose,
  businessUnit,
  category,
  controls,
  totalControls,
}) => {
  const naPercentage = totalControls > 0 ? ((controls.length / totalControls) * 100).toFixed(1) : "0.0";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            N/A Controls - {businessUnit} / {category}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {controls.length} of {totalControls} controls
              </span>
            </div>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {naPercentage}% marked as Not Applicable
            </Badge>
          </div>

          {/* Controls Table */}
          {controls.length > 0 ? (
            <ScrollArea className="h-[400px]">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Control ID</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Control Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Risk</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Justification</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Marked By</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {controls.map((control) => (
                      <tr key={control.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2">
                          <span className="font-mono text-xs text-blue-600">{control.id}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-sm font-medium">{control.name}</span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col">
                            <span className="font-mono text-[10px] text-muted-foreground">{control.riskId}</span>
                            <span className="text-xs truncate max-w-[120px]" title={control.riskName}>
                              {control.riskName}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 max-w-[200px]">
                          <p className="text-xs text-muted-foreground line-clamp-2" title={control.justification}>
                            {control.justification}
                          </p>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-medium text-primary">
                              {control.markedBy.split(' ').map(w => w[0]).join('')}
                            </div>
                            <span className="text-xs">{control.markedBy}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs text-muted-foreground">{control.markedDate}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No controls marked as Not Applicable</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-2 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NAControlsDrilldownModal;
