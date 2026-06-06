// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::generate_context;
mod commands;
mod error;
use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            list_passwds,
            get_passwd,
            list_nicknames,
            add_nickname,
            search_passwd,
            get_config,
            add_passwd
        ])
        .run(generate_context!())
        .expect("error while running tauri application");
}
