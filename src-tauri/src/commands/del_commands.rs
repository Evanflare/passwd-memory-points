//! "删除"相关的命令

use std::sync::Mutex;

use crate::core::passwd::PasswdVector;
use crate::{error::Error, utils::passwd_vec_utils::check_secret_right_or_error};
use tauri::State;

/// 用来删除tauri中的passwd vector状态中的memory points 中的项。
#[tauri::command(rename_all = "snake_case")]
pub fn del_memory_point(
    point_str: &str,
    secret_key: &str,
    state: State<'_, Mutex<PasswdVector>>,
) -> Result<(), Error> {
    // 得到passwdvector
    let mut passwd_vector = state.lock().unwrap();
    if passwd_vector.nickname.del_nickname(point_str, secret_key) {
        let _ = passwd_vector.store();
        return Ok(());
    } else {
        return Err(Error::NotFoundItem(
            "无法找到对象，或者密码错误。".to_string(),
        ));
    }
}

/// 用来删除passwd vector中的passwd通过uid判断
#[tauri::command(rename_all = "snake_case")]
pub fn del_passwd_by_uid(
    uid: &str,
    secret_key: &str,
    state: State<'_, Mutex<PasswdVector>>,
) -> Result<(), Error> {
    // 得到passwdvector
    let mut passwd_vector = state.lock().unwrap();
    // 先校验密码是否正确
    match check_secret_right_or_error(&passwd_vector, secret_key) {
        Ok(_) => {}
        Err(_) => return Err(Error::SecretKeyError("密码不正确".to_string())),
    }
    if passwd_vector.remove_passwd_by_unique_id(uid) {
        let _ = passwd_vector.store();
        return Ok(());
    } else {
        return Err(Error::NotFoundItem("无法找到对象".to_string()));
    }
}
