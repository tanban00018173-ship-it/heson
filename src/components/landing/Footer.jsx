import React from 'react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400 py-16">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6945eb37fb67abb9152e42a5/b0c86a022_557043631_1369298458531323_7985963993755754895_n.jpg"
                alt="HESON"
                className="h-10 w-auto"
              />
            </div>
            <p className="text-sm leading-relaxed">
              赫頌家事管理<br />
              用心呵護您的居家環境
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-white font-medium mb-4">快速連結</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to={createPageUrl("Home")} className="hover:text-amber-400 transition-colors">
                  首頁
                </Link>
              </li>
              <li>
                <Link to={createPageUrl("About")} className="hover:text-amber-400 transition-colors">
                  關於我們
                </Link>
              </li>
              <li>
                <Link to={createPageUrl("BookingForm")} className="hover:text-amber-400 transition-colors">
                  立即預約
                </Link>
              </li>
              <li>
                <Link to={createPageUrl("FAQ")} className="hover:text-amber-400 transition-colors">
                  常見問題
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Services */}
          <div>
            <h4 className="text-white font-medium mb-4">服務項目</h4>
            <ul className="space-y-3 text-sm">
              <li>基礎月護方案</li>
              <li>進階月安方案</li>
              <li>尊榮月恆方案</li>
              <li>單次清潔服務</li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h4 className="text-white font-medium mb-4">聯絡資訊</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>台北市、新北市、宜蘭縣</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-amber-500" />
                <span>0900-000-000</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-amber-500" />
                <span>service@heson.tw</span>
              </li>
              <li>
                <a 
                  href="https://line.me" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors mt-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  加入官方 LINE
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-stone-800 mt-12 pt-8 text-center text-xs">
          <p>© 2024 HESON 赫頌家事管理. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}