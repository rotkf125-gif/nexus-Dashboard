import type { Metadata } from 'next';
import '@/styles/globals.css';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

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
        <ServiceWorkerRegistration />

        {/* Cosmic Background */}
        <div className="nebula-bg" />
        <div className="stars" />

        {/* Toast Container */}
        <div id="toast-container" />

        {/* Main Content */}
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
