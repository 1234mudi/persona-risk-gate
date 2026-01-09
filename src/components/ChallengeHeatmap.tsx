import React, { useMemo, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeatmapCellData {
  businessUnit: string;
  category: string;
  naPercentage: number;
  totalControls: number;
  naControls: number;
}

interface ChallengeHeatmapProps {
  className?: string;
}

const BUSINESS_UNITS = [
  "Retail Banking",
  "Corporate Banking",
  "Treasury",
  "Operations",
  "Risk Analytics",
];

const CATEGORIES = ["Operational", "Technology", "Compliance", "Financial"];

// Mock data simulating N/A controls per BU and Category
const mockHeatmapData: HeatmapCellData[] = [
  // Retail Banking
  { businessUnit: "Retail Banking", category: "Operational", naPercentage: 7.2, totalControls: 45, naControls: 3 },
  { businessUnit: "Retail Banking", category: "Technology", naPercentage: 15.8, totalControls: 38, naControls: 6 },
  { businessUnit: "Retail Banking", category: "Compliance", naPercentage: 5.1, totalControls: 39, naControls: 2 },
  { businessUnit: "Retail Banking", category: "Financial", naPercentage: 8.9, totalControls: 45, naControls: 4 },
  // Corporate Banking
  { businessUnit: "Corporate Banking", category: "Operational", naPercentage: 10.5, totalControls: 38, naControls: 4 },
  { businessUnit: "Corporate Banking", category: "Technology", naPercentage: 11.2, totalControls: 45, naControls: 5 },
  { businessUnit: "Corporate Banking", category: "Compliance", naPercentage: 8.3, totalControls: 36, naControls: 3 },
  { businessUnit: "Corporate Banking", category: "Financial", naPercentage: 12.4, totalControls: 40, naControls: 5 },
  // Treasury
  { businessUnit: "Treasury", category: "Operational", naPercentage: 6.8, totalControls: 44, naControls: 3 },
  { businessUnit: "Treasury", category: "Technology", naPercentage: 9.5, totalControls: 42, naControls: 4 },
  { businessUnit: "Treasury", category: "Compliance", naPercentage: 4.2, totalControls: 48, naControls: 2 },
  { businessUnit: "Treasury", category: "Financial", naPercentage: 11.1, totalControls: 36, naControls: 4 },
  // Operations
  { businessUnit: "Operations", category: "Operational", naPercentage: 11.2, totalControls: 45, naControls: 5 },
  { businessUnit: "Operations", category: "Technology", naPercentage: 14.8, totalControls: 41, naControls: 6 },
  { businessUnit: "Operations", category: "Compliance", naPercentage: 7.9, totalControls: 38, naControls: 3 },
  { businessUnit: "Operations", category: "Financial", naPercentage: 8.2, totalControls: 49, naControls: 4 },
  // Risk Analytics
  { businessUnit: "Risk Analytics", category: "Operational", naPercentage: 8.1, totalControls: 37, naControls: 3 },
  { businessUnit: "Risk Analytics", category: "Technology", naPercentage: 10.2, totalControls: 49, naControls: 5 },
  { businessUnit: "Risk Analytics", category: "Compliance", naPercentage: 5.5, totalControls: 36, naControls: 2 },
  { businessUnit: "Risk Analytics", category: "Financial", naPercentage: 8.4, totalControls: 48, naControls: 4 },
];

export const ChallengeHeatmap: React.FC<ChallengeHeatmapProps> = ({ className }) => {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  // Calculate enterprise averages per category
  const enterpriseAverages = useMemo(() => {
    const averages: Record<string, number> = {};
    
    CATEGORIES.forEach((category) => {
      const categoryData = mockHeatmapData.filter((d) => d.category === category);
      const avgNa = categoryData.reduce((sum, d) => sum + d.naPercentage, 0) / categoryData.length;
      averages[category] = avgNa;
    });
    
    return averages;
  }, []);

  // Get cell data for a specific BU and category
  const getCellData = (bu: string, category: string): HeatmapCellData | undefined => {
    return mockHeatmapData.find((d) => d.businessUnit === bu && d.category === category);
  };

  // Calculate variance from enterprise average
  const getVariance = (naPercentage: number, category: string): number => {
    return naPercentage - enterpriseAverages[category];
  };

  // Get color class based on variance
  const getCellColorClass = (variance: number): string => {
    if (variance > 3) return "bg-red-500/20 dark:bg-red-500/30 border-red-500/40";
    if (variance > 1) return "bg-orange-500/20 dark:bg-orange-500/30 border-orange-500/40";
    if (variance >= -1) return "bg-yellow-500/20 dark:bg-yellow-500/30 border-yellow-500/40";
    return "bg-green-500/20 dark:bg-green-500/30 border-green-500/40";
  };

  // Get text color class based on variance
  const getTextColorClass = (variance: number): string => {
    if (variance > 3) return "text-red-600 dark:text-red-400";
    if (variance > 1) return "text-orange-600 dark:text-orange-400";
    if (variance >= -1) return "text-yellow-600 dark:text-yellow-400";
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

  // Abbreviate category names
  const abbreviateCategory = (cat: string): string => {
    const abbrevMap: Record<string, string> = {
      "Operational": "Ops",
      "Technology": "Tech",
      "Compliance": "Comp",
      "Financial": "Fin",
    };
    return abbrevMap[cat] || cat;
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Heatmap Grid */}
      <div className="flex-1">
        <div>
          {/* Header Row */}
          <div className="grid gap-0.5 mb-0.5" style={{ gridTemplateColumns: "48px repeat(4, 1fr)" }}>
            <div className="p-1" /> {/* Empty corner cell */}
            {CATEGORIES.map((category) => (
              <div
                key={category}
                className="p-1 text-center bg-muted/50 dark:bg-muted/30 border border-border/30"
              >
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  {abbreviateCategory(category)}
                </span>
              </div>
            ))}
          </div>

          {/* Data Rows */}
          {BUSINESS_UNITS.map((bu) => (
            <div key={bu} className="grid gap-0.5 mb-0.5" style={{ gridTemplateColumns: "48px repeat(4, 1fr)" }}>
              {/* Row Header */}
              <div className="p-1 flex items-center bg-muted/50 dark:bg-muted/30 border border-border/30">
                <span className="text-[10px] font-semibold text-muted-foreground truncate">
                  {abbreviateBU(bu)}
                </span>
              </div>

              {/* Data Cells */}
              {CATEGORIES.map((category) => {
                const cellData = getCellData(bu, category);
                if (!cellData) return null;

                const variance = getVariance(cellData.naPercentage, category);
                const cellKey = `${bu}-${category}`;
                const isHovered = hoveredCell === cellKey;

                return (
                  <Tooltip key={cellKey}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "p-1 cursor-pointer transition-all duration-200 border",
                          getCellColorClass(variance),
                          isHovered && "ring-2 ring-primary ring-offset-1"
                        )}
                        onMouseEnter={() => setHoveredCell(cellKey)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <span className="text-xs font-bold text-foreground">
                            {cellData.naPercentage.toFixed(1)}%
                          </span>
                          <div className={cn("flex items-center gap-0.5", getTextColorClass(variance))}>
                            {variance > 0.5 ? (
                              <TrendingUp className="w-2.5 h-2.5" />
                            ) : variance < -0.5 ? (
                              <TrendingDown className="w-2.5 h-2.5" />
                            ) : (
                              <Minus className="w-2.5 h-2.5" />
                            )}
                            <span className="text-[9px] font-medium">
                              {variance >= 0 ? "+" : ""}{variance.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      <div className="space-y-1">
                        <p className="font-semibold text-xs">{bu}</p>
                        <p className="text-xs text-muted-foreground">{category} Risk</p>
                        <div className="border-t border-border/50 pt-1 mt-1">
                          <p className="text-xs">
                            <span className="text-muted-foreground">N/A Controls:</span>{" "}
                            <span className="font-medium">{cellData.naControls} of {cellData.totalControls}</span>
                          </p>
                          <p className="text-xs">
                            <span className="text-muted-foreground">N/A Rate:</span>{" "}
                            <span className="font-medium">{cellData.naPercentage.toFixed(1)}%</span>
                          </p>
                          <p className="text-xs">
                            <span className="text-muted-foreground">Enterprise Avg:</span>{" "}
                            <span className="font-medium">{enterpriseAverages[category].toFixed(1)}%</span>
                          </p>
                          <p className={cn("text-xs font-medium", getTextColorClass(variance))}>
                            Variance: {variance >= 0 ? "+" : ""}{variance.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}

          {/* Enterprise Average Row */}
          <div className="grid gap-0.5 mt-1 pt-1 border-t-2 border-primary/30" style={{ gridTemplateColumns: "48px repeat(4, 1fr)" }}>
            <div className="p-1 flex items-center bg-primary/10 dark:bg-primary/20 border border-primary/30">
              <span className="text-[10px] font-bold text-primary uppercase">
                Avg
              </span>
            </div>
            {CATEGORIES.map((category) => (
              <div
                key={`avg-${category}`}
                className="p-1 bg-primary/10 dark:bg-primary/20 border border-primary/30"
              >
                <div className="flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {enterpriseAverages[category].toFixed(1)}%
                  </span>
                  <span className="text-[9px] text-muted-foreground">baseline</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 pt-1.5 border-t border-border/50">
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[8px]">
          <div className="flex items-center gap-0.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-green-500/30 border border-green-500/50" />
            <span className="text-muted-foreground">Below Avg</span>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-yellow-500/30 border border-yellow-500/50" />
            <span className="text-muted-foreground">Near Avg</span>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-orange-500/30 border border-orange-500/50" />
            <span className="text-muted-foreground">Above Avg</span>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-red-500/30 border border-red-500/50" />
            <span className="text-muted-foreground">High</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeHeatmap;
