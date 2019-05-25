import MemoryHelper from "./MemoryHelper";
import SpawnApi from "Api/Spawn.Api";
import {
    ROLE_COLONIZER,
    ROLE_REMOTE_MINER,
    ROLE_REMOTE_RESERVER,
    ROLE_MEDIC,
    ROLE_MINER,
    ROLE_REMOTE_HARVESTER,
    ROLE_STALKER,
    ROLE_ZEALOT,
    ROLE_CLAIMER,
    GROUPED,
    COLLATED,
    ROOM_STATE_INTRO,
    ROOM_STATE_BEGINNER,
    ROOM_STATE_INTER,
    ROOM_STATE_ADVANCED,
    ROOM_STATE_NUKE_INBOUND,
    ROOM_STATE_STIMULATE,
    ROOM_STATE_UPGRADER,
    TIER_1,
    TIER_2,
    TIER_3,
    TIER_4,
    TIER_5,
    TIER_6,
    TIER_7,
    TIER_8,
    ROLE_DOMESTIC_DEFENDER,
    ERROR_WARN,
    STALKER_SOLO,
    ZEALOT_SOLO,
    STANDARD_SQUAD
} from "utils/Constants";
import UserException from "utils/UserException";
import MemoryApi from "Api/Memory.Api";
import {
    ZEALOT_SOLO_ARRAY,
    STANDARD_SQUAD_ARRAY,
    STALKER_SOLO_ARRAY,
    TIER_1_MILITARY_PRIORITY,
    TIER_2_MILITARY_PRIORITY,
    TIER_3_MILITARY_PRIORITY,
    ALL_MILITARY_ROLES
} from "utils/militaryConfig";
import { RESERVER_MIN_TTL } from "utils/config";

/**
 * Functions to help keep Spawn.Api clean go here
 */
export class SpawnHelper {
    /**
     * Returns a boolean indicating if the object is a valid creepBody descriptor
     * @param bodyObject The description of the creep body to verify
     */
    public static verifyDescriptor(bodyObject: CreepBodyDescriptor): boolean {
        const partNames = Object.keys(bodyObject);
        let valid: boolean = true;
        // Check that no body parts have a definition of 0 or negative
        for (const part in partNames) {
            if (bodyObject[part] <= 0) {
                valid = false;
            }
            if (!(part in BODYPARTS_ALL)) {
                valid = false;
            }
        }
        return valid;
    }

    /**
     * Helper function - Returns an array containing @numParts of @part
     * @part The part to create
     * @numParts The number of parts to create
     */
    public static generateParts(part: BodyPartConstant, numParts: number): BodyPartConstant[] {
        const returnArray: BodyPartConstant[] = [];
        for (let i = 0; i < numParts; i++) {
            returnArray.push(part);
        }
        return returnArray;
    }

    /**
     * Groups the body parts -- e.g. WORK, WORK, CARRY, CARRY, MOVE, MOVE
     * @param descriptor A StringMap of creepbody limits -- { MOVE: 3, CARRY: 2, ... }
     */
    public static getBody_Grouped(descriptor: CreepBodyDescriptor): BodyPartConstant[] {
        const creepBody: BodyPartConstant[] = [];
        _.forEach(Object.keys(descriptor), (part: BodyPartConstant) => {
            // Having ! after property removes 'null' and 'undefined'
            for (let i = 0; i < descriptor[part]!; i++) {
                creepBody.push(part);
            }
        });
        return creepBody;
    }

    /**
     * Collates the body parts -- e.g. WORK, CARRY, MOVE, WORK, CARRY, ...
     * @param descriptor A StringMap of creepbody limits -- { MOVE: 3, CARRY: 2, ... }
     */
    public static getBody_Collated(descriptor: CreepBodyDescriptor): BodyPartConstant[] {
        const returnParts: BodyPartConstant[] = [];
        const numParts: number = _.sum(_.values(descriptor));
        const partNames = <BodyPartConstant[]>Object.keys(descriptor);

        let i = 0;
        while (i < numParts) {
            for (let j = 0; j < partNames.length; j++) {
                const currPart: BodyPartConstant = partNames[j];
                if (descriptor[currPart]! >= 1) {
                    returnParts.push(currPart);
                    descriptor[currPart]!--;
                    i++;
                }
            }
        }
        return returnParts;
    }

    /**
     * Generates a creep name in the format role_tier_uniqueID
     * @param role The role of the creep being generated
     * @param tier The tier of the creep being generated
     */
    public static generateCreepName(role: RoleConstant, tier: TierConstant, room: Room): string {
        const modifier: string = Game.time.toString().slice(-4);
        const name = role + "_" + tier + "_" + room.name + "_" + modifier;
        return name;
    }

    // Domestic ----
    /**
     * Generate body for miner creep
     * @param tier The tier of the room
     */
    public static generateMinerBody(tier: TierConstant): BodyPartConstant[] {
        let body: CreepBodyDescriptor = { work: 2, move: 2 };
        const opts: CreepBodyOptions = { mixType: GROUPED };

        switch (tier) {
            case TIER_1: // 2 Work, 2 Move - Total Cost: 300
                body = { work: 2, move: 2 };
                opts.mixType = COLLATED; // Just as an example of how we could change opts by tier as well
                break;

            case TIER_2: // 5 Work, 1 Move - Total Cost: 550
                body = { work: 5, move: 1 };
                break;

            case TIER_8:
            case TIER_7:
            case TIER_6:
            case TIER_5:
            case TIER_4:
            case TIER_3: // 5 Work, 2 Move - Total Cost: 600
                body = { work: 5, move: 2 };
                break;
        }

        // Generate the creep body based on the body array and options
        return SpawnApi.getCreepBody(body, opts);
    }

    /**
     * Generate options for miner creep
     * @param roomState the room state of the room
     */
    public static generateMinerOptions(roomState: RoomStateConstant): CreepOptionsCiv | undefined {
        let creepOptions: CreepOptionsCiv = this.getDefaultCreepOptionsCiv();

        switch (roomState) {
            case ROOM_STATE_INTRO:
            case ROOM_STATE_BEGINNER:
            case ROOM_STATE_INTER:
            case ROOM_STATE_ADVANCED:
            case ROOM_STATE_STIMULATE:
            case ROOM_STATE_UPGRADER:
            case ROOM_STATE_NUKE_INBOUND:
                creepOptions = {
                    // Options marked with // are overriding the defaults
                    harvestSources: true, //
                    fillContainer: true //
                };

                break;
        }

        return creepOptions;
    }

