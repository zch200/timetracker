import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { useCategoriesStore } from "@/store/categoriesStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryFormModal } from "./CategoryFormModal";
import { toast } from "react-hot-toast";

export function CategoryManagement() {
  const { categories, fetchCategories, deleteCategory } = useCategoriesStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const category = categories.find(c => c.id === id);
    if (!category) return;

    // Phase 2 logic checks for关联记录 in main process
    try {
      await deleteCategory(id);
      toast.success("分类已删除");
    } catch (error: any) {
      toast.error(error.message || "删除失败");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Tag className="h-5 w-5 text-purple-500" />
            分类管理
          </CardTitle>
          <CardDescription>
            管理您的事项分类，支持自定义名称和颜色。
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => {
          setEditingCategory(null);
          setIsModalOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-1" /> 新增分类
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {categories.map((category) => (
            <div 
              key={category.id} 
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-medium">{category.name}</span>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  {category.entry_count || 0} 条记录
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-400 hover:text-blue-600"
                  onClick={() => handleEdit(category)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-400 hover:text-red-600"
                  onClick={() => handleDelete(category.id)}
                  disabled={categories.length <= 1} // At least one category
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingCategory}
      />
    </Card>
  );
}

