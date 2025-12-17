import React, { useState, useCallback, useMemo } from "react";
import { Upload, FileText, Sparkles, X, AlertCircle, CheckCircle, Loader2, Plus, Pencil, Trash2, ArrowRight, ChevronDown, ChevronUp, Search, Filter, Layers } from "lucide-react";
import mammoth from "mammoth";
import { supabase } from "@/integrations/supabase/client";
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
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentParserBulkAssessmentModal } from "./DocumentParserBulkAssessmentModal";

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
  skipReviewScreen?: boolean; // Skip review and go directly to bulk assessment
  filterByRiskIds?: string[]; // Only show risks that match these IDs (for selected risks flow)
  filterByTitles?: string[]; // Only show risks that match these titles (for selected risks flow)
}

export function AIDocumentAssessmentModal({ 
  open, 
  onOpenChange,
  onRisksImported,
  existingRisks = [],
  skipReviewScreen = false,
  filterByRiskIds,
  filterByTitles
}: AIDocumentAssessmentModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedRisks, setParsedRisks] = useState<ParsedRisk[]>([]);
  const [step, setStep] = useState<"upload" | "processing" | "review">("upload");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  // Checkbox selection state for batch assessment
  const [selectedRiskIds, setSelectedRiskIds] = useState<Set<string>>(new Set());
  const [showBulkAssessmentModal, setShowBulkAssessmentModal] = useState(false);
  
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
        let content = "";
        
        // Extract text content from the file
        if (ext === 'csv') {
          content = await file.text();
        } else if (ext === 'docx') {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          content = result.value;
        }

        if (content.trim()) {
          toast.info(`AI is analyzing ${file.name}...`);
          
          // Call AI to parse the document
          const { data, error } = await supabase.functions.invoke('parse-risk-document', {
            body: { content, fileName: file.name }
          });

          if (error) {
            console.error(`Error calling AI for ${file.name}:`, error);
            toast.error(`Failed to analyze ${file.name}: ${error.message}`);
          } else if (data?.success && data.risks) {
            const risks = data.risks.map((r: ParsedRisk) => ({ ...r, sourceFile: file.name }));
            allRisks.push(...risks);
            toast.success(`AI extracted ${risks.length} risks from ${file.name}`);
          } else if (data?.error) {
            toast.error(`AI error for ${file.name}: ${data.error}`);
          } else {
            toast.warning(`No risks found in ${file.name}`);
          }
        }
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        toast.error(`Failed to process ${file.name}`);
      }

      setProgress(((i + 1) / totalFiles) * 100);
    }
    
    setParsedRisks(allRisks);
    setIsProcessing(false);
    
    if (allRisks.length > 0) {
      // Filter risks if filterByRiskIds or filterByTitles is provided
      let risksToUse = allRisks;
      if (filterByTitles && filterByTitles.length > 0) {
        // Match by title (case-insensitive partial match)
        risksToUse = allRisks.filter(r => 
          filterByTitles.some(title => 
            r.title.toLowerCase().includes(title.toLowerCase()) ||
            title.toLowerCase().includes(r.title.toLowerCase())
          )
        );
      } else if (filterByRiskIds && filterByRiskIds.length > 0) {
        risksToUse = allRisks.filter(r => filterByRiskIds.includes(r.id));
      }
      
      if (risksToUse.length === 0 && (filterByTitles?.length || filterByRiskIds?.length)) {
        toast.info("No matching risks found in the uploaded documents");
      } else {
        toast.success(`Found ${risksToUse.length} matching risk assessments`);
      }
      
      setParsedRisks(risksToUse);
      
      // If skipReviewScreen is enabled, select all risks and open bulk assessment directly
      if (skipReviewScreen) {
        setSelectedRiskIds(new Set(risksToUse.map(r => r.id)));
        setShowBulkAssessmentModal(true);
        setStep("review"); // Still set to review for the modal context
      } else {
        setStep("review");
      }
    } else {
      // No risks found in uploaded files
      if (skipReviewScreen) {
        // Still open bulk assessment modal to show "no matching risks" message
        toast.info("No matching risks found in the uploaded documents");
        setParsedRisks([]);
        setSelectedRiskIds(new Set());
        setShowBulkAssessmentModal(true);
        setStep("review");
      } else {
        toast.warning("No risks found in the uploaded files");
        setStep("review");
      }
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
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700 text-xs"><Sparkles className="w-3 h-3 mr-1" />New</Badge>;
      case "modified":
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-700 text-xs"><Pencil className="w-3 h-3 mr-1" />Modified</Badge>;
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

  // Helper to get input styling based on field status
  const getFieldInputClass = (risk: ParsedRisk, field: keyof ParsedRisk, value: string | undefined): string => {
    if (!showHighlights) return '';
    
    // Yellow if empty - check for null, undefined, empty string, whitespace only, N/A, or Unknown
    const trimmedValue = value?.trim() ?? '';
    if (!trimmedValue || trimmedValue === '' || trimmedValue.toLowerCase() === 'n/a' || trimmedValue.toLowerCase() === 'unknown' || trimmedValue === '-') {
      return 'ring-2 ring-amber-400 bg-amber-50/50 dark:bg-amber-900/30 border-amber-400';
    }
    
    const riskStatus = getRiskStatus(risk);
    
    // Green if new risk
    if (riskStatus === 'new') {
      return 'ring-1 ring-emerald-400/50 bg-emerald-50/30 dark:bg-emerald-900/15 border-emerald-400/50';
    }
    
    // Blue if field was modified from original
    if (isFieldModified(risk, field)) {
      return 'ring-1 ring-blue-400/60 bg-blue-50/40 dark:bg-blue-900/20 border-blue-400/60';
    }
    
    return '';
  };

  const deleteRisk = (index: number) => {
    setParsedRisks(prev => prev.filter((_, i) => i !== index));
    toast.success("Risk removed from import list");
  };

  // Checkbox selection handlers
  const toggleRiskSelection = (riskId: string) => {
    setSelectedRiskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(riskId)) {
        newSet.delete(riskId);
      } else {
        newSet.add(riskId);
      }
      return newSet;
    });
  };

  const toggleAllRisks = (checked: boolean) => {
    if (checked) {
      setSelectedRiskIds(new Set(filteredRisks.map(r => r.id)));
    } else {
      setSelectedRiskIds(new Set());
    }
  };

  const selectedRisksForAssessment = useMemo(() => {
    return parsedRisks.filter(r => selectedRiskIds.has(r.id));
  }, [parsedRisks, selectedRiskIds]);

  const handleBulkAssessmentApply = (assessments: Map<string, any>) => {
    // Update parsed risks with assessment data
    setParsedRisks(prev => prev.map(risk => {
      const assessment = assessments.get(risk.id);
      if (!assessment) return risk;
      
      // Apply all edited fields from the inherent object (which now contains all edited fields)
      const editedFields = assessment.inherent || {};
      const updatedRisk = { ...risk };
      
      // Map all valid ParsedRisk fields
      const validFields: (keyof ParsedRisk)[] = [
        'title', 'id', 'status', 'category', 'riskLevel1', 'riskLevel2', 'riskLevel3',
        'owner', 'assessor', 'businessUnit', 'inherentRisk', 'inherentTrend',
        'controls', 'effectiveness', 'testResults', 'residualRisk', 'residualTrend', 'lastAssessed'
      ];
      
      validFields.forEach(field => {
        if (field in editedFields && editedFields[field] !== undefined) {
          (updatedRisk as any)[field] = editedFields[field];
        }
      });
      
      return updatedRisk;
    }));
    
    setSelectedRiskIds(new Set());
    toast.success("Risk assessments updated");
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

  // When skipReviewScreen is true and bulk assessment modal is open, hide the parent dialog
  const shouldHideParentDialog = skipReviewScreen && showBulkAssessmentModal && step === "review";

  return (
    <>
    <Dialog open={open && !shouldHideParentDialog} onOpenChange={handleClose}>
      <DialogContent className={
        step === "review" 
          ? "w-screen h-screen max-w-none max-h-none rounded-none overflow-hidden flex flex-col bg-background p-0" 
          : "sm:max-w-lg"
      }>
        {/* Header Bar */}
        <div className={step === "review" ? "px-6 py-4 flex items-center justify-between border-b border-border bg-muted/30" : "px-6 pt-6"}>
          {step === "review" ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Document Parser</h2>
                  <p className="text-sm text-muted-foreground">Review and import {parsedRisks.length} parsed risk assessments</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI-Powered
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                Document Parser
              </DialogTitle>
              <DialogDescription>
                Upload CSV or DOCX files containing risk data. AI will parse and create risk assessments automatically.
              </DialogDescription>
            </DialogHeader>
          )}
        </div>

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
            <div className="flex-1 flex flex-col overflow-hidden min-h-0 px-6 py-4">
              {/* Info Banner */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 mb-4 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Document parsing complete. Review and edit the extracted data below before importing.
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI-parsed
                  </Badge>
                </div>
              </div>

              {/* Summary Header */}
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {parsedRisks.length} Risk Assessments Found
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700">
                      <Plus className="w-3 h-3 mr-1" />{riskCounts.newCount} New
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-700">
                      <Pencil className="w-3 h-3 mr-1" />{riskCounts.modifiedCount} Modified
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Highlight Toggle with Legend */}
                  <div className="flex items-center gap-3 text-xs bg-muted/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded border border-emerald-400 bg-emerald-100 dark:bg-emerald-900/30" />
                      <span className="text-muted-foreground">Has data</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded border border-amber-400 bg-amber-100 dark:bg-amber-900/30" />
                      <span className="text-muted-foreground">Missing</span>
                    </div>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-2">
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
                    className="pl-9 h-10 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>

                {/* Status Filter Buttons */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <Button
                    variant={statusFilter === "all" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter("all")}
                    className={`h-8 px-4 text-xs ${statusFilter === "all" ? "bg-white dark:bg-gray-700 shadow-sm" : ""}`}
                  >
                    All ({parsedRisks.length})
                  </Button>
                  <Button
                    variant={statusFilter === "new" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter("new")}
                    className={`h-8 px-4 text-xs ${statusFilter === "new" ? "bg-white dark:bg-gray-700 shadow-sm" : ""}`}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    New ({riskCounts.newCount})
                  </Button>
                  <Button
                    variant={statusFilter === "modified" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter("modified")}
                    className={`h-8 px-4 text-xs ${statusFilter === "modified" ? "bg-white dark:bg-gray-700 shadow-sm" : ""}`}
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Modified ({riskCounts.modifiedCount})
                  </Button>
                </div>

                {/* Source File Filter */}
                {sourceFiles.length > 1 && (
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-[200px] h-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
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
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Showing {filteredRisks.length} of {parsedRisks.length}
                </span>
              </div>

              {/* Table View matching main dashboard */}
              <ScrollArea className="flex-1 min-h-0 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
                <Table>
                  <TableHeader className="sticky top-0 bg-gray-50 dark:bg-gray-800 z-10">
                    <TableRow className="hover:bg-transparent border-b border-gray-200 dark:border-gray-700">
                      <TableHead className="w-12 py-3 px-4">
                        <Checkbox
                          checked={filteredRisks.length > 0 && filteredRisks.every(r => selectedRiskIds.has(r.id))}
                          onCheckedChange={toggleAllRisks}
                        />
                      </TableHead>
                      <TableHead className="w-20 py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"></TableHead>
                      <TableHead className="w-24 py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Risk ID</TableHead>
                      <TableHead className="min-w-[280px] py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Risk Event / Owner</TableHead>
                      <TableHead className="w-36 py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Source</TableHead>
                      <TableHead className="w-32 py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</TableHead>
                      <TableHead className="w-36 py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Completeness</TableHead>
                      <TableHead className="w-24 py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</TableHead>
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
                            className={`transition-colors border-b border-gray-100 dark:border-gray-800
                              ${riskStatus === "new" ? "bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" : ""}
                              ${riskStatus === "modified" ? "bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20" : ""}
                              ${riskStatus === "unchanged" ? "hover:bg-gray-50 dark:hover:bg-gray-800/50" : ""}
                              ${selectedRiskIds.has(risk.id) ? "ring-1 ring-inset ring-emerald-500/50" : ""}
                            `}
                          >
                            {/* Checkbox + Actions */}
                            <TableCell className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={selectedRiskIds.has(risk.id)}
                                  onCheckedChange={() => toggleRiskSelection(risk.id)}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                  onClick={() => {
                                    setSelectedRiskIds(new Set([risk.id]));
                                    setShowBulkAssessmentModal(true);
                                  }}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={() => deleteRisk(originalIndex)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                            
                            {/* Status Badge */}
                            <TableCell className="py-3 px-4">
                              {getStatusBadge(riskStatus)}
                            </TableCell>
                            
                            {/* Risk ID */}
                            <TableCell className="py-3 px-4">
                              <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{risk.id}</span>
                            </TableCell>
                            
                            {/* Title and Owner */}
                            <TableCell className="py-3 px-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium text-gray-900 dark:text-gray-100">{risk.title}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{risk.owner || 'No owner assigned'}</span>
                              </div>
                            </TableCell>
                            
                            {/* Source File */}
                            <TableCell className="py-3 px-4">
                              <Badge variant="outline" className="text-xs font-normal bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                <FileText className="w-3 h-3 mr-1" />
                                {risk.sourceFile ? risk.sourceFile.split('.')[0].substring(0, 12) : '-'}
                              </Badge>
                            </TableCell>
                            
                            {/* Status */}
                            <TableCell className="py-3 px-4">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  risk.status === 'Active' 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700' 
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                                }`}
                              >
                                {risk.status}
                              </Badge>
                            </TableCell>
                            
                            {/* Missing Fields */}
                            <TableCell className="py-3 px-4">
                              {missingCount > 0 ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-700 cursor-help"
                                    >
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      {missingCount} fields
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
                                <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Complete
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </TooltipProvider>
        )}

        {step === "upload" && (
          <DialogFooter className="mt-4 px-6 pb-6">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={processFiles}
              disabled={files.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Process with AI
            </Button>
          </DialogFooter>
        )}
        
        {step === "review" && (
          <div className="px-6 pb-6 pt-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
            {selectedRiskIds.size > 0 && (
              <Button
                onClick={() => setShowBulkAssessmentModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <Layers className="w-4 h-4" />
                Assess Selected ({selectedRiskIds.size})
              </Button>
            )}
            <Button 
              onClick={handleImport}
              disabled={parsedRisks.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              Import {parsedRisks.length} Assessments
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Bulk Assessment Modal - rendered outside the Dialog so it shows when parent is hidden */}
    <DocumentParserBulkAssessmentModal
      open={showBulkAssessmentModal}
      onOpenChange={(open) => {
        setShowBulkAssessmentModal(open);
        // When closing bulk assessment in skipReviewScreen mode, close the whole flow
        if (!open && skipReviewScreen) {
          handleClose();
        }
      }}
      selectedRisks={selectedRisksForAssessment}
      onApplyAssessments={handleBulkAssessmentApply}
    />
    </>
  );
}