    /**
     * Generate body for Harvester creep
     * @param tier the tier of the room
     */
    public static generateHarvesterBody(tier: TierConstant): BodyPartConstant[] {
        // Default Values for harvester
        let body: CreepBodyDescriptor = { work: 1, carry: 2, move: 2 };
        const opts: CreepBodyOptions = { mixType: GROUPED };

        switch (tier) {
            case TIER_1: // 1 Work, 2 Carry, 2 Move - Total Cost: 300
                body = { work: 1, carry: 2, move: 2 };
                break;

            case TIER_2: // 2 Work, 4 Carry, 3 Move - Total Cost: 550
                body = { work: 2, carry: 4, move: 3 };
                break;

            case TIER_3: // 2 Work, 6 Carry, 6 Move - Total Cost: 800
                body = { work: 2, carry: 6, move: 6 };
                break;

            case TIER_4: // 2 Work, 11 Carry, 11 Move - Total Cost: 1300
                body = { work: 2, carry: 11, move: 11 };
                break;

            case TIER_6:
            case TIER_5: // 2 Work, 16 Carry, 16 Move - Total Cost: 1800
                body = { work: 2, carry: 16, move: 16 };
                break;

            case TIER_8:
            case TIER_7: // 2 Work, 20 Carry, 20 Move - Total Cost: 2200
                body = { work: 2, carry: 20, move: 20 };
                break;
        }

        // Generate creep body based on body array and options
        return SpawnApi.getCreepBody(body, opts);
    }

    /**
     * Generate options for harvester creep
     * @param roomState the room state of the room
     */
    public static generateHarvesterOptions(roomState: RoomStateConstant): CreepOptionsCiv | undefined {
        let creepOptions: CreepOptionsCiv = this.getDefaultCreepOptionsCiv();

        switch (roomState) {
            case ROOM_STATE_INTRO:
                creepOptions = {
                    fillSpawn: true,
                    getDroppedEnergy: true
                };
                break;

            case ROOM_STATE_BEGINNER:
                creepOptions = {
                    // Options marked with // are overriding the defaults
                    build: true, //
                    upgrade: true, //
                    fillSpawn: true, //
                    getDroppedEnergy: true //
                };

                break;

            case ROOM_STATE_INTER:
                creepOptions = {
                    // Options marked with // are overriding the defaults
                    build: true, //
                    upgrade: true, //
                    repair: true, //
                    fillSpawn: true, //
                    getFromContainer: true, //
                    getDroppedEnergy: true //
                };

                break;

            case ROOM_STATE_ADVANCED:
                creepOptions = {
                    // Options marked with // are overriding the defaults
                    fillStorage: true, //
                    fillSpawn: true, //
                    getFromStorage: true, //
                    getFromContainer: true, //
                    getDroppedEnergy: true, //
                    getFromTerminal: true //
                };

                break;

            case ROOM_STATE_UPGRADER:
            case ROOM_STATE_STIMULATE:
            case ROOM_STATE_NUKE_INBOUND:
                creepOptions = {
                    // Options marked with // are overriding the defaults
                    repair: true, //
                    fillStorage: true, //
                    fillSpawn: true,
                    getFromStorage: true, //
                    getDroppedEnergy: true, //
                    getFromTerminal: true //
                };

                break;
        }

        return creepOptions;
    }

    /**
     * Generate body for worker creep
     * @param tier the tier of the room
     */
    public static generateWorkerBody(tier: TierConstant): BodyPartConstant[] {
        // Default Values for Worker
        let body: CreepBodyDescriptor = { work: 1, carry: 2, move: 2 };
        const opts: CreepBodyOptions = { mixType: GROUPED };

        switch (tier) {
            case TIER_1: // 1 Work, 2 Carry, 2 Move - Total Cost: 300
                body = { work: 1, carry: 2, move: 2 };
                break;

            case TIER_2: // 2 Work, 4 Carry, 3 Move - Total Cost: 550
                body = { work: 2, carry: 4, move: 3 };
                break;

            case TIER_3: // 4 Work, 4 Carry, 4 Move - Total Cost: 800
                body = { work: 4, carry: 4, move: 4 };
                break;

            case TIER_6:
            case TIER_5:
            case TIER_4: // 8 Work, 4 Carry, 6 Move - Total Cost: 1300
                body = { work: 8, carry: 4, move: 6 };
                break;

            case TIER_8:
            case TIER_7:
                // 10 Work, 8 Carry, 8 Move - Total Cost: 1800
                body = { work: 10, carry: 8, move: 8 };
                break;
        }

        // Generate creep body based on body array and options
        return SpawnApi.getCreepBody(body, opts);
    }

    /**
     * Generate options for worker creep
     * @param roomState the room state of the room
     */
    public static generateWorkerOptions(roomState: RoomStateConstant): CreepOptionsCiv | undefined {
        let creepOptions: CreepOptionsCiv = this.getDefaultCreepOptionsCiv();

        switch (roomState) {
            case ROOM_STATE_INTRO:
            case ROOM_STATE_BEGINNER:
                creepOptions = {
                    // Options marked with // are overriding the defaults
                    build: true, //
                    upgrade: true, //
                    repair: true, //
                    wallRepair: true, //
                    fillTower: true, //
                    getDroppedEnergy: true //
                };

                break;

            case ROOM_STATE_INTER:
                creepOptions = {
                    // Options marked with // are overriding the defaults
                    build: true, //
                    upgrade: true, //
                    repair: true, //
                    wallRepair: true, //
                    fillTower: true, //
                    getFromContainer: true, //
                    getDroppedEnergy: true //
                };

                break;

            case ROOM_STATE_ADVANCED:
                creepOptions = {
                    // Options marked with // are overriding the defaults
                    build: true, //
                    upgrade: true, //
                    repair: true, //
                    wallRepair: true, //
                    fillTower: true, //
                    getFromStorage: true, //
                    getDroppedEnergy: true, //
                    getFromTerminal: true //
                };

                break;

            case ROOM_STATE_UPGRADER:
            case ROOM_STATE_STIMULATE:
            case ROOM_STATE_NUKE_INBOUND:
                creepOptions = {
                    // Options marked with // are overriding the defaults
                    build: true, //
                    upgrade: true, //
                    repair: true, //
                    wallRepair: true, //
                    fillTower: true, //
                    fillStorage: true, //
                    fillLink: true, //
                    getFromStorage: true, //
                    getDroppedEnergy: true, //
                    getFromTerminal: true //
                };

                break;
        }

        return creepOptions;
    }

