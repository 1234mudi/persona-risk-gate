import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search, Plus, Shield } from "lucide-react";

interface AvailableControl {
  id: string;
  name: string;
  type: "Preventive" | "Detective";
  prevDesign: number;
  prevOperating: number;
  prevAvg: number;
}

interface AddControlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddControls: (controls: AvailableControl[]) => void;
  existingControlIds: string[];
}

const availableControlsData: AvailableControl[] = [
  { id: "CTL-004", name: "Transaction Monitoring System", type: "Detective", prevDesign: 4, prevOperating: 4, prevAvg: 4.0 },
  { id: "CTL-005", name: "Access Control Management", type: "Preventive", prevDesign: 5, prevOperating: 4, prevAvg: 4.5 },
  { id: "CTL-006", name: "Segregation of Duties", type: "Preventive", prevDesign: 4, prevOperating: 3, prevAvg: 3.5 },
  { id: "CTL-007", name: "Audit Trail Logging", type: "Detective", prevDesign: 4, prevOperating: 4, prevAvg: 4.0 },
  { id: "CTL-008", name: "Data Encryption Controls", type: "Preventive", prevDesign: 5, prevOperating: 5, prevAvg: 5.0 },
  { id: "CTL-009", name: "Exception Reporting", type: "Detective", prevDesign: 3, prevOperating: 3, prevAvg: 3.0 },
  { id: "CTL-010", name: "Reconciliation Process", type: "Detective", prevDesign: 4, prevOperating: 3, prevAvg: 3.5 },
  { id: "CTL-011", name: "Policy Compliance Checks", type: "Preventive", prevDesign: 3, prevOperating: 4, prevAvg: 3.5 },
  { id: "CTL-012", name: "Vendor Due Diligence", type: "Preventive", prevDesign: 4, prevOperating: 4, prevAvg: 4.0 },
  { id: "CTL-013", name: "Incident Response Procedures", type: "Detective", prevDesign: 3, prevOperating: 2, prevAvg: 2.5 },
];

const getRatingBadgeColor = (rating: number): string => {
  if (rating >= 4) return "bg-emerald-500";
  if (rating >= 3) return "bg-amber-500";
  return "bg-red-500";
};

export const AddControlModal = ({
  open,
  onOpenChange,
  onAddControls,
  existingControlIds,
}: AddControlModalProps) => {
  const [selectedControls, setSelectedControls] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Filter out already existing controls and sort by Average Control Score descending
  const filteredControls = useMemo(() => {
    return availableControlsData
      .filter(control => !existingControlIds.includes(control.id))
      .filter(control => 
        control.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        control.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        control.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => b.prevAvg - a.prevAvg);
  }, [existingControlIds, searchQuery]);

  const toggleControlSelection = (controlId: string) => {
    setSelectedControls(prev => {
      const newSet = new Set(prev);
      if (newSet.has(controlId)) {
        newSet.delete(controlId);
      } else {
        newSet.add(controlId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedControls.size === filteredControls.length) {
      setSelectedControls(new Set());
    } else {
      setSelectedControls(new Set(filteredControls.map(c => c.id)));
    }
  };

  const handleAddSelected = () => {
    const controlsToAdd = availableControlsData.filter(c => selectedControls.has(c.id));
    onAddControls(controlsToAdd);
    setSelectedControls(new Set());
    setSearchQuery("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedControls(new Set());
    setSearchQuery("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-blue-500 to-cyan-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white text-lg">Add Controls</DialogTitle>
              <p className="text-blue-100 text-sm">Select controls to add to this risk assessment</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-border bg-muted/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search controls by ID, name, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {filteredControls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Shield className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">No additional controls available</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="w-12 p-3 text-left">
                      <Checkbox
                        checked={filteredControls.length > 0 && selectedControls.size === filteredControls.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase">Control ID</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase">Control Title</th>
                    <th className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase">Type</th>
                    <th className="p-3 text-center text-xs font-semibold text-muted-foreground uppercase">Previous Design Effectiveness</th>
                    <th className="p-3 text-center text-xs font-semibold text-muted-foreground uppercase">Previous Operating Effectiveness</th>
                    <th className="p-3 text-center text-xs font-semibold text-muted-foreground uppercase">Previous Average Control Score</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredControls.map((control) => (
                    <tr 
                      key={control.id} 
                      className={`border-t hover:bg-muted/30 cursor-pointer transition-colors ${
                        selectedControls.has(control.id) ? "bg-primary/5" : ""
                      }`}
                      onClick={() => toggleControlSelection(control.id)}
                    >
                      <td className="p-3">
                        <Checkbox
                          checked={selectedControls.has(control.id)}
                          onCheckedChange={() => toggleControlSelection(control.id)}
                        />
                      </td>
                      <td className="p-3 font-mono text-sm text-blue-600">{control.id}</td>
                      <td className="p-3">
                        <span className="font-medium text-sm">{control.name}</span>
                      </td>
                      <td className="p-3">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            control.type === "Preventive" 
                              ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300" 
                              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {control.type}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={`${getRatingBadgeColor(control.prevDesign)} text-white text-xs`}>
                          {control.prevDesign}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={`${getRatingBadgeColor(control.prevOperating)} text-white text-xs`}>
                          {control.prevOperating}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={`${getRatingBadgeColor(control.prevAvg)} text-white text-xs font-semibold`}>
                          {control.prevAvg.toFixed(1)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">
              {selectedControls.size} control{selectedControls.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddSelected}
                disabled={selectedControls.size === 0}
                className="gap-2 bg-primary"
              >
                <Plus className="w-4 h-4" />
                Add Selected
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
