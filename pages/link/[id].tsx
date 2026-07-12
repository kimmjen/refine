import React from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LayoutShell from '@/components/layout/LayoutShell';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLinkActions } from '@/hooks/useLinkActions';
import LinkDetailCard from '@/components/modules/link/LinkDetailCard';
import CategoryEditModal from '@/components/modules/link/CategoryEditModal';
import { SharedLink, LinkMetadata } from '@/types/db';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '@/next-i18next.config.js';
import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'], nextI18NextConfig)),
  },
});

const createFetcher = (token?: string) => (url: string) =>
  fetch(url, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  }).then((res) => {
    if (!res.ok) throw new Error('Not found');
    return res.json();
  });

interface LinkDetailData {
  link: SharedLink;
  metadata: LinkMetadata | null;
  images: string[];
}

export default function LinkDetail() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { session } = useAuth();
  const { id } = router.query;
  const [isEnriching, setIsEnriching] = React.useState(false);

  const fetcher = React.useMemo(() => createFetcher(session?.access_token), [session?.access_token]);

  const { data, error, isLoading, mutate } = useSWR<LinkDetailData>(
    id && session ? `/api/link/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false, // 탭 전환 시 불필요한 재요청 방지
      dedupingInterval: 10000,  // 10초 내 동일 요청 중복 방지
    }
  );

  const initialLink = data?.link;
  const metadata = data?.metadata || null;
  const images = data?.images || [];

  const safeInitialLink = React.useMemo(() => initialLink || {} as SharedLink, [initialLink]);

  const { link, isDeleting, isEditingCategory, setIsEditingCategory, handleDelete, handleCategoryUpdate } = useLinkActions({
    initialLink: safeInitialLink
  });

  const handleEnrich = async () => {
    if (!data?.link?.id) return;
    setIsEnriching(true);
    try {
      const res = await fetch(`/api/enrich-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
        },
        body: JSON.stringify({ linkId: data.link.id, url: data.link.url }),
      });
      if (res.ok) {
        await mutate();
      }
    } catch {
      // ignore
    } finally {
      setIsEnriching(false);
    }
  };

  if (error) {
    return (
      <LayoutShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <p className="text-muted-foreground">{t('link_not_found')}</p>
          <Button asChild variant="link" size="sm" className="mt-4"><Link href="/">{t('go_back')}</Link></Button>
        </div>
      </LayoutShell>
    );
  }

  if (isLoading || !initialLink) {
    return (
      <LayoutShell title={t('loading')}>
        <div className="max-w-3xl mx-auto pt-2 px-4 pb-20 space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-8 w-3/4 rounded-md" />
          </div>
          <Skeleton className="aspect-video w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell title={link.title || t('link_default_title')}>
      <div className="max-w-3xl mx-auto pt-2 px-4 md:px-0 relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="absolute left-0 top-2 md:-left-12 text-muted-foreground hover:text-foreground hidden md:flex"
        >
          <ArrowLeft size={22} />
        </Button>

        <div className="md:hidden mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="-ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={22} />
          </Button>
        </div>

        <LinkDetailCard
          link={link}
          metadata={metadata}
          images={images}
          onDelete={handleDelete}
          onEnrich={handleEnrich}
          onEditCategory={() => setIsEditingCategory(true)}
          isDeleting={isDeleting}
          isEnriching={isEnriching}
        />
      </div>

      <CategoryEditModal
        isOpen={isEditingCategory}
        currentCategory={link.category || t('uncategorized')}
        onClose={() => setIsEditingCategory(false)}
        onSelect={handleCategoryUpdate}
      />
    </LayoutShell>
  );
}
