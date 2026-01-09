import React, { useMemo, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface OrgHeatmapData {
  businessUnit: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

interface RiskDataItem {
  businessUnit: string;
  residualRisk?: { level: string; color?: string; score?: number };
}

interface OrganizationHeatmapProps {
  className?: string;
  riskData?: RiskDataItem[];
}

const BUSINESS_UNITS = [
  "Retail Banking",
  "Corporate Banking",
  "Treasury",
  "Operations",
  "Risk Analytics",
];

const RISK_LEVELS = ["Critical", "High", "Medium", "Low"] as const;

// Mock data for residual risk distribution by business unit
const mockOrgHeatmapData: OrgHeatmapData[] = [
  { businessUnit: "Retail Banking", critical: 2, high: 5, medium: 8, low: 3, total: 18 },
  { businessUnit: "Corporate Banking", critical: 1, high: 4, medium: 6, low: 4, total: 15 },
  { businessUnit: "Treasury", critical: 0, high: 3, medium: 5, low: 5, total: 13 },
  { businessUnit: "Operations", critical: 3, high: 6, medium: 7, low: 2, total: 18 },
  { businessUnit: "Risk Analytics", critical: 1, high: 2, medium: 4, low: 6, total: 13 },
];

export const OrganizationHeatmap: React.FC<OrganizationHeatmapProps> = ({ 
  className,
  riskData 
}) => {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  // Calculate aggregated data from riskData if provided, otherwise use mock data
  const orgData = useMemo(() => {
    if (!riskData || riskData.length === 0) {
      return mockOrgHeatmapData;
    }

    // Aggregate risks by business unit and residual risk level
    const aggregated: Record<string, OrgHeatmapData> = {};
    
    BUSINESS_UNITS.forEach(bu => {
      aggregated[bu] = {
        businessUnit: bu,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: 0,
      };
    });

    riskData.forEach(risk => {
      const bu = risk.businessUnit;
      if (!aggregated[bu]) {
        aggregated[bu] = {
          businessUnit: bu,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          total: 0,
        };
      }

      const residualLevel = risk.residualRisk?.level?.toLowerCase() || "medium";
      if (residualLevel === "critical") aggregated[bu].critical++;
      else if (residualLevel === "high") aggregated[bu].high++;
      else if (residualLevel === "medium") aggregated[bu].medium++;
      else if (residualLevel === "low") aggregated[bu].low++;
      aggregated[bu].total++;
    });

    return Object.values(aggregated).filter(d => d.total > 0);
  }, [riskData]);

  // Calculate totals for each risk level
  const levelTotals = useMemo(() => {
    return {
      critical: orgData.reduce((sum, d) => sum + d.critical, 0),
      high: orgData.reduce((sum, d) => sum + d.high, 0),
      medium: orgData.reduce((sum, d) => sum + d.medium, 0),
      low: orgData.reduce((sum, d) => sum + d.low, 0),
      total: orgData.reduce((sum, d) => sum + d.total, 0),
    };
  }, [orgData]);

  // Get cell value for a specific BU and risk level
  const getCellValue = (bu: string, level: string): number => {
    const data = orgData.find(d => d.businessUnit === bu);
    if (!data) return 0;
    return data[level.toLowerCase() as keyof OrgHeatmapData] as number;
  };

  // Get color intensity based on count relative to max in that column
  const getCellColorClass = (level: string, count: number): string => {
    const maxInLevel = Math.max(...orgData.map(d => d[level.toLowerCase() as keyof OrgHeatmapData] as number));
    const intensity = maxInLevel > 0 ? count / maxInLevel : 0;

    if (level === "Critical") {
      if (count === 0) return "bg-muted/30 border-border/30";
      if (intensity > 0.7) return "bg-red-500/40 dark:bg-red-500/50 border-red-500/60";
      if (intensity > 0.3) return "bg-red-500/25 dark:bg-red-500/35 border-red-500/40";
      return "bg-red-500/15 dark:bg-red-500/20 border-red-500/30";
    }
    if (level === "High") {
      if (count === 0) return "bg-muted/30 border-border/30";
      if (intensity > 0.7) return "bg-orange-500/40 dark:bg-orange-500/50 border-orange-500/60";
      if (intensity > 0.3) return "bg-orange-500/25 dark:bg-orange-500/35 border-orange-500/40";
      return "bg-orange-500/15 dark:bg-orange-500/20 border-orange-500/30";
    }
    if (level === "Medium") {
      if (count === 0) return "bg-muted/30 border-border/30";
      if (intensity > 0.7) return "bg-yellow-500/40 dark:bg-yellow-500/50 border-yellow-500/60";
      if (intensity > 0.3) return "bg-yellow-500/25 dark:bg-yellow-500/35 border-yellow-500/40";
      return "bg-yellow-500/15 dark:bg-yellow-500/20 border-yellow-500/30";
    }
    // Low
    if (count === 0) return "bg-muted/30 border-border/30";
    if (intensity > 0.7) return "bg-green-500/40 dark:bg-green-500/50 border-green-500/60";
    if (intensity > 0.3) return "bg-green-500/25 dark:bg-green-500/35 border-green-500/40";
    return "bg-green-500/15 dark:bg-green-500/20 border-green-500/30";
  };

  // Get text color class based on risk level
  const getTextColorClass = (level: string, count: number): string => {
    if (count === 0) return "text-muted-foreground/50";
    if (level === "Critical") return "text-red-600 dark:text-red-400";
    if (level === "High") return "text-orange-600 dark:text-orange-400";
    if (level === "Medium") return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  // Abbreviate BU names for compact display
  const abbreviateBU = (bu: string): string => {
    const abbrevMap: Record<string, string> = {
      "Retail Banking": "Retail",
      "Corporate Banking": "Corp",
      "Treasury": "Treasury",
      "Operations": "Ops",
      "Risk Analytics": "Risk",
    };
    return abbrevMap[bu] || bu;
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Heatmap Grid */}
      <div className="flex-1">
        <div>
          {/* Header Row */}
          <div className="grid gap-0.5 mb-0.5" style={{ gridTemplateColumns: "48px repeat(4, 1fr) 40px" }}>
            <div className="p-1" /> {/* Empty corner cell */}
            {RISK_LEVELS.map((level) => (
              <div
                key={level}
                className={cn(
                  "p-1 text-center border border-border/30",
                  level === "Critical" && "bg-red-500/10 dark:bg-red-500/20",
                  level === "High" && "bg-orange-500/10 dark:bg-orange-500/20",
                  level === "Medium" && "bg-yellow-500/10 dark:bg-yellow-500/20",
                  level === "Low" && "bg-green-500/10 dark:bg-green-500/20"
                )}
              >
                <span className={cn(
                  "text-[8px] font-semibold uppercase tracking-wide",
                  level === "Critical" && "text-red-600 dark:text-red-400",
                  level === "High" && "text-orange-600 dark:text-orange-400",
                  level === "Medium" && "text-yellow-600 dark:text-yellow-400",
                  level === "Low" && "text-green-600 dark:text-green-400"
                )}>
                  {level}
                </span>
              </div>
            ))}
            <div className="p-1 text-center bg-muted/50 dark:bg-muted/30 border border-border/30">
              <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
                Total
              </span>
            </div>
          </div>

          {/* Data Rows */}
          {orgData.map((data) => (
            <div
              key={data.businessUnit}
              className="grid gap-0.5 mb-0.5"
              style={{ gridTemplateColumns: "48px repeat(4, 1fr) 40px" }}
            >
              {/* BU Label */}
              <div className="p-1 flex items-center bg-muted/30 dark:bg-muted/20 border border-border/30">
                <span className="text-[9px] font-medium text-foreground truncate">
                  {abbreviateBU(data.businessUnit)}
                </span>
              </div>

              {/* Risk Level Cells */}
              {RISK_LEVELS.map((level) => {
                const count = getCellValue(data.businessUnit, level);
                const cellKey = `${data.businessUnit}-${level}`;
                const isHovered = hoveredCell === cellKey;

                return (
                  <Tooltip key={cellKey}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "p-1 text-center border cursor-pointer transition-all duration-150",
                          getCellColorClass(level, count),
                          isHovered && "ring-1 ring-primary/50 scale-[1.02]"
                        )}
                        onMouseEnter={() => setHoveredCell(cellKey)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <span
                          className={cn(
                            "text-[10px] font-bold",
                            getTextColorClass(level, count)
                          )}
                        >
                          {count}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-semibold">{data.businessUnit}</p>
                      <p>{count} {level} residual risks</p>
                      <p className="text-muted-foreground">
                        {data.total > 0 ? ((count / data.total) * 100).toFixed(0) : 0}% of BU total
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}

              {/* Total Column */}
              <div className="p-1 text-center bg-muted/40 dark:bg-muted/30 border border-border/30">
                <span className="text-[10px] font-bold text-foreground">
                  {data.total}
                </span>
              </div>
            </div>
          ))}

          {/* Total Row */}
          <div
            className="grid gap-0.5 mt-1"
            style={{ gridTemplateColumns: "48px repeat(4, 1fr) 40px" }}
          >
            <div className="p-1 flex items-center bg-primary/10 dark:bg-primary/20 border border-primary/30">
              <span className="text-[9px] font-bold text-primary uppercase">
                Total
              </span>
            </div>
            {RISK_LEVELS.map((level) => {
              const total = levelTotals[level.toLowerCase() as keyof typeof levelTotals];
              return (
                <div
                  key={`total-${level}`}
                  className={cn(
                    "p-1 text-center border",
                    level === "Critical" && "bg-red-500/20 dark:bg-red-500/30 border-red-500/40",
                    level === "High" && "bg-orange-500/20 dark:bg-orange-500/30 border-orange-500/40",
                    level === "Medium" && "bg-yellow-500/20 dark:bg-yellow-500/30 border-yellow-500/40",
                    level === "Low" && "bg-green-500/20 dark:bg-green-500/30 border-green-500/40"
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] font-bold",
                      level === "Critical" && "text-red-600 dark:text-red-400",
                      level === "High" && "text-orange-600 dark:text-orange-400",
                      level === "Medium" && "text-yellow-600 dark:text-yellow-400",
                      level === "Low" && "text-green-600 dark:text-green-400"
                    )}
                  >
                    {total}
                  </span>
                </div>
              );
            })}
            <div className="p-1 text-center bg-primary/20 dark:bg-primary/30 border border-primary/40">
              <span className="text-[10px] font-bold text-primary">
                {levelTotals.total}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 pt-1.5 border-t border-border/30">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-red-500/30 border border-red-500/50 rounded-sm" />
            <span className="text-[8px] text-muted-foreground">Critical</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-orange-500/30 border border-orange-500/50 rounded-sm" />
            <span className="text-[8px] text-muted-foreground">High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-yellow-500/30 border border-yellow-500/50 rounded-sm" />
            <span className="text-[8px] text-muted-foreground">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-green-500/30 border border-green-500/50 rounded-sm" />
            <span className="text-[8px] text-muted-foreground">Low</span>
          </div>
        </div>
        <p className="text-[7px] text-muted-foreground text-center mt-1">
          Color intensity = count relative to max in column
        </p>
      </div>
    </div>
  );
};
