import { Search, X, Lock } from "lucide-react";
import { useState } from "react";
import NicknameDecryptDialog from "../dialog/nickname_decrypt";
import { ScrollArea } from "../ui/scroll-area";
import { addNickname, getMemoryPoints } from "../../tauri_core/command_frontend"

export default function NicknameManagerPage() {
    const [newNickname, setNewNickname] = useState("");
    const [newKey, setNewKey] = useState("");
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [addSuccess, setAddSuccess] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [committed, setCommitted] = useState("");
    const [showDecryptDialog, setShowDecryptDialog] =
        useState(false);
    const [revealed, setRevealed] = useState(false);
    const [pointList, setPointList] = useState<string[]>([]);
    const [firstLoad, setFirstLoad] = useState<boolean>(true);
    // 调用这个函数，触发加密point获取，搜寻与渲染
    let flush = async () => {
        let points = await getMemoryPoints();
        points = points.map((p) => p.slice(0, 16) + '...')
        setPointList(points);
        setRevealed(false);
    }
    if (firstLoad) {
        flush();
        setFirstLoad(false);
    }
    return (
        <div className="relative h-screen  flex justify-center">
            <div className="p-8 w-4/5 max-w-4xl  flex flex-col h-full">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <h1 className="mb-1">记忆点集</h1>
                        <p className="text-muted-foreground">
                            每个记忆点都帮助你加密你的密码。
                        </p>
                    </div>
                    {/* Single page-level decrypt button */}
                    <button
                        onClick={() => {
                            if (!revealed) setShowDecryptDialog(true);
                            else {

                                flush();
                            }
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
                {/* Add Nickname — simple form */}
                <div className="mb-6">
                    <div className="flex gap-2 items-center">
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
                        placeholder="搜索所有包含关键词…"
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
                        {pointList.length} 结果关于: "
                        <span className="text-foreground">{committed}</span>
                        "
                    </p>
                )}
                <ScrollArea className="flex-1 min-h-0 rounded-b-2xl">
                    {/* Nickname cards */}
                    <div className="grid gap-3">
                        {pointList.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground text-sm">
                                No nicknames match your search.
                            </div>
                        ) : (
                            pointList.filter((n) => n.includes(query)).map((n, i) => {
                                return (
                                    <div
                                        key={i}
                                        className={`flex items-center gap-4 p-4 rounded-xl border border-primary/30 bg-primary/5 transition-colors`}
                                    >
                                        {/* Color avatar */}
                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/10`}
                                        >
                                            <span
                                                className={`text-base font-bold text-primary`}
                                            >
                                                {i + 1}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div
                                                className={`font-semibold ${i + 1}`}
                                            >
                                                Nickname {i + 1}
                                            </div>
                                            <div className="text-xs text-muted-foreground mb-1">
                                                Local
                                            </div>
                                            <div
                                                className={`text-sm font-mono tracking-wide transition-all ${revealed ? "text-foreground" : "text-muted-foreground/60 select-none"}`}
                                            >
                                                {n}
                                            </div>
                                        </div>

                                        {/* Platform tag */}
                                        <span
                                            className={`hidden sm:inline-flex shrink-0 text-xs px-2.5 py-1 rounded-full font-medium bg-primary/10 text-primary`}
                                        >
                                            Local
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>

            </div>
            {/* Decrypt dialog */}
            {showDecryptDialog && (
                <NicknameDecryptDialog
                    onSuccess={(points) => {
                        setPointList(points);
                        setRevealed(true);
                        setShowDecryptDialog(false);
                    }}
                    onClose={() => setShowDecryptDialog(false)}
                />
            )}
        </div>
    );
}