    /**
     * Generate body for lorry creep
     * @param tier the tier of the room
     */
    public static generateLorryBody(tier: TierConstant): BodyPartConstant[] {
        // Default Values for Lorry
        let body: CreepBodyDescriptor = { carry: 3, move: 3 };
        const opts: CreepBodyOptions = { mixType: GROUPED };

        // There are currently no plans to use lorry before terminal becomes available
        switch (tier) {
            case TIER_1: // 3 Carry, 3 Move - Total Cost: 300
                body = { carry: 3, move: 3 };
                break;

            case TIER_2: // 6 Carry, 5 Move - Total Cost: 550
                body = { carry: 6, move: 5 };
                break;

            case TIER_3: // 8 Carry, 8 Move - Total Cost: 800
                body = { carry: 8, move: 8 };
                break;

            case TIER_5:
            case TIER_4: // 10 Carry, 10 Move - Total Cost: 1000
                body = { carry: 10, move: 10 };
                break;

            case TIER_8:
            case TIER_7:
            case TIER_6: // 20 Carry, 20 Move - Total Cost: 2000
                body = { carry: 20, move: 20 };
                break;
        }

        // Generate creep body based on body array and options
        return SpawnApi.getCreepBody(body, opts);
    }

    /**
     * Generate options for lorry creep
     * @param roomState the room state of the room
     */
    public static generateLorryOptions(roomState: RoomStateConstant): CreepOptionsCiv | undefined {
        let creepOptions: CreepOptionsCiv = this.getDefaultCreepOptionsCiv();

        switch (roomState) {
            case ROOM_STATE_INTRO:
            case ROOM_STATE_BEGINNER:
            case ROOM_STATE_INTER:
            case ROOM_STATE_ADVANCED:
            case ROOM_STATE_STIMULATE:
            case ROOM_STATE_UPGRADER:
            case ROOM_STATE_NUKE_INBOUND:
                creepOptions = {
                    fillTower: true, //
                    fillStorage: true, //
                    fillContainer: true, //
                    fillLink: true, //
                    fillTerminal: true, //
                    fillLab: true, //
                    getFromStorage: true, //
                    getFromContainer: true, //
                    getDroppedEnergy: true, //
                    getFromTerminal: true //
                };

                break;
        }

        return creepOptions;
    }

    /**
     * Generate body for power upgrader creep
     * @param tier the tier of the room
     */
    public static generatePowerUpgraderBody(tier: TierConstant): BodyPartConstant[] {
        // Default Values for Power Upgrader
        let body: CreepBodyDescriptor = { work: 18, carry: 8, move: 4 };
        const opts: CreepBodyOptions = { mixType: GROUPED };

        // There are currently no plans to use power upgraders before links become available
        // Need to experiment with work parts here and find out whats keeps up with the links
        // Without over draining the storage, but still puts up numbers
        switch (tier) {
            case TIER_6: // 15 Work, 1 Carry, 1 Move - Total Cost: 2300
                body = { work: 18, carry: 8, move: 4 };
                break;

            case TIER_7: // 1 Work, 8 Carry, 4 Move - Total Cost: 2800
                body = { work: 22, carry: 8, move: 4 };
                break;

            case TIER_8: // 1 Work, 8 Carry, 4 Move - Total Cost: 2100
                body = { work: 15, carry: 8, move: 4 }; // RCL 8 you can only do 15 per tick
                break;
        }

        // Generate creep body based on body array and options
        return SpawnApi.getCreepBody(body, opts);
    }

    /**
     * Generate options for power upgrader creep
     * @param roomState the room state of the room
     */
    public static generatePowerUpgraderOptions(roomState: RoomStateConstant): CreepOptionsCiv | undefined {
        let creepOptions: CreepOptionsCiv = this.getDefaultCreepOptionsCiv();

        switch (roomState) {
            case ROOM_STATE_UPGRADER:
            case ROOM_STATE_STIMULATE:
            case ROOM_STATE_NUKE_INBOUND:
                creepOptions = {
                    upgrade: true, //
                    getFromLink: true //
                };

                break;
        }

        return creepOptions;
    }
    // ------------

    // Remote -----
    // No need to start building these guys until tier 4, but allow them at tier 3 in case our strategy changes
    /**
     * Generate body for remote miner creep
     * @param tier the tier of the room
     */
    public static generateRemoteMinerBody(tier: TierConstant): BodyPartConstant[] {
        // Default Values for Remote Miner
        let body: CreepBodyDescriptor = { work: 6, carry: 1, move: 3 };
        const opts: CreepBodyOptions = { mixType: GROUPED };

        // Cap the remote miner at 6 work parts (6 so they finish mining early and can build/repair their container)
        switch (tier) {
            case TIER_3: // 5 Work, 3 Move - Total Cost: 650
                body = { work: 5, move: 3 };
                break;

            case TIER_8:
            case TIER_7:
            case TIER_6:
            case TIER_5:
            case TIER_4: // 5 Work, 5 Move - Total Cost: 850
                body = { work: 5, move: 5 };
                break;
        }

        // Generate creep body based on body array and options
        return SpawnApi.getCreepBody(body, opts);
    }

    /**
     * Generate options for remote miner creep
     * @param roomState the room state of the room
     */
    public static generateRemoteMinerOptions(roomState: RoomStateConstant): CreepOptionsCiv | undefined {
        let creepOptions: CreepOptionsCiv = this.getDefaultCreepOptionsCiv();

        switch (roomState) {
            case ROOM_STATE_INTRO:
            case ROOM_STATE_BEGINNER:
            case ROOM_STATE_INTER:
            case ROOM_STATE_ADVANCED:
            case ROOM_STATE_NUKE_INBOUND:
            case ROOM_STATE_UPGRADER:
            case ROOM_STATE_STIMULATE:
                creepOptions = {
                    harvestSources: true,
                    build: true, //
                    repair: true, //
                    fillContainer: true //
                };

                break;
        }

        return creepOptions;
    }

    /**
     * Generate body for remote harvester creep
     * @param tier the tier of the room
     */
    public static generateRemoteHarvesterBody(tier: TierConstant): BodyPartConstant[] {
        // Default Values for Remote Harvester
        let body: CreepBodyDescriptor = { carry: 8, move: 8 };
        const opts: CreepBodyOptions = { mixType: COLLATED };

        switch (tier) {
            case TIER_3: // Total Cost: 800
                body = { work: 2, carry: 5, move: 7 };
                break;

            case TIER_4: // Total Cost: 1000
                body = { work: 2, carry: 7, move: 9 };
                break;

            case TIER_5: // Total Cost: 1600
                body = { work: 2, carry: 13, move: 15 };
                break;

            case TIER_8:
            case TIER_7:
            case TIER_6: // 20 Carry, 20 Move - Total Cost: 2000
                body = { work: 2, carry: 17, move: 19 };
                break;
        }

        // Generate creep body based on body array and options
        return SpawnApi.getCreepBody(body, opts);
    }

