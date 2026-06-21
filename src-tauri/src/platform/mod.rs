#[cfg(target_os = "windows")]
mod windows;

#[cfg(target_os = "android")]
mod android;

use tauri::Manager;

// // 提供给命令层的统一方法
// pub fn get_device_info() -> String {
//     PlatformImpl::device_info()
// }

// pub fn perform_action(action: &str) -> Result<String, String> {
//     PlatformImpl::action(action)
// }

use std::path::{Path, PathBuf};
use std::{fs, io::ErrorKind};
use tauri::AppHandle;

#[derive(Clone)]
/// 提供文件的读写功能
/// 为了消除windows和android的差异，这里依赖app传入
pub struct FileOperator {
    app: Option<AppHandle>,
}
impl Default for FileOperator {
    fn default() -> Self {
        Self {
            app: Default::default(),
        }
    }
}

impl FileOperator {
    pub fn new(app: AppHandle) -> Self {
        Self { app: Some(app) }
    }
    pub fn get_app_handle(&self) -> Option<&AppHandle> {
        self.app.as_ref()
    }
    /// 获取data文件夹路径
    pub fn get_data_dir(&self) -> Result<PathBuf, String> {
        let data_dir = self
            .app
            .as_ref()
            .expect("不应该调用没有apphandle的对象")
            .path()
            .app_data_dir()
            .map_err(|e| e.to_string())?;
        Ok(data_dir)
    }
    #[cfg(target_os = "windows")]
    pub fn read_to_string(&self, file_path: &PathBuf) -> Result<String, ErrorKind> {
        let read_result = fs::read_to_string(Path::new(file_path));
        match read_result {
            Ok(content) => Ok(content),
            Err(e) => Err(e.kind()),
        }
    }
    #[cfg(target_os = "android")]
    pub fn read_to_string(&self, file_uri: &PathBuf) -> Result<String, ErrorKind> {
        use tauri_plugin_android_fs::{AndroidFsExt, FileUri};
        match AndroidFsExt::android_fs(&self.app.clone().unwrap())
            .read_to_string(&&FileUri::from_path(file_uri))
        {
            Ok(content) => Ok(content),
            Err(_) => Err(ErrorKind::NotFound),
        }
    }
    #[cfg(target_os = "windows")]
    pub fn write(&self, content: &str, file_path: &PathBuf) -> Result<(), ErrorKind> {
        let write_result = fs::write(file_path, content);
        match write_result {
            Ok(_) => Ok(()),
            Err(e) => Err(e.kind()),
        }
    }
    #[cfg(target_os = "android")]
    pub fn write(&self, content: &str, file_uri: &PathBuf) -> Result<(), ErrorKind> {
        use tauri_plugin_android_fs::{AndroidFsExt, FileUri};
        let write_result = AndroidFsExt::android_fs(&self.app.clone().unwrap())
            .write(&FileUri::from_path(file_uri), content);
        match write_result {
            Ok(_) => Ok(()),
            Err(_) => Err(ErrorKind::NotFound),
        }
    }
}
