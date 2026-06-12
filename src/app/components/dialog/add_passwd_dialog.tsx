// src/components/dialog/add_password_dialog.tsx
import { useEffect, useRef, useState } from "react";
import { Plus, X, Shuffle } from "lucide-react";
import { addPasswd, plaintextPoints } from "../../tauri_core/command_frontend";
import { ScrollArea } from "../ui/scroll-area";
import AutocompleteInput from "../ui/autocomplete-input";

interface AddPasswordDialogProps {
    onClosed: () => void;
    onAdded?: () => void;
    hidden: boolean;
}


// const AutocompleteInput = memo(function AutocompleteInput({
//     value,
//     onChange,
//     options,
//     placeholder,
//     onKeyDown,
// }: AutocompleteInputProps) {
//     const [filtered, setFiltered] = useState<string[]>([]);
//     const [showDropdown, setShowDropdown] = useState(false);
//     const [highlightIndex, setHighlightIndex] = useState(-1);
//     const [preventAutoOpen, setPreventAutoOpen] = useState(false); // 新增：禁止自动弹出标志
//     const inputRef = useRef<HTMLInputElement>(null);
//     const wrapperRef = useRef<HTMLDivElement>(null);

//     const updateFiltered = (inputValue: string) => {
//         if (!inputValue.trim()) {
//             setFiltered([]);
//             setShowDropdown(false);
//             return;
//         }
//         const lowerQuery = inputValue.toLowerCase();
//         const matches = options.filter(opt =>
//             opt.toLowerCase().includes(lowerQuery)
//         );
//         setFiltered(matches);
//         setShowDropdown(matches.length > 0);
//         setHighlightIndex(-1);
//     };

//     const handleFocus = () => {
//         if (options.length === 0) return;
//         // 🔒 如果禁止自动弹出，则什么都不做，直接返回
//         if (preventAutoOpen) return;

//         if (value.trim() === "") {
//             setFiltered(options);
//             setShowDropdown(true);
//         } else {
//             updateFiltered(value);
//         }
//         setHighlightIndex(-1);
//     };

//     const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const newValue = e.target.value;
//         onChange(newValue);
//         // ✅ 用户主动修改内容 → 解除禁止自动弹出标志
//         setPreventAutoOpen(false);

//         if (options.length === 0) return;
//         if (newValue.trim() === "") {
//             setFiltered([]);
//             setShowDropdown(false);
//         } else {
//             const lowerQuery = newValue.toLowerCase();
//             const matches = options.filter(opt =>
//                 opt.toLowerCase().includes(lowerQuery)
//             );
//             setFiltered(matches);
//             setShowDropdown(matches.length > 0);
//         }
//         setHighlightIndex(-1);
//     };

//     // 点击外部关闭下拉（不影响 preventAutoOpen）
//     useEffect(() => {
//         const handleClickOutside = (e: MouseEvent) => {
//             if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
//                 setShowDropdown(false);
//             }
//         };
//         document.addEventListener("mousedown", handleClickOutside);
//         return () => document.removeEventListener("mousedown", handleClickOutside);
//     }, []);

//     const handleSelect = (selected: string) => {
//         onChange(selected);              // 更新父组件的值
//         setShowDropdown(false);          // 关闭下拉
//         setPreventAutoOpen(true);        // 🚫 禁止后续聚焦时自动弹出
//         inputRef.current?.focus();
//     };

//     const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//         if (!showDropdown) {
//             onKeyDown?.(e);
//             return;
//         }

//         switch (e.key) {
//             case "ArrowDown":
//                 e.preventDefault();
//                 setHighlightIndex(prev =>
//                     prev < filtered.length - 1 ? prev + 1 : prev
//                 );
//                 break;
//             case "ArrowUp":
//                 e.preventDefault();
//                 setHighlightIndex(prev => (prev > 0 ? prev - 1 : -1));
//                 break;
//             case "Enter":
//                 e.preventDefault();
//                 if (highlightIndex >= 0 && filtered[highlightIndex]) {
//                     handleSelect(filtered[highlightIndex]);
//                 } else if (filtered.length > 0) {
//                     handleSelect(filtered[0]);
//                 } else {
//                     onKeyDown?.(e);
//                 }
//                 break;
//             case "Escape":
//                 setShowDropdown(false);
//                 break;
//             default:
//                 onKeyDown?.(e);
//         }
//     };

//     return (
//         <div ref={wrapperRef} className="relative flex-1">
//             <input
//                 ref={inputRef}
//                 type="text"
//                 value={value}
//                 onChange={handleChange}
//                 onFocus={handleFocus}
//                 onKeyDown={handleKeyDown}
//                 placeholder={placeholder}
//                 autoComplete="off"
//                 className="w-full px-3 py-2 rounded-lg bg-input-background text-foreground border border-border text-sm outline-none focus:border-primary transition-colors"
//             />
//             {showDropdown && filtered.length > 0 && (
//                 <ul className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-auto">
//                     {filtered.map((opt, idx) => (
//                         <li
//                             key={opt}
//                             onClick={() => handleSelect(opt)}
//                             className={`px-3 py-2 text-sm cursor-pointer hover:bg-accent ${idx === highlightIndex ? "bg-accent" : ""
//                                 }`}
//                         >
//                             {opt}
//                         </li>
//                     ))}
//                 </ul>
//             )}
//         </div>
//     );
// });
// ------------------------------------

