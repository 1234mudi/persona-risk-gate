import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AIFieldSuggestionProps {
  children: React.ReactNode;
  onSuggest: () => Promise<void>;
  fieldType: "rating" | "comment" | "design" | "operating" | "testing";
  className?: string;
  disabled?: boolean;
}

export const AIFieldSuggestion = ({
  children,
  onSuggest,
  fieldType,
  className,
  disabled = false,
}: AIFieldSuggestionProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSuggest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    try {
      await onSuggest();
    } finally {
      setIsLoading(false);
    }
  };

  const getTooltipText = () => {
    switch (fieldType) {
      case "rating": return "Get AI suggestion for rating";
      case "comment": return "Get AI suggestion for comment";
      case "design": return "Get AI suggestion for design effectiveness";
      case "operating": return "Get AI suggestion for operating effectiveness";
      case "testing": return "Get AI suggestion for testing effectiveness";
      default: return "Get AI suggestion";
    }
  };

  return (
    <div className={cn("relative group", className)}>
      {children}
      
      {/* AI Suggestion button - appears on hover */}
      {!disabled && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute -right-5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0"
                onClick={handleSuggest}
                disabled={isLoading}
                type="button"
              >
                {isLoading ? (
                  <Loader2 className="w-2.5 h-2.5 animate-spin text-purple-600" />
                ) : (
                  <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-[10px]">
              <p>{getTooltipText()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};
