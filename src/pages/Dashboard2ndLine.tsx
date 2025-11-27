import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, AlertTriangle, FileCheck, Clock, TrendingUp, TrendingDown, UserPlus, Users as UsersIcon, RotateCcw, Edit2, LogOut, User, ChevronDown } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface RiskData {
  id: string;
  title: string;
  riskLevel: string;
  parentRisk?: string;
  businessUnit: string;
  category: string;
  owner: string;
  inherentRisk: { level: string; color: string };
  inherentTrend: { value: string; up: boolean };
  relatedControls: { id: string; name: string; type: string; nature: string };
  controlEffectiveness: { label: string; color: string };
  testResults: { label: string; sublabel: string };
  residualRisk: { level: string; color: string };
  residualTrend: { value: string; up: boolean };
  status: string;
  lastAssessed: string;
  previousAssessments: number;
  tabCategory: "own" | "assess" | "approve";
}

const Dashboard2ndLine = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"own" | "assess" | "approve">("assess");
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    type: "inherent" | "controls" | "effectiveness" | "residual" | "trend" | null;
    riskId: string | null;
    currentValue: string;
  }>({
    open: false,
    type: null,
    riskId: null,
    currentValue: "",
  });
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: "reassign" | "collaborate" | "reassess" | null;
    riskId: string | null;
  }>({
    open: false,
    type: null,
    riskId: null,
  });
  const [riskData, setRiskData] = useState<RiskData[]>(initialRiskData);

  const handleEdit = (type: typeof editDialog.type, riskId: string, currentValue: string) => {
    setEditDialog({ open: true, type, riskId, currentValue });
  };

  const handleSaveEdit = () => {
    toast.success("Changes saved successfully");
    setEditDialog({ open: false, type: null, riskId: null, currentValue: "" });
  };

  const handleAction = (type: typeof actionDialog.type, riskId: string) => {
    setActionDialog({ open: true, type, riskId });
  };

  const handleActionSubmit = () => {
    const actionName = actionDialog.type === "reassign" ? "Reassignment" : 
                       actionDialog.type === "collaborate" ? "Collaboration request" : 
                       "Reassessment";
    toast.success(`${actionName} completed successfully`);
    setActionDialog({ open: false, type: null, riskId: null });
  };

  const handleLogout = () => {
    navigate("/");
  };
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

  const filteredRiskData = riskData.filter(risk => risk.tabCategory === activeTab);

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    2nd Line Analyst
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Current Persona</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Switch Persona / Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)} className="mb-6">
              <TabsList className="grid w-full max-w-3xl grid-cols-3">
                <TabsTrigger value="own">Risks I Own ({riskData.filter(r => r.tabCategory === "own").length})</TabsTrigger>
                <TabsTrigger value="assess">
                  Risks I have to Assess ({riskData.filter(r => r.tabCategory === "assess").length})
                </TabsTrigger>
                <TabsTrigger value="approve">Risks I have to Approve ({riskData.filter(r => r.tabCategory === "approve").length})</TabsTrigger>
              </TabsList>
              <TabsContent value="own" className="mt-0" />
              <TabsContent value="assess" className="mt-0" />
              <TabsContent value="approve" className="mt-0" />
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
                    {filteredRiskData.map((risk, index) => {
                      const isLevel1 = risk.riskLevel === "Level 1";
                      const isLevel2 = risk.riskLevel === "Level 2";
                      const isLevel3 = risk.riskLevel === "Level 3";
                      
                      return (
                      <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                        <TableCell className="font-medium">{risk.id}</TableCell>
                        <TableCell>
                          <div className={`${isLevel2 ? 'pl-6' : isLevel3 ? 'pl-12' : ''}`}>
                            <button 
                              className="text-left hover:text-primary transition-colors font-medium text-blue-600 dark:text-blue-400 hover:underline"
                              onClick={() => toast.info(`Opening details for ${risk.title}`)}
                            >
                              {risk.title}
                            </button>
                            {risk.parentRisk && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Parent: {risk.parentRisk}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {risk.riskLevel}
                          </Badge>
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
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleEdit("inherent", risk.id, risk.inherentRisk.level)}
                                  >
                                    <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer" />
                                  </Button>
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
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleEdit("controls", risk.id, risk.relatedControls.name)}
                                  >
                                    <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer" />
                                  </Button>
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
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleEdit("effectiveness", risk.id, risk.controlEffectiveness.label)}
                                  >
                                    <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer" />
                                  </Button>
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
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleEdit("residual", risk.id, risk.residualRisk.level)}
                                  >
                                    <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer" />
                                  </Button>
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
                            <div className="flex items-center gap-2">
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
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => handleEdit("trend", risk.id, risk.residualTrend.value)}
                                    >
                                      <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit Residual Trend</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
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
                          <div className="flex items-center justify-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20"
                                    onClick={() => handleAction("reassign", risk.id)}
                                  >
                                    <UserPlus className="w-4 h-4 text-blue-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Reassign</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/20"
                                    onClick={() => handleAction("collaborate", risk.id)}
                                  >
                                    <UsersIcon className="w-4 h-4 text-purple-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Collaborate</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full hover:bg-green-100 dark:hover:bg-green-900/20"
                                    onClick={() => handleAction("reassess", risk.id)}
                                  >
                                    <RotateCcw className="w-4 h-4 text-green-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Reassess</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ ...editDialog, open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit {editDialog.type === "inherent" ? "Inherent Risk" : 
                    editDialog.type === "controls" ? "Related Controls" :
                    editDialog.type === "effectiveness" ? "Control Effectiveness" :
                    editDialog.type === "residual" ? "Residual Risk" : "Residual Trend"}
            </DialogTitle>
            <DialogDescription>
              Update the value for risk {editDialog.riskId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-value">New Value</Label>
              <Input
                id="edit-value"
                defaultValue={editDialog.currentValue}
                placeholder="Enter new value"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ ...editDialog, open: false })}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ ...actionDialog, open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "reassign" ? "Reassign Risk" :
               actionDialog.type === "collaborate" ? "Collaborate on Risk" :
               "Reassess Risk"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === "reassign" ? "Select a new owner for this risk assessment" :
               actionDialog.type === "collaborate" ? "Invite team members to collaborate on this risk" :
               "Schedule a new assessment for this risk"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {actionDialog.type === "reassign" && (
              <div className="space-y-2">
                <Label htmlFor="assignee">Assign To</Label>
                <Select>
                  <SelectTrigger id="assignee">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="analyst1">Risk Analyst 1</SelectItem>
                    <SelectItem value="analyst2">Risk Analyst 2</SelectItem>
                    <SelectItem value="manager">Risk Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {actionDialog.type === "collaborate" && (
              <div className="space-y-2">
                <Label htmlFor="collaborators">Add Collaborators</Label>
                <Input
                  id="collaborators"
                  placeholder="Enter email addresses (comma separated)"
                />
              </div>
            )}
            {actionDialog.type === "reassess" && (
              <div className="space-y-2">
                <Label htmlFor="assessment-date">Assessment Date</Label>
                <Input
                  id="assessment-date"
                  type="date"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ ...actionDialog, open: false })}>
              Cancel
            </Button>
            <Button onClick={handleActionSubmit}>
              {actionDialog.type === "reassign" ? "Reassign" :
               actionDialog.type === "collaborate" ? "Send Invites" :
               "Schedule Assessment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Sample data with 10 rows across different tabs and hierarchy levels
const initialRiskData: RiskData[] = [
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
    tabCategory: "assess",
  },
  {
    id: "R-001-A",
    title: "Branch Transaction Processing",
    riskLevel: "Level 2",
    parentRisk: "Operational Process Failure",
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
    tabCategory: "assess",
  },
  {
    id: "R-001-A-1",
    title: "Cash Handling Errors",
    riskLevel: "Level 3",
    parentRisk: "Branch Transaction Processing",
    businessUnit: "Retail Banking",
    category: "Operational",
    owner: "Teller Supervisor",
    inherentRisk: { level: "[3C, Medium]", color: "yellow" },
    inherentTrend: { value: "8%", up: true },
    relatedControls: { id: "Control-012", name: "Dual Authorization", type: "Automated", nature: "Preventive" },
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "[2, Low]", color: "green" },
    residualTrend: { value: "5%", up: false },
    status: "In Progress",
    lastAssessed: "2025-10-15",
    previousAssessments: 8,
    tabCategory: "assess",
  },
  {
    id: "R-002",
    title: "Cybersecurity Threat",
    riskLevel: "Level 1",
    businessUnit: "Retail Banking",
    category: "Technology",
    owner: "CISO Office",
    inherentRisk: { level: "[5A, Critical]", color: "red" },
    inherentTrend: { value: "20%", up: true },
    relatedControls: { id: "Control-015", name: "Firewall & IDS", type: "Automated", nature: "Preventive" },
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "Design Effective" },
    residualRisk: { level: "[4, High]", color: "red" },
    residualTrend: { value: "18%", up: true },
    status: "Pending Approval",
    lastAssessed: "2025-10-22",
    previousAssessments: 12,
    tabCategory: "approve",
  },
  {
    id: "R-002-A",
    title: "Phishing Attacks",
    riskLevel: "Level 2",
    parentRisk: "Cybersecurity Threat",
    businessUnit: "Retail Banking",
    category: "Technology",
    owner: "Security Team",
    inherentRisk: { level: "[4B, High]", color: "red" },
    inherentTrend: { value: "15%", up: true },
    relatedControls: { id: "Control-018", name: "Email Filtering", type: "Automated", nature: "Preventive" },
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "" },
    residualRisk: { level: "[3B, Medium]", color: "yellow" },
    residualTrend: { value: "12%", up: false },
    status: "Pending Approval",
    lastAssessed: "2025-10-21",
    previousAssessments: 9,
    tabCategory: "approve",
  },
  {
    id: "R-003",
    title: "Regulatory Compliance Risk",
    riskLevel: "Level 1",
    businessUnit: "Retail Banking",
    category: "Compliance",
    owner: "Compliance Officer",
    inherentRisk: { level: "[4A, High]", color: "red" },
    inherentTrend: { value: "10%", up: false },
    relatedControls: { id: "Control-020", name: "Policy Framework", type: "Manual", nature: "Preventive" },
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "[2, Low]", color: "green" },
    residualTrend: { value: "6%", up: false },
    status: "Completed",
    lastAssessed: "2025-10-19",
    previousAssessments: 15,
    tabCategory: "own",
  },
  {
    id: "R-003-A",
    title: "AML Reporting Gaps",
    riskLevel: "Level 2",
    parentRisk: "Regulatory Compliance Risk",
    businessUnit: "Retail Banking",
    category: "Compliance",
    owner: "AML Team Lead",
    inherentRisk: { level: "[5B, Critical]", color: "red" },
    inherentTrend: { value: "22%", up: true },
    relatedControls: { id: "Control-023", name: "Transaction Monitoring", type: "Automated", nature: "Detective" },
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "" },
    residualRisk: { level: "[4A, High]", color: "red" },
    residualTrend: { value: "19%", up: true },
    status: "Overdue",
    lastAssessed: "2025-09-28",
    previousAssessments: 11,
    tabCategory: "own",
  },
  {
    id: "R-004",
    title: "Market Risk Exposure",
    riskLevel: "Level 1",
    businessUnit: "Corporate Banking",
    category: "Financial",
    owner: "Treasury Department",
    inherentRisk: { level: "[3A, Medium]", color: "yellow" },
    inherentTrend: { value: "9%", up: false },
    relatedControls: { id: "Control-025", name: "Hedging Strategy", type: "Manual", nature: "Preventive" },
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "Operating Effective" },
    residualRisk: { level: "[2A, Low]", color: "green" },
    residualTrend: { value: "4%", up: false },
    status: "In Progress",
    lastAssessed: "2025-10-17",
    previousAssessments: 7,
    tabCategory: "approve",
  },
  {
    id: "R-005",
    title: "Third-Party Vendor Risk",
    riskLevel: "Level 1",
    businessUnit: "Retail Banking",
    category: "Operational",
    owner: "Procurement Manager",
    inherentRisk: { level: "[4C, High]", color: "red" },
    inherentTrend: { value: "16%", up: true },
    relatedControls: { id: "Control-028", name: "Vendor Due Diligence", type: "Manual", nature: "Preventive" },
    controlEffectiveness: { label: "Operating Effective", color: "green" },
    testResults: { label: "Operating Effective", sublabel: "Design Effective" },
    residualRisk: { level: "[3C, Medium]", color: "yellow" },
    residualTrend: { value: "13%", up: true },
    status: "Sent for Assessment",
    lastAssessed: "2025-10-16",
    previousAssessments: 4,
    tabCategory: "assess",
  },
  {
    id: "R-006",
    title: "Data Privacy Breach",
    riskLevel: "Level 1",
    businessUnit: "Retail Banking",
    category: "Technology",
    owner: "Data Protection Officer",
    inherentRisk: { level: "[5A, Critical]", color: "red" },
    inherentTrend: { value: "25%", up: true },
    relatedControls: { id: "Control-030", name: "Encryption & Access Controls", type: "Automated", nature: "Preventive" },
    controlEffectiveness: { label: "Design Effective", color: "green" },
    testResults: { label: "Design Effective", sublabel: "" },
    residualRisk: { level: "[3A, Medium]", color: "yellow" },
    residualTrend: { value: "11%", up: false },
    status: "Completed",
    lastAssessed: "2025-10-23",
    previousAssessments: 10,
    tabCategory: "own",
  },
];

export default Dashboard2ndLine;
