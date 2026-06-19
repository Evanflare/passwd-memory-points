use crate::core::passwd::Passwd;
use crate::core::{Nickname, PasswdManager};
use crate::error::Error;
use crate::utils::passwd_vec_utils::check_secret_right_or_error;
use std::sync::Mutex;
use tauri::State;

/// 添加一个新的记忆点，前端需要提供一个昵称和一个密钥来加密昵称
#[tauri::command]
pub fn add_nickname(
    nickname: String,
    key: String,
    state: State<'_, Mutex<PasswdManager>>,
) -> Result<bool, Error> {
    let mut manager = state.lock().unwrap();
    eprintln!("进入addnickname command");
    // 校验密码是否正确
    if let Err(_) = check_secret_right_or_error(&manager.passwds, &key) {
        return Err(Error::SecretKeyError("密钥不正确".to_string()));
    }
    eprintln!("密码正确: {}", key);
    manager.passwds.nickname.add_nickname(&nickname, &key);
    eprintln!("添加完毕: {}", nickname);
    match manager.passwds.store(&manager.config.passwd_file_path) {
        Ok(_) => {
            eprintln!("保存文件成功");
            Ok(true)
        }
        Err(e) => {
            return Err(Error::SecretKeyError(format!("保存失败: {}", e.as_str())));
        }
    }
}

/// 添加一个新的密码条目，前端需要提供一个包含密码组成部分的列表、一个唯一标识符、一个随机生成密码的标志、一个名称、一个描述和一个密钥来加密密码条目中的明文密码
#[tauri::command]
pub fn add_passwd(
    parts: Vec<String>,
    unique: String,
    random: bool,
    name: String,
    descript: String,
    key: String,
    state: State<'_, Mutex<PasswdManager>>,
) -> Result<bool, Error> {
    // 首先校验密码是否相同，不允许每个passwd有不同的加密secret，这样会导致遗忘
    let mut manager = state.lock().unwrap();
    if let Err(_) = check_secret_right_or_error(&manager.passwds, &key) {
        return Err(Error::SecretKeyError(
            "密钥需要保证与已存密钥一致".to_string(),
        ));
    }
    let plaintext = Nickname::generate_passwd_nickname(&mut parts.clone(), &unique, random);
    let passwd = Passwd::generate(&name, &descript, &plaintext, &key, manager.config.fill_char);
    manager.passwds.add_passwd(passwd);
    manager
        .passwds
        .store(&manager.config.passwd_file_path)
        .map_err(|e| Error::FileOperationError(format!("保存失败: {}", e.as_str())))?;
    Ok(true)
}
