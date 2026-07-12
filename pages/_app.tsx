import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { appWithTranslation } from 'next-i18next';
import nextI18NextConfig from '@/next-i18next.config.js';
import { ToastProvider } from "@/components/common/Toast";

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            {loading && (
              <div className="fixed top-0 left-0 w-full h-1 z-[9999] bg-muted overflow-hidden">
                <div className="h-full bg-primary animate-progress-indeterminate origin-left" />
              </div>
            )}
            <Component {...pageProps} />
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default appWithTranslation(App, nextI18NextConfig);
