import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { format, parseISO } from "date-fns";

interface MetricSegment {
  label: string;
  value: number;
  sublabel: string;
  color: string;
}

interface MetricData {
  title: string;
  value: number | string;
  trend: string;
  trendUp: boolean;
  icon: LucideIcon;
  segments: MetricSegment[];
  description: string;
  tooltip: string;
}

interface RiskData {
  id: string;
  title: string;
  dueDate: string;
  riskLevel: string;
  status: string;
  inherentRisk: { level: string; color: string; score?: number };
  residualRisk: { level: string; color: string; score?: number };
  controlEffectiveness: { label: string; color: string };
}

interface MetricDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric: MetricData | null;
  risks: RiskData[];
}

export const MetricDetailModal = ({ open, onOpenChange, metric, risks }: MetricDetailModalProps) => {
  if (!metric) return null;

  const Icon = metric.icon;

  // Filter risks based on the metric type
  const getFilteredRisks = (segmentLabel: string): RiskData[] => {
    const today = new Date();
    const endOfWeekDate = new Date(today);
    endOfWeekDate.setDate(today.getDate() + (7 - today.getDay()));
    const endOfMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    switch (metric.title) {
      case "My Assessments Due":
        return risks.filter(risk => {
          const dueDate = parseISO(risk.dueDate);
          if (segmentLabel === "Overdue") return dueDate < today;
          if (segmentLabel === "Due This Week") return dueDate >= today && dueDate <= endOfWeekDate;
          if (segmentLabel === "Due This Month") return dueDate > endOfWeekDate && dueDate <= endOfMonthDate;
          return true;
        });
      case "Inherent Risk Ratings":
        return risks.filter(risk => {
          if (segmentLabel === "Critical") return risk.inherentRisk.level === "Critical";
          if (segmentLabel === "High") return risk.inherentRisk.level === "High";
          if (segmentLabel === "Medium") return risk.inherentRisk.level === "Medium";
          return true;
        });
      case "Control Evidence Status":
        return risks.filter(risk => {
          if (segmentLabel === "Effective") return risk.controlEffectiveness.label === "Effective";
          if (segmentLabel === "Partially Effective") return risk.controlEffectiveness.label === "Partially Effective";
          if (segmentLabel === "Ineffective") return risk.controlEffectiveness.label === "Ineffective";
          if (segmentLabel === "Not Assessed") return risk.controlEffectiveness.label === "Not Assessed";
          return true;
        });
      case "Assessment Progress":
        return risks.filter(risk => {
          if (segmentLabel === "Completed") return risk.status === "Completed";
          if (segmentLabel === "Pending Approval") return risk.status === "Pending Approval";
          if (segmentLabel === "In Progress") return risk.status === "In Progress";
          if (segmentLabel === "Not Started") return risk.status === "Not Started";
          return true;
        });
      default:
        return risks;
    }
  };

  const getColumnHeader = (): string => {
    switch (metric.title) {
      case "My Assessments Due": return "Due Date";
      case "Inherent Risk Ratings": return "Inherent Risk";
      case "Control Evidence Status": return "Control Status";
      case "Assessment Progress": return "Status";
      default: return "Value";
    }
  };

  const getColumnValue = (risk: RiskData): React.ReactNode => {
    switch (metric.title) {
      case "My Assessments Due":
        return format(parseISO(risk.dueDate), "MMM d, yyyy");
      case "Inherent Risk Ratings":
        return (
          <Badge variant="outline" className={`${risk.inherentRisk.color} text-white border-0`}>
            {risk.inherentRisk.level}
          </Badge>
        );
      case "Control Evidence Status":
        return (
          <Badge variant="outline" className={`${risk.controlEffectiveness.color} text-white border-0`}>
            {risk.controlEffectiveness.label}
          </Badge>
        );
      case "Assessment Progress":
        const statusColors: Record<string, string> = {
          "Completed": "bg-green-600",
          "Pending Approval": "bg-purple-500",
          "In Progress": "bg-amber-500",
          "Not Started": "bg-gray-400",
        };
        return (
          <Badge variant="outline" className={`${statusColors[risk.status] || "bg-gray-400"} text-white border-0`}>
            {risk.status}
          </Badge>
        );
      default:
        return "-";
    }
  };

  const total = metric.segments.reduce((sum, seg) => sum + seg.value, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col animate-scale-in" fullScreenMobile>
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-first-line/10 border-2 border-first-line/20 flex items-center justify-center">
              <Icon className="w-6 h-6 text-first-line" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">{metric.title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{metric.description}</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-6 py-4 pr-4">
          {/* Summary Stats */}
          <div className="flex items-center justify-between bg-muted/30 rounded-lg p-4">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-4xl font-bold">{metric.value}</p>
            </div>
            <div className="flex items-center gap-2">
              {metric.trendUp ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
              <span className={`text-sm font-medium ${metric.trendUp ? "text-green-600" : "text-red-600"}`}>
                {metric.trend}
              </span>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {metric.segments.map((segment, idx) => {
              const percentage = total > 0 ? Math.round((segment.value / total) * 100) : 0;
              return (
                <div 
                  key={idx} 
                  className="bg-card border rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-default"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${segment.color}`} />
                    <span className="text-sm font-medium text-muted-foreground">{segment.label}</span>
                  </div>
                  <p className="text-2xl font-bold">{segment.value}</p>
                  <p className="text-xs text-muted-foreground">{percentage}% of total</p>
                </div>
              );
            })}
          </div>

          {/* Bar Visualization */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Distribution</p>
            <div className="flex h-8 rounded-lg overflow-hidden">
              {metric.segments.map((segment, idx) => {
                const percentage = total > 0 ? (segment.value / total) * 100 : 0;
                return (
                  <div
                    key={idx}
                    className={`${segment.color} transition-all duration-500 flex items-center justify-center text-white text-xs font-medium`}
                    style={{ width: `${percentage}%` }}
                  >
                    {percentage > 10 && `${Math.round(percentage)}%`}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Risk List per Segment */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Detailed Breakdown</p>
            <div className="rounded-md border max-h-[200px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Risk ID</TableHead>
                    <TableHead>Risk Title</TableHead>
                    <TableHead>{getColumnHeader()}</TableHead>
                    <TableHead>Risk Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {risks.length > 0 ? (
                    risks.map((risk) => (
                      <TableRow key={risk.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono text-xs">{risk.id}</TableCell>
                        <TableCell className="font-medium">{risk.title}</TableCell>
                        <TableCell>{getColumnValue(risk)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-muted">
                            {risk.riskLevel}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No risks found
                      </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
