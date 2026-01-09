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

// Mock detailed N/A control data for drilldown - aligned with 2nd line dashboard
const naControlDetailsMap: Record<string, NAControlDetails[]> = {
  "Retail Banking-Operational": [
    { id: "CTL-045", name: "Quality Assurance", riskId: "R-001", riskName: "Operational Process Failure", justification: "Control consolidated into automated quality monitoring system deployed in Q3 2024", markedBy: "John Smith", markedDate: "2024-12-15" },
    { id: "CTL-089", name: "Process Documentation", riskId: "R-002", riskName: "Branch Transaction Processing", justification: "Migrated to centralized digital process repository - manual documentation deprecated", markedBy: "Sarah Lee", markedDate: "2024-11-20" },
    { id: "CTL-112", name: "Staff Training Program", riskId: "R-003", riskName: "Cash Handling Errors", justification: "Replaced by mandatory e-learning platform with automated compliance tracking", markedBy: "Mike Chen", markedDate: "2024-10-05" },
  ],
  "Retail Banking-Technology": [
    { id: "CTL-156", name: "Access Control Management", riskId: "R-004", riskName: "Cybersecurity Threat", justification: "Superseded by enterprise IAM solution with SSO integration", markedBy: "Anna Wong", markedDate: "2024-12-01" },
    { id: "CTL-178", name: "Data Backup & Recovery", riskId: "R-005", riskName: "System Downtime", justification: "Cloud-native backup architecture implemented - on-premise backup retired", markedBy: "Tom Davis", markedDate: "2024-11-15" },
    { id: "CTL-201", name: "Incident Response Plan", riskId: "R-006", riskName: "Data Breach", justification: "Integrated into 24/7 SOC managed service - standalone process discontinued", markedBy: "Lisa Park", markedDate: "2024-10-28" },
    { id: "CTL-215", name: "Network Security Monitoring", riskId: "R-007", riskName: "Unauthorized Access", justification: "Zero-trust network architecture deployed - perimeter monitoring no longer applicable", markedBy: "James Wilson", markedDate: "2024-09-30" },
    { id: "CTL-228", name: "Endpoint Protection", riskId: "R-008", riskName: "Ransomware Attack", justification: "Replaced by XDR solution with cloud-native threat intelligence", markedBy: "Emma Brown", markedDate: "2024-11-10" },
    { id: "CTL-241", name: "Privileged Access Management", riskId: "R-009", riskName: "Insider Threat", justification: "Consolidated into enterprise PAM platform with just-in-time access", markedBy: "David Kim", markedDate: "2024-10-15" },
  ],
  "Retail Banking-Compliance": [
    { id: "CTL-267", name: "AML Transaction Monitoring", riskId: "R-010", riskName: "AML Compliance Failure", justification: "Real-time AI-powered transaction screening replaced rule-based manual review", markedBy: "Rachel Green", markedDate: "2024-12-05" },
    { id: "CTL-289", name: "Regulatory Reporting", riskId: "R-011", riskName: "Regulatory Reporting Delays", justification: "Automated regulatory reporting platform deployed with real-time submission", markedBy: "Chris Martin", markedDate: "2024-11-25" },
  ],
  "Retail Banking-Financial": [
    { id: "CTL-312", name: "Dual Authorization", riskId: "R-012", riskName: "Credit Risk Exposure", justification: "Workflow automation with digital approval routing supersedes manual dual sign-off", markedBy: "Julia Roberts", markedDate: "2024-12-10" },
    { id: "CTL-334", name: "Transaction Reconciliation", riskId: "R-013", riskName: "Liquidity Risk", justification: "Replaced by automated real-time reconciliation engine with exception handling", markedBy: "Kevin Hart", markedDate: "2024-11-18" },
    { id: "CTL-356", name: "Cash Count Verification", riskId: "R-014", riskName: "Financial Statement Error", justification: "Branch now operates as cashless - digital transactions only", markedBy: "Nancy Drew", markedDate: "2024-10-22" },
    { id: "CTL-378", name: "Branch Audits", riskId: "R-015", riskName: "Asset Misappropriation", justification: "Continuous monitoring system replaced periodic manual audits", markedBy: "Peter Parker", markedDate: "2024-09-28" },
  ],
  "Corporate Banking-Operational": [
    { id: "CTL-401", name: "Trade Confirmation System", riskId: "R-016", riskName: "Operational Process Failure", justification: "STP implementation achieved 99.9% auto-matching - manual confirmation eliminated", markedBy: "Tony Stark", markedDate: "2024-12-08" },
    { id: "CTL-423", name: "Collateral Management", riskId: "R-017", riskName: "Credit Risk Exposure", justification: "Digital collateral management platform with automated valuation deployed", markedBy: "Bruce Wayne", markedDate: "2024-11-12" },
    { id: "CTL-445", name: "Credit Limit Monitoring", riskId: "R-018", riskName: "Liquidity Risk", justification: "Real-time exposure monitoring system replaced periodic limit reviews", markedBy: "Clark Kent", markedDate: "2024-10-18" },
    { id: "CTL-467", name: "Liquidity Monitoring", riskId: "R-019", riskName: "Market Volatility", justification: "Intraday liquidity dashboard with automated alerts replaced manual tracking", markedBy: "Diana Prince", markedDate: "2024-09-25" },
  ],
  "Corporate Banking-Technology": [
    { id: "CTL-489", name: "System Change Management", riskId: "R-020", riskName: "System Downtime", justification: "Migrated to automated CI/CD pipeline with integrated change control", markedBy: "Barry Allen", markedDate: "2024-12-03" },
    { id: "CTL-511", name: "Disaster Recovery Testing", riskId: "R-021", riskName: "Data Breach", justification: "Automated DR testing with cloud failover replaces annual manual tests", markedBy: "Hal Jordan", markedDate: "2024-11-08" },
    { id: "CTL-533", name: "Multi-Factor Authentication", riskId: "R-022", riskName: "Unauthorized Access", justification: "Replaced by passwordless authentication with biometric verification", markedBy: "Arthur Curry", markedDate: "2024-10-14" },
    { id: "CTL-555", name: "Patch Management", riskId: "R-023", riskName: "Cybersecurity Threat", justification: "Cloud-native auto-patching eliminated need for manual patch cycles", markedBy: "Victor Stone", markedDate: "2024-09-20" },
    { id: "CTL-577", name: "Security Log Analysis", riskId: "R-024", riskName: "Ransomware Attack", justification: "SIEM with ML-based anomaly detection replaced manual log review", markedBy: "Oliver Queen", markedDate: "2024-08-30" },
  ],
  "Corporate Banking-Compliance": [
    { id: "CTL-599", name: "Sanctions Screening", riskId: "R-025", riskName: "AML Compliance Failure", justification: "Real-time sanctions screening integrated into transaction processing flow", markedBy: "Kate Kane", markedDate: "2024-12-12" },
    { id: "CTL-621", name: "Audit Trail Management", riskId: "R-026", riskName: "Regulatory Reporting Delays", justification: "Immutable blockchain-based audit trail replaced file-based records", markedBy: "Selina Kyle", markedDate: "2024-11-22" },
    { id: "CTL-643", name: "KYC Documentation Review", riskId: "R-027", riskName: "Third Party Dependency", justification: "AI-powered KYC automation with document verification deployed", markedBy: "Barbara Gordon", markedDate: "2024-10-28" },
  ],
  "Corporate Banking-Financial": [
    { id: "CTL-665", name: "FX Position Monitoring", riskId: "R-028", riskName: "Market Volatility", justification: "Real-time position monitoring dashboard replaced end-of-day reconciliation", markedBy: "Alfred Pennyworth", markedDate: "2024-12-06" },
    { id: "CTL-687", name: "P&L Attribution", riskId: "R-029", riskName: "Financial Statement Error", justification: "Integrated front-to-back attribution system deployed with automated P&L explain", markedBy: "Lucius Fox", markedDate: "2024-11-16" },
    { id: "CTL-709", name: "Margin Call Processing", riskId: "R-030", riskName: "Credit Risk Exposure", justification: "Automated margin call system with real-time collateral valuation", markedBy: "Harvey Dent", markedDate: "2024-10-22" },
    { id: "CTL-731", name: "Trade Settlement", riskId: "R-031", riskName: "Operational Process Failure", justification: "T+0 settlement achieved through DLT integration - manual settlement eliminated", markedBy: "Edward Nygma", markedDate: "2024-09-28" },
    { id: "CTL-753", name: "Nostro Reconciliation", riskId: "R-032", riskName: "Liquidity Risk", justification: "AI-powered auto-reconciliation with predictive exception handling", markedBy: "Oswald Cobblepot", markedDate: "2024-08-25" },
  ],
};

