import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { Plus, LayoutGrid, List as ListIcon, Search, X, Loader2, Eye, EyeOff, RefreshCcw, TrendingUp, Clock, CheckCircle2, ArrowUpDown, AlertCircle, ClipboardPaste, HelpCircle } from 'lucide-react';
import LayoutShell from '@/components/layout/LayoutShell';
import LinkCard from '@/components/modules/LinkCard';
import { cn } from '@/lib/utils';
import { CATEGORIES } from '@/lib/constants';
import RefineLogo from '@/components/common/RefineLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useLinks } from '@/hooks/useLinks';
import { useToast } from '@/components/common/Toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import nextI18NextConfig from '@/next-i18next.config.js';

export const getServerSideProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
  },
});

const AddLinkModal = dynamic(() => import('@/components/modules/AddLinkModal'), {
  loading: () => null,
  ssr: false
});

const IOSGuideModal = dynamic(() => import('@/components/modules/iOSGuideModal'), {
  loading: () => null,
  ssr: false
});

export default function Home() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useTranslation('common');

  const { toast } = useToast();

  // UI-only state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isiOSGuideOpen, setIsiOSGuideOpen] = useState(false);
  const [isiOS, setIsiOS] = useState(false);
  const [prefilledUrl, setPrefilledUrl] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showRead, setShowRead] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'platform' | 'category'>('created_at');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Data logic — delegated to custom hook
  const {
    links, isLoadingLinks, isLoadingMore, hasMore,
    totalCount, readCount, unreadCount, page,
    error: linksError, loadMoreRef, refresh, toggleRead,
  } = useLinks({ showRead, selectedCategory, searchQuery, sortBy, sortOrder });

  useEffect(() => {
    setIsiOS(/iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  const handleQuickSave = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text?.trim() ?? '';
      if (!trimmed) {
        toast(t('clipboard_empty'), 'info');
        return;
      }
      try {
        new URL(trimmed);
      } catch {
        toast(t('clipboard_not_url'), 'info');
        return;
      }
      setPrefilledUrl(trimmed);
      setIsModalOpen(true);
    } catch {
      toast(t('clipboard_read_failed'), 'error');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setPrefilledUrl(undefined);
  };

  // Recent links for display
  const recentLinks = links.slice(0, 3);

  if (!authLoading && !user) {
    return (
      <LayoutShell title="Refine">
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
          <RefineLogo size={28} className="mb-6 opacity-60" />
          <h1 className="text-xl font-semibold mb-2">{t('landing_tagline')}</h1>
          <p className="text-sm text-muted-foreground mb-8 max-w-xs">{t('landing_subtitle')}</p>
          <Button onClick={() => router.push('/auth/login')} className="h-9 px-5 text-xs font-medium">{t('landing_cta')}</Button>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell title="Library | Refine">
      <AddLinkModal isOpen={isModalOpen} onClose={handleModalClose} onSuccess={refresh} initialUrl={prefilledUrl} />
      <IOSGuideModal isOpen={isiOSGuideOpen} onClose={() => setIsiOSGuideOpen(false)} />

      <div className="max-w-6xl mx-auto pt-6 px-4 pb-20 space-y-6">
        {/* Bento Grid Stats Section */}
        <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
          <Card className="col-span-2 row-span-2 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setIsModalOpen(true)}>
            <CardContent className="flex flex-col items-center justify-center h-full py-8">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center mb-3">
                <Plus className="h-6 w-6 text-primary-foreground" />
              </div>
              <p className="text-sm font-medium">{t('add_link')}</p>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1"><TrendingUp size={12} />{t('total')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-bold">{totalCount}</p>
            </CardContent>
          </Card>

          {isiOS && (
            <Card className="col-span-4 md:col-span-2 bg-primary/5 border-primary/20 flex flex-col justify-between cursor-pointer hover:bg-primary/10 transition-colors" onClick={handleQuickSave}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-[10px] uppercase tracking-wider text-primary font-bold flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1"><ClipboardPaste size={12} /> {t('quick_save')}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setIsiOSGuideOpen(true); }}
                    className="text-muted-foreground hover:text-primary"
                    aria-label={t('ios_help')}
                  >
                    <HelpCircle size={12} />
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-[11px] font-medium leading-tight">{t('quick_save_desc')}</p>
              </CardContent>
            </Card>
          )}

          <Card className="col-span-2 md:col-span-1">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1"><Clock size={12} />{t('unread')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-bold text-amber-500">{unreadCount}</p>
            </CardContent>
          </Card>

          <Card className="col-span-2 md:col-span-1">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1"><CheckCircle2 size={12} />{t('read')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-bold text-green-500">{readCount}</p>
            </CardContent>
          </Card>

          <Card className="col-span-4 md:col-span-2 row-span-1">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-medium">{t('recently_added')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {recentLinks.length > 0 ? recentLinks.map(link => (
                <div key={link.id} className="text-xs truncate text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => router.push(`/link/${link.id}`)}>
                  {link.title || new URL(link.url).hostname}
                </div>
              )) : <p className="text-xs text-muted-foreground">{t('no_links_yet')}</p>}
            </CardContent>
          </Card>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/50">
          <h2 className="text-sm font-medium">{t('all_links')} <span className="text-muted-foreground">({totalCount})</span></h2>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5">
                  <ArrowUpDown size={12} />
                  {sortBy === 'created_at' && (sortOrder === 'desc' ? t('sort_newest') : t('sort_oldest'))}
                  {sortBy === 'title' && (sortOrder === 'asc' ? 'A-Z' : 'Z-A')}
                  {sortBy === 'platform' && t('sort_platform')}
                  {sortBy === 'category' && t('sort_category')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl p-1">
                <DropdownMenuItem onClick={() => { setSortBy('created_at'); setSortOrder('desc'); }} className="rounded-lg text-xs">
                  {t('sort_newest_first')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('created_at'); setSortOrder('asc'); }} className="rounded-lg text-xs">
                  {t('sort_oldest_first')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('title'); setSortOrder('asc'); }} className="rounded-lg text-xs">
                  {t('sort_title_az')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('title'); setSortOrder('desc'); }} className="rounded-lg text-xs">
                  {t('sort_title_za')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('platform'); setSortOrder('asc'); }} className="rounded-lg text-xs">
                  {t('sort_platform')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('category'); setSortOrder('asc'); }} className="rounded-lg text-xs">
                  {t('sort_category')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'list')} className="h-8 bg-muted rounded-md p-0.5">
              <TabsList className="bg-transparent h-full">
                <TabsTrigger value="grid" className="h-full px-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm"><LayoutGrid size={14} /></TabsTrigger>
                <TabsTrigger value="list" className="h-full px-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm"><ListIcon size={14} /></TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <Input placeholder={t('search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-9 pl-8 pr-8 text-sm rounded-md" />
            {searchQuery && <Button variant="ghost" size="icon" onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"><X size={14} /></Button>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowRead(!showRead)} className={cn("h-9 px-3 text-xs gap-1.5", !showRead && "bg-muted")}>
              {showRead ? <Eye size={14} /> : <EyeOff size={14} />}
              {showRead ? t('all_links') : t('unread')}
            </Button>
            <Button variant="outline" size="icon" onClick={refresh} className="h-9 w-9"><RefreshCcw size={14} /></Button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <Button variant={selectedCategory === null ? "secondary" : "ghost"} size="sm" onClick={() => setSelectedCategory(null)} className="h-7 px-2.5 text-[10px] font-medium rounded-md shrink-0">{t('all')}</Button>
          {CATEGORIES.map(cat => (
            <Button key={cat} variant={selectedCategory === cat ? "secondary" : "ghost"} size="sm" onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)} className="h-7 px-2.5 text-[10px] font-medium rounded-md shrink-0">{cat}</Button>
          ))}
        </div>

        {/* Content */}
        {isLoadingLinks ? (
          <div className={cn("grid gap-3", viewMode === 'grid' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1")}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg border border-border/50 overflow-hidden">
                {viewMode === 'grid' ? (
                  <>
                    <div className="aspect-[16/9] bg-muted" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3 p-3">
                    <div className="h-4 w-4 bg-muted rounded" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-muted rounded w-2/3" />
                      <div className="h-2.5 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : linksError ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-destructive/30 rounded-lg gap-3">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-sm font-medium text-destructive">{linksError}</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={refresh}>{t('admin_refresh')}</Button>
          </div>
        ) : links.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-lg gap-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{t('no_items_found')}</p>
            <p className="text-xs text-muted-foreground/70">
              {searchQuery || selectedCategory ? t('try_adjusting_filters') : t('start_adding_link')}
            </p>
            {!searchQuery && !selectedCategory && (
              <Button size="sm" className="mt-2" onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> {t('add_link')}
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className={cn("grid gap-3", viewMode === 'grid' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1")}>
              {links.map((link, i) => <LinkCard key={link.id} link={link} delay={i} onToggleRead={toggleRead} viewMode={viewMode} />)}
            </div>

            {/* Infinite Scroll Trigger */}
            <div ref={loadMoreRef} className="py-4 flex justify-center">
              {isLoadingMore && <Loader2 className="animate-spin text-muted-foreground" size={20} />}
              {!hasMore && links.length > 20 && (
                <p className="text-xs text-muted-foreground">{t('all_items_loaded', { count: totalCount })}</p>
              )}
            </div>
          </>
        )}
      </div>
    </LayoutShell>
  );
}
