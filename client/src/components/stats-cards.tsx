import { FileText, Download, Clock, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  stats: {
    totalFiles?: number;
    downloaded?: number;
    pending?: number;
    notified?: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { title: "Total Files", value: stats.totalFiles || 0, icon: FileText, bgColor: "bg-blue-50", iconColor: "text-primary", change: "+12%", changeText: "from last month", changeColor: "text-green-600" },
    { title: "Downloaded", value: stats.downloaded || 0, icon: Download, bgColor: "bg-green-50", iconColor: "text-green-600", change: "+8%", changeText: "completion rate", changeColor: "text-green-600" },
    { title: "Pending", value: stats.pending || 0, icon: Clock, bgColor: "bg-amber-50", iconColor: "text-amber-600", change: "23%", changeText: "awaiting download", changeColor: "text-amber-600" },
    { title: "Notifications Sent", value: stats.notified || 0, icon: Bell, bgColor: "bg-purple-50", iconColor: "text-purple-600", change: "100%", changeText: "delivery rate", changeColor: "text-green-600" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="border border-slate-200">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-slate-600 text-xs sm:text-sm font-medium truncate">{card.title}</p>
                  <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1 sm:mt-2">{card.value}</p>
                </div>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${card.bgColor} rounded-lg flex items-center justify-center flex-shrink-0 ml-2`}>
                  <Icon className={card.iconColor} size={16} />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <span className={card.changeColor}>{card.change}</span>
                <span className="text-slate-500 ml-2">{card.changeText}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
