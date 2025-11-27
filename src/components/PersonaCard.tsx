import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
      className={`${lineClass} border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer p-6 group`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-4">
        <div className={`${iconClass} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="w-8 h-8" />
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Card>
  );
};
