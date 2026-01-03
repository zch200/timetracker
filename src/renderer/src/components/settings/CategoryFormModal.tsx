import React, { useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategoriesStore } from "@/store/categoriesStore";
import { toast } from "react-hot-toast";

const categorySchema = z.object({
  name: z.string().min(1, "名称不能为空").max(20, "名称过长"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "颜色格式错误"),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export function CategoryFormModal({ isOpen, onClose, initialData }: CategoryFormModalProps) {
  const { createCategory, updateCategory } = useCategoriesStore();
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      color: '#3b82f6',
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        color: initialData.color,
      });
    } else {
      reset({
        name: '',
        color: '#3b82f6',
      });
    }
  }, [initialData, reset, isOpen]);

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      if (initialData) {
        await updateCategory(initialData.id, data);
        toast.success("分类已更新");
      } else {
        await createCategory(data);
        toast.success("分类已创建");
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message || "操作失败");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? '编辑分类' : '新增分类'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">分类名称</label>
            <Input {...register("name")} placeholder="例如：工作、生活..." />
            {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">颜色</label>
            <div className="flex gap-4">
              <Input 
                type="color" 
                {...register("color")} 
                className="w-12 h-10 p-1 rounded-md" 
              />
              <Input 
                {...register("color")} 
                placeholder="#000000" 
                className="flex-1"
              />
            </div>
            {errors.color && <span className="text-xs text-red-500">{errors.color.message}</span>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={isSubmitting}>
              {initialData ? '更新' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

