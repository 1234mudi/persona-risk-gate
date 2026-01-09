import React, { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertCircle,
  Search,
  Columns3,
  RotateCcw,
  ChevronDown,
  Pin,
  PinOff,
  EyeOff,
  GripVertical,
  CalendarIcon,
  X,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export interface NAControlDetails {
  id: string;
  name: string;
  riskId: string;
  riskName: string;
  justification: string;
  markedBy: string;
  markedDate: string;
}

interface ColumnConfig {
  id: string;
  label: string;
  width: string;
  minWidth: string;
  filterable: boolean;
  type: "text" | "select" | "date";
  accessor: (control: NAControlDetails) => string;
}

interface NAControlsDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessUnit: string;
  category: string;
  controls: NAControlDetails[];
  totalControls: number;
}

const defaultColumns: ColumnConfig[] = [
  { id: "id", label: "Control ID", width: "110px", minWidth: "90px", filterable: true, type: "text", accessor: (c) => c.id },
  { id: "name", label: "Control Name", width: "180px", minWidth: "120px", filterable: true, type: "text", accessor: (c) => c.name },
  { id: "riskId", label: "Risk ID", width: "120px", minWidth: "100px", filterable: true, type: "text", accessor: (c) => c.riskId },
  { id: "riskName", label: "Risk Name", width: "160px", minWidth: "120px", filterable: true, type: "select", accessor: (c) => c.riskName },
  { id: "justification", label: "Justification", width: "220px", minWidth: "150px", filterable: true, type: "text", accessor: (c) => c.justification },
  { id: "markedBy", label: "Marked By", width: "130px", minWidth: "100px", filterable: true, type: "select", accessor: (c) => c.markedBy },
  { id: "markedDate", label: "Date", width: "100px", minWidth: "90px", filterable: true, type: "date", accessor: (c) => c.markedDate },
];

