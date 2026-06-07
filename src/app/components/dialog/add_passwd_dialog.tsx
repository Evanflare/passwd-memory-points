// src/components/dialog/add_password_dialog.tsx
import { useEffect, useRef, useState } from "react";
import { Plus, X, Shuffle } from "lucide-react";
import { addPasswd } from "../../tauri_core/command_frontend";
import { ScrollArea } from "../ui/scroll-area";

interface AddPasswordDialogProps {
    onClose: () => void;
    onAdded?: () => void;
    hidden: boolean;
}

export default function AddPasswordDialog({ onClose, onAdded, hidden }: AddPasswordDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [unique, setUnique] = useState("");
    const [parts, setParts] = useState<string[]>([""]); // 至少一个组成部分
    const [random, setRandom] = useState(false);
    const [key, setKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        nameInputRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    // 处理 parts 列表变更
    const updatePart = (index: number, value: string) => {
        const newParts = [...parts];
        newParts[index] = value;
        setParts(newParts);
    };

    const addPart = () => {
        setParts([...parts, ""]);
    };

    const removePart = (index: number) => {
        if (parts.length === 1) return;
        const newParts = parts.filter((_, i) => i !== index);
        setParts(newParts);
    };

    const handleSubmit = async () => {
        console.log("提交新的passwd...")
        if (!name.trim()) {
            setError("Name is required");
            return;
        }
        if (!unique.trim()) {
            setError("Unique identifier is required");
            return;
        }
        if (!random && parts.some(p => !p.trim())) {
            setError("All password parts must be filled (or enable random generation)");
            return;
        }
        if (!key.trim()) {
            setError("Secret key is required");
            return;
        }
        console.log("校验通过，调用后端接口...")
        setLoading(true);
        setError(null);
        try {
            // 过滤空字符串
            const filteredParts = parts.filter(p => p.trim() !== "");
            await addPasswd(
                filteredParts,
                unique,
                random,
                name,
                description,
                key
            );
            onAdded?.();
            onClose();
        } catch (err: any) {
            console.error("添加失败", err);
            setError(err.message || "Failed to add password");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        !hidden && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Plus size={15} className="text-primary" />
                            </div>
                            <div>
                                <div className="font-semibold">Add New Entry</div>
                                <div className="text-xs text-muted-foreground">
                                    Securely store a password
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
                    <ScrollArea className="h-[calc(90vh-88px)] rounded-b-2xl">
                        {/* Body */}
                        <div className="px-6 py-5 flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm">Name *</label>
                                <input
                                    ref={nameInputRef}
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="e.g., GitHub"
                                    className="w-full px-3 py-2 rounded-lg bg-input-background text-foreground border border-border text-sm outline-none focus:border-primary transition-colors"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm">Description (optional)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Additional notes..."
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg bg-input-background text-foreground border border-border text-sm outline-none focus:border-primary transition-colors resize-none"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm">Unique Identifier *</label>
                                <input
                                    type="text"
                                    value={unique}
                                    onChange={(e) => setUnique(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="e.g., user@github.com"
                                    className="w-full px-3 py-2 rounded-lg bg-input-background text-foreground border border-border text-sm outline-none focus:border-primary transition-colors"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="text-sm flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={random}
                                        onChange={(e) => setRandom(e.target.checked)}
                                        className="rounded border-border"
                                    />
                                    <span>Randomly part number</span>
                                    <Shuffle size={14} className="text-muted-foreground" />
                                </label>
                            </div>


                            <div className="flex flex-col gap-2">
                                <label className="text-sm">Password Parts *</label>
                                {parts.map((part, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            value={part}
                                            onChange={(e) => updatePart(idx, e.target.value)}
                                            placeholder={`Part ${idx + 1}`}
                                            className="flex-1 px-3 py-2 rounded-lg bg-input-background text-foreground border border-border text-sm outline-none focus:border-primary transition-colors"
                                        />
                                        {parts.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removePart(idx)}
                                                className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addPart}
                                    className="text-xs text-primary hover:underline self-start"
                                >
                                    + Add part
                                </button>
                                <p className="text-xs text-muted-foreground">
                                    The password will be formed by concatenating these parts (in order).
                                </p>
                            </div>


                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm">Secret Key *</label>
                                <input
                                    type="password"
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Your master key"
                                    className="w-full px-3 py-2 rounded-lg bg-input-background text-foreground border border-border text-sm outline-none focus:border-primary transition-colors"
                                />
                                <p className="text-xs text-muted-foreground">
                                    This key will be used to encrypt the password.
                                </p>
                            </div>

                            {error && (
                                <p className="text-xs text-destructive">{error}</p>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
                            >
                                {loading ? "Adding..." : "Add Entry"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setName("");
                                    setDescription("");
                                    setUnique("");
                                    setParts([""]);
                                    setRandom(false);
                                    setKey("");
                                    setLoading(false);
                                    setError(null);
                                }}
                                className="w-full py-2 rounded-lg border border-border bg-muted/10 text-muted-foreground hover:bg-muted/20 transition-colors text-sm"
                            >
                                Reset form
                            </button>
                        </div>
                    </ScrollArea>
                </div>
            </div >
        )

    );
} 