    /**
     * Generate options for remote harvester creep
     * @param roomState the room state of the room
     */
    public static generateRemoteHarvesterOptions(roomState: RoomStateConstant): CreepOptionsCiv | undefined {
        let creepOptions: CreepOptionsCiv = this.getDefaultCreepOptionsCiv();

        switch (roomState) {
            case ROOM_STATE_INTRO:
            case ROOM_STATE_BEGINNER:
            case ROOM_STATE_INTER:
            case ROOM_STATE_ADVANCED:
            case ROOM_STATE_UPGRADER:
            case ROOM_STATE_STIMULATE:
            case ROOM_STATE_NUKE_INBOUND:
                creepOptions = {
                    build: true, //
                    repair: true, //
                    wallRepair: true, //
                    fillTower: true, //
                    getFromContainer: true, //
                    getDroppedEnergy: true, //
                    fillStorage: true,
                    fillTerminal: true,
                    fillLink: true
                };

                break;
        }

        return creepOptions;
    }

    /**
     * Generate body for remote reserver creep
     * @param tier the tier of the room
     */
    public static generateRemoteReserverBody(tier: TierConstant): BodyPartConstant[] {
        // Default Values for Remote Reserver
        let body: CreepBodyDescriptor = { claim: 2, move: 2 };
        const opts: CreepBodyOptions = { mixType: GROUPED };

        switch (tier) {
            case TIER_8:
            case TIER_7:
            case TIER_6:
            case TIER_5:
            case TIER_4: // 2 Claim, 2 Move - Total Cost: 800
                body = { claim: 2, move: 2 };
                break;
        }

        // Generate creep body based on body array and options
        return SpawnApi.getCreepBody(body, opts);
    }

    /**
     * Generate options for remote reserver creep
     * @param roomState the room state of the room
     */
    public static generateRemoteReserverOptions(roomState: RoomStateConstant): CreepOptionsCiv | undefined {
        let creepOptions: CreepOptionsCiv = this.getDefaultCreepOptionsCiv();

        switch (roomState) {
            case ROOM_STATE_INTRO:
            case ROOM_STATE_BEGINNER:
            case ROOM_STATE_INTER:
            case ROOM_STATE_ADVANCED:
            case ROOM_STATE_STIMULATE:
            case ROOM_STATE_UPGRADER:
            case ROOM_STATE_NUKE_INBOUND:
                // Remote reservers don't really have options perse, so just leave as defaults
                creepOptions = {
                    claim: true
                };

                break;
        }

        return creepOptions;
    }

    /**
     * Generate body for remote colonizer creep
     * @param tier the tier of the room
     */
    public static generateRemoteColonizerBody(tier: TierConstant): BodyPartConstant[] {
        // Default Values for Remote Colonizer
        let body: CreepBodyDescriptor = { work: 7, carry: 5, move: 6 };
        const opts: CreepBodyOptions = { mixType: GROUPED };

        switch (tier) {
            case TIER_4: // 7 Work, 5 Carry, 5 Move - Total Cost: 1300
                body = { work: 7, carry: 5, move: 6 };
                break;

            case TIER_5: // 9 Work, 8 Carry, 10 Move - Total Cost: 1800
                body = { work: 9, carry: 8, move: 10 };
                break;

            case TIER_8:
            case TIER_7:
            case TIER_6: // 12 Work, 10 Carry, 10 Move - Total Cost: 2300
                body = { work: 12, carry: 10, move: 12 };
                break;
        }

        // Generate creep body based on body array and options
        return SpawnApi.getCreepBody(body, opts);
    }

    /**
     * Generate options for remote colonizer creep
     * @param tier the tier of the room
     */
    public static generateRemoteColonizerOptions(roomState: RoomStateConstant): CreepOptionsCiv | undefined {
        let creepOptions: CreepOptionsCiv = this.getDefaultCreepOptionsCiv();

        switch (roomState) {
            case ROOM_STATE_INTRO:
            case ROOM_STATE_BEGINNER:
            case ROOM_STATE_INTER:
            case ROOM_STATE_ADVANCED:
            case ROOM_STATE_STIMULATE:
            case ROOM_STATE_UPGRADER:
            case ROOM_STATE_NUKE_INBOUND:
                creepOptions = {
                    build: true, //
                    upgrade: true, //
                    repair: true, //
                    harvestSources: true,
                    wallRepair: true, //
                    getFromContainer: true, //
                    getDroppedEnergy: true //
                };

                break;
        }

        return creepOptions;
    }

    /**
     * Generate body for claimer creep
     * @param roomState the room state for the room
     */
    public static generateClaimerOptions(roomState: RoomStateConstant): CreepOptionsCiv | undefined {
        let creepOptions: CreepOptionsCiv = this.getDefaultCreepOptionsCiv();

        switch (roomState) {
            case ROOM_STATE_INTRO:
            case ROOM_STATE_BEGINNER:
            case ROOM_STATE_INTER:
            case ROOM_STATE_ADVANCED:
            case ROOM_STATE_STIMULATE:
            case ROOM_STATE_UPGRADER:
            case ROOM_STATE_NUKE_INBOUND:
                creepOptions = {};

                break;
        }

        return creepOptions;
    }

    /**
     * Generate options for claimer creep
     * @param tier the tier of the room
     */
    public static generateClaimerBody(tier: TierConstant): BodyPartConstant[] {
        // Default Values for Claimer
        let body: CreepBodyDescriptor = { claim: 1, move: 2 };
        const opts: CreepBodyOptions = { mixType: GROUPED };

        switch (tier) {
            case TIER_8:
            case TIER_7:
            case TIER_6:
            case TIER_5:
            case TIER_4:
            case TIER_3:
            case TIER_2: // 1 Claim, 2 Move, Total Cost: 400
                body = { claim: 1, move: 2 };
                break;
        }

        // Generate creep body based on body array and options
        return SpawnApi.getCreepBody(body, opts);
    }

    /**
     * Generate body for remote defender creep
     * @param tier the tier of the room
     */
    public static generateRemoteDefenderBody(tier: TierConstant): BodyPartConstant[] {
        // Default Values for Remote Defender
        let body: CreepBodyDescriptor = { attack: 5, move: 5 };
        const opts: CreepBodyOptions = { mixType: GROUPED };

        switch (tier) {
            case TIER_3: // 5 Attack, 5 Move - Total Cost: 550
                body = { attack: 5, move: 5 };
                break;

            case TIER_4: //  6 Ranged Attack, 6 Move, - Total Cost: 1200
                body = { ranged_attack: 6, move: 6 };
                break;

            case TIER_5: // 8 Ranged Attack, 7 Move, 1 Heal - Total Cost: 1800
                body = { ranged_attack: 8, move: 7, heal: 1 };
                break;

            case TIER_8:
            case TIER_7:
            case TIER_6: // 8 Ranged Attack, 10 Move, 2 Heal
                body = { ranged_attack: 8, move: 10, heal: 2 };
                break;
        }

        // Generate creep body based on body array and options
        return SpawnApi.getCreepBody(body, opts);
    }

