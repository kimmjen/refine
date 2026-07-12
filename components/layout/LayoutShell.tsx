import Head from 'next/head';
import Header from './Header';
import SEO from '../common/SEO';

interface LayoutShellProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  image?: string;
}

export default function LayoutShell({ 
  children, 
  title,
  description,
  image,
}: LayoutShellProps) {
  return (
    <>
      <SEO 
        title={title}
        description={description}
        image={image}
      />
      
      <Head>
        {/* Viewport - 접근성을 위해 확대 허용 */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* PWA & Mobile Settings */}
        <link rel="manifest" href="/manifest.json?v=2" />
        <meta name="theme-color" content="#E6E7E3" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Refine" />
        
        {/* Icons */}
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </Head>

      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 pb-12">
          {children}
        </main>
      </div>
    </>
  );
}
