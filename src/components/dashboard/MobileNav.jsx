import React, { useState } from 'react';
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Menu, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";


export default function MobileNav({ userRole = 'client', userName = '' }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const clientLinks = [
    { name: "個人資料", path: "ClientProfile", icon: User },
  ];

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-stone-200">
      <div className="flex items-center justify-between px-4 py-3">
        <Link to={createPageUrl("Home")} className="cursor-pointer hover:opacity-80 transition-opacity">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6945eb37fb67abb9152e42a5/b0c86a022_557043631_1369298458531323_7985963993755754895_n.jpg"
            alt="HESON"
            className="h-8 w-auto"
          />
        </Link>
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="p-2">
              <Menu className="w-6 h-6 text-stone-600" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <div className="p-6 border-b border-stone-100">
              <p className="text-sm text-stone-500">
                您好，{userName || '訪客'}
              </p>
            </div>
            <nav className="p-4">
              <ul className="space-y-1">
                {clientLinks.map((link) => {
                  const isActive = location.pathname.includes(link.path);
                  return (
                    <li key={link.path}>
                      <Link
                        to={createPageUrl(link.path)}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-amber-50 text-amber-700'
                            : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'
                        }`}
                      >
                        <link.icon className={`w-5 h-5 ${isActive ? 'text-amber-600' : 'text-stone-400'}`} />
                        {link.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-stone-100">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-700 w-full transition-all"
              >
                <LogOut className="w-5 h-5" />
                登出
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}