import React, { useState, useCallback, useMemo } from "react";
import { Upload, FileText, Sparkles, X, AlertCircle, CheckCircle, Loader2, Plus, Pencil, Trash2, ArrowRight, ChevronDown, ChevronUp, Search, Filter } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";

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
  sourceFile?: string;
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
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "modified">("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

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
    
    // Parse header to determine column positions dynamically
    const headerLine = lines[0];
    const headers: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < headerLine.length; j++) {
      const char = headerLine[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        headers.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    headers.push(current.trim());
    
    console.log("CSV Headers:", headers);
    
    // Create a column index map
    const colIndex = (name: string): number => headers.findIndex(h => h.toLowerCase() === name.toLowerCase());
    
    const risks: ParsedRisk[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Handle CSV with quoted fields
      const values: string[] = [];
      current = '';
      inQuotes = false;
      
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
      
      // Get value by column name or index fallback
      const getVal = (name: string, fallbackIdx: number): string => {
        const idx = colIndex(name);
        return idx >= 0 ? (values[idx] || '') : (values[fallbackIdx] || '');
      };
      
      // Accept rows with at least 10 columns
      if (values.length >= 10) {
        risks.push({
          id: getVal('Risk ID', 0) || `R-${String(i).padStart(3, '0')}`,
          title: getVal('Title', 1),
          riskLevel1: getVal('Risk Level 1', -1),
          riskLevel2: getVal('Risk Level 2', -1),
          riskLevel3: getVal('Risk Level 3', -1),
          level: getVal('Level', 2),
          businessUnit: getVal('Business Unit', -1),
          category: getVal('Category', 3),
          owner: getVal('Owner', 4),
          assessor: getVal('Assessor', 5),
          inherentRisk: getVal('Inherent Risk', 6),
          inherentTrend: getVal('Inherent Trend', 7),
          controls: getVal('Controls', 8),
          effectiveness: getVal('Effectiveness', 9),
          testResults: getVal('Test Results', 10),
          residualRisk: getVal('Residual Risk', 11),
          residualTrend: getVal('Residual Trend', 12),
          status: getVal('Status', 13) || 'Sent for Assessment',
          lastAssessed: getVal('Last Assessed', 14) || new Date().toLocaleDateString(),
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
      
      // Build header map - find all header names and their order
      const possibleHeaders = [
        'Risk ID', 'Title', 'Risk Hierarchy', 'Risk Level 1', 'Risk Level 2', 'Risk Level 3', 
        'Level', 'Business Unit', 'Category', 'Owner', 'Assessor', 'Assessors/Collaborators',
        'Inherent Risk', 'Inherent Trend', 'Controls', 'Effectiveness',
        'Test Results', 'Residual Risk', 'Residual Trend', 'Status', 'Last Assessed'
      ];
      
      // Find headers in the document and their positions
      const headerMap: { name: string; index: number }[] = [];
      let lastHeaderIndex = -1;
      
      for (let i = 0; i < Math.min(lines.length, 50); i++) {
        const line = lines[i];
        if (possibleHeaders.includes(line)) {
          headerMap.push({ name: line, index: i });
          lastHeaderIndex = i;
          console.log(`Found header "${line}" at line ${i}`);
        }
      }
      
      console.log("Headers found:", headerMap.map(h => h.name));
      
      // Find the start of data (after the last header)
      let dataStartIndex = lastHeaderIndex + 1;
      
      if (dataStartIndex <= 0) {
        console.log("Could not find headers, trying to find R-XX or Event pattern");
        // Fallback: find first R-XX, R-XXX, Event, or number pattern
        for (let i = 0; i < lines.length; i++) {
          if (/^(R-\d{2,3}|Event\s*\d+|\d{1,3})$/i.test(lines[i])) {
            dataStartIndex = i;
            break;
          }
        }
      }
      
      console.log("Data starts at line:", dataStartIndex);
      
      if (dataStartIndex <= 0) {
        console.log("Could not find data start");
        return [];
      }
      
      // Determine number of fields per record based on headers found
      const numFields = headerMap.length > 0 ? headerMap.length : 19;
      console.log("Expected fields per record:", numFields);
      
      // Group lines into records - accept R-XX, R-XXX, Event numbers, or just numbers
      const riskIdPattern = /^(R-\d{2,3}|Event\s*\d+|\d{1,3})$/i;
      let currentRecord: string[] = [];
      let eventCounter = 1;
      
      for (let i = dataStartIndex; i < lines.length; i++) {
        const line = lines[i];
        
        // If we hit a new Risk ID/Event and we have a current record, save it
        if (riskIdPattern.test(line) && currentRecord.length > 0) {
          // Process the completed record
          const risk = parseRecordToRisk(currentRecord, headerMap);
          if (risk) {
            // Generate unique ID if duplicate or generic
            if (!risk.id || risk.id === 'R-00' || risks.some(r => r.id === risk.id)) {
              risk.id = `EVENT-${String(eventCounter).padStart(3, '0')}`;
            }
            risks.push(risk);
            eventCounter++;
          }
          currentRecord = [line];
        } else {
          currentRecord.push(line);
        }
      }
      
      // Don't forget the last record
      if (currentRecord.length > 0) {
        const risk = parseRecordToRisk(currentRecord, headerMap);
        if (risk) {
          if (!risk.id || risk.id === 'R-00' || risks.some(r => r.id === risk.id)) {
            risk.id = `EVENT-${String(eventCounter).padStart(3, '0')}`;
          }
          risks.push(risk);
        }
      }
      
      console.log("Total DOCX risks parsed:", risks.length);
      console.log("Sample parsed risks:", risks.slice(0, 5).map(r => ({ id: r.id, title: r.title })));
      return risks;
    } catch (error) {
      console.error("Error parsing DOCX:", error);
      throw error;
    }
  };

  const parseRecordToRisk = (lines: string[], headerMap: { name: string; index: number }[] = []): ParsedRisk | null => {
    // Be more lenient - accept records with at least 5 fields
    if (lines.length < 5) return null;
    
    // Create a lookup for field positions based on header order
    const headerNames = headerMap.map(h => h.name);
    
    // Helper to get field value by header name - use position in header array
    const getField = (primaryName: string, altName: string | null = null): string => {
      const primaryIdx = headerNames.indexOf(primaryName);
      if (primaryIdx !== -1 && lines[primaryIdx] !== undefined) {
        return lines[primaryIdx];
      }
      if (altName) {
        const altIdx = headerNames.indexOf(altName);
        if (altIdx !== -1 && lines[altIdx] !== undefined) {
          return lines[altIdx];
        }
      }
      return '';
    };
    
    // Build risk object using header-based lookups
    // Lines[0] is always the Risk ID
    return {
      id: lines[0] || '',
      title: getField('Title') || lines[1] || '',
      riskLevel1: getField('Risk Level 1'),
      riskLevel2: getField('Risk Level 2'),
      riskLevel3: getField('Risk Level 3'),
      level: getField('Level') || '',
      businessUnit: getField('Business Unit'),
      category: getField('Category') || '',
      owner: getField('Owner') || '',
      assessor: getField('Assessor') || getField('Assessors/Collaborators') || '',
      inherentRisk: getField('Inherent Risk') || 'Medium',
      inherentTrend: getField('Inherent Trend') || '',
      controls: getField('Controls') || '',
      effectiveness: getField('Effectiveness') || '',
      testResults: getField('Test Results') || '',
      residualRisk: getField('Residual Risk') || 'Low',
      residualTrend: getField('Residual Trend') || '',
      status: getField('Status') || 'Sent for Assessment',
      lastAssessed: getField('Last Assessed') || new Date().toLocaleDateString(),
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
          const risks = parseCSV(content).map(r => ({ ...r, sourceFile: file.name }));
          allRisks.push(...risks);
        } else if (ext === 'docx') {
          toast.info(`Processing ${file.name}...`);
          const risks = (await parseDOCX(file)).map(r => ({ ...r, sourceFile: file.name }));
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
      // Import ALL parsed risks - let the dashboard handle deduplication
      console.log("Importing all parsed risks:", parsedRisks.length);
      console.log("Sample risks:", parsedRisks.slice(0, 5).map(r => ({ id: r.id, title: r.title, level: r.level })));
      
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

  // State for showing field highlights
  const [showHighlights, setShowHighlights] = useState(true);

  // Helper to get input styling based on field value
  const getFieldInputClass = (value: string | undefined): string => {
    if (!showHighlights) return '';
    if (!value || value === '' || value === 'N/A' || value === 'Unknown') {
      return 'ring-1 ring-amber-300/50 bg-amber-50/30 dark:bg-amber-900/10 border-amber-300/50';
    }
    return 'ring-1 ring-emerald-300/40 bg-emerald-50/20 dark:bg-emerald-900/10 border-emerald-300/40';
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

  // Get unique source files
  const sourceFiles = useMemo(() => {
    const files = new Set<string>();
    parsedRisks.forEach(risk => {
      if (risk.sourceFile) files.add(risk.sourceFile);
    });
    return Array.from(files);
  }, [parsedRisks]);

  // Filtered risks
  const filteredRisks = useMemo(() => {
    return parsedRisks.filter(risk => {
      // Status filter
      if (statusFilter !== "all") {
        const riskStatus = getRiskStatus(risk);
        if (statusFilter === "new" && riskStatus !== "new") return false;
        if (statusFilter === "modified" && riskStatus !== "modified") return false;
      }
      
      // Source filter
      if (sourceFilter !== "all" && risk.sourceFile !== sourceFilter) return false;
      
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          risk.id.toLowerCase().includes(query) ||
          risk.title.toLowerCase().includes(query) ||
          risk.owner.toLowerCase().includes(query) ||
          risk.category.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [parsedRisks, statusFilter, sourceFilter, searchQuery, existingRiskMap]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none rounded-none overflow-hidden flex flex-col">
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
            {/* Full Drop Zone - shown when no files */}
            {files.length === 0 && (
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
            )}

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

                {/* Compact Drop Zone - below file list */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors ${
                    isDragging 
                      ? 'border-first-line bg-first-line/5' 
                      : 'border-border hover:border-first-line/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Drop more files or</span>
                    <label>
                      <input
                        type="file"
                        accept=".csv,.docx"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                        <span>Browse Files</span>
                      </Button>
                    </label>
                  </div>
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
                <div className="flex items-center gap-4">
                  {/* Highlight Toggle with Legend */}
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded border border-emerald-300/50 bg-emerald-50/30 dark:bg-emerald-900/20" />
                      <span className="text-muted-foreground">Has data</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded border border-amber-300/50 bg-amber-50/30 dark:bg-amber-900/20" />
                      <span className="text-muted-foreground">Missing</span>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Switch 
                        checked={showHighlights} 
                        onCheckedChange={setShowHighlights}
                        className="scale-75"
                      />
                      <span className="text-muted-foreground">Highlights</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filter Bar */}
              <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID, title, owner, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                {/* Status Filter Buttons */}
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Button
                    variant={statusFilter === "all" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter("all")}
                    className="h-7 px-3 text-xs"
                  >
                    All ({parsedRisks.length})
                  </Button>
                  <Button
                    variant={statusFilter === "new" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter("new")}
                    className="h-7 px-3 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    New ({riskCounts.newCount})
                  </Button>
                  <Button
                    variant={statusFilter === "modified" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter("modified")}
                    className="h-7 px-3 text-xs"
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Modified ({riskCounts.modifiedCount})
                  </Button>
                </div>

                {/* Source File Filter */}
                {sourceFiles.length > 1 && (
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-[200px] h-9">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="All Documents" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Documents</SelectItem>
                      {sourceFiles.map(file => (
                        <SelectItem key={file} value={file}>{file}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Results count */}
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  Showing {filteredRisks.length} of {parsedRisks.length}
                </span>
              </div>

              {/* Table View matching main dashboard */}
              <ScrollArea className="flex-1 min-h-0 border rounded-lg">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-16 py-2 border-r border-b border-border"></TableHead>
                      <TableHead className="w-20 py-2 border-r border-b border-border">Risk ID</TableHead>
                      <TableHead className="min-w-[250px] py-2 border-r border-b border-border">Risk Event/Owner</TableHead>
                      <TableHead className="w-32 py-2 border-r border-b border-border">Source</TableHead>
                      <TableHead className="w-32 py-2 border-r border-b border-border">Status</TableHead>
                      <TableHead className="w-32 py-2 border-r border-b border-border">Missing</TableHead>
                      <TableHead className="w-12 py-2 border-b border-border"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRisks.map((risk) => {
                      const originalIndex = parsedRisks.findIndex(r => r.id === risk.id && r.sourceFile === risk.sourceFile);
                      const riskStatus = getRiskStatus(risk);
                      const isExpanded = expandedIndex === originalIndex;
                      
                      // Calculate missing fields
                      const requiredFields = ['title', 'owner', 'category', 'inherentRisk', 'residualRisk', 'status', 'controls'];
                      const missingFields = requiredFields.filter(field => {
                        const value = risk[field as keyof ParsedRisk];
                        return !value || value === '' || value === 'N/A' || value === 'Unknown';
                      });
                      const missingCount = missingFields.length;
                      
                      return (
                        <React.Fragment key={originalIndex}>
                          <TableRow 
                            className={`cursor-pointer transition-colors
                              ${riskStatus === "new" ? "bg-green-500/5 hover:bg-green-500/10" : ""}
                              ${riskStatus === "modified" ? "bg-blue-500/5 hover:bg-blue-500/10" : ""}
                              ${riskStatus === "unchanged" ? "hover:bg-muted/50" : ""}
                              ${isExpanded ? "bg-first-line/10 border-l-2 border-l-first-line" : ""}
                            `}
                            onClick={() => setExpandedIndex(isExpanded ? null : originalIndex)}
                          >
                            {/* Status Badge */}
                            <TableCell className="py-2 border-r border-b border-border">
                              <div className="flex items-center gap-2">
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-first-line" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                {getStatusBadge(riskStatus)}
                              </div>
                            </TableCell>
                            
                            {/* Risk ID */}
                            <TableCell className="py-2 border-r border-b border-border">
                              <span className="font-mono text-sm text-muted-foreground">{risk.id}</span>
                            </TableCell>
                            
                            {/* Title and Owner */}
                            <TableCell className="py-2 border-r border-b border-border">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium text-foreground">{risk.title}</span>
                                <span className="text-xs text-muted-foreground">{risk.owner || 'No owner'}</span>
                              </div>
                            </TableCell>
                            
                            {/* Source File */}
                            <TableCell className="py-2 border-r border-b border-border">
                              <span className="text-xs text-muted-foreground truncate max-w-[120px] block" title={risk.sourceFile}>
                                {risk.sourceFile || '-'}
                              </span>
                            </TableCell>
                            
                            {/* Status */}
                            <TableCell className="py-2 border-r border-b border-border">
                              <Badge variant="outline" className="text-xs">
                                {risk.status}
                              </Badge>
                            </TableCell>
                            
                            {/* Missing Fields */}
                            <TableCell className="py-2 border-r border-b border-border">
                              {missingCount > 0 ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 cursor-help"
                                    >
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      {missingCount} missing
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="max-w-xs">
                                    <p className="text-xs font-medium mb-1">Missing fields:</p>
                                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                                      {missingFields.map(field => (
                                        <li key={field} className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</li>
                                      ))}
                                    </ul>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Complete
                                </Badge>
                              )}
                            </TableCell>
                            
                            {/* Delete Button */}
                            <TableCell className="py-2 border-b border-border">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteRisk(originalIndex);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          
                          {/* Inline Edit Row */}
                          {isExpanded && (
                            <TableRow className="bg-muted/30 border-l-2 border-l-first-line">
                              <TableCell colSpan={7} className="p-4" onClick={(e) => e.stopPropagation()}>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                                  {/* Risk ID */}
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Risk ID</label>
                                    <Input
                                      value={risk.id}
                                      onChange={(e) => updateRisk(originalIndex, 'id', e.target.value)}
                                      className={`h-8 text-sm ${getFieldInputClass(risk.id)}`}
                                    />
                                  </div>
                                  
                                  {/* Title */}
                                  <div className="space-y-1 col-span-2">
                                    <label className="text-xs font-medium text-muted-foreground">Title</label>
                                    <Input
                                      value={risk.title}
                                      onChange={(e) => updateRisk(originalIndex, 'title', e.target.value)}
                                      className={`h-8 text-sm ${getFieldInputClass(risk.title)}`}
                                    />
                                  </div>
                                  
                                  {/* Owner */}
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Owner</label>
                                    <Input
                                      value={risk.owner}
                                      onChange={(e) => updateRisk(originalIndex, 'owner', e.target.value)}
                                      className={`h-8 text-sm ${getFieldInputClass(risk.owner)}`}
                                    />
                                  </div>
                                  
                                  {/* Category */}
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Category</label>
                                    <Input
                                      value={risk.category}
                                      onChange={(e) => updateRisk(originalIndex, 'category', e.target.value)}
                                      className={`h-8 text-sm ${getFieldInputClass(risk.category)}`}
                                    />
                                  </div>
                                  
                                  {/* Controls */}
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Controls</label>
                                    <Input
                                      value={risk.controls}
                                      onChange={(e) => updateRisk(originalIndex, 'controls', e.target.value)}
                                      className={`h-8 text-sm ${getFieldInputClass(risk.controls)}`}
                                    />
                                  </div>
                                  
                                  {/* Inherent Risk */}
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Inherent Risk</label>
                                    <Select
                                      value={risk.inherentRisk.toLowerCase().includes('high') ? 'High' : 
                                             risk.inherentRisk.toLowerCase().includes('medium') ? 'Medium' : 'Low'}
                                      onValueChange={(value) => updateRisk(originalIndex, 'inherentRisk', value)}
                                    >
                                      <SelectTrigger className={`h-8 text-sm ${getFieldInputClass(risk.inherentRisk)}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="High">High</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="Low">Low</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  {/* Residual Risk */}
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Residual Risk</label>
                                    <Select
                                      value={risk.residualRisk.toLowerCase().includes('high') ? 'High' : 
                                             risk.residualRisk.toLowerCase().includes('medium') ? 'Medium' : 'Low'}
                                      onValueChange={(value) => updateRisk(originalIndex, 'residualRisk', value)}
                                    >
                                      <SelectTrigger className={`h-8 text-sm ${getFieldInputClass(risk.residualRisk)}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="High">High</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="Low">Low</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  {/* Status */}
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                                    <Select
                                      value={risk.status}
                                      onValueChange={(value) => updateRisk(originalIndex, 'status', value)}
                                    >
                                      <SelectTrigger className={`h-8 text-sm ${getFieldInputClass(risk.status)}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Sent for Assessment">Sent for Assessment</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                        <SelectItem value="Overdue">Overdue</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  {/* Assessor */}
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Assessor</label>
                                    <Input
                                      value={risk.assessor}
                                      onChange={(e) => updateRisk(originalIndex, 'assessor', e.target.value)}
                                      className={`h-8 text-sm ${getFieldInputClass(risk.assessor)}`}
                                    />
                                  </div>
                                  
                                  {/* Effectiveness */}
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Effectiveness</label>
                                    <Select
                                      value={risk.effectiveness || 'Effective'}
                                      onValueChange={(value) => updateRisk(originalIndex, 'effectiveness', value)}
                                    >
                                      <SelectTrigger className={`h-8 text-sm ${getFieldInputClass(risk.effectiveness)}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Effective">Effective</SelectItem>
                                        <SelectItem value="Partially Effective">Partially Effective</SelectItem>
                                        <SelectItem value="Ineffective">Ineffective</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  {/* Last Assessed */}
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Last Assessed</label>
                                    <Input
                                      value={risk.lastAssessed}
                                      onChange={(e) => updateRisk(originalIndex, 'lastAssessed', e.target.value)}
                                      className={`h-8 text-sm ${getFieldInputClass(risk.lastAssessed)}`}
                                    />
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
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
            <Button 
              onClick={handleImport}
              disabled={parsedRisks.length === 0}
              className="bg-gradient-to-r from-first-line to-emerald-600 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Import {parsedRisks.length} Assessments
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
