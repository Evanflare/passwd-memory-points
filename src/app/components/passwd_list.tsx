import { PasswdSummary } from "../tauri_core/command_frontend";

export default function PasswdListTable({
    filtered,
    setDecryptTarget,
    onRowClick,
}: {
    filtered: PasswdSummary[];
    setDecryptTarget: (e: PasswdSummary) => void;
    onRowClick?: (e: PasswdSummary) => void;
}) {
    return (
        <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left px-4 py-3 text-muted-foreground">Name</th>
                        <th className="text-left px-4 py-3 text-muted-foreground">Description</th>
                        {/* <th className="text-left px-4 py-3 text-muted-foreground">Last Updated</th> */}
                        <th className="px-4 py-3" />
                    </tr>
                </thead>
                <tbody>
                    {filtered.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                                No entries match your search.
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
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={(ev) => {
                                            ev.stopPropagation();
                                            setDecryptTarget(e);
                                        }}
                                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors ml-auto"
                                    >
                                        Decrypt
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