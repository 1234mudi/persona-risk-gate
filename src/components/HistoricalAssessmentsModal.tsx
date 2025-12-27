import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, History, ArrowUp, ArrowDown } from "lucide-react";

interface HistoricalAssessment {
  date: string;
  assessor: string;
  inherentRisk: { level: string; score: number };
  residualRisk: { level: string; score: number };
  controlEffectiveness: string;
  status: string;
  notes?: string;
}

interface HistoricalAssessmentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riskId: string;
  riskTitle: string;
  historicalAssessments: HistoricalAssessment[];
}

const getRiskBadgeColor = (level: string) => {
  const lowerLevel = level.toLowerCase();
  if (lowerLevel === 'critical') return 'bg-red-600 text-white border-red-600';
  if (lowerLevel === 'high') return 'bg-red-500 text-white border-red-500';
  if (lowerLevel === 'medium') return 'bg-amber-500 text-white border-amber-500';
  if (lowerLevel === 'low') return 'bg-green-500 text-white border-green-500';
  return 'bg-muted text-muted-foreground';
};

const getEffectivenessColor = (effectiveness: string) => {
  const lower = effectiveness.toLowerCase();
  if (lower.includes('effective') && !lower.includes('in') && !lower.includes('partial')) return 'bg-green-500 text-white';
  if (lower.includes('partial')) return 'bg-amber-500 text-white';
  if (lower.includes('ineffective')) return 'bg-red-500 text-white';
  return 'bg-muted text-muted-foreground';
};

export const HistoricalAssessmentsModal = ({
  open,
  onOpenChange,
  riskId,
  riskTitle,
  historicalAssessments
}: HistoricalAssessmentsModalProps) => {
  // Calculate trend between assessments
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { direction: 'stable', change: 0 };
    const change = ((current - previous) / previous) * 100;
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      change: Math.abs(Math.round(change))
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-first-line" />
            Historical Assessment Results
          </DialogTitle>
          <DialogDescription>
            Viewing assessment history for <span className="font-semibold text-foreground">{riskId}</span> - {riskTitle}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {historicalAssessments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No historical assessments available.
            </div>
          ) : (
            <>
              {/* Trend Summary */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Inherent Risk Trend</h4>
                  <div className="flex items-center gap-3">
                    {historicalAssessments.length >= 2 && (() => {
                      const trend = calculateTrend(
                        historicalAssessments[0].inherentRisk.score,
                        historicalAssessments[1].inherentRisk.score
                      );
                      return (
                        <div className={`flex items-center gap-1 ${trend.direction === 'up' ? 'text-red-600' : trend.direction === 'down' ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {trend.direction === 'up' ? <TrendingUp className="w-5 h-5" /> : trend.direction === 'down' ? <TrendingDown className="w-5 h-5" /> : null}
                          <span className="text-lg font-bold">{trend.change}%</span>
                          <span className="text-sm">{trend.direction === 'up' ? 'increase' : trend.direction === 'down' ? 'decrease' : 'stable'}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Residual Risk Trend</h4>
                  <div className="flex items-center gap-3">
                    {historicalAssessments.length >= 2 && (() => {
                      const trend = calculateTrend(
                        historicalAssessments[0].residualRisk.score,
                        historicalAssessments[1].residualRisk.score
                      );
                      return (
                        <div className={`flex items-center gap-1 ${trend.direction === 'up' ? 'text-red-600' : trend.direction === 'down' ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {trend.direction === 'up' ? <TrendingUp className="w-5 h-5" /> : trend.direction === 'down' ? <TrendingDown className="w-5 h-5" /> : null}
                          <span className="text-lg font-bold">{trend.change}%</span>
                          <span className="text-sm">{trend.direction === 'up' ? 'increase' : trend.direction === 'down' ? 'decrease' : 'stable'}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Historical Data Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="py-2 border-r border-b border-border">Assessment Date</TableHead>
                      <TableHead className="py-2 border-r border-b border-border">Assessor</TableHead>
                      <TableHead className="py-2 border-r border-b border-border">Inherent Risk</TableHead>
                      <TableHead className="py-2 border-r border-b border-border">Residual Risk</TableHead>
                      <TableHead className="py-2 border-r border-b border-border">Control Effectiveness</TableHead>
                      <TableHead className="py-2 border-b border-border">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historicalAssessments.map((assessment, index) => {
                      const prevAssessment = historicalAssessments[index + 1];
                      const inherentTrend = prevAssessment ? calculateTrend(assessment.inherentRisk.score, prevAssessment.inherentRisk.score) : null;
                      const residualTrend = prevAssessment ? calculateTrend(assessment.residualRisk.score, prevAssessment.residualRisk.score) : null;
                      
                      return (
                        <TableRow key={index} className={index === 0 ? 'bg-first-line/5' : ''}>
                          <TableCell className="py-2 border-r border-b border-border">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{format(new Date(assessment.date), 'MMM dd, yyyy')}</span>
                              {index === 0 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Latest</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2 border-r border-b border-border text-sm">
                            {assessment.assessor}
                          </TableCell>
                          <TableCell className="py-2 border-r border-b border-border">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{assessment.inherentRisk.score}</span>
                              <Badge className={getRiskBadgeColor(assessment.inherentRisk.level)}>
                                {assessment.inherentRisk.level}
                              </Badge>
                              {inherentTrend && inherentTrend.direction !== 'stable' && (
                                <span className={`text-xs flex items-center ${inherentTrend.direction === 'up' ? 'text-red-600' : 'text-green-600'}`}>
                                  {inherentTrend.direction === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                  {inherentTrend.change}%
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2 border-r border-b border-border">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{assessment.residualRisk.score}</span>
                              <Badge className={getRiskBadgeColor(assessment.residualRisk.level)}>
                                {assessment.residualRisk.level}
                              </Badge>
                              {residualTrend && residualTrend.direction !== 'stable' && (
                                <span className={`text-xs flex items-center ${residualTrend.direction === 'up' ? 'text-red-600' : 'text-green-600'}`}>
                                  {residualTrend.direction === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                  {residualTrend.change}%
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2 border-r border-b border-border">
                            <Badge className={getEffectivenessColor(assessment.controlEffectiveness)}>
                              {assessment.controlEffectiveness}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2 border-b border-border">
                            <Badge variant="outline">{assessment.status}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Notes Section */}
              {historicalAssessments.some(a => a.notes) && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Assessment Notes</h4>
                  <div className="space-y-2">
                    {historicalAssessments.filter(a => a.notes).map((assessment, index) => (
                      <div key={index} className="bg-muted/30 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1">
                          {format(new Date(assessment.date), 'MMM dd, yyyy')} - {assessment.assessor}
                        </div>
                        <p className="text-sm">{assessment.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
