import { Plus, Search, X, Lock } from "lucide-react";
import { useState } from "react";
import NicknameDecryptDialog from "../dialog/nickname_decrypt";
import { ScrollArea } from "../ui/scroll-area";
import { addNickname } from "../../tauri_core/command_frontend"
const NICKNAME_PLAINTEXT: Record<number, string> = {
    1: "alice_dev",
    2: "alice_design",
    3: "alice@work",
    4: "aliceW",
    5: "alice#1337",
    6: "u/alice_anon",
};

type NicknameEntry = {
    id: number;
    label: string;
    platform: string;
    cipher: string;
    accentBg: string;
    accentText: string;
    accentBorder: string;
    accentTag: string;
    accentTagText: string;
};

const ALL_NICKNAMES: NicknameEntry[] = [
    {
        id: 1,
        label: "GitHub",
        platform: "Developer Platform",
        cipher: "••••••••_dev",
        accentBg: "bg-emerald-500/10",
        accentText: "text-emerald-600 dark:text-emerald-400",
        accentBorder: "border-emerald-500/30",
        accentTag: "bg-emerald-500/15",
        accentTagText: "text-emerald-700 dark:text-emerald-300",
    },
    {
        id: 2,
        label: "Figma",
        platform: "Design Tool",
        cipher: "••••••_design",
        accentBg: "bg-violet-500/10",
        accentText: "text-violet-600 dark:text-violet-400",
        accentBorder: "border-violet-500/30",
        accentTag: "bg-violet-500/15",
        accentTagText: "text-violet-700 dark:text-violet-300",
    },
    {
        id: 3,
        label: "Notion",
        platform: "Productivity",
        cipher: "••••••@work",
        accentBg: "bg-orange-500/10",
        accentText: "text-orange-600 dark:text-orange-400",
        accentBorder: "border-orange-500/30",
        accentTag: "bg-orange-500/15",
        accentTagText: "text-orange-700 dark:text-orange-300",
    },
    {
        id: 4,
        label: "Twitter / X",
        platform: "Social Media",
        cipher: "•••••W",
        accentBg: "bg-sky-500/10",
        accentText: "text-sky-600 dark:text-sky-400",
        accentBorder: "border-sky-500/30",
        accentTag: "bg-sky-500/15",
        accentTagText: "text-sky-700 dark:text-sky-300",
    },
    {
        id: 5,
        label: "Discord",
        platform: "Community Chat",
        cipher: "•••••#1337",
        accentBg: "bg-indigo-500/10",
        accentText: "text-indigo-600 dark:text-indigo-400",
        accentBorder: "border-indigo-500/30",
        accentTag: "bg-indigo-500/15",
        accentTagText: "text-indigo-700 dark:text-indigo-300",
    },
    {
        id: 6,
        label: "Reddit",
        platform: "Forum",
        cipher: "u/••••••_anon",
        accentBg: "bg-rose-500/10",
        accentText: "text-rose-600 dark:text-rose-400",
        accentBorder: "border-rose-500/30",
        accentTag: "bg-rose-500/15",
        accentTagText: "text-rose-700 dark:text-rose-300",
    },
];

