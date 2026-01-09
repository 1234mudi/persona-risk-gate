import React, { useMemo, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAControlsDrilldownModal, NAControlDetails } from "./NAControlsDrilldownModal";

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

// Mock detailed N/A control data for drilldown
const naControlDetailsMap: Record<string, NAControlDetails[]> = {
  "Retail Banking-Operational": [
    { id: "CTL-045", name: "Manual Reconciliation", riskId: "RISK-2025-012", riskName: "Settlement Risk", justification: "Control replaced by automated system in Q4 2024", markedBy: "John Smith", markedDate: "2024-12-15" },
    { id: "CTL-089", name: "Physical Document Check", riskId: "RISK-2025-018", riskName: "Documentation Risk", justification: "Process fully digitized - physical checks no longer applicable", markedBy: "Sarah Lee", markedDate: "2024-11-20" },
    { id: "CTL-112", name: "Branch Audit Trail", riskId: "RISK-2025-022", riskName: "Audit Risk", justification: "Branch operations consolidated to central hub", markedBy: "Mike Chen", markedDate: "2024-10-05" },
  ],
  "Retail Banking-Technology": [
    { id: "CTL-156", name: "Legacy System Patch", riskId: "RISK-2025-031", riskName: "Technology Obsolescence", justification: "Legacy system decommissioned and replaced with cloud solution", markedBy: "Anna Wong", markedDate: "2024-12-01" },
    { id: "CTL-178", name: "On-premise Backup", riskId: "RISK-2025-035", riskName: "Data Loss Risk", justification: "Migrated to cloud-based backup solution", markedBy: "Tom Davis", markedDate: "2024-11-15" },
    { id: "CTL-201", name: "Manual Code Review", riskId: "RISK-2025-041", riskName: "Code Quality Risk", justification: "Replaced by automated CI/CD pipeline with static analysis", markedBy: "Lisa Park", markedDate: "2024-10-28" },
    { id: "CTL-215", name: "VPN Access Control", riskId: "RISK-2025-045", riskName: "Network Security Risk", justification: "Zero-trust architecture implemented - VPN no longer used", markedBy: "James Wilson", markedDate: "2024-09-30" },
    { id: "CTL-228", name: "Desktop Antivirus", riskId: "RISK-2025-048", riskName: "Malware Risk", justification: "Replaced by EDR solution with cloud management", markedBy: "Emma Brown", markedDate: "2024-11-10" },
    { id: "CTL-241", name: "Local Admin Rights", riskId: "RISK-2025-052", riskName: "Privilege Escalation Risk", justification: "PAM solution implemented - local admin removed", markedBy: "David Kim", markedDate: "2024-10-15" },
  ],
  "Retail Banking-Compliance": [
    { id: "CTL-267", name: "Paper Record Retention", riskId: "RISK-2025-058", riskName: "Compliance Record Risk", justification: "Digital archival system implemented", markedBy: "Rachel Green", markedDate: "2024-12-05" },
    { id: "CTL-289", name: "Manual Regulatory Filing", riskId: "RISK-2025-062", riskName: "Regulatory Reporting Risk", justification: "Automated regulatory reporting system deployed", markedBy: "Chris Martin", markedDate: "2024-11-25" },
  ],
  "Retail Banking-Financial": [
    { id: "CTL-312", name: "Manual Interest Calculation", riskId: "RISK-2025-071", riskName: "Interest Rate Risk", justification: "Core banking system handles all calculations", markedBy: "Julia Roberts", markedDate: "2024-12-10" },
    { id: "CTL-334", name: "Spreadsheet Reconciliation", riskId: "RISK-2025-075", riskName: "Financial Reporting Risk", justification: "Replaced by integrated reconciliation module", markedBy: "Kevin Hart", markedDate: "2024-11-18" },
    { id: "CTL-356", name: "Dual Signature Check", riskId: "RISK-2025-079", riskName: "Authorization Risk", justification: "Digital workflow with electronic approvals implemented", markedBy: "Nancy Drew", markedDate: "2024-10-22" },
    { id: "CTL-378", name: "Cash Handling Audit", riskId: "RISK-2025-083", riskName: "Cash Risk", justification: "Branch now operates as cashless - digital transactions only", markedBy: "Peter Parker", markedDate: "2024-09-28" },
  ],
  "Corporate Banking-Operational": [
    { id: "CTL-401", name: "Manual Trade Confirmation", riskId: "RISK-2025-091", riskName: "Trade Settlement Risk", justification: "STP system handles all confirmations automatically", markedBy: "Tony Stark", markedDate: "2024-12-08" },
    { id: "CTL-423", name: "Physical Collateral Check", riskId: "RISK-2025-095", riskName: "Collateral Risk", justification: "Digital collateral management system implemented", markedBy: "Bruce Wayne", markedDate: "2024-11-12" },
    { id: "CTL-445", name: "Fax-based Instructions", riskId: "RISK-2025-099", riskName: "Communication Risk", justification: "Fax decommissioned - all instructions via secure portal", markedBy: "Clark Kent", markedDate: "2024-10-18" },
    { id: "CTL-467", name: "Manual Limit Monitoring", riskId: "RISK-2025-103", riskName: "Credit Limit Risk", justification: "Real-time automated limit monitoring in place", markedBy: "Diana Prince", markedDate: "2024-09-25" },
  ],
  "Corporate Banking-Technology": [
    { id: "CTL-489", name: "Mainframe Batch Jobs", riskId: "RISK-2025-111", riskName: "Processing Risk", justification: "Migrated to real-time event-driven architecture", markedBy: "Barry Allen", markedDate: "2024-12-03" },
    { id: "CTL-511", name: "Manual DR Testing", riskId: "RISK-2025-115", riskName: "Disaster Recovery Risk", justification: "Automated DR testing with cloud failover", markedBy: "Hal Jordan", markedDate: "2024-11-08" },
    { id: "CTL-533", name: "Physical Token Auth", riskId: "RISK-2025-119", riskName: "Authentication Risk", justification: "Replaced by mobile authenticator app", markedBy: "Arthur Curry", markedDate: "2024-10-14" },
    { id: "CTL-555", name: "On-site Server Maintenance", riskId: "RISK-2025-123", riskName: "Infrastructure Risk", justification: "Cloud-native infrastructure - no on-site servers", markedBy: "Victor Stone", markedDate: "2024-09-20" },
    { id: "CTL-577", name: "Manual Log Review", riskId: "RISK-2025-127", riskName: "Monitoring Risk", justification: "SIEM with automated anomaly detection deployed", markedBy: "Oliver Queen", markedDate: "2024-08-30" },
  ],
  "Corporate Banking-Compliance": [
    { id: "CTL-599", name: "Manual Sanctions Screening", riskId: "RISK-2025-135", riskName: "Sanctions Risk", justification: "Automated screening integrated with transaction flow", markedBy: "Kate Kane", markedDate: "2024-12-12" },
    { id: "CTL-621", name: "Physical Audit Files", riskId: "RISK-2025-139", riskName: "Audit Trail Risk", justification: "Digital audit management system implemented", markedBy: "Selina Kyle", markedDate: "2024-11-22" },
    { id: "CTL-643", name: "Manual CTR Filing", riskId: "RISK-2025-143", riskName: "AML Reporting Risk", justification: "Automated CTR generation and filing in place", markedBy: "Barbara Gordon", markedDate: "2024-10-28" },
  ],
  "Corporate Banking-Financial": [
    { id: "CTL-665", name: "Manual FX Confirmation", riskId: "RISK-2025-151", riskName: "FX Settlement Risk", justification: "SWIFT confirmation matching automated", markedBy: "Alfred Pennyworth", markedDate: "2024-12-06" },
    { id: "CTL-687", name: "Spreadsheet P&L", riskId: "RISK-2025-155", riskName: "Financial Accuracy Risk", justification: "Integrated front-to-back P&L system deployed", markedBy: "Lucius Fox", markedDate: "2024-11-16" },
    { id: "CTL-709", name: "Manual Margin Calls", riskId: "RISK-2025-159", riskName: "Margin Risk", justification: "Automated margin call system with real-time monitoring", markedBy: "Harvey Dent", markedDate: "2024-10-22" },
    { id: "CTL-731", name: "Paper Trade Tickets", riskId: "RISK-2025-163", riskName: "Trade Documentation Risk", justification: "Electronic trade capture - no paper tickets", markedBy: "Edward Nygma", markedDate: "2024-09-28" },
    { id: "CTL-753", name: "Manual Nostro Recon", riskId: "RISK-2025-167", riskName: "Reconciliation Risk", justification: "Automated nostro reconciliation with exception handling", markedBy: "Oswald Cobblepot", markedDate: "2024-08-25" },
  ],
};

