import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { supabaseAdmin } from '@/data/db';
import Script from 'next/script';

const cairo = Cairo({ subsets: ['arabic'], display: 'swap' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://bkamelnaharda.vercel.app/'),
  title: 'بكام النهاردة | مقارنة أسعار وعروض المنتجات في مصر',
  description: 'موقع بكام النهاردة يساعدك على اكتشاف أفضل المنتجات، مقارنة الأسعار، والعثور على أقوى العروض والخصومات في مصر.',
  openGraph: {
    title: 'بكام النهاردة | مقارنة أسعار وعروض المنتجات في مصر',
    description: 'موقع بكام النهاردة يساعدك على اكتشاف أفضل المنتجات، مقارنة الأسعار، والعثور على أقوى العروض والخصومات في مصر.',
    url: 'https://bkamelnaharda.vercel.app/',
    siteName: 'بكام النهاردة',
    locale: 'ar_EG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'بكام النهاردة | مقارنة أسعار وعروض المنتجات في مصر',
    description: 'موقع بكام النهاردة يساعدك على اكتشاف أفضل المنتجات، مقارنة الأسعار، والعثور على أقوى العروض والخصومات في مصر.',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data } = await supabaseAdmin.from('settings').select('facebook_pixel_id').limit(1).single();
  const fbp = data?.facebook_pixel_id;

  return (
    <html lang="ar" dir="rtl">
      <head>
        {fbp ? (
          <Script id="facebook-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${fbp}');
              fbq('track', 'PageView');
            `}
          </Script>
        ) : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "name": "بكام النهاردة",
                  "url": "https://bkamelnaharda.vercel.app/"
                },
                {
                  "@type": "Organization",
                  "name": "بكام النهاردة",
                  "url": "https://bkamelnaharda.vercel.app/",
                  "logo": "https://bkamelnaharda.vercel.app/icon.png"
                }
              ]
            })
          }}
        />
      </head>
      <body className={cairo.className}>{children}</body>
    </html>
  );
}