export const NAControlsDrilldownModal: React.FC<NAControlsDrilldownModalProps> = ({
  isOpen,
  onClose,
  businessUnit,
  category,
  controls,
  totalControls,
}) => {
  const naPercentage = totalControls > 0 ? ((controls.length / totalControls) * 100).toFixed(1) : "0.0";

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [showFilters, setShowFilters] = useState(false);

  // Column management states
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns.map(c => c.id));
  const [frozenColumns, setFrozenColumns] = useState<string[]>(["id"]);
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumns.map(c => c.id));

  // Drag state
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Get unique values for select filters
  const uniqueRiskNames = useMemo(() => 
    [...new Set(controls.map(c => c.riskName))].sort(), [controls]);
  const uniqueMarkedBy = useMemo(() => 
    [...new Set(controls.map(c => c.markedBy))].sort(), [controls]);

  // Filter logic
  const filteredControls = useMemo(() => {
    return controls.filter(control => {
      // Global search
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
          control.id.toLowerCase().includes(searchLower) ||
          control.name.toLowerCase().includes(searchLower) ||
          control.riskId.toLowerCase().includes(searchLower) ||
          control.riskName.toLowerCase().includes(searchLower) ||
          control.justification.toLowerCase().includes(searchLower) ||
          control.markedBy.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      // Column-specific filters
      for (const [columnId, filterValue] of Object.entries(columnFilters)) {
        if (!filterValue || filterValue === "all") continue;
        const column = defaultColumns.find(c => c.id === columnId);
        if (!column) continue;
        const controlValue = column.accessor(control);
        if (!String(controlValue).toLowerCase().includes(filterValue.toLowerCase())) {
          return false;
        }
      }
      
      // Date range filter
      if (dateRange.from || dateRange.to) {
        const controlDate = new Date(control.markedDate);
        if (dateRange.from && controlDate < dateRange.from) return false;
        if (dateRange.to && controlDate > dateRange.to) return false;
      }
      
      return true;
    });
  }, [controls, searchQuery, columnFilters, dateRange]);

  // Get ordered and visible columns
  const orderedColumns = useMemo(() => {
    return columnOrder
      .filter(id => visibleColumns.includes(id))
      .map(id => defaultColumns.find(c => c.id === id)!)
      .filter(Boolean);
  }, [columnOrder, visibleColumns]);

  // Column actions
  const toggleColumnVisibility = (columnId: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnId) 
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const toggleColumnFreeze = (columnId: string) => {
    setFrozenColumns(prev => 
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const hideColumn = (columnId: string) => {
    setVisibleColumns(prev => prev.filter(id => id !== columnId));
  };

  // Drag and drop handlers
  const handleDragStart = (columnId: string) => {
    if (frozenColumns.includes(columnId)) return;
    setDraggedColumn(columnId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (frozenColumns.includes(columnId)) return;
    setDragOverColumn(columnId);
  };

  const handleDrop = (targetColumnId: string) => {
    if (!draggedColumn || draggedColumn === targetColumnId) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }
    if (frozenColumns.includes(targetColumnId)) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    setColumnOrder(prev => {
      const newOrder = [...prev];
      const draggedIndex = newOrder.indexOf(draggedColumn);
      const targetIndex = newOrder.indexOf(targetColumnId);
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedColumn);
      return newOrder;
    });
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  // Reset all settings
  const resetAll = () => {
    setSearchQuery("");
    setColumnFilters({});
    setDateRange({});
    setVisibleColumns(defaultColumns.map(c => c.id));
    setFrozenColumns(["id"]);
    setColumnOrder(defaultColumns.map(c => c.id));
    setShowFilters(false);
  };

  // Calculate frozen column offset
  const getFrozenOffset = (columnId: string) => {
    const frozenIndex = frozenColumns.indexOf(columnId);
    if (frozenIndex === -1) return undefined;
    
    let offset = 0;
    for (let i = 0; i < frozenIndex; i++) {
      const col = defaultColumns.find(c => c.id === frozenColumns[i]);
      if (col) offset += parseInt(col.width);
    }
    return offset;
  };

  const hasActiveFilters = searchQuery || Object.values(columnFilters).some(v => v && v !== "all") || dateRange.from || dateRange.to;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[85vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            N/A Controls - {businessUnit} / {category}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-3">
          {/* Summary */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {controls.length} of {totalControls} controls ({naPercentage}%) marked as N/A
            </Badge>
            <span className="text-xs text-muted-foreground">
              Showing {filteredControls.length} of {controls.length} N/A controls
            </span>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Global Search */}
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search all columns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Toggle Filters */}
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-8 gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  Active
                </Badge>
              )}
            </Button>

            {/* Columns Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <Columns3 className="w-3.5 h-3.5" />
                  Columns
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    {visibleColumns.length}/{defaultColumns.length}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {defaultColumns.map(column => (
                  <DropdownMenuItem
                    key={column.id}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleColumnVisibility(column.id);
                    }}
                    className="gap-2"
                  >
                    <Checkbox
                      checked={visibleColumns.includes(column.id)}
                      className="pointer-events-none"
                    />
                    <span className="flex-1">{column.label}</span>
                    {frozenColumns.includes(column.id) && (
                      <Pin className="w-3 h-3 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Reset Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAll}
              className="h-8 gap-1.5 text-muted-foreground"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          </div>

          {/* Column Filters Row */}
          {showFilters && (
            <div className="flex items-center gap-2 flex-wrap p-2 bg-muted/30 rounded-lg border">
              <span className="text-xs font-medium text-muted-foreground">Filter by:</span>
              
              {/* Control ID Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">ID:</span>
                <Input
                  placeholder="..."
                  value={columnFilters.id || ""}
                  onChange={(e) => setColumnFilters(prev => ({ ...prev, id: e.target.value }))}
                  className="h-7 w-20 text-xs"
                />
              </div>

              {/* Control Name Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">Name:</span>
                <Input
                  placeholder="..."
                  value={columnFilters.name || ""}
                  onChange={(e) => setColumnFilters(prev => ({ ...prev, name: e.target.value }))}
                  className="h-7 w-24 text-xs"
                />
              </div>

              {/* Risk Name Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">Risk:</span>
                <Select
                  value={columnFilters.riskName || "all"}
                  onValueChange={(value) => setColumnFilters(prev => ({ ...prev, riskName: value }))}
                >
                  <SelectTrigger className="h-7 w-32 text-xs">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {uniqueRiskNames.map(risk => (
                      <SelectItem key={risk} value={risk} className="text-xs">
                        {risk.length > 20 ? risk.slice(0, 20) + "..." : risk}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Marked By Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">By:</span>
                <Select
                  value={columnFilters.markedBy || "all"}
                  onValueChange={(value) => setColumnFilters(prev => ({ ...prev, markedBy: value }))}
                >
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {uniqueMarkedBy.map(user => (
                      <SelectItem key={user} value={user} className="text-xs">{user}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">Date:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1 font-normal">
                      <CalendarIcon className="w-3 h-3" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
                          </>
                        ) : (
                          format(dateRange.from, "MMM d, yyyy")
                        )
                      ) : (
                        "Pick range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                      numberOfMonths={2}
                    />
                    {(dateRange.from || dateRange.to) && (
                      <div className="p-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDateRange({})}
                          className="w-full text-xs"
                        >
                          Clear dates
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setColumnFilters({});
                    setDateRange({});
                    setSearchQuery("");
                  }}
                  className="h-7 text-xs text-muted-foreground ml-auto"
                >
                  Clear all
                </Button>
              )}
            </div>
          )}

          {/* Table */}
          {filteredControls.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <ScrollArea className="h-[400px]">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-muted/70 sticky top-0 z-20">
                      <tr>
                        {orderedColumns.map((column) => {
                          const isFrozen = frozenColumns.includes(column.id);
                          const frozenOffset = getFrozenOffset(column.id);
                          
                          return (
                            <th
                              key={column.id}
                              draggable={!isFrozen}
                              onDragStart={() => handleDragStart(column.id)}
                              onDragOver={(e) => handleDragOver(e, column.id)}
                              onDrop={() => handleDrop(column.id)}
                              onDragEnd={handleDragEnd}
                              className={cn(
                                "px-3 py-2 text-left text-xs font-semibold text-foreground border-b border-r last:border-r-0",
                                isFrozen && "sticky z-30 bg-muted/90 shadow-[2px_0_4px_rgba(0,0,0,0.1)]",
                                dragOverColumn === column.id && "bg-primary/10",
                                draggedColumn === column.id && "opacity-50"
                              )}
                              style={{
                                width: column.width,
                                minWidth: column.minWidth,
                                left: isFrozen ? frozenOffset : undefined,
                              }}
                            >
                              <div className="flex items-center gap-1.5">
                                {!isFrozen && (
                                  <GripVertical className="w-3 h-3 text-muted-foreground/50 cursor-grab shrink-0" />
                                )}
                                {isFrozen && (
                                  <Pin className="w-3 h-3 text-primary shrink-0" />
                                )}
                                <span className="truncate flex-1">{column.label}</span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="shrink-0 p-0.5 rounded hover:bg-muted-foreground/10">
                                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={() => toggleColumnFreeze(column.id)}>
                                      {isFrozen ? (
                                        <>
                                          <PinOff className="w-3.5 h-3.5 mr-2" />
                                          Unfreeze
                                        </>
                                      ) : (
                                        <>
                                          <Pin className="w-3.5 h-3.5 mr-2" />
                                          Freeze
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => hideColumn(column.id)}>
                                      <EyeOff className="w-3.5 h-3.5 mr-2" />
                                      Hide column
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredControls.map((control, idx) => (
                        <tr
                          key={control.id}
                          className={cn(
                            "border-b last:border-b-0 transition-colors hover:bg-muted/40",
                            idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                          )}
                        >
                          {orderedColumns.map((column) => {
                            const isFrozen = frozenColumns.includes(column.id);
                            const frozenOffset = getFrozenOffset(column.id);
                            const value = column.accessor(control);
                            
                            return (
                              <td
                                key={column.id}
                                className={cn(
                                  "px-3 py-2 text-xs border-r last:border-r-0",
                                  isFrozen && "sticky z-10 shadow-[2px_0_4px_rgba(0,0,0,0.05)]",
                                  idx % 2 === 0 ? (isFrozen ? "bg-background" : "") : (isFrozen ? "bg-muted/20" : "")
                                )}
                                style={{
                                  width: column.width,
                                  minWidth: column.minWidth,
                                  left: isFrozen ? frozenOffset : undefined,
                                }}
                              >
                                {column.id === "id" ? (
                                  <span className="font-mono text-blue-600">{value}</span>
                                ) : column.id === "riskId" ? (
                                  <span className="font-mono text-[10px] text-muted-foreground">{value}</span>
                                ) : column.id === "markedBy" ? (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-medium text-primary shrink-0">
                                      {value.split(' ').map(w => w[0]).join('')}
                                    </div>
                                    <span className="truncate">{value}</span>
                                  </div>
                                ) : column.id === "markedDate" ? (
                                  <span className="text-muted-foreground">{value}</span>
                                ) : column.id === "justification" ? (
                                  <p className="line-clamp-2 text-muted-foreground" title={value}>
                                    {value}
                                  </p>
                                ) : (
                                  <span className="truncate block" title={value}>{value}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20">
              <AlertCircle className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {controls.length === 0 
                  ? "No controls marked as Not Applicable"
                  : "No controls match the current filters"
                }
              </p>
              {hasActiveFilters && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setColumnFilters({});
                    setDateRange({});
                  }}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-2 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NAControlsDrilldownModal;
