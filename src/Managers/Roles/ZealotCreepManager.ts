import MiliApi from "Api/CreepMili.Api";
import {
    DEFAULT_MOVE_OPTS
} from "utils/constants";

// Manager for the miner creep role
export default class ZealotCreepManager {

    /**
     * run the zealot creep
     * @param creep the creep we are running
     */
    public static runCreepRole(creep: Creep): void {
        if (creep.spawning) {
            return;
        }

        const creepOptions: CreepOptionsMili = creep.memory.options as CreepOptionsMili;
        const CREEP_RANGE: number = 1;

        // Carry out the basics of a military creep before moving on to specific logic
        if (MiliApi.checkMilitaryCreepBasics(creep, creepOptions)) {
            return;
        }

        // Find a target for the creep
        const target: Creep | Structure<StructureConstant> | undefined = MiliApi.getAttackTarget(creep, creepOptions, CREEP_RANGE);
        const isMelee: boolean = true;
        if (!target) {
            return; // idle if no current target
        }
        // If we aren't in attack range, move towards the attack target
        if (!MiliApi.isInAttackRange(creep, target.pos, isMelee)) {
            creep.moveTo(target, DEFAULT_MOVE_OPTS);
            return;
        }

        // We are in attack range and healthy, attack the target
        creep.attack(target);
    }
}
