import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, History, ArrowUp, ArrowDown, ChevronDown, ChevronRight, Shield, Search, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";

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

const getNameWithInitials = (fullName: string) => {
  const nameParts = fullName.trim().split(' ');
  const initials = nameParts.map(part => part.charAt(0).toUpperCase()).join('');
  return `${fullName} (${initials})`;
};

export const HistoricalAssessmentsModal = ({
  open,
  onOpenChange,
  riskId,
  riskTitle,
  historicalAssessments
}: HistoricalAssessmentsModalProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set([0]));
  const [searchQuery, setSearchQuery] = useState('');
  const [assessorFilter, setAssessorFilter] = useState<string>('all');
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [effectivenessFilter, setEffectivenessFilter] = useState<string>('all');

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

  // Derive filter options from data
  const uniqueAssessors = useMemo(() => 
    [...new Set(historicalAssessments.map(a => a.assessor))], 
    [historicalAssessments]
  );
  const uniqueStatuses = useMemo(() => 
    [...new Set(historicalAssessments.map(a => a.status))], 
    [historicalAssessments]
  );
  const uniqueEffectiveness = useMemo(() => 
    [...new Set(historicalAssessments.map(a => a.controlEffectiveness))], 
    [historicalAssessments]
  );
  const riskLevels = ['Critical', 'High', 'Medium', 'Low'];

  // Filter assessments
  const filteredAssessments = useMemo(() => {
    return historicalAssessments.filter(assessment => {
      // Text search (assessor, notes, controls)
      const matchesSearch = searchQuery === '' || 
        assessment.assessor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.controlsAssessed?.some(c => 
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
      
      // Filter by assessor
      const matchesAssessor = assessorFilter === 'all' || assessment.assessor === assessorFilter;
      
      // Filter by risk level (inherent or residual)
      const matchesRiskLevel = riskLevelFilter === 'all' || 
        assessment.inherentRisk.level === riskLevelFilter ||
        assessment.residualRisk.level === riskLevelFilter;
      
      // Filter by status
      const matchesStatus = statusFilter === 'all' || assessment.status === statusFilter;
      
      // Filter by effectiveness
      const matchesEffectiveness = effectivenessFilter === 'all' || 
        assessment.controlEffectiveness === effectivenessFilter;
      
      return matchesSearch && matchesAssessor && matchesRiskLevel && matchesStatus && matchesEffectiveness;
    });
  }, [historicalAssessments, searchQuery, assessorFilter, riskLevelFilter, statusFilter, effectivenessFilter]);

  const hasActiveFilters = searchQuery || assessorFilter !== 'all' || riskLevelFilter !== 'all' || statusFilter !== 'all' || effectivenessFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setAssessorFilter('all');
    setRiskLevelFilter('all');
    setStatusFilter('all');
    setEffectivenessFilter('all');
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
        
        <div className="mt-3">
          {historicalAssessments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No historical assessments available.
            </div>
          ) : (
            <TooltipProvider delayDuration={200}>
              {/* Trend Summary */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-muted/30 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1.5">Inherent Risk Trend</h4>
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
                <div className="bg-muted/30 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1.5">Residual Risk Trend</h4>
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

              {/* Filter Bar */}
              <div className="flex flex-wrap items-center gap-2 mb-3 p-2 bg-muted/20 rounded-lg">
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search assessors, controls, notes..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                
                <Select value={assessorFilter} onValueChange={setAssessorFilter}>
                  <SelectTrigger className="w-[130px] h-8 text-sm">
                    <SelectValue placeholder="Assessor" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="all">All Assessors</SelectItem>
                    {uniqueAssessors.map(assessor => (
                      <SelectItem key={assessor} value={assessor}>{assessor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
                  <SelectTrigger className="w-[110px] h-8 text-sm">
                    <SelectValue placeholder="Risk Level" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="all">All Levels</SelectItem>
                    {riskLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[110px] h-8 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="all">All Statuses</SelectItem>
                    {uniqueStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={effectivenessFilter} onValueChange={setEffectivenessFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-sm">
                    <SelectValue placeholder="Effectiveness" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="all">All Effectiveness</SelectItem>
                    {uniqueEffectiveness.map(eff => (
                      <SelectItem key={eff} value={eff}>{eff}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs px-2"
                    onClick={clearFilters}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Results count */}
              {filteredAssessments.length !== historicalAssessments.length && (
                <div className="text-xs text-muted-foreground mb-2">
                  Showing {filteredAssessments.length} of {historicalAssessments.length} assessments
                </div>
              )}

              {/* Historical Data Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="py-1.5 border-r border-b border-border w-[130px]">Assessment Date</TableHead>
                      <TableHead className="py-1.5 border-r border-b border-border w-[140px]">Assessor</TableHead>
                      <TableHead className="py-1.5 border-r border-b border-border w-[130px]">Inherent Risk</TableHead>
                      <TableHead className="py-1.5 border-r border-b border-border w-[130px]">Residual Risk</TableHead>
                      <TableHead className="py-1.5 border-r border-b border-border">Controls Assessed</TableHead>
                      <TableHead className="py-1.5 border-r border-b border-border w-[120px]">Effectiveness</TableHead>
                      <TableHead className="py-1.5 border-b border-border w-[80px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssessments.map((assessment, index) => {
                      const originalIndex = historicalAssessments.indexOf(assessment);
                      const prevAssessment = historicalAssessments[originalIndex + 1];
                      const inherentTrend = prevAssessment ? calculateTrend(assessment.inherentRisk.score, prevAssessment.inherentRisk.score) : null;
                      const residualTrend = prevAssessment ? calculateTrend(assessment.residualRisk.score, prevAssessment.residualRisk.score) : null;
                      const hasControls = assessment.controlsAssessed && assessment.controlsAssessed.length > 0;
                      const isExpanded = expandedRows.has(index);
                      
                      return (
                        <TableRow key={index} className={originalIndex === 0 ? 'bg-first-line/5' : ''}>
                          <TableCell className="py-1.5 border-r border-b border-border">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-sm">{format(new Date(assessment.date), 'MMM dd, yyyy')}</span>
                              {originalIndex === 0 && (
                                <Badge variant="secondary" className="text-[10px] px-1 py-0">Latest</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-1.5 border-r border-b border-border text-sm">
                            {getNameWithInitials(assessment.assessor)}
                          </TableCell>
                          <TableCell className="py-1.5 border-r border-b border-border">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm">{assessment.inherentRisk.score}</span>
                              <Badge className={`text-xs ${getRiskBadgeColor(assessment.inherentRisk.level)}`}>
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
                          <TableCell className="py-1.5 border-r border-b border-border">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm">{assessment.residualRisk.score}</span>
                              <Badge className={`text-xs ${getRiskBadgeColor(assessment.residualRisk.level)}`}>
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
                          <TableCell className="py-1.5 border-r border-b border-border">
                            {hasControls ? (
                              <Collapsible open={isExpanded} onOpenChange={() => toggleRow(index)}>
                                <CollapsibleTrigger className="flex items-center gap-1.5 w-full text-left hover:bg-muted/50 rounded p-0.5 -m-0.5">
                                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                                  <Shield className="w-3.5 h-3.5 text-first-line" />
                                  <span className="text-sm">{assessment.controlsAssessed!.length} control{assessment.controlsAssessed!.length > 1 ? 's' : ''}</span>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-1.5 space-y-1.5">
                                  {assessment.controlsAssessed!.map((control, ctrlIndex) => (
                                    <div key={ctrlIndex} className="bg-muted/30 rounded p-1.5 text-xs">
                                      <div className="flex items-center justify-between mb-1">
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
                                          <Badge variant="outline" className={`text-[10px] px-1 py-0 ${getEffectivenessColor(control.designEffectiveness)}`}>
                                            {control.designEffectiveness}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <span className="text-muted-foreground">Operating:</span>
                                          <Badge variant="outline" className={`text-[10px] px-1 py-0 ${getEffectivenessColor(control.operatingEffectiveness)}`}>
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
                          <TableCell className="py-1.5 border-r border-b border-border">
                            <Badge className={`text-xs ${getEffectivenessColor(assessment.controlEffectiveness)}`}>
                              {assessment.controlEffectiveness}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-1.5 border-b border-border">
                            <Badge variant="outline" className="text-xs">{assessment.status}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Notes Section */}
              {filteredAssessments.some(a => a.notes) && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-1.5">Assessment Notes</h4>
                  <div className="space-y-1.5">
                    {filteredAssessments.filter(a => a.notes).map((assessment, index) => (
                      <div key={index} className="bg-muted/30 rounded-lg p-2">
                        <div className="text-xs text-muted-foreground mb-0.5">
                          {format(new Date(assessment.date), 'MMM dd, yyyy')} - {getNameWithInitials(assessment.assessor)}
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
