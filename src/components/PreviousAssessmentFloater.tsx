import { useState } from "react";
import { History, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { HistoricalAssessment } from "@/data/initialRiskData";

interface PreviousAssessmentFloaterProps {
  type: 'inherent' | 'control' | 'residual';
  historicalAssessments: HistoricalAssessment[];
  isExpanded: boolean;
  onToggle: () => void;
}

const getRiskBadgeColor = (level: string) => {
  const lowerLevel = level.toLowerCase();
  if (lowerLevel.includes('critical') || lowerLevel.includes('very high')) {
    return "bg-red-500 text-white";
  } else if (lowerLevel.includes('high')) {
    return "bg-orange-500 text-white";
  } else if (lowerLevel.includes('medium') || lowerLevel.includes('moderate')) {
    return "bg-yellow-500 text-white";
  } else if (lowerLevel.includes('low')) {
    return "bg-green-500 text-white";
  }
  return "bg-muted text-muted-foreground";
};

const getControlBadgeColor = (effectiveness: string) => {
  const lower = effectiveness.toLowerCase();
  if (lower.includes('effective') && !lower.includes('partial') && !lower.includes('in')) {
    return "bg-green-500 text-white";
  } else if (lower.includes('partial')) {
    return "bg-amber-500 text-white";
  } else {
    return "bg-red-500 text-white";
  }
};

export const PreviousAssessmentFloater = ({ 
  type, 
  historicalAssessments, 
  isExpanded, 
  onToggle 
}: PreviousAssessmentFloaterProps) => {
  const hasPreviousAssessments = historicalAssessments && historicalAssessments.length > 0;
  
  if (!hasPreviousAssessments) return null;
  
  // Get most recent 3 assessments
  const recentAssessments = historicalAssessments.slice(0, 3);
  
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <button 
          className={`flex items-center gap-1 text-[8px] text-blue-600 dark:text-blue-400 hover:underline transition-all ${
            hasPreviousAssessments ? 'animate-pulse hover:animate-none' : ''
          }`}
        >
          <History className="w-2.5 h-2.5" />
          <span>Previous ({historicalAssessments.length})</span>
          {isExpanded ? <ChevronDown className="w-2 h-2" /> : <ChevronRight className="w-2 h-2" />}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="animate-accordion-down">
        <div className="absolute z-50 mt-1 p-2 bg-popover border border-border rounded-lg shadow-lg min-w-[200px] animate-fade-in left-0">
          <div className="text-[9px] font-medium text-muted-foreground mb-1.5 border-b border-border pb-1">
            {type === 'inherent' && 'Inherent Risk History'}
            {type === 'control' && 'Control Effectiveness History'}
            {type === 'residual' && 'Residual Risk History'}
          </div>
          <div className="space-y-1.5">
            {recentAssessments.map((assessment, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between gap-2 text-[9px] p-1.5 rounded bg-muted/50 hover:bg-muted transition-colors"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">
                    {format(new Date(assessment.date), 'MMM dd, yyyy')}
                  </span>
                  <span className="text-[8px] text-muted-foreground/70">
                    {assessment.assessor}
                  </span>
                </div>
                {type === 'inherent' && (
                  <Badge className={`${getRiskBadgeColor(assessment.inherentRisk.level)} text-[8px] px-1.5 py-0`}>
                    {assessment.inherentRisk.level} ({assessment.inherentRisk.score})
                  </Badge>
                )}
                {type === 'control' && (
                  <Badge className={`${getControlBadgeColor(assessment.controlEffectiveness)} text-[8px] px-1.5 py-0`}>
                    {assessment.controlEffectiveness}
                  </Badge>
                )}
                {type === 'residual' && (
                  <Badge className={`${getRiskBadgeColor(assessment.residualRisk.level)} text-[8px] px-1.5 py-0`}>
                    {assessment.residualRisk.level} ({assessment.residualRisk.score})
                  </Badge>
                )}
              </div>
            ))}
            {historicalAssessments.length > 3 && (
              <button className="w-full text-center text-[8px] text-blue-600 dark:text-blue-400 hover:underline pt-1 border-t border-border">
                View all {historicalAssessments.length} assessments
              </button>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
