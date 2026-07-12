

import { useState } from 'react';
import { Plus, GripVertical, Loader2 } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from 'next-i18next';

export default function CategoryManagementSection() {
    const { t } = useTranslation('common');
    const { categories, isLoading, addCategory, reorderCategories } = useCategories();
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [showAddInput, setShowAddInput] = useState(false);

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;

        setIsAdding(true);
        const success = await addCategory(newCategoryName.trim());
        if (success) {
            setNewCategoryName('');
            setShowAddInput(false);
        }
        setIsAdding(false);
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData('dragIndex', index.toString());
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData('dragIndex'));

        if (dragIndex === dropIndex) return;

        // 새 순서 계산
        const newCategories = [...categories];
        const [draggedItem] = newCategories.splice(dragIndex, 1);
        newCategories.splice(dropIndex, 0, draggedItem);

        // 순서 업데이트
        const orders = newCategories.map((cat, idx) => ({
            id: cat.id,
            sort_order: idx,
        }));

        await reorderCategories(orders);
    };

    if (isLoading) {
        return (
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">{t('my_categories')}</h2>
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">{t('my_categories')}</h2>
                <span className="text-sm text-muted-foreground">{t('category_count', { count: categories.length })}</span>
            </div>

            {/* Category List */}
            <ScrollArea className="max-h-[300px] mb-4">
              <div className="space-y-1">
                {categories.map((category, index) => (
                    <div
                        key={category.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        className="flex items-center gap-3 px-3 py-2.5 bg-muted/50 rounded-lg group hover:bg-muted cursor-grab active:cursor-grabbing transition-colors"
                    >
                        <GripVertical
                            size={16}
                            className="text-muted-foreground group-hover:text-foreground shrink-0"
                        />
                        <span className="text-sm font-medium text-foreground flex-1">
                            {category.name}
                        </span>
                        {/* 삭제 버튼 숨김 처리 - 향후 활성화 가능 */}
                        {/* <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500">
              <Trash2 size={14} />
            </button> */}
                    </div>
                ))}
              </div>
            </ScrollArea>

            {/* Add Category */}
            {showAddInput ? (
                <div className="flex gap-2">
                    <Input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                        placeholder={t('category_name_placeholder')}
                        className="flex-1"
                        autoFocus
                    />
                    <Button
                        onClick={handleAddCategory}
                        disabled={isAdding || !newCategoryName.trim()}
                        size="sm"
                    >
                        {isAdding ? <Loader2 size={16} className="animate-spin" /> : t('add')}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setShowAddInput(false);
                            setNewCategoryName('');
                        }}
                    >
                        {t('cancel')}
                    </Button>
                </div>
            ) : (
                <Button
                    variant="outline"
                    onClick={() => setShowAddInput(true)}
                    className="w-full border-2 border-dashed border-border text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                >
                    <Plus size={16} />
                    <span className="text-sm font-medium">{t('category_add')}</span>
                </Button>
            )}
        </div>
    );
}
