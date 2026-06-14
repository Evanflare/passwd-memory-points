//! list commands 列表相关的命令: 无须参数或者默认参数即可返回一个列表，前端可以根据这个列表展示界面或者进行下一步操作

use crate::commands::dto::PasswdSummary;
use crate::error::Error;
use passwd_memory_point::passwd::PasswdVector;
use std::sync::Mutex;
use tauri::State;

/// 列出所有密码条目的摘要信息，返回一个包含唯一ID、名称和描述的列表
///
#[tauri::command(rename_all = "snake_case")]
pub fn list_passwds(state: State<'_, Mutex<PasswdVector>>) -> Result<Vec<PasswdSummary>, Error> {
    let passwd_vector = state.lock().unwrap();
    let summaries: Vec<PasswdSummary> = passwd_vector
        .get_passwds()
        .into_iter()
        .map(|p| PasswdSummary {
            uid: p.get_unique_id().to_string(),
            name: p.name.clone(),
            description: p.descript.clone(),
            ciphertext: p.ciphertext.clone(),
        })
        .collect();
    Ok(summaries)
}

/// 获取加密的points
#[tauri::command]
pub fn get_memory_points(state: State<'_, Mutex<PasswdVector>>) -> Result<Vec<String>, Error> {
    let passwd_vector = state.lock().unwrap();
    let nicknames = passwd_vector.nickname.get_string_array();
    Ok(nicknames)
}

/// 获取明文的points,需要传入key参数
#[tauri::command]
pub fn plaintext_points(
    key: String,
    state: State<'_, Mutex<PasswdVector>>,
) -> Result<Vec<String>, Error> {
    let passwd_vector = state.lock().unwrap();
    let nicknames = passwd_vector
        .nickname
        .decrypted_nickname(&key)
        .map_err(|e| Error::SecretKeyError(format!("解密失败: {}", e)))?;
    Ok(nicknames)
}
