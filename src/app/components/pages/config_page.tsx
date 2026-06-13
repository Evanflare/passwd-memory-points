import { useState, useEffect } from "react";
import { getConfig } from "../../tauri_core/command_frontend";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog"; // 请确保路径正确
import { Button } from "../ui/button"; // 可选，用于复制按钮样式
import { handleCheckOut, handleExport, handleChooseImportFile } from "../../tauri_core/import_export_config";
import { message } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import ChangeSecretDialog from "../dialog/change_secret.dialog";

export default function ConfigPage() {
    const [passwdFilePath, setPasswdFilePath] = useState("");
    const [configPath, setConfigPath] = useState("");
    const [defaultChar, setDefaultChar] = useState("");
    //const [selectedItem, setSelectedItem] = useState<{ label: string; value: string } | null>(null);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
    const [localSecret, setLocalSecret] = useState("");
    const [importSecret, setImportSecret] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [changeKeyDialogOpen, setChangeKeyDialogOpen] = useState(false);
    useEffect(() => {
        async function loadConfig() {
            const config = await getConfig();
            setPasswdFilePath(config.passwd_file_path);
            setConfigPath(config.profile_path);
            setDefaultChar(config.default_fill_char);
        }
        loadConfig();
    }, []);

    const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

    const items = [
        { label: "密码文件存储路径", value: passwdFilePath },
        { label: "配置文件存储路径", value: configPath },
        { label: "密钥默认填充符号", value: defaultChar },
    ];

    const handleCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            alert("已复制到剪贴板"); // 可替换为更优雅的 toast 提示
        } catch (err) {
            console.error("复制失败", err);
            alert("复制失败，请手动复制");
        }
    };


    // 选择文件的处理函数
    const handleSelectFile = async () => {
        try {
            const path = await handleChooseImportFile();
            if (path) {
                setSelectedFilePath(path);
            }
        } catch (error) {
            await message(`选择文件失败：${(error as Error).message}`, { title: "错误", kind: "error" });
        }
    };

    // 执行导入
    const handleDoImport = async () => {
        if (!selectedFilePath || !localSecret.trim() || !importSecret.trim()) return;
        setIsImporting(true);
        try {
            await invoke("import_from_file", {
                path: selectedFilePath,
                local_secret: localSecret,
                import_secret: importSecret,
            });
            //await message("导入成功！", { title: "成功", kind: "info" });
            // 关闭对话框并重置状态
            setImportDialogOpen(false);
            setSelectedFilePath(null);
            setLocalSecret("");
            setImportSecret("");
            // 可选：刷新页面数据
        } catch (error) {
            await message(`导入失败：${(error as Error)?.message}`, { title: "错误", kind: "error" });
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="relative h-full w-full flex justify-center">
            <div className={`${isAndroid ? 'p-6 w-full' : 'p-8 w-4/5 max-w-4xl'} flex flex-col h-full`}>
                <h1 className="mb-1">配置信息</h1>
                <p className="text-muted-foreground mb-6">关于软件的行为与其他信息。</p>

                <div className="rounded-xl border border-border divide-y divide-border min-w-0">
                    {items.map((item) => (
                        <Dialog key={item.label}>
                            <DialogTrigger asChild>
                                <div className="flex flex-col justify-between p-4 bg-card min-w-0 cursor-pointer hover:bg-accent/50 transition-colors">
                                    <div className="font-medium">{item.label}</div>
                                    <div className="text-sm text-muted-foreground truncate">{item.value}</div>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>{item.label}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="text-sm font-medium">完整内容</div>
                                    <div className="p-3 bg-muted rounded-md break-all whitespace-pre-wrap text-sm">
                                        {item.value}
                                    </div>
                                    <Button onClick={() => handleCopy(item.value)} variant="outline" className="w-full">
                                        一键复制
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    ))}
                </div>
                <div className="mt-6 flex rounded-xl border border-border bg-card">
                    < button className="w-full min-h-10 flex-1 hover:bg-accent/50 border-r-2"
                        onClick={async () => {
                            try {
                                setImportDialogOpen(true)
                            } catch (e) {
                                // 弹出错误对话框
                                await message(`导入失败：${(e as Error).message}`, {
                                    title: "错误",
                                    kind: "error",
                                });
                            }

                        }}
                    >导入</button>
                    < button className="w-full min-h-10 flex-1 hover:bg-accent/50 border-r-2"
                        onClick={async () => {
                            try {
                                handleExport();
                            } catch (e) {
                                // 弹出错误对话框
                                await message(`导出失败：${(e as Error).message}`, {
                                    title: "错误",
                                    kind: "error",
                                });
                            }

                        }}
                    >导出</button>
                    < button className="w-full min-h-10 flex-1 hover:bg-accent/50"
                        onClick={async () => {
                            try {
                                handleCheckOut();
                            } catch (e) {
                                // 弹出错误对话框
                                await message(`切换失败：${(e as Error).message}`, {
                                    title: "错误",
                                    kind: "error",
                                });
                            }

                        }}
                    >切换</button>
                </div>
                <div className="mt-2 flex rounded-xl border border-border bg-card">
                    <button
                        className="w-full min-h-10 flex-1 hover:bg-accent/50"
                        onClick={() => setChangeKeyDialogOpen(true)}
                    >
                        修改密钥
                    </button>
                </div>
                <div className="mt-6 p-4 rounded-xl border border-border bg-card">
                    <div className="text-sm font-medium mb-1">软件版本</div>
                    <div className="text-sm text-muted-foreground">
                        {import.meta.env.VITE_APP_NAME} v{import.meta.env.VITE_APP_VERSION} — 构建于 {import.meta.env.VITE_BUILD_TIME}
                    </div>
                    <div className="mt-4 pt-2">
                        <div className="font-medium">作者</div>
                        <div className="text-sm text-muted-foreground">蒙煋Evanflare</div>
                    </div>
                </div>
                <div className="flex-1"></div>
            </div>
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>导入数据</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <div className="text-sm font-medium mb-1">文件路径</div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={selectedFilePath || ""}
                                    readOnly
                                    placeholder="未选择文件"
                                    className="flex-1 px-3 py-2 rounded-md border border-border bg-muted text-sm"
                                />
                                <Button type="button" variant="outline" onClick={handleSelectFile}>
                                    选择文件
                                </Button>
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-medium mb-1">当前加密密钥</div>
                            <input
                                type="password"
                                value={localSecret}
                                onChange={(e) => setLocalSecret(e.target.value)}
                                disabled={!selectedFilePath}
                                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <div className="text-sm font-medium mb-1">待导入文件加密密钥</div>
                            <input
                                type="password"
                                value={importSecret}
                                onChange={(e) => setImportSecret(e.target.value)}
                                disabled={!selectedFilePath}
                                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm disabled:opacity-50"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => {
                            setImportDialogOpen(false);
                            setLocalSecret("")
                            setImportSecret("")
                        }}>
                            取消
                        </Button>
                        <Button
                            onClick={handleDoImport}
                            disabled={!selectedFilePath || !localSecret.trim() || !importSecret.trim() || isImporting}
                        >
                            {isImporting ? "导入中..." : "导入"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <ChangeSecretDialog changeKeyDialogOpen={changeKeyDialogOpen} setChangeKeyDialogOpen={setChangeKeyDialogOpen} ></ChangeSecretDialog>
        </div >
    );
}