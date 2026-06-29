import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { get_app_config_dir_files } from '../../tauri_core/command_frontend';

export interface InternalFile {
    name: string;
    path: string;
}

interface Props {
    onSelect: (file: InternalFile) => void;
    extensions?: string[];
    emptyMessage?: string;
    dialogOpen: boolean;
    setDialogOpen: Dispatch<SetStateAction<boolean>>;
    setDeleteDialogOpen: Dispatch<SetStateAction<boolean>>;
    setDeleteFileName: Dispatch<SetStateAction<string>>;
}

export default function InternalFilePicker({
    onSelect,
    emptyMessage = '暂无可选文件，请先导入',
    dialogOpen,
    setDialogOpen,
    setDeleteDialogOpen,
    setDeleteFileName,
}: Props) {
    const [files, setFiles] = useState<InternalFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadFiles = async () => {
        try {
            setLoading(true);
            setError(null);
            const entrys: InternalFile[] = await get_app_config_dir_files();

            const fileList: InternalFile[] = entrys
                .filter(Boolean)
                .map((entry) => ({
                    name: entry.name,
                    path: entry.path,
                }));

            fileList.sort((a, b) => a.name.localeCompare(b.name));
            setFiles(fileList);
        } catch (err) {
            console.error('读取内部文件失败:', err);
            setError('无法读取文件列表，请检查权限或稍后重试');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFiles();
    }, []);

    // 加载状态
    if (loading) {
        return (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                正在加载文件列表...
            </div>
        );
    }

    // 错误状态
    if (error) {
        return (
            <div className="p-4 text-center text-red-500 dark:text-red-400">
                {error}
                <br />
                <button
                    onClick={loadFiles}
                    className="mt-2 cursor-pointer underline hover:no-underline"
                >
                    重试
                </button>
            </div>
        );
    }

    // 空状态
    if (files.length === 0) {
        return (
            <div className="py-8 px-4 text-center text-gray-400 dark:text-gray-500 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg m-2">
                {emptyMessage}
            </div>
        );
    }

    // 文件列表
    return (
        <div className="max-h-[300px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
            {files.map((file) => (
                <div
                    key={file.path}
                    className={`flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!dialogOpen ? 'hidden' : ''
                        }`}
                >
                    {/* 文件信息区 */}
                    <div
                        onClick={() => onSelect(file)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && onSelect(file)}
                        className="flex items-center flex-1 overflow-hidden cursor-pointer"
                    >
                        <span className="text-lg mr-2">📄</span>
                        <span className="truncate">{file.name}</span>
                    </div>

                    {/* 删除按钮 */}
                    <button
                        onClick={() => {
                            setDialogOpen(false);
                            setDeleteDialogOpen(true);
                            setDeleteFileName(file.name);
                        }}
                        className="ml-3 py-1 px-2 text-xs border rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900 dark:hover:text-red-300 transition-colors"
                    >
                        删除
                    </button>
                </div>
            ))}
        </div>
    );
}