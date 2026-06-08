import { useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { getConfig } from "../../tauri_core/command_frontend";

export default function ConfigPage() {
    const [autoLock, setAutoLock] = useState(true);
    const [biometric, setBiometric] = useState(false);
    const [clipboard, setClipboard] = useState(true);
    const [passwdFilePath, setPasswdFilePath] = useState("");
    const [configPath, setConfigPath] = useState("");
    const [defaultChar, setDefaultChar] = useState("");
    async function updateConfig() {
        let config = await getConfig();
        setPasswdFilePath(config.passwd_file_path);
        setConfigPath(config.profile_path);
        setDefaultChar(config.default_fill_char);
    };
    updateConfig();
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
        <div className="relative  h-screen w-full flex justify-center p-8">
            <div className="p-8 w-4/5 max-w-4xl flex flex-col h-full">
                <h1 className="mb-1">Config</h1>
                <p className="text-muted-foreground mb-6">
                    Adjust application preferences.
                </p>
                <ScrollArea className="flex-1 min-h-0 rounded-b-2xl">
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
                            passwd-nickname v1.0.0 — build 2026.06.08
                        </div>
                    </div>
                    <div className="mt-6 p-4 rounded-xl border border-border bg-card">
                        <div className="text-sm font-medium mb-1">
                            Passwd File Path
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {passwdFilePath}
                        </div>
                    </div>
                    <div className="mt-6 p-4 rounded-xl border border-border bg-card">
                        <div className="text-sm font-medium mb-1">
                            Config File Path
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {configPath}
                        </div>
                    </div>
                    <div className="mt-6 p-4 rounded-xl border border-border bg-card">
                        <div className="text-sm font-medium mb-1">
                            Default Fill Character
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {defaultChar}
                        </div>
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}