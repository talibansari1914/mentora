import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

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
    <html lang="en">
      <body className={`${dmSans.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}