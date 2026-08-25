import type { Metadata } from 'next';
import { Inclusive_Sans, Playfair_Display, Roboto_Mono } from 'next/font/google';
import './globals.css';

const inclusiveSans = Inclusive_Sans({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-sans',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-playfair-display',
});

export const metadata: Metadata = {
  title: 'Smart Resume Screener',
  description:
    'AI-powered ATS candidate review and ranking against a target position.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inclusiveSans.variable} ${robotoMono.variable} ${playfairDisplay.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
