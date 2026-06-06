import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  KeyRound,
  UserRound,
  Settings,
  ShieldCheck,
  Sun,
  Moon,
  Search,
  Lock,
  Plus,
  X,
  Eye,
} from "lucide-react";

type Page = "passwd-list" | "nickname-manager" | "config";

const NAV_ITEMS: {
  id: Page;
  label: string;
  icon: React.ReactNode;
}[] = [
    {
      id: "passwd-list",
      label: "Password List",
      icon: <KeyRound size={18} />,
    },
    {
      id: "nickname-manager",
      label: "Nickname Manager",
      icon: <UserRound size={18} />,
    },
    {
      id: "config",
      label: "Config",
      icon: <Settings size={18} />,
    },
  ];

type Entry = {
  id: number;
  name: string;
  description: string;
  updated: string;
  encryptedPasswd: string;
};

const ALL_ENTRIES: Entry[] = [
  {
    id: 1,
    name: "GitHub",
    description: "Main dev account — alice@example.com",
    updated: "2026-05-10",
    encryptedPasswd: "hunter2",
  },
  {
    id: 2,
    name: "Figma",
    description: "Design workspace login",
    updated: "2026-04-22",
    encryptedPasswd: "figmaPass!",
  },
  {
    id: 3,
    name: "Notion",
    description: "Work notes & docs — alice@work.io",
    updated: "2026-03-15",
    encryptedPasswd: "notion123",
  },
  {
    id: 4,
    name: "Vercel",
    description: "Deployment account for side projects",
    updated: "2026-06-01",
    encryptedPasswd: "vercelSecret",
  },
  {
    id: 5,
    name: "AWS",
    description: "Cloud infra root credentials",
    updated: "2026-05-28",
    encryptedPasswd: "awsR00t!",
  },
  {
    id: 6,
    name: "Supabase",
    description: "Database project — prod org",
    updated: "2026-06-03",
    encryptedPasswd: "supa$afe",
  },
];

