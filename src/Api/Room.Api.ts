import { MemoryApi } from "./Memory.Api";
import { O_NOFOLLOW, SSL_OP_CISCO_ANYCONNECT } from "constants";

// an api used for functions related to the room
export class RoomApi {

    /**
     * check if there are hostile creeps in the room
     * @param room the room we are checking
     */
    public static isHostilesInRoom(room: Room): boolean {

        const hostilesInRoom = MemoryApi.getHostileCreeps(room);
        return (hostilesInRoom.length > 0);
    }


    /**
     * set the room's state
     * @param room the room we are setting state for
     */
    public static setRoomState(room: Room): void {

        // get the structures we need from memory

        // get the creeps we need from memory

        // ---------

        // check if we are in intro room state
        // 3 or less creeps so we need to (re)start the room

        // check if we are in beginner room state
        // no containers set up at sources so we are just running a bare knuckle room

        // check if we are in intermediate room state
        // container mining set up, but no storage

        // check if we are in advanced room state
        // container mining and storage set up

        // check if we are in upgrader room state
        // container mining and storage set up, and we got links online

        // check if we are in stimulate room state
        // room is flagged to stimulate AND storage/container mining is set up

        // check if we are siege room state
        // defcon is level 3+ and hostiles activity in the room is high

        // check if we are in nuke inbound room state
        // nuke is coming in and we need to gtfo
    }

    /**
     * run the towers in the room
     * @param room the room we are defending
     */
    public static runTowers(room: Room): void {

        const towers = MemoryApi.getStructures(room,
            (t: Structure<StructureConstant>) => {
                return t.structureType === STRUCTURE_TOWER;
            });
        const hostileCreeps = MemoryApi.getHostileCreeps(room);
        // --------

        // choose the most ideal target and have every tower attack it
        const idealTarget = this.chooseTowerTarget(room);

        // have each tower attack this target
        towers.forEach(t => t.attack(idealTarget));
    }

    /**
     * choose an ideal target for the towers to attack
     * @param room the room we are in
     */
    private static chooseTowerTarget(room: Room): Structure<StructureConstant> | null {
        return null;
    }

    /**
     * set the rooms defcon level
     * @param room the room we are setting defcon for
     */
    public static setDefconLevel(room: Room): void {
        // Lint hates empty blocks
    }

    /**
     * get repair targets for the room (ordered by priority)
     * @param room the room we are checking for repair targets
     */
    public static getRepairTargets(room: Room): void {
        // Lint hates empty blocks
    }

    /**
     * get spawn/extensions that need to be filled for the room
     * @param room the room we are getting spawns/extensions to be filled from
     */
    public static getExtensionsNeedFilled(room: Room): void {
        // Lint hates empty blocks
    }


    /**
     * get towers that need to be filled for the room (ordered by priority)
     * @param room the room we are getting towers that need to be filled from
     */
    public static getTowersNeedFilled(room: Room): void {
        // Lint hates empty blocks
    }

    /**
     * get ramparts, or ramparts and walls that need to be repaired
     * @param room the room we are getting ramparts/walls that need to be repaired from
     */
    public static getWallRepairTargets(room: Room): void {
        // Lint hates empty blocks
    }


}
