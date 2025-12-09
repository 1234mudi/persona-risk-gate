import { useState, useCallback } from "react";
import { Upload, FileText, X, AlertCircle, CheckCircle, Loader2, ArrowRight, Search, FileQuestion } from "lucide-react";
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
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RiskData {
  id: string;
  title: string;
  riskLevel1?: string;
  riskLevel2?: string;
  riskLevel3?: string;
  level?: string;
  businessUnit?: string;
  category?: string;
  owner?: string;
  assessor?: string;
  inherentRisk?: string;
  inherentTrend?: string;
  controls?: string;
  effectiveness?: string;
  testResults?: string;
  residualRisk?: string;
  residualTrend?: string;
  status?: string;
  lastAssessed?: string;
}

interface FieldComparison {
  field: string;
  label: string;
  currentValue: string | undefined;
  newValue: string | undefined;
  status: "same" | "modified" | "new" | "removed";
}

interface SingleRiskDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risk: {
    id: string;
    title: string;
  } | null;
  onApplyChanges?: (changes: Partial<RiskData>) => void;
}

export function SingleRiskDocumentModal({
  open,
  onOpenChange,
  risk,
  onApplyChanges,
}: SingleRiskDocumentModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<"upload" | "processing" | "review">("upload");
  const [foundRisk, setFoundRisk] = useState<RiskData | null>(null);
  const [searchedFiles, setSearchedFiles] = useState<string[]>([]);

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

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      return ext === "csv" || ext === "docx";
    });

    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles]);
    } else {
      toast.error("Please upload CSV or DOCX files only");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const parseCSV = (content: string): RiskData[] => {
    const normalizedContent = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = normalizedContent.split("\n").filter((line) => line.trim() !== "");

    if (lines.length < 2) return [];

    const risks: RiskData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      if (values.length >= 10) {
        risks.push({
          id: values[0] || "",
          title: values[1] || "",
          riskLevel1: values[2] || "",
          riskLevel2: values[3] || "",
          riskLevel3: values[4] || "",
          level: values[5] || "",
          businessUnit: values[6] || "",
          category: values[7] || "",
          owner: values[8] || "",
          assessor: values[9] || "",
          inherentRisk: values[10] || "",
          inherentTrend: values[11] || "",
          controls: values[12] || "",
          effectiveness: values[13] || "",
          testResults: values[14] || "",
          residualRisk: values[15] || "",
          residualTrend: values[16] || "",
          status: values[17] || "",
          lastAssessed: values[18] || "",
        });
      }
    }

    return risks;
  };

  const parseDOCX = async (file: File): Promise<RiskData[]> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;

      const risks: RiskData[] = [];
      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "");

      let dataStartIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i] === "Last Assessed") {
          dataStartIndex = i + 1;
          break;
        }
      }

      if (dataStartIndex === -1) {
        for (let i = 0; i < lines.length; i++) {
          if (/^R-\d{3}$/.test(lines[i])) {
            dataStartIndex = i;
            break;
          }
        }
      }

      if (dataStartIndex === -1) return [];

      const riskIdPattern = /^R-\d{3}$/;
      let currentRecord: string[] = [];

      for (let i = dataStartIndex; i < lines.length; i++) {
        const line = lines[i];

        if (riskIdPattern.test(line) && currentRecord.length > 0) {
          const risk = parseRecordToRisk(currentRecord);
          if (risk) risks.push(risk);
          currentRecord = [line];
        } else {
          currentRecord.push(line);
        }
      }

      if (currentRecord.length > 0) {
        const risk = parseRecordToRisk(currentRecord);
        if (risk) risks.push(risk);
      }

      return risks;
    } catch (error) {
      console.error("Error parsing DOCX:", error);
      throw error;
    }
  };

  const parseRecordToRisk = (lines: string[]): RiskData | null => {
    if (lines.length < 10) return null;

    return {
      id: lines[0] || "",
      title: lines[1] || "",
      riskLevel1: lines[2] || "",
      riskLevel2: lines[3] || "",
      riskLevel3: lines[4] || "",
      level: lines[5] || "",
      businessUnit: lines[6] || "",
      category: lines[7] || "",
      owner: lines[8] || "",
      assessor: lines[9] || "",
      inherentRisk: lines[10] || "",
      inherentTrend: lines[11] || "",
      controls: lines[12] || "",
      effectiveness: lines[13] || "",
      testResults: lines[14] || "",
      residualRisk: lines[15] || "",
      residualTrend: lines[16] || "",
      status: lines[17] || "",
      lastAssessed: lines[18] || "",
    };
  };

  const searchForRisk = async () => {
    if (!risk || files.length === 0) {
      toast.error("Please upload at least one file");
      return;
    }

    setStep("processing");
    setIsProcessing(true);
    setProgress(0);
    setFoundRisk(null);

    const fileNames: string[] = [];
    let foundMatch: RiskData | null = null;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      fileNames.push(file.name);
      const ext = file.name.split(".").pop()?.toLowerCase();

      try {
        let allRisks: RiskData[] = [];

        if (ext === "csv") {
          const content = await file.text();
          allRisks = parseCSV(content);
        } else if (ext === "docx") {
          allRisks = await parseDOCX(file);
        }

        // Search by ID (case-insensitive) or by title (partial match)
        const match = allRisks.find(
          (r) =>
            r.id.toLowerCase() === risk.id.toLowerCase() ||
            r.title.toLowerCase().includes(risk.title.toLowerCase()) ||
            risk.title.toLowerCase().includes(r.title.toLowerCase())
        );

        if (match) {
          foundMatch = match;
          break;
        }
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
      }

      setProgress(((i + 1) / files.length) * 100);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    setSearchedFiles(fileNames);
    setFoundRisk(foundMatch);
    setIsProcessing(false);
    setStep("review");

    if (foundMatch) {
      toast.success(`Found matching risk in documents!`);
    } else {
      toast.warning(`No matching risk found for ${risk.id}`);
    }
  };

  const getFieldComparisons = (): FieldComparison[] => {
    if (!risk || !foundRisk) return [];

    const fields: { key: keyof RiskData; label: string }[] = [
      { key: "id", label: "Risk ID" },
      { key: "title", label: "Title" },
      { key: "riskLevel1", label: "Risk Level 1" },
      { key: "riskLevel2", label: "Risk Level 2" },
      { key: "riskLevel3", label: "Risk Level 3" },
      { key: "level", label: "Level" },
      { key: "businessUnit", label: "Business Unit" },
      { key: "category", label: "Category" },
      { key: "owner", label: "Owner" },
      { key: "assessor", label: "Assessor" },
      { key: "inherentRisk", label: "Inherent Risk" },
      { key: "inherentTrend", label: "Inherent Trend" },
      { key: "controls", label: "Controls" },
      { key: "effectiveness", label: "Effectiveness" },
      { key: "testResults", label: "Test Results" },
      { key: "residualRisk", label: "Residual Risk" },
      { key: "residualTrend", label: "Residual Trend" },
      { key: "status", label: "Status" },
      { key: "lastAssessed", label: "Last Assessed" },
    ];

    const currentRisk: any = risk;

    return fields.map(({ key, label }) => {
      const currentValue = currentRisk[key] || undefined;
      const newValue = foundRisk[key] || undefined;

      let status: FieldComparison["status"] = "same";

      if (!currentValue && newValue) {
        status = "new";
      } else if (currentValue && !newValue) {
        status = "removed";
      } else if (currentValue !== newValue) {
        status = "modified";
      }

      return { field: key, label, currentValue, newValue, status };
    });
  };

  const handleApplyChanges = () => {
    if (foundRisk && onApplyChanges) {
      onApplyChanges(foundRisk);
      toast.success("Changes applied successfully");
      handleClose();
    }
  };

  const handleClose = () => {
    setFiles([]);
    setFoundRisk(null);
    setSearchedFiles([]);
    setStep("upload");
    setProgress(0);
    setIsProcessing(false);
    onOpenChange(false);
  };

  const getStatusBadge = (status: FieldComparison["status"]) => {
    switch (status) {
      case "new":
        return (
          <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 text-[10px]">
            New Info
          </Badge>
        );
      case "modified":
        return (
          <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]">
            Modified
          </Badge>
        );
      case "removed":
        return (
          <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 text-[10px]">
            Removed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground border-border text-[10px]">
            Same
          </Badge>
        );
    }
  };

  const comparisons = step === "review" && foundRisk ? getFieldComparisons() : [];
  const modifiedCount = comparisons.filter((c) => c.status === "modified").length;
  const newCount = comparisons.filter((c) => c.status === "new").length;

  if (!risk) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Search Document for Risk
          </DialogTitle>
          <DialogDescription className="text-sm">
            Upload a CSV or DOCX file to search for{" "}
            <span className="font-semibold text-foreground">{risk.id}</span> -{" "}
            {risk.title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {step === "upload" && (
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  Drop CSV or DOCX files here
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  or click to browse
                </p>
                <input
                  type="file"
                  accept=".csv,.docx"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="single-risk-file-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById("single-risk-file-upload")?.click()
                  }
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Browse Files
                </Button>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Files to search ({files.length})
                  </p>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/50 border border-border"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[300px]">
                          {file.name}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {file.name.split(".").pop()?.toUpperCase()}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-sm font-medium mb-2">
                Searching for {risk.id}...
              </p>
              <div className="w-48">
                <Progress value={progress} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Analyzing document content
              </p>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              {/* Search Summary */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                {foundRisk ? (
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                ) : (
                  <FileQuestion className="w-5 h-5 text-amber-500 shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {foundRisk
                      ? `Found matching risk in documents`
                      : `No matching risk found`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Searched {searchedFiles.length} file(s):{" "}
                    {searchedFiles.join(", ")}
                  </p>
                </div>
                {foundRisk && (
                  <div className="flex gap-2">
                    {newCount > 0 && (
                      <Badge className="bg-green-500/20 text-green-600">
                        {newCount} New
                      </Badge>
                    )}
                    {modifiedCount > 0 && (
                      <Badge className="bg-amber-500/20 text-amber-600">
                        {modifiedCount} Modified
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {foundRisk ? (
                <ScrollArea className="h-[350px] pr-4">
                  <TooltipProvider>
                    <div className="space-y-2">
                      {comparisons.map((comp) => (
                        <div
                          key={comp.field}
                          className={`p-3 rounded-lg border ${
                            comp.status === "same"
                              ? "bg-background border-border/50"
                              : comp.status === "new"
                              ? "bg-green-500/5 border-green-500/30"
                              : comp.status === "modified"
                              ? "bg-amber-500/5 border-amber-500/30"
                              : "bg-red-500/5 border-red-500/30"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              {comp.label}
                            </span>
                            {getStatusBadge(comp.status)}
                          </div>

                          {comp.status === "same" ? (
                            <p className="text-sm">
                              {comp.currentValue || (
                                <span className="text-muted-foreground italic">
                                  (empty)
                                </span>
                              )}
                            </p>
                          ) : (
                            <div className="flex items-center gap-2 text-sm">
                              <span
                                className={`${
                                  comp.status === "removed"
                                    ? "text-red-600 line-through"
                                    : "text-muted-foreground line-through"
                                }`}
                              >
                                {comp.currentValue || "(empty)"}
                              </span>
                              <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                              <span
                                className={`font-medium ${
                                  comp.status === "new"
                                    ? "text-green-600"
                                    : comp.status === "modified"
                                    ? "text-amber-600"
                                    : ""
                                }`}
                              >
                                {comp.newValue || "(empty)"}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TooltipProvider>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium mb-1">
                    Risk not found in uploaded documents
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    The risk ID "{risk.id}" or title "{risk.title}" was not
                    found in the uploaded files. Try uploading a different
                    document.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border pt-4">
          {step === "upload" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={searchForRisk} disabled={files.length === 0}>
                <Search className="w-4 h-4 mr-2" />
                Search Documents
              </Button>
            </>
          )}

          {step === "review" && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setStep("upload");
                  setFoundRisk(null);
                }}
              >
                Search Again
              </Button>
              {foundRisk && (modifiedCount > 0 || newCount > 0) && (
                <Button onClick={handleApplyChanges}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Apply Changes
                </Button>
              )}
              <Button variant="ghost" onClick={handleClose}>
                Close
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
