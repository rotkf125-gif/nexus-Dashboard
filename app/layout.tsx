import type { Metadata } from 'next';
import '@/styles/globals.css';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export const metadata: Metadata = {
  title: 'CELESTIAL NEXUS V64.2',
  description: 'Personal Investment Portfolio Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#02051F" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans custom-scrollbar">
        {/* Skip Link for Accessibility */}
        <a href="#main-content" className="skip-link">
          메인 콘텐츠로 건너뛰기
        </a>

        <ServiceWorkerRegistration />

        {/* Cosmic Background */}
        <div className="nebula-bg" aria-hidden="true" />
        <div className="stars" aria-hidden="true" />

        {/* Toast Container */}
        <div id="toast-container" role="status" aria-live="polite" aria-atomic="true" />

        {/* Main Content */}
        <main id="main-content" className="relative z-10" tabIndex={-1}>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </body>
    </html>
  );
}
