import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import "@/styles/globals.css";
import ThemeSync from "@/components/common/ThemeSync";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Mentora – AI Powered Smart Learning & Digital Library",
  description: "Notes, Books, PYQs and Mock Tests in one place. Powered by AI. Built for UPSC, JEE, NEET, SSC and Engineering.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('theme');
                  if (savedTheme) {
                    document.documentElement.setAttribute('data-theme', savedTheme);
                  }
                  var savedAccent = localStorage.getItem('accentColor');
                  if (savedAccent) {
                    var r = parseInt(savedAccent.slice(1, 3), 16);
                    var g = parseInt(savedAccent.slice(3, 5), 16);
                    var b = parseInt(savedAccent.slice(5, 7), 16);
                    var lr = Math.round(r + (255 - r) * 0.35);
                    var lg = Math.round(g + (255 - g) * 0.35);
                    var lb = Math.round(b + (255 - b) * 0.35);
                    var light = '#' + lr.toString(16).padStart(2, '0') + lg.toString(16).padStart(2, '0') + lb.toString(16).padStart(2, '0');
                    var style = document.documentElement.style;
                    style.setProperty('--theme-accent', savedAccent);
                    style.setProperty('--theme-accent-soft', 'rgba(' + r + ',' + g + ',' + b + ',0.12)');
                    style.setProperty('--theme-accent-border', 'rgba(' + r + ',' + g + ',' + b + ',0.35)');
                    style.setProperty('--theme-accent-glow', 'rgba(' + r + ',' + g + ',' + b + ',0.3)');
                    style.setProperty('--theme-accent-light', light);
                    style.setProperty('--theme-accent-gradient', 'linear-gradient(135deg, ' + savedAccent + ' 0%, ' + light + ' 100%)');
                  }
                  var savedFontSize = localStorage.getItem('fontSize');
                  if (savedFontSize) {
                    var fontSizeScale = { Small: '93.75%', Medium: '100%', Large: '112.5%' };
                    document.documentElement.style.fontSize = fontSizeScale[savedFontSize] || '100%';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${dmSans.variable} font-sans`}>
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}