import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Loader2, AlertTriangle, Shield } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import RefineLogo from '@/components/common/RefineLogo';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '@/next-i18next.config.js';
import type { GetStaticProps } from 'next';

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'], nextI18NextConfig)),
  },
});

function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, signInWithGoogle, signInWithEmail } = useAuth();
  const { t } = useTranslation('common');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Secret admin login state
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Listen for Ctrl+Shift+Q (or ㅂ for Korean keyboard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Shift+Q or Ctrl+Shift+ㅂ
      if (e.ctrlKey && e.shiftKey && (e.key === 'Q' || e.key === 'q' || e.key === 'ㅂ')) {
        e.preventDefault();
        setShowAdminLogin(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (user && !authLoading) {
      if (user.email === 'admin@refine.app') {
        router.replace('/admin');
      } else {
        router.replace('/');
      }
    }
  }, [user, authLoading, router]);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try { await signInWithGoogle(); }
    catch { setError(t('auth_login_failed')); setIsLoading(false); }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmail(adminEmail, adminPassword);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth_admin_login_failed'));
      setIsLoading(false);
    }
  };

  if (authLoading || user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <>
      <Head><title>Sign In | Refine</title></Head>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Link href="/" className="mb-10 opacity-70 hover:opacity-100 transition-opacity"><RefineLogo size={24} /></Link>
        <Card className="w-full max-w-xs rounded-xl border-border/50">
          <CardHeader className="text-center pt-6 pb-2">
            <CardTitle className="text-base font-semibold">
              {showAdminLogin ? (
                <span className="flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4 text-red-500" />
                  {t('auth_admin_login')}
                </span>
              ) : t('auth_welcome')}
            </CardTitle>
            <CardDescription className="text-xs">
              {showAdminLogin ? t('auth_admin_credentials') : t('auth_sign_in_to_continue')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            {error && <div className="mb-4 p-2 rounded-md bg-destructive/10 text-destructive text-[10px] font-medium flex items-center gap-1.5"><AlertTriangle size={12} />{error}</div>}

            {showAdminLogin ? (
              // Admin Login Form
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="admin-email" className="text-xs font-medium">{t('auth_email')}</label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="h-9 text-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="admin-password" className="text-xs font-medium">{t('auth_password')}</label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="h-9 text-sm"
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-10 gap-2 text-xs font-medium bg-red-600 hover:bg-red-700">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                  {t('auth_sign_in_admin')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAdminLogin(false)}
                  className="w-full h-8 text-xs text-muted-foreground"
                >
                  {t('auth_back_to_google')}
                </Button>
              </form>
            ) : (
              // Google Login Button
              <Button variant="outline" onClick={handleLogin} disabled={isLoading} className="w-full h-10 gap-2 text-xs font-medium">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                {t('auth_continue_with_google')}
              </Button>
            )}
          </CardContent>
        </Card>
        <p className="mt-8 text-[9px] text-muted-foreground text-center max-w-xs">{t('auth_terms')}</p>
      </div>
    </>
  );
}
