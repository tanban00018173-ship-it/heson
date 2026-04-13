import React from 'react';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CTASection() {
  return (
    <section className="py-24 bg-stone-800 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 left-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-stone-600/20 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white leading-tight">
            準備好享受
            <span className="block font-medium text-amber-400 mt-2">潔淨舒適的居家生活了嗎？</span>
          </h2>
          
          <p className="text-stone-400 text-lg mt-6 max-w-xl mx-auto">
            立即預約免費試掃，讓 HESON 專業團隊為您服務
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link to={createPageUrl("BookingForm")}>
              <Button 
                size="lg"
                className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-6 text-base rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                立即預約試掃
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="https://lin.ee/xKVxq7Y" target="_blank" rel="noopener noreferrer">
              <Button 
                variant="outline" 
                size="lg"
                className="border-stone-600 text-white hover:bg-stone-700 px-8 py-6 text-base rounded-full"
              >
                <MessageCircle className="mr-2 w-5 h-5" />
                LINE 聯繫我們
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}