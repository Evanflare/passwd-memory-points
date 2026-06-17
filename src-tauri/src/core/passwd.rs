//! 管理密码对象
//!

use crate::core::config::*;
use crate::core::crypt::{decrypt, decypt_string, encrypt};
use crate::core::error::Error::{self, SecretKeyDifferent};
use crate::core::nickname::*;

use ::serde::{Deserialize, Serialize};
use ::uuid::*;
use std::fs;
use std::path::Path;

/// 密码对象
/// passwd 不应该有除了数据操作外其他的操作，只是作为一个数据的容器而存在。
#[derive(Debug, Default, Serialize, Deserialize, Clone)]
pub struct Passwd {
    unique_id: String,
    pub name: String,
    pub descript: String,
    pub ciphertext: String,
    // TODO: 目前只能保存一个密码，希望可以有多个密码，并且有不同的密码标签
    default_fill_char: char,
}
impl PartialEq for Passwd {
    fn eq(&self, other: &Self) -> bool {
        self.unique_id == other.unique_id
    }
}
impl Passwd {
    /// 通过密文密码生成对象
    pub fn new(name: &str, descript: &str, ciphertext: &str, default_fill_char: char) -> Self {
        Self {
            unique_id: Uuid::new_v4().to_string(), // 全球唯一
            name: String::from(name),
            descript: String::from(descript),
            ciphertext: String::from(ciphertext),
            default_fill_char,
        }
    }
    pub fn get_default_fill_char(&self) -> char {
        return self.default_fill_char;
    }
    pub fn get_unique_id(&self) -> &str {
        return &self.unique_id;
    }
    pub fn uid_contain_word(&self, slice: &str) -> bool {
        self.unique_id.contains(slice)
    }
    /// 生成新的uid替换现在的uid
    fn replace_new_uid(&mut self) {
        self.unique_id = Uuid::new_v4().to_string();
    }
    /// 通过明文密码生成对象
    pub fn generate(
        name: &str,
        descript: &str,
        plaintext: &str,
        user_key: &str,
        default_fill_char: char,
    ) -> Self {
        let ciphertext = encrypt(plaintext.as_bytes(), user_key, default_fill_char);
        Passwd::new(name, descript, &hex::encode(&ciphertext), default_fill_char)
    }
    /// 解密passwd得到明文密码
    pub fn decypted_passwd(&self, user_key: &str) -> Result<String, chacha20poly1305::Error> {
        let decrypted = decrypt(
            &hex::decode(&self.ciphertext).unwrap(),
            user_key,
            self.default_fill_char,
        )?;
        Ok(format!("{}", String::from_utf8_lossy(&decrypted)))
    }
    /// 解密passwd得到所有字段的明文字符串：适合打印
    pub fn decypted_to_string(&self, user_key: &str) -> Result<String, chacha20poly1305::Error> {
        let mut clone = self.clone();
        let decrypted = decrypt(
            &hex::decode(&self.ciphertext).unwrap(),
            user_key,
            self.default_fill_char,
        )?;
        clone.ciphertext = format!("{}", String::from_utf8_lossy(&decrypted));
        Ok(format!("{:#?}", &clone))
    }

    /// 用于判断passwd任何uid,name,descript三字段是否包含关键字
    pub fn contain_keys(&self, keys: &Vec<String>) -> bool {
        let self_string = format!("{}\n{}\n{}", self.unique_id, self.name, self.descript);
        for s in keys {
            if self_string.contains(s) {
                return true;
            }
        }
        false
    }
    /// 用于更改密码对象的属性
    pub fn update(
        &mut self,
        name: Option<&str>,
        descript: Option<&str>,
        plaintext: Option<&str>,
        user_key: &str,
    ) -> Result<(), Error> {
        // 先校验密钥是否正确，解密是否成功，如果不成功则不修改对象
        match self.decypted_passwd(user_key) {
            Ok(_) => {
                // 如果解密成功，则修改对象
                if let Some(name) = name {
                    self.name = String::from(name);
                }
                if let Some(descript) = descript {
                    self.descript = String::from(descript);
                }
                if let Some(plaintext) = plaintext {
                    self.ciphertext = hex::encode(encrypt(
                        plaintext.as_bytes(),
                        user_key,
                        self.default_fill_char,
                    ));
                }
                Ok(())
            }
            Err(_) => Err(Error::SecretKeyWrong),
        }
    }
}

/// 密码vector，存储所有密码
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct PasswdVector {
    vec: Vec<Passwd>,
    pub nickname: Nickname,
    #[serde(skip_serializing, default)]
    pub config: AppConfig,
}

