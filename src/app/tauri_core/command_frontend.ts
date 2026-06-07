import { invoke } from "@tauri-apps/api/core";


export type PasswdSummary = {
    uid: string;
    name: string;
    description: string;
    ciphertext: string;
};

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