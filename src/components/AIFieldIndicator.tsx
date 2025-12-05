import { ReactNode } from "react";
import { Sparkles, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIFieldIndicatorProps {
  children: ReactNode;
  isAIFilled: boolean;
  isEdited: boolean;
  className?: string;
}

export const AIFieldIndicator = ({
  children,
  isAIFilled,
  isEdited,
  className,
}: AIFieldIndicatorProps) => {
  const showIndicator = isAIFilled || isEdited;

  return (
    <div className={cn("relative", className)}>
      {/* Glow effect for AI-filled fields */}
      {isAIFilled && !isEdited && (
        <div className="absolute inset-0 rounded-md ring-2 ring-purple-400/40 bg-purple-50/30 dark:bg-purple-950/20 pointer-events-none animate-pulse" style={{ animationDuration: '3s' }} />
      )}
      
      {/* Edited indicator border */}
      {isEdited && (
        <div className="absolute inset-0 rounded-md ring-2 ring-amber-400/40 bg-amber-50/20 dark:bg-amber-950/20 pointer-events-none" />
      )}

      {/* The actual field */}
      <div className="relative">
        {children}
      </div>

      {/* AI/Edited badge */}
      {showIndicator && (
        <div
          className={cn(
            "absolute -top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium z-10",
            isEdited
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
              : "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border border-purple-300 dark:border-purple-700"
          )}
        >
          {isEdited ? (
            <>
              <Pencil className="w-2.5 h-2.5" />
              <span>Edited</span>
            </>
          ) : (
            <>
              <Sparkles className="w-2.5 h-2.5" />
              <span>AI-generated</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
