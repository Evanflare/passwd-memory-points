// src/app/components/dialog/edit_passwd_dialog.tsx
import { useEffect, useRef, useState } from "react";
import { X, Edit3, Eye } from "lucide-react";
import { getPasswd, updatePasswd } from "../../tauri_core/command_frontend";
import { ScrollArea } from "../ui/scroll-area";
import type { PasswdSummary } from "../../tauri_core/command_frontend";

interface EditPasswdDialogProps {
    passwd: PasswdSummary; // 包含 uid, name, description, ciphertext
    hidden: boolean;
    onClose: () => void;
    onUpdated?: () => void;
}

export default function EditPasswdDialog({ passwd, hidden, onClose, onUpdated }: EditPasswdDialogProps) {
    const [stage, setStage] = useState<"auth" | "view">("auth");
    const [secret, setSecret] = useState("");
    const [keyError, setKeyError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // initial values (from props)
    const initial = useRef({
        name: passwd.name,
        description: passwd.description,
        unique: passwd.uid ? passwd.uid : "", // 不会展示 uid but we keep for update calls
    });

    // editable states
    const [name, setName] = useState(initial.current.name);
    const [description, setDescription] = useState(initial.current.description);
    const [unique, setUnique] = useState(initial.current.unique);
    const [plaintext, setPlaintext] = useState(""); // decrypted password (populated after auth)

    const [showKey, setShowKey] = useState(false); // 按住时显示 secret 明文
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const nameRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    useEffect(() => {
        if (stage === "view") nameRef.current?.focus();
    }, [stage]);

    // 校验 secret 并拉取明文 password（使用 getPasswd(uid, key)）
    const handleUnlock = async () => {
        setKeyError(null);
        setLoading(true);
        try {
            const plain = await getPasswd(passwd.uid, secret);
            setPlaintext(plain);
            setStage("view");
            // 保持 initial values in case parent changes later
            initial.current = { name: passwd.name, description: passwd.description, unique: passwd.uid };
        } catch (e: any) {
            setKeyError(e?.message || "Secret incorrect");
        } finally {
            setLoading(false);
        }
    };

    // const changed = {
    //     name: name !== initial.current.name,
    //     description: description !== initial.current.description,
    //     unique: unique !== initial.current.unique,
    //     plaintext: plaintext !== "" && plaintext !== undefined && plaintext !== null && plaintext !== "" && plaintext !== "" /* whether user edited decrypted value */ ? false : false
    // };

    // 更精确判断 plaintext 是否被修改：比较与解密后得到的原始 plain
    // 为简单起见：在解密后 plaintextOrig 保存原值并比较
    const [plaintextOrig, setPlaintextOrig] = useState<string | null>(null);
    useEffect(() => {
        if (stage === "view" && plaintext && plaintextOrig === null) {
            setPlaintextOrig(plaintext);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stage, plaintext]);

    const isFieldChanged = {
        name: name !== initial.current.name,
        description: description !== initial.current.description,
        unique: unique !== initial.current.unique,
        plaintext: plaintextOrig !== null ? plaintext !== plaintextOrig : false,
    };

    const handleSave = async () => {
        setSaveError(null);
        setSaving(true);
        try {
            // only send changed values (backend accepts Option)
            const nameToSend = isFieldChanged.name ? name : undefined;
            const descriptToSend = isFieldChanged.description ? description : undefined;
            const plaintextToSend = isFieldChanged.plaintext ? plaintext : undefined;

            await updatePasswd({
                uid: passwd.uid,
                name: nameToSend,
                descript: descriptToSend,
                plaintext: plaintextToSend,
                user_key: secret
            });
            onUpdated?.();
            onClose();
        } catch (e: any) {
            setSaveError(e || "Update failed");
        } finally {
            setSaving(false);
        }
    };

    if (hidden) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
                {/* header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Edit3 size={15} className="text-primary" />
                        </div>
                        <div>
                            <div className="font-semibold">View / Edit Entry</div>
                            <div className="text-xs text-muted-foreground">Enter secret to unlock and edit</div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>

                <ScrollArea className="h-[calc(90vh-88px)] rounded-b-2xl">
                    <div className="px-6 py-5 flex flex-col gap-4">
                        {stage === "auth" ? (
                            <>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm">Secret Key</label>
                                    <input
                                        type="password"
                                        value={secret}
                                        onChange={(e) => setSecret(e.target.value)}
                                        placeholder="Enter your master key to unlock"
                                        className="w-full px-3 py-2 rounded-lg bg-input-background text-foreground border border-border text-sm outline-none focus:border-primary transition-colors"
                                        onKeyDown={(e) => { if (e.key === "Enter") handleUnlock(); }}
                                    />
                                    <p className="text-xs text-muted-foreground">You must authenticate to view or edit this entry.</p>
                                    {keyError && <p className="text-xs text-destructive">{keyError}</p>}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleUnlock}
                                        disabled={loading || !secret}
                                        className="py-2 px-4 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition text-sm disabled:opacity-50"
                                    >
                                        {loading ? "Unlocking..." : "Unlock"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSecret("")
                                        }}
                                        className="py-2 px-4 rounded-lg border border-border bg-muted/10 text-muted-foreground hover:bg-muted/20 transition text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Name */}
                                <div className={`flex flex-col gap-1.5 ${isFieldChanged.name ? "ring-2 ring-yellow-300 rounded-md p-2" : ""}`}>
                                    <label className="text-sm flex items-center justify-between">
                                        <span>Name</span>
                                        {isFieldChanged.name && <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Modified</span>}
                                    </label>
                                    <input
                                        ref={nameRef}
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-input-background text-foreground border border-border text-sm outline-none focus:border-primary transition-colors"
                                    />
                                </div>

                                {/* Description */}
                                <div className={`flex flex-col gap-1.5 ${isFieldChanged.description ? "ring-2 ring-yellow-300 rounded-md p-2" : ""}`}>
                                    <label className="text-sm flex items-center justify-between">
                                        <span>Description</span>
                                        {isFieldChanged.description && <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Modified</span>}
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 rounded-lg bg-input-background text-foreground border border-border text-sm outline-none focus:border-primary transition-colors resize-none"
                                    />
                                </div>

                                {/* Unique identifier (不渲染) */}
                                {/* <div
                                    className={`flex flex-col gap-1.5 ${isFieldChanged.unique ? "ring-2 ring-yellow-300 rounded-md p-2" : ""}`}>
                                    <label className="text-sm flex items-center justify-between">
                                        <span>Unique Identifier</span>
                                        {isFieldChanged.unique && <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Modified</span>}
                                    </label>
                                    <input
                                        type="text"
                                        value={unique}
                                        onChange={(e) => setUnique(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-input-background text-foreground border border-border text-sm outline-none focus:border-primary transition-colors"
                                    />
                                </div> */}

                                {/* Decrypted password with press-and-hold reveal */}
                                <div className={`flex flex-col gap-1.5 ${isFieldChanged.plaintext ? "ring-2 ring-yellow-300 rounded-md p-2" : ""}`}>
                                    <label className="text-sm flex items-center justify-between">
                                        <span>Password</span>
                                        {isFieldChanged.plaintext && <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Modified</span>}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showKey ? "text" : "password"}
                                            value={plaintext}
                                            onChange={(e) => setPlaintext(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-input-background text-foreground border border-border text-sm outline-none focus:border-primary transition-colors font-mono"
                                            spellCheck={false}
                                        />
                                        <button
                                            aria-label="Reveal password"
                                            onMouseDown={() => setShowKey(true)}
                                            onMouseUp={() => setShowKey(false)}
                                            onMouseLeave={() => setShowKey(false)}
                                            onTouchStart={() => setShowKey(true)}
                                            onTouchEnd={() => setShowKey(false)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                                        >
                                            <Eye size={14} />
                                        </button>
                                        <p className="text-xs text-muted-foreground mt-1">按住眼睛图标查看明文，松开恢复掩码。</p>
                                    </div>
                                </div>

                                {saveError && <p className="text-xs text-destructive">{saveError}</p>}

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving || (!isFieldChanged.name && !isFieldChanged.description && !isFieldChanged.unique && !isFieldChanged.plaintext)}
                                        className="py-2 px-4 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition text-sm disabled:opacity-50"
                                    >
                                        {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            // revert changes to initial (keep decrypted value as originally fetched)
                                            setName(initial.current.name);
                                            setDescription(initial.current.description);
                                            setUnique(initial.current.unique);
                                            if (plaintextOrig !== null) setPlaintext(plaintextOrig);
                                        }}
                                        className="py-2 px-4 rounded-lg border border-border bg-muted/10 text-muted-foreground hover:bg-muted/20 transition text-sm"
                                    >
                                        Revert
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}