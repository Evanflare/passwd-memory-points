import { invoke } from "@tauri-apps/api/core";


export type PasswdSummary = {
    uid: string;
    name: string;
    description: string;
};

export async function listPasswds(keyWord = ""): Promise<PasswdSummary[]> {
    return invoke("list_passwds", { key_word: keyWord });
}

export async function getPasswd(uid: string, key: string): Promise<string> {
    return invoke("get_passwd", { uid, key });
}

export async function searchPasswd(query: string): Promise<PasswdSummary[]> {
    return invoke("search_passwd", { query });
}
