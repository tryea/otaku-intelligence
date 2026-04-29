import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_JP } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
	variable: "--font-sans",
	subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-mono",
	subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
	variable: "--font-jp",
	subsets: ["latin"],
	weight: ["500", "700"],
});

export const metadata: Metadata = {
	title: "Otaku Intelligence",
	description: "AI-powered anime & manga analytics platform — dual-agent research",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${inter.variable} ${jetbrainsMono.variable} ${notoSansJP.variable} h-full antialiased`}
			data-scroll-behavior="smooth"
			suppressHydrationWarning
		>
			<body className="h-full">
				<ThemeProvider
					attribute="data-theme"
					defaultTheme="dark"
					enableSystem={false}
					disableTransitionOnChange
				>
					<TooltipProvider>
						{children}
						<Toaster />
					</TooltipProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