export default function AddPasswordDialog({ onClosed, onAdded, hidden }: AddPasswordDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [unique, setUnique] = useState("");
    const [parts, setParts] = useState<string[]>([""]); // 至少一个组成部分
    const [random, setRandom] = useState(false);
    const [key, setKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [needAuth, setAuthNeed] = useState<boolean>(true);
    const [keyError, setKeyError] = useState<string>("");
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [plaintext_points, setPlaintextPoints] = useState<string[]>([]);

    const onClose = () => {
        setAuthNeed(true);
        setKey("");
        onClosed();
    };

    const handleUnlock = async () => {
        setKeyError("");
        setLoading(true);
        try {
            const plaintext_list = await plaintextPoints(key);
            setPlaintextPoints(plaintext_list);
            setAuthNeed(false);
        } catch (e: any) {
            setKeyError(e?.message || "密钥不正确");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        nameInputRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClosed]);

    const updatePart = (index: number, value: string) => {
        setParts(prev => {
            const newParts = [...prev];
            newParts[index] = value;
            return newParts;
        });
    };

    const addPart = () => {
        setParts(prev => [...prev, ""]);
    };

    const removePart = (index: number) => {
        if (parts.length === 1) return;
        setParts(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        console.log("提交新的passwd...");
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
        console.log("校验通过，调用后端接口...");
        setLoading(true);
        setError(null);
        try {
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
                                <div className="font-semibold">添加一个密码记忆</div>
                                <div className="text-xs text-muted-foreground">
                                    加密并存储你的密码记忆
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
                        {needAuth ? (
                            <div className="px-6 py-5 flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm">校验密钥</label>
                                    <input
                                        type="password"
                                        value={key}
                                        onChange={(e) => setKey(e.target.value)}
                                        placeholder="输入你的密钥"
                                        className="w-full px-3 py-2 rounded-lg bg-input-background text-foreground border border-border text-sm outline-none focus:border-primary transition-colors"
                                        onKeyDown={(e) => { if (e.key === "Enter") handleUnlock(); }}
                                    />
                                    <p className="text-xs text-muted-foreground">你需要先通过密钥校验之后才能查看详细内容</p>
                                    {keyError && <p className="text-xs text-destructive">{keyError}</p>}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleUnlock}
                                        disabled={loading || !key}
                                        className="py-2 px-4 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition text-sm disabled:opacity-50"
                                    >
                                        {loading ? "解锁中..." : "解锁"}
                                    </button>
                                    <button
                                        onClick={() => setKey("")}
                                        className="py-2 px-4 rounded-lg border border-border bg-muted/10 text-muted-foreground hover:bg-muted/20 transition text-sm"
                                    >
                                        重置
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="px-6 py-5 flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm">名称 *</label>
                                    <input
                                        ref={nameInputRef}
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="例如: bilibili 密码"
                                        className="w-full px-3 py-2 rounded-lg bg-input-background text-foreground border border-border text-sm outline-none focus:border-primary transition-colors"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm">描述 (可选)</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="时间、地点、人物、网址等"
                                        rows={2}
                                        className="w-full px-3 py-2 rounded-lg bg-input-background text-foreground border border-border text-sm outline-none focus:border-primary transition-colors resize-none"
                                    />
                                </div>


                                <div className="flex flex-col gap-2">
                                    <label className="text-sm">密码记忆点 *</label>
                                    {parts.map((part, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <AutocompleteInput
                                                value={part}
                                                onChange={(val) => updatePart(idx, val)}
                                                options={plaintext_points}
                                                placeholder={`记忆点 ${idx + 1}`}
                                                onKeyDown={handleKeyDown}
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
                                        + 添加更多
                                    </button>
                                    <p className="text-xs text-muted-foreground">
                                        这些关键词会被连接在一起但通过空格分隔,如果选择了随机打乱那么顺序将会变化。
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm">随机串</label>
                                    <input
                                        type="text"
                                        value={unique}
                                        onChange={(e) => setUnique(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="随便填一个值，确保每个密码都不一样！"
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
                                        <span>打乱记忆点顺序</span>
                                        <Shuffle size={14} className="text-muted-foreground" />
                                    </label>
                                </div>

                                <div className="flex flex-col gap-1.5 hidden">
                                    <label className="text-sm">加密密钥 *</label>
                                    <input
                                        type="password"
                                        value={key}
                                        onChange={(e) => setKey(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="你的加密密钥"
                                        className="w-full px-3 py-2 rounded-lg bg-input-background text-foreground border border-border text-sm outline-none focus:border-primary transition-colors"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        这个密钥将用于加密你的记忆点，需要与记忆点密钥保持一致。
                                    </p>
                                </div>

                                {error && <p className="text-xs text-destructive">{error}</p>}

                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
                                >
                                    {loading ? "添加中..." : "添加"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setName("");
                                        setDescription("");
                                        setUnique("");
                                        setParts([""]);
                                        setRandom(false);
                                        // setKey("");
                                        setLoading(false);
                                        setError(null);
                                    }}
                                    className="w-full py-2 rounded-lg border border-border bg-muted/10 text-muted-foreground hover:bg-muted/20 transition-colors text-sm"
                                >
                                    重置表单
                                </button>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </div>
        )
    );
}