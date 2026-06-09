import { useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { getConfig } from "../../tauri_core/command_frontend";

export default function ConfigPage() {
    const [passwdFilePath, setPasswdFilePath] = useState("");
    const [configPath, setConfigPath] = useState("");
    const [defaultChar, setDefaultChar] = useState("");
    async function updateConfig() {
        let config = await getConfig();
        setPasswdFilePath(config.passwd_file_path);
        setConfigPath(config.profile_path);
        setDefaultChar(config.default_fill_char);
    };
    updateConfig();

    return (
        <div className="relative  h-screen w-full flex justify-center p-8">
            <div className="p-8 w-4/5 max-w-4xl flex flex-col h-full">
                <h1 className="mb-1">配置信息</h1>
                <p className="text-muted-foreground mb-6">
                    关于软件的行为与其他信息。
                </p>
                <ScrollArea className="flex-1 min-h-0 rounded-b-2xl">
                    <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                        {[
                            {
                                label: "密码文件存储路径",
                                desc: passwdFilePath,
                            },
                            {
                                label: "配置文件存储路径",
                                desc: configPath,
                            },
                            {
                                label: "密钥默认填充符号",
                                desc: defaultChar,
                            },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="flex items-center justify-between px-5 py-4 bg-card"
                            >
                                <div>
                                    <div className="font-medium">{item.label}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {item.desc}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 p-4 rounded-xl border border-border bg-card">
                        <div className="text-sm font-medium mb-1">
                            软件版本
                        </div>
                        <div className="text-sm text-muted-foreground">
                            passwd-nickname v1.0.0 — 构建于 2026.06.08
                        </div>
                        <br></br>
                        <div
                            className="flex items-center justify-between bg-card"
                        >
                            <div>
                                <div className="font-medium">作者</div>

                                <div className="text-sm text-muted-foreground">
                                    蒙煋Evanflare
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}