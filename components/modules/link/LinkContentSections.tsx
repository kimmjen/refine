import { useTranslation } from 'next-i18next';

interface LinkContentSectionProps {
    title: string;
    content?: string | null;
    placeholder?: string;
}

export function LinkContentSection({ title, content, placeholder }: LinkContentSectionProps) {
    if (!content && !placeholder) return null;

    return (
        <div className="prose prose-gray dark:prose-invert max-w-none mb-6">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                {title}
            </h3>
            <p className="text-foreground whitespace-pre-line text-lg leading-relaxed">
                {content || <span className="text-muted-foreground italic">{placeholder}</span>}
            </p>
        </div>
    );
}

// Note 섹션 (사용자 메모)
export function NoteSection({ description }: { description?: string | null }) {
    const { t } = useTranslation('common');
    return (
        <LinkContentSection
            title={t('note')}
            content={description}
            placeholder={t('no_notes')}
        />
    );
}

// Contents 섹션 (스크랩한 본문 내용 - 향후 확장)
export function ContentsSection({ contents }: { contents?: string | null }) {
    if (!contents) return null;

    return (
        <div className="prose prose-gray dark:prose-invert max-w-none mb-6 bg-muted/50 rounded-xl p-4 border border-border">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                Contents
            </h3>
            <div className="text-foreground text-base leading-relaxed max-h-[300px] overflow-y-auto">
                {contents}
            </div>
        </div>
    );
}
