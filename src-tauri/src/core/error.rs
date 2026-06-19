#[derive(Debug)]
pub enum CoreError {
    ArgsNotEnough(&'static str),
    ArgsInputWrongWords(String),
    SecretKeyWrong,
    FilePathIsWrong(String),
    FileContentNotRight(String),
    SecretKeyDifferent(String),
}

impl CoreError {
    // 借用，返回 &str（更常用）
    pub fn as_str(&self) -> &str {
        match self {
            CoreError::ArgsNotEnough(s) => s,
            CoreError::ArgsInputWrongWords(s) => s,
            CoreError::FilePathIsWrong(s) => s,
            CoreError::FileContentNotRight(s) => s,
            CoreError::SecretKeyDifferent(s) => s,
            CoreError::SecretKeyWrong => "密钥错误 ",
        }
    }
}
