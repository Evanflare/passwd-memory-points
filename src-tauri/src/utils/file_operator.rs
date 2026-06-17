//! windows用路径,android用FileUri

use std::{fs, io::ErrorKind, path::Path};
//#[cfg(target_os = "android")]
use tauri::AppHandle;

/// 提供文件的读写功能
pub struct FileOperator {
    app: AppHandle,
}

impl FileOperator {
    pub fn read_to_string(file_path: &str) -> Result<String, ErrorKind> {
        let read_result = fs::read_to_string(Path::new(file_path));
        match read_result {
            Ok(content) => Ok(content),
            Err(e) => Err(e.kind()),
        }
    }
    #[cfg(target_os = "android")]
    pub fn read_to_string(&self, file_uri: &str) -> Result<String, ErrorKind> {
        match AndroidFsExt::android_fs(self.app).read_to_string(&FileUri::from_uri(file_uri)) {
            Ok(content) => Ok(content),
            Err(e) => Err(ErrorKind::NotFound),
        }
    }
    pub fn write(content: &str, file_path: &str) -> Result<(), ErrorKind> {
        let write_result = fs::write(Path::new(file_path), content);
        match write_result {
            Ok(_) => Ok(()),
            Err(e) => Err(e.kind()),
        }
    }
    #[cfg(target_os = "android")]
    pub fn write(&self, content: &str, file_uri: &str) -> Result<(), ErrorKind> {
        let write_result =
            AndroidFsExt::android_fs(self.app).write(&FileUri::from_uri(file_uri), content);
        match write_result {
            Ok(_) => Ok(()),
            Err(e) => Err(e.kind()),
        }
    }
}

// pub enum FileOperatError {
//     FileNotExstis,
//     FilePermissionDenied,
//     FilePathIsWrong,
// }
