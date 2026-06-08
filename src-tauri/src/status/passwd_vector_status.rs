use nickname_passwd::{
    config::{AppConfig, PASSWD_FILE_NAME, PROFILE_NAME},
    passwd::PasswdVector,
};
use std::path::PathBuf;
use tauri::{App, Manager};
/// 用 AppHandle 在 Android（优先）与其它平台上解析 confy/config.toml 的路径
/// 直接得到passwd_vector_status
pub fn get_passwd_vector_by_apphandle(app: &App) -> PasswdVector {
    // Android / Tauri 桌面运行时统一入口：尝试使用 AppHandle 的 PathResolver
    // PathResolver 提供 app_config_dir() 等方法（若 tauri 版本不同名称可能略异）
    // if cfg!(target_os = "android") {
    //     // 配置文件走 AppConfig；数据文件走 AppLocalData
    //     let profile_path = app
    //         .path()
    //         .resolve(
    //             format!("{PROFILE_NAME}.toml"),
    //             tauri::path::BaseDirectory::AppConfig,
    //         )
    //         .map_err(|e| e.to_string());
    //     // PASSWD_FILE_NAME 在库里已经包含扩展名，不要再追加 ".toml"
    //     let passwd_file_path = app.path().resolve(
    //         format!("{PASSWD_FILE_NAME}.toml"),
    //         tauri::path::BaseDirectory::AppLocalData,
    //     );
    //     let Ok(profile_path) = profile_path else {
    //         eprintln!("获取默认配置路径失败。");
    //         panic!("获取默认配置路径失败");
    //     };
    //     let Ok(passwd_file_path) = passwd_file_path else {
    //         eprintln!("获取默认配置路径失败。");
    //         panic!("获取默认配置路径失败");
    //     };
    //     return PasswdVector::read_or_create(AppConfig {
    //         default_fill_char: AppConfig::default().default_fill_char,
    //         passwd_file_path: passwd_file_path.to_str().unwrap().to_string(),
    //         profile_path: profile_path.to_str().unwrap().to_string(),
    //     });
    // }

    if cfg!(target_os = "android") {
        if let Ok(appdata) = app.path().app_data_dir() {
            if let Ok(cfg) = AppConfig::create_from_basedir(&appdata) {
                return PasswdVector::read_or_create(cfg);
            }
        }
    }

    // 非 Android 平台仍然使用通用计算（confy 风格）
    if cfg!(target_os = "windows") {
        if let Ok(appdata) = std::env::var("APPDATA") {
            let p = PathBuf::from(appdata);
            if let Ok(cfg) = AppConfig::create_from_basedir(&p) {
                return PasswdVector::read_or_create(cfg);
            }
        }
    }

    // 最后回退到默认配置（与 confy 一致的默认值）
    return PasswdVector::read_or_create(AppConfig::default());
}
