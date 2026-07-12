import Head from 'next/head';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

const DEFAULT = {
  siteName: 'Refine',
  title: 'Refine - Link Collector',
  description: 'Collect, refine, and organize your shared links.',
  image: '/og-image.png',
  url: 'https://refine.app',
};

export default function SEO({
  title,
  description = DEFAULT.description,
  image = DEFAULT.image,
  url = DEFAULT.url,
  type = 'website',
}: SEOProps) {
  const fullTitle = title ? `${title} | ${DEFAULT.siteName}` : DEFAULT.title;

  return (
    <Head>
      {/* 기본 메타태그 */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph (Facebook, Discord, Slack, KakaoTalk 등) */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={DEFAULT.siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:locale" content="ko_KR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Head>
  );
}
