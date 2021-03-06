import EmpireHelper from "../Helpers/EmpireHelper";
import MemoryApi from "./Memory.Api";
import { ZEALOT_SOLO, STALKER_SOLO, STANDARD_SQUAD } from "utils/Constants";
import {
    ZEALOT_FLAG_ONE_TIME_USE,
    STALKER_FLAG_ONE_TIME_USE,
    STANDARD_SQUAD_FLAG_ONE_TIME_USE
} from "utils/militaryConfig"

export default class Empire {

    /**
     * get new flags that need to be processed
     * @returns Flag[] an array of flags that need to be processed (empty if none)
     */
    public static getUnprocessedFlags(): Flag[] {

        // Create an array of all flags
        const allFlags: Flag[] = MemoryApi.getAllFlags();
        const newFlags: Flag[] = [];

        // Create an array of all unprocessed flags
        for (const flag of allFlags) {
            if (!flag.memory.processed || flag.memory.processed === undefined) {
                newFlags.push(flag);
            }
        }

        // Returns all unprocessed flags, empty array if there are none
        return newFlags;
    }
    /**
     * search for new flags and properly commit them
     * @param newFlags StringMap of new flags we need to process
     */
    public static processNewFlags(newFlags: Flag[]): void {

        // Don't run the function if theres no new flags
        if (newFlags.length === 0) {
            return;
        }

        // Loop over all new flags and call the proper helper
        for (const flag of newFlags) {

            switch (flag.color) {

                // Remote Flags
                case COLOR_YELLOW:

                    EmpireHelper.processNewRemoteFlag(flag);
                    break;

                // Attack Flags
                case COLOR_RED:

                    EmpireHelper.processNewAttackFlag(flag);
                    break;

                // Claim Flags
                case COLOR_WHITE:

                    EmpireHelper.processNewClaimFlag(flag);
                    break;

                // Option flags
                case COLOR_GREEN:

                    // Dependent Room override flag
                    if (flag.secondaryColor === COLOR_WHITE) {
                        EmpireHelper.processNewDependentRoomOverrideFlag(flag);
                    }
                    else if (flag.secondaryColor === COLOR_YELLOW) {
                        EmpireHelper.processNewStimulateFlag(flag);
                    }
                    break;

                // Unhandled Flag, print warning to console
                // Set to processed to prevent the flag from attempting processization every tick
                default:

                    MemoryApi.createEmpireAlertNode("Attempted to process flag of an unhandled type.", 10);
                    flag.memory.processed = true;
                    flag.memory.complete = true;
                    break;
            }

            // Set up the memory for the room if it doesn't already exist
            const roomName = flag.pos.roomName;
            if (!Memory.rooms[roomName]) {
                const isOwnedRoom: boolean = false;
                MemoryApi.createEmpireAlertNode("Initializing Room Memory for Dependent Room [" + roomName + "].", 10);
                MemoryApi.initRoomMemory(roomName, isOwnedRoom);
            }
        }
    }

    /**
     * deletes all flags marked as complete
     */
    public static deleteCompleteFlags(): void {

        const completeFlags = MemoryApi.getAllFlags((flag: Flag) => flag.memory.complete);

        // Loop over all flags, removing them and their direct memory from the game
        for (const flag of completeFlags) {
            MemoryApi.createEmpireAlertNode("Removing flag [" + flag.name + "]", 10);
            flag.remove();
            delete Memory.flags[flag.name];
        }
    }

    /**
     * look for dead flags (memory with no associated flag existing) and remove them
     */
    public static cleanDeadFlags(): void {

        // Get all flag based action memory structures (Remote, Claim, and Attack Room Memory)
        const allRooms = MemoryApi.getOwnedRooms();
        const claimRooms: Array<ClaimRoomMemory | undefined> = _.flatten(_.map(allRooms,
            room => MemoryApi.getClaimRooms(room)));
        const remoteRooms: Array<RemoteRoomMemory | undefined> = _.flatten(_.map(allRooms,
            room => MemoryApi.getRemoteRooms(room)));
        const attackRooms: Array<AttackRoomMemory | undefined> = _.flatten(_.map(allRooms,
            room => MemoryApi.getAttackRooms(room)));


        // Clean dead flags from memory structures
        EmpireHelper.cleanDeadClaimRoomFlags(claimRooms);
        EmpireHelper.cleanDeadRemoteRoomsFlags(remoteRooms);
        EmpireHelper.cleanDeadAttackRoomFlags(attackRooms);

        // Clean the memory of each type of dependent room memory structure with no existing flags associated
        EmpireHelper.cleanDeadClaimRooms(claimRooms);
        EmpireHelper.cleanDeadRemoteRooms(remoteRooms);
        EmpireHelper.cleanDeadAttackRooms(attackRooms);
    }

    /**
     * get if the flag is considered a one time use flag
     */
    public static isAttackFlagOneTimeUse(flagMemory: AttackFlagMemory): boolean {
        // Reference config file to decide what flag is considered 1 time use, assume yes by default
        switch (flagMemory.flagType) {
            case ZEALOT_SOLO:
                return ZEALOT_FLAG_ONE_TIME_USE;
            case STALKER_SOLO:
                return STALKER_FLAG_ONE_TIME_USE;
            case STANDARD_SQUAD:
                return STANDARD_SQUAD_FLAG_ONE_TIME_USE;
            default:
                return true;
        }
    }

    /**
     * if there are no active attack flags for a specific room, active one
     */
    public static activateAttackFlags(room: Room): void {

        const attackRooms: Array<AttackRoomMemory | undefined> = MemoryApi.getAttackRooms(room);
        const attackRoomWithNoActiveFlag: AttackRoomMemory | undefined = _.find(attackRooms, (attackRoom: AttackRoomMemory) => {
            if (attackRoom) {
                return !_.some(attackRoom!.flags, (flag: AttackFlagMemory) => flag.active);
            }
            return false;
        });

        // Break early if there are none
        if (!attackRoomWithNoActiveFlag) {
            return;
        }

        // Break early if no attack flags on this room (possible to happen from an error with cleaning)
        if (!attackRoomWithNoActiveFlag!.flags) {
            return;
        }

        // Activate the first one we see, possible to change later for another standard
        for (const arf in attackRoomWithNoActiveFlag!.flags) {
            if (attackRoomWithNoActiveFlag!.flags[arf]) {
                attackRoomWithNoActiveFlag!.flags[arf]!.active = true;
                break;
            }
        }
    }
};
