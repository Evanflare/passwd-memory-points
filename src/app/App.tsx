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
      <main className="flex-1 overflow-hidden bg-background">
        <ActivePage key={activePage} page={activePage} />
      </main>
    </div>
  );
}