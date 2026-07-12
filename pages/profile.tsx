

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { ArrowLeft, Download, LogOut, Loader2, Moon, Sun, Monitor, Sparkles, Bot, Zap, Tag, Languages } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import LayoutShell from '@/components/layout/LayoutShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/common/Toast';
import type { AiSettings, AiProvider } from '@/types/db';
import { DEFAULT_AI_SETTINGS } from '@/types/db';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '@/next-i18next.config.js';
import type { GetStaticProps } from 'next';

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'], nextI18NextConfig)),
  },
});

interface UserStats {
  totalLinks: number;
  readLinks: number;
  unreadLinks: number;
  platformStats: { platform: string; count: number }[];
}

type AiSettingsState = Omit<AiSettings, 'user_id' | 'updated_at'> & {
  _has_gemini_key?: boolean;
  _has_openai_key?: boolean;
  _has_claude_key?: boolean;
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation('common');

  // AI Settings
  const [aiSettings, setAiSettings] = useState<AiSettingsState>({ ...DEFAULT_AI_SETTINGS });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [keyDrafts, setKeyDrafts] = useState<Record<string, string>>({});

  useEffect(() => setMounted(true), []);
  useEffect(() => { if (!isLoading && !user) router.replace('/auth/login'); }, [user, isLoading, router]);

  // Helper: get auth header
  const getAuthHeader = async () => {
    const supabase = createSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token}` };
  };

  // Fetch AI settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      try {
        const headers = await getAuthHeader();
        const res = await fetch('/api/settings', { headers });
        if (res.ok) setAiSettings(await res.json());
      } catch { /* defaults */ }
      setLoadingSettings(false);
    };
    if (user) fetchSettings();
  }, [user]);

  // Update a single setting
  const updateSetting = async (key: string, value: unknown) => {
    setSavingSettings(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) throw new Error();
      const getRes = await fetch('/api/settings', { headers });
      if (getRes.ok) setAiSettings(await getRes.json());
      toast(t('settings_saved'), 'success');
    } catch {
      toast(t('settings_save_failed'), 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Save API key & activate provider
  const saveApiKey = async (field: string, provider: AiProvider) => {
    const keyVal = keyDrafts[field]?.trim();
    if (!keyVal) return;
    setSavingSettings(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: keyVal, ai_provider: provider }),
      });
      if (!res.ok) throw new Error();
      const getRes = await fetch('/api/settings', { headers });
      if (getRes.ok) setAiSettings(await getRes.json());
      setKeyDrafts(d => ({ ...d, [field]: '' }));
      toast(t('settings_key_saved'), 'success');
    } catch {
      toast(t('settings_key_save_failed'), 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Remove API key
  const removeApiKey = async (field: string) => {
    setSavingSettings(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: null, ai_provider: 'none' }),
      });
      if (!res.ok) throw new Error();
      const getRes = await fetch('/api/settings', { headers });
      if (getRes.ok) setAiSettings(await getRes.json());
      toast(t('settings_key_removed'), 'success');
    } catch {
      toast(t('settings_key_remove_failed'), 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      const supabase = createSupabaseBrowserClient();
      const [totalRes, readRes, platformRes] = await Promise.all([
        supabase.from('shared_links').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('shared_links').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', true),
        supabase.from('shared_links').select('platform').eq('user_id', user.id),
      ]);
      if (totalRes.error) { setLoadingStats(false); return; }
      const totalLinks = totalRes.count || 0;
      const readLinks = readRes.count || 0;
      const platformCounts: Record<string, number> = {};
      (platformRes.data || []).forEach((row: { platform: string | null }) => {
        const p = row.platform || 'Unknown';
        platformCounts[p] = (platformCounts[p] || 0) + 1;
      });
      const platformStats = Object.entries(platformCounts).map(([platform, count]) => ({ platform, count })).sort((a, b) => b.count - a.count);
      setStats({ totalLinks, readLinks, unreadLinks: totalLinks - readLinks, platformStats });
      setLoadingStats(false);
    };
    if (user) fetchStats();
  }, [user]);

  const handleSignOut = async () => { await signOut(); router.push('/'); };

  const [isExporting, setIsExporting] = useState(false);
  const handleExport = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: links } = await supabase.from('shared_links').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      const blob = new Blob([JSON.stringify({ user, links: links || [] }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `refine-export-${new Date().toISOString().split('T')[0]}.json`; a.click();
      URL.revokeObjectURL(url);
    } finally { setIsExporting(false); }
  };

  const handleBackfill = async () => {
    setIsBackfilling(true);
    let totalUpdated = 0;
    let totalErrors = 0;
    try {
      const headers = await getAuthHeader();
      let remaining = 1;
      while (remaining > 0) {
        const res = await fetch('/api/backfill-categories', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' } });
        if (!res.ok) { const r = await res.json(); toast(r.error || t('error'), 'error'); break; }
        const result = await res.json();
        totalUpdated += result.updated ?? 0;
        totalErrors += result.errors ?? 0;
        remaining = result.remaining ?? 0;
      }
      if (totalErrors > 0) toast(t('settings_backfill_partial', { updated: totalUpdated, errors: totalErrors }), 'info');
      else toast(t('settings_backfill_success', { count: totalUpdated }), 'success');
    } catch { toast(t('settings_network_error'), 'error'); }
    finally { setIsBackfilling(false); }
  };

  if (isLoading) return <LayoutShell><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></LayoutShell>;
  if (!user) return null;

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const userAvatar = user.user_metadata?.avatar_url;
  const createdAt = new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const themeOptions = [
    { value: 'light', label: t('settings_theme_light'), icon: Sun },
    { value: 'dark', label: t('settings_theme_dark'), icon: Moon },
    { value: 'system', label: t('settings_theme_system'), icon: Monitor },
  ];

  const aiProviderConfigs = [
    { field: 'gemini_api_key', provider: 'gemini' as AiProvider, label: 'Google Gemini', hasKey: aiSettings._has_gemini_key, maskedKey: aiSettings.gemini_api_key },
    { field: 'openai_api_key', provider: 'chatgpt' as AiProvider, label: 'OpenAI (ChatGPT)', hasKey: aiSettings._has_openai_key, maskedKey: aiSettings.openai_api_key },
    { field: 'claude_api_key', provider: 'claude' as AiProvider, label: 'Anthropic (Claude)', hasKey: aiSettings._has_claude_key, maskedKey: aiSettings.claude_api_key },
  ];

  const isAiEnabled = aiSettings.ai_provider !== 'none';

  const aiToggles = [
    { key: 'ai_auto_classify', label: t('settings_ai_auto_classify'), desc: t('settings_ai_auto_classify_desc'), icon: Zap, value: aiSettings.ai_auto_classify },
    { key: 'ai_auto_summary', label: t('settings_ai_auto_summary'), desc: t('settings_ai_auto_summary_desc'), icon: Bot, value: aiSettings.ai_auto_summary },
    { key: 'ai_auto_tags', label: t('settings_ai_auto_tags'), desc: t('settings_ai_auto_tags_desc'), icon: Tag, value: aiSettings.ai_auto_tags },
  ];

  return (
    <>
      <Head><title>{t('settings')} - Refine</title></Head>
      <LayoutShell>
        <div className="max-w-2xl mx-auto px-4 py-3 space-y-6">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground mb-4"><Link href="/"><ArrowLeft size={14} />{t('back')}</Link></Button>

          {/* Profile Header */}
          <Card>
            <CardContent className="flex flex-col items-center text-center py-8">
              {userAvatar ? (
                <Image src={userAvatar} alt={userName} width={72} height={72} className="rounded-full border-2 border-border" />
              ) : (
                <div className="w-[72px] h-[72px] rounded-full bg-muted flex items-center justify-center text-2xl font-semibold">{userName.charAt(0).toUpperCase()}</div>
              )}
              <h1 className="mt-4 text-lg font-semibold">{userName}</h1>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{t('settings_joined', { date: createdAt })}</p>
            </CardContent>
          </Card>

          {/* Theme */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t('settings_theme')}</CardTitle></CardHeader>
            <CardContent>
              {mounted ? (
                <div className="flex gap-2">
                  {themeOptions.map(opt => (
                    <Button key={opt.value} variant={theme === opt.value ? "default" : "outline"} size="sm" onClick={() => setTheme(opt.value)} className={cn("flex-1 h-10 text-xs gap-1.5 px-2 sm:px-3", theme === opt.value ? "" : "text-muted-foreground")}>
                      <opt.icon size={14} className="shrink-0" /><span className="hidden sm:inline">{opt.label}</span>
                    </Button>
                  ))}
                </div>
              ) : <div className="h-10 animate-pulse bg-muted rounded" />}
            </CardContent>
          </Card>

          {/* AI Settings */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2"><Sparkles size={14} className="text-primary" />{t('settings_ai')}</CardTitle>
              <CardDescription className="text-xs">{t('settings_ai_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {loadingSettings ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <>
                  {/* API Keys */}
                  <div className="space-y-3">
                    {aiProviderConfigs.map(cfg => (
                      <div key={cfg.field} className={cn(
                        "rounded-lg border p-4 transition-all",
                        aiSettings.ai_provider === cfg.provider ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border"
                      )}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{cfg.label}</span>
                            {aiSettings.ai_provider === cfg.provider && (
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">{t('settings_ai_active')}</span>
                            )}
                          </div>
                          {cfg.hasKey && (
                            <Button variant="link" size="sm" onClick={() => removeApiKey(cfg.field)} disabled={savingSettings} className="h-auto p-0 text-[10px] text-destructive hover:underline disabled:opacity-50">{t('remove')}</Button>
                          )}
                        </div>
                        {cfg.hasKey ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 px-3 py-2 bg-muted/50 rounded-md text-xs text-muted-foreground font-mono truncate">
                                {showKeys[cfg.field] ? cfg.maskedKey : '•'.repeat(20)}
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => setShowKeys(s => ({ ...s, [cfg.field]: !s[cfg.field] }))} className="h-auto text-[10px] text-muted-foreground hover:text-foreground px-2 py-1">
                                {showKeys[cfg.field] ? t('hide') : t('show')}
                              </Button>
                            </div>
                            {aiSettings.ai_provider !== cfg.provider && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateSetting('ai_provider', cfg.provider)}
                                disabled={savingSettings}
                                className="w-full h-8 text-xs"
                              >
                                {t('settings_ai_use_provider')}
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Input
                              type="password"
                              placeholder={t('settings_ai_enter_key', { provider: cfg.label })}
                              value={keyDrafts[cfg.field] || ''}
                              onChange={(e) => setKeyDrafts(d => ({ ...d, [cfg.field]: e.target.value }))}
                              className="flex-1 text-xs"
                            />
                            <Button size="sm" onClick={() => saveApiKey(cfg.field, cfg.provider)} disabled={savingSettings || !keyDrafts[cfg.field]?.trim()} className="h-9 text-xs px-3">{t('save')}</Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Auto Feature Toggles */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{t('settings_ai_auto_features')}</p>
                    {aiToggles.map(toggle => (
                      <div key={toggle.key} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-md bg-muted/60 flex items-center justify-center"><toggle.icon size={14} className="text-muted-foreground" /></div>
                          <div>
                            <p className="text-xs font-medium">{toggle.label}</p>
                            <p className="text-[10px] text-muted-foreground">{toggle.desc}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => updateSetting(toggle.key, !toggle.value)}
                          disabled={savingSettings || !isAiEnabled}
                          className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent p-0 transition-colors duration-200 ease-in-out focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 hover:bg-transparent",
                            toggle.value && isAiEnabled ? "bg-primary" : "bg-muted"
                          )}
                        >
                          <span className={cn("pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out", toggle.value && isAiEnabled ? "translate-x-5" : "translate-x-0")} />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* AI Language */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Languages size={12} /> {t('settings_ai_language')}</p>
                    <div className="flex gap-2">
                      {[{ value: 'en', label: 'English' }, { value: 'ko', label: '한국어' }].map(lang => (
                        <Button key={lang.value} variant={aiSettings.preferred_language === lang.value ? "default" : "outline"} size="sm" onClick={async () => {
                          await updateSetting('preferred_language', lang.value);
                          router.push(router.pathname, router.asPath, { locale: lang.value });
                        }} disabled={savingSettings} className={cn("flex-1 h-9 text-xs", aiSettings.preferred_language === lang.value ? "" : "text-muted-foreground")}>
                          {lang.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t('settings_statistics')}</CardTitle></CardHeader>
            <CardContent>
              {loadingStats ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto my-4" />
              ) : stats ? (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-2xl font-bold">{stats.totalLinks}</p><p className="text-[10px] text-muted-foreground">{t('settings_total')}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-2xl font-bold text-green-500">{stats.readLinks}</p><p className="text-[10px] text-muted-foreground">{t('settings_read')}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-2xl font-bold text-amber-500">{stats.unreadLinks}</p><p className="text-[10px] text-muted-foreground">{t('settings_unread')}</p></div>
                </div>
              ) : <p className="text-xs text-muted-foreground text-center">{t('no_data')}</p>}
            </CardContent>
          </Card>

          {/* Top Platforms */}
          {stats && stats.platformStats.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t('settings_top_platforms')}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {stats.platformStats.slice(0, 5).map(({ platform, count }) => (
                  <div key={platform} className="flex items-center gap-2 text-xs">
                    <span className="w-20 truncate text-muted-foreground">{platform}</span>
                    <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${(count / stats.totalLinks) * 100}%` }} />
                    </div>
                    <span className="font-medium w-6 text-right">{count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t('settings_actions')}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start h-10 text-xs"><Link href="/categories"><Tag className="mr-2 h-4 w-4" />{t('category_management')}</Link></Button>
              <Button variant="outline" className="w-full justify-start h-10 text-xs" onClick={handleBackfill} disabled={isBackfilling}>{isBackfilling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{isBackfilling ? t('settings_backfilling') : t('settings_backfill')}</Button>
              <Button variant="outline" className="w-full justify-start h-10 text-xs" onClick={handleExport} disabled={isExporting}>{isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}{isExporting ? t('settings_exporting') : t('settings_export')}</Button>
              <Button variant="ghost" className="w-full justify-start h-10 text-xs text-destructive hover:text-destructive" onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" />{t('sign_out')}</Button>
            </CardContent>
          </Card>
        </div>
      </LayoutShell>
    </>
  );
}