    /**
     * Generate options for remote defender creep
     * @param tier the tier of the room
     */
    public static generateRemoteDefenderOptions(roomState: RoomStateConstant): CreepOptionsMili | undefined {
        let creepOptions: CreepOptionsMili = this.getDefaultCreepOptionsMili();

        switch (roomState) {
            case ROOM_STATE_INTRO:
            case ROOM_STATE_BEGINNER:
            case ROOM_STATE_INTER:
            case ROOM_STATE_ADVANCED:
            case ROOM_STATE_STIMULATE:
            case ROOM_STATE_UPGRADER:
            case ROOM_STATE_NUKE_INBOUND:
                creepOptions = {
                    squadSize: 1,
                    squadUUID: null,
                    rallyLocation: null,
                    rallyDone: false,
                    healer: true,
                    defender: true
                };

                break;
        }

        return creepOptions;
    }
    // ----------

    // Military -----
    /**
     * Generate body for zealot creep
     * @param tier the tier of the room
     */
    public static generateZealotBody(tier: TierConstant): BodyPartConstant[] {
        // Default Values for Zealot
        let body: CreepBodyDescriptor = { work: 0, move: 0 };
        const opts: CreepBodyOptions = { mixType: GROUPED };

        switch (tier) {
            // case TIER_6: // this is just for quick and dirty purposes, i don't reccomend using it, but replace tier with your current tier and make a custom attack zealot
            //     body = { attack: 1, move: 10, tough: 39 };
            //     break;
            case TIER_1: // 2 Attack, 2 Move - Total Cost: 260
                body = { attack: 2, move: 2 };
                break;

            case TIER_2: // 3 Attack, 3 Move  - Total Cost: 390
                body = { attack: 3, move: 3 };
                break;

            case TIER_3: // 5 Attack, 5 Move - Total Cost: 650
                body = { attack: 5, move: 5 };
                break;

            case TIER_4: // 10 Attack, 10 Move - Total Cost: 1300
                body = { attack: 2, move: 2 };
                break;

            case TIER_5: // 15 Attack, 12 Move - Total Cost: 1800
                body = { attack: 15, move: 12 };
                break;

            case TIER_8:
            case TIER_7:
            case TIER_6: // 20 Attack, 14 Move - Total Cost: 2300
                body = { attack: 20, move: 14 };
                break;
        }

        // ! Important DONT FORGET TO CHANGE
        // Temp override
        body = { attack: 1, move: 1 };
        // Generate creep body based on body array and options
        return SpawnApi.getCreepBody(body, opts);
    }

    /**
     * Generate options for zealot creep
     * @param roomState the room state of the room
     * @param squadSizeParam the size of the squad associated with the zealot
     * @param squadUUIDParam the squad id that the zealot is a member of
     * @param rallyLocationParam the meeting place for the squad
     */
    public static generateZealotOptions(
        roomState: RoomStateConstant,
        squadSizeParam: number,
        squadUUIDParam: number | null,
        rallyLocationParam: RoomPosition | null
    ): CreepOptionsMili | undefined {
        let creepOptions: CreepOptionsMili = this.getDefaultCreepOptionsMili();

        switch (roomState) {
            case ROOM_STATE_INTRO:
            case ROOM_STATE_BEGINNER:
            case ROOM_STATE_INTER:
            case ROOM_STATE_ADVANCED:
            case ROOM_STATE_STIMULATE:
            case ROOM_STATE_UPGRADER:
            case ROOM_STATE_NUKE_INBOUND:
                creepOptions = {
                    squadSize: squadSizeParam,
                    squadUUID: squadUUIDParam,
                    rallyLocation: rallyLocationParam,
                    rallyDone: false,
                    attacker: true
                };

                break;
        }

        return creepOptions;
    }

    /**
     * Generate body for medic creep
     * @param tier the tier of the room
     */
    public static generateMedicBody(tier: TierConstant): BodyPartConstant[] {
        // Default Values for Medic
        let body: CreepBodyDescriptor = { heal: 1, move: 1 };
        const opts: CreepBodyOptions = { mixType: GROUPED };

        switch (tier) {
            case TIER_1: // 1 Heal, 1 Move - Total Cost: 300
                body = { heal: 1, move: 1 };
                break;

            case TIER_2: // 2 Heal, 1 Move - Total Cost: 550
                body = { heal: 2, move: 1 };
                break;

            case TIER_3: // 2 Heal, 2 Move - Total Cost: 600
                body = { heal: 2, move: 2 };
                break;

            case TIER_4: // 4 Heal, 4 Move - Total Cost: 1200
                body = { heal: 4, move: 4 };
                break;

            case TIER_5: // 6 Heal, 6 Move - Total Cost: 1800
                body = { heal: 6, move: 6 };
                break;

            case TIER_8:
            case TIER_7:
            case TIER_6: // 8 Heal, 6 Move - Total Cost: 2300
                body = { heal: 8, move: 6 };
                break;
        }

        // ! Important DONT FORGET TO CHANGE
        // Temp override
        body = { heal: 1, move: 1 };
        // Generate creep body based on body array and options
        return SpawnApi.getCreepBody(body, opts);
    }

    /**
     * Generate options for medic creep
     * @param tier the tier of the room
     */
    public static generateMedicOptions(
        roomState: RoomStateConstant,
        squadSizeParam: number,
        squadUUIDParam: number | null,
        rallyLocationParam: RoomPosition | null
    ): CreepOptionsMili | undefined {
        let creepOptions: CreepOptionsMili = this.getDefaultCreepOptionsMili();

        switch (roomState) {
            case ROOM_STATE_INTRO:
            case ROOM_STATE_BEGINNER:
            case ROOM_STATE_INTER:
            case ROOM_STATE_ADVANCED:
            case ROOM_STATE_STIMULATE:
            case ROOM_STATE_UPGRADER:
            case ROOM_STATE_NUKE_INBOUND:
                creepOptions = {
                    squadSize: squadSizeParam,
                    squadUUID: squadUUIDParam,
                    rallyLocation: rallyLocationParam,
                    rallyDone: false,
                    healer: true,
                    flee: true
                };

                break;
        }

        return creepOptions;
    }

