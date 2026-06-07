use serde::Serialize;

/// 作为前端展示的密码条目摘要信息，包含唯一ID、名称和描述
#[derive(Serialize)]
pub struct PasswdSummary {
    pub uid: String,
    pub name: String,
    pub description: String,
    pub ciphertext: String,
}
