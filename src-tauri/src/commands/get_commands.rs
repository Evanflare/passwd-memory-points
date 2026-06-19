//! get commands 获得的对象都是需要解密的明文

use crate::core::PasswdManager;
use crate::dto::ConfigInfo;
use crate::error::Error;
use std::sync::Mutex;
use tauri::State;

/// 根据唯一ID获取密码条目的明文密码，前端需要提供一个密钥来解密密码条目中的加密密码
#[tauri::command]
pub fn get_passwd(
    uid: String,
    key: String,
    state: State<'_, Mutex<PasswdManager>>,
) -> Result<String, Error> {
    let manager = state.lock().unwrap();
    match manager.passwds.get_passwd_by_uid(&uid) {
        Some(passwd) => passwd
            .decypted_passwd(&key)
            .map_err(|_| Error::SecretKeyError(format!("密钥不正确"))),
        None => Err(Error::NotFoundItem(format!(
            "未找到唯一的密码UID包含{}的密码条目",
            uid
        ))),
    }
}

/// 获得当前的配置项，前端可以根据这些配置项来调整界面或者进行下一步操作
#[tauri::command]
pub fn get_config(state: State<'_, Mutex<PasswdManager>>) -> Result<ConfigInfo, Error> {
    let manager = state.lock().unwrap();
    Ok(ConfigInfo {
        default_fill_char: manager.config.fill_char,
        passwd_file_path: manager.config.passwd_file_path.display().to_string(),
        profile_path: manager.config.profile_path.display().to_string(),
    })
}
