import { Card } from "@/components/ui/card";
import { Play, Square, Box } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: "play" | "square" | "cube";
  iconColor: "green" | "red" | "blue";
}

export default function StatsCard({ title, value, icon, iconColor }: StatsCardProps) {
  const getIconComponent = () => {
    const iconClasses = "h-6 w-6";
    
    switch (icon) {
      case "play":
        return <Play className={iconClasses} />;
      case "square":
        return <Square className={iconClasses} />;
      case "cube":
        return <Box className={iconClasses} />;
      default:
        return <Box className={iconClasses} />;
    }
  };

  const getIconColorClass = () => {
    switch (iconColor) {
      case "green":
        return "bg-green-100 text-green-500";
      case "red":
        return "bg-red-100 text-red-500";
      case "blue":
        return "bg-blue-100 text-primary";
      default:
        return "bg-blue-100 text-primary";
    }
  };

  return (
    <Card className="p-4 flex-1 min-w-[200px] flex items-center">
      <div className={`w-12 h-12 rounded-lg ${getIconColorClass()} flex items-center justify-center mr-4`}>
        {getIconComponent()}
      </div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </Card>
  );
}
