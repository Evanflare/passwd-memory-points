import { open, save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

// 导入按钮的处理函数
const handleChooseImportFile = async (): Promise<string | null> => {
    try {
        const selected = await open({
            multiple: false,
            directory: false,
            title: "导入数据",
            filters: [{ name: "toml", extensions: ["toml"] }]
        });
        if (!selected) return null;
        return selected;

        // // 调用 Rust 命令，传入文件路径
        // const importedData = await invoke('import_from_file', { path: selected, local_secret, import_secret });
        // console.log("导入的数据", importedData);
    } catch (error: any) {
        console.error("导入失败", error);
        throw Error("导入失败:" + error?.message)
    }
};

// 切换按钮的处理函数
const handleCheckOut = async (): Promise<string | null> => {
    try {
        const selected = await open({
            multiple: false,
            directory: false,
            title: "切换到文件",
            filters: [{ name: "toml", extensions: ["toml"] }]
        });
        if (!selected) return null;

        return selected;
    } catch (error: any) {
        console.error("切换失败", error);
        throw Error("切换失败:" + error?.message)
    }
};


// 导出按钮的处理函数
const handleExport = async () => {
    try {
        const savePath = await save({
            title: "导出数据",
            defaultPath: `passwd-memoty-points_${Date.now()}.toml`,
            filters: [{ name: "toml", extensions: ["toml"] }]
        });
        if (!savePath) return;

        // 调用tauri命令
        await invoke('export_to_file', { path: savePath });
        console.log("导出成功");
    } catch (error: any) {
        console.error("导出失败", error);
        throw Error("导出失败：" + error?.message)
    }
};

export { handleExport, handleChooseImportFile, handleCheckOut }