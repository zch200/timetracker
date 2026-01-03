import React, { useState, useEffect } from 'react';
import { SwitchPanel } from "@/components/entry/SwitchPanel";
import { RecordsSidebar } from "@/components/entry/RecordsSidebar";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function EntryPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-screen w-full bg-white flex overflow-hidden relative">
      {/* Main Panel: Switcher */}
      <div className={cn(
        "flex-shrink-0 h-full transition-all duration-300 bg-slate-50/30",
        isMobile ? "w-full" : "w-[50%]"
      )}>
        <SwitchPanel />
      </div>

      {/* Right Panel: Records (Desktop) */}
      {!isMobile && (
        <div className="flex-1 min-w-[420px] h-full bg-white border-l">
          <RecordsSidebar 
            className="h-full" 
            manualEntryOpen={manualEntryOpen}
            onManualEntryOpenChange={setManualEntryOpen}
          />
        </div>
      )}
      
      {/* Mobile Drawer (Right Panel content) */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
              <Button 
                  variant="outline" 
                  size="icon" 
                  className="absolute top-4 right-4 z-20 bg-white shadow-sm"
              >
                  <Menu className="h-5 w-5" />
              </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[90%] sm:w-[450px] p-0">
              <RecordsSidebar 
                  className="h-full border-none" 
                  manualEntryOpen={manualEntryOpen}
                  onManualEntryOpenChange={setManualEntryOpen}
              />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
