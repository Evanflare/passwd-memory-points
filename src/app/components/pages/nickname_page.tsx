import { Search, X, Lock } from "lucide-react";
import { useState } from "react";
import NicknameDecryptDialog from "../dialog/nickname_decrypt";
import { ScrollArea } from "../ui/scroll-area";
import { addNickname, getMemoryPoints, del_memory_point } from "../../tauri_core/command_frontend";

// 删除确认对话框组件
function DeleteConfirmDialog({
    open,
    pointStr,
    onClose,
    onSuccess,
}: {
    open: boolean;
    pointStr: string | null;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [password, setPassword] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        if (!pointStr || !password.trim()) {
            setError("请输入密钥");
            return;
        }
        setDeleting(true);
        setError(null);
        try {
            await del_memory_point(pointStr, password.trim());
            onSuccess();
            onClose();
        } catch (e: any) {
            setError(e || "删除失败，请检查密钥");
        } finally {
            setDeleting(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background rounded-2xl shadow-xl w-full max-w-md p-6 border border-border">
                <h3 className="text-lg font-semibold mb-2">确认删除</h3>
                <p className="text-muted-foreground text-sm mb-4">
                    此操作不可撤销，请输入您的密钥以确认删除该记忆点。
                </p>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="密钥"
                    className="w-full px-3 py-2 rounded-lg bg-input-background border border-border text-sm focus:border-primary outline-none transition-colors mb-4"
                    autoFocus
                />
                {error && <p className="text-destructive text-xs mb-3">{error}</p>}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-4 py-2 rounded-lg text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
                    >
                        {deleting ? "删除中..." : "确认删除"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function NicknameManagerPage({ isAndroid }: { isAndroid: boolean }) {
    const [newNickname, setNewNickname] = useState("");
    const [newKey, setNewKey] = useState("");
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [addSuccess, setAddSuccess] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [committed, setCommitted] = useState("");
    const [showDecryptDialog, setShowDecryptDialog] = useState(false);
    const [revealed, setRevealed] = useState(false);
    // 存储完整点列表（加密后的原始字符串）
    const [fullPoints, setFullPoints] = useState<string[]>([]);
    const [firstLoad, setFirstLoad] = useState<boolean>(true);

    // 删除对话框状态
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [pointToDelete, setPointToDelete] = useState<string | null>(null);

    const flush = async () => {
        const points = await getMemoryPoints(); // 完整加密字符串列表
        setFullPoints(points);
        setRevealed(false);
    };

    if (firstLoad) {
        flush();
        setFirstLoad(false);
    }

    // 显示时截断（取前16字符 + ...）
    const displayPoints = fullPoints.map((p) => {
        if (!revealed) return p.slice(0, 16) + "...";
        else return p;
    }
    )


    // 根据搜索词过滤（基于完整字符串）
    const filteredIndices = fullPoints.reduce<number[]>((acc, point, idx) => {
        if (point.includes(query)) acc.push(idx);
        return acc;
    }, []);

    return (
        <div className="relative h-full flex justify-center">
            <div
                className={`${isAndroid ? "p-6 w-full" : "p-8 w-4/5 max-w-4xl"} flex flex-col h-full`}
            >
                {/* 头部区域保持不变 */}
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <h1 className="mb-1">记忆点集</h1>
                        <p className="text-muted-foreground">
                            每个记忆点都帮助你加密你的密码。
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            if (!revealed) setShowDecryptDialog(true);
                            else flush();
                        }}
                        className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${revealed
                            ? "bg-muted border-border text-muted-foreground hover:text-foreground"
                            : "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                            }`}
                    >
                        <Lock size={13} />
                        {revealed ? "恢复密文" : "显示明文"}
                    </button>
                </div>

                {/* 添加记忆点表单保持不变 */}
                <div className="mb-6">
                    <div className="flex gap-2 items-center flex-wrap">
                        <input
                            type="text"
                            value={newNickname}
                            onChange={(e) => setNewNickname(e.target.value)}
                            placeholder="新建一个记忆点"
                            className="flex-1 px-3 py-2 rounded-lg bg-input-background text-foreground border border-border text-sm outline-none focus:border-primary transition-colors"
                        />
                        <input
                            type="password"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            placeholder="密钥"
                            className="w-40 px-3 py-2 rounded-lg bg-input-background text-foreground border border-border text-sm outline-none focus:border-primary transition-colors"
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
                                    setAddSuccess("添加成功");
                                    setNewNickname("");
                                    setNewKey("");
                                    flush();
                                } catch (e: any) {
                                    setAddError("添加失败,请检查密钥");
                                } finally {
                                    setAdding(false);
                                }
                            }}
                            disabled={adding}
                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition text-sm disabled:opacity-50"
                        >
                            {adding ? "添加中..." : "添加"}
                        </button>
                    </div>
                    {addError && <p className="text-xs text-destructive mt-2">{addError}</p>}
                    {addSuccess && <p className="text-xs text-success mt-2">{addSuccess}</p>}
                </div>

                {/* 搜索框保持不变 */}
                <div className="relative mb-5">
                    <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="搜索所有包含关键词…"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-input-background text-foreground border border-border text-sm outline-none focus:border-primary transition-colors"
                    />
                    {query && (
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

                {query && (
                    <p className="text-xs text-muted-foreground mb-3">
                        {filteredIndices.length} 结果关于: "
                        <span className="text-foreground">{query}</span>"
                    </p>
                )}

                <ScrollArea className="flex-1 min-h-0 rounded-b-2xl">
                    <div className="grid gap-3">
                        {filteredIndices.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground text-sm">
                                没有找到匹配的记忆点。
                            </div>
                        ) : (
                            filteredIndices.map((idx) => {
                                const fullPoint = fullPoints[idx];
                                const displayPoint = displayPoints[idx];
                                return (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-4 p-4 rounded-xl border border-primary/30 bg-primary/5 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
                                            <span className="text-base font-bold text-primary">
                                                {idx + 1}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold">Nickname {idx + 1}</div>
                                            <div className="text-xs text-muted-foreground mb-1">Local</div>
                                            <div
                                                className={`text-sm font-mono tracking-wide transition-all ${revealed
                                                    ? "text-foreground"
                                                    : "text-muted-foreground/60 select-none"
                                                    }`}
                                            >
                                                {displayPoint}
                                            </div>
                                        </div>
                                        <span
                                            className={`
                        ${revealed ? "" : "invisible"}
                        sm:inline-flex shrink-0 items-center text-xs px-2.5 py-1 rounded-full font-medium
                        bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700
                        cursor-pointer transition-colors duration-200
                      `}
                                            onClick={() => {
                                                setPointToDelete(fullPoint);
                                                setDeleteDialogOpen(true);
                                            }}
                                        >
                                            删除
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* 解密对话框（原有） */}
            {showDecryptDialog && (
                <NicknameDecryptDialog
                    onSuccess={(points) => {
                        setFullPoints(points);
                        setRevealed(true);
                        setShowDecryptDialog(false);
                    }}
                    onClose={() => setShowDecryptDialog(false)}
                />
            )}

            {/* 删除确认对话框 */}
            <DeleteConfirmDialog
                open={deleteDialogOpen}
                pointStr={pointToDelete}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setPointToDelete(null);
                }}
                onSuccess={() => {
                    setFullPoints((current_points) => {
                        return current_points.filter((p) => p !== pointToDelete)
                    });
                }}
            />
        </div>
    );
}