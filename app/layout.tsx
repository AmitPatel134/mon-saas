import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "CleoAI — CRM IA pour agents immobiliers",
    template: "%s | CleoAI",
  },
  description: "Rédigez vos annonces, emails, SMS et comptes rendus de visite en quelques secondes grâce à l'IA. Gérez mandats et prospects. Matching automatique.",
  keywords: ["CRM immobilier", "agent immobilier", "IA immobilier", "annonce immobilière", "génération texte immobilier", "logiciel agent immo"],
  authors: [{ name: "CleoAI" }],
  openGraph: {
    title: "CleoAI — CRM IA pour agents immobiliers",
    description: "Rédigez annonces, emails, SMS et comptes rendus en quelques secondes. Matching mandats / prospects automatique.",
    url: "https://cleoai.fr",
    siteName: "CleoAI",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CleoAI — CRM IA pour agents immobiliers",
    description: "Rédigez annonces, emails, SMS et comptes rendus en quelques secondes. Matching mandats / prospects automatique.",
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
    <html lang="fr">
      <body className={`${jakarta.variable} font-[family-name:var(--font-jakarta)] antialiased bg-white text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
