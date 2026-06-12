import { X, Lock } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { plaintextPoints } from "../../tauri_core/command_frontend";

/// 当校验密码成功的时候，会返回一个明文的points列表。
export default function NicknameDecryptDialog({
    onSuccess,
    onClose,
}: {
    onSuccess: (points: string[]) => void;
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

    const attempt = useCallback(async () => {
        let plaintext_points = await plaintextPoints(secretKey);
        if (plaintext_points) {
            onSuccess(plaintext_points);
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
                                解密所有记忆点
                            </div>
                            <div className="text-xs text-muted-foreground">
                                展示记忆点集
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
                        <label className="text-sm">密钥</label>
                        <input
                            ref={inputRef}
                            type="password"
                            value={secretKey}
                            onChange={(e) => {
                                setSecretKey(e.target.value);
                                setError(false);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="按Enter确认"
                            className={`w-full px-3 py-2 rounded-lg bg-input-background border text-sm outline-none transition-colors ${error
                                ? "border-destructive"
                                : "border-border focus:border-primary"
                                }`}
                        />
                        {error && (
                            <p className="text-xs text-destructive">
                                密钥不正确，请重新尝试
                            </p>
                        )}
                        {/* <p className="text-xs text-muted-foreground">
                            Demo hint: the key is{" "}
                            <code className="bg-muted px-1 rounded">
                                1234
                            </code>
                        </p> */}
                    </div>
                    <button
                        onClick={attempt}
                        className="w-full py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm"
                    >
                        确认
                    </button>
                </div>
            </div>
        </div>
    );
}
