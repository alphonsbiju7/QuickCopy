import { Bell, Menu, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import AdminSidebar from "./admin-sidebar";


export default function AdminHeader({ title = "File Management", subtitle = "Manage student file submissions and downloads" }: { title?: string; subtitle?: string; }) {
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


return (
<header className="bg-white shadow-sm border-b border-slate-200 px-3 sm:px-4 lg:px-6 py-4" data-testid="admin-header">
<div className="flex items-center justify-between">
<div className="flex items-center space-x-3">
{/* Mobile menu button */}
<Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
<SheetTrigger asChild>
<Button variant="ghost" size="icon" className="lg:hidden" data-testid="button-mobile-menu">
<Menu className="h-5 w-5" />
</Button>
</SheetTrigger>
<SheetContent side="left" className="p-0 w-64">
<div className="h-full" onClick={() => setIsMobileMenuOpen(false)}>
<AdminSidebar />
</div>
</SheetContent>
</Sheet>


{/* Mobile logo */}
<div className="flex items-center space-x-2 lg:hidden">
<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
<Copy className="text-white" size={16} />
</div>
<span className="font-bold text-slate-900">QuickCopy</span>
</div>


{/* Desktop title */}
<div className="hidden lg:block">
<h1 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h1>
<p className="text-xs sm:text-sm text-slate-500 hidden sm:block">{subtitle}</p>
</div>
</div>


<div className="flex items-center space-x-2 sm:space-x-4">
<Button variant="outline" size="icon" className="relative" data-testid="button-notifications">
<Bell className="h-4 w-4" />
<span className="absolute -top-1 -right-1 h-2 w-2 sm:h-3 sm:w-3 bg-red-500 rounded-full"></span>
</Button>
</div>
</div>
</header>
);
}