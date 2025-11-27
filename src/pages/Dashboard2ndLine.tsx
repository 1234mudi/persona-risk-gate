import { Shield, AlertTriangle, FileCheck, Clock, TrendingUp, TrendingDown, UserPlus, Users as UsersIcon, RotateCcw, Edit2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";

const Dashboard2ndLine = () => {
  const metrics = [
    {
      title: "Assessments Pending Review",
      value: "24",
      icon: FileCheck,
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "High-Risk Items",
      value: "8",
      icon: AlertTriangle,
      trend: "-3%",
      trendUp: false,
    },
    {
      title: "Evidence Pending Validation",
      value: "16",
      icon: Clock,
      trend: "+5%",
      trendUp: true,
    },
    {
      title: "Overdue Assessments",
      value: "3",
      icon: Shield,
      trend: "0%",
      trendUp: false,
    },
  ];

  const riskData = [
    {
      id: "R-001",
      title: "Operational Process Failure",
      riskLevel: "Level 1",
      businessUnit: "Retail Banking",
      category: "Operational",
      owner: "Michael Chen (Operations)",
      inherentRisk: { level: "[3B, Medium]", color: "yellow" },
      inherentTrend: { value: "13%", up: false },
      relatedControls: { id: "Control-003", name: "Quality Assurance", type: "Manual", nature: "Detective" },
      controlEffectiveness: { label: "Design Effective", color: "green" },
      testResults: { label: "Design Effective", sublabel: "Operating Effective" },
      residualRisk: { level: "[3, Low]", color: "green" },
      residualTrend: { value: "7%", up: true },
      status: "Sent for Assessment",
      lastAssessed: "2025-10-20",
      previousAssessments: 5,
    },
    {
      id: "R-002",
      title: "Branch Audit Compliance",
      riskLevel: "Level 2",
      businessUnit: "Retail Banking",
      category: "Operational",
      owner: "Branch Manager",
      inherentRisk: { level: "[4A, High]", color: "red" },
      inherentTrend: { value: "12%", up: false },
      relatedControls: { id: "Control-009", name: "Branch Audits", type: "Manual", nature: "Detective" },
      controlEffectiveness: { label: "Operating Effective", color: "green" },
      testResults: { label: "Operating Effective", sublabel: "" },
      residualRisk: { level: "[3A, Medium]", color: "yellow" },
      residualTrend: { value: "14%", up: true },
      status: "Sent for Assessment",
      lastAssessed: "2025-10-18",
      previousAssessments: 6,
    },
  ];

  const getRiskBadgeColor = (color: string) => {
    switch (color) {
      case "red":
        return "bg-destructive/20 text-destructive border-destructive/30";
      case "yellow":
        return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "green":
        return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getEffectivenessBadge = (label: string, color: string) => {
    const colorClass = color === "green" 
      ? "bg-green-500 text-white" 
      : "bg-yellow-500 text-white";
    return <Badge className={`${colorClass} rounded-full`}>{label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-second-line to-primary flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  2nd Line Risk Analyst Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">Risk & Compliance Self Assessment</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <UsersIcon className="w-4 h-4 mr-2" />
                My Team
              </Button>
              <Button size="sm">
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Scorecards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <Card key={index} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">{metric.title}</p>
                    <p className="text-3xl font-bold text-foreground">{metric.value}</p>
                    <div className="flex items-center gap-1">
                      {metric.trendUp ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-xs font-medium ${metric.trendUp ? "text-green-600" : "text-red-600"}`}>
                        {metric.trend}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-second-line/10 flex items-center justify-center">
                    <metric.icon className="w-6 h-6 text-second-line" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* My Risk Assessments Section */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-xl font-semibold">My Risk Assessments</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Tabs */}
            <Tabs defaultValue="assess" className="mb-6">
              <TabsList className="grid w-full max-w-3xl grid-cols-3">
                <TabsTrigger value="own">Risks I Own</TabsTrigger>
                <TabsTrigger value="assess" className="bg-primary text-primary-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Risks I have to Assess
                </TabsTrigger>
                <TabsTrigger value="approve">Risks I have to Approve</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Info Banner */}
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Review and assess risks that require your evaluation. Update risk ratings and controls by clicking the{" "}
                  <Edit2 className="w-4 h-4 inline mx-1" /> icon in any editable field.
                </p>
              </div>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <Select defaultValue="retail">
                <SelectTrigger className="w-48 bg-primary text-primary-foreground border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retail">Retail Banking</SelectItem>
                  <SelectItem value="corporate">Corporate Banking</SelectItem>
                  <SelectItem value="investment">Investment Banking</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative flex-1 min-w-[200px]">
                <Input placeholder="Search risks..." className="pl-10" />
                <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>

              <div className="ml-auto flex gap-2">
                <Button className="bg-primary">
                  <FileCheck className="w-4 h-4 mr-2" />
                  Add New Risk
                </Button>
                <Button variant="outline" className="border-primary text-primary">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reassess
                </Button>
                <Button variant="outline" className="border-primary text-primary">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Reassign
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0">
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox />
                      </TableHead>
                      <TableHead className="min-w-[100px]">Risk ID</TableHead>
                      <TableHead className="min-w-[200px]">Risk Title</TableHead>
                      <TableHead className="min-w-[100px]">Risk Level</TableHead>
                      <TableHead className="min-w-[150px]">Business Unit</TableHead>
                      <TableHead className="min-w-[120px]">Category</TableHead>
                      <TableHead className="min-w-[180px]">Owner</TableHead>
                      <TableHead className="min-w-[140px]">Inherent Risk</TableHead>
                      <TableHead className="min-w-[120px]">Inherent Trend</TableHead>
                      <TableHead className="min-w-[180px]">Related Controls</TableHead>
                      <TableHead className="min-w-[160px]">Control Effectiveness</TableHead>
                      <TableHead className="min-w-[160px]">Test Results</TableHead>
                      <TableHead className="min-w-[140px]">Residual Risk</TableHead>
                      <TableHead className="min-w-[120px]">Residual Trend</TableHead>
                      <TableHead className="min-w-[160px]">Status</TableHead>
                      <TableHead className="min-w-[140px]">Last Assessed Date</TableHead>
                      <TableHead className="min-w-[120px] text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riskData.map((risk, index) => (
                      <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                        <TableCell className="font-medium">{risk.id}</TableCell>
                        <TableCell>
                          <button className="text-left hover:text-primary transition-colors font-medium text-blue-600 dark:text-blue-400 hover:underline">
                            {risk.title}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">{risk.riskLevel}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{risk.businessUnit}</TableCell>
                        <TableCell className="text-sm">{risk.category}</TableCell>
                        <TableCell className="text-sm">{risk.owner}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getRiskBadgeColor(risk.inherentRisk.color)} border rounded-full px-3`}>
                              {risk.inherentRisk.level}
                            </Badge>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit Inherent Risk</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              {risk.inherentTrend.up ? (
                                <TrendingUp className="w-4 h-4 text-red-600" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-green-600" />
                              )}
                              <span className={`text-sm font-medium ${risk.inherentTrend.up ? "text-red-600" : "text-green-600"}`}>
                                {risk.inherentTrend.value}
                              </span>
                            </div>
                            <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline text-left">
                              View Previous Assessments
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">{risk.relatedControls.id}</div>
                              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">{risk.relatedControls.name}</div>
                              <div className="flex gap-2 text-xs text-muted-foreground">
                                <span>{risk.relatedControls.type}</span>
                                <span>{risk.relatedControls.nature}</span>
                              </div>
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit Related Controls</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEffectivenessBadge(risk.controlEffectiveness.label, risk.controlEffectiveness.color)}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit Control Effectiveness</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{risk.testResults.label}</div>
                            {risk.testResults.sublabel && (
                              <div className="text-xs text-muted-foreground">{risk.testResults.sublabel}</div>
                            )}
                            <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              View Previous Test Results
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getRiskBadgeColor(risk.residualRisk.color)} border rounded-full px-3`}>
                              {risk.residualRisk.level}
                            </Badge>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit Residual Risk</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              {risk.residualTrend.up ? (
                                <TrendingUp className="w-4 h-4 text-red-600" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-green-600" />
                              )}
                              <span className={`text-sm font-medium ${risk.residualTrend.up ? "text-red-600" : "text-green-600"}`}>
                                {risk.residualTrend.value}
                              </span>
                            </div>
                            <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline text-left">
                              View Previous Assessments
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-500 text-white rounded-full">
                            {risk.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{risk.lastAssessed}</div>
                            <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              View History ({risk.previousAssessments})
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <div className="flex items-center justify-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 rounded-full hover:bg-primary/10 hover:text-primary"
                                  >
                                    <UserPlus className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Reassign</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 rounded-full hover:bg-primary/10 hover:text-primary"
                                  >
                                    <UsersIcon className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Collaborate</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 rounded-full hover:bg-primary/10 hover:text-primary"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Reassess</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard2ndLine;