function DecryptDialog({
  entry,
  onClose,
}: {
  entry: Entry;
  onClose: () => void;
}) {
  const [secretKey, setSecretKey] = useState("");
  const [plaintext, setPlaintext] = useState<string | null>(
    null,
  );
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      setPlaintext(null);
      setSecretKey("");
    };
  }, [onClose]);

  const attempt = useCallback(() => {
    // Mock: correct key is "1234" for all entries in this demo
    if (secretKey === "1234") {
      setPlaintext(entry.encryptedPasswd);
      setError(false);
    } else {
      setError(true);
      setPlaintext(null);
    }
  }, [secretKey, entry]);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") attempt();
  };

  const handleClose = () => {
    setPlaintext(null);
    setSecretKey("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock size={15} className="text-primary" />
            </div>
            <div>
              <div className="font-semibold">{entry.name}</div>
              <div className="text-xs text-muted-foreground">
                Enter secret key to decrypt
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {!plaintext ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm">Secret Key</label>
                <input
                  ref={inputRef}
                  type="password"
                  value={secretKey}
                  onChange={(e) => {
                    setSecretKey(e.target.value);
                    setError(false);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Press Enter to confirm…"
                  className={`w-full px-3 py-2 rounded-lg bg-input-background text-foreground border text-sm outline-none transition-colors ${error
                    ? "border-destructive"
                    : "border-border focus:border-primary"
                    }`}
                />
                {error && (
                  <p className="text-xs text-destructive">
                    Incorrect secret key. Try again.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Demo hint: the key is{" "}
                  <code className="bg-muted px-1 rounded">
                    1234
                  </code>
                </p>
              </div>
              <button
                onClick={attempt}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm"
              >
                Decrypt
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye size={14} />
                Decrypted password
              </div>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted border border-border font-mono tracking-wide select-all">
                {plaintext}
              </div>
              <p className="text-xs text-muted-foreground">
                Close this dialog or press Esc to clear the
                plaintext from memory.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordListPage() {
  const [query, setQuery] = useState("");
  const [committed, setCommitted] = useState("");
  const [decryptTarget, setDecryptTarget] =
    useState<Entry | null>(null);

  const filtered = ALL_ENTRIES.filter((e) => {
    if (!committed) return true;
    const q = committed.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
    );
  });

  const handleSearchKey = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") setCommitted(query.trim());
  };

  return (
    <div className="relative h-full flex justify-center">
      <div className="p-8 pb-28 w-4/5 max-w-4xl">
        <h1 className="mb-1">Password List</h1>
        <p className="text-muted-foreground mb-6">
          Manage your saved credentials securely.
        </p>

        {/* Search — always visible above results */}
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
            placeholder="Search by name or description… (Enter to search)"
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

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 text-muted-foreground">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground">
                  Description
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground">
                  Last Updated
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No entries match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((e, i) => (
                  <tr
                    key={e.id}
                    className={`border-b border-border last:border-0 hover:bg-accent/40 transition-colors ${i % 2 !== 0 ? "bg-muted/20" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {e.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                      {e.description}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {e.updated}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDecryptTarget(e)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors ml-auto"
                      >
                        <Lock size={11} />
                        Decrypt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Add button */}
      <button className="fixed bottom-8 right-8 flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 active:scale-95 transition-all">
        <Plus size={16} />
        Add New Entry
      </button>

      {/* Decrypt dialog */}
      {decryptTarget && (
        <DecryptDialog
          entry={decryptTarget}
          onClose={() => setDecryptTarget(null)}
        />
      )}
    </div>
  );
}

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

const NICKNAME_PLAINTEXT: Record<number, string> = {
  1: "alice_dev",
  2: "alice_design",
  3: "alice@work",
  4: "aliceW",
  5: "alice#1337",
  6: "u/alice_anon",
};

function NicknameManagerPage() {
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
    <div className="relative h-full  flex justify-center">
      <div className="p-8 pb-28 w-4/5 max-w-4xl">
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

function NicknameDecryptDialog({
  onSuccess,
  onClose,
}: {
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [secretKey, setSecretKey] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const attempt = useCallback(() => {
    if (secretKey === "1234") {
      onSuccess();
    } else {
      setError(true);
    }
  }, [secretKey, onSuccess]);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") attempt();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock size={15} className="text-primary" />
            </div>
            <div>
              <div className="font-semibold">
                Decrypt Nicknames
              </div>
              <div className="text-xs text-muted-foreground">
                Reveal all aliases at once
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm">Secret Key</label>
            <input
              ref={inputRef}
              type="password"
              value={secretKey}
              onChange={(e) => {
                setSecretKey(e.target.value);
                setError(false);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Press Enter to confirm…"
              className={`w-full px-3 py-2 rounded-lg bg-input-background border text-sm outline-none transition-colors ${error
                ? "border-destructive"
                : "border-border focus:border-primary"
                }`}
            />
            {error && (
              <p className="text-xs text-destructive">
                Incorrect secret key. Try again.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Demo hint: the key is{" "}
              <code className="bg-muted px-1 rounded">
                1234
              </code>
            </p>
          </div>
          <button
            onClick={attempt}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm"
          >
            Reveal All Nicknames
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfigPage() {
  const [autoLock, setAutoLock] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [clipboard, setClipboard] = useState(true);

  const Toggle = ({
    on,
    onToggle,
  }: {
    on: boolean;
    onToggle: () => void;
  }) => (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors ${on ? "bg-primary" : "bg-switch-background"}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );

  return (
    <div className="relative h-full w-full flex justify-center p-8">
      <div className=" w-4/5 ">
        <h1 className="mb-1">Config</h1>
        <p className="text-muted-foreground mb-6">
          Adjust application preferences.
        </p>

        <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
          {[
            {
              label: "Auto-lock after 5 min",
              desc: "Lock vault when idle",
              val: autoLock,
              fn: () => setAutoLock(!autoLock),
            },
            {
              label: "Biometric Unlock",
              desc: "Use fingerprint or face ID",
              val: biometric,
              fn: () => setBiometric(!biometric),
            },
            {
              label: "Clipboard Auto-clear",
              desc: "Clear clipboard after 30 s",
              val: clipboard,
              fn: () => setClipboard(!clipboard),
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between px-5 py-4 bg-card"
            >
              <div>
                <div className="font-medium">{item.label}</div>
                <div className="text-sm text-muted-foreground">
                  {item.desc}
                </div>
              </div>
              <Toggle on={item.val} onToggle={item.fn} />
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 rounded-xl border border-border bg-card">
          <div className="text-sm font-medium mb-1">
            App Version
          </div>
          <div className="text-sm text-muted-foreground">
            KeyVault v1.0.0 — build 2026.06.06
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivePage({ page }: { page: Page }) {
  if (page === "passwd-list") return <PasswordListPage />;
  if (page === "nickname-manager")
    return <NicknameManagerPage />;
  return <ConfigPage />;
}

export default function App() {
  const [activePage, setActivePage] =
    useState<Page>("passwd-list");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    // {/* MARKER-MAKE-KIT-INVOKED */}
    <div className="size-full flex bg-background text-foreground ">
      {/* Sidebar */}
      <aside className="w-[25vw] max-w-sm shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border h-full">
        {/* Logo + App name */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <ShieldCheck
              size={20}
              className="text-primary-foreground"
            />
          </div>
          <div>
            <div className="text-xs text-sidebar-foreground/50 leading-none mb-0.5">
              Vault
            </div>
            <div className="font-semibold text-sidebar-foreground leading-none">
              KeyVault
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
              >
                <span
                  className={
                    active
                      ? "text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/50"
                  }
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Theme toggle */}
        <div className="px-4 py-5 border-t border-sidebar-border">
          <button
            onClick={() => setDark(!dark)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-sidebar-border bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors group"
          >
            <span className="text-sm text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground transition-colors">
              {dark ? "Dark Mode" : "Light Mode"}
            </span>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-sidebar text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground transition-colors shadow-sm">
              {dark ? <Moon size={16} /> : <Sun size={16} />}
            </span>
          </button>
        </div>
      </aside>

      {/* Main content — key forces remount on page change, resetting all local state */}
      <main className="flex-1 overflow-auto bg-background">
        <ActivePage key={activePage} page={activePage} />
      </main>
    </div>
  );
}