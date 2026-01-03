import React, { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActivityAutocomplete } from "./ActivityAutocomplete";
import { CategorySelect } from "./CategorySelect";
import { useTimeEntriesStore } from "@/store/timeEntriesStore";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Plus } from "lucide-react";
import { ConflictDialog } from "./ConflictDialog";

interface ManualEntryModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ManualEntryModal({ open: externalOpen, onOpenChange: externalOnOpenChange }: ManualEntryModalProps) {
  const { selectedDate, fetchByDate, detectGaps } = useTimeEntriesStore();
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    activity: '',
    categoryId: '' // This will map to optionId of the primary dimension
  });

  const [conflictData, setConflictData] = useState<{
    conflicts: any[];
    pendingData: any;
  } | null>(null);

  const resetForm = () => {
    setFormData({
      startTime: '',
      endTime: '',
      activity: '',
      categoryId: ''
    });
  };

  const performSave = async (data?: any) => {
    const dataToSave = data || formData;
    try {
        await api.createTimeEntry({
            startTime: `${selectedDate}T${dataToSave.startTime}:00`,
            endTime: `${selectedDate}T${dataToSave.endTime}:00`,
            title: dataToSave.activity,
            optionIds: [Number(dataToSave.categoryId)] // Simple mapping for now
        });

        toast.success("添加成功");
        setOpen(false);
        resetForm();
        fetchByDate(selectedDate);
        detectGaps(selectedDate);
        setConflictData(null);
    } catch (error: any) {
        console.error(error);
        toast.error(error.message || "添加失败");
    }
  };

  // ... Conflict check removed or simplified for now as API changed ...
  // Actually, conflict check endpoint might need update or removal from API if unused.
  // For MVP V3, let's skip conflict check in manual entry for simplicity or implement later.
  
  const handleSubmit = async () => {
    if (!formData.startTime || !formData.endTime || !formData.activity || !formData.categoryId) {
      toast.error("请填写所有必填项");
      return;
    }
    
    // Direct save for now
    await performSave();
  };

  React.useEffect(() => {
    if (externalOpen !== undefined) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [externalOpen, setOpen]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setOpen}>
        {!externalOpen && (
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full border-dashed text-slate-500 hover:text-slate-900">
                <Plus className="w-4 h-4 mr-2" />
                手动添加时间段
                </Button>
            </DialogTrigger>
        )}
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>手动添加时间段</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-right text-sm font-medium">日期</span>
                  <span className="col-span-3 text-sm">{selectedDate}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-right text-sm font-medium">时间</span>
                  <div className="col-span-3 flex items-center gap-2">
                      <Input 
                          type="time" 
                          value={formData.startTime} 
                          onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                      />
                      <span>-</span>
                      <Input 
                          type="time" 
                          value={formData.endTime} 
                          onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                      />
                  </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-right text-sm font-medium">事项</span>
                  <div className="col-span-3">
                      <ActivityAutocomplete 
                          value={formData.activity} 
                          onChange={(val) => setFormData({...formData, activity: val})}
                      />
                  </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-right text-sm font-medium">标签</span>
                  <div className="col-span-3">
                      <CategorySelect 
                          value={formData.categoryId} 
                          onValueChange={(val) => setFormData({...formData, categoryId: val})}
                      />
                  </div>
              </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
