import { Copy, BarChart3, FileText, Users, Bell, Gauge, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminSidebar() {
  const menuItems = [
    { icon: Gauge, label: "Dashboard", active: true },
    { icon: FileText, label: "File Management" },
    { icon: Users, label: "Students" },
    { icon: Bell, label: "Notifications" },
    { icon: BarChart3, label: "Reports" },
  ];

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-slate-200 flex flex-col" data-testid="admin-sidebar">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Copy className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">QuickCopy</h1>
            <p className="text-sm text-slate-500">Admin Panel</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <Button
                  variant={item.active ? "default" : "ghost"}
                  className={`w-full justify-start space-x-3 ${
                    item.active 
                      ? "bg-primary text-white hover:bg-primary/90" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-3 px-4 py-2">
          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
            <Users size={16} className="text-slate-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">Admin User</p>
            <p className="text-xs text-slate-500">admin@college.edu</p>
          </div>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </aside>
  );
}