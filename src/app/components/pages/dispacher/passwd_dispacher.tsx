import { PasswdSummary } from "../../../tauri_core/command_frontend";

type PasswdState = {
    dialog_plaintext: string,
    query: string,
    filtered_list: PasswdSummary[],
}
type PasswdPageAction = {
    type: string,
    query?: string,
    secret?: string,
    uid?: string,
    name?: string,
    discription?: string,
    plaintext?: string
    filtered_list?: PasswdSummary[],
}


const init_state: PasswdState = {
    dialog_plaintext: "",
    query: "",
    filtered_list: [],
}

function actionReducer(draft: PasswdState, action: PasswdPageAction) {
    switch (action.type) {
        case 'search':
            draft.query = action.query ?? "";
            break;
        case '_update-list':
            if (action.filtered_list) draft.filtered_list = action.filtered_list;
            break;
        // ... 其他 case 不变
        case 'added': {
            // 当添加了新元素之后重新搜索一下
            draft.query = "";
            break;
        }
        case 'changed': {
            //todo
            break;
        }
        case 'deleted': {
            // todo
            break;
        }
        case 'decypt': {
            // 获取到要解密的passwd uid，secret key
            // 不能写在这里，reducer会被重复调用来排除不应该在的操作
            break;
        }
        case 'close-dialog': {
            // 清除状态
            draft.dialog_plaintext = '';
            break;
        }
        default: {
            throw Error('未知 action：' + action.type);
        }
    }
    return draft;
}

export { actionReducer, init_state };
export type { PasswdState, PasswdPageAction };
