import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Smartphone } from 'lucide-react';
import { useTranslation } from 'next-i18next';

interface iOSGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function iOSGuideModal({ isOpen, onClose }: iOSGuideModalProps) {
    const { t } = useTranslation('common');

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-primary" />
                        {t('ios_guide_title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('ios_guide_desc')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Method 1 */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                            <div className="bg-primary/10 p-1 rounded text-primary">1</div>
                            {t('ios_guide_method1_title')}
                        </h3>
                        <p className="text-xs text-muted-foreground pl-6" dangerouslySetInnerHTML={{ __html: t('ios_guide_method1_desc') }} />
                    </div>

                    {/* Method 2 */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                            <div className="bg-primary/10 p-1 rounded text-primary">2</div>
                            {t('ios_guide_method2_title')}
                        </h3>
                        <p className="text-xs text-muted-foreground pl-6" dangerouslySetInnerHTML={{ __html: t('ios_guide_method2_desc') }} />
                    </div>

                    {/* Method 3 */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <div className="bg-primary/10 p-1 rounded text-primary">3</div>
                                {t('ios_guide_method3_title')}
                            </h3>
                            <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase font-bold tracking-tight">Pro</span>
                        </div>
                        <div className="pl-6 space-y-3">
                            <p className="text-xs text-muted-foreground">
                                {t('ios_guide_method3_desc')}
                            </p>

                            <div className="bg-muted p-2.5 rounded-lg border border-border space-y-2">
                                <p className="text-[10px] font-mono text-muted-foreground bg-background p-2 rounded border border-border break-all">
                                    https://{typeof window !== 'undefined' ? window.location.hostname : 'your-refine-domain'}/share?link=[URL]
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-7 text-[10px] w-full gap-1" onClick={() => {
                                        const url = `https://${window.location.host}/share?link=`;
                                        navigator.clipboard.writeText(url);
                                    }}>
                                        <Copy size={12} /> {t('ios_guide_copy_url')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" onClick={onClose} className="text-xs h-9">{t('close')}</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
