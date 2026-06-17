//! 关于配置信息导入、导出、切换、更新等命令
//!

use std::fs;
use std::sync::Mutex;

use std::io::Read;
use tauri::AppHandle;
use tauri_plugin_android_fs::{AndroidFsExt, FileAccessMode, FileUri};

use crate::core::error::Error as MyError;
use crate::core::passwd::PasswdVector;
use crate::error::Error;
use std::sync::Mutex;
use tauri::State;

#[tauri::command(rename_all = "snake_case")]
pub fn export_string(state: State<'_, Mutex<PasswdVector>>) -> Result<String, Error> {
    // 获得passwd vector
    let passwd_vector = state.lock().unwrap();
    match passwd_vector.get_save_string() {
        Ok(toml_text) => Ok(toml_text),
        Err(MyError::FilePathIsWrong(s)) => Err(Error::FileOperationError(s)),
        _ => Err(Error::FileOperationError("无法导出文件".to_string())),
    }
}

/// 导入文件，将文件中的不同密钥加入当前密码记忆集
#[tauri::command(rename_all = "snake_case")]
pub fn import_from_file(
    path: &str,
    local_secret: &str,
    import_secret: &str,
    state: State<'_, Mutex<PasswdVector>>,
    app: AppHandle,
) -> Result<(), Error> {
    // 获得passwd vector
    let mut passwd_vector = state.lock().unwrap();
    // 获得要导入的passwd vector
    let content: String = if path.starts_with("content") {
        // 在 Android 上，'path' 是一个 content:// URI
        let android_fs = app.android_fs();
        let mut file = match android_fs
            .open_file(&FileUri::from_uri(path), FileAccessMode::Read)
            .map_err(|e| format!("无法打开文件: {}", e))
        {
            Ok(file) => file,
            Err(message) => return Err(Error::FileOperationError(message)),
        };
        let mut c = String::new();
        match file
            .read_to_string(&mut c)
            .map_err(|e| format!("读取文件失败: {}", e))
        {
            Ok(_) => c,
            Err(message) => return Err(Error::FileOperationError(message)),
        }
    } else {
        // 在 Windows 等平台上，'path' 是标准的文件系统路径
        match fs::read_to_string(&path).map_err(|e| format!("读取文件失败: {}", e)) {
            Ok(content) => content,
            Err(message) => return Err(Error::FileOperationError(message)),
        }
    };
    let import_vector = match PasswdVector::create_from_string(&content) {
        Ok(res) => res,
        Err(e) => {
            return Err(Error::FileOperationError(e.as_str().to_string()));
        }
    };

    match passwd_vector.includes_passwd_vector(import_vector, local_secret, import_secret) {
        Ok(_) => {
            let _ = passwd_vector.store();
            Ok(())
        }
        Err(MyError::FilePathIsWrong(s)) => Err(Error::FileOperationError(s)),
        Err(MyError::SecretKeyDifferent(s)) => {
            Err(Error::SecretKeyError(format!("加密密钥不一致:{}", s)))
        }
        Err(MyError::SecretKeyWrong) => Err(Error::SecretKeyError("密钥错误".to_string())),
        _ => Err(Error::FileOperationError("无法导入文件".to_string())),
    }
}
