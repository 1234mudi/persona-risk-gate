import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Search,
  X,
  User,
  Calendar,
  TrendingUp,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RiskDataItem {
  id: string;
  title: string;
  businessUnit: string;
  category?: string;
  owner?: string;
  residualRisk?: { level: string; color?: string; score?: number };
  lastAssessed?: string;
}

interface OrganizationHeatmapDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessUnit: string;
  riskLevel: string;
  risks: RiskDataItem[];
}

export const OrganizationHeatmapDrilldownModal: React.FC<OrganizationHeatmapDrilldownModalProps> = ({
  isOpen,
  onClose,
  businessUnit,
  riskLevel,
  risks,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter risks based on search
  const filteredRisks = useMemo(() => {
    if (!searchQuery) return risks;
    const searchLower = searchQuery.toLowerCase();
    return risks.filter(
      (risk) =>
        risk.id.toLowerCase().includes(searchLower) ||
        risk.title.toLowerCase().includes(searchLower) ||
        (risk.owner && risk.owner.toLowerCase().includes(searchLower)) ||
        (risk.category && risk.category.toLowerCase().includes(searchLower))
    );
  }, [risks, searchQuery]);

  // Get risk level color
  const getRiskLevelColor = (level: string) => {
    const levelLower = level.toLowerCase();
    if (levelLower === "critical") return "bg-red-500/20 text-red-600 border-red-500/40";
    if (levelLower === "high") return "bg-orange-500/20 text-orange-600 border-orange-500/40";
    if (levelLower === "medium") return "bg-yellow-500/20 text-yellow-600 border-yellow-500/40";
    return "bg-green-500/20 text-green-600 border-green-500/40";
  };

  // Get header color based on risk level
  const getHeaderColor = (level: string) => {
    const levelLower = level.toLowerCase();
    if (levelLower === "critical") return "text-red-600 dark:text-red-400";
    if (levelLower === "high") return "text-orange-600 dark:text-orange-400";
    if (levelLower === "medium") return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  // Generate CSV content from risks
  const generateCSV = () => {
    const headers = ["Risk ID", "Risk Title", "Business Unit", "Category", "Owner", "Risk Level", "Residual Score", "Last Assessed"];
    const rows = filteredRisks.map(risk => [
      risk.id,
      `"${risk.title.replace(/"/g, '""')}"`,
      businessUnit,
      risk.category || "",
      risk.owner || "Unassigned",
      riskLevel,
      risk.residualRisk?.score?.toString() || "",
      risk.lastAssessed || ""
    ]);
    
    return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
  };

  // Export as CSV
  const handleExportCSV = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${businessUnit.replace(/\s+/g, "-")}-${riskLevel}-Risks-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export Complete", { description: `Exported ${filteredRisks.length} risks to CSV` });
  };

  // Export as Excel (CSV that opens in Excel)
  const handleExportExcel = () => {
    const csvContent = generateCSV();
    // Add BOM for Excel UTF-8 compatibility
    const blob = new Blob(["\uFEFF" + csvContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${businessUnit.replace(/\s+/g, "-")}-${riskLevel}-Risks-${new Date().toISOString().split("T")[0]}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export Complete", { description: `Exported ${filteredRisks.length} risks to Excel` });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="p-4 pb-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className={cn("w-5 h-5", getHeaderColor(riskLevel))} />
            <span>{businessUnit}</span>
            <span className="text-muted-foreground">—</span>
            <Badge className={cn("font-semibold", getRiskLevelColor(riskLevel))}>
              {riskLevel} Risks
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 p-4 space-y-3 overflow-hidden">
          {/* Summary & Export */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={cn("border", getRiskLevelColor(riskLevel))}>
              {risks.length} {riskLevel} residual risk{risks.length !== 1 ? "s" : ""} in {businessUnit}
            </Badge>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Showing {filteredRisks.length} of {risks.length} risks
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 gap-1.5" disabled={filteredRisks.length === 0}>
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportCSV}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel}>
                    Export as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-[300px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, title, owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Risks Table */}
          <ScrollArea className="flex-1 border rounded-lg">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <TableRow>
                  <TableHead className="w-[100px]">Risk ID</TableHead>
                  <TableHead className="min-w-[200px]">Risk Title</TableHead>
                  <TableHead className="w-[140px]">Category</TableHead>
                  <TableHead className="w-[140px]">Owner</TableHead>
                  <TableHead className="w-[100px]">Score</TableHead>
                  <TableHead className="w-[120px]">Last Assessed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRisks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "No risks match your search" : "No risks found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRisks.map((risk) => (
                    <TableRow key={risk.id} className="hover:bg-muted/30 cursor-pointer">
                      <TableCell className="font-mono text-xs">{risk.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{risk.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{risk.category || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs">{risk.owner || "Unassigned"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs font-medium">
                            {risk.residualRisk?.score ?? "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs">{risk.lastAssessed || "—"}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>

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

export default OrganizationHeatmapDrilldownModal;