// Control names and risk names aligned with 2nd line dashboard
const CONTROL_NAMES = [
  "Quality Assurance", "Process Documentation", "Staff Training Program", "Access Control Management",
  "Data Backup & Recovery", "Incident Response Plan", "Network Security Monitoring", "Endpoint Protection",
  "Privileged Access Management", "AML Transaction Monitoring", "Regulatory Reporting", "Dual Authorization",
  "Transaction Reconciliation", "Cash Count Verification", "Branch Audits", "Trade Confirmation System",
  "Collateral Management", "Credit Limit Monitoring", "Liquidity Monitoring", "System Change Management"
];

const RISK_NAMES = [
  "Operational Process Failure", "Branch Transaction Processing", "Cash Handling Errors", "Cybersecurity Threat",
  "System Downtime", "Data Breach", "Unauthorized Access", "Ransomware Attack", "Insider Threat",
  "AML Compliance Failure", "Regulatory Reporting Delays", "Credit Risk Exposure", "Liquidity Risk",
  "Financial Statement Error", "Asset Misappropriation", "Market Volatility", "Third Party Dependency"
];

const JUSTIFICATIONS = [
  "Control consolidated into automated monitoring system deployed in Q3 2024",
  "Migrated to centralized digital platform - manual process deprecated",
  "Replaced by enterprise-wide automated solution with real-time tracking",
  "Superseded by cloud-native architecture with integrated controls",
  "Continuous monitoring system replaced periodic manual reviews",
  "AI-powered automation eliminated need for manual intervention",
  "Integrated into enterprise platform with automated workflows"
];

// Helper to get or generate N/A control details for any BU-Category combination
const getNAControlDetails = (bu: string, category: string, count: number): NAControlDetails[] => {
  const key = `${bu}-${category}`;
  if (naControlDetailsMap[key]) {
    return naControlDetailsMap[key].slice(0, count);
  }
  // Generate mock data for combinations not explicitly defined - using consistent naming
  return Array.from({ length: count }, (_, i) => ({
    id: `CTL-${Math.floor(Math.random() * 900) + 100}`,
    name: CONTROL_NAMES[(i + category.length + bu.length) % CONTROL_NAMES.length],
    riskId: `R-${String(Math.floor(Math.random() * 50) + 33).padStart(3, '0')}`,
    riskName: RISK_NAMES[(i + category.length) % RISK_NAMES.length],
    justification: JUSTIFICATIONS[(i + bu.length) % JUSTIFICATIONS.length],
    markedBy: ["John Smith", "Sarah Lee", "Mike Chen", "Anna Wong"][Math.floor(Math.random() * 4)],
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
