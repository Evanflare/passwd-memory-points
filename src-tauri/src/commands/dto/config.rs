use serde::Serialize;

#[derive(Serialize)]
pub struct ConfigInfo {
    pub default_fill_char: char,
    pub passwd_file_path: String,
    pub profile_path: String,
    pub dark_mode: bool,
}
