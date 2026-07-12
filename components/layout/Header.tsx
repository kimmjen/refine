import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LogOut, Moon, Sun, Settings, Library, LayoutGrid, Languages } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import RefineLogo from '@/components/common/RefineLogo';
import { useTranslation } from 'next-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Header() {
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth();
  const { t } = useTranslation('common');
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleLogout = async () => { await signOut(); };

  const switchLocale = () => {
    const nextLocale = router.locale === 'ko' ? 'en' : 'ko';
    router.push(router.pathname, router.asPath, { locale: nextLocale });
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'U';
  const avatarUrl = user?.user_metadata?.avatar_url;

  const navItems = [
    { href: '/', label: t('library'), icon: Library },
    { href: '/components', label: t('ui_kit'), icon: LayoutGrid },
  ];

  return (
    <div className="sticky top-0 z-50 w-full p-3">
      <Card className="max-w-6xl mx-auto flex h-12 items-center justify-between px-3 rounded-xl border-border/50 bg-background/80 backdrop-blur-xl shadow-sm">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <RefineLogo size={20} />
        </Link>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-colors",
                router.pathname === item.href
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon size={12} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-1.5">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg overflow-hidden p-0">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-xl p-1 mt-1">
                {/* Theme Toggle */}
                {mounted && (
                  <DropdownMenuItem onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} className="rounded-lg text-xs">
                    {resolvedTheme === 'dark' ? <Sun size={12} className="mr-2" /> : <Moon size={12} className="mr-2" />}
                    {resolvedTheme === 'dark' ? t('light_mode') : t('dark_mode')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={switchLocale} className="rounded-lg text-xs">
                  <Languages size={12} className="mr-2" />
                  {router.locale === 'ko' ? 'English' : '한국어'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-lg text-xs">
                  <Link href="/profile"><Settings size={12} className="mr-2" />{t('settings')}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="rounded-lg text-xs text-destructive focus:text-destructive">
                  <LogOut size={12} className="mr-2" />{t('sign_out')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : !isLoading && (
            <Button asChild size="sm" className="h-8 px-3 rounded-lg text-xs">
              <Link href="/auth/login">{t('sign_in')}</Link>
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