    /**
     * Generate body for stalker creep
     * @param tier the tier of the room
     */
    public static generateStalkerBody(tier: TierConstant): BodyPartConstant[] {
        // Default Values for Stalker
        let body: CreepBodyDescriptor = { ranged_attack: 1, move: 1 };
        const opts: CreepBodyOptions = { mixType: GROUPED };

        switch (tier) {
            case TIER_1: // 1 Ranged Attack, 2 Move - Total Cost: 200
                body = { ranged_attack: 1, move: 1 };
                break;

            case TIER_2: // 3 Ranged Attack, 2 Move - Total Cost: 550
                body = { ranged_attack: 3, move: 2 };
                break;

            case TIER_3: // 4 Ranged Attack, 4 Move - Total Cost: 800
                body = { ranged_attack: 4, move: 4 };
                break;

            case TIER_4: // 6 Ranged Attack, 6 Move - Total Cost: 1200
                body = { ranged_attack: 6, move: 6 };
                break;

            case TIER_5: // 8 Ranged Attack, 8 Move - Total Cost: 1600
                body = { ranged_attack: 8, move: 8 };
                break;

            case TIER_8:
            case TIER_7:
            case TIER_6 || TIER_7 || TIER_8: // 12 Ranged Attack, 10 Move - Total Cost: 2300
                body = { ranged_attack: 12, move: 10 };
                break;
        }

        // ! Important DONT FORGET TO CHANGE
        // Temp override
        body = { ranged_attack: 1, move: 1 };
        // Generate creep body based on body array and options
        return SpawnApi.getCreepBody(body, opts);
    }

    /**
     * Generate options for stalker creep
     * @param roomState the room state of the room
     * @param squadSizeParam the size of the squad associated with the zealot
     * @param squadUUIDParam the squad id that the zealot is a member of
     * @param rallyLocationParam the meeting place for the squad
     */
    public static generateStalkerOptions(
        roomState: RoomStateConstant,
        squadSizeParam: number,
        squadUUIDParam: number | null,
        rallyLocationParam: RoomPosition | null
    ): CreepOptionsMili | undefined {
        let creepOptions: CreepOptionsMili = this.getDefaultCreepOptionsMili();

        switch (roomState) {
            case ROOM_STATE_INTRO:
            case ROOM_STATE_BEGINNER:
            case ROOM_STATE_INTER:
            case ROOM_STATE_ADVANCED:
            case ROOM_STATE_STIMULATE:
            case ROOM_STATE_UPGRADER:
            case ROOM_STATE_NUKE_INBOUND:
                creepOptions = {
                    squadSize: squadSizeParam,
                    squadUUID: squadUUIDParam,
                    rallyLocation: rallyLocationParam,
                    rallyDone: false
                };

                break;
        }

        return creepOptions;
    }

    /**
     * generate body for domestic defender creep
     * @param tier the tier of the room
     */
    public static generateDomesticDefenderBody(tier: TierConstant): BodyPartConstant[] {
        // Default Values for Stalker
        let body: CreepBodyDescriptor = { attack: 2, move: 2 };
        const opts: CreepBodyOptions = { mixType: GROUPED };

        switch (tier) {
            case TIER_1: // 2 Attack, 2 Move - Total Cost: 260
                body = { attack: 2, move: 2 };
                break;

            case TIER_2: // 3 Attack, 2 Move - Total Cost: 340
                body = { attack: 3, move: 2 };
                break;

            case TIER_3: // 5 Attack, 5 Move - Total Cost: 650
                body = { attack: 5, move: 5 };
                break;

            case TIER_4: // 8 Attack, 8 Move - Total Cost: 880
                body = { attack: 8, move: 8 };
                break;

            case TIER_5: // 10 Attack, 10 Move - Total Cost: 1300
                body = { attack: 10, move: 10 };
                break;

            case TIER_8:
            case TIER_7:
            case TIER_6: // 15 Attack, 15 Move - Total Cost: 1950
                body = { attack: 15, move: 15 };
                break;
        }

        // Generate creep body based on body array and options
        return SpawnApi.getCreepBody(body, opts);
    }

    /**
     * generate options for domestic defender creep
     * @param roomState the room state for the room spawning it
     */
    public static generateDomesticDefenderOptions(roomState: RoomStateConstant): CreepOptionsMili | undefined {
        let creepOptions: CreepOptionsMili = this.getDefaultCreepOptionsMili();

        switch (roomState) {
            case ROOM_STATE_INTRO:
            case ROOM_STATE_BEGINNER:
            case ROOM_STATE_INTER:
            case ROOM_STATE_ADVANCED:
            case ROOM_STATE_STIMULATE:
            case ROOM_STATE_UPGRADER:
            case ROOM_STATE_NUKE_INBOUND:
                creepOptions = {
                    squadSize: 0,
                    squadUUID: null,
                    rallyLocation: null,
                    defender: true
                };

                break;
        }

        return creepOptions;
    }
    // --------------

    /**
     * returns a set of creep options with all default values
     */
    public static getDefaultCreepOptionsCiv(): CreepOptionsCiv {
        return {};
    }

    /**
     * returns set of mili creep options with all default values
     */
    public static getDefaultCreepOptionsMili(): CreepOptionsMili {
        return {
            squadSize: 0
        };
    }

    /**
     * generates a creep memory to give to a creep being spawned
     */
    public static generateDefaultCreepMemory(
        roleConst: RoleConstant,
        homeRoomNameParam: string,
        targetRoomParam: string,
        creepOptions: CreepOptionsCiv | CreepOptionsMili
    ): CreepMemory {
        return {
            role: roleConst,
            homeRoom: homeRoomNameParam,
            targetRoom: targetRoomParam,
            job: undefined,
            options: creepOptions,
            working: false
        };
    }

    /**
     * get number of active squad members for a given squad
     * @param flagMemory the attack flag memory
     * @param room the room they are coming from
     */
    public static getNumOfActiveSquadMembers(flagMemory: AttackFlagMemory, room: Room): number {
        // Please improve this if possible lol. Had to get around type guards as we don't actually know what a creeps memory has in it unless we explicitly know the type i think
        // We're going to run into this everytime we use creep memory so we need to find a nicer way around it if possible but if not casting it as a memory type
        // Isn't the worst solution in the world
        const militaryCreeps: Array<Creep | null> = MemoryApi.getMyCreeps(room.name, creep =>
            this.isMilitaryRole(creep.memory.role)
        );
        return _.filter(militaryCreeps, creep => {
            const creepOptions = creep!.memory.options as CreepOptionsMili;
            return creepOptions.squadUUID === flagMemory.squadUUID;
        }).length;
    }

    /**
     * get if the creep is a military type creep or not
     * @param roleConst the role of the creep
     */
    public static isMilitaryRole(roleConst: RoleConstant): boolean {
        for (const role in ALL_MILITARY_ROLES) {
            if (roleConst === ALL_MILITARY_ROLES[role]) {
                return true;
            }
        }
        return false;
    }

