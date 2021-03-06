import EmpireHelper from "./EmpireHelper";
import { ALLY_LIST } from "utils/config";

export default class MiliHelper {

    /**
     * check if the creep belongs to an alliance member
     * @param creep the creep we are evaluating
     */
    public static isAllyCreep(creep: Creep): boolean {
        return ALLY_LIST.includes(creep.owner.username);
    }
}