// Helper to get or generate N/A control details for any BU-Category combination
const getNAControlDetails = (bu: string, category: string, count: number): NAControlDetails[] => {
  const key = `${bu}-${category}`;
  if (naControlDetailsMap[key]) {
    return naControlDetailsMap[key].slice(0, count);
  }
  // Generate mock data for combinations not explicitly defined
  return Array.from({ length: count }, (_, i) => ({
    id: `CTL-${Math.floor(Math.random() * 900) + 100}`,
    name: `${category} Control ${i + 1}`,
    riskId: `RISK-2025-${Math.floor(Math.random() * 100) + 100}`,
    riskName: `${category} Risk - ${bu}`,
    justification: "Control marked as N/A due to process changes or system updates",
    markedBy: ["John Doe", "Jane Smith", "Alex Johnson", "Chris Lee"][Math.floor(Math.random() * 4)],
    markedDate: `2024-${String(Math.floor(Math.random() * 3) + 10).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
  }));
};

export const ChallengeHeatmap: React.FC<ChallengeHeatmapProps> = ({ className }) => {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [drilldownModal, setDrilldownModal] = useState<{
    isOpen: boolean;
    businessUnit: string;
    category: string;
    controls: NAControlDetails[];
    totalControls: number;
  }>({
    isOpen: false,
    businessUnit: "",
    category: "",
    controls: [],
    totalControls: 0,
  });

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

  // Handle cell click for drilldown
  const handleCellClick = (bu: string, category: string, cellData: HeatmapCellData) => {
    const controls = getNAControlDetails(bu, category, cellData.naControls);
    setDrilldownModal({
      isOpen: true,
      businessUnit: bu,
      category: category,
      controls: controls,
      totalControls: cellData.totalControls,
    });
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
                        onClick={() => handleCellClick(bu, category, cellData)}
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
                        <p className="text-[10px] text-primary font-medium pt-1 border-t border-border/50">
                          Click to view N/A controls
                        </p>
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

      {/* N/A Controls Drilldown Modal */}
      <NAControlsDrilldownModal
        isOpen={drilldownModal.isOpen}
        onClose={() => setDrilldownModal(prev => ({ ...prev, isOpen: false }))}
        businessUnit={drilldownModal.businessUnit}
        category={drilldownModal.category}
        controls={drilldownModal.controls}
        totalControls={drilldownModal.totalControls}
      />
    </div>
  );
};

export default ChallengeHeatmap;
