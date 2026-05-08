import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SpinToWinPopup } from "@/components/shop/spin-to-win-popup";
import { getPublicSettings, settingString } from "@/lib/settings";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "opsz"],
});

/**
 * Site metadata is generated from the admin's `branding.*` and `seo.*`
 * settings. Title, description, favicon, OG image and theme colour all
 * flow from the admin panel.
 */
export async function generateMetadata(): Promise<Metadata> {
  const s = await getPublicSettings();

  const name = settingString(s, "business.name", "Dial A Whip");
  const titleDefault = settingString(s, "seo.meta_title", `${name} — 20-minute Newcastle catering supplies`);
  const description = settingString(
    s,
    "seo.meta_description",
    "Cream chargers, whippers, packaging and PPE — delivered across Newcastle in minutes.",
  );
  const keywords = settingString(s, "seo.meta_keywords");
  const favicon = settingString(s, "branding.favicon_url");
  const ogImage = settingString(s, "branding.og_image_url");

  return {
    title: { default: titleDefault, template: `%s · ${name}` },
    description,
    keywords: keywords || undefined,
    icons: favicon
      ? { icon: favicon, shortcut: favicon, apple: favicon }
      : undefined,
    openGraph: {
      title: titleDefault,
      description,
      siteName: name,
      images: ogImage ? [{ url: ogImage }] : undefined,
      type: "website",
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: titleDefault,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const s = await getPublicSettings();
  return {
    themeColor: settingString(s, "branding.primary_color", "#0B1D3A"),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getPublicSettings();
  const ga = settingString(s, "seo.google_analytics_id");
  const gtm = settingString(s, "seo.gtm_id");
  const fbPixel = settingString(s, "seo.facebook_pixel_id");
  const brandColor = settingString(s, "branding.primary_color");
  const accentColor = settingString(s, "branding.accent_color");

  // Surface admin colour choices as CSS custom properties so any component
  // that opts in (e.g. via `style={{ background: 'var(--color-brand)' }}`)
  // picks up the live value. Falls back to the existing palette tokens.
  const brandStyle = {
    ...(brandColor ? { "--color-brand": brandColor } : {}),
    ...(accentColor ? { "--color-accent": accentColor } : {}),
  } as React.CSSProperties;

  return (
    <html lang="en-GB" className={`${sans.variable} ${display.variable} h-full overflow-x-clip antialiased`} style={brandStyle}>
      <head>
        {gtm ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`,
            }}
          />
        ) : null}
        {ga ? (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${ga}');`,
              }}
            />
          </>
        ) : null}
        {fbPixel ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js'); fbq('init', '${fbPixel}'); fbq('track', 'PageView');`,
            }}
          />
        ) : null}
      </head>
      <body className="min-h-full flex flex-col overflow-x-clip bg-cream text-ink" suppressHydrationWarning>
        <Providers>
          {children}
          <SpinToWinPopup />
        </Providers>
      </body>
    </html>
  );
}
