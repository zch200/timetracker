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
import { Label } from "@/components/ui/label";
import { ActivityAutocomplete } from "./ActivityAutocomplete";
import { CategorySelect } from "./CategorySelect";
import { useTimeEntriesStore } from "@/store/timeEntriesStore";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Plus } from "lucide-react";
import { format } from 'date-fns';
import { ConflictDialog } from "./ConflictDialog";

interface ManualEntryModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ManualEntryModal({ open: externalOpen, onOpenChange: externalOnOpenChange }: ManualEntryModalProps) {
  const { selectedDate, fetchByDate } = useTimeEntriesStore();
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    activity: '',
    categoryId: ''
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
            date: selectedDate,
            startTime: dataToSave.startTime,
            endTime: dataToSave.endTime,
            activity: dataToSave.activity,
            categoryId: Number(dataToSave.categoryId)
        });

        toast.success("添加成功");
        setOpen(false);
        resetForm();
        fetchByDate(selectedDate);
        setConflictData(null);
    } catch (error) {
        console.error(error);
        toast.error("添加失败");
    }
  };

  const handleSubmit = async () => {
    if (!formData.startTime || !formData.endTime || !formData.activity || !formData.categoryId) {
      toast.error("请填写所有必填项");
      return;
    }

    try {
      const conflicts = await api.checkTimeConflict({
        date: selectedDate,
        startTime: formData.startTime,
        endTime: formData.endTime
      });

      if (conflicts.length > 0) {
        setConflictData({
          conflicts,
          pendingData: { ...formData }
        });
        return;
      }

      await performSave();
    } catch (error) {
      console.error(error);
      toast.error("添加失败");
    }
  };

  // Shortcut Cmd+N to open handled in TimerPanel/Global Hook now, 
  // but if this component is used independently, it might need its own listener.
  // However, RecordsSidebar uses this. Let's keep the hook there or move it up.
  // Actually, we want Cmd+N to work globally. 
  // In `useGlobalShortcuts`, we have `onOpenManualEntry`. 
  // This component is mounted in `RecordsSidebar`. 
  // We need to expose a way to open it.
  // For now, let's keep the internal listener if `externalOpen` is not provided.
  React.useEffect(() => {
    if (externalOpen !== undefined) return; // Controlled mode

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
                  <span className="text-right text-sm font-medium">分类</span>
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

      {conflictData && (
        <ConflictDialog 
          conflicts={conflictData.conflicts}
          onConfirm={() => performSave(conflictData.pendingData)}
          onCancel={() => setConflictData(null)}
        />
      )}
    </>
  );
}
