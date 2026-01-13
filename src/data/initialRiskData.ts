// Shared initial risk data for both 1st Line and 2nd Line dashboards
// Each dashboard should deep-copy this data to maintain independence

export interface ControlAssessed {
  id: string;
  name: string;
  designEffectiveness: string;
  operatingEffectiveness: string;
  overallScore: number;
}

export interface TrendRationale {
  inherent?: string;
  residual?: string;
}

export interface HistoricalAssessment {
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

export interface ControlRecord {
  id: string;
  name: string;
  type: string;
  nature: string;
  keyControl: "Key" | "Non-Key";
  description?: string;
  designEffectiveness?: "Effective" | "Partially Effective" | "Ineffective";
  operatingEffectiveness?: "Effective" | "Partially Effective" | "Ineffective";
  overallScore?: number;
  lastTestDate?: string;
  testFrequency?: string;
  testingStatus?: "Tested" | "Not Tested" | "Pending";
}

export interface NAJustificationStatus {
  pending: number;
  drafted: number;
  awaiting: number;
  approved: number;
}

export interface SharedRiskData {
  id: string;
  title: string;
  dueDate: string;
  riskLevel: string;
  parentRisk?: string;
  businessUnit: string;
  category: string;
  owner: string;
  assessors: string[];
  currentEditor?: string;
  orgLevel: {
    level1: string;
    level2: string;
    level3: string;
  };
  assessmentProgress: {
    assess: "not-started" | "in-progress" | "completed";
    reviewChallenge: "not-started" | "in-progress" | "completed";
    approve: "not-started" | "in-progress" | "completed";
  };
  sectionCompletion: {
    inherentRating: number;
    controlEffectiveness: number;
    residualRating: number;
    riskTreatment: number;
  };
  inherentRisk: { level: string; color: string; score?: number };
  inherentTrend: { value: string; up: boolean };
  relatedControls: ControlRecord[];
  controlEffectiveness: { label: string; color: string };
  testResults: { label: string; sublabel: string };
  residualRisk: { level: string; color: string; score?: number };
  residualTrend: { value: string; up: boolean };
  status: string;
  lastAssessed: string;
  completionDate?: string;
  previousAssessments: number;
  tabCategory: "own" | "assess" | "approve";
  historicalAssessments?: HistoricalAssessment[];
  hasActionPlan?: boolean;
  naJustifications?: NAJustificationStatus;
}

// Based on 2nd Line dashboard data with orgLevel fields added
export const initialRiskData: SharedRiskData[] = [
  {
    id: "R-001",
    title: "Operational Process Failure",
    dueDate: "2025-11-20",
    riskLevel: "Level 1",
    businessUnit: "Retail Banking",
    category: "Operational",
    owner: "Michael Chen (Operations)",
    assessors: ["Sarah Johnson", "David Kim"],
    orgLevel: { level1: "Operational", level2: "Retail Banking", level3: "" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "not-started",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 25,
      residualRating: 0,
      riskTreatment: 0,
    },
    inherentRisk: { level: "Medium", color: "yellow", score: 8 },
    inherentTrend: { value: "13%", up: false },
    relatedControls: [
      { id: "Control-003", name: "Quality Assurance", type: "Manual", nature: "Detective", keyControl: "Non-Key", description: "Comprehensive quality assurance program ensuring all operational processes meet established standards and compliance requirements.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-10-15", testFrequency: "Quarterly", testingStatus: "Tested" },
      { id: "Control-004", name: "Process Documentation", type: "Manual", nature: "Preventive", keyControl: "Key", description: "Standardized documentation of all critical operational processes including step-by-step procedures and escalation paths.", designEffectiveness: "Effective", operatingEffectiveness: "Partially Effective", overallScore: 4, lastTestDate: "2025-09-20", testFrequency: "Semi-Annual", testingStatus: "Tested" },
      { id: "Control-005", name: "Staff Training Program", type: "Manual", nature: "Preventive", keyControl: "Key", description: "Mandatory training program covering operational procedures, compliance requirements, and risk awareness for all staff.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-11-01", testFrequency: "Annual", testingStatus: "Tested" }
    ],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Low", color: "green", score: 4 },
    residualTrend: { value: "7%", up: true },
    status: "Overdue",
    lastAssessed: "2025-10-20",
    previousAssessments: 5,
    tabCategory: "assess",
    historicalAssessments: [
      { 
        date: "2025-10-20", 
        assessor: "Sarah Johnson", 
        inherentRisk: { level: "Medium", score: 8 }, 
        residualRisk: { level: "Low", score: 4 }, 
        controlEffectiveness: "Design Effective", 
        status: "Completed", 
        notes: "Annual review completed. Controls operating as expected.",
        controlsAssessed: [
          { id: "Control-003", name: "Quality Assurance", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5 },
          { id: "Control-004", name: "Process Documentation", designEffectiveness: "Effective", operatingEffectiveness: "Partially Effective", overallScore: 4 },
          { id: "Control-005", name: "Staff Training Program", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5 }
        ],
        trendRationale: {
          inherent: "Inherent risk decreased by 11% due to improved process standardization and reduced manual intervention points.",
          residual: "Residual risk decreased by 20% as quality assurance controls were enhanced and staff training completed."
        }
      },
      { 
        date: "2025-07-15", 
        assessor: "David Kim", 
        inherentRisk: { level: "Medium", score: 9 }, 
        residualRisk: { level: "Medium", score: 5 }, 
        controlEffectiveness: "Partially Effective", 
        status: "Completed", 
        notes: "Control gaps identified in documentation process.",
        controlsAssessed: [
          { id: "Control-003", name: "Quality Assurance", designEffectiveness: "Effective", operatingEffectiveness: "Partially Effective", overallScore: 4 },
          { id: "Control-004", name: "Process Documentation", designEffectiveness: "Partially Effective", operatingEffectiveness: "Partially Effective", overallScore: 3 }
        ],
        trendRationale: {
          inherent: "Inherent risk decreased by 18% following process improvements implemented in Q2.",
          residual: "Residual risk decreased by 17% despite control gaps, due to compensating manual reviews."
        }
      },
      { 
        date: "2025-04-10", 
        assessor: "Sarah Johnson", 
        inherentRisk: { level: "High", score: 11 }, 
        residualRisk: { level: "Medium", score: 6 }, 
        controlEffectiveness: "Partially Effective", 
        status: "Completed",
        controlsAssessed: [
          { id: "Control-003", name: "Quality Assurance", designEffectiveness: "Partially Effective", operatingEffectiveness: "Partially Effective", overallScore: 3 },
          { id: "Control-004", name: "Process Documentation", designEffectiveness: "Partially Effective", operatingEffectiveness: "Ineffective", overallScore: 2 }
        ],
        trendRationale: {
          inherent: "Inherent risk decreased by 8% as legacy systems were upgraded.",
          residual: "Residual risk decreased by 14% with implementation of new quality checks."
        }
      },
      { 
        date: "2025-01-20", 
        assessor: "David Kim", 
        inherentRisk: { level: "High", score: 12 }, 
        residualRisk: { level: "Medium", score: 7 }, 
        controlEffectiveness: "Ineffective", 
        status: "Completed",
        controlsAssessed: [
          { id: "Control-003", name: "Quality Assurance", designEffectiveness: "Ineffective", operatingEffectiveness: "Ineffective", overallScore: 1 }
        ],
        trendRationale: {
          inherent: "Inherent risk decreased by 8% due to reduced transaction volumes.",
          residual: "Residual risk decreased by 22% despite ineffective controls, due to temporary manual oversight."
        }
      },
      { 
        date: "2024-10-18", 
        assessor: "Sarah Johnson", 
        inherentRisk: { level: "High", score: 13 }, 
        residualRisk: { level: "High", score: 9 }, 
        controlEffectiveness: "Ineffective", 
        status: "Completed",
        controlsAssessed: [
          { id: "Control-003", name: "Quality Assurance", designEffectiveness: "Ineffective", operatingEffectiveness: "Ineffective", overallScore: 1 }
        ]
      }
    ],
    naJustifications: { pending: 2, drafted: 1, awaiting: 0, approved: 1 }
  },
  {
    id: "R-001-A",
    title: "Branch Transaction Processing",
    dueDate: "2025-11-28",
    riskLevel: "Level 2",
    parentRisk: "Operational Process Failure",
    businessUnit: "Retail Banking",
    category: "Operational",
    owner: "Branch Manager",
    assessors: ["Emily White"],
    orgLevel: { level1: "Operational", level2: "Retail Banking", level3: "" },
    assessmentProgress: {
      assess: "not-started",
      reviewChallenge: "not-started",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 0,
      controlEffectiveness: 0,
      residualRating: 0,
      riskTreatment: 0,
    },
    inherentRisk: { level: "High", color: "red", score: 12 },
    inherentTrend: { value: "12%", up: false },
    relatedControls: [
      { id: "Control-009", name: "Branch Audits", type: "Manual", nature: "Detective", keyControl: "Non-Key", description: "Regular audits of branch operations to identify process gaps and compliance issues.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-10-18", testFrequency: "Quarterly", testingStatus: "Tested" },
      { id: "Control-010", name: "Transaction Reconciliation", type: "Automated", nature: "Detective", keyControl: "Key", description: "Automated daily reconciliation of all branch transactions against core banking system records.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-10-18", testFrequency: "Monthly", testingStatus: "Tested" }
    ],
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Medium", color: "yellow", score: 6 },
    residualTrend: { value: "14%", up: true },
    status: "Sent for Assessment",
    lastAssessed: "2025-10-18",
    previousAssessments: 6,
    tabCategory: "assess",
    historicalAssessments: [
      { 
        date: "2025-10-18", 
        assessor: "Emily White", 
        inherentRisk: { level: "High", score: 12 }, 
        residualRisk: { level: "Medium", score: 6 }, 
        controlEffectiveness: "Operating Effective", 
        status: "Completed",
        controlsAssessed: [
          { id: "Control-009", name: "Branch Audits", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5 },
          { id: "Control-010", name: "Transaction Reconciliation", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5 }
        ],
        trendRationale: {
          inherent: "Inherent risk decreased by 8% due to improved branch procedures and reduced error rates.",
          residual: "Residual risk decreased by 14% as automated reconciliation caught more discrepancies."
        }
      },
      { 
        date: "2025-07-12", 
        assessor: "Emily White", 
        inherentRisk: { level: "High", score: 13 }, 
        residualRisk: { level: "Medium", score: 7 }, 
        controlEffectiveness: "Operating Effective", 
        status: "Completed",
        controlsAssessed: [
          { id: "Control-009", name: "Branch Audits", designEffectiveness: "Effective", operatingEffectiveness: "Partially Effective", overallScore: 4 },
          { id: "Control-010", name: "Transaction Reconciliation", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5 }
        ],
        trendRationale: {
          inherent: "Inherent risk decreased by 7% following staff training initiatives.",
          residual: "Residual risk decreased by 12% with enhanced monitoring procedures."
        }
      },
      { 
        date: "2025-04-08", 
        assessor: "Emily White", 
        inherentRisk: { level: "High", score: 14 }, 
        residualRisk: { level: "High", score: 8 }, 
        controlEffectiveness: "Partially Effective", 
        status: "Completed",
        controlsAssessed: [
          { id: "Control-009", name: "Branch Audits", designEffectiveness: "Partially Effective", operatingEffectiveness: "Partially Effective", overallScore: 3 }
        ]
      }
    ],
    naJustifications: { pending: 0, drafted: 1, awaiting: 1, approved: 0 }
  },
  {
    id: "R-001-A-1",
    title: "Cash Handling Errors",
    dueDate: "2025-12-08",
    riskLevel: "Level 3",
    parentRisk: "Branch Transaction Processing",
    businessUnit: "Retail Banking",
    category: "Operational",
    owner: "Teller Supervisor",
    assessors: ["James Brown", "Lisa Martinez", "Tom Wilson"],
    currentEditor: "James Brown",
    orgLevel: { level1: "Operational", level2: "Retail Banking", level3: "Teller Operations" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "completed",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 100,
      residualRating: 100,
      riskTreatment: 100,
    },
    inherentRisk: { level: "Medium", color: "yellow", score: 7 },
    inherentTrend: { value: "8%", up: true },
    relatedControls: [
      { id: "Control-012", name: "Dual Authorization", type: "Automated", nature: "Preventive", keyControl: "Key", description: "System-enforced dual authorization requirement for all cash transactions above threshold limits.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-10-15", testFrequency: "Monthly", testingStatus: "Tested" },
      { id: "Control-013", name: "Cash Count Verification", type: "Manual", nature: "Detective", keyControl: "Non-Key", description: "End-of-day physical cash count verification with mandatory sign-off by supervisor.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-10-15", testFrequency: "Daily", testingStatus: "Tested" },
      { id: "Control-014", name: "Vault Access Controls", type: "Automated", nature: "Preventive", keyControl: "Key", description: "Biometric and dual-key access controls for vault entry with complete audit logging.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-10-15", testFrequency: "Quarterly", testingStatus: "Tested" }
    ],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Low", color: "green", score: 3 },
    residualTrend: { value: "5%", up: false },
    status: "Completed",
    lastAssessed: "2025-10-15",
    previousAssessments: 8,
    tabCategory: "assess",
    historicalAssessments: [
      { 
        date: "2025-10-15", 
        assessor: "James Brown", 
        inherentRisk: { level: "Medium", score: 7 }, 
        residualRisk: { level: "Low", score: 3 }, 
        controlEffectiveness: "Design Effective", 
        status: "Completed",
        controlsAssessed: [
          { id: "Control-012", name: "Dual Authorization", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5 },
          { id: "Control-013", name: "Cash Count Verification", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5 },
          { id: "Control-014", name: "Vault Access Controls", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5 }
        ],
        trendRationale: {
          inherent: "Inherent risk decreased by 12% due to enhanced dual-authorization procedures.",
          residual: "Residual risk decreased by 25% as all cash handling controls are now fully effective."
        }
      },
      { 
        date: "2025-07-10", 
        assessor: "Lisa Martinez", 
        inherentRisk: { level: "Medium", score: 8 }, 
        residualRisk: { level: "Low", score: 4 }, 
        controlEffectiveness: "Design Effective", 
        status: "Completed",
        controlsAssessed: [
          { id: "Control-012", name: "Dual Authorization", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5 },
          { id: "Control-013", name: "Cash Count Verification", designEffectiveness: "Effective", operatingEffectiveness: "Partially Effective", overallScore: 4 }
        ],
        trendRationale: {
          inherent: "Inherent risk decreased by 20% following implementation of automated alerts.",
          residual: "Residual risk decreased by 20% with improved verification processes."
        }
      },
      { 
        date: "2025-04-05", 
        assessor: "Tom Wilson", 
        inherentRisk: { level: "High", score: 10 }, 
        residualRisk: { level: "Medium", score: 5 }, 
        controlEffectiveness: "Partially Effective", 
        status: "Completed",
        controlsAssessed: [
          { id: "Control-012", name: "Dual Authorization", designEffectiveness: "Partially Effective", operatingEffectiveness: "Partially Effective", overallScore: 3 }
        ]
      }
    ],
    naJustifications: { pending: 1, drafted: 0, awaiting: 0, approved: 2 }
  },
  {
    id: "R-002",
    title: "Cybersecurity Threat",
    dueDate: "2025-12-20",
    riskLevel: "Level 1",
    businessUnit: "Retail Banking",
    category: "Technology",
    owner: "CISO Office",
    assessors: ["Alex Turner", "Maria Garcia"],
    currentEditor: "Alex Turner",
    orgLevel: { level1: "Technology", level2: "IT Security", level3: "" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "in-progress",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 100,
      residualRating: 75,
      riskTreatment: 50,
    },
    inherentRisk: { level: "Critical", color: "red", score: 16 },
    inherentTrend: { value: "20%", up: true },
    relatedControls: [
      { id: "Control-015", name: "Firewall & IDS", type: "Automated", nature: "Preventive", keyControl: "Key", description: "Enterprise-grade firewall and intrusion detection system protecting network perimeter with real-time threat analysis.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-10-22", testFrequency: "Continuous", testingStatus: "Tested" },
      { id: "Control-016", name: "Security Monitoring", type: "Automated", nature: "Detective", keyControl: "Key", description: "24/7 Security Operations Center monitoring with automated alert correlation and incident response.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-10-22", testFrequency: "Continuous", testingStatus: "Tested" },
      { id: "Control-017", name: "Penetration Testing", type: "Manual", nature: "Detective", keyControl: "Non-Key", description: "Regular penetration testing by certified third-party security firm to identify vulnerabilities.", designEffectiveness: "Effective", operatingEffectiveness: "Partially Effective", overallScore: 4, lastTestDate: "2025-09-15", testFrequency: "Quarterly", testingStatus: "Tested" }
    ],
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "Design Effective" },
    residualRisk: { level: "Critical", color: "red", score: 15 },
    residualTrend: { value: "18%", up: true },
    status: "Pending Approval",
    lastAssessed: "2025-10-22",
    previousAssessments: 12,
    tabCategory: "approve",
    hasActionPlan: true,
    historicalAssessments: [
      { 
        date: "2025-10-22", 
        assessor: "Alex Turner", 
        inherentRisk: { level: "Critical", score: 16 }, 
        residualRisk: { level: "High", score: 12 }, 
        controlEffectiveness: "Operating Effective", 
        status: "Completed",
        controlsAssessed: [
          { id: "Control-015", name: "Firewall & IDS", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5 },
          { id: "Control-016", name: "Security Monitoring", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5 },
          { id: "Control-017", name: "Penetration Testing", designEffectiveness: "Effective", operatingEffectiveness: "Partially Effective", overallScore: 4 }
        ],
        trendRationale: {
          inherent: "Inherent risk increased by 7% due to emerging threat landscape and new attack vectors identified.",
          residual: "Residual risk increased by 9% as threat sophistication outpaces current control enhancements."
        }
      },
      { 
        date: "2025-07-18", 
        assessor: "Maria Garcia", 
        inherentRisk: { level: "Critical", score: 15 }, 
        residualRisk: { level: "High", score: 11 }, 
        controlEffectiveness: "Operating Effective", 
        status: "Completed",
        controlsAssessed: [
          { id: "Control-015", name: "Firewall & IDS", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5 },
          { id: "Control-016", name: "Security Monitoring", designEffectiveness: "Effective", operatingEffectiveness: "Partially Effective", overallScore: 4 }
        ],
        trendRationale: {
          inherent: "Inherent risk increased by 7% due to increased frequency of attempted breaches.",
          residual: "Residual risk increased by 10% despite control improvements due to evolving threats."
        }
      },
      { 
        date: "2025-04-12", 
        assessor: "Alex Turner", 
        inherentRisk: { level: "High", score: 14 }, 
        residualRisk: { level: "High", score: 10 }, 
        controlEffectiveness: "Partially Effective", 
        status: "Completed",
        controlsAssessed: [
          { id: "Control-015", name: "Firewall & IDS", designEffectiveness: "Partially Effective", operatingEffectiveness: "Partially Effective", overallScore: 3 }
        ]
      }
    ]
  },
  {
    id: "R-002-A",
    title: "Phishing Attacks",
    dueDate: "2025-11-25",
    riskLevel: "Level 2",
    parentRisk: "Cybersecurity Threat",
    businessUnit: "Retail Banking",
    category: "Technology",
    owner: "Security Team",
    assessors: ["Robert Chen", "Nina Patel"],
    currentEditor: "Nina Patel",
    orgLevel: { level1: "Technology", level2: "IT Security", level3: "" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "in-progress",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 83,
      residualRating: 67,
      riskTreatment: 33,
    },
    inherentRisk: { level: "High", color: "red", score: 14 },
    inherentTrend: { value: "15%", up: true },
    relatedControls: [
      { id: "Control-018", name: "Email Filtering", type: "Automated", nature: "Preventive", keyControl: "Key", description: "Advanced email filtering system with AI-powered threat detection and automatic quarantine of suspicious messages.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-10-21", testFrequency: "Monthly", testingStatus: "Tested" },
      { id: "Control-019", name: "Phishing Awareness Training", type: "Manual", nature: "Preventive", keyControl: "Key", description: "Mandatory quarterly phishing awareness training with simulated phishing exercises for all employees.", designEffectiveness: "Effective", operatingEffectiveness: "Partially Effective", overallScore: 4, lastTestDate: "2025-10-21", testFrequency: "Quarterly", testingStatus: "Tested" }
    ],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Medium", color: "yellow", score: 8 },
    residualTrend: { value: "12%", up: false },
    status: "Pending Approval",
    lastAssessed: "2025-10-21",
    previousAssessments: 9,
    tabCategory: "approve",
    historicalAssessments: [
      { 
        date: "2025-10-21", 
        assessor: "Nina Patel", 
        inherentRisk: { level: "High", score: 14 }, 
        residualRisk: { level: "Medium", score: 8 }, 
        controlEffectiveness: "Design Effective", 
        status: "Completed",
        controlsAssessed: [
          { id: "Control-018", name: "Email Filtering", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5 },
          { id: "Control-019", name: "Phishing Awareness Training", designEffectiveness: "Effective", operatingEffectiveness: "Partially Effective", overallScore: 4 }
        ],
        trendRationale: {
          inherent: "Inherent risk increased by 8% due to more sophisticated phishing campaigns targeting employees.",
          residual: "Residual risk increased by 14% as staff click-through rates on simulated phishing increased."
        }
      },
      { 
        date: "2025-07-16", 
        assessor: "Robert Chen", 
        inherentRisk: { level: "High", score: 13 }, 
        residualRisk: { level: "Medium", score: 7 }, 
        controlEffectiveness: "Design Effective", 
        status: "Completed",
        controlsAssessed: [
          { id: "Control-018", name: "Email Filtering", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5 }
        ]
      }
    ]
  },
  {
    id: "R-003",
    title: "Regulatory Compliance Risk",
    dueDate: "2025-12-01",
    riskLevel: "Level 1",
    businessUnit: "Retail Banking",
    category: "Compliance",
    owner: "Compliance Officer",
    assessors: ["Kevin Lee"],
    orgLevel: { level1: "Compliance", level2: "Regulatory", level3: "" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "completed",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 100,
      residualRating: 100,
      riskTreatment: 100,
    },
    inherentRisk: { level: "High", color: "red", score: 12 },
    inherentTrend: { value: "10%", up: false },
    relatedControls: [
      { id: "Control-020", name: "Policy Framework", type: "Manual", nature: "Preventive", keyControl: "Key", description: "Comprehensive policy framework covering all regulatory requirements with regular reviews and updates.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-10-01", testFrequency: "Annual", testingStatus: "Tested" },
      { id: "Control-021", name: "Regulatory Monitoring", type: "Manual", nature: "Detective", keyControl: "Non-Key", description: "Ongoing monitoring of regulatory changes and impact assessment for business operations.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-10-01", testFrequency: "Continuous", testingStatus: "Tested" },
      { id: "Control-022", name: "Compliance Training", type: "Manual", nature: "Preventive", keyControl: "Key", description: "Annual compliance training program covering all regulatory requirements and ethical standards.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-10-01", testFrequency: "Annual", testingStatus: "Tested" }
    ],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Low", color: "green", score: 4 },
    residualTrend: { value: "6%", up: false },
    status: "Completed",
    lastAssessed: "2025-10-19",
    completionDate: "2025-10-19",
    previousAssessments: 15,
    tabCategory: "own",
    historicalAssessments: [
      { 
        date: "2025-10-19", 
        assessor: "Kevin Lee", 
        inherentRisk: { level: "High", score: 12 }, 
        residualRisk: { level: "Low", score: 4 }, 
        controlEffectiveness: "Design Effective", 
        status: "Completed", 
        notes: "All compliance requirements met for Q4.",
        controlsAssessed: [
          { id: "Control-020", name: "Policy Framework", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5 },
          { id: "Control-021", name: "Regulatory Monitoring", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5 },
          { id: "Control-022", name: "Compliance Training", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5 }
        ],
        trendRationale: {
          inherent: "Inherent risk decreased by 8% due to clarification of regulatory requirements and reduced compliance burden.",
          residual: "Residual risk decreased by 20% as all compliance controls are now fully effective."
        }
      },
      { 
        date: "2025-07-14", 
        assessor: "Kevin Lee", 
        inherentRisk: { level: "High", score: 13 }, 
        residualRisk: { level: "Low", score: 5 }, 
        controlEffectiveness: "Design Effective", 
        status: "Completed",
        controlsAssessed: [
          { id: "Control-020", name: "Policy Framework", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5 },
          { id: "Control-021", name: "Regulatory Monitoring", designEffectiveness: "Effective", operatingEffectiveness: "Partially Effective", overallScore: 4 }
        ],
        trendRationale: {
          inherent: "Inherent risk decreased by 7% following regulatory guidance updates.",
          residual: "Residual risk decreased by 17% with enhanced monitoring procedures."
        }
      },
      { 
        date: "2025-04-09", 
        assessor: "Kevin Lee", 
        inherentRisk: { level: "High", score: 14 }, 
        residualRisk: { level: "Medium", score: 6 }, 
        controlEffectiveness: "Partially Effective", 
        status: "Completed",
        controlsAssessed: [
          { id: "Control-020", name: "Policy Framework", designEffectiveness: "Partially Effective", operatingEffectiveness: "Partially Effective", overallScore: 3 }
        ]
      }
    ]
  },
  {
    id: "R-003-A",
    title: "AML Reporting Gaps",
    dueDate: "2025-11-30",
    riskLevel: "Level 2",
    parentRisk: "Regulatory Compliance Risk",
    businessUnit: "Retail Banking",
    category: "Compliance",
    owner: "AML Team Lead",
    assessors: ["Patricia Adams", "Daniel Foster"],
    currentEditor: "Patricia Adams",
    orgLevel: { level1: "Compliance", level2: "Regulatory", level3: "" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "completed",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 100,
      residualRating: 100,
      riskTreatment: 100,
    },
    inherentRisk: { level: "Critical", color: "red", score: 18 },
    inherentTrend: { value: "22%", up: true },
    relatedControls: [
      { id: "Control-023", name: "Transaction Monitoring", type: "Automated", nature: "Detective", keyControl: "Key", description: "Real-time automated transaction monitoring system with risk-based thresholds and alert generation.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-09-28", testFrequency: "Continuous", testingStatus: "Tested" },
      { id: "Control-023A", name: "SAR Filing Process", type: "Manual", nature: "Detective", keyControl: "Non-Key", description: "Standardized suspicious activity report filing process with regulatory deadline tracking.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-09-28", testFrequency: "Monthly", testingStatus: "Tested" },
      { id: "Control-023B", name: "Customer Due Diligence", type: "Manual", nature: "Preventive", keyControl: "Key", description: "Risk-based customer due diligence program with enhanced procedures for high-risk customers.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-09-28", testFrequency: "Quarterly", testingStatus: "Tested" }
    ],
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "" },
    residualRisk: { level: "Critical", color: "red", score: 14 },
    residualTrend: { value: "19%", up: true },
    status: "Completed",
    lastAssessed: "2025-09-28",
    completionDate: "2025-09-28",
    previousAssessments: 11,
    tabCategory: "own",
    hasActionPlan: true,
    historicalAssessments: [
      { date: "2025-09-28", assessor: "Patricia Adams", inherentRisk: { level: "Critical", score: 18 }, residualRisk: { level: "High", score: 11 }, controlEffectiveness: "Operating Effective", status: "Completed" },
      { date: "2025-06-22", assessor: "Daniel Foster", inherentRisk: { level: "Critical", score: 17 }, residualRisk: { level: "High", score: 10 }, controlEffectiveness: "Operating Effective", status: "Completed" }
    ]
  },
  {
    id: "R-003-B",
    title: "KYC Policy Violations",
    dueDate: "2025-12-15",
    riskLevel: "Level 2",
    parentRisk: "Regulatory Compliance Risk",
    businessUnit: "Retail Banking",
    category: "Compliance",
    owner: "Compliance Analyst",
    assessors: ["Michael Roberts", "Laura Chen"],
    orgLevel: { level1: "Compliance", level2: "Regulatory", level3: "" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "completed",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 100,
      residualRating: 100,
      riskTreatment: 100,
    },
    inherentRisk: { level: "High", color: "red", score: 14 },
    inherentTrend: { value: "8%", up: false },
    relatedControls: [
      { id: "Control-024", name: "Customer Verification", type: "Manual", nature: "Preventive", keyControl: "Key", description: "Multi-factor customer identity verification process at account opening and high-risk transactions.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-11-15", testFrequency: "Quarterly", testingStatus: "Tested" },
      { id: "Control-024A", name: "Enhanced Due Diligence", type: "Manual", nature: "Preventive", keyControl: "Key", description: "Enhanced due diligence procedures for high-risk customers including PEPs and high-value accounts.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-11-15", testFrequency: "Quarterly", testingStatus: "Tested" },
      { id: "Control-024B", name: "Identity Screening", type: "Automated", nature: "Detective", keyControl: "Key", description: "Automated screening against sanctions lists and adverse media databases.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-11-15", testFrequency: "Continuous", testingStatus: "Tested" }
    ],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Medium", color: "yellow", score: 7 },
    residualTrend: { value: "5%", up: false },
    status: "Completed",
    lastAssessed: "2025-11-15",
    completionDate: "2025-11-15",
    previousAssessments: 6,
    tabCategory: "own",
    historicalAssessments: [
      { date: "2025-11-15", assessor: "Michael Roberts", inherentRisk: { level: "High", score: 14 }, residualRisk: { level: "Medium", score: 7 }, controlEffectiveness: "Design Effective", status: "Completed" },
      { date: "2025-08-10", assessor: "Laura Chen", inherentRisk: { level: "High", score: 15 }, residualRisk: { level: "Medium", score: 8 }, controlEffectiveness: "Design Effective", status: "Completed" }
    ]
  },
  {
    id: "R-004",
    title: "Market Risk Exposure",
    dueDate: "2025-12-10",
    riskLevel: "Level 1",
    businessUnit: "Corporate Banking",
    category: "Financial",
    owner: "Treasury Department",
    assessors: ["Michelle Wong"],
    currentEditor: "Michelle Wong",
    orgLevel: { level1: "Financial", level2: "Treasury", level3: "" },
    assessmentProgress: {
      assess: "in-progress",
      reviewChallenge: "not-started",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 75,
      controlEffectiveness: 33,
      residualRating: 0,
      riskTreatment: 0,
    },
    inherentRisk: { level: "Medium", color: "yellow", score: 9 },
    inherentTrend: { value: "9%", up: false },
    relatedControls: [
      { id: "Control-025", name: "Hedging Strategy", type: "Manual", nature: "Preventive", keyControl: "Key", description: "Comprehensive hedging strategy to mitigate market exposure across all trading portfolios.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-10-17", testFrequency: "Quarterly", testingStatus: "Tested" },
      { id: "Control-026", name: "VaR Monitoring", type: "Automated", nature: "Detective", keyControl: "Key", description: "Real-time Value at Risk monitoring with breach alerts and automated limit enforcement.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-10-17", testFrequency: "Daily", testingStatus: "Tested" },
      { id: "Control-027", name: "Position Limits", type: "Automated", nature: "Preventive", keyControl: "Key", description: "Automated position limit enforcement with real-time monitoring and escalation.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-10-17", testFrequency: "Continuous", testingStatus: "Tested" }
    ],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Low", color: "green", score: 3 },
    residualTrend: { value: "4%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-10-17",
    previousAssessments: 7,
    tabCategory: "approve",
    historicalAssessments: [
      { date: "2025-10-17", assessor: "Michelle Wong", inherentRisk: { level: "Medium", score: 9 }, residualRisk: { level: "Low", score: 3 }, controlEffectiveness: "Design Effective", status: "Completed" },
      { date: "2025-07-12", assessor: "Michelle Wong", inherentRisk: { level: "Medium", score: 10 }, residualRisk: { level: "Low", score: 4 }, controlEffectiveness: "Design Effective", status: "Completed" }
    ]
  },
  {
    id: "R-005",
    title: "Third-Party Vendor Risk",
    dueDate: "2025-12-05",
    riskLevel: "Level 1",
    businessUnit: "Retail Banking",
    category: "Operational",
    owner: "Procurement Manager",
    assessors: ["Rachel Green", "Steven Park"],
    orgLevel: { level1: "Operational", level2: "Vendor Management", level3: "" },
    assessmentProgress: {
      assess: "not-started",
      reviewChallenge: "not-started",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 0,
      controlEffectiveness: 0,
      residualRating: 0,
      riskTreatment: 0,
    },
    inherentRisk: { level: "High", color: "red", score: 13 },
    inherentTrend: { value: "16%", up: true },
    relatedControls: [
      { id: "Control-028", name: "Vendor Due Diligence", type: "Manual", nature: "Preventive", keyControl: "Key", description: "Comprehensive due diligence process for all new and existing vendors including financial and operational assessments.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-10-16", testFrequency: "Annual", testingStatus: "Tested" },
      { id: "Control-029", name: "Contract Management", type: "Manual", nature: "Preventive", keyControl: "Key", description: "Centralized contract management system with standardized terms, SLAs, and compliance requirements.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-10-16", testFrequency: "Annual", testingStatus: "Tested" }
    ],
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "Design Effective" },
    residualRisk: { level: "Medium", color: "yellow", score: 7 },
    residualTrend: { value: "13%", up: true },
    status: "Sent for Assessment",
    lastAssessed: "2025-10-16",
    previousAssessments: 4,
    tabCategory: "assess",
    historicalAssessments: [
      { date: "2025-10-16", assessor: "Rachel Green", inherentRisk: { level: "High", score: 13 }, residualRisk: { level: "Medium", score: 7 }, controlEffectiveness: "Operating Effective", status: "Completed" },
      { date: "2025-07-11", assessor: "Steven Park", inherentRisk: { level: "High", score: 12 }, residualRisk: { level: "Medium", score: 6 }, controlEffectiveness: "Operating Effective", status: "Completed" }
    ]
  },
  {
    id: "R-006",
    title: "Data Privacy Breach",
    dueDate: "2025-11-20",
    riskLevel: "Level 1",
    businessUnit: "Retail Banking",
    category: "Technology",
    owner: "Data Protection Officer",
    assessors: ["Angela Smith"],
    orgLevel: { level1: "Technology", level2: "Data Protection", level3: "" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "completed",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 100,
      residualRating: 100,
      riskTreatment: 100,
    },
    inherentRisk: { level: "Critical", color: "red", score: 17 },
    inherentTrend: { value: "25%", up: true },
    relatedControls: [
      { id: "Control-030", name: "Encryption & Access Controls", type: "Automated", nature: "Preventive", keyControl: "Key", description: "Enterprise-wide encryption standards and role-based access controls for all sensitive data.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-10-23", testFrequency: "Quarterly", testingStatus: "Tested" },
      { id: "Control-031", name: "Data Classification", type: "Manual", nature: "Preventive", keyControl: "Key", description: "Data classification framework with automated tagging and handling requirements.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-10-23", testFrequency: "Annual", testingStatus: "Tested" },
      { id: "Control-031A", name: "Breach Response Plan", type: "Manual", nature: "Detective", keyControl: "Non-Key", description: "Documented breach response plan with defined roles, communication protocols, and regulatory notification procedures.", designEffectiveness: "Effective", operatingEffectiveness: "Partially Effective", overallScore: 4, lastTestDate: "2025-10-23", testFrequency: "Annual", testingStatus: "Tested" }
    ],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "" },
    residualRisk: { level: "Medium", color: "yellow", score: 8 },
    residualTrend: { value: "11%", up: false },
    status: "Completed",
    lastAssessed: "2025-10-23",
    completionDate: "2025-10-23",
    previousAssessments: 10,
    tabCategory: "own",
    historicalAssessments: [
      { date: "2025-10-23", assessor: "Angela Smith", inherentRisk: { level: "Critical", score: 17 }, residualRisk: { level: "Medium", score: 8 }, controlEffectiveness: "Design Effective", status: "Completed", notes: "GDPR compliance verified. All controls operating effectively." },
      { date: "2025-07-18", assessor: "Angela Smith", inherentRisk: { level: "Critical", score: 16 }, residualRisk: { level: "Medium", score: 9 }, controlEffectiveness: "Design Effective", status: "Completed" },
      { date: "2025-04-13", assessor: "Angela Smith", inherentRisk: { level: "High", score: 15 }, residualRisk: { level: "Medium", score: 10 }, controlEffectiveness: "Partially Effective", status: "Completed" }
    ]
  },
  {
    id: "R-006-A",
    title: "Personal Data Exposure",
    dueDate: "2025-11-25",
    riskLevel: "Level 2",
    parentRisk: "Data Privacy Breach",
    businessUnit: "Retail Banking",
    category: "Technology",
    owner: "Privacy Compliance Lead",
    assessors: ["Angela Smith", "David Lee"],
    orgLevel: { level1: "Technology", level2: "Data Protection", level3: "" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "in-progress",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 75,
      residualRating: 50,
      riskTreatment: 25,
    },
    inherentRisk: { level: "High", color: "red", score: 14 },
    inherentTrend: { value: "18%", up: true },
    relatedControls: [
      { id: "Control-050", name: "PII Access Logging", type: "Automated", nature: "Detective", keyControl: "Key", description: "Comprehensive logging of all access to personally identifiable information with real-time alerts.", designEffectiveness: "Effective", operatingEffectiveness: "Partially Effective", overallScore: 4, lastTestDate: "2025-10-20", testFrequency: "Continuous", testingStatus: "Tested" },
      { id: "Control-051", name: "Data Anonymization", type: "Automated", nature: "Preventive", keyControl: "Key", description: "Automated data anonymization for non-production environments and analytics use cases.", designEffectiveness: "Effective", operatingEffectiveness: "Effective", overallScore: 5, lastTestDate: "2025-10-20", testFrequency: "Quarterly", testingStatus: "Tested" }
    ],
    controlEffectiveness: { label: "Partially Effective", color: "yellow" },
    testResults: { label: "Design Effective", sublabel: "Operating Partially Effective" },
    residualRisk: { level: "Medium", color: "yellow", score: 7 },
    residualTrend: { value: "10%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-10-20",
    previousAssessments: 5,
    tabCategory: "assess",
    historicalAssessments: [
      { date: "2025-10-20", assessor: "Angela Smith", inherentRisk: { level: "High", score: 14 }, residualRisk: { level: "Medium", score: 7 }, controlEffectiveness: "Partially Effective", status: "Completed" },
      { date: "2025-07-15", assessor: "David Lee", inherentRisk: { level: "High", score: 13 }, residualRisk: { level: "Medium", score: 8 }, controlEffectiveness: "Partially Effective", status: "Completed" }
    ]
  },
  {
    id: "R-006-A-1",
    title: "Customer PII Leakage",
    dueDate: "2025-12-01",
    riskLevel: "Level 3",
    parentRisk: "Personal Data Exposure",
    businessUnit: "Retail Banking",
    category: "Technology",
    owner: "Customer Data Manager",
    assessors: ["David Lee", "Jennifer Chen"],
    currentEditor: "David Lee",
    orgLevel: { level1: "Technology", level2: "Data Protection", level3: "Customer Data" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "completed",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 100,
      residualRating: 100,
      riskTreatment: 100,
    },
    inherentRisk: { level: "High", color: "red", score: 12 },
    inherentTrend: { value: "15%", up: false },
    relatedControls: [
      { id: "Control-052", name: "Customer Data Encryption", type: "Automated", nature: "Preventive", keyControl: "Key" },
      { id: "Control-053", name: "Access Control Lists", type: "Automated", nature: "Preventive", keyControl: "Key" },
      { id: "Control-054", name: "Audit Trail Monitoring", type: "Automated", nature: "Detective", keyControl: "Key" }
    ],
    controlEffectiveness: { label: "Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Low", color: "green", score: 4 },
    residualTrend: { value: "8%", up: false },
    status: "Completed",
    lastAssessed: "2025-10-18",
    completionDate: "2025-10-18",
    previousAssessments: 6,
    tabCategory: "own",
    historicalAssessments: [
      { date: "2025-10-18", assessor: "David Lee", inherentRisk: { level: "High", score: 12 }, residualRisk: { level: "Low", score: 4 }, controlEffectiveness: "Effective", status: "Completed", notes: "All customer data controls verified and operating effectively." },
      { date: "2025-07-12", assessor: "Jennifer Chen", inherentRisk: { level: "High", score: 13 }, residualRisk: { level: "Low", score: 5 }, controlEffectiveness: "Effective", status: "Completed" }
    ]
  },
  {
    id: "R-006-B",
    title: "Data Retention Violations",
    dueDate: "2025-11-30",
    riskLevel: "Level 2",
    parentRisk: "Data Privacy Breach",
    businessUnit: "Retail Banking",
    category: "Technology",
    owner: "Records Manager",
    assessors: ["Angela Smith", "Mark Thompson"],
    orgLevel: { level1: "Technology", level2: "Data Protection", level3: "" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "in-progress",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 83,
      residualRating: 67,
      riskTreatment: 50,
    },
    inherentRisk: { level: "Medium", color: "yellow", score: 10 },
    inherentTrend: { value: "12%", up: false },
    relatedControls: [
      { id: "Control-055", name: "Retention Policy Enforcement", type: "Automated", nature: "Preventive", keyControl: "Key" },
      { id: "Control-056", name: "Data Lifecycle Management", type: "Manual", nature: "Detective", keyControl: "Non-Key" }
    ],
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "Design Effective" },
    residualRisk: { level: "Low", color: "green", score: 5 },
    residualTrend: { value: "6%", up: false },
    status: "Pending Approval",
    lastAssessed: "2025-10-22",
    previousAssessments: 4,
    tabCategory: "approve",
    historicalAssessments: [
      { date: "2025-10-22", assessor: "Angela Smith", inherentRisk: { level: "Medium", score: 10 }, residualRisk: { level: "Low", score: 5 }, controlEffectiveness: "Operating Effective", status: "Completed" },
      { date: "2025-07-17", assessor: "Mark Thompson", inherentRisk: { level: "Medium", score: 11 }, residualRisk: { level: "Medium", score: 6 }, controlEffectiveness: "Partially Effective", status: "Completed" }
    ]
  },
  {
    id: "R-007",
    title: "Credit Risk Management",
    dueDate: "2025-12-18",
    riskLevel: "Level 1",
    businessUnit: "Corporate Banking",
    category: "Financial",
    owner: "Credit Risk Manager",
    assessors: ["Thomas Anderson", "Jennifer Lee"],
    currentEditor: "Thomas Anderson",
    orgLevel: { level1: "Financial", level2: "Credit", level3: "" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "in-progress",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 67,
      residualRating: 25,
      riskTreatment: 0,
    },
    inherentRisk: { level: "High", color: "red", score: 14 },
    inherentTrend: { value: "18%", up: true },
    relatedControls: [
      { id: "Control-032", name: "Credit Scoring Model", type: "Automated", nature: "Preventive", keyControl: "Key" },
      { id: "Control-033", name: "Loan Approval Process", type: "Manual", nature: "Preventive", keyControl: "Key" },
      { id: "Control-034", name: "Portfolio Monitoring", type: "Automated", nature: "Detective", keyControl: "Key" }
    ],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Medium", color: "yellow", score: 6 },
    residualTrend: { value: "10%", up: false },
    status: "Review/Challenge",
    lastAssessed: "2025-10-24",
    previousAssessments: 8,
    tabCategory: "assess",
    historicalAssessments: [
      { date: "2025-10-24", assessor: "Thomas Anderson", inherentRisk: { level: "High", score: 14 }, residualRisk: { level: "Medium", score: 6 }, controlEffectiveness: "Design Effective", status: "Completed" },
      { date: "2025-07-19", assessor: "Jennifer Lee", inherentRisk: { level: "High", score: 13 }, residualRisk: { level: "Medium", score: 7 }, controlEffectiveness: "Design Effective", status: "Completed" }
    ]
  },
  {
    id: "R-008",
    title: "Liquidity Risk",
    dueDate: "2025-11-22",
    riskLevel: "Level 1",
    businessUnit: "Treasury",
    category: "Financial",
    owner: "Treasury Manager",
    assessors: ["Brian Wilson", "Sandra Martinez"],
    orgLevel: { level1: "Financial", level2: "Treasury", level3: "" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "in-progress",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 100,
      residualRating: 83,
      riskTreatment: 50,
    },
    inherentRisk: { level: "High", color: "red", score: 11 },
    inherentTrend: { value: "14%", up: false },
    relatedControls: [
      { id: "Control-035", name: "Cash Flow Monitoring", type: "Manual", nature: "Detective", keyControl: "Non-Key" },
      { id: "Control-036", name: "Liquidity Buffer", type: "Manual", nature: "Preventive", keyControl: "Key" }
    ],
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "" },
    residualRisk: { level: "Low", color: "green", score: 4 },
    residualTrend: { value: "5%", up: false },
    status: "Pending Approval",
    lastAssessed: "2025-10-25",
    previousAssessments: 6,
    tabCategory: "approve",
    historicalAssessments: [
      { date: "2025-10-25", assessor: "Brian Wilson", inherentRisk: { level: "High", score: 11 }, residualRisk: { level: "Low", score: 4 }, controlEffectiveness: "Operating Effective", status: "Completed" },
      { date: "2025-07-20", assessor: "Sandra Martinez", inherentRisk: { level: "High", score: 12 }, residualRisk: { level: "Low", score: 5 }, controlEffectiveness: "Operating Effective", status: "Completed" }
    ]
  },
  {
    id: "R-009",
    title: "Business Continuity Planning",
    dueDate: "2025-12-12",
    riskLevel: "Level 1",
    businessUnit: "Operations",
    category: "Operational",
    owner: "BCP Coordinator",
    assessors: ["Mark Thompson"],
    orgLevel: { level1: "Operational", level2: "Business Continuity", level3: "" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "in-progress",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 58,
      residualRating: 17,
      riskTreatment: 0,
    },
    inherentRisk: { level: "Medium", color: "yellow", score: 8 },
    inherentTrend: { value: "11%", up: true },
    relatedControls: [
      { id: "Control-037", name: "Disaster Recovery Plan", type: "Manual", nature: "Preventive", keyControl: "Key" },
      { id: "Control-038", name: "Business Impact Analysis", type: "Manual", nature: "Detective", keyControl: "Non-Key" },
      { id: "Control-039", name: "Recovery Testing", type: "Manual", nature: "Detective", keyControl: "Non-Key" }
    ],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Low", color: "green", score: 3 },
    residualTrend: { value: "6%", up: false },
    status: "Review/Challenge",
    lastAssessed: "2025-10-26",
    previousAssessments: 4,
    tabCategory: "assess",
    historicalAssessments: [
      { date: "2025-10-26", assessor: "Mark Thompson", inherentRisk: { level: "Medium", score: 8 }, residualRisk: { level: "Low", score: 3 }, controlEffectiveness: "Design Effective", status: "Completed" },
      { date: "2025-07-21", assessor: "Mark Thompson", inherentRisk: { level: "Medium", score: 9 }, residualRisk: { level: "Low", score: 4 }, controlEffectiveness: "Design Effective", status: "Completed" }
    ]
  },
  {
    id: "R-010",
    title: "Fraud Detection Systems",
    dueDate: "2025-11-15",
    riskLevel: "Level 1",
    businessUnit: "Retail Banking",
    category: "Technology",
    owner: "Fraud Prevention Team",
    assessors: ["Linda Chen", "Paul Roberts"],
    currentEditor: "Linda Chen",
    orgLevel: { level1: "Technology", level2: "Fraud Prevention", level3: "" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "in-progress",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 92,
      residualRating: 75,
      riskTreatment: 42,
    },
    inherentRisk: { level: "Critical", color: "red", score: 19 },
    inherentTrend: { value: "23%", up: true },
    relatedControls: [
      { id: "Control-040", name: "AI Fraud Detection", type: "Automated", nature: "Detective", keyControl: "Key" },
      { id: "Control-041", name: "Transaction Limits", type: "Automated", nature: "Preventive", keyControl: "Key" }
    ],
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "Design Effective" },
    residualRisk: { level: "High", color: "red", score: 10 },
    hasActionPlan: false,
    residualTrend: { value: "16%", up: false },
    status: "Pending Approval",
    lastAssessed: "2025-10-27",
    previousAssessments: 9,
    tabCategory: "approve",
    historicalAssessments: [
      { date: "2025-10-27", assessor: "Linda Chen", inherentRisk: { level: "Critical", score: 19 }, residualRisk: { level: "High", score: 10 }, controlEffectiveness: "Operating Effective", status: "Completed" },
      { date: "2025-07-22", assessor: "Paul Roberts", inherentRisk: { level: "Critical", score: 18 }, residualRisk: { level: "High", score: 11 }, controlEffectiveness: "Operating Effective", status: "Completed" }
    ]
  },
  {
    id: "R-011",
    title: "Model Risk Management",
    dueDate: "2025-12-25",
    riskLevel: "Level 1",
    businessUnit: "Risk Analytics",
    category: "Financial",
    owner: "Model Risk Officer",
    assessors: ["George Harris"],
    orgLevel: { level1: "Financial", level2: "Model Risk", level3: "" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "completed",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 100,
      residualRating: 100,
      riskTreatment: 100,
    },
    inherentRisk: { level: "High", color: "red", score: 13 },
    inherentTrend: { value: "17%", up: false },
    relatedControls: [
      { id: "Control-042", name: "Model Validation", type: "Manual", nature: "Detective", keyControl: "Non-Key" },
      { id: "Control-043", name: "Model Governance", type: "Manual", nature: "Preventive", keyControl: "Key" },
      { id: "Control-044", name: "Model Performance Monitoring", type: "Automated", nature: "Detective", keyControl: "Key" }
    ],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "" },
    residualRisk: { level: "Medium", color: "yellow", score: 7 },
    residualTrend: { value: "12%", up: true },
    status: "Completed",
    lastAssessed: "2025-10-28",
    previousAssessments: 7,
    tabCategory: "assess",
    historicalAssessments: [
      { date: "2025-10-28", assessor: "George Harris", inherentRisk: { level: "High", score: 13 }, residualRisk: { level: "Medium", score: 7 }, controlEffectiveness: "Design Effective", status: "Completed" },
      { date: "2025-07-23", assessor: "George Harris", inherentRisk: { level: "High", score: 14 }, residualRisk: { level: "Medium", score: 8 }, controlEffectiveness: "Design Effective", status: "Completed" }
    ]
  },
  {
    id: "R-012",
    title: "Interest Rate Risk",
    dueDate: "2025-11-18",
    riskLevel: "Level 1",
    businessUnit: "Treasury",
    category: "Financial",
    owner: "ALM Manager",
    assessors: ["Catherine Wright", "William Davis"],
    currentEditor: "Catherine Wright",
    orgLevel: { level1: "Financial", level2: "Treasury", level3: "" },
    assessmentProgress: {
      assess: "completed",
      reviewChallenge: "completed",
      approve: "in-progress",
    },
    sectionCompletion: {
      inherentRating: 100,
      controlEffectiveness: 100,
      residualRating: 67,
      riskTreatment: 33,
    },
    inherentRisk: { level: "Medium", color: "yellow", score: 7 },
    inherentTrend: { value: "9%", up: false },
    relatedControls: [
      { id: "Control-045", name: "Interest Rate Derivatives", type: "Automated", nature: "Preventive", keyControl: "Key" },
      { id: "Control-046", name: "Gap Analysis", type: "Manual", nature: "Detective", keyControl: "Non-Key" }
    ],
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "Design Effective" },
    residualRisk: { level: "Low", color: "green", score: 3 },
    residualTrend: { value: "4%", up: false },
    status: "Pending Approval",
    lastAssessed: "2025-10-29",
    previousAssessments: 11,
    tabCategory: "approve",
    historicalAssessments: [
      { date: "2025-10-29", assessor: "Catherine Wright", inherentRisk: { level: "Medium", score: 7 }, residualRisk: { level: "Low", score: 3 }, controlEffectiveness: "Operating Effective", status: "Completed" },
      { date: "2025-07-24", assessor: "William Davis", inherentRisk: { level: "Medium", score: 8 }, residualRisk: { level: "Low", score: 4 }, controlEffectiveness: "Operating Effective", status: "Completed" }
    ]
  },
  // Additional risks for Corporate Banking
  {
    id: "R-013",
    title: "Anti-Money Laundering Gaps",
    dueDate: "2025-12-10",
    riskLevel: "Level 1",
    businessUnit: "Corporate Banking",
    category: "Compliance",
    owner: "AML Compliance Officer",
    assessors: ["Nina Patel", "David Lee"],
    orgLevel: { level1: "Compliance", level2: "Corporate Banking", level3: "" },
    assessmentProgress: {
      assess: "not-started",
      reviewChallenge: "not-started",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 0,
      controlEffectiveness: 0,
      residualRating: 0,
      riskTreatment: 0,
    },
    inherentRisk: { level: "High", color: "red", score: 14 },
    inherentTrend: { value: "10%", up: true },
    relatedControls: [
      { id: "Control-047", name: "Transaction Screening", type: "Automated", nature: "Preventive", keyControl: "Key" },
      { id: "Control-048", name: "Customer Due Diligence", type: "Manual", nature: "Preventive", keyControl: "Key" }
    ],
    controlEffectiveness: { label: "Partially Effective", color: "yellow" },
    testResults: { label: "Partially Effective", sublabel: "Design Effective" },
    residualRisk: { level: "Medium", color: "yellow", score: 8 },
    residualTrend: { value: "5%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-09-15",
    previousAssessments: 4,
    tabCategory: "assess",
    historicalAssessments: [
      { date: "2025-09-15", assessor: "Nina Patel", inherentRisk: { level: "High", score: 14 }, residualRisk: { level: "Medium", score: 8 }, controlEffectiveness: "Partially Effective", status: "Completed" }
    ]
  },
  {
    id: "R-013-A",
    title: "Transaction Monitoring Delays",
    dueDate: "2025-12-15",
    riskLevel: "Level 2",
    parentRisk: "Anti-Money Laundering Gaps",
    businessUnit: "Corporate Banking",
    category: "Compliance",
    owner: "AML Operations Lead",
    assessors: ["David Lee"],
    orgLevel: { level1: "Compliance", level2: "Corporate Banking", level3: "AML Operations" },
    assessmentProgress: {
      assess: "not-started",
      reviewChallenge: "not-started",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 0,
      controlEffectiveness: 0,
      residualRating: 0,
      riskTreatment: 0,
    },
    inherentRisk: { level: "Medium", color: "yellow", score: 9 },
    inherentTrend: { value: "8%", up: true },
    relatedControls: [
      { id: "Control-049", name: "Alert Queue Management", type: "Automated", nature: "Detective", keyControl: "Non-Key" }
    ],
    controlEffectiveness: { label: "Partially Effective", color: "yellow" },
    testResults: { label: "Partially Effective", sublabel: "" },
    residualRisk: { level: "Medium", color: "yellow", score: 6 },
    residualTrend: { value: "3%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-09-20",
    previousAssessments: 2,
    tabCategory: "assess",
    historicalAssessments: []
  },
  // Additional risks for Operations
  {
    id: "R-014",
    title: "Operational Resilience",
    dueDate: "2025-12-08",
    riskLevel: "Level 1",
    businessUnit: "Operations",
    category: "Operational",
    owner: "Business Continuity Manager",
    assessors: ["Emma White", "Chris Anderson"],
    orgLevel: { level1: "Operational", level2: "Operations", level3: "" },
    assessmentProgress: {
      assess: "not-started",
      reviewChallenge: "not-started",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 0,
      controlEffectiveness: 0,
      residualRating: 0,
      riskTreatment: 0,
    },
    inherentRisk: { level: "High", color: "red", score: 12 },
    inherentTrend: { value: "15%", up: true },
    relatedControls: [
      { id: "Control-050", name: "Business Continuity Plan", type: "Manual", nature: "Preventive", keyControl: "Key" },
      { id: "Control-051", name: "Incident Response Procedures", type: "Manual", nature: "Detective", keyControl: "Key" }
    ],
    controlEffectiveness: { label: "Partially Effective", color: "yellow" },
    testResults: { label: "Partially Effective", sublabel: "Design Effective" },
    residualRisk: { level: "Medium", color: "yellow", score: 7 },
    residualTrend: { value: "6%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-09-10",
    previousAssessments: 5,
    tabCategory: "assess",
    historicalAssessments: [
      { date: "2025-09-10", assessor: "Emma White", inherentRisk: { level: "High", score: 12 }, residualRisk: { level: "Medium", score: 7 }, controlEffectiveness: "Partially Effective", status: "Completed" }
    ]
  },
  {
    id: "R-014-A",
    title: "Disaster Recovery Testing",
    dueDate: "2025-12-12",
    riskLevel: "Level 2",
    parentRisk: "Operational Resilience",
    businessUnit: "Operations",
    category: "Operational",
    owner: "DR Coordinator",
    assessors: ["Chris Anderson"],
    orgLevel: { level1: "Operational", level2: "Operations", level3: "DR" },
    assessmentProgress: {
      assess: "not-started",
      reviewChallenge: "not-started",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 0,
      controlEffectiveness: 0,
      residualRating: 0,
      riskTreatment: 0,
    },
    inherentRisk: { level: "Medium", color: "yellow", score: 8 },
    inherentTrend: { value: "7%", up: false },
    relatedControls: [
      { id: "Control-052", name: "DR Test Schedule", type: "Manual", nature: "Detective", keyControl: "Non-Key" }
    ],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "" },
    residualRisk: { level: "Low", color: "green", score: 4 },
    residualTrend: { value: "4%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-09-18",
    previousAssessments: 3,
    tabCategory: "assess",
    historicalAssessments: []
  },
  // Additional risk for Treasury
  {
    id: "R-015",
    title: "Investment Portfolio Risk",
    dueDate: "2025-12-05",
    riskLevel: "Level 1",
    businessUnit: "Treasury",
    category: "Financial",
    owner: "Investment Manager",
    assessors: ["Sophia Taylor", "Daniel Kim"],
    orgLevel: { level1: "Financial", level2: "Treasury", level3: "" },
    assessmentProgress: {
      assess: "not-started",
      reviewChallenge: "not-started",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 0,
      controlEffectiveness: 0,
      residualRating: 0,
      riskTreatment: 0,
    },
    inherentRisk: { level: "Medium", color: "yellow", score: 9 },
    inherentTrend: { value: "11%", up: true },
    relatedControls: [
      { id: "Control-053", name: "Portfolio Limits", type: "Automated", nature: "Preventive", keyControl: "Key" },
      { id: "Control-054", name: "Daily Valuation", type: "Automated", nature: "Detective", keyControl: "Non-Key" }
    ],
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "Design Effective" },
    residualRisk: { level: "Low", color: "green", score: 4 },
    residualTrend: { value: "3%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-09-25",
    previousAssessments: 6,
    tabCategory: "assess",
    historicalAssessments: [
      { date: "2025-09-25", assessor: "Sophia Taylor", inherentRisk: { level: "Medium", score: 9 }, residualRisk: { level: "Low", score: 4 }, controlEffectiveness: "Operating Effective", status: "Completed" }
    ]
  },
  // Additional risks for Risk Analytics
  {
    id: "R-016",
    title: "Advanced Analytics Accuracy",
    dueDate: "2025-12-18",
    riskLevel: "Level 1",
    businessUnit: "Risk Analytics",
    category: "Operational",
    owner: "Analytics Director",
    assessors: ["George Harris", "Olivia Brown"],
    orgLevel: { level1: "Operational", level2: "Risk Analytics", level3: "" },
    assessmentProgress: {
      assess: "not-started",
      reviewChallenge: "not-started",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 0,
      controlEffectiveness: 0,
      residualRating: 0,
      riskTreatment: 0,
    },
    inherentRisk: { level: "Medium", color: "yellow", score: 8 },
    inherentTrend: { value: "9%", up: true },
    relatedControls: [
      { id: "Control-055", name: "Model Backtesting", type: "Automated", nature: "Detective", keyControl: "Key" },
      { id: "Control-056", name: "Data Validation Rules", type: "Automated", nature: "Preventive", keyControl: "Key" }
    ],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Low", color: "green", score: 4 },
    residualTrend: { value: "5%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-09-28",
    previousAssessments: 4,
    tabCategory: "assess",
    historicalAssessments: [
      { date: "2025-09-28", assessor: "George Harris", inherentRisk: { level: "Medium", score: 8 }, residualRisk: { level: "Low", score: 4 }, controlEffectiveness: "Design Effective", status: "Completed" }
    ]
  },
  {
    id: "R-016-A",
    title: "Data Quality Issues",
    dueDate: "2025-12-20",
    riskLevel: "Level 2",
    parentRisk: "Advanced Analytics Accuracy",
    businessUnit: "Risk Analytics",
    category: "Operational",
    owner: "Data Governance Lead",
    assessors: ["Olivia Brown"],
    orgLevel: { level1: "Operational", level2: "Risk Analytics", level3: "Data Governance" },
    assessmentProgress: {
      assess: "not-started",
      reviewChallenge: "not-started",
      approve: "not-started",
    },
    sectionCompletion: {
      inherentRating: 0,
      controlEffectiveness: 0,
      residualRating: 0,
      riskTreatment: 0,
    },
    inherentRisk: { level: "Medium", color: "yellow", score: 7 },
    inherentTrend: { value: "6%", up: false },
    relatedControls: [
      { id: "Control-057", name: "Data Quality Checks", type: "Automated", nature: "Detective", keyControl: "Non-Key" }
    ],
    controlEffectiveness: { label: "Partially Effective", color: "yellow" },
    testResults: { label: "Partially Effective", sublabel: "" },
    residualRisk: { level: "Low-Medium", color: "cyan", score: 5 },
    residualTrend: { value: "4%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-10-01",
    previousAssessments: 2,
    tabCategory: "assess",
    historicalAssessments: []
  },
  // New Level 2 risks for R-001 (Operational Process Failure - Retail Banking)
  {
    id: "R-001-B",
    title: "Workflow Automation Failures",
    dueDate: "2025-12-10",
    riskLevel: "Level 2",
    parentRisk: "Operational Process Failure",
    businessUnit: "Retail Banking",
    category: "Operational",
    owner: "Process Automation Lead",
    assessors: ["Sarah Johnson"],
    orgLevel: { level1: "Operational", level2: "Retail Banking", level3: "" },
    assessmentProgress: { assess: "not-started", reviewChallenge: "not-started", approve: "not-started" },
    sectionCompletion: { inherentRating: 0, controlEffectiveness: 0, residualRating: 0, riskTreatment: 0 },
    inherentRisk: { level: "Medium", color: "yellow", score: 9 },
    inherentTrend: { value: "10%", up: true },
    relatedControls: [{ id: "Control-060", name: "Automation Monitoring", type: "Automated", nature: "Detective", keyControl: "Non-Key" }],
    controlEffectiveness: { label: "Partially Effective", color: "yellow" },
    testResults: { label: "Partially Effective", sublabel: "" },
    residualRisk: { level: "Medium", color: "yellow", score: 6 },
    residualTrend: { value: "5%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-10-15",
    previousAssessments: 2,
    tabCategory: "assess",
    historicalAssessments: []
  },
  {
    id: "R-001-C",
    title: "Manual Override Errors",
    dueDate: "2025-12-15",
    riskLevel: "Level 2",
    parentRisk: "Operational Process Failure",
    businessUnit: "Retail Banking",
    category: "Operational",
    owner: "Operations Supervisor",
    assessors: ["David Kim"],
    orgLevel: { level1: "Operational", level2: "Retail Banking", level3: "" },
    assessmentProgress: { assess: "completed", reviewChallenge: "not-started", approve: "not-started" },
    sectionCompletion: { inherentRating: 100, controlEffectiveness: 50, residualRating: 0, riskTreatment: 0 },
    inherentRisk: { level: "High", color: "red", score: 11 },
    inherentTrend: { value: "8%", up: false },
    relatedControls: [{ id: "Control-061", name: "Override Authorization", type: "Manual", nature: "Preventive", keyControl: "Key" }],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "" },
    residualRisk: { level: "Medium", color: "yellow", score: 7 },
    residualTrend: { value: "6%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-10-20",
    previousAssessments: 3,
    tabCategory: "own",
    historicalAssessments: []
  },
  // New Level 2 risks for R-002 (Cybersecurity Threat - Retail Banking)
  {
    id: "R-002-B",
    title: "Ransomware Attack Vectors",
    dueDate: "2025-12-08",
    riskLevel: "Level 2",
    parentRisk: "Cybersecurity Threat",
    businessUnit: "Retail Banking",
    category: "Technology",
    owner: "Cybersecurity Analyst",
    assessors: ["Alex Turner"],
    orgLevel: { level1: "Technology", level2: "IT Security", level3: "" },
    assessmentProgress: { assess: "in-progress", reviewChallenge: "not-started", approve: "not-started" },
    sectionCompletion: { inherentRating: 75, controlEffectiveness: 25, residualRating: 0, riskTreatment: 0 },
    inherentRisk: { level: "Critical", color: "red", score: 18 },
    inherentTrend: { value: "25%", up: true },
    relatedControls: [{ id: "Control-062", name: "Endpoint Protection", type: "Automated", nature: "Preventive", keyControl: "Key" }],
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "" },
    residualRisk: { level: "High", color: "red", score: 11 },
    residualTrend: { value: "15%", up: true },
    status: "Sent for Assessment",
    lastAssessed: "2025-10-18",
    previousAssessments: 4,
    tabCategory: "assess",
    historicalAssessments: []
  },
  {
    id: "R-002-C",
    title: "Insider Threat Exposure",
    dueDate: "2025-12-12",
    riskLevel: "Level 2",
    parentRisk: "Cybersecurity Threat",
    businessUnit: "Retail Banking",
    category: "Technology",
    owner: "Security Operations Lead",
    assessors: ["Maria Garcia"],
    orgLevel: { level1: "Technology", level2: "IT Security", level3: "" },
    assessmentProgress: { assess: "completed", reviewChallenge: "completed", approve: "not-started" },
    sectionCompletion: { inherentRating: 100, controlEffectiveness: 100, residualRating: 75, riskTreatment: 25 },
    inherentRisk: { level: "High", color: "red", score: 13 },
    inherentTrend: { value: "12%", up: false },
    relatedControls: [{ id: "Control-063", name: "User Behavior Analytics", type: "Automated", nature: "Detective", keyControl: "Key" }],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Medium", color: "yellow", score: 7 },
    residualTrend: { value: "8%", up: false },
    status: "Pending Approval",
    lastAssessed: "2025-10-22",
    previousAssessments: 5,
    tabCategory: "approve",
    historicalAssessments: []
  },
  // New Level 2 risks for R-003 (Regulatory Compliance Risk - Retail Banking)
  {
    id: "R-003-C",
    title: "Consumer Protection Violations",
    dueDate: "2025-12-05",
    riskLevel: "Level 2",
    parentRisk: "Regulatory Compliance Risk",
    businessUnit: "Retail Banking",
    category: "Compliance",
    owner: "Consumer Affairs Manager",
    assessors: ["Kevin Lee"],
    orgLevel: { level1: "Compliance", level2: "Regulatory", level3: "" },
    assessmentProgress: { assess: "completed", reviewChallenge: "completed", approve: "completed" },
    sectionCompletion: { inherentRating: 100, controlEffectiveness: 100, residualRating: 100, riskTreatment: 100 },
    inherentRisk: { level: "Medium", color: "yellow", score: 10 },
    inherentTrend: { value: "7%", up: false },
    relatedControls: [{ id: "Control-064", name: "Disclosure Review", type: "Manual", nature: "Preventive", keyControl: "Key" }],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Low", color: "green", score: 4 },
    residualTrend: { value: "3%", up: false },
    status: "Completed",
    lastAssessed: "2025-10-25",
    completionDate: "2025-10-25",
    previousAssessments: 6,
    tabCategory: "own",
    historicalAssessments: []
  },
  {
    id: "R-003-D",
    title: "Privacy Regulation Non-Compliance",
    dueDate: "2025-12-18",
    riskLevel: "Level 2",
    parentRisk: "Regulatory Compliance Risk",
    businessUnit: "Retail Banking",
    category: "Compliance",
    owner: "Privacy Officer",
    assessors: ["Kevin Lee"],
    orgLevel: { level1: "Compliance", level2: "Regulatory", level3: "" },
    assessmentProgress: { assess: "not-started", reviewChallenge: "not-started", approve: "not-started" },
    sectionCompletion: { inherentRating: 0, controlEffectiveness: 0, residualRating: 0, riskTreatment: 0 },
    inherentRisk: { level: "High", color: "red", score: 12 },
    inherentTrend: { value: "14%", up: true },
    relatedControls: [{ id: "Control-065", name: "Privacy Impact Assessment", type: "Manual", nature: "Preventive", keyControl: "Key" }],
    controlEffectiveness: { label: "Partially Effective", color: "yellow" },
    testResults: { label: "Partially Effective", sublabel: "" },
    residualRisk: { level: "Medium", color: "yellow", score: 7 },
    residualTrend: { value: "9%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-09-30",
    previousAssessments: 3,
    tabCategory: "assess",
    historicalAssessments: []
  },
  // New Level 2 risks for R-004 (Market Risk Exposure - Corporate Banking)
  {
    id: "R-004-A",
    title: "Currency Exchange Volatility",
    dueDate: "2025-12-15",
    riskLevel: "Level 2",
    parentRisk: "Market Risk Exposure",
    businessUnit: "Corporate Banking",
    category: "Financial",
    owner: "FX Trading Manager",
    assessors: ["Michelle Wong"],
    orgLevel: { level1: "Financial", level2: "Treasury", level3: "" },
    assessmentProgress: { assess: "completed", reviewChallenge: "in-progress", approve: "not-started" },
    sectionCompletion: { inherentRating: 100, controlEffectiveness: 75, residualRating: 50, riskTreatment: 0 },
    inherentRisk: { level: "Medium", color: "yellow", score: 10 },
    inherentTrend: { value: "12%", up: true },
    relatedControls: [{ id: "Control-066", name: "FX Hedging Strategy", type: "Manual", nature: "Preventive", keyControl: "Key" }],
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "" },
    residualRisk: { level: "Low", color: "green", score: 5 },
    residualTrend: { value: "6%", up: false },
    status: "Review/Challenge",
    lastAssessed: "2025-10-20",
    previousAssessments: 4,
    tabCategory: "assess",
    historicalAssessments: []
  },
  {
    id: "R-004-B",
    title: "Commodity Price Fluctuations",
    dueDate: "2025-12-20",
    riskLevel: "Level 2",
    parentRisk: "Market Risk Exposure",
    businessUnit: "Corporate Banking",
    category: "Financial",
    owner: "Commodities Desk Lead",
    assessors: ["Michelle Wong"],
    orgLevel: { level1: "Financial", level2: "Treasury", level3: "" },
    assessmentProgress: { assess: "not-started", reviewChallenge: "not-started", approve: "not-started" },
    sectionCompletion: { inherentRating: 0, controlEffectiveness: 0, residualRating: 0, riskTreatment: 0 },
    inherentRisk: { level: "Medium", color: "yellow", score: 8 },
    inherentTrend: { value: "10%", up: true },
    relatedControls: [{ id: "Control-067", name: "Commodity Derivatives", type: "Automated", nature: "Preventive", keyControl: "Key" }],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "" },
    residualRisk: { level: "Low", color: "green", score: 4 },
    residualTrend: { value: "4%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-10-12",
    previousAssessments: 3,
    tabCategory: "approve",
    historicalAssessments: []
  },
  // New Level 2 risks for R-005 (Third-Party Vendor Risk - Retail Banking)
  {
    id: "R-005-A",
    title: "Critical Vendor Concentration",
    dueDate: "2025-12-10",
    riskLevel: "Level 2",
    parentRisk: "Third-Party Vendor Risk",
    businessUnit: "Retail Banking",
    category: "Operational",
    owner: "Vendor Manager",
    assessors: ["Rachel Green"],
    orgLevel: { level1: "Operational", level2: "Vendor Management", level3: "" },
    assessmentProgress: { assess: "completed", reviewChallenge: "completed", approve: "in-progress" },
    sectionCompletion: { inherentRating: 100, controlEffectiveness: 100, residualRating: 75, riskTreatment: 50 },
    inherentRisk: { level: "High", color: "red", score: 14 },
    inherentTrend: { value: "18%", up: true },
    relatedControls: [{ id: "Control-068", name: "Vendor Diversification", type: "Manual", nature: "Preventive", keyControl: "Key" }],
    controlEffectiveness: { label: "Partially Effective", color: "yellow" },
    testResults: { label: "Partially Effective", sublabel: "" },
    residualRisk: { level: "Medium", color: "yellow", score: 8 },
    residualTrend: { value: "10%", up: false },
    status: "Pending Approval",
    lastAssessed: "2025-10-18",
    previousAssessments: 5,
    tabCategory: "approve",
    historicalAssessments: []
  },
  {
    id: "R-005-B",
    title: "Vendor Security Posture",
    dueDate: "2025-12-08",
    riskLevel: "Level 2",
    parentRisk: "Third-Party Vendor Risk",
    businessUnit: "Retail Banking",
    category: "Operational",
    owner: "Third-Party Risk Analyst",
    assessors: ["Steven Park"],
    orgLevel: { level1: "Operational", level2: "Vendor Management", level3: "" },
    assessmentProgress: { assess: "in-progress", reviewChallenge: "not-started", approve: "not-started" },
    sectionCompletion: { inherentRating: 75, controlEffectiveness: 50, residualRating: 0, riskTreatment: 0 },
    inherentRisk: { level: "High", color: "red", score: 12 },
    inherentTrend: { value: "15%", up: true },
    relatedControls: [{ id: "Control-069", name: "Vendor Security Assessments", type: "Manual", nature: "Detective", keyControl: "Key" }],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "" },
    residualRisk: { level: "Medium", color: "yellow", score: 6 },
    residualTrend: { value: "8%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-10-14",
    previousAssessments: 4,
    tabCategory: "assess",
    historicalAssessments: []
  },
  // New Level 2 risks for R-006 (Data Privacy Breach - Retail Banking)
  {
    id: "R-006-C",
    title: "Cross-Border Data Transfer",
    dueDate: "2025-12-12",
    riskLevel: "Level 2",
    parentRisk: "Data Privacy Breach",
    businessUnit: "Retail Banking",
    category: "Technology",
    owner: "Data Transfer Compliance Lead",
    assessors: ["Angela Smith"],
    orgLevel: { level1: "Technology", level2: "Data Protection", level3: "" },
    assessmentProgress: { assess: "completed", reviewChallenge: "completed", approve: "completed" },
    sectionCompletion: { inherentRating: 100, controlEffectiveness: 100, residualRating: 100, riskTreatment: 100 },
    inherentRisk: { level: "High", color: "red", score: 13 },
    inherentTrend: { value: "11%", up: false },
    relatedControls: [{ id: "Control-070", name: "Data Transfer Agreements", type: "Manual", nature: "Preventive", keyControl: "Key" }],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Medium", color: "yellow", score: 6 },
    residualTrend: { value: "7%", up: false },
    status: "Completed",
    lastAssessed: "2025-10-20",
    completionDate: "2025-10-20",
    previousAssessments: 7,
    tabCategory: "own",
    historicalAssessments: []
  },
  {
    id: "R-006-D",
    title: "Third-Party Data Sharing",
    dueDate: "2025-12-18",
    riskLevel: "Level 2",
    parentRisk: "Data Privacy Breach",
    businessUnit: "Retail Banking",
    category: "Technology",
    owner: "Data Governance Manager",
    assessors: ["Angela Smith", "David Lee"],
    orgLevel: { level1: "Technology", level2: "Data Protection", level3: "" },
    assessmentProgress: { assess: "not-started", reviewChallenge: "not-started", approve: "not-started" },
    sectionCompletion: { inherentRating: 0, controlEffectiveness: 0, residualRating: 0, riskTreatment: 0 },
    inherentRisk: { level: "High", color: "red", score: 14 },
    inherentTrend: { value: "16%", up: true },
    relatedControls: [{ id: "Control-071", name: "Data Sharing Controls", type: "Manual", nature: "Preventive", keyControl: "Key" }],
    controlEffectiveness: { label: "Partially Effective", color: "yellow" },
    testResults: { label: "Partially Effective", sublabel: "" },
    residualRisk: { level: "Medium", color: "yellow", score: 8 },
    residualTrend: { value: "10%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-09-25",
    previousAssessments: 3,
    tabCategory: "assess",
    historicalAssessments: []
  },
  // New Level 2 risks for R-007 (Credit Risk Management - Corporate Banking)
  {
    id: "R-007-A",
    title: "Loan Portfolio Concentration",
    dueDate: "2025-12-22",
    riskLevel: "Level 2",
    parentRisk: "Credit Risk Management",
    businessUnit: "Corporate Banking",
    category: "Financial",
    owner: "Portfolio Risk Manager",
    assessors: ["Thomas Anderson"],
    orgLevel: { level1: "Financial", level2: "Credit", level3: "" },
    assessmentProgress: { assess: "completed", reviewChallenge: "in-progress", approve: "not-started" },
    sectionCompletion: { inherentRating: 100, controlEffectiveness: 83, residualRating: 50, riskTreatment: 25 },
    inherentRisk: { level: "High", color: "red", score: 15 },
    inherentTrend: { value: "20%", up: true },
    relatedControls: [{ id: "Control-072", name: "Concentration Limits", type: "Automated", nature: "Preventive", keyControl: "Key" }],
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "" },
    residualRisk: { level: "Medium", color: "yellow", score: 7 },
    residualTrend: { value: "12%", up: false },
    status: "Review/Challenge",
    lastAssessed: "2025-10-26",
    previousAssessments: 6,
    tabCategory: "assess",
    historicalAssessments: []
  },
  {
    id: "R-007-B",
    title: "Counterparty Default Risk",
    dueDate: "2025-12-25",
    riskLevel: "Level 2",
    parentRisk: "Credit Risk Management",
    businessUnit: "Corporate Banking",
    category: "Financial",
    owner: "Counterparty Risk Analyst",
    assessors: ["Jennifer Lee"],
    orgLevel: { level1: "Financial", level2: "Credit", level3: "" },
    assessmentProgress: { assess: "not-started", reviewChallenge: "not-started", approve: "not-started" },
    sectionCompletion: { inherentRating: 0, controlEffectiveness: 0, residualRating: 0, riskTreatment: 0 },
    inherentRisk: { level: "Medium", color: "yellow", score: 11 },
    inherentTrend: { value: "14%", up: true },
    relatedControls: [{ id: "Control-073", name: "Counterparty Monitoring", type: "Automated", nature: "Detective", keyControl: "Key" }],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "" },
    residualRisk: { level: "Low", color: "green", score: 5 },
    residualTrend: { value: "6%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-10-22",
    previousAssessments: 4,
    tabCategory: "own",
    historicalAssessments: []
  },
  // New Level 2 risks for R-008 (Liquidity Risk - Treasury)
  {
    id: "R-008-A",
    title: "Funding Concentration Risk",
    dueDate: "2025-11-28",
    riskLevel: "Level 2",
    parentRisk: "Liquidity Risk",
    businessUnit: "Treasury",
    category: "Financial",
    owner: "Funding Manager",
    assessors: ["Brian Wilson"],
    orgLevel: { level1: "Financial", level2: "Treasury", level3: "" },
    assessmentProgress: { assess: "completed", reviewChallenge: "completed", approve: "in-progress" },
    sectionCompletion: { inherentRating: 100, controlEffectiveness: 100, residualRating: 83, riskTreatment: 67 },
    inherentRisk: { level: "Medium", color: "yellow", score: 10 },
    inherentTrend: { value: "11%", up: false },
    relatedControls: [{ id: "Control-074", name: "Funding Source Diversification", type: "Manual", nature: "Preventive", keyControl: "Key" }],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Low", color: "green", score: 4 },
    residualTrend: { value: "5%", up: false },
    status: "Pending Approval",
    lastAssessed: "2025-10-28",
    previousAssessments: 5,
    tabCategory: "approve",
    historicalAssessments: []
  },
  {
    id: "R-008-B",
    title: "Intraday Liquidity Shortfall",
    dueDate: "2025-11-30",
    riskLevel: "Level 2",
    parentRisk: "Liquidity Risk",
    businessUnit: "Treasury",
    category: "Financial",
    owner: "Intraday Liquidity Manager",
    assessors: ["Sandra Martinez"],
    orgLevel: { level1: "Financial", level2: "Treasury", level3: "" },
    assessmentProgress: { assess: "in-progress", reviewChallenge: "not-started", approve: "not-started" },
    sectionCompletion: { inherentRating: 75, controlEffectiveness: 50, residualRating: 0, riskTreatment: 0 },
    inherentRisk: { level: "Medium", color: "yellow", score: 9 },
    inherentTrend: { value: "8%", up: true },
    relatedControls: [{ id: "Control-075", name: "Real-Time Liquidity Monitoring", type: "Automated", nature: "Detective", keyControl: "Key" }],
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "" },
    residualRisk: { level: "Low", color: "green", score: 4 },
    residualTrend: { value: "4%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-10-25",
    previousAssessments: 4,
    tabCategory: "assess",
    historicalAssessments: []
  },
  // New Level 2 risks for R-009 (Business Continuity Planning - Operations)
  {
    id: "R-009-A",
    title: "Crisis Communication Gaps",
    dueDate: "2025-12-18",
    riskLevel: "Level 2",
    parentRisk: "Business Continuity Planning",
    businessUnit: "Operations",
    category: "Operational",
    owner: "Crisis Communications Lead",
    assessors: ["Mark Thompson"],
    orgLevel: { level1: "Operational", level2: "Business Continuity", level3: "" },
    assessmentProgress: { assess: "completed", reviewChallenge: "completed", approve: "completed" },
    sectionCompletion: { inherentRating: 100, controlEffectiveness: 100, residualRating: 100, riskTreatment: 100 },
    inherentRisk: { level: "Medium", color: "yellow", score: 7 },
    inherentTrend: { value: "6%", up: false },
    relatedControls: [{ id: "Control-076", name: "Crisis Communication Plan", type: "Manual", nature: "Preventive", keyControl: "Non-Key" }],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Low", color: "green", score: 3 },
    residualTrend: { value: "3%", up: false },
    status: "Completed",
    lastAssessed: "2025-10-30",
    completionDate: "2025-10-30",
    previousAssessments: 4,
    tabCategory: "own",
    historicalAssessments: []
  },
  {
    id: "R-009-B",
    title: "Key Person Dependencies",
    dueDate: "2025-12-20",
    riskLevel: "Level 2",
    parentRisk: "Business Continuity Planning",
    businessUnit: "Operations",
    category: "Operational",
    owner: "HR Business Partner",
    assessors: ["Mark Thompson"],
    orgLevel: { level1: "Operational", level2: "Business Continuity", level3: "" },
    assessmentProgress: { assess: "not-started", reviewChallenge: "not-started", approve: "not-started" },
    sectionCompletion: { inherentRating: 0, controlEffectiveness: 0, residualRating: 0, riskTreatment: 0 },
    inherentRisk: { level: "Medium", color: "yellow", score: 8 },
    inherentTrend: { value: "10%", up: true },
    relatedControls: [{ id: "Control-077", name: "Succession Planning", type: "Manual", nature: "Preventive", keyControl: "Key" }],
    controlEffectiveness: { label: "Partially Effective", color: "yellow" },
    testResults: { label: "Partially Effective", sublabel: "" },
    residualRisk: { level: "Medium", color: "yellow", score: 5 },
    residualTrend: { value: "6%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-09-28",
    previousAssessments: 2,
    tabCategory: "assess",
    historicalAssessments: []
  },
  // New Level 2 risks for R-010 (Fraud Detection Systems - Retail Banking)
  {
    id: "R-010-A",
    title: "Account Takeover Fraud",
    dueDate: "2025-11-22",
    riskLevel: "Level 2",
    parentRisk: "Fraud Detection Systems",
    businessUnit: "Retail Banking",
    category: "Technology",
    owner: "Fraud Analytics Lead",
    assessors: ["Linda Chen"],
    orgLevel: { level1: "Technology", level2: "Fraud Prevention", level3: "" },
    assessmentProgress: { assess: "completed", reviewChallenge: "completed", approve: "in-progress" },
    sectionCompletion: { inherentRating: 100, controlEffectiveness: 92, residualRating: 75, riskTreatment: 50 },
    inherentRisk: { level: "Critical", color: "red", score: 17 },
    inherentTrend: { value: "22%", up: true },
    relatedControls: [{ id: "Control-078", name: "Multi-Factor Authentication", type: "Automated", nature: "Preventive", keyControl: "Key" }],
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "Design Effective" },
    residualRisk: { level: "Medium", color: "yellow", score: 8 },
    residualTrend: { value: "12%", up: false },
    status: "Pending Approval",
    lastAssessed: "2025-10-29",
    previousAssessments: 7,
    tabCategory: "approve",
    historicalAssessments: []
  },
  {
    id: "R-010-B",
    title: "Card-Not-Present Fraud",
    dueDate: "2025-11-25",
    riskLevel: "Level 2",
    parentRisk: "Fraud Detection Systems",
    businessUnit: "Retail Banking",
    category: "Technology",
    owner: "Card Fraud Manager",
    assessors: ["Paul Roberts"],
    orgLevel: { level1: "Technology", level2: "Fraud Prevention", level3: "" },
    assessmentProgress: { assess: "in-progress", reviewChallenge: "not-started", approve: "not-started" },
    sectionCompletion: { inherentRating: 100, controlEffectiveness: 67, residualRating: 0, riskTreatment: 0 },
    inherentRisk: { level: "High", color: "red", score: 15 },
    inherentTrend: { value: "20%", up: true },
    relatedControls: [{ id: "Control-079", name: "3D Secure Implementation", type: "Automated", nature: "Preventive", keyControl: "Key" }],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "" },
    residualRisk: { level: "Medium", color: "yellow", score: 7 },
    residualTrend: { value: "10%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-10-25",
    previousAssessments: 6,
    tabCategory: "assess",
    historicalAssessments: []
  },
  // New Level 2 risks for R-011 (Model Risk Management - Risk Analytics)
  {
    id: "R-011-A",
    title: "Model Validation Backlog",
    dueDate: "2025-12-28",
    riskLevel: "Level 2",
    parentRisk: "Model Risk Management",
    businessUnit: "Risk Analytics",
    category: "Financial",
    owner: "Model Validation Lead",
    assessors: ["George Harris"],
    orgLevel: { level1: "Financial", level2: "Model Risk", level3: "" },
    assessmentProgress: { assess: "completed", reviewChallenge: "completed", approve: "completed" },
    sectionCompletion: { inherentRating: 100, controlEffectiveness: 100, residualRating: 100, riskTreatment: 100 },
    inherentRisk: { level: "Medium", color: "yellow", score: 10 },
    inherentTrend: { value: "8%", up: false },
    relatedControls: [{ id: "Control-080", name: "Validation Queue Management", type: "Manual", nature: "Detective", keyControl: "Non-Key" }],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Low", color: "green", score: 5 },
    residualTrend: { value: "5%", up: false },
    status: "Completed",
    lastAssessed: "2025-10-28",
    completionDate: "2025-10-28",
    previousAssessments: 5,
    tabCategory: "own",
    historicalAssessments: []
  },
  {
    id: "R-011-B",
    title: "Model Documentation Gaps",
    dueDate: "2025-12-30",
    riskLevel: "Level 2",
    parentRisk: "Model Risk Management",
    businessUnit: "Risk Analytics",
    category: "Financial",
    owner: "Model Governance Analyst",
    assessors: ["George Harris"],
    orgLevel: { level1: "Financial", level2: "Model Risk", level3: "" },
    assessmentProgress: { assess: "not-started", reviewChallenge: "not-started", approve: "not-started" },
    sectionCompletion: { inherentRating: 0, controlEffectiveness: 0, residualRating: 0, riskTreatment: 0 },
    inherentRisk: { level: "Medium", color: "yellow", score: 9 },
    inherentTrend: { value: "11%", up: true },
    relatedControls: [{ id: "Control-081", name: "Documentation Standards", type: "Manual", nature: "Preventive", keyControl: "Key" }],
    controlEffectiveness: { label: "Partially Effective", color: "yellow" },
    testResults: { label: "Partially Effective", sublabel: "" },
    residualRisk: { level: "Medium", color: "yellow", score: 6 },
    residualTrend: { value: "7%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-10-15",
    previousAssessments: 3,
    tabCategory: "assess",
    historicalAssessments: []
  },
  // New Level 2 risks for R-012 (Interest Rate Risk - Treasury)
  {
    id: "R-012-A",
    title: "Basis Risk Exposure",
    dueDate: "2025-11-25",
    riskLevel: "Level 2",
    parentRisk: "Interest Rate Risk",
    businessUnit: "Treasury",
    category: "Financial",
    owner: "Interest Rate Strategist",
    assessors: ["Catherine Wright"],
    orgLevel: { level1: "Financial", level2: "Treasury", level3: "" },
    assessmentProgress: { assess: "completed", reviewChallenge: "completed", approve: "in-progress" },
    sectionCompletion: { inherentRating: 100, controlEffectiveness: 100, residualRating: 83, riskTreatment: 50 },
    inherentRisk: { level: "Medium", color: "yellow", score: 8 },
    inherentTrend: { value: "7%", up: false },
    relatedControls: [{ id: "Control-082", name: "Basis Risk Monitoring", type: "Automated", nature: "Detective", keyControl: "Non-Key" }],
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "Design Effective" },
    residualRisk: { level: "Low", color: "green", score: 3 },
    residualTrend: { value: "3%", up: false },
    status: "Pending Approval",
    lastAssessed: "2025-10-30",
    previousAssessments: 6,
    tabCategory: "approve",
    historicalAssessments: []
  },
  {
    id: "R-012-B",
    title: "Yield Curve Risk",
    dueDate: "2025-11-28",
    riskLevel: "Level 2",
    parentRisk: "Interest Rate Risk",
    businessUnit: "Treasury",
    category: "Financial",
    owner: "Fixed Income Manager",
    assessors: ["William Davis"],
    orgLevel: { level1: "Financial", level2: "Treasury", level3: "" },
    assessmentProgress: { assess: "in-progress", reviewChallenge: "not-started", approve: "not-started" },
    sectionCompletion: { inherentRating: 75, controlEffectiveness: 50, residualRating: 0, riskTreatment: 0 },
    inherentRisk: { level: "Medium", color: "yellow", score: 7 },
    inherentTrend: { value: "9%", up: true },
    relatedControls: [{ id: "Control-083", name: "Duration Analysis", type: "Automated", nature: "Detective", keyControl: "Key" }],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "" },
    residualRisk: { level: "Low", color: "green", score: 3 },
    residualTrend: { value: "4%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-10-27",
    previousAssessments: 5,
    tabCategory: "assess",
    historicalAssessments: []
  },
  // New Level 2 risks for R-013 (Anti-Money Laundering Gaps - Corporate Banking)
  {
    id: "R-013-B",
    title: "Beneficial Ownership Verification",
    dueDate: "2025-12-18",
    riskLevel: "Level 2",
    parentRisk: "Anti-Money Laundering Gaps",
    businessUnit: "Corporate Banking",
    category: "Compliance",
    owner: "KYC Operations Manager",
    assessors: ["Nina Patel"],
    orgLevel: { level1: "Compliance", level2: "Corporate Banking", level3: "" },
    assessmentProgress: { assess: "completed", reviewChallenge: "completed", approve: "completed" },
    sectionCompletion: { inherentRating: 100, controlEffectiveness: 100, residualRating: 100, riskTreatment: 100 },
    inherentRisk: { level: "High", color: "red", score: 13 },
    inherentTrend: { value: "12%", up: false },
    relatedControls: [{ id: "Control-084", name: "UBO Registry Checks", type: "Automated", nature: "Preventive", keyControl: "Key" }],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Medium", color: "yellow", score: 6 },
    residualTrend: { value: "6%", up: false },
    status: "Completed",
    lastAssessed: "2025-10-28",
    completionDate: "2025-10-28",
    previousAssessments: 5,
    tabCategory: "own",
    historicalAssessments: []
  },
  {
    id: "R-013-C",
    title: "High-Risk Country Exposure",
    dueDate: "2025-12-20",
    riskLevel: "Level 2",
    parentRisk: "Anti-Money Laundering Gaps",
    businessUnit: "Corporate Banking",
    category: "Compliance",
    owner: "Sanctions Compliance Lead",
    assessors: ["David Lee"],
    orgLevel: { level1: "Compliance", level2: "Corporate Banking", level3: "" },
    assessmentProgress: { assess: "not-started", reviewChallenge: "not-started", approve: "not-started" },
    sectionCompletion: { inherentRating: 0, controlEffectiveness: 0, residualRating: 0, riskTreatment: 0 },
    inherentRisk: { level: "High", color: "red", score: 15 },
    inherentTrend: { value: "18%", up: true },
    relatedControls: [{ id: "Control-085", name: "Country Risk Screening", type: "Automated", nature: "Preventive", keyControl: "Key" }],
    controlEffectiveness: { label: "Partially Effective", color: "yellow" },
    testResults: { label: "Partially Effective", sublabel: "" },
    residualRisk: { level: "Medium", color: "yellow", score: 9 },
    residualTrend: { value: "10%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-09-20",
    previousAssessments: 3,
    tabCategory: "assess",
    historicalAssessments: []
  },
  // New Level 2 risks for R-014 (Operational Resilience - Operations)
  {
    id: "R-014-B",
    title: "Critical Service Dependencies",
    dueDate: "2025-12-15",
    riskLevel: "Level 2",
    parentRisk: "Operational Resilience",
    businessUnit: "Operations",
    category: "Operational",
    owner: "Service Resilience Manager",
    assessors: ["Emma White"],
    orgLevel: { level1: "Operational", level2: "Operations", level3: "" },
    assessmentProgress: { assess: "completed", reviewChallenge: "in-progress", approve: "not-started" },
    sectionCompletion: { inherentRating: 100, controlEffectiveness: 75, residualRating: 50, riskTreatment: 25 },
    inherentRisk: { level: "High", color: "red", score: 11 },
    inherentTrend: { value: "13%", up: true },
    relatedControls: [{ id: "Control-086", name: "Service Mapping", type: "Manual", nature: "Detective", keyControl: "Key" }],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "" },
    residualRisk: { level: "Medium", color: "yellow", score: 6 },
    residualTrend: { value: "7%", up: false },
    status: "Review/Challenge",
    lastAssessed: "2025-10-15",
    previousAssessments: 4,
    tabCategory: "assess",
    historicalAssessments: []
  },
  {
    id: "R-014-C",
    title: "Impact Tolerance Breaches",
    dueDate: "2025-12-18",
    riskLevel: "Level 2",
    parentRisk: "Operational Resilience",
    businessUnit: "Operations",
    category: "Operational",
    owner: "Resilience Testing Lead",
    assessors: ["Chris Anderson"],
    orgLevel: { level1: "Operational", level2: "Operations", level3: "" },
    assessmentProgress: { assess: "not-started", reviewChallenge: "not-started", approve: "not-started" },
    sectionCompletion: { inherentRating: 0, controlEffectiveness: 0, residualRating: 0, riskTreatment: 0 },
    inherentRisk: { level: "Medium", color: "yellow", score: 9 },
    inherentTrend: { value: "10%", up: true },
    relatedControls: [{ id: "Control-087", name: "Tolerance Monitoring", type: "Automated", nature: "Detective", keyControl: "Non-Key" }],
    controlEffectiveness: { label: "Partially Effective", color: "yellow" },
    testResults: { label: "Partially Effective", sublabel: "" },
    residualRisk: { level: "Medium", color: "yellow", score: 5 },
    residualTrend: { value: "5%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-09-22",
    previousAssessments: 2,
    tabCategory: "approve",
    historicalAssessments: []
  },
  // New Level 2 risks for R-015 (Investment Portfolio Risk - Treasury)
  {
    id: "R-015-A",
    title: "Credit Quality Deterioration",
    dueDate: "2025-12-10",
    riskLevel: "Level 2",
    parentRisk: "Investment Portfolio Risk",
    businessUnit: "Treasury",
    category: "Financial",
    owner: "Credit Portfolio Manager",
    assessors: ["Sophia Taylor"],
    orgLevel: { level1: "Financial", level2: "Treasury", level3: "" },
    assessmentProgress: { assess: "completed", reviewChallenge: "completed", approve: "completed" },
    sectionCompletion: { inherentRating: 100, controlEffectiveness: 100, residualRating: 100, riskTreatment: 100 },
    inherentRisk: { level: "Medium", color: "yellow", score: 10 },
    inherentTrend: { value: "9%", up: false },
    relatedControls: [{ id: "Control-088", name: "Credit Rating Monitoring", type: "Automated", nature: "Detective", keyControl: "Key" }],
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "Design Effective" },
    residualRisk: { level: "Low", color: "green", score: 4 },
    residualTrend: { value: "4%", up: false },
    status: "Completed",
    lastAssessed: "2025-10-30",
    completionDate: "2025-10-30",
    previousAssessments: 6,
    tabCategory: "own",
    historicalAssessments: []
  },
  {
    id: "R-015-B",
    title: "Portfolio Liquidity Risk",
    dueDate: "2025-12-12",
    riskLevel: "Level 2",
    parentRisk: "Investment Portfolio Risk",
    businessUnit: "Treasury",
    category: "Financial",
    owner: "Portfolio Liquidity Manager",
    assessors: ["Daniel Kim"],
    orgLevel: { level1: "Financial", level2: "Treasury", level3: "" },
    assessmentProgress: { assess: "in-progress", reviewChallenge: "not-started", approve: "not-started" },
    sectionCompletion: { inherentRating: 75, controlEffectiveness: 50, residualRating: 0, riskTreatment: 0 },
    inherentRisk: { level: "Medium", color: "yellow", score: 8 },
    inherentTrend: { value: "7%", up: true },
    relatedControls: [{ id: "Control-089", name: "Liquidity Stress Testing", type: "Automated", nature: "Detective", keyControl: "Key" }],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "" },
    residualRisk: { level: "Low", color: "green", score: 3 },
    residualTrend: { value: "3%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-10-28",
    previousAssessments: 4,
    tabCategory: "assess",
    historicalAssessments: []
  },
  // New Level 2 risks for R-016 (Advanced Analytics Accuracy - Risk Analytics)
  {
    id: "R-016-B",
    title: "Algorithm Bias Detection",
    dueDate: "2025-12-22",
    riskLevel: "Level 2",
    parentRisk: "Advanced Analytics Accuracy",
    businessUnit: "Risk Analytics",
    category: "Operational",
    owner: "AI Ethics Lead",
    assessors: ["George Harris"],
    orgLevel: { level1: "Operational", level2: "Risk Analytics", level3: "" },
    assessmentProgress: { assess: "completed", reviewChallenge: "completed", approve: "in-progress" },
    sectionCompletion: { inherentRating: 100, controlEffectiveness: 83, residualRating: 67, riskTreatment: 33 },
    inherentRisk: { level: "Medium", color: "yellow", score: 9 },
    inherentTrend: { value: "12%", up: true },
    relatedControls: [{ id: "Control-090", name: "Bias Testing Framework", type: "Automated", nature: "Detective", keyControl: "Key" }],
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "Low", color: "green", score: 4 },
    residualTrend: { value: "5%", up: false },
    status: "Pending Approval",
    lastAssessed: "2025-10-25",
    previousAssessments: 4,
    tabCategory: "approve",
    historicalAssessments: []
  },
  {
    id: "R-016-C",
    title: "Feature Drift Monitoring",
    dueDate: "2025-12-25",
    riskLevel: "Level 2",
    parentRisk: "Advanced Analytics Accuracy",
    businessUnit: "Risk Analytics",
    category: "Operational",
    owner: "ML Operations Lead",
    assessors: ["Olivia Brown"],
    orgLevel: { level1: "Operational", level2: "Risk Analytics", level3: "" },
    assessmentProgress: { assess: "not-started", reviewChallenge: "not-started", approve: "not-started" },
    sectionCompletion: { inherentRating: 0, controlEffectiveness: 0, residualRating: 0, riskTreatment: 0 },
    inherentRisk: { level: "Medium", color: "yellow", score: 7 },
    inherentTrend: { value: "8%", up: true },
    relatedControls: [{ id: "Control-091", name: "Drift Detection Alerts", type: "Automated", nature: "Detective", keyControl: "Non-Key" }],
    controlEffectiveness: { label: "Partially Effective", color: "yellow" },
    testResults: { label: "Partially Effective", sublabel: "" },
    residualRisk: { level: "Low", color: "green", score: 4 },
    residualTrend: { value: "4%", up: false },
    status: "Sent for Assessment",
    lastAssessed: "2025-10-18",
    previousAssessments: 2,
    tabCategory: "assess",
    historicalAssessments: []
  }
];

// Helper function to get a deep copy of the initial data for independent state
export const getInitialRiskDataCopy = (): SharedRiskData[] => {
  return JSON.parse(JSON.stringify(initialRiskData));
};
