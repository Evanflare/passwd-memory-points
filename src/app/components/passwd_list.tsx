import { PasswdSummary } from "../tauri_core/command_frontend";

export default function PasswdListTable({
    filtered,
    setDecryptTarget,
    onRowClick,
    onDelete,
}: {
    filtered: PasswdSummary[];
    setDecryptTarget: (e: PasswdSummary) => void;
    onRowClick?: (e: PasswdSummary) => void;
    onDelete: (uid: string) => void;
}) {
    return (
        <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left px-4 py-3 text-muted-foreground">名称</th>
                        <th className="text-left px-4 py-3 text-muted-foreground">描述</th>
                        {/* <th className="text-left px-4 py-3 text-muted-foreground">Last Updated</th> */}
                        <th className="px-4 py-3" />
                        <th className="px-4 py-3" />
                    </tr>
                </thead>
                <tbody>
                    {filtered.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                                没有搜索到任何结果
                            </td>
                        </tr>
                    ) : (
                        filtered.map((e, i) => (
                            <tr
                                key={e.uid}
                                onClick={() => onRowClick?.(e)}
                                className={`border-b border-border last:border-0 hover:bg-accent/40 transition-colors ${i % 2 !== 0 ? "bg-muted/20" : ""} cursor-pointer`}
                            >
                                <td className="px-4 py-3 font-medium whitespace-nowrap">{e.name}</td>
                                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{e.description}</td>
                                {/* <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{'TODO: format date nicely'}</td> */}
                                <td className="px-1 py-3 text-right">
                                    <button
                                        onClick={(ev) => {
                                            ev.stopPropagation();
                                            setDecryptTarget(e);
                                        }}
                                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors ml-auto"
                                    >
                                        解密
                                    </button>

                                </td>
                                <td className="px-1 py-3 text-right">
                                    <button
                                        onClick={(ev) => {
                                            ev.stopPropagation();
                                            onDelete?.(e.uid)
                                        }}
                                        className="sm:inline-flex shrink-0 items-center text-xs px-2.5 py-1 rounded-full font-medium
                        bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700
                        cursor-pointer transition-colors duration-200 flex items-center gap-1 text-xs px-3 py-1.5 rounded-md  hover:bg-accent  ml-auto"
                                    >
                                        删除
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}