//! 关于配置信息导入、导出、切换、更新等命令
//!
use std::sync::Mutex;

use crate::error::Error;
use nickname_passwd::args_parse::Error as MyError;
use nickname_passwd::passwd::PasswdVector;
use tauri::State;

#[tauri::command(rename_all = "snake_case")]
pub fn export_to_file(path: &str, state: State<'_, Mutex<PasswdVector>>) -> Result<(), Error> {
    // 获得passwd vector
    let passwd_vector = state.lock().unwrap();
    match passwd_vector.save_to_path(path) {
        Ok(_) => Ok(()),
        Err(MyError::FilePathIsWrong(s)) => Err(Error::FileOperationError(s)),
        _ => Err(Error::FileOperationError("无法到处文件".to_string())),
    }
}
