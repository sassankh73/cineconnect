import type { Metadata, Viewport } from "next";
import { Inter, Cinzel, Vazirmatn } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "600", "700", "900"], variable: "--font-cinzel", display: "swap" });
const vazir = Vazirmatn({ subsets: ["arabic"], variable: "--font-vazir", display: "swap" });

export const metadata: Metadata = {
  title: "سینه‌کانکت | CineConnect — جایی که استعداد، فرصت پیدا می‌کند",
  description:
    "CineConnect (سینه‌کانکت) — پلتفرم تخصصی استعدادها و عوامل سینما، تلویزیون و فیلم کوتاه ایران. Where Talent Finds Opportunity.",
  keywords: ["سینما", "بازیگر", "عوامل فیلم", "کستینگ", "CineConnect", "Iranian cinema", "casting"],
  authors: [{ name: "CinePro" }],
};

export const viewport: Viewport = {
  themeColor: "#0D0D0D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Persian (RTL) is the default render. Providers re-sync dir/lang on the client.
    <html lang="fa" dir="rtl" className={`${inter.variable} ${cinzel.variable} ${vazir.variable}`}>
      <body className="min-h-screen bg-charcoal text-white">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
