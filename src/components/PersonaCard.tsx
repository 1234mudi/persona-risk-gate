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
      className={`${lineClass} border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer p-2 group touch-manipulation rounded-none h-full`}
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
      <div className="flex items-start gap-2">
        <div className={`${iconClass} transition-transform duration-200 group-hover:scale-110 flex-shrink-0 mt-0.5`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-xs text-[#10052F] dark:text-[#110F15] group-hover:text-primary transition-colors leading-tight">
            {name}
          </h3>
          <p className="text-[9px] text-muted-foreground dark:text-[#110F15]/70 leading-snug mt-0.5">
            {description}
          </p>
        </div>
      </div>
    </Card>
  );
};