    /**
     * gets the ClaimRoomMemory with lowest number creeps of the specified role with it as their target room
     * Must also be less than the max amount of that role allowed for the room
     * @param room the room spawning the creep
     * @param roleConst the specified role we are checking for
     * @param creepBody the body of the creep we are checking, so we know who to exclude from creep count
     */
    public static getLowestNumRoleAssignedClaimRoom(
        room: Room,
        roleConst: RoleConstant,
        creepBody: BodyPartConstant[]
    ): ClaimRoomMemory | undefined {
        const allClaimRooms: Array<ClaimRoomMemory | undefined> = MemoryApi.getClaimRooms(room);
        const tickLimit: number = creepBody.length * 3;
        // Get all claim rooms in which the specified role does not yet have
        const unfulfilledClaimRooms: Array<ClaimRoomMemory | undefined> = _.filter(
            allClaimRooms,
            claimRoom =>
                this.getNumCreepAssignedAsTargetRoom(room, roleConst, claimRoom, tickLimit) <
                this.getLimitPerClaimRoomForRole(roleConst)
        );

        let nextClaimRoom: ClaimRoomMemory | undefined;

        // Find the unfulfilled with the lowest amount of creeps assigned to it
        for (const claimRoom of unfulfilledClaimRooms) {
            if (!nextClaimRoom) {
                nextClaimRoom = claimRoom;
                continue;
            }

            const lowestCreepsAssigned = this.getNumCreepAssignedAsTargetRoom(
                room,
                roleConst,
                nextClaimRoom,
                tickLimit
            );
            const currentCreepsAssigned = this.getNumCreepAssignedAsTargetRoom(room, roleConst, claimRoom, tickLimit);

            if (currentCreepsAssigned < lowestCreepsAssigned) {
                nextClaimRoom = claimRoom;
            }
        }

        return nextClaimRoom;
    }

    /**
     * gets the RemoteRoomMemory with lowest number creeps of the specified role with it as their target room
     * @param room the room spawning the creep
     * @param roleConst the specified role we are checking for
     * @param creepBody the creep body so we know what creeps to exclude from rolecall
     */
    public static getLowestNumRoleAssignedRemoteRoom(
        room: Room,
        roleConst: RoleConstant,
        creepBody: BodyPartConstant[]
    ): RemoteRoomMemory | undefined {
        const allRemoteRooms: Array<RemoteRoomMemory | undefined> = MemoryApi.getRemoteRooms(room);
        const tickLimit = creepBody.length * 3;
        // Get all claim rooms in which the specified role does not yet have
        const unfulfilledRemoteRooms: Array<RemoteRoomMemory | undefined> = _.filter(
            allRemoteRooms,
            remoteRoom =>
                this.getNumCreepAssignedAsTargetRoom(room, roleConst, remoteRoom, tickLimit) <
                this.getLimitPerRemoteRoomForRolePerSource(roleConst, remoteRoom!.sources.data)
        );

        let nextRemoteRoom: RemoteRoomMemory | undefined;

        // Find the unfulfilled with the lowest amount of creeps assigned to it
        for (const remoteRoom of unfulfilledRemoteRooms) {
            if (remoteRoom && !nextRemoteRoom) {
                nextRemoteRoom = remoteRoom;
                continue;
            }

            const lowestCreepsAssigned = this.getNumCreepAssignedAsTargetRoom(
                room,
                roleConst,
                nextRemoteRoom,
                tickLimit
            );
            const currentCreepsAssigned = this.getNumCreepAssignedAsTargetRoom(room, roleConst, remoteRoom, tickLimit);

            if (currentCreepsAssigned < lowestCreepsAssigned) {
                nextRemoteRoom = remoteRoom;
            }
        }

        return nextRemoteRoom;
    }

    /**
     * gets the AttackRoomMemory with active flags
     * only one attack flag will be active at a time during any given tick
     * if this is not true because of some error/oversight, it is self correcting since
     * this will still only choose the first active flag it finds
     * @param room the room spawning the creep
     */
    public static getAttackRoomWithActiveFlag(room: Room): AttackRoomMemory | undefined {
        const allAttackRooms: Array<AttackRoomMemory | undefined> = MemoryApi.getAttackRooms(room);

        // Return the first active flag we find (should only be 1 flag active at a time across all attack rooms)
        return _.find(allAttackRooms, attackRoom => _.some(attackRoom!.flags, (flag: AttackFlagMemory) => flag.active));
    }

    /**
     * get number of creeps of role with target room assigned to a specified room
     * @param room the room spawning the creep
     * @param roleConst the role of the creep
     * @param roomMemory the room memory we are checking
     * @param ticksToLiveLimit the limit in ticks that the new creep will be spawned in the old creeps place
     */
    public static getNumCreepAssignedAsTargetRoom(
        room: Room,
        roleConst: RoleConstant,
        roomMemory: ClaimRoomMemory | AttackRoomMemory | RemoteRoomMemory | undefined,
        ticksToLiveLimit: number
    ): number {
        // Get all creeps above the ticks to live limit with the specified role
        const allCreepsOfRole: Array<Creep | null> = MemoryApi.getMyCreeps(
            room.name,
            creep =>
                creep.memory.role === roleConst && (creep.ticksToLive ? creep.ticksToLive : 1600) > ticksToLiveLimit
            // Find the creep w/ ticks to live higher than the limit (1600 if no ticks to live ie a spawning creep to ensure they're counted)
        );
        let sum = 0;

        for (const creep of allCreepsOfRole) {
            if (creep!.memory.targetRoom === roomMemory!.roomName) {
                ++sum;
            }
        }

        return sum;
    }

    /**
     * gets the number of each claim room creep that is meant to be assigned to a room
     * @param roleConst the role we are checking the limit for
     */
    public static getLimitPerClaimRoomForRole(roleConst: RoleConstant): number {
        let creepNum: number = 0;

        switch (roleConst) {
            case ROLE_CLAIMER || ROLE_COLONIZER:
                creepNum = 1;
                break;
        }

        return creepNum;
    }

    /**
     * gets the number of each remote room creep that is meant to be assigned to a room
     * @param roleConst the role we are checking the limit for
     * @param numSources the number of sources in the remote room
     */
    public static getLimitPerRemoteRoomForRolePerSource(roleConst: RoleConstant, numSources: number): number {
        let creepNum: number = 0;

        switch (roleConst) {
            case ROLE_REMOTE_HARVESTER:
                creepNum = 2 * numSources;
                break;
            case ROLE_REMOTE_MINER:
                creepNum = 1 * numSources;
                break;
        }

        return creepNum;
    }

