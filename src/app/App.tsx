import {
  useState,
  useEffect,
} from "react";
import {
  KeyRound,
  UserRound,
  Settings,
  ShieldCheck,
  Sun,
  Moon,
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


import PasswordListPage from "./components/pages/passwd_list_page";
import ConfigPage from "./components/pages/config_page";
import NicknameManagerPage from "./components/pages/nickname_page";
function ActivePage({ page }: { page: Page }) {
  if (page === "passwd-list") return <PasswordListPage />;
  if (page === "nickname-manager")
    return <NicknameManagerPage />;
  return <ConfigPage />;
}

export default function App() {
  console.log("App.tsx 被加载了");
  const [activePage, setActivePage] =
    useState<Page>("passwd-list");
  const [dark, setDark] = useState(false);

  // 简单的 Android 检测（运行时）——用于在 Android 上调整布局
  const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    // {/* MARKER-MAKE-KIT-INVOKED */}
    <div className="size-full flex flex-col min-h-screen bg-background text-foreground ">
      {/* Header (Android 时显示暗黑切换和 Log) */}
      {isAndroid && (
        <header className="w-full border-b border-sidebar-border bg-sidebar px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-primary-foreground" />
            </div>
            <div>
              <div className="text-xs text-sidebar-foreground/50 leading-none mb-0.5">Vault</div>
              <div className="font-semibold text-sidebar-foreground leading-none">KeyVault</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDark(!dark)}
              className="flex items-center gap-2 px-3 py-1 rounded-md border border-sidebar-border bg-sidebar-accent/50"
            >
              <span>{dark ? "Dark" : "Light"}</span>
              <span className="w-7 h-7 rounded flex items-center justify-center">
                {dark ? <Moon size={16} /> : <Sun size={16} />}
              </span>
            </button>
          </div>
        </header>
      )}

      <div className="flex-1 flex">
        {/* Sidebar (非 Android 显示) */}
        {!isAndroid && (
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

            {/* Theme toggle (仅在非 Android 的侧栏中显示) */}
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
        )}

        {/* Main content — key forces remount on page change, resetting all local state */}
        <main className={`flex-1 overflow-auto bg-background ${isAndroid ? 'pb-16' : ''}`}>
          <ActivePage key={activePage} page={activePage} />
        </main>
      </div>

      {/* Footer (Android 时将导航放在底部) */}
      {isAndroid && (
        <footer className="w-full border-t border-sidebar-border bg-sidebar px-2 py-2 fixed bottom-0 left-0 right-0">
          <nav className="max-w-xl mx-auto flex items-center justify-between">
            {NAV_ITEMS.map((item) => {
              const active = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`flex-1 flex flex-col items-center gap-1 px-3 py-2 rounded-md text-sm transition-colors ${active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                >
                  <span className={active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/50"}>
                    {item.icon}
                  </span>
                  <span className="text-xs leading-none">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </footer>
      )}
    </div>
  );
}