//! search commands 搜索相关的命令,只能得到密文对象

use super::list_commands::list_passwds;
use crate::commands::dto::PasswdSummary;
use crate::error::Error;
use nickname_passwd::passwd::PasswdVector;
use std::sync::Mutex;
use tauri::State;
/// 列出所有密码条目的摘要信息，返回一个包含唯一ID、名称和描述的列表
/// 需要输入一个关键词来过滤密码条目，只有当名称或描述包含该关键词时才会被返回，如果关键词为空字符串则返回所有密码条目的摘要信息
///
#[tauri::command(rename_all = "snake_case")]
pub fn search_passwds(
    key_word: String,
    state: State<'_, Mutex<PasswdVector>>,
) -> Result<Vec<PasswdSummary>, Error> {
    if key_word.len() == 0 {
        return list_passwds(state);
    }
    let passwd_vector = state.lock().unwrap();
    let filters = key_word.split_whitespace().map(|s| s.to_string()).collect();
    let matches = passwd_vector.search_all_passwd(&filters);
    let summaries = matches
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
