use crate::error::Error;
use nickname_passwd::config::CONFIG;
use nickname_passwd::passwd::{nickname::Nickname, Passwd, PasswdVector};
use serde::Serialize;

/// 作为前端展示的密码条目摘要信息，包含唯一ID、名称和描述
#[derive(Serialize)]
pub struct PasswdSummary {
    uid: String,
    name: String,
    description: String,
}

#[derive(Serialize)]
pub struct ConfigInfo {
    default_fill_char: char,
    passwd_file_path: String,
    profile_path: String,
}

/// 列出所有密码条目的摘要信息，返回一个包含唯一ID、名称和描述的列表
#[tauri::command]
pub async fn list_passwds(key_word: String) -> Vec<PasswdSummary> {
    let passwd_vector = PasswdVector::read_or_create();
    let summaries = passwd_vector.get_passwds().iter().map(|p| PasswdSummary {
        uid: p.get_unique_id().to_string(),
        name: p.name.clone(),
        description: p.descript.clone(),
    });
    if key_word != "" {
        summaries
            .filter(|s| s.name.contains(&key_word) || s.description.contains(&key_word))
            .collect()
    } else {
        summaries.collect()
    }
}

/// 根据唯一ID获取密码条目的明文密码，前端需要提供一个密钥来解密密码条目中的加密密码
#[tauri::command]
pub async fn get_passwd(uid: String, key: String) -> Result<String, Error> {
    let mut passwd_vector = PasswdVector::read_or_create();
    match passwd_vector.get_passwd_by_uid(&uid) {
        Some(passwd) => passwd
            .decypted_passwd(&key)
            .map_err(|e| Error::SecretKeyError(format!("解密失败: {}", e))),
        None => Err(Error::NotFoundItem(format!(
            "未找到唯一的密码UID包含{}的密码条目",
            uid
        ))),
    }
}

#[tauri::command]
pub fn list_nicknames(key: String) -> Result<Vec<String>, Error> {
    let passwd_vector = PasswdVector::read_or_create();
    let nicknames = passwd_vector
        .nickname
        .decrypted_nickname(&key)
        .map_err(|e| Error::SecretKeyError(format!("解密失败: {}", e)))?;
    Ok(nicknames)
}

#[tauri::command]
pub fn add_nickname(nickname: String, key: String) -> Result<bool, Error> {
    let mut passwd_vector = PasswdVector::read_or_create();
    passwd_vector.nickname.add_nickname(&nickname, &key);
    passwd_vector
        .store()
        .map_err(|e| Error::SecretKeyError(format!("保存失败: {}", e)))?;
    Ok(true)
}

#[tauri::command]
pub fn search_passwd(query: String) -> Result<Vec<PasswdSummary>, Error> {
    let passwd_vector = PasswdVector::read_or_create();
    let filters = query.split_whitespace().map(|s| s.to_string()).collect();
    let matches = passwd_vector.search_all_passwd(&filters);
    let summaries = matches
        .into_iter()
        .map(|p| PasswdSummary {
            uid: p.get_unique_id().to_string(),
            name: p.name.clone(),
            description: p.descript.clone(),
        })
        .collect();
    Ok(summaries)
}

#[tauri::command]
pub fn get_config() -> Result<ConfigInfo, Error> {
    Ok(ConfigInfo {
        default_fill_char: CONFIG.default_fill_char,
        passwd_file_path: CONFIG.passwd_file_path.clone(),
        profile_path: CONFIG.profile_path.clone(),
    })
}

#[tauri::command]
pub fn add_passwd(
    parts: Vec<String>,
    unique: String,
    random: bool,
    name: String,
    descript: String,
    key: String,
) -> Result<bool, Error> {
    let mut passwd_vector = PasswdVector::read_or_create();
    let plaintext = Nickname::generate_passwd_nickname(&mut parts.clone(), &unique, random);
    let passwd = Passwd::generate(&name, &descript, &plaintext, &key);
    passwd_vector.add_passwd(passwd);
    passwd_vector
        .store()
        .map_err(|e| Error::FileOperationError(format!("保存失败: {}", e)))?;
    Ok(true)
}
