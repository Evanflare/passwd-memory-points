use crate::APP_NAME;
use serde::{Deserialize, Serialize};
use std::{
    ffi::OsString,
    fs::{self},
    path::{Path, PathBuf},
};
use sysdirs::data_dir;
/// 配置文件名
pub const PROFILE_NAME: &str = "config";
pub const DEFAULT_FILL_CHAR: char = '0';
pub const PASSWD_FILE_NAME: &str = ".passwd";

#[derive(Debug, Serialize, Deserialize, Clone)]
/// 程序的配置结构体，负责读取配置文件，构造配置文件，修改配置文件，配置文件导出导入。
///
/// # 默认配置
/// 密码文件默认路径 passwd_file_path: "~\\.passwd-nickname\\.passwd.nickname"
/// 配置文件默认路径 profile_path: "%APPDATA%\\Roaming\\passwd-nickname\\config.toml"
/// 默认密钥填充字符 '0'
pub struct AppConfig {
    // 用户配置
    pub fill_char: char,
    pub passwd_file_path: String,
    pub profile_path: String,
    // TODO: 加密算法选择

    // 程序状态（自动保存）
}

/// 默认值：依赖cache-dir获取跨平台的文件夹位置
impl Default for AppConfig {
    fn default() -> Self {
        // 获取baseDir
        if cfg!(target_os = "android") {
            let base = PathBuf::from("/data/user/0/com.evanflare.passwd-memory-points/");
            return AppConfig::read_or_create_from_basedir(&base).expect("无法读取配置路径");
        }
        let app_data_dir = data_dir();
        if let Some(app_data_dir) = app_data_dir {
            AppConfig::read_or_create_from_basedir(&app_data_dir).expect("无法读取配置路径")
        } else {
            panic!("无法获取正确的AppData目录")
        }
    }
}
impl AppConfig {
    /// 根据baseDir路径，得到默认配置信息
    pub fn create_from_basedir(base: &PathBuf) -> Result<Self, OsString> {
        let mut base = base.clone();
        base.push(APP_NAME);
        let mut profile_path = base.clone();
        profile_path.push(format!("{PROFILE_NAME}.toml"));
        let mut passwd_file_path = base.clone();
        passwd_file_path.push(format!("{PASSWD_FILE_NAME}.toml"));
        Ok(AppConfig {
            fill_char: DEFAULT_FILL_CHAR,
            profile_path: profile_path.into_os_string().into_string()?,
            passwd_file_path: passwd_file_path.into_os_string().into_string()?,
        })
    }
    /// 根据baseDir路径,读取或创建默认配置信息
    pub fn read_or_create_from_basedir(base: &PathBuf) -> Result<Self, OsString> {
        // 先得到该路径下的默认配置
        let default_profile = AppConfig::create_from_basedir(base)?;
        // 根据默认配置信息检查配置文件是否存在
        if fs::exists(default_profile.profile_path.clone()).unwrap() {
            // 存在就读取里面的配置信息
            Ok(AppConfig::read_profile(&default_profile.profile_path).unwrap())
        } else {
            //默认配置中的二级配置文件位置应该就指向自己，如果不存在就创建文件
            let _ = default_profile.store();
            Ok(default_profile)
        }
    }
    /// 程序运行时读取配置文件。
    pub fn read_profile(profile_path: &str) -> Result<AppConfig, Box<dyn std::error::Error>> {
        // 读取文件
        let toml_text = fs::read_to_string(profile_path)?;
        // 反序列化为结构体
        let config: AppConfig = toml::from_str(&toml_text)?;

        return Ok(config);
    }
    /// 保存当前配置到配置的路径下
    pub fn store(&self) -> Result<(), Box<dyn std::error::Error>> {
        // 序列化 config 为 TOML 字符串T
        let toml_text = toml::to_string_pretty(self)?;
        let path = Path::new(&self.profile_path);

        // 自动创建父文件夹
        if let Some(parent) = path.parent() {
            if !parent.exists() {
                if let Err(e) = fs::create_dir_all(parent) {
                    if e.kind() == std::io::ErrorKind::PermissionDenied {
                        eprintln!(
                            "无法创建父目录（只读文件系统或权限不足）：{}，跳过写入。",
                            parent.display()
                        );
                        return Ok(());
                    } else {
                        return Err(Box::new(e));
                    }
                }
            }
        }
        // 写入文件
        if let Err(e) = fs::write(path, toml_text) {
            if e.kind() == std::io::ErrorKind::PermissionDenied {
                eprintln!(
                    "无法写入密码文件（只读文件系统或权限不足）：{}，跳过写入。",
                    path.display()
                );
                return Ok(());
            } else {
                eprint!(
                    "路径{}错误，无法写入。错误信息：{}",
                    path.display(),
                    e.to_string()
                );
                return Err(Box::new(e));
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {}