    /**
     * gets the number of lorries for the room based on room state
     * @param room the room we are doing limits for
     * @param roomState the room state of the room we are checking limit for
     */
    public static getLorryLimitForRoom(room: Room, roomState: RoomStateConstant) {
        // ! Some ideas for finding lorry limits for a room
        // ! Turned in to insane ramblings though
        /*
            Potentially, we could check that the room state is within a certain value range
            like advanced, stimulate, seige, maybe? (same values its changed on anyway, so just extra saftey)
            And we could like check if any empire jobs exist... still not sure the route we're going to take
            to make sure terminals and labs get filled exactly, but we do know that those will create room jobs
            for creeps to follow, we could also have it fill another memory structure and we check that and
            decide how many lorries we need to do this set of jobs, it also has the benifit of slowly going down
            as the job is more and more complete ie if we spawn 1 lorry per 25k energy we want to move to a terminal,
            then as the amount of energy needing to be moved remaining goes down, naturally the number of lorries needed
            will as well.

            I'm having a flash of an idea about empire job queues. Each room can check empire job queues and decide if they
            need to create any jobs in the room, and this function for example will check how many lorries need to exist in the room
            etc, etc, etc. We can see what way we wanna go there, we still are a little bit off from that since we need to finish
            the more pertinant parts of job queues and set up the flag system and make sure the room structures run themselves (thats
                when we actually start running into it, since terminals will presumably check this emprie job queue and decide if it needs
                to sell energy, move to another room)

            It would also be interesting to set up a system to supply each other with energy as needed. Like if you're being seiged and in real trouble
            and you're running dry (lets say they've knocked out a couple of your other rooms too) i could send energy and help keep your
            last room alive... possibly military support to would be really cool (that would be as simple as detecting and auto placing a flag
                in your room and the system will handle itself)

            Even more off-topic, but we make sure creep.attack() and tower.attack() is never called on an ally creep (maybe even override the functions)
            (to ensure extra saftey in the case of abug)
        */
        return 0;
    }

    /**
     * get the number of accesssible tiles for the sources in a room
     * @param room the room we are checking for
     */
    public static getNumAccessTilesToSources(room: Room): number {
        const sources: Source[] = MemoryApi.getSources(room.name);
        let accesssibleTiles: number = 0;
        const roomTerrian: RoomTerrain = new Room.Terrain(room.name);
        _.forEach(sources, (source: Source) => {
            for (let y = source.pos.y - 1; y <= source.pos.y + 1; y++) {
                for (let x = source.pos.x - 1; x <= source.pos.x + 1; x++) {
                    if (source.pos.x === x && source.pos.y === y) {
                        continue;
                    }
                    if (roomTerrian.get(x, y) !== TERRAIN_MASK_WALL) {
                        accesssibleTiles++;
                    }
                }
            }
        });
        return accesssibleTiles;
    }

    /**
     * get the array of roles based on the attack flag type
     * @param attackFlag the flag memory of the active attack flag
     */
    public static getRolesArrayFromAttackFlag(attackFlag: ParentFlagMemory): RoleConstant[] {
        // check the flag type and return the array
        switch (attackFlag.flagType) {
            case ZEALOT_SOLO:
                return ZEALOT_SOLO_ARRAY;

            case STANDARD_SQUAD:
                return STANDARD_SQUAD_ARRAY;

            case STALKER_SOLO:
                return STALKER_SOLO_ARRAY;
        }
        return [];
    }

    /**
     * check if the creep role exists in the room's queue
     * @param room the room we are checking for
     * @param roleConst the role we are checking for
     * @param limit the limit we are checking for
     */
    public static isCreepCountSpawnedAndQueueAtLimit(room: Room, roleConst: RoleConstant, limit: number): boolean {
        const roleArray: RoleConstant[] = room.memory.creepLimit!["militaryLimits"];
        const creepsInRoom: Creep[] = MemoryApi.getMyCreeps(room.name, (c: Creep) => c.memory.role === roleConst);
        let sum = 0;

        // Get all the defenders in queue to be spawned
        for (const role in roleArray) {
            if (roleArray[role] === roleConst) {
                sum++;
            }
        }

        // Get all defenders currently spawned
        sum += creepsInRoom.length;
        return sum >= limit;
    }

    /**
     * spawn the next creep in the military queue for that tier
     * @param tier the priority tier of the military creep we are attempting to spawn
     * @param room the room we are spawning for
     */
    public static spawnMiliQueue(tier: number, room: Room): RoleConstant | null {
        // Look for the correspondings tier's within the military queue for the room, return it if we find one
        const militaryQueue: RoleConstant[] = room.memory.creepLimit!.militaryLimits;
        switch (tier) {
            case 1:
                for (const queueRole in militaryQueue) {
                    for (const tierRole of TIER_1_MILITARY_PRIORITY) {
                        if (militaryQueue[queueRole] === tierRole) {
                            return militaryQueue[queueRole];
                        }
                    }
                }
                return null;
            case 2:
                for (const queueRole in militaryQueue) {
                    for (const tierRole of TIER_2_MILITARY_PRIORITY) {
                        if (militaryQueue[queueRole] === tierRole) {
                            return militaryQueue[queueRole];
                        }
                    }
                }
                return null;
            case 3:
                for (const queueRole in militaryQueue) {
                    for (const tierRole of TIER_3_MILITARY_PRIORITY) {
                        if (militaryQueue[queueRole] === tierRole) {
                            return militaryQueue[queueRole];
                        }
                    }
                }
                return null;
            default:
                throw new UserException("Invalid tier number", "spawnHelper/spawnMiliQueue", ERROR_WARN);
        }
    }

    /**
     * get the number of remote rooms that need a reserver
     * @param room the room we are checking the remote rooms for
     */
    public static getRemoteReserverLimitForRoom(room: Room): number {
        const remoteRooms: Array<RemoteRoomMemory | undefined> = MemoryApi.getRemoteRooms(room);
        let numReserversNeeded: number = 0;
        for (const remoteRoom of remoteRooms) {
            // Handle undefined rooms
            if (!remoteRoom) {
                continue;
            }

            // If the TTL is below the limit set in config, we need a reserver
            if (remoteRoom.reserveTTL <= RESERVER_MIN_TTL) {
                numReserversNeeded++;
            }
        }

        return numReserversNeeded;
    }

    /**
     * get a remote room that needs a remote reserver
     */
    public static getRemoteRoomNeedingRemoteReserver(room: Room): RemoteRoomMemory | undefined {
        return _.first(MemoryApi.getRemoteRooms(room, (rr: RemoteRoomMemory) => rr.reserveTTL < RESERVER_MIN_TTL));
    }

    /**
     * get a remote room that needs a remote reserver
     */
    public static getRemoteRoomNeedingRemoteDefender(room: Room): RemoteRoomMemory | undefined {
        return _.first(
            MemoryApi.getRemoteRooms(room, (rr: RemoteRoomMemory) => {
                if (Memory.rooms[rr.roomName]) {
                    return Memory.rooms[rr.roomName].defcon > 0;
                }
                return false;
            })
        );
    }
}
