import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PersonaCardProps {
  icon: LucideIcon;
  name: string;
  description: string;
  line: "first" | "second";
  onSelect: () => void;
}

export const PersonaCard = ({ icon: Icon, name, description, line, onSelect }: PersonaCardProps) => {
  const lineClass = line === "first" 
    ? "bg-first-line-light border-first-line/30 hover:border-first-line/60" 
    : "bg-second-line-light border-second-line/30 hover:border-second-line/60";
  
  const iconClass = line === "first" 
    ? "text-first-line-foreground" 
    : "text-second-line-foreground";

  return (
    <Card 
      className={`${lineClass} border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer p-3 sm:p-2 group min-h-[60px] touch-manipulation`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="flex items-start gap-2 sm:gap-1.5">
        <div className={`${iconClass} transition-transform duration-300 group-hover:scale-110 flex-shrink-0 mt-0.5`}>
          <Icon className="w-5 h-5 sm:w-4 sm:h-4" />
        </div>
        <div className="flex-1 space-y-0.5">
          <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="text-xs sm:text-[11px] text-muted-foreground leading-tight">
            {description}
          </p>
        </div>
      </div>
    </Card>
  );
};
