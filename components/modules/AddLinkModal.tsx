import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, ClipboardPaste } from 'lucide-react';
import Link from 'next/link';
import { formatDate, cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from 'next-i18next';

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialUrl?: string;
}

interface DuplicateInfo {
  isDuplicate: boolean;
  existingLink?: { id: number; title: string; created_at: string; };
}

export default function AddLinkModal({ isOpen, onClose, onSuccess, initialUrl }: AddLinkModalProps) {
  const { session } = useAuth();
  const { t } = useTranslation('common');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ url: '', title: '', description: '' });
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  useEffect(() => {
    if (!formData.url || formData.url.length < 10) { setDuplicateInfo(null); return; }
    try { new URL(formData.url); } catch { setDuplicateInfo(null); return; }
    setCheckingDuplicate(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-duplicate?url=${encodeURIComponent(formData.url)}`, { headers: session ? { 'Authorization': `Bearer ${session.access_token}` } : {} });
        if (res.ok) setDuplicateInfo(await res.json());
      } catch (e) { console.error(e); }
      finally { setCheckingDuplicate(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.url, session]);

  useEffect(() => {
    if (!isOpen) {
      setFormData({ url: '', title: '', description: '' });
      setDuplicateInfo(null);
      setError('');
    } else if (initialUrl) {
      setFormData({ url: initialUrl, title: '', description: '' });
    }
  }, [isOpen, initialUrl]);

  const saveLink = async () => {
    if (!session) { setError('Please sign in'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/save-shared-content', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` }, body: JSON.stringify(formData) });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      const { linkId } = await res.json();

      if (linkId) {
        fetch('/api/enrich-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ linkId, url: formData.url }),
        }).catch(() => { /* fire-and-forget */ });
      }

      onSuccess(); onClose();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to save'); }
    finally { setLoading(false); }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setFormData({ ...formData, url: text });
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      // Fallback or error message if needed
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm rounded-xl p-5">
        <DialogHeader><DialogTitle className="text-base font-semibold">{t('add_link_title')}</DialogTitle><DialogDescription className="text-xs">{t('add_link_desc')}</DialogDescription></DialogHeader>
        {error && <Alert variant="destructive" className="py-2 text-[10px]"><AlertTriangle className="h-3 w-3" /><AlertDescription className="text-[10px]">{error}</AlertDescription></Alert>}
        <div className="space-y-3 py-2">
          <div className="relative">
            <Input placeholder="https://..." value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} className={cn("h-9 text-sm pr-10", duplicateInfo?.isDuplicate && "border-amber-300")} />
            {!formData.url && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePaste}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-primary"
                title={t('add_link_paste')}
              >
                <ClipboardPaste size={16} />
              </Button>
            )}
            {checkingDuplicate && <Loader2 size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />}
          </div>
          {duplicateInfo?.isDuplicate && duplicateInfo.existingLink && (
            <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-[10px] font-medium flex justify-between items-center">
              <span>{t('saved_on', { date: formatDate(duplicateInfo.existingLink.created_at) })}</span>
              <Link href={`/link/${duplicateInfo.existingLink.id}`} onClick={onClose} className="font-bold underline">{t('view')}</Link>
            </div>
          )}
          <Input placeholder={t('add_link_title_placeholder')} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="h-9 text-sm" />
          <Textarea placeholder={t('add_link_notes_placeholder')} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="text-sm min-h-[60px]" />
        </div>
        <DialogFooter className="pt-2">
          {duplicateInfo?.isDuplicate ? (
            <div className="flex w-full gap-2">
              <Button variant="ghost" className="flex-1 h-9 text-xs" onClick={onClose}>{t('cancel')}</Button>
              <Button className="flex-1 h-9 text-xs bg-amber-500 hover:bg-amber-600" onClick={saveLink} disabled={loading}>{loading ? <Loader2 size={14} className="animate-spin" /> : t('add_link_save_anyway')}</Button>
            </div>
          ) : (
            <Button className="w-full h-9 text-xs" onClick={saveLink} disabled={loading || checkingDuplicate}>{loading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}{loading ? t('add_link_saving') : t('add_link_save')}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
