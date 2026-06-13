import { open, save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

// 导入按钮的处理函数
const handleImport = async () => {
    try {
        const selected = await open({
            multiple: false,
            directory: false,
            title: "导入数据",
            filters: [{ name: "toml", extensions: ["toml"] }]
        });
        if (!selected) return;

        // 调用 Rust 命令，传入文件路径
        const importedData = await invoke('import_from_file', { path: selected });
        console.log("导入的数据", importedData);
        // 更新你的前端状态...
    } catch (error: any) {
        console.error("导入失败", error);
        throw Error("导入失败:" + error?.message)
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

        // 获取当前应用数据（例如从 store 中）
        const currentData = { /* 你的数据 */ };
        await invoke('export_to_file', { path: savePath, data: currentData });
        console.log("导出成功");
    } catch (error: any) {
        console.error("导出失败", error);
        throw Error("导出失败：" + error?.message)
    }
};

export { handleExport, handleImport }