import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Personal Cloud | Workspace",
  description: "A centralized cloud workspace for projects, tutorials, and research.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        {/* We can add a global Navigation or Header here later */}
        {children}
      </body>
    </html>
  );
}
