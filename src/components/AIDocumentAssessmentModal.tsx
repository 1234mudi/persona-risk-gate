import { useState, useCallback, useMemo } from "react";
import { Upload, FileText, Sparkles, X, AlertCircle, CheckCircle, Loader2, Plus, Pencil, Trash2, ArrowRight } from "lucide-react";
import mammoth from "mammoth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ParsedRisk {
  id: string;
  title: string;
  riskLevel1: string;
  riskLevel2: string;
  riskLevel3: string;
  level: string;
  businessUnit: string;
  category: string;
  owner: string;
  assessor: string;
  inherentRisk: string;
  inherentTrend: string;
  controls: string;
  effectiveness: string;
  testResults: string;
  residualRisk: string;
  residualTrend: string;
  status: string;
  lastAssessed: string;
}

interface ExistingRisk {
  id: string;
  title: string;
  businessUnit?: string;
  category?: string;
  owner?: string;
  inherentRisk?: string;
  residualRisk?: string;
  status?: string;
}

interface AIDocumentAssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRisksImported: (risks: ParsedRisk[]) => void;
  existingRisks?: ExistingRisk[];
}

export function AIDocumentAssessmentModal({ 
  open, 
  onOpenChange,
  onRisksImported,
  existingRisks = []
}: AIDocumentAssessmentModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedRisks, setParsedRisks] = useState<ParsedRisk[]>([]);
  const [step, setStep] = useState<"upload" | "processing" | "review">("upload");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Create a map of existing risk IDs for quick lookup
  const existingRiskMap = useMemo(() => {
    const map = new Map<string, ExistingRisk>();
    existingRisks.forEach(risk => map.set(risk.id, risk));
    return map;
  }, [existingRisks]);

  // Determine if a risk is new or modified
  const getRiskStatus = (risk: ParsedRisk): "new" | "modified" | "unchanged" => {
    const existing = existingRiskMap.get(risk.id);
    if (!existing) return "new";
    // Check if any field is different
    if (existing.title !== risk.title ||
        existing.businessUnit !== risk.businessUnit ||
        existing.category !== risk.category ||
        existing.owner !== risk.owner ||
        existing.inherentRisk !== risk.inherentRisk ||
        existing.residualRisk !== risk.residualRisk ||
        existing.status !== risk.status) {
      return "modified";
    }
    return "unchanged";
  };

  // Check if a specific field is modified
  const isFieldModified = (risk: ParsedRisk, field: keyof ParsedRisk): boolean => {
    const existing = existingRiskMap.get(risk.id);
    if (!existing) return false; // New risks don't show as modified
    const existingValue = existing[field as keyof ExistingRisk];
    return existingValue !== undefined && existingValue !== risk[field];
  };

  // Get the original value for a field
  const getOriginalValue = (risk: ParsedRisk, field: keyof ParsedRisk): string | undefined => {
    const existing = existingRiskMap.get(risk.id);
    if (!existing) return undefined;
    return existing[field as keyof ExistingRisk];
  };

  // Render a field with change indicator
  const renderModifiedField = (
    risk: ParsedRisk, 
    field: keyof ParsedRisk, 
    children: React.ReactNode
  ) => {
    const isModified = isFieldModified(risk, field);
    const originalValue = getOriginalValue(risk, field);
    
    if (!isModified) return children;
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            {children}
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground line-through">{originalValue || '(empty)'}</span>
            <ArrowRight className="w-3 h-3 text-amber-500" />
            <span className="text-foreground font-medium">{risk[field] || '(empty)'}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  const acceptedTypes = [
    "text/csv",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".csv",
    ".docx"
  ];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext === 'csv' || ext === 'docx';
    });
    
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
    } else {
      toast.error("Please upload CSV or DOCX files only");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const parseCSV = (content: string): ParsedRisk[] => {
    console.log("CSV content length:", content.length);
    console.log("CSV preview:", content.substring(0, 500));
    
    // Normalize line endings (handle Windows \r\n, old Mac \r, and Unix \n)
    const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedContent.split('\n').filter(line => line.trim() !== '');
    
    console.log("Total lines found:", lines.length);
    if (lines.length < 2) {
      console.log("Not enough lines in CSV");
      return [];
    }
    
    // Log header to verify column structure
    console.log("CSV Header:", lines[0]);
    
    const risks: ParsedRisk[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Handle CSV with quoted fields
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      console.log(`Line ${i}: parsed ${values.length} columns`);
      
      // Be more lenient - accept rows with at least 10 columns
      if (values.length >= 10) {
        risks.push({
          id: values[0] || `R-${String(i).padStart(3, '0')}`,
          title: values[1] || '',
          riskLevel1: values[2] || '',
          riskLevel2: values[3] || '',
          riskLevel3: values[4] || '',
          level: values[5] || '',
          businessUnit: values[6] || '',
          category: values[7] || '',
          owner: values[8] || '',
          assessor: values[9] || '',
          inherentRisk: values[10] || '',
          inherentTrend: values[11] || '',
          controls: values[12] || '',
          effectiveness: values[13] || '',
          testResults: values[14] || '',
          residualRisk: values[15] || '',
          residualTrend: values[16] || '',
          status: values[17] || 'Sent for Assessment',
          lastAssessed: values[18] || new Date().toLocaleDateString(),
        });
      }
    }
    
    console.log("Total risks parsed:", risks.length);
    return risks;
  };

  const parseDOCX = async (file: File): Promise<ParsedRisk[]> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;
      
      console.log("DOCX text extracted, length:", text.length);

      const risks: ParsedRisk[] = [];
      const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
      
      console.log("DOCX lines found:", lines.length);
      
      // The DOCX table is extracted with each cell on a separate line
      // Find where data starts (after header row which has "Risk ID", "Title", etc.)
      const headerFields = ['Risk ID', 'Title', 'Risk Level 1', 'Risk Level 2', 'Risk Level 3', 
                           'Level', 'Business Unit', 'Category', 'Owner', 'Assessor',
                           'Inherent Risk', 'Inherent Trend', 'Controls', 'Effectiveness',
                           'Test Results', 'Residual Risk', 'Residual Trend', 'Status', 'Last Assessed'];
      
      // Find the start of data (after "Last Assessed" header)
      let dataStartIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i] === 'Last Assessed') {
          dataStartIndex = i + 1;
          break;
        }
      }
      
      if (dataStartIndex === -1) {
        console.log("Could not find header row, trying to find R-001 pattern");
        // Fallback: find first R-XXX pattern
        for (let i = 0; i < lines.length; i++) {
          if (/^R-\d{3}$/.test(lines[i])) {
            dataStartIndex = i;
            break;
          }
        }
      }
      
      console.log("Data starts at line:", dataStartIndex);
      
      if (dataStartIndex === -1) {
        console.log("Could not find data start");
        return [];
      }
      
      // Each risk record has 19 fields, but controls might span multiple lines
      // Group lines into records - each record starts with R-XXX pattern
      const riskIdPattern = /^R-\d{3}$/;
      let currentRecord: string[] = [];
      
      for (let i = dataStartIndex; i < lines.length; i++) {
        const line = lines[i];
        
        // If we hit a new Risk ID and we have a current record, save it
        if (riskIdPattern.test(line) && currentRecord.length > 0) {
          // Process the completed record
          const risk = parseRecordToRisk(currentRecord);
          if (risk) risks.push(risk);
          currentRecord = [line];
        } else {
          currentRecord.push(line);
        }
      }
      
      // Don't forget the last record
      if (currentRecord.length > 0) {
        const risk = parseRecordToRisk(currentRecord);
        if (risk) risks.push(risk);
      }
      
      console.log("Total DOCX risks parsed:", risks.length);
      return risks;
    } catch (error) {
      console.error("Error parsing DOCX:", error);
      throw error;
    }
  };

  const parseRecordToRisk = (lines: string[]): ParsedRisk | null => {
    if (lines.length < 10) return null;
    
    // Expected order: Risk ID, Title, Risk Level 1-3, Level, Business Unit, Category,
    // Owner, Assessor, Inherent Risk, Inherent Trend, Controls, Effectiveness,
    // Test Results, Residual Risk, Residual Trend, Status, Last Assessed
    
    return {
      id: lines[0] || '',
      title: lines[1] || '',
      riskLevel1: lines[2] || '',
      riskLevel2: lines[3] || '',
      riskLevel3: lines[4] || '',
      level: lines[5] || '',
      businessUnit: lines[6] || '',
      category: lines[7] || '',
      owner: lines[8] || '',
      assessor: lines[9] || '',
      inherentRisk: lines[10] || 'Medium',
      inherentTrend: lines[11] || '',
      controls: lines[12] || '',
      effectiveness: lines[13] || '',
      testResults: lines[14] || '',
      residualRisk: lines[15] || 'Low',
      residualTrend: lines[16] || '',
      status: lines[17] || 'Sent for Assessment',
      lastAssessed: lines[18] || new Date().toLocaleDateString(),
    };
  };

  const processFiles = async () => {
    if (files.length === 0) {
      toast.error("Please upload at least one file");
      return;
    }

    setStep("processing");
    setIsProcessing(true);
    setProgress(0);

    const allRisks: ParsedRisk[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase();

      try {
        if (ext === 'csv') {
          const content = await file.text();
          const risks = parseCSV(content);
          allRisks.push(...risks);
        } else if (ext === 'docx') {
          toast.info(`Processing ${file.name}...`);
          const risks = await parseDOCX(file);
          allRisks.push(...risks);
          if (risks.length > 0) {
            toast.success(`Extracted ${risks.length} risks from ${file.name}`);
          }
        }
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        toast.error(`Failed to process ${file.name}`);
      }

      setProgress(((i + 1) / totalFiles) * 100);
    }

    // Simulate AI enhancement delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setParsedRisks(allRisks);
    setIsProcessing(false);
    setStep("review");

    if (allRisks.length > 0) {
      toast.success(`Successfully parsed ${allRisks.length} risk assessments`);
    } else {
      toast.warning("No risks found in the uploaded files");
    }
  };

  const handleImport = () => {
    if (parsedRisks.length > 0) {
      onRisksImported(parsedRisks);
      toast.success(`Imported ${parsedRisks.length} risk assessments`);
      handleClose();
    }
  };

  const handleClose = () => {
    setFiles([]);
    setParsedRisks([]);
    setStep("upload");
    setProgress(0);
    setIsProcessing(false);
    setEditingIndex(null);
    onOpenChange(false);
  };

  const getRiskLevelColor = (risk: string) => {
    if (risk.toLowerCase().includes('high')) return 'bg-destructive/20 text-destructive';
    if (risk.toLowerCase().includes('medium')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
  };

  const getStatusBadge = (status: "new" | "modified" | "unchanged") => {
    switch (status) {
      case "new":
        return <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30"><Plus className="w-3 h-3 mr-1" />New</Badge>;
      case "modified":
        return <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30"><Pencil className="w-3 h-3 mr-1" />Modified</Badge>;
      default:
        return null;
    }
  };

  const updateRisk = (index: number, field: keyof ParsedRisk, value: string) => {
    setParsedRisks(prev => prev.map((risk, i) => 
      i === index ? { ...risk, [field]: value } : risk
    ));
  };

  const deleteRisk = (index: number) => {
    setParsedRisks(prev => prev.filter((_, i) => i !== index));
    toast.success("Risk removed from import list");
  };

  // Count new vs modified
  const riskCounts = useMemo(() => {
    let newCount = 0;
    let modifiedCount = 0;
    parsedRisks.forEach(risk => {
      const status = getRiskStatus(risk);
      if (status === "new") newCount++;
      else if (status === "modified") modifiedCount++;
    });
    return { newCount, modifiedCount };
  }, [parsedRisks, existingRiskMap]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] w-[1400px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-first-line" />
            Assess Documents with AI
          </DialogTitle>
          <DialogDescription>
            Upload CSV or DOCX files containing risk data. AI will parse and create risk assessments automatically.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="flex-1 space-y-4">
            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging 
                  ? 'border-first-line bg-first-line/5' 
                  : 'border-border hover:border-first-line/50'
              }`}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                Drag and drop files here
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Supports CSV and DOCX files
              </p>
              <label>
                <input
                  type="file"
                  accept=".csv,.docx"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>Browse Files</span>
                </Button>
              </label>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Selected Files ({files.length})</h4>
                <div className="space-y-2 max-h-40 overflow-auto">
                  {files.map((file, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-first-line" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === "processing" && (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-first-line animate-spin mb-4" />
            <p className="text-lg font-medium mb-2">Processing Documents...</p>
            <p className="text-sm text-muted-foreground mb-6">
              AI is analyzing and extracting risk assessments
            </p>
            <div className="w-64">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground mt-2">
                {Math.round(progress)}% complete
              </p>
            </div>
          </div>
        )}

        {step === "review" && (
          <TooltipProvider delayDuration={100}>
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              {/* Summary Header */}
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-medium">
                      {parsedRisks.length} Risk Assessments Found
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">
                      <Plus className="w-3 h-3 mr-1" />{riskCounts.newCount} New
                    </Badge>
                    <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30">
                      <Pencil className="w-3 h-3 mr-1" />{riskCounts.modifiedCount} Modified
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    <span>Changed field (hover for details)</span>
                  </div>
                  <Badge variant="outline">
                    Click any cell to edit
                  </Badge>
                </div>
              </div>

              {/* Editable Table */}
              <div className="border rounded-lg overflow-hidden">
                <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-[70px]">Status</TableHead>
                      <TableHead className="w-[90px] whitespace-nowrap">Risk ID</TableHead>
                      <TableHead className="min-w-[280px]">Title</TableHead>
                      <TableHead className="w-[140px]">Business Unit</TableHead>
                      <TableHead className="w-[120px]">Category</TableHead>
                      <TableHead className="w-[120px]">Owner</TableHead>
                      <TableHead className="w-[110px]">Inherent Risk</TableHead>
                      <TableHead className="w-[110px]">Residual Risk</TableHead>
                      <TableHead className="w-[130px]">Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRisks.map((risk, index) => {
                      const riskStatus = getRiskStatus(risk);
                      const isEditing = editingIndex === index;
                      
                      return (
                        <TableRow 
                          key={index}
                          className={`
                            ${riskStatus === "new" ? "bg-green-500/5 hover:bg-green-500/10" : ""}
                            ${riskStatus === "modified" ? "bg-blue-500/5 hover:bg-blue-500/10" : ""}
                          `}
                        >
                          <TableCell className="py-2">
                            {getStatusBadge(riskStatus)}
                          </TableCell>
                          <TableCell className="py-2 font-mono text-xs whitespace-nowrap">
                            <Input
                              value={risk.id}
                              onChange={(e) => updateRisk(index, 'id', e.target.value)}
                              className="h-7 text-xs px-2 w-[75px]"
                            />
                          </TableCell>
                          <TableCell className="py-2">
                            {renderModifiedField(risk, 'title',
                              <Input
                                value={risk.title}
                                onChange={(e) => updateRisk(index, 'title', e.target.value)}
                                className={`h-7 text-xs px-2 ${isFieldModified(risk, 'title') ? 'ring-2 ring-amber-500 bg-amber-500/10' : ''}`}
                              />
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            {renderModifiedField(risk, 'businessUnit',
                              <Input
                                value={risk.businessUnit}
                                onChange={(e) => updateRisk(index, 'businessUnit', e.target.value)}
                                className={`h-7 text-xs px-2 ${isFieldModified(risk, 'businessUnit') ? 'ring-2 ring-amber-500 bg-amber-500/10' : ''}`}
                              />
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            {renderModifiedField(risk, 'category',
                              <Input
                                value={risk.category}
                                onChange={(e) => updateRisk(index, 'category', e.target.value)}
                                className={`h-7 text-xs px-2 ${isFieldModified(risk, 'category') ? 'ring-2 ring-amber-500 bg-amber-500/10' : ''}`}
                              />
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            {renderModifiedField(risk, 'owner',
                              <Input
                                value={risk.owner}
                                onChange={(e) => updateRisk(index, 'owner', e.target.value)}
                                className={`h-7 text-xs px-2 ${isFieldModified(risk, 'owner') ? 'ring-2 ring-amber-500 bg-amber-500/10' : ''}`}
                              />
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            {renderModifiedField(risk, 'inherentRisk',
                              <Select
                                value={risk.inherentRisk.toLowerCase().includes('high') ? 'High' : 
                                       risk.inherentRisk.toLowerCase().includes('medium') ? 'Medium' : 'Low'}
                                onValueChange={(value) => updateRisk(index, 'inherentRisk', value)}
                              >
                                <SelectTrigger className={`h-7 text-xs ${isFieldModified(risk, 'inherentRisk') ? 'ring-2 ring-amber-500 bg-amber-500/10' : ''}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="High">High</SelectItem>
                                  <SelectItem value="Medium">Medium</SelectItem>
                                  <SelectItem value="Low">Low</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            {renderModifiedField(risk, 'residualRisk',
                              <Select
                                value={risk.residualRisk.toLowerCase().includes('high') ? 'High' : 
                                       risk.residualRisk.toLowerCase().includes('medium') ? 'Medium' : 'Low'}
                                onValueChange={(value) => updateRisk(index, 'residualRisk', value)}
                              >
                                <SelectTrigger className={`h-7 text-xs ${isFieldModified(risk, 'residualRisk') ? 'ring-2 ring-amber-500 bg-amber-500/10' : ''}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="High">High</SelectItem>
                                  <SelectItem value="Medium">Medium</SelectItem>
                                  <SelectItem value="Low">Low</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            {renderModifiedField(risk, 'status',
                              <Select
                                value={risk.status}
                                onValueChange={(value) => updateRisk(index, 'status', value)}
                              >
                                <SelectTrigger className={`h-7 text-xs ${isFieldModified(risk, 'status') ? 'ring-2 ring-amber-500 bg-amber-500/10' : ''}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Sent for Assessment">Sent for Assessment</SelectItem>
                                  <SelectItem value="In Progress">In Progress</SelectItem>
                                  <SelectItem value="Completed">Completed</SelectItem>
                                  <SelectItem value="Overdue">Overdue</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => deleteRisk(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
          </TooltipProvider>
        )}

        <DialogFooter className="mt-4">
          {step === "upload" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={processFiles}
                disabled={files.length === 0}
                className="bg-gradient-to-r from-first-line to-emerald-600 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Process with AI
              </Button>
            </>
          )}
          {step === "review" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button 
                onClick={handleImport}
                disabled={parsedRisks.length === 0}
                className="bg-gradient-to-r from-first-line to-emerald-600 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Import {parsedRisks.length} Assessments
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
