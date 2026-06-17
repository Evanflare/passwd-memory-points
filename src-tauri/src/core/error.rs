#[derive(Debug)]
pub enum Error {
    ArgsNotEnough(&'static str),
    ArgsInputWrongWords(String),
    SecretKeyWrong,
    FilePathIsWrong(String),
    FileContentNotRight(String),
    SecretKeyDifferent(String),
}

impl Error {
    // 借用，返回 &str（更常用）
    pub fn as_str(&self) -> &str {
        match self {
            Error::ArgsNotEnough(s) => s,
            Error::ArgsInputWrongWords(s) => s,
            Error::FilePathIsWrong(s) => s,
            Error::FileContentNotRight(s) => s,
            Error::SecretKeyDifferent(s) => s,
            Error::SecretKeyWrong => "密钥错误 ",
        }
    }
}
