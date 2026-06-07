import { PasswdSummary, searchPasswds } from "../../tauri_core/command_frontend";
import PasswdListTable from "../../components/passwd_list";
import { Search, X, Plus } from "lucide-react";
import { useState, useEffect } from "react"; // 引入 useEffect
import DecryptDialog from "../dialog/decrypt_dialog";
import { actionReducer, init_state } from "./dispacher/passwd_dispacher";
import { useImmerReducer } from "use-immer";
import AddPasswordDialog from "../dialog/add_passwd_dialog";
import { ScrollArea } from "../ui/scroll-area";
import UpdatePasswdDialog from "../dialog/update_passwd_dialog";

export default function PasswordListPage() {
    console.log("组件渲染开始"); // 1. 确认组件是否渲染

    const [decryptTarget, setDecryptTarget] = useState<PasswdSummary | null>(null);
    const [passwdState, dispatch] = useImmerReducer(actionReducer, init_state);
    const [addPasswdFlag, changeAddFlag] = useState<boolean>(false);
    const [updateTarget, setUpdateTarget] = useState<PasswdSummary | null>(null);
    console.log("当前 passwdState:", passwdState); // 2. 查看状态

    useEffect(() => {
        console.log("首次加载 useEffect 触发");
        dispatch({ type: 'search', query: "" });
    }, []);

    useEffect(() => {
        console.log("query 变化 useEffect 触发, query =", passwdState.query);
        const doSearch = async () => {
            console.log("开始调用 searchPasswds, 参数:", passwdState.query);
            try {
                const filtered_list = await searchPasswds(passwdState.query);
                console.log("searchPasswds 返回结果:", filtered_list);
                dispatch({ type: '_update-list', filtered_list });
            } catch (err) {
                console.error("searchPasswds 调用失败:", err);
            }
        };
        doSearch();
    }, [passwdState.query]);

    return (
        <div className="relative  h-screen  flex justify-center">
            <div className="p-8  w-4/5 max-w-4xl  flex flex-col h-full">
                <h1 className="mb-1">Password List</h1>
                <p className="text-muted-foreground mb-6">
                    Manage your saved credentials securely.
                </p>

                {/* Search — always visible above results */}
                <div className="relative mb-5">
                    <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                    <input
                        type="text"
                        value={passwdState.query}
                        onChange={(e) => {
                            dispatch({
                                type: "search",
                                query: e.currentTarget.value
                            })
                        }}
                        placeholder="Search by name or description… (Enter to search)"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-input-background text-foreground border border-border text-sm outline-none focus:border-primary transition-colors"
                    />
                    {passwdState.query && (
                        <button
                            onClick={() => {
                                // 此方法被废弃
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>

                {passwdState.query && (
                    <p className="text-xs text-muted-foreground mb-3">
                        {passwdState.filtered_list.length} result
                        {passwdState.filtered_list.length !== 1 ? "s" : ""} for "
                        <span className="text-foreground">{passwdState.query}</span>
                        "
                    </p>
                )}
                <ScrollArea className="flex-1 min-h-0 rounded-b-2xl">

                    {/* Table */}
                    <PasswdListTable
                        filtered={passwdState.filtered_list}
                        setDecryptTarget={setDecryptTarget}
                        onRowClick={setUpdateTarget}
                    />
                </ScrollArea>
            </div>

            {/* Floating Add button */}
            <button
                onClick={() => changeAddFlag(true)}
                className="fixed bottom-8 right-8 flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 active:scale-95 transition-all">
                <Plus size={16} />
                Add New Entry
            </button>

            {/* Decrypt dialog */}
            {decryptTarget && (
                <DecryptDialog
                    entry={decryptTarget}
                    onClose={() => setDecryptTarget(null)}
                    dispacher={dispatch}
                />
            )}
            {updateTarget && (
                <UpdatePasswdDialog
                    passwd={updateTarget}
                    hidden={false}
                    onClose={() => setUpdateTarget(null)}
                    onUpdated={() => {
                        setUpdateTarget(null);
                        dispatch({ type: "search", query: passwdState.query }); // 刷新列表或使用你已有的 action
                    }}
                />
            )}
            <AddPasswordDialog
                onClose={() => changeAddFlag(false)}
                onAdded={() => dispatch({ type: "added" })}
                hidden={!addPasswdFlag}
            />

        </div>
    );
}