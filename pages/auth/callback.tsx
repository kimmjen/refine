import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '@/next-i18next.config.js';
import type { GetStaticProps } from 'next';

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'], nextI18NextConfig)),
  },
});

export default function AuthCallback() {
  const router = useRouter();
  const { t } = useTranslation('common');

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const handleCallback = async () => {
      const { error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error);
        router.replace('/auth/login?error=callback_failed');
        return;
      }

      // 성공 시 홈으로 리다이렉트
      router.replace('/');
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
      <p className="text-muted-foreground">{t('auth_signing_in')}</p>
    </div>
  );
}
