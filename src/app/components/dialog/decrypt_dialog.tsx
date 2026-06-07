import { useEffect, useRef, useState } from "react";
import { decyptPasswd, PasswdSummary } from "../../tauri_core/command_frontend";
import { Eye, X, Lock } from "lucide-react";
import { PasswdPageAction } from "../pages/dispacher/passwd_dispacher";

export default function DecryptDialog({
    entry,
    onClose,
    dispacher
}: {
    entry: PasswdSummary;
    onClose: () => void;
    dispacher: React.Dispatch<PasswdPageAction>
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


    const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e === undefined) {
            // 防止重复提交
            decyted();
        }
    };
    const decyted = async () => {
        if (!secretKey.trim()) {
            setError(true);
            return;
        }
        setError(false);
        try {
            const decrypted = await decyptPasswd(entry.uid, secretKey);
            setPlaintext(decrypted);
            // 如果需要同步到全局状态（比如用于复制或其他组件）
            dispacher({
                type: 'decypt',
                uid: entry.uid,
                plaintext: decrypted,
            });
        } catch (err) {
            console.error("解密失败", err);
            setError(true);
            setPlaintext(null);
        }
    }

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
                                onClick={() => decyted()}
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
