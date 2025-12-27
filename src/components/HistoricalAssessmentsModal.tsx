import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, History, ArrowUp, ArrowDown, ChevronDown, ChevronRight, Shield } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface ControlAssessed {
  id: string;
  name: string;
  designEffectiveness: string;
  operatingEffectiveness: string;
  overallScore: number;
}

interface TrendRationale {
  inherent?: string;
  residual?: string;
}

interface HistoricalAssessment {
  date: string;
  assessor: string;
  inherentRisk: { level: string; score: number };
  residualRisk: { level: string; score: number };
  controlEffectiveness: string;
  status: string;
  notes?: string;
  controlsAssessed?: ControlAssessed[];
  trendRationale?: TrendRationale;
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

const getScoreColor = (score: number) => {
  if (score >= 5) return 'text-green-600 bg-green-100';
  if (score >= 4) return 'text-green-500 bg-green-50';
  if (score >= 3) return 'text-amber-600 bg-amber-100';
  if (score >= 2) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
};

const getScoreLabel = (score: number) => {
  if (score >= 5) return 'Excellent';
  if (score >= 4) return 'Good';
  if (score >= 3) return 'Adequate';
  if (score >= 2) return 'Weak';
  return 'Poor';
};

export const HistoricalAssessmentsModal = ({
  open,
  onOpenChange,
  riskId,
  riskTitle,
  historicalAssessments
}: HistoricalAssessmentsModalProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set([0])); // First row expanded by default

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

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
      <DialogContent className="max-w-6xl w-[95vw] max-h-[85vh] overflow-y-auto">
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
            <TooltipProvider delayDuration={200}>
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
                      const rationale = historicalAssessments[0].trendRationale?.inherent;
                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`flex items-center gap-1 cursor-help ${trend.direction === 'up' ? 'text-red-600' : trend.direction === 'down' ? 'text-green-600' : 'text-muted-foreground'}`}>
                              {trend.direction === 'up' ? <TrendingUp className="w-5 h-5" /> : trend.direction === 'down' ? <TrendingDown className="w-5 h-5" /> : null}
                              <span className="text-lg font-bold">{trend.change}%</span>
                              <span className="text-sm">{trend.direction === 'up' ? 'increase' : trend.direction === 'down' ? 'decrease' : 'stable'}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <p className="text-sm">{rationale || "Risk level changed based on assessment criteria updates."}</p>
                          </TooltipContent>
                        </Tooltip>
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
                      const rationale = historicalAssessments[0].trendRationale?.residual;
                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`flex items-center gap-1 cursor-help ${trend.direction === 'up' ? 'text-red-600' : trend.direction === 'down' ? 'text-green-600' : 'text-muted-foreground'}`}>
                              {trend.direction === 'up' ? <TrendingUp className="w-5 h-5" /> : trend.direction === 'down' ? <TrendingDown className="w-5 h-5" /> : null}
                              <span className="text-lg font-bold">{trend.change}%</span>
                              <span className="text-sm">{trend.direction === 'up' ? 'increase' : trend.direction === 'down' ? 'decrease' : 'stable'}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <p className="text-sm">{rationale || "Risk level changed based on control effectiveness updates."}</p>
                          </TooltipContent>
                        </Tooltip>
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
                      <TableHead className="py-2 border-r border-b border-border w-[140px]">Assessment Date</TableHead>
                      <TableHead className="py-2 border-r border-b border-border w-[120px]">Assessor</TableHead>
                      <TableHead className="py-2 border-r border-b border-border w-[140px]">Inherent Risk</TableHead>
                      <TableHead className="py-2 border-r border-b border-border w-[140px]">Residual Risk</TableHead>
                      <TableHead className="py-2 border-r border-b border-border">Controls Assessed</TableHead>
                      <TableHead className="py-2 border-r border-b border-border w-[130px]">Overall Effectiveness</TableHead>
                      <TableHead className="py-2 border-b border-border w-[90px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historicalAssessments.map((assessment, index) => {
                      const prevAssessment = historicalAssessments[index + 1];
                      const inherentTrend = prevAssessment ? calculateTrend(assessment.inherentRisk.score, prevAssessment.inherentRisk.score) : null;
                      const residualTrend = prevAssessment ? calculateTrend(assessment.residualRisk.score, prevAssessment.residualRisk.score) : null;
                      const hasControls = assessment.controlsAssessed && assessment.controlsAssessed.length > 0;
                      const isExpanded = expandedRows.has(index);
                      
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
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className={`text-xs flex items-center cursor-help ${inherentTrend.direction === 'up' ? 'text-red-600' : 'text-green-600'}`}>
                                      {inherentTrend.direction === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                      {inherentTrend.change}%
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p className="text-sm">{assessment.trendRationale?.inherent || "Change from previous assessment period."}</p>
                                  </TooltipContent>
                                </Tooltip>
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
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className={`text-xs flex items-center cursor-help ${residualTrend.direction === 'up' ? 'text-red-600' : 'text-green-600'}`}>
                                      {residualTrend.direction === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                      {residualTrend.change}%
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p className="text-sm">{assessment.trendRationale?.residual || "Change from previous assessment period."}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2 border-r border-b border-border">
                            {hasControls ? (
                              <Collapsible open={isExpanded} onOpenChange={() => toggleRow(index)}>
                                <CollapsibleTrigger className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded p-1 -m-1">
                                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                  <Shield className="w-4 h-4 text-first-line" />
                                  <span className="text-sm font-medium">{assessment.controlsAssessed!.length} control{assessment.controlsAssessed!.length > 1 ? 's' : ''} assessed</span>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2 space-y-2">
                                  {assessment.controlsAssessed!.map((control, ctrlIndex) => (
                                    <div key={ctrlIndex} className="bg-muted/30 rounded-lg p-2 text-xs">
                                      <div className="flex items-center justify-between mb-1.5">
                                        <span className="font-medium text-foreground">{control.id}: {control.name}</span>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className={`px-1.5 py-0.5 rounded font-semibold cursor-help ${getScoreColor(control.overallScore)}`}>
                                              {control.overallScore}/5
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent side="left">
                                            <p className="text-sm font-medium">{getScoreLabel(control.overallScore)}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </div>
                                      <div className="flex gap-2">
                                        <div className="flex items-center gap-1">
                                          <span className="text-muted-foreground">Design:</span>
                                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getEffectivenessColor(control.designEffectiveness)}`}>
                                            {control.designEffectiveness}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <span className="text-muted-foreground">Operating:</span>
                                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getEffectivenessColor(control.operatingEffectiveness)}`}>
                                            {control.operatingEffectiveness}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </CollapsibleContent>
                              </Collapsible>
                            ) : (
                              <span className="text-muted-foreground text-sm">No controls recorded</span>
                            )}
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
            </TooltipProvider>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
