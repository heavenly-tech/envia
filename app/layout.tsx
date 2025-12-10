import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Envía - Mail Merge Modernized",
    description: "A modern mail merge tool for the web.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={cn(inter.className, "min-h-screen bg-background antialiased")}>
                <TooltipProvider delayDuration={300}>
                    {children}
                </TooltipProvider>
                <Toaster />
            </body>
        </html>
    );
}
