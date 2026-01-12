import React, { useMemo, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrganizationHeatmapDrilldownModal } from "./OrganizationHeatmapDrilldownModal";

export interface OrgHeatmapData {
  businessUnit: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
  trends?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

interface RiskDataItem {
  id: string;
  title: string;
  businessUnit: string;
  category?: string;
  owner?: string;
  residualRisk?: { level: string; color?: string; score?: number };
  lastAssessed?: string;
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

// Mock data for residual risk distribution by business unit with trend data
const mockOrgHeatmapData: OrgHeatmapData[] = [
  { businessUnit: "Retail Banking", critical: 2, high: 5, medium: 8, low: 3, total: 18, trends: { critical: 0, high: 1, medium: -2, low: 1 } },
  { businessUnit: "Corporate Banking", critical: 1, high: 4, medium: 6, low: 4, total: 15, trends: { critical: 1, high: 0, medium: -1, low: 0 } },
  { businessUnit: "Treasury", critical: 0, high: 3, medium: 5, low: 5, total: 13, trends: { critical: 0, high: -1, medium: 1, low: -1 } },
  { businessUnit: "Operations", critical: 3, high: 6, medium: 7, low: 2, total: 18, trends: { critical: 1, high: 2, medium: 0, low: -1 } },
  { businessUnit: "Risk Analytics", critical: 1, high: 2, medium: 4, low: 6, total: 13, trends: { critical: -1, high: 0, medium: -1, low: 2 } },
];

export const OrganizationHeatmap: React.FC<OrganizationHeatmapProps> = ({ 
  className,
  riskData 
}) => {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [drilldownModal, setDrilldownModal] = useState<{
    isOpen: boolean;
    businessUnit: string;
    riskLevel: string;
    risks: RiskDataItem[];
  }>({
    isOpen: false,
    businessUnit: "",
    riskLevel: "",
    risks: [],
  });

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
        // Generate mock trends for demonstration (in production, this would come from comparing periods)
        trends: {
          critical: Math.floor(Math.random() * 3) - 1,
          high: Math.floor(Math.random() * 3) - 1,
          medium: Math.floor(Math.random() * 3) - 1,
          low: Math.floor(Math.random() * 3) - 1,
        },
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
          trends: {
            critical: Math.floor(Math.random() * 3) - 1,
            high: Math.floor(Math.random() * 3) - 1,
            medium: Math.floor(Math.random() * 3) - 1,
            low: Math.floor(Math.random() * 3) - 1,
          },
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

  // Get trend for a specific BU and risk level
  const getCellTrend = (bu: string, level: string): number => {
    const data = orgData.find(d => d.businessUnit === bu);
    if (!data || !data.trends) return 0;
    return data.trends[level.toLowerCase() as keyof typeof data.trends] || 0;
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

  // Get trend indicator component with squiggly line SVG
  const getTrendIndicator = (trend: number) => {
    if (trend === 0) return null;
    if (trend > 0) {
      return (
        <span className="inline-flex items-center text-red-500 ml-0.5">
          <svg className="w-2.5 h-2.5" viewBox="0 0 12 12">
            <path d="M1 9 Q3 5 6 7 Q9 9 11 3" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M9 3 L11 3 L11 5" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-green-500 ml-0.5">
        <svg className="w-2.5 h-2.5" viewBox="0 0 12 12">
          <path d="M1 3 Q3 7 6 5 Q9 3 11 9" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M9 9 L11 9 L11 7" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
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

  // Handle cell click for drilldown
  const handleCellClick = (bu: string, level: string, count: number) => {
    if (count === 0) return;
    const filteredRisks = riskData?.filter(
      (r) =>
        r.businessUnit === bu &&
        r.residualRisk?.level?.toLowerCase() === level.toLowerCase()
    ) || [];
    setDrilldownModal({
      isOpen: true,
      businessUnit: bu,
      riskLevel: level,
      risks: filteredRisks,
    });
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Heatmap Grid */}
      <div>
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
                const trend = getCellTrend(data.businessUnit, level);
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
                        onClick={() => handleCellClick(data.businessUnit, level, count)}
                      >
                        <span
                          className={cn(
                            "text-[10px] font-bold",
                            getTextColorClass(level, count)
                          )}
                        >
                          {count}
                        </span>
                        {getTrendIndicator(trend)}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-semibold">{data.businessUnit}</p>
                      <p>{count} {level} residual risks</p>
                      <p className="text-muted-foreground">
                        {data.total > 0 ? ((count / data.total) * 100).toFixed(0) : 0}% of BU total
                      </p>
                      {trend !== 0 && (
                        <p className={cn(
                          "text-xs mt-1",
                          trend > 0 ? "text-red-500" : "text-green-500"
                        )}>
                          {trend > 0 ? "↑" : "↓"} {Math.abs(trend)} vs previous period
                        </p>
                      )}
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
          {/* Trend legend */}
          <div className="border-l border-border/50 pl-3 ml-1 flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              <svg className="w-2.5 h-2.5 text-red-500" viewBox="0 0 12 12">
                <path d="M1 9 Q3 5 6 7 Q9 9 11 3" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M9 3 L11 3 L11 5" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[8px] text-muted-foreground">Increased</span>
            </div>
            <div className="flex items-center gap-0.5">
              <svg className="w-2.5 h-2.5 text-green-500" viewBox="0 0 12 12">
                <path d="M1 3 Q3 7 6 5 Q9 3 11 9" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M9 9 L11 9 L11 7" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[8px] text-muted-foreground">Decreased</span>
            </div>
          </div>
        </div>
        {/* Reading Instructions */}
        <div className="bg-muted/40 dark:bg-muted/20 p-2 rounded mt-1">
          <p className="text-[9px] font-medium text-muted-foreground mb-1">How to read this heatmap:</p>
          <ul className="text-[8px] text-muted-foreground/80 space-y-0.5 list-disc list-inside">
            <li>Each row represents a Business Unit, each column a risk level</li>
            <li>Cell color intensity shows concentration — darker = more risks</li>
            <li>Trend arrows: Red squiggle ↗ = risk increased, Green squiggle ↘ = risk decreased</li>
            <li><strong>Click any cell</strong> to view the individual risks</li>
          </ul>
        </div>
      </div>

      {/* Drilldown Modal */}
      <OrganizationHeatmapDrilldownModal
        isOpen={drilldownModal.isOpen}
        onClose={() => setDrilldownModal((prev) => ({ ...prev, isOpen: false }))}
        businessUnit={drilldownModal.businessUnit}
        riskLevel={drilldownModal.riskLevel}
        risks={drilldownModal.risks}
      />
    </div>
  );
};

// Export function to get heatmap data for export
export function getHeatmapExportData(orgData: OrgHeatmapData[], levelTotals: { critical: number; high: number; medium: number; low: number; total: number }) {
  return {
    businessUnits: orgData.map(bu => ({
      name: bu.businessUnit,
      critical: bu.critical,
      high: bu.high,
      medium: bu.medium,
      low: bu.low,
      total: bu.total,
      trends: bu.trends,
    })),
    totals: levelTotals,
  };
}
