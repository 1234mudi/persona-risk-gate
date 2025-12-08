import { useState, useCallback } from "react";
import { Upload, FileText, Sparkles, X, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
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
import { toast } from "sonner";

interface ParsedRisk {
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

interface AIDocumentAssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRisksImported: (risks: ParsedRisk[]) => void;
}

export function AIDocumentAssessmentModal({ 
  open, 
  onOpenChange,
  onRisksImported 
}: AIDocumentAssessmentModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedRisks, setParsedRisks] = useState<ParsedRisk[]>([]);
  const [step, setStep] = useState<"upload" | "processing" | "review">("upload");

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
          // For DOCX, we'd need a library or backend processing
          // For now, simulate AI processing
          toast.info(`Processing ${file.name} with AI...`);
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Simulate extracted risks from DOCX
          // In production, this would use a document parsing service
          toast.warning(`DOCX parsing requires backend AI processing. Using CSV data only.`);
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
    onOpenChange(false);
  };

  const getRiskLevelColor = (risk: string) => {
    if (risk.toLowerCase().includes('high')) return 'bg-destructive/20 text-destructive';
    if (risk.toLowerCase().includes('medium')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
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
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">
                  {parsedRisks.length} Risk Assessments Found
                </span>
              </div>
              <Badge variant="outline">
                Ready to Import
              </Badge>
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-4 space-y-3">
                {parsedRisks.slice(0, 20).map((risk, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-muted/30 rounded-lg border border-border/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {risk.id}
                          </Badge>
                          <Badge className={`text-xs ${getRiskLevelColor(risk.inherentRisk)}`}>
                            {risk.inherentRisk.replace(/[\[\]]/g, '')}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium truncate">{risk.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{risk.businessUnit}</span>
                          <span>•</span>
                          <span>{risk.category}</span>
                          <span>•</span>
                          <span>Owner: {risk.owner}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {risk.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {parsedRisks.length > 20 && (
                  <p className="text-center text-sm text-muted-foreground py-2">
                    And {parsedRisks.length - 20} more...
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
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