export default function NicknameManagerPage() {
    const [newNickname, setNewNickname] = useState("");
    const [newKey, setNewKey] = useState("");
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [addSuccess, setAddSuccess] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [committed, setCommitted] = useState("");
    const [showDecryptDialog, setShowDecryptDialog] =
        useState(false);
    const [revealed, setRevealed] = useState(false);

    const filtered = ALL_NICKNAMES.filter((n) => {
        if (!committed) return true;
        const q = committed.toLowerCase();
        return (
            n.label.toLowerCase().includes(q) ||
            n.platform.toLowerCase().includes(q)
        );
    });

    const handleSearchKey = (
        e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (e.key === "Enter") setCommitted(query.trim());
    };

    return (
        <div className="relative h-screen  flex justify-center">
            <div className="p-8 w-4/5 max-w-4xl  flex flex-col h-full">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <h1 className="mb-1">Nickname Manager</h1>
                        <p className="text-muted-foreground">
                            Track which alias you use on each platform.
                        </p>
                    </div>
                    {/* Single page-level decrypt button */}
                    <button
                        onClick={() => {
                            if (!revealed) setShowDecryptDialog(true);
                            else setRevealed(false);
                        }}
                        className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${revealed
                            ? "bg-muted border-border text-muted-foreground hover:text-foreground"
                            : "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                            }`}
                    >
                        <Lock size={13} />
                        {revealed ? "Lock All" : "Decrypt All"}
                    </button>
                </div>
                {/* Add Nickname — simple form */}
                <div className="mb-6">
                    <div className="flex gap-2 items-center">
                        <input
                            type="text"
                            value={newNickname}
                            onChange={(e) => setNewNickname(e.target.value)}
                            placeholder="New nickname"
                            className="flex-1 px-3 py-2 rounded-lg bg-input-background text-foreground border border-border text-sm outline-none focus:border-primary transition-colors"
                        />
                        <input
                            type="password"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            placeholder="Secret"
                            className="w-48 px-3 py-2 rounded-lg bg-input-background text-foreground border border-border text-sm outline-none focus:border-primary transition-colors"
                        />
                        <button
                            onClick={async () => {
                                setAddError(null);
                                setAddSuccess(null);
                                if (!newNickname.trim() || !newKey.trim()) {
                                    setAddError("Nickname and secret are required");
                                    return;
                                }
                                setAdding(true);
                                try {
                                    await addNickname(newNickname.trim(), newKey);
                                    setAddSuccess("Created");
                                    setNewNickname("");
                                    setNewKey("");
                                } catch (e: any) {
                                    setAddError(e?.message || "Create failed");
                                } finally {
                                    setAdding(false);
                                }
                            }}
                            disabled={adding}
                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition text-sm disabled:opacity-50"
                        >
                            {adding ? "Creating..." : "Create"}
                        </button>
                    </div>
                    {addError && <p className="text-xs text-destructive mt-2">{addError}</p>}
                    {addSuccess && <p className="text-xs text-success mt-2">{addSuccess}</p>}
                </div>
                {/* Search */}
                <div className="relative mb-5">
                    <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleSearchKey}
                        placeholder="Search by name or platform… (Enter to search)"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-input-background text-foreground border border-border text-sm outline-none focus:border-primary transition-colors"
                    />
                    {committed && (
                        <button
                            onClick={() => {
                                setQuery("");
                                setCommitted("");
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>

                {committed && (
                    <p className="text-xs text-muted-foreground mb-3">
                        {filtered.length} result
                        {filtered.length !== 1 ? "s" : ""} for "
                        <span className="text-foreground">{committed}</span>
                        "
                    </p>
                )}
                <ScrollArea className="flex-1 min-h-0 rounded-b-2xl">
                    {/* Nickname cards */}
                    <div className="grid gap-3">
                        {filtered.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground text-sm">
                                No nicknames match your search.
                            </div>
                        ) : (
                            filtered.map((n) => {
                                const display = revealed
                                    ? NICKNAME_PLAINTEXT[n.id]
                                    : n.cipher;
                                return (
                                    <div
                                        key={n.id}
                                        className={`flex items-center gap-4 p-4 rounded-xl border ${n.accentBorder} ${n.accentBg} transition-colors`}
                                    >
                                        {/* Color avatar */}
                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.accentTag}`}
                                        >
                                            <span
                                                className={`text-base font-bold ${n.accentTagText}`}
                                            >
                                                {n.label[0]}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div
                                                className={`font-semibold ${n.accentText}`}
                                            >
                                                {n.label}
                                            </div>
                                            <div className="text-xs text-muted-foreground mb-1">
                                                {n.platform}
                                            </div>
                                            <div
                                                className={`text-sm font-mono tracking-wide transition-all ${revealed ? "text-foreground" : "text-muted-foreground/60 select-none"}`}
                                            >
                                                {display}
                                            </div>
                                        </div>

                                        {/* Platform tag */}
                                        <span
                                            className={`hidden sm:inline-flex shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${n.accentTag} ${n.accentTagText}`}
                                        >
                                            {n.platform}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>

            </div>

            {/* Floating Add button */}
            <button className="fixed bottom-8 right-8 flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 active:scale-95 transition-all">
                <Plus size={16} />
                Add Nickname
            </button>

            {/* Decrypt dialog */}
            {showDecryptDialog && (
                <NicknameDecryptDialog
                    onSuccess={() => {
                        setRevealed(true);
                        setShowDecryptDialog(false);
                    }}
                    onClose={() => setShowDecryptDialog(false)}
                />
            )}
        </div>
    );
}