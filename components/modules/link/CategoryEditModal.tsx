import { CATEGORIES } from '@/lib/constants';
import { useTranslation } from 'next-i18next';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from '@/lib/utils';

interface CategoryEditModalProps {
    isOpen: boolean;
    currentCategory: string;
    onClose: () => void;
    onSelect: (category: string) => void;
}

export default function CategoryEditModal({
    isOpen,
    currentCategory,
    onClose,
    onSelect
}: CategoryEditModalProps) {
    const { t } = useTranslation('common');
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md rounded-3xl p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-black text-text-head tracking-tight">{t('link_change_category')}</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-3 gap-2 pb-2">
                    {CATEGORIES.map(cat => (
                        <Button
                            key={cat}
                            variant={currentCategory === cat ? "default" : "outline"}
                            onClick={() => onSelect(cat)}
                            className={cn(
                                "h-12 rounded-2xl text-[11px] font-black tracking-tighter transition-all duration-300",
                                currentCategory === cat
                                    ? "bg-primary text-primary-foreground shadow-xl border-none scale-105"
                                    : "bg-white/50 dark:bg-white/5 border-border/40 text-muted-foreground hover:bg-white dark:hover:bg-white/10 hover:border-primary/30 hover:text-foreground"
                            )}
                        >
                            {cat}
                        </Button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
