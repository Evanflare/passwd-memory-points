//! 所有更新已有数据的命令

use crate::error::Error;
use nickname_passwd::passwd::*;
use std::sync::Mutex;
use tauri::State;
/// 通过这个命令uid来决定更新的对象，传入更新的元素
#[tauri::command(rename_all = "snake_case")]
pub async fn update_passwd(
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
pub async fn change_secret_key(
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
pub async fn change_file(
    file_path: &str,
    state: State<'_, Mutex<PasswdVector>>,
) -> Result<(), Error> {
    // 获得passwd vector
    let mut passwd_vector = state.lock().unwrap();
    match passwd_vector.check_passwd_vector_file(file_path) {
        Ok(_) => Ok(()),
        Err(e) => Err(Error::FileOperationError(e.as_str().to_string())),
    }
}
