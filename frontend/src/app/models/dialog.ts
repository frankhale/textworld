import { Parent } from "./parent";

export interface Dialog extends Parent {
    trigger: string[];
    response: string | null;
}
