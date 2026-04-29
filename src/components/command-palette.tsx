"use client";

import {
	Calendar,
	FileText,
	LayoutGrid,
	Lightbulb,
	MessageSquare,
	Moon,
	Plus,
	Share2,
	Sun,
	Tv,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import * as React from "react";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "@/components/ui/command";
import { ANIME_LIBRARY, NAV_ITEMS } from "@/lib/data";

type CommandPaletteContextValue = {
	open: boolean;
	setOpen: (open: boolean) => void;
	toggle: () => void;
};

const CommandPaletteContext = React.createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette() {
	const ctx = React.useContext(CommandPaletteContext);
	if (!ctx) {
		throw new Error("useCommandPalette must be used within CommandPaletteProvider");
	}
	return ctx;
}

const NAV_ICON_MAP: Record<string, React.ElementType> = {
	home: LayoutGrid,
	catalog: LayoutGrid,
	watch: Tv,
	book: FileText,
	chat: MessageSquare,
	theory: Lightbulb,
	graph: Share2,
	report: FileText,
	chart: Calendar,
	settings: FileText,
};

function hrefForKey(key: string) {
	return key === "home" ? "/" : `/${key}`;
}

const TOP_THEORIES = [
	"Hollow Orchestra: the conductor is the antagonist",
	"Silent Lantern ep 12 flash-forward is non-canon",
	"Paperbound takes place in the same universe as Sakura in the Wires",
];

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
	const [open, setOpen] = React.useState(false);
	const router = useRouter();
	const { theme, setTheme } = useTheme();

	// Global ⌘K / Ctrl+K listener
	React.useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((v) => !v);
			}
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	const runAction = React.useCallback((fn: () => void) => {
		setOpen(false);
		// defer so the dialog closes cleanly before navigation
		setTimeout(fn, 0);
	}, []);

	const ctxValue = React.useMemo(
		() => ({
			open,
			setOpen,
			toggle: () => setOpen((v) => !v),
		}),
		[open],
	);

	return (
		<CommandPaletteContext.Provider value={ctxValue}>
			{children}
			<CommandDialog
				open={open}
				onOpenChange={setOpen}
				title="Command Palette"
				description="Jump to anything — actions, pages, anime, theories."
				className="max-w-[640px]!"
			>
				<CommandInput placeholder="Search anime, theories, actions…" />
				<CommandList className="max-h-[60vh]!">
					<CommandEmpty>No results.</CommandEmpty>

					<CommandGroup heading="Actions">
						<CommandItem
							value="new conversation chat"
							onSelect={() => runAction(() => router.push("/chat"))}
						>
							<Plus /> New conversation
							<CommandShortcut>Chat</CommandShortcut>
						</CommandItem>
						<CommandItem
							value="graph explorer cypher"
							onSelect={() => runAction(() => router.push("/graph"))}
						>
							<Share2 /> Open Graph Explorer
						</CommandItem>
						<CommandItem
							value="schedule report delivery"
							onSelect={() => runAction(() => router.push("/reports"))}
						>
							<Calendar /> Schedule report
						</CommandItem>
						<CommandItem
							value="toggle theme dark light"
							onSelect={() => runAction(() => setTheme(theme === "dark" ? "light" : "dark"))}
						>
							{theme === "dark" ? <Sun /> : <Moon />}
							Toggle {theme === "dark" ? "light" : "dark"} mode
						</CommandItem>
					</CommandGroup>

					<CommandSeparator />

					<CommandGroup heading="Navigate">
						{NAV_ITEMS.map((item) => {
							const Icon = NAV_ICON_MAP[item.icon] ?? FileText;
							return (
								<CommandItem
									key={item.key}
									value={`${item.label} ${item.key}`}
									onSelect={() => runAction(() => router.push(hrefForKey(item.key)))}
								>
									<Icon /> {item.label}
								</CommandItem>
							);
						})}
					</CommandGroup>

					<CommandSeparator />

					<CommandGroup heading="Anime">
						{ANIME_LIBRARY.slice(0, 5).map((a) => (
							<CommandItem
								key={a.id}
								value={`${a.title} ${a.jp} ${a.studio}`}
								onSelect={() => runAction(() => router.push("/catalog"))}
							>
								<Tv />
								<span className="flex-1">
									{a.title}{" "}
									<span
										className="ml-2 text-fg-mute text-xs"
										style={{ fontFamily: "var(--font-jp)" }}
									>
										{a.jp}
									</span>
								</span>
								<CommandShortcut>{a.studio}</CommandShortcut>
							</CommandItem>
						))}
					</CommandGroup>

					<CommandSeparator />

					<CommandGroup heading="Theories">
						{TOP_THEORIES.map((t) => (
							<CommandItem
								key={t}
								value={t}
								onSelect={() => runAction(() => router.push("/theories"))}
							>
								<Lightbulb />
								<span className="flex-1 truncate">{t}</span>
							</CommandItem>
						))}
					</CommandGroup>
				</CommandList>
			</CommandDialog>
		</CommandPaletteContext.Provider>
	);
}
