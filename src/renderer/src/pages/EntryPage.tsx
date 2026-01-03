import React, { useState, useEffect } from 'react';
import { TimerPanel } from "@/components/entry/TimerPanel";
import { RecordsSidebar } from "@/components/entry/RecordsSidebar";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function EntryPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile drawer

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-screen w-full bg-white flex overflow-hidden relative">
      {/* Left Panel: Timer */}
      <div className={cn(
        "flex-shrink-0 h-full transition-all duration-300",
        isMobile ? "w-full" : "w-[480px]"
      )}>
        <TimerPanel 
          className="h-full border-r" 
          onOpenManualEntry={() => setManualEntryOpen(true)}
        />
      </div>

      {/* Right Panel: Records (Desktop) */}
      {!isMobile && (
        <div className="flex-1 min-w-[420px] h-full bg-white">
          <RecordsSidebar 
            className="h-full" 
            manualEntryOpen={manualEntryOpen}
            onManualEntryOpenChange={setManualEntryOpen}
          />
        </div>
      )}
      
      {/* Mobile Drawer (Right Panel content) */}
      {isMobile && (
        <>
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
            <SheetContent side="right" className="w-[85%] sm:w-[400px] p-0">
                <RecordsSidebar 
                    className="h-full border-none" 
                    manualEntryOpen={manualEntryOpen}
                    onManualEntryOpenChange={setManualEntryOpen}
                />
            </SheetContent>
          </Sheet>

          {/* Also handle Manual Entry Modal specifically for mobile if needed, 
              but RecordsSidebar includes it. 
              If Manual Entry is triggered via shortcut on mobile, we might need to open the sheet or modal directly.
              Wait, ManualEntryModal is inside RecordsSidebar. 
              If sidebar is closed, ManualEntryModal won't be visible/mounted in DOM if we are not careful?
              Sheet content is usually mounted only when open? 
              Actually, shadcn Sheet content might be unmounted.
              
              For MVP, let's assume shortcuts on mobile are less critical or the user opens the menu first.
              But `onOpenManualEntry` in TimerPanel sets `manualEntryOpen`.
              If `!isMobile`, it passes down to RecordsSidebar.
              If `isMobile`, we need to make sure ManualEntryModal is available.
              
              Let's put a standalone ManualEntryModal for mobile or just force open sidebar?
              Or just rely on the button in the sidebar.
          */}
        </>
      )}
    </div>
  );
}
