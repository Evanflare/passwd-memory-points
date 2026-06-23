import { useEffect, useState } from 'react';
import { get_app_config_dir_files } from '../../tauri_core/command_frontend';

export interface InternalFile {
    name: string;
    path: string;
}

interface Props {
    onSelect: (file: InternalFile) => void;
    extensions?: string[];
    emptyMessage?: string;
}

export default function InternalFilePicker({
    onSelect,
    //extensions,
    emptyMessage = '暂无可选文件，请先导入',
}: Props) {
    const [files, setFiles] = useState<InternalFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadFiles = async () => {
        try {
            setLoading(true);
            setError(null);
            //const baseDir = await getAppDataDir();
            const entrys: InternalFile[] = await get_app_config_dir_files();

            const fileList: InternalFile[] = [];
            for (const entry of entrys) {
                if (entry) {
                    fileList.push({
                        name: entry.name,
                        path: entry.path,
                    });
                }
            }

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

    if (loading) {
        return (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                正在加载文件列表...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#e00' }}>
                {error}
                <br />
                <button onClick={loadFiles} style={{ marginTop: '0.5rem', cursor: 'pointer' }}>
                    重试
                </button>
            </div>
        );
    }

    if (files.length === 0) {
        return (
            <div style={{
                padding: '2rem 1rem',
                textAlign: 'center',
                color: '#888',
                border: '1px dashed #ddd',
                borderRadius: 8,
                margin: '0.5rem',
            }}>
                {emptyMessage}
            </div>
        );
    }

    return (
        <div style={{
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            backgroundColor: '#fff',
        }}>
            {files.map((file) => (
                <div
                    key={file.path}
                    onClick={() => onSelect(file)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px 16px',
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onSelect(file)}
                >
                    <span style={{ fontSize: '1.2rem', marginRight: 8 }}>📄</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                    </span>
                </div>
            ))}
        </div>
    );
}