import { CheckCircle, RotateCcw, Trash2, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useTranslation } from 'next-i18next';

interface LinkActionButtonsProps {
    url: string;
    isRead: boolean;
    isDeleting: boolean;
    onToggleRead: () => void;
    onDelete: () => void;
}

export default function LinkActionButtons({
    url,
    isRead,
    isDeleting,
    onToggleRead,
    onDelete,
}: LinkActionButtonsProps) {
    const { t } = useTranslation('common');
    return (
        <div className="flex items-center gap-3 pt-6 mt-auto border-t border-border/50">
            <Button
                onClick={() => window.open(url, '_blank')}
                className="flex-1 h-12 rounded-2xl font-bold bg-text-head hover:bg-black text-white shadow-lg active:scale-[0.98] transition-all"
            >
                <ExternalLink size={16} className="mr-2" />
                {t('link_visit_website')}
            </Button>

            <Button
                size="icon"
                variant="ghost"
                onClick={onDelete}
                disabled={isDeleting}
                className="h-12 w-12 rounded-2xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-all"
            >
                <Trash2 size={20} />
            </Button>
        </div>
    );
}

// Header action button for Mark Read/Unread
export function ReadToggleButton({ isRead, onClick }: { isRead: boolean; onClick: () => void }) {
    const { t } = useTranslation('common');
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            className={`h-10 px-4 rounded-xl text-sm font-bold transition-all shadow-none border-border/50 ${isRead
                ? 'bg-muted/50 text-muted-foreground hover:bg-muted'
                : 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/50 border-green-100 dark:border-green-900'
                }`}
        >
            {isRead ? (
                <>
                    <RotateCcw size={16} className="mr-2" />
                    {t('link_mark_unread')}
                </>
            ) : (
                <>
                    <CheckCircle size={16} className="mr-2" />
                    {t('link_mark_read')}
                </>
            )}
        </Button>
    );
}
