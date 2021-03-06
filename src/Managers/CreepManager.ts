import MinerCreepManager from "./Roles/MinerCreepManager";
import UserException from "utils/UserException";
import HarvesterCreepManager from "./Roles/HarvesterCreepManager";
import WorkerCreepManager from "./Roles/WorkerCreepManager";
import LorryCreepManager from "./Roles/LorryCreepManager";
import PowerUpgraderCreepManager from "./Roles/PowerUpgraderCreepManager";
import RemoteMinerCreepManager from "./Roles/RemoteMinerCreepManager";
import RemoteHarvesterCreepManager from "./Roles/RemoteHarvesterCreepManager";
import RemoteColonizerCreepManager from "./Roles/RemoteColonizerCreepManager";
import ClaimerCreepManager from "./Roles/ClaimerCreepManager";
import RemoteDefenderCreepManager from "./Roles/RemoteDefenderCreepManager";
import RemoteReserverCreepManager from "./Roles/RemoteReserverCreepManager";
import ZealotCreepManager from "./Roles/ZealotCreepManager";
import MedicCreepManager from "./Roles/MedicCreepManager";
import StalkerCreepManager from "./Roles/StalkerCreepManager";
import DomesticDefenderCreepManager from "./Roles/DomesticDefenderCreepManager";
import {
    ROLE_COLONIZER,
    ROLE_REMOTE_MINER,
    ROLE_REMOTE_RESERVER,
    ROLE_LORRY,
    ROLE_HARVESTER,
    ROLE_MEDIC,
    ROLE_MINER,
    ROLE_POWER_UPGRADER,
    ROLE_REMOTE_DEFENDER,
    ROLE_REMOTE_HARVESTER,
    ROLE_DOMESTIC_DEFENDER,
    ROLE_CLAIMER,
    ROLE_STALKER,
    ROLE_WORKER,
    ROLE_ZEALOT,
    ERROR_ERROR
} from "utils/Constants";
import UtilHelper from "Helpers/UtilHelper";

// Call the creep manager for each role
export default class CreepManager {
    /**
     * loop over all creeps and call single creep manager for it
     */
    public static runCreepManager(): void {
        for (const creep in Game.creeps) {
            try {
                this.runSingleCreepManager(Game.creeps[creep]);
            } catch (e) {
                UtilHelper.printError(e);
            }
        }
    }

    /**
     * run single creep manager
     * @param creep the creep we are calling the manager for
     */
    public static runSingleCreepManager(creep: Creep): void {
        const role = creep.memory.role;

        // Call the correct helper function based on creep role
        switch (role) {
            case ROLE_MINER:
                MinerCreepManager.runCreepRole(creep);
                break;
            case ROLE_HARVESTER:
                HarvesterCreepManager.runCreepRole(creep);
                break;
            case ROLE_WORKER:
                WorkerCreepManager.runCreepRole(creep);
                break;
            case ROLE_LORRY:
                LorryCreepManager.runCreepRole(creep);
                break;
            case ROLE_POWER_UPGRADER:
                PowerUpgraderCreepManager.runCreepRole(creep);
                break;
            case ROLE_REMOTE_MINER:
                RemoteMinerCreepManager.runCreepRole(creep);
                break;
            case ROLE_REMOTE_HARVESTER:
                RemoteHarvesterCreepManager.runCreepRole(creep);
                break;
            case ROLE_COLONIZER:
                RemoteColonizerCreepManager.runCreepRole(creep);
                break;
            case ROLE_CLAIMER:
                ClaimerCreepManager.runCreepRole(creep);
                break;
            case ROLE_REMOTE_DEFENDER:
                RemoteDefenderCreepManager.runCreepRole(creep);
                break;
            case ROLE_REMOTE_RESERVER:
                RemoteReserverCreepManager.runCreepRole(creep);
                break;
            case ROLE_ZEALOT:
                ZealotCreepManager.runCreepRole(creep);
                break;
            case ROLE_MEDIC:
                MedicCreepManager.runCreepRole(creep);
                break;
            case ROLE_STALKER:
                StalkerCreepManager.runCreepRole(creep);
                break;
            case ROLE_DOMESTIC_DEFENDER:
                DomesticDefenderCreepManager.runCreepRole(creep);
                break;
            default:
                throw new UserException(
                    "Invalid role for runSingleCreepManager.",
                    'The role "' + role + '" was invalid for running a creep role.',
                    ERROR_ERROR
                );
        }
    }
}
