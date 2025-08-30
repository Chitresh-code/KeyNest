import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { APP_CONFIG } from '@/lib/constants';
import Providers from '@/lib/providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.name,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.description,
  keywords: [
    'environment variables',
    'secret management',
    'team collaboration',
    'security',
    'encryption',
    'devops',
    'open source',
  ],
  authors: [{ name: APP_CONFIG.author }],
  creator: APP_CONFIG.author,
  icons: {
    icon: [
      { url: '/logo w.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo w.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/logo w.png',
    apple: '/logo w.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
    siteName: APP_CONFIG.name,
    images: [
      {
        url: '/logo w.png',
        width: 1200,
        height: 630,
        alt: APP_CONFIG.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
    images: ['/logo w.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/logo w.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/logo w.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
