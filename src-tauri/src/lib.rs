// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use crate::status::passwd_vector_status::get_passwd_vector_by_apphandle;
use std::sync::Mutex;
use tauri::generate_context;
use tauri::Manager;
/// 模块定义
pub mod commands;
pub mod error;
pub mod status;
pub mod utils;
/// 重导出
pub use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let passwd_vector = get_passwd_vector_by_apphandle(app);
            let state = Mutex::new(passwd_vector);
            app.manage(state);
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            list_passwds,
            get_passwd,
            list_nicknames,
            add_nickname,
            search_passwds,
            get_config,
            add_passwd,
            update_passwd
        ])
        .run(generate_context!())
        .expect("error while running tauri application");
}