impl PasswdVector {
    /// 空对象
    pub fn new(config: AppConfig) -> Self {
        Self {
            vec: Vec::new(),
            nickname: Nickname::new(config.fill_char),
            config,
        }
    }
    /// 获得只读passwd列表
    pub fn get_passwds(&self) -> &Vec<Passwd> {
        &self.vec
    }
    /// 获得可变passwd列表
    pub fn get_mut_passwds(&mut self) -> &mut Vec<Passwd> {
        &mut self.vec
    }
    pub fn get_passwd_vec_len(&self) -> usize {
        return self.vec.len();
    }
    /// 读取config中的配置
    /// 当不存在或者出现问题的时候直接创建新的
    pub fn read_or_create(config: AppConfig) -> PasswdVector {
        let read_result = PasswdVector::read(&config);
        let passwd_vector;
        if let Err(_) = read_result {
            // 如果不是文件不存在，那么将原文件创建备份
            if fs::exists(&config.passwd_file_path).unwrap() {
                let _ = fs::copy(
                    &config.passwd_file_path,
                    format!(
                        "{}{}{}",
                        &config.passwd_file_path,
                        ".bak",
                        Uuid::new_v4().to_string()
                    ),
                );
            }
            eprintln!("密码文件不存在或不可读，请检查文件完整性或者文件权限。");
            passwd_vector = PasswdVector::new(config);
        } else {
            passwd_vector = read_result.unwrap();
        };
        passwd_vector
    }
    pub fn read(config: &AppConfig) -> Result<PasswdVector, Box<dyn std::error::Error>> {
        // 读取文件
        let toml_text = fs::read_to_string(config.passwd_file_path.to_string())?;

        // 反序列化为结构体
        let passwd_vector = toml::from_str(&toml_text)?;

        Ok(passwd_vector)
    }
    /// 读取文件内容创建对象
    pub fn read_from_path(path: &str) -> Result<Self, Error> {
        // 读取文件
        let toml_text = match fs::read_to_string(path) {
            Ok(r) => r,
            Err(_) => return Err(Error::FilePathIsWrong("无法读取该文件".to_string())),
        };
        PasswdVector::create_from_string(&toml_text)
    }
    /// 从字符串中创建对象
    pub fn create_from_string(data_str: &str) -> Result<Self, Error> {
        // 反序列化为结构体
        let passwd_vector = match toml::from_str(data_str) {
            Err(e) => return Err(Error::FileContentNotRight(e.to_string())),
            Ok(r) => r,
        };
        Ok(passwd_vector)
    }
    pub fn store(&self) -> Result<(), Box<dyn std::error::Error>> {
        // 序列化 passwd与nickname 为 TOML 字符串
        let toml_text = toml::to_string_pretty(self)?;
        let path = Path::new(&self.config.passwd_file_path);

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
    /// 校验密码是否正确,若成功返回密码，失败则返回错误
    pub fn check_secret_right_or_error(&self, user_key: &str) -> Result<String, Error> {
        if self.nickname.get_len() != 0 {
            // 检验密钥
            if self.nickname.check_decryption_key(user_key) {
                return Ok(user_key.to_string());
            } else {
                return Err(Error::SecretKeyWrong);
            }
        } else if self.get_passwd_vec_len() != 0 {
            // 将passwd vec中的第一个元素取出校验
            if let Ok(_) = self
                .get_passwds()
                .get(0)
                .unwrap()
                .decypted_passwd(&user_key)
            {
                return Ok(user_key.to_string());
            } else {
                return Err(Error::SecretKeyWrong);
            }
        } else {
            return Ok(user_key.to_string());
        }
    }
    /// 得到序列化字符串
    pub fn get_save_string(&self) -> Result<String, Error> {
        match toml::to_string_pretty(self) {
            Ok(toml_text) => Ok(toml_text),
            Err(e) => return Err(Error::FileContentNotRight(e.to_string())),
        }
    }
    ///另存为
    pub fn save_to_path(&self, path: &str) -> Result<(), Error> {
        // 序列化 passwd与nickname 为 TOML 字符串
        let toml_text = self.get_save_string()?;
        let path = Path::new(path);

        // 自动创建父文件夹
        if let Some(parent) = path.parent() {
            if !parent.exists() {
                if let Err(e) = fs::create_dir_all(parent) {
                    if e.kind() == std::io::ErrorKind::PermissionDenied {
                        eprintln!(
                            "无法创建父目录（只读文件系统或权限不足）：{}，跳过创建。",
                            parent.display()
                        );
                        return Err(Error::FilePathIsWrong(format!(
                            "无法创建文件（只读文件系统或权限不足）：{}，跳过创建。",
                            path.display()
                        )));
                    } else {
                        return Err(Error::FilePathIsWrong(format!(
                            "无法创建文件:{}",
                            path.to_str().unwrap()
                        )));
                    }
                }
            }
        }
        // 写入文件
        if let Err(e) = fs::write(path, toml_text) {
            if e.kind() == std::io::ErrorKind::PermissionDenied {
                eprintln!(
                    "无法写入文件（只读文件系统或权限不足）：{}，跳过写入。",
                    path.display()
                );
                return Err(Error::FilePathIsWrong(format!(
                    "无法写入文件（只读文件系统或权限不足）：{}，跳过写入。",
                    path.display()
                )));
            } else {
                return Err(Error::FilePathIsWrong(format!(
                    "无法写入文件:{}",
                    path.to_str().unwrap()
                )));
            }
        }

        Ok(())
    }
    pub fn add_passwd(&mut self, passwd: Passwd) {
        self.vec.push(passwd);
    }
    /// 传入一个对象，全部加入
    /// 如果有对象的uid相同，那么会修改uid为新的并加入。（为了尽可能不删除以及不用解决冲突）
    pub fn includes_passwd_vector(
        &mut self,
        mut other_passwd_vector: PasswdVector,
        local_secret: &str,
        import_secret: &str,
    ) -> Result<(), Error> {
        // 先校验两边的密钥是否都对
        self.check_secret_right_or_error(local_secret)?;
        other_passwd_vector.check_secret_right_or_error(import_secret)?;
        //再检验是否拥有相同的加密密钥,如果密码不相同，则将导入文件中的所有重新加密
        if local_secret != import_secret {
            other_passwd_vector.change_encypt_secret(import_secret, local_secret)?;
        }
        // 遍历每一个新passwd
        for ele in other_passwd_vector.get_mut_passwds().iter_mut() {
            if self.vec.contains(ele) {
                ele.replace_new_uid();
            }
        }
        self.vec.append(&mut other_passwd_vector.vec);
        // 消除memory points的重复元素，必须进行明文比较
        let local_points = self
            .nickname
            .decrypted_nickname(local_secret)
            .expect("已校验过密码，不会出错");
        let unique_points: Vec<&String> = other_passwd_vector
            .nickname
            .get_mut_names()
            .iter()
            .filter(|p| {
                !local_points.contains(
                    &decypt_string(p, local_secret, self.config.fill_char)
                        .expect("已校验过密码，不会出错"),
                )
            })
            .collect();
        for ele in unique_points {
            self.nickname.get_mut_names().push(ele.to_string());
        }
        Ok(())
    }
    /// 修改加密密钥
    /// 如果有无法更改的passwd，会在Error中进行提示，而不影响后面的passwd修改密钥
    pub fn change_encypt_secret(
        &mut self,
        old_secret: &str,
        new_secret: &str,
    ) -> Result<(), Error> {
        let mut err_message = String::new();
        // 首先将memory points中的密文全部转换
        match self.nickname.change_encypt_secret(old_secret, new_secret) {
            Ok(()) => {}
            Err(SecretKeyDifferent(message)) => err_message.push_str(&message),
            Err(_) => panic!("there is not possible error appear."),
        };
        // 然后将 passwd vector全部转换
        let mut err_message_2 = String::from("\n密码记忆部分解密失败: ");
        let fill_char = self.config.fill_char;
        let _: Vec<()> = self
            .get_mut_passwds()
            .iter_mut()
            .map(|p| -> () {
                match p.decypted_passwd(old_secret) {
                    Ok(passwd) => {
                        // 重新加密
                        let ciphertext = encrypt(passwd.as_bytes(), new_secret, fill_char);
                        // 覆盖
                        p.ciphertext = hex::encode(&ciphertext);
                    }
                    Err(_) => {
                        err_message_2.push_str(&format!("{},", p.name));
                    }
                };
            })
            .collect();
        // 判断是否出现错误
        if err_message_2.ends_with(",") {
            err_message.push_str(&err_message_2);
        }
        if err_message.ends_with(",") {
            err_message.pop();
            err_message.push_str(" 无法解密。");
            Err(Error::SecretKeyDifferent(err_message))
        } else {
            Ok(())
        }
    }
    /// 切换到其他密码记忆集的文件
    /// 需要确保path与content正确对应
    pub fn _check_passwd_vector_file(&mut self, content: &str, path: &str) -> Result<(), Error> {
        // 先从这个路径下读取文件，校验文件是否正确
        let read_passwd_vector = match Self::create_from_string(content) {
            Ok(res) => res,
            Err(_) => {
                return Err(Error::FilePathIsWrong(
                    "该路径下的文件无法正确解析".to_string(),
                ));
            }
        };
        // 持久化一下将要替换的内容，防止有未保存内容
        let _ = self.store();
        let _ = self.config.store();
        // 然后更新当前config的passwd-file-path
        self.config.passwd_file_path = path.to_string();
        // 然后替换passwd vector
        self.vec = read_passwd_vector.vec.clone();
        self.nickname.names = read_passwd_vector.nickname.names.clone();
        // 然后保存一下
        let _ = self.config.store();
        Ok(())
    }
    /// 切换到其他密码记忆集的文件
    /// 不适配其他平台
    pub fn check_passwd_vector_file(&mut self, path: &str) -> Result<(), Error> {
        // 先从这个路径下读取文件，校验文件是否正确
        let read_passwd_vector = match Self::read_from_path(path) {
            Ok(res) => res,
            Err(_) => {
                return Err(Error::FilePathIsWrong(
                    "该路径下的文件无法正确解析".to_string(),
                ));
            }
        };
        // 持久化一下将要替换的内容，防止有未保存内容
        let _ = self.store();
        let _ = self.config.store();
        // 然后更新当前config的passwd-file-path
        self.config.passwd_file_path = path.to_string();
        // 然后替换passwd vector
        self.vec = read_passwd_vector.vec.clone();
        self.nickname.names = read_passwd_vector.nickname.names.clone();
        // 然后保存一下
        let _ = self.config.store();
        Ok(())
    }
    /// 通过uid删除passwd项
    pub fn remove_passwd_by_unique_id(&mut self, unique_id: &str) -> bool {
        let mut remove_index = self.vec.len();
        match self.vec.iter().enumerate().find(|&p| {
            if p.1.get_unique_id() == unique_id {
                remove_index = p.0;
                return true;
            } else {
                return false;
            }
        }) {
            Some((index, _)) => {
                self.vec.remove(index);
                return true;
            }
            None => {
                return false;
            }
        }
    }
    /// 如果uid唯一匹配则执行方法，否则执行另外的方法
    pub fn do_some_by_uid_filter_one_passwd_or_do_other_thing(
        &mut self,
        uid: &str,
        mut do_some: impl FnMut(&mut Vec<Passwd>, usize),
        do_other: fn(&mut Vec<Passwd>, &Vec<usize>),
    ) {
        let index_list: Vec<usize> = self
            .list_all_passwd_which_uid_contain_slice(uid)
            .into_iter()
            .map(|(i, _)| i)
            .collect();
        match index_list.len() {
            1 => do_some(
                &mut self.vec,
                *index_list
                    .get(0)
                    .expect("因为确定len=1，所以index=0元素存在"),
            ),
            _ => do_other(&mut self.vec, &index_list),
        }
    }
    /// 根据 uid 获得 passwd 的&mut
    pub fn get_passwd_by_uid(&mut self, uid: &str) -> Option<&mut Passwd> {
        for ele in self.vec.iter_mut() {
            if ele.get_unique_id() == uid {
                return Some(ele);
            }
        }
        None
    }
    /// 所有所有包含keys中关键词的 passwd
    pub fn search_all_passwd<'a>(&'a self, keys: &Vec<String>) -> Vec<&'a Passwd> {
        let mut res: Vec<&Passwd> = Vec::new();
        self.vec
            .iter()
            .map(|p| {
                if p.contain_keys(keys) {
                    res.push(p);
                }
            })
            .count();
        res
    }
    /// 列出所有uid包含slice的
    pub fn list_all_passwd_which_uid_contain_slice(&self, slice: &str) -> Vec<(usize, &Passwd)> {
        let mut res_vec: Vec<(usize, &Passwd)> = Vec::new();
        for (i, p) in self.vec.iter().enumerate() {
            if p.uid_contain_word(slice) {
                res_vec.push((i, p));
            }
        }
        res_vec
    }
}

#[cfg(test)]
mod tests {
    use crate::core::config::AppConfig;
    use crate::core::passwd::Passwd;

    // 测试在保存后，重新读取对象，是否与保存前的对象一致。
    #[test]
    #[ignore] // 被后面的passwd vector 替代进行密码文件的操作。
    fn test_save_load_nochange() {
        let passwd = Passwd::generate(
            "create.io andy",
            "andy 在 crate.io的社区账号密码",
            "我 爱 大猫",
            "123456",
            AppConfig::default().fill_char,
        );
        dbg!(&passwd);
        // passwd.save().unwrap();
        // assert_eq!(Passwd::load().unwrap(), passwd);
        // // 删除文件还原环境
        // fs::remove_file(&self.config.passwd_file_path).unwrap();
        // assert!(!fs::exists(&CONFIG.passwd_file_path).unwrap());
    }
}
