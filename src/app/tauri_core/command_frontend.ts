import { invoke } from "@tauri-apps/api/core";
import { InternalFile } from "../components/ui/InternalFilePicker";


export type PasswdSummary = {
    uid: string;
    name: string;
    description: string;
    ciphertext: string;
};
export type ConfigInfo = {
    default_fill_char: '',
    passwd_file_path: string,
    profile_path: string,
}

export async function listPasswds(keyWord = ""): Promise<PasswdSummary[]> {
    return await invoke("list_passwds", { key_word: keyWord });
}

export async function getPasswd(uid: string, key: string): Promise<string> {
    return await invoke("get_passwd", { uid, key });
}

export async function searchPasswds(query: string): Promise<PasswdSummary[]> {
    return await invoke("search_passwds", { key_word: query });
}

export async function decyptPasswd(uid: string, key: string): Promise<string> {
    return await invoke('get_passwd', { uid: uid, key: key });
}

export async function addPasswd(parts: string[],
    unique: string,
    random: boolean,
    name: string,
    descript: string,
    key: string) {
    try {
        await invoke('add_passwd', {
            parts,
            unique,
            random,
            name,
            descript,
            key
        });
    }
    catch (e: any) {
        console.log("invoke return error:", e)
        throw e;
    }
}

export async function updatePasswd({
    uid,
    name,
    descript,
    plaintext,
    user_key
}: {
    uid: string;
    name: string | null | undefined;
    descript: string | null | undefined;
    plaintext: string | null | undefined;
    user_key: string;
}) {
    return await invoke('update_passwd', {
        uid,
        name,
        descript,
        plaintext,
        user_key
    });
}

export async function addNickname(nickname: string, key: string): Promise<boolean> {
    try {
        return await invoke("add_nickname", { nickname, key });
    } catch (e: any) {
        console.error("invoke add_nickname error:", e);
        throw e;
    }
}

export async function getConfig(): Promise<ConfigInfo> {
    return await invoke("get_config");
}

export async function plaintextPoints(user_key: string): Promise<string[]> {
    return await invoke("plaintext_points", { key: user_key })
}

export async function getMemoryPoints(): Promise<string[]> {
    return await invoke("get_memory_points")
}

export async function updateConfig(): Promise<string> {
    //todo
    return ""
}

export async function del_memory_point(point_str: string, secret_key: string) {
    return await invoke("del_memory_point", { point_str, secret_key });
}

export async function del_passwd_by_uid(uid: string, secret_key: string) {
    return await invoke("del_passwd_by_uid", { uid, secret_key });
}

export async function changeSecret(currentKey: string, newKey: string) {
    return await invoke("change_secret_key", { old_secret: currentKey, new_secret: newKey });
}

export async function changeFile(filePath: string) {
    return await invoke("change_file", {
        file_path: filePath
    })
}
export async function getAppDataDir(): Promise<string> {
    return await invoke<string>('get_app_data_dir');
}


export async function get_app_config_dir_files(): Promise<InternalFile[]> {
    return await invoke<InternalFile[]>('get_app_config_dir_files');
}


export async function extern_file_include(extern_file_path: string): Promise<string> {
    return await invoke<string>('extern_file_include', { extern_file_path });
}