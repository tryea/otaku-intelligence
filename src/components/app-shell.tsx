"use client";

import { usePathname } from "next/navigation";
import { CommandPaletteProvider } from "@/components/command-palette";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { NAV_ITEMS } from "@/lib/data";

function breadcrumbsFromPathname(pathname: string): string[] {
	if (pathname === "/") return ["Home"];
	const segments = pathname.split("/").filter(Boolean);
	const crumbs: string[] = ["Home"];
	for (const seg of segments) {
		const nav = NAV_ITEMS.find((n) => n.key === seg);
		crumbs.push(nav ? nav.label : seg.charAt(0).toUpperCase() + seg.slice(1));
	}
	return crumbs;
}

export function AppShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const breadcrumbs = breadcrumbsFromPathname(pathname);

	return (
		<CommandPaletteProvider>
			<div className="h-screen" style={{ display: "grid", gridTemplateColumns: "260px 1fr" }}>
				<Sidebar />
				<div className="flex flex-col overflow-hidden">
					<Topbar breadcrumbs={breadcrumbs} />
					<main className="flex-1 overflow-y-auto">{children}</main>
				</div>
			</div>
		</CommandPaletteProvider>
	);
}
