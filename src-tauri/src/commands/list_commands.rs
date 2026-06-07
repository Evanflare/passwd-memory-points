//! list commands 列表相关的命令: 无须参数或者默认参数即可返回一个列表，前端可以根据这个列表展示界面或者进行下一步操作

use crate::commands::dto::PasswdSummary;
use crate::error::Error;
use nickname_passwd::passwd::PasswdVector;

/// 列出所有密码条目的摘要信息，返回一个包含唯一ID、名称和描述的列表
///
#[tauri::command(rename_all = "snake_case")]
pub async fn list_passwds() -> Result<Vec<PasswdSummary>, Error> {
    let passwd_vector = PasswdVector::read_or_create();
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

/// 根据唯一ID获取密码条目的明文密码，前端需要提供一个密钥来解密密码条目中的加密密码
#[tauri::command]
pub fn list_nicknames(key: String) -> Result<Vec<String>, Error> {
    let passwd_vector = PasswdVector::read_or_create();
    let nicknames = passwd_vector
        .nickname
        .decrypted_nickname(&key)
        .map_err(|e| Error::SecretKeyError(format!("解密失败: {}", e)))?;
    Ok(nicknames)
}
