import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  MessageSquare, 
  FileText, 
  Users, 
  Save, 
  Send, 
  X,
  TrendingUp,
  Eye,
  EyeOff,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Shield,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

// Types
interface Factor {
  id: string;
  name: string;
  description: string;
  rating: number;
  comments: string;
  weightage: number;
}

interface Control {
  id: string;
  name: string;
  type: string;
  owner: string;
  designRating: number;
  operatingRating: number;
  testingRating: number;
}

const RiskAssessmentForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const section = searchParams.get("section") || "inherent-rating";
  const riskId = searchParams.get("riskId") || "RISK-2025-001";
  const riskName = searchParams.get("riskName") || "KYC Risk Assessment Inadequacy";
  
  const [activeTab, setActiveTab] = useState(section);
  const [showWeights, setShowWeights] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Inherent Risk Factors
  const [inherentFactors, setInherentFactors] = useState<Factor[]>([
    { id: "1", name: "Financial Impact", description: "Impact on financial performance", rating: 3, comments: "Significant financial impact due to penalties and remediation costs", weightage: 30 },
    { id: "2", name: "Reputational Impact", description: "Impact on brand and reputation", rating: 4, comments: "Major reputational damage if regulatory issues become public", weightage: 25 },
    { id: "3", name: "Operational Impact", description: "Impact on day-to-day operations", rating: 3, comments: "Operational disruptions due to compliance remediation activities", weightage: 20 },
    { id: "4", name: "Regulatory Impact", description: "Impact related to regulatory oversight", rating: 4, comments: "High regulatory scrutiny and potential for enforcement actions", weightage: 25 },
  ]);
  
  // Controls
  const [controls, setControls] = useState<Control[]>([
    { id: "CTL-001", name: "KYC Verification Process", type: "Preventive", owner: "Compliance Team", designRating: 3, operatingRating: 2, testingRating: 3 },
    { id: "CTL-002", name: "Customer Due Diligence", type: "Detective", owner: "Risk Management", designRating: 4, operatingRating: 3, testingRating: 3 },
    { id: "CTL-003", name: "Periodic Review Process", type: "Preventive", owner: "Operations", designRating: 3, operatingRating: 3, testingRating: 2 },
  ]);
  
  // Residual Risk Factors
  const [residualFactors, setResidualFactors] = useState<Factor[]>([
    { id: "1", name: "Post-Control Financial Impact", description: "Financial impact after controls", rating: 2, comments: "Reduced financial exposure with controls in place", weightage: 30 },
    { id: "2", name: "Post-Control Reputational Impact", description: "Reputational impact after controls", rating: 2, comments: "Better managed reputational risk", weightage: 25 },
    { id: "3", name: "Post-Control Operational Impact", description: "Operational impact after controls", rating: 2, comments: "Streamlined operations with controls", weightage: 20 },
    { id: "4", name: "Post-Control Regulatory Impact", description: "Regulatory impact after controls", rating: 2, comments: "Improved compliance posture", weightage: 25 },
  ]);

  // Set active tab from URL
  useEffect(() => {
    if (section) {
      setActiveTab(section);
    }
  }, [section]);

  // Calculate scores
  const calculateInherentScore = () => {
    const totalWeight = inherentFactors.reduce((sum, f) => sum + f.weightage, 0);
    const weightedSum = inherentFactors.reduce((sum, f) => sum + (f.rating * f.weightage), 0);
    return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(1) : "0.0";
  };

  const calculateControlScore = () => {
    if (controls.length === 0) return "0.0";
    const avg = controls.reduce((sum, c) => sum + (c.designRating + c.operatingRating + c.testingRating) / 3, 0) / controls.length;
    return avg.toFixed(1);
  };

  const calculateResidualScore = () => {
    const totalWeight = residualFactors.reduce((sum, f) => sum + f.weightage, 0);
    const weightedSum = residualFactors.reduce((sum, f) => sum + (f.rating * f.weightage), 0);
    return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(1) : "0.0";
  };

  const getRatingLabel = (score: number) => {
    if (score >= 4) return { label: "High", color: "bg-red-500" };
    if (score >= 3) return { label: "Medium", color: "bg-orange-500" };
    if (score >= 2) return { label: "Low", color: "bg-emerald-500" };
    return { label: "Very Low", color: "bg-blue-500" };
  };

  const handleAiAutofill = async () => {
    setIsAiLoading(true);
    toast.info("AI is analyzing risk factors...");
    
    setTimeout(() => {
      setIsAiLoading(false);
      toast.success("AI suggestions applied successfully!");
    }, 2000);
  };

  const updateFactorRating = (factors: Factor[], setFactors: React.Dispatch<React.SetStateAction<Factor[]>>, id: string, rating: number) => {
    setFactors(factors.map(f => f.id === id ? { ...f, rating } : f));
  };

  const updateFactorComment = (factors: Factor[], setFactors: React.Dispatch<React.SetStateAction<Factor[]>>, id: string, comments: string) => {
    setFactors(factors.map(f => f.id === id ? { ...f, comments } : f));
  };

  const updateControlRating = (id: string, field: 'designRating' | 'operatingRating' | 'testingRating', value: number) => {
    setControls(controls.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const inherentScore = parseFloat(calculateInherentScore());
  const controlScore = parseFloat(calculateControlScore());
  const residualScore = parseFloat(calculateResidualScore());
  const riskReduction = (inherentScore - residualScore).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left - Back & Collaboration */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-background flex items-center justify-center text-white text-xs font-medium">SJ</div>
                  <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center text-white text-xs font-medium">MC</div>
                  <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-background flex items-center justify-center text-white text-xs font-medium">ER</div>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  1 editing
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  2 viewing
                </Badge>
              </div>
            </div>
            
            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Summarize & Export
              </Button>
              <Button variant="outline" size="sm" className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
                <Users className="w-4 h-4 mr-2" />
                Collaborate
              </Button>
              <Button variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Send className="w-4 h-4 mr-2" />
                Submit
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Risk Info Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-6 h-6 rounded-full border-2 border-blue-500" />
                <h1 className="text-2xl font-bold text-foreground">
                  Assess Risk: {riskName}
                </h1>
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                  Pending Review
                </Badge>
                <span className="text-muted-foreground font-mono">{riskId}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Assessment ID: <span className="text-blue-600 font-medium">ASM-1043</span></span>
                <span>•</span>
                <span>Date: 2025-04-10</span>
              </div>
            </div>
          </div>
          
          {/* Risk Hierarchy & Appetite */}
          <div className="flex items-center gap-6 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Risk Hierarchy:</span>
              <span className="text-blue-600">Compliance Risk</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="text-blue-600">Regulatory Risk</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="text-blue-600">KYC Risk</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Risk Appetite:</span>
              <Badge className="bg-red-100 text-red-700">Low</Badge>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Within Appetite
              </Badge>
            </div>
          </div>

          {/* Score Cards */}
          <div className="flex items-center gap-4 mb-6">
            <Card className={`px-6 py-4 ${getRatingLabel(inherentScore).color} text-white`}>
              <div className="text-xs opacity-90 mb-1">Inherent Risk</div>
              <div className="text-2xl font-bold">{inherentScore}</div>
              <div className="text-sm">{getRatingLabel(inherentScore).label}</div>
            </Card>
            <Card className={`px-6 py-4 ${getRatingLabel(controlScore).color} text-white`}>
              <div className="text-xs opacity-90 mb-1">Control Effectiveness</div>
              <div className="text-2xl font-bold">{controlScore}</div>
              <div className="text-sm">{getRatingLabel(controlScore).label}</div>
            </Card>
            <Card className={`px-6 py-4 ${getRatingLabel(residualScore).color} text-white`}>
              <div className="text-xs opacity-90 mb-1">Residual Risk</div>
              <div className="text-2xl font-bold">{residualScore}</div>
              <div className="text-sm">{getRatingLabel(residualScore).label}</div>
            </Card>
            <Card className="px-6 py-4 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900">
              <div className="text-xs text-muted-foreground mb-1">Risk Reduction</div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-2xl font-bold text-emerald-600">{riskReduction}</span>
              </div>
              <div className="text-sm text-muted-foreground">points</div>
            </Card>
            <div className="ml-auto">
              <Button variant="outline" className="gap-2">
                <Shield className="w-4 h-4" />
                Associated Risks
                <Badge className="bg-blue-100 text-blue-700 ml-1">3</Badge>
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 p-0 h-auto">
            <TabsTrigger 
              value="inherent-rating" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent px-4 py-3 gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Inherent Rating
              <Badge variant="outline" className="ml-1 text-xs">1</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="control-effectiveness" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-4 py-3 gap-2"
            >
              <Shield className="w-4 h-4" />
              Control Effectiveness
              <Badge variant="outline" className="ml-1 text-xs">2</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="residual-rating" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent px-4 py-3 gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Residual Rating
              <Badge variant="outline" className="ml-1 text-xs">3</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="heat-map" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent px-4 py-3 gap-2"
            >
              Heat Map
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </TabsTrigger>
            <TabsTrigger 
              value="issues" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent px-4 py-3 gap-2"
            >
              Issues
              <Badge className="bg-red-100 text-red-700 ml-1 text-xs">5</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Inherent Rating Tab */}
          <TabsContent value="inherent-rating" className="space-y-4">
            <Card className="p-6">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">Overall Inherent Risk Rating</h2>
                  <p className="text-sm text-muted-foreground">Calculated based on weighted impact factors</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" className="gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Show Trend
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setShowWeights(!showWeights)}
                  >
                    {showWeights ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showWeights ? "Hide" : "Show"} Weights
                  </Button>
                  <div className={`px-4 py-2 rounded-lg ${getRatingLabel(inherentScore).color} text-white`}>
                    <div className="text-xs opacity-90">Score: {inherentScore}</div>
                    <div className="font-semibold">{getRatingLabel(inherentScore).label}</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Configure impact factors and ratings for inherent risk assessment
                </p>
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white gap-2"
                  onClick={handleAiAutofill}
                  disabled={isAiLoading}
                >
                  <Sparkles className="w-4 h-4" />
                  {isAiLoading ? "Analyzing..." : "AI Autofill All"}
                </Button>
              </div>

              {/* Collaboration Notice */}
              <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm text-emerald-700 dark:text-emerald-300">
                  Live collaboration active! Watch for colored badges on cells showing who's editing in real time.
                </span>
                <div className="ml-auto flex -space-x-1">
                  <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-background flex items-center justify-center text-white text-[10px] font-medium">EJ</div>
                  <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center text-white text-[10px] font-medium">MC</div>
                  <div className="w-6 h-6 rounded-full bg-purple-500 border-2 border-background flex items-center justify-center text-white text-[10px] font-medium">LT</div>
                </div>
              </div>

              {/* Factors Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="w-10 p-3 text-left">
                        <Checkbox />
                      </th>
                      <th className="p-3 text-left text-sm font-medium">Factor & Description</th>
                      <th className="p-3 text-left text-sm font-medium w-32">Rating</th>
                      <th className="p-3 text-left text-sm font-medium">Comments</th>
                      {showWeights && (
                        <th className="p-3 text-left text-sm font-medium w-32">Factor Weightage (%)</th>
                      )}
                      <th className="p-3 text-left text-sm font-medium w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inherentFactors.map((factor) => (
                      <tr key={factor.id} className="border-t hover:bg-muted/30">
                        <td className="p-3">
                          <Checkbox />
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{factor.name}</div>
                          <div className="text-sm text-muted-foreground">{factor.description}</div>
                        </td>
                        <td className="p-3">
                          <Select 
                            value={factor.rating.toString()} 
                            onValueChange={(v) => updateFactorRating(inherentFactors, setInherentFactors, factor.id, parseInt(v))}
                          >
                            <SelectTrigger className="w-full bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background border shadow-lg z-50">
                              <SelectItem value="1">Very Low (1)</SelectItem>
                              <SelectItem value="2">Low (2)</SelectItem>
                              <SelectItem value="3">Medium (3)</SelectItem>
                              <SelectItem value="4">High (4)</SelectItem>
                              <SelectItem value="5">Very High (5)</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-3">
                          <Textarea 
                            value={factor.comments}
                            onChange={(e) => updateFactorComment(inherentFactors, setInherentFactors, factor.id, e.target.value)}
                            className="min-h-[60px] resize-none"
                          />
                        </td>
                        {showWeights && (
                          <td className="p-3 text-center font-medium">{factor.weightage}</td>
                        )}
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button variant="outline" className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Add Row
              </Button>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" className="gap-2" disabled>
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setActiveTab("control-effectiveness")}>
                Continue to Control Effectiveness
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Control Effectiveness Tab */}
          <TabsContent value="control-effectiveness" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">Control Effectiveness Assessment</h2>
                  <p className="text-sm text-muted-foreground">Evaluate design, operating effectiveness, and testing results</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 rounded-lg ${getRatingLabel(controlScore).color} text-white`}>
                    <div className="text-xs opacity-90">Score: {controlScore}</div>
                    <div className="font-semibold">{getRatingLabel(controlScore).label}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Rate controls based on design effectiveness, operating effectiveness, and testing results
                </p>
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white gap-2"
                  onClick={handleAiAutofill}
                  disabled={isAiLoading}
                >
                  <Sparkles className="w-4 h-4" />
                  {isAiLoading ? "Analyzing..." : "AI Autofill All"}
                </Button>
              </div>

              {/* Collaboration Notice */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Live collaboration active! Watch for colored badges on cells showing who's editing in real time.
                </span>
              </div>

              {/* Controls Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="w-10 p-3 text-left">
                        <Checkbox />
                      </th>
                      <th className="p-3 text-left text-sm font-medium">Control ID</th>
                      <th className="p-3 text-left text-sm font-medium">Control Name</th>
                      <th className="p-3 text-left text-sm font-medium">Type</th>
                      <th className="p-3 text-left text-sm font-medium">Owner</th>
                      <th className="p-3 text-left text-sm font-medium w-28">Design</th>
                      <th className="p-3 text-left text-sm font-medium w-28">Operating</th>
                      <th className="p-3 text-left text-sm font-medium w-28">Testing</th>
                      <th className="p-3 text-left text-sm font-medium w-20">Avg</th>
                      <th className="p-3 text-left text-sm font-medium w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {controls.map((control) => {
                      const avg = ((control.designRating + control.operatingRating + control.testingRating) / 3).toFixed(1);
                      return (
                        <tr key={control.id} className="border-t hover:bg-muted/30">
                          <td className="p-3">
                            <Checkbox />
                          </td>
                          <td className="p-3 font-mono text-sm text-blue-600">{control.id}</td>
                          <td className="p-3 font-medium">{control.name}</td>
                          <td className="p-3">
                            <Badge variant="outline" className={control.type === "Preventive" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}>
                              {control.type}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">{control.owner}</td>
                          <td className="p-3">
                            <Select 
                              value={control.designRating.toString()} 
                              onValueChange={(v) => updateControlRating(control.id, 'designRating', parseInt(v))}
                            >
                              <SelectTrigger className="w-full bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-background border shadow-lg z-50">
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                                <SelectItem value="5">5</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3">
                            <Select 
                              value={control.operatingRating.toString()} 
                              onValueChange={(v) => updateControlRating(control.id, 'operatingRating', parseInt(v))}
                            >
                              <SelectTrigger className="w-full bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-background border shadow-lg z-50">
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                                <SelectItem value="5">5</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3">
                            <Select 
                              value={control.testingRating.toString()} 
                              onValueChange={(v) => updateControlRating(control.id, 'testingRating', parseInt(v))}
                            >
                              <SelectTrigger className="w-full bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-background border shadow-lg z-50">
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                                <SelectItem value="5">5</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3">
                            <Badge className={`${getRatingLabel(parseFloat(avg)).color} text-white`}>
                              {avg}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Button variant="outline" className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Add Control
              </Button>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" className="gap-2" onClick={() => setActiveTab("inherent-rating")}>
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => setActiveTab("residual-rating")}>
                Continue to Residual Rating
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Residual Rating Tab */}
          <TabsContent value="residual-rating" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">Residual Risk Rating</h2>
                  <p className="text-sm text-muted-foreground">Risk rating after applying controls</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 rounded-lg ${getRatingLabel(residualScore).color} text-white`}>
                    <div className="text-xs opacity-90">Score: {residualScore}</div>
                    <div className="font-semibold">{getRatingLabel(residualScore).label}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Assess residual risk factors after control mitigation
                </p>
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white gap-2"
                  onClick={handleAiAutofill}
                  disabled={isAiLoading}
                >
                  <Sparkles className="w-4 h-4" />
                  {isAiLoading ? "Analyzing..." : "AI Autofill All"}
                </Button>
              </div>

              {/* Factors Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="w-10 p-3 text-left">
                        <Checkbox />
                      </th>
                      <th className="p-3 text-left text-sm font-medium">Factor & Description</th>
                      <th className="p-3 text-left text-sm font-medium w-32">Rating</th>
                      <th className="p-3 text-left text-sm font-medium">Comments</th>
                      {showWeights && (
                        <th className="p-3 text-left text-sm font-medium w-32">Factor Weightage (%)</th>
                      )}
                      <th className="p-3 text-left text-sm font-medium w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {residualFactors.map((factor) => (
                      <tr key={factor.id} className="border-t hover:bg-muted/30">
                        <td className="p-3">
                          <Checkbox />
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{factor.name}</div>
                          <div className="text-sm text-muted-foreground">{factor.description}</div>
                        </td>
                        <td className="p-3">
                          <Select 
                            value={factor.rating.toString()} 
                            onValueChange={(v) => updateFactorRating(residualFactors, setResidualFactors, factor.id, parseInt(v))}
                          >
                            <SelectTrigger className="w-full bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background border shadow-lg z-50">
                              <SelectItem value="1">Very Low (1)</SelectItem>
                              <SelectItem value="2">Low (2)</SelectItem>
                              <SelectItem value="3">Medium (3)</SelectItem>
                              <SelectItem value="4">High (4)</SelectItem>
                              <SelectItem value="5">Very High (5)</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-3">
                          <Textarea 
                            value={factor.comments}
                            onChange={(e) => updateFactorComment(residualFactors, setResidualFactors, factor.id, e.target.value)}
                            className="min-h-[60px] resize-none"
                          />
                        </td>
                        {showWeights && (
                          <td className="p-3 text-center font-medium">{factor.weightage}</td>
                        )}
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button variant="outline" className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Add Row
              </Button>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" className="gap-2" onClick={() => setActiveTab("control-effectiveness")}>
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button className="gap-2 bg-purple-600 hover:bg-purple-700" onClick={() => setActiveTab("heat-map")}>
                View Heat Map
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Heat Map Tab */}
          <TabsContent value="heat-map" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Risk Heat Map</h2>
              <div className="grid grid-cols-5 gap-1 max-w-md">
                {[5, 4, 3, 2, 1].map((impact) => (
                  <div key={impact} className="contents">
                    {[1, 2, 3, 4, 5].map((likelihood) => {
                      const score = impact * likelihood;
                      let bgColor = "bg-emerald-200";
                      if (score > 15) bgColor = "bg-red-500";
                      else if (score > 10) bgColor = "bg-orange-400";
                      else if (score > 5) bgColor = "bg-yellow-300";
                      
                      const isCurrentInherent = Math.round(inherentScore) === likelihood && impact === Math.round(inherentScore);
                      const isCurrentResidual = Math.round(residualScore) === likelihood && impact === Math.round(residualScore);
                      
                      return (
                        <div 
                          key={`${impact}-${likelihood}`} 
                          className={`aspect-square ${bgColor} rounded flex items-center justify-center text-xs font-medium relative`}
                        >
                          {score}
                          {isCurrentInherent && (
                            <div className="absolute inset-0 border-2 border-orange-600 rounded" />
                          )}
                          {isCurrentResidual && (
                            <div className="absolute inset-0 border-2 border-emerald-600 rounded" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-orange-600 rounded" />
                  <span>Inherent Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-emerald-600 rounded" />
                  <span>Residual Risk</span>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Issues Tab */}
          <TabsContent value="issues" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Related Issues</h2>
              <p className="text-muted-foreground">5 issues linked to this risk assessment</p>
              {/* Placeholder for issues list */}
              <div className="mt-4 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/30">
                    <div>
                      <div className="font-medium">Issue ISS-{1000 + i}</div>
                      <div className="text-sm text-muted-foreground">Sample issue description</div>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700">Open</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom Tabs */}
        <div className="mt-8 border-t pt-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">Previous Assessments</Button>
            <Button variant="ghost" size="sm">Review & Challenge</Button>
            <Button variant="ghost" size="sm">Treatment</Button>
            <Button variant="ghost" size="sm">Metrics & Losses</Button>
            <Button variant="ghost" size="sm">Additional Details</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskAssessmentForm;
