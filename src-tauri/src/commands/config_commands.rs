//! 关于配置信息导入、导出、切换、更新等命令
//!
use std::sync::Mutex;

use crate::error::Error;
use passwd_memory_point::args_parse::Error as MyError;
use passwd_memory_point::passwd::PasswdVector;
use tauri::State;

#[tauri::command(rename_all = "snake_case")]
pub fn export_to_file(path: &str, state: State<'_, Mutex<PasswdVector>>) -> Result<(), Error> {
    // 获得passwd vector
    let passwd_vector = state.lock().unwrap();
    match passwd_vector.save_to_path(path) {
        Ok(_) => Ok(()),
        Err(MyError::FilePathIsWrong(s)) => Err(Error::FileOperationError(s)),
        _ => Err(Error::FileOperationError("无法导出文件".to_string())),
    }
}

/// 导入文件，将文件中的不同密钥加入当前密码记忆集
#[tauri::command(rename_all = "snake_case")]
pub fn import_from_file(
    path: &str,
    local_secret: &str,
    import_secret: &str,
    state: State<'_, Mutex<PasswdVector>>,
) -> Result<(), Error> {
    // 获得passwd vector
    let mut passwd_vector = state.lock().unwrap();
    // 获得要导入的passwd vector
    let import_vector = match PasswdVector::read_from_path(path) {
        Ok(res) => res,
        Err(e) => {
            return Err(Error::FileOperationError(e.as_str().to_string()));
        }
    };

    match passwd_vector.includes_passwd_vector(import_vector, local_secret, import_secret) {
        Ok(_) => {
            let _ = passwd_vector.store();
            Ok(())
        }
        Err(MyError::FilePathIsWrong(s)) => Err(Error::FileOperationError(s)),
        Err(MyError::SecretKeyDifferent(s)) => {
            Err(Error::SecretKeyError(format!("加密密钥不一致:{}", s)))
        }
        Err(MyError::SecretKeyWrong) => Err(Error::SecretKeyError("密钥错误".to_string())),
        _ => Err(Error::FileOperationError("无法导入文件".to_string())),
    }
}
