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
        Ok(_) => Ok(()),
        Err(_) => Err(Error::SecretKeyError("密钥不正确".to_string())),
    }
}
