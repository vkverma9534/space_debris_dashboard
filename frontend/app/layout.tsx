import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title:
    "Space Debris & Collision Risk Dashboard | Hands Of Hope",
  description:
    "Smart India Hackathon 2026 project by Team Hands Of Hope — a Space Situational Awareness dashboard for orbital population, debris environment, and collision-risk screening.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#07111f] text-white antialiased">
        {children}
      </body>
    </html>
  );
}