use tauri::AppHandle;

use crate::core::config::AppConfig;
use crate::core::PasswdVector;
use crate::platform::FileOperator;
pub struct PasswdManager {
    pub passwds: PasswdVector,
    pub config: AppConfig,
    pub app_handle: AppHandle,
    pub file_operator: FileOperator,
}

impl PasswdManager {
    pub fn new(app_handle: AppHandle) -> Self {
        let file_operator = FileOperator::new(app_handle.clone());
        let config = AppConfig::generate(file_operator.clone());
        let passwds: PasswdVector = PasswdVector::generate(file_operator.clone(), &config);
        Self {
            file_operator: file_operator,
            config: config,
            app_handle: app_handle.clone(),
            passwds: passwds,
        }
    }
}

impl Drop for PasswdManager {
    fn drop(&mut self) {
        let _ = self.config.store();
        let _ = self.passwds.store(&self.config.passwd_file_path);
    }
}
