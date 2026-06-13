use nickname_passwd::args_parse::Error;
use nickname_passwd::passwd::PasswdVector;

/// 校验密码是否正确,若成功返回密码，失败则返回错误
pub fn check_secret_right_or_error(
    passwd_vec: &PasswdVector,
    user_key: &str,
) -> Result<String, Error> {
    if passwd_vec.nickname.get_len() != 0 {
        // 检验密钥
        if passwd_vec.nickname.check_decryption_key(user_key) {
            return Ok(user_key.to_string());
        } else {
            return Err(Error::SecretKeyWrong);
        }
    } else if passwd_vec.get_passwd_vec_len() != 0 {
        // 将passwd vec中的第一个元素取出校验
        if let Ok(_) = passwd_vec
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
