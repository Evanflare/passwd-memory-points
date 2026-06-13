#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("failed to parse as string: {0}")]
    Utf8(#[from] std::str::Utf8Error),
    #[error("item not found: {0}")]
    NotFoundItem(String),
    #[error("secret key error: {0}")]
    SecretKeyError(String),
    #[error("file operation error: {0}")]
    FileOperationError(String),
    #[error("some element fail: {0}")]
    SomeElementFail(String),
}

#[derive(serde::Serialize)]
#[serde(tag = "kind", content = "message")]
#[serde(rename_all = "camelCase")]
pub enum ErrorKind {
    Io(String),
    Utf8(String),
    NotFoundItem(String),
    SecretKeyError(String),
    FileOperationError(String),
    SomeElementFail(String),
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        let error_message = self.to_string();
        let error_kind = match self {
            Self::Io(_) => ErrorKind::Io(error_message),
            Self::Utf8(_) => ErrorKind::Utf8(error_message),
            Self::NotFoundItem(_) => ErrorKind::NotFoundItem(error_message),
            Self::SecretKeyError(_) => ErrorKind::SecretKeyError(error_message),
            Self::FileOperationError(_) => ErrorKind::FileOperationError(error_message),
            Self::SomeElementFail(_) => ErrorKind::SomeElementFail(error_message),
        };
        error_kind.serialize(serializer)
    }
}
