//! 所有更新已有数据的命令

use crate::error::Error;
use passwd_memory_point::passwd::*;
use std::sync::Mutex;
use std::{fs, io::Read};
use tauri::{AppHandle, State};
use tauri_plugin_android_fs::{AndroidFsExt, FileAccessMode, FileUri};
/// 通过这个命令uid来决定更新的对象，传入更新的元素
#[tauri::command(rename_all = "snake_case")]
pub fn update_passwd(
    uid: &str,
    name: Option<&str>,
    descript: Option<&str>,
    plaintext: Option<&str>,
    user_key: &str,
    state: State<'_, Mutex<PasswdVector>>,
) -> Result<(), Error> {
    // 先从uid拿到passwd
    let mut passwd_vector = state.lock().unwrap();
    let passwd = match passwd_vector.get_passwd_by_uid(uid) {
        Some(get_passwd_by_uid) => get_passwd_by_uid,
        None => {
            return Err(Error::NotFoundItem(format!(
                "uid：{uid}，找不到唯一的passwd项",
            )));
        }
    };

    match passwd.update(name, descript, plaintext, user_key) {
        Ok(_) => {
            let _ = passwd_vector.store();
            Ok(())
        }
        Err(_) => Err(Error::SecretKeyError("密钥不正确".to_string())),
    }
}

/// 更新加密密钥
#[tauri::command(rename_all = "snake_case")]
pub fn change_secret_key(
    old_secret: &str,
    new_secret: &str,
    state: State<'_, Mutex<PasswdVector>>,
) -> Result<(), Error> {
    let mut passwd_vector = state.lock().unwrap();
    match passwd_vector.change_encypt_secret(old_secret, new_secret) {
        Ok(()) => {
            let _ = passwd_vector.store();
            Ok(())
        }
        Err(e) => Err(Error::SomeElementFail(e.as_str().to_string())),
    }
}

/// 更换文件

#[tauri::command(rename_all = "snake_case")]
pub fn change_file(
    file_path: &str,
    state: State<'_, Mutex<PasswdVector>>,
    app: AppHandle,
) -> Result<(), Error> {
    let mut passwd_vector = state.lock().unwrap();
    let content = if file_path.starts_with("content://") {
        // Android: content URI
        #[cfg(target_os = "android")]
        {
            let android_fs = app.android_fs();
            let mut file = match android_fs
                .open_file(&FileUri::from_uri(file_path), FileAccessMode::Read)
                .map_err(|e| Error::FileOperationError(format!("无法打开文件: {}", e)))
            {
                Ok(file) => file,
                Err(message) => return Err(Error::FileOperationError(message.to_string())),
            };
            let mut c = String::new();
            match file
                .read_to_string(&mut c)
                .map_err(|e| Error::FileOperationError(format!("读取文件失败: {}", e)))
            {
                Ok(_) => c,
                Err(message) => return Err(Error::FileOperationError(message.to_string())),
            }
        }
        #[cfg(not(target_os = "android"))]
        {
            // 不应该进入此分支，但为了安全返回错误
            return Err(Error::FileOperationError(
                "非 Android 平台不支持 content URI".into(),
            ));
        }
    } else {
        // Windows / 其他平台: 普通文件路径
        match fs::read_to_string(&file_path)
            .map_err(|e| Error::FileOperationError(format!("读取文件失败: {}", e)))
        {
            Ok(c) => c,
            Err(message) => return Err(Error::FileOperationError(message.to_string())),
        }
    };

    passwd_vector
        ._check_passwd_vector_file(&content, &file_path)
        .map_err(|e| Error::NotFoundItem(format!("文件解析失败: {}", e.as_str())))
}
