import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Loader2, AlertTriangle, ExternalLink, Sparkles } from 'lucide-react';
import Head from 'next/head';
import { CATEGORIES } from '@/lib/constants';
import { formatDate, cn } from '@/lib/utils';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import RefineLogo from '@/components/common/RefineLogo';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '@/next-i18next.config.js';
import type { GetStaticProps } from 'next';

interface DuplicateInfo {
  isDuplicate: boolean;
  existingLink?: {
    id: number;
    title: string;
    created_at: string;
    category: string | null;
  };
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'], nextI18NextConfig)),
  },
});

export default function SharePage() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [status, setStatus] = useState<'analyzing' | 'ready' | 'saving' | 'success' | 'error'>('analyzing');
  const [linkData, setLinkData] = useState({ url: '', title: '', description: '' });
  const [selectedCategory, setSelectedCategory] = useState('Etc');
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;

    const { link, name, description, text, title } = router.query;
    let targetUrl = link as string;
    const combinedText = `${text || ''} ${description || ''}`;

    if (!targetUrl && combinedText) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const found = combinedText.match(urlRegex);
      if (found && found.length > 0) targetUrl = found[0];
    }

    if (!targetUrl) {
      if (Object.keys(router.query).length === 0) return;
      setStatus('error');
      setTimeout(() => router.replace('/'), 2000);
      return;
    }

    setLinkData({
      url: targetUrl,
      title: (name as string) || (title as string) || t('shared_link'),
      description: (description as string) || (text as string) || ''
    });

    checkDuplicate(targetUrl);
  }, [router.isReady, router.query]);

  const getAuthHeaders = async (): Promise<HeadersInit> => {
    const supabase = createSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` };
    }
    return { 'Content-Type': 'application/json' };
  };

  const checkDuplicate = async (url: string) => {
    setCheckingDuplicate(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/check-duplicate?url=${encodeURIComponent(url)}`, { headers });
      const data = await res.json();
      setDuplicateInfo(data);
    } catch (err) {
      setDuplicateInfo({ isDuplicate: false });
    } finally {
      setCheckingDuplicate(false);
      setTimeout(() => setStatus('ready'), 500);
    }
  };

  const handleSave = async () => {
    setStatus('saving');
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/save-shared-content', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...linkData, category: selectedCategory }),
      });
      if (!response.ok) throw new Error(t('share_save_failed'));
      const { linkId } = await response.json();

      if (linkId) {
        fetch('/api/enrich-link', {
          method: 'POST',
          headers,
          body: JSON.stringify({ linkId, url: linkData.url }),
        }).catch(() => { /* fire-and-forget */ });
      }

      setStatus('success');
      setTimeout(() => router.replace('/?saved=true'), 1500);
    } catch (error) {
      setStatus('error');
      setTimeout(() => router.replace('/?error=save_failed'), 2000);
    }
  };

  const handleGoToExisting = () => {
    if (duplicateInfo?.existingLink) router.push(`/link/${duplicateInfo.existingLink.id}`);
  };

  // Loading/Status Screen
  if (status !== 'ready') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div key="success" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="h-20 w-20 bg-green-500 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={40} className="text-white" />
              </motion.div>
            ) : status === 'error' ? (
              <motion.div key="error" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="h-20 w-20 bg-destructive rounded-full flex items-center justify-center mb-6">
                <AlertCircle size={40} className="text-white" />
              </motion.div>
            ) : (
              <motion.div key="loading" className="mb-6">
                <Loader2 size={48} className="text-primary animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>
          <h2 className="text-xl font-semibold mb-2">
            {status === 'analyzing' ? t('analyzing') : status === 'saving' ? t('saving') : status === 'success' ? t('saved') : t('error')}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            {status === 'analyzing' ? t('share_analyzing') :
              status === 'saving' ? t('share_saving') :
                status === 'success' ? t('share_success') : t('share_error')}
          </p>
        </motion.div>
      </div>
    );
  }

  // Category Selection Screen
  return (
    <>
      <Head>
        <title>{t('save_to_refine')}</title>
        <meta name="theme-color" content="#ffffff" />
      </Head>

      <div className="min-h-screen bg-muted/30 px-4 py-12 flex flex-col items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="rounded-2xl border-border/50 shadow-lg">
            <CardHeader className="text-center pt-6 pb-4">
              <div className="flex justify-center mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-lg font-semibold">{t('save_to_refine')}</CardTitle>
              <CardDescription className="text-xs">{t('share_select_category')}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 px-5">
              {/* Link Preview */}
              <div className="bg-muted/50 p-4 rounded-xl space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground font-medium">{t('title')}</label>
                  <Input value={linkData.title} onChange={(e) => setLinkData({ ...linkData, title: e.target.value })} className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground font-medium">{t('note')}</label>
                  <Textarea value={linkData.description} onChange={(e) => setLinkData({ ...linkData, description: e.target.value })} rows={2} className="text-sm resize-none" />
                </div>
                <p className="text-[10px] text-muted-foreground truncate font-mono px-1">{linkData.url}</p>
              </div>

              {/* Duplicate Warning */}
              {duplicateInfo?.isDuplicate && duplicateInfo.existingLink && (
                <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 rounded-xl">
                  <AlertTriangle size={14} className="text-amber-500" />
                  <AlertTitle className="text-amber-800 dark:text-amber-200 text-xs font-semibold">{t('share_duplicate_title')}</AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-300 text-[10px] space-y-2">
                    <p className="truncate font-medium">"{duplicateInfo.existingLink.title}"</p>
                    <div className="flex items-center justify-between">
                      <span>{formatDate(duplicateInfo.existingLink.created_at)}</span>
                      <Button variant="ghost" size="sm" onClick={handleGoToExisting} className="h-6 text-[10px] text-amber-700">
                        <ExternalLink size={10} className="mr-1" />{t('view')}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Category Grid */}
              <div className="grid grid-cols-3 gap-1.5">
                {CATEGORIES.map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn("h-9 text-[10px] font-medium rounded-lg", selectedCategory === cat ? "" : "text-muted-foreground")}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </CardContent>

            <CardFooter className="px-5 pb-5 pt-2">
              {duplicateInfo?.isDuplicate ? (
                <div className="w-full flex gap-2">
                  <Button variant="ghost" onClick={() => router.replace('/')} className="flex-1 h-10 text-xs">{t('share_cancel')}</Button>
                  <Button onClick={handleSave} className="flex-1 h-10 text-xs bg-amber-500 hover:bg-amber-600">{t('share_save_anyway')}</Button>
                </div>
              ) : (
                <Button onClick={handleSave} className="w-full h-11 text-sm font-medium" disabled={checkingDuplicate}>
                  {checkingDuplicate ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  {t('share_save_to_library')}
                </Button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
