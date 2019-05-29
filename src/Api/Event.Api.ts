import { C_EVENT_BUILD_COMPLETE, C_EVENT_CREEP_SPAWNED } from "utils/Constants";
import EventHelper from "Helpers/EventHelper";
import { SpawnHelper } from "Helpers/SpawnHelper";
import UserException from "utils/UserException";

export default class EventApi {

    /**
     * log an event in the room
     * this will not create an event if the subject is undefined
     * @param room the room the event occured in
     * @param id the id of the subject of the event
     * @param eventType the event type custom constant
     */
    public static createCustomEvent(roomNameString: string, id: string, eventType: CustomEventConstant): void {
        if (Game.getObjectById(id) === undefined) {
            return;
        }
        if (!Memory.rooms[roomNameString].events) {
            Memory.rooms[roomNameString].events = [];
        }

        const event: CustomEvent = {
            type: eventType,
            targetId: id,
            roomName: roomNameString,
        }
        Memory.rooms[roomNameString].events.push(event);
    }


    /**
     * check for events occuring in a room
     * @param room the room we are checking events for
     */
    public static scanForNewEvents(room: Room): void {

        // Call the helper functions to scan for and create new events for the room
        EventHelper.scanForStructureBuiltEvents(room);
        EventHelper.scanForCreepSpawnedEvents(room);
    }


    /**
     *
     * @param room
     */
    public static processRoomEvents(room: Room): void {

        const events: CustomEvent[] = room.memory.events;
        for (const event of events) {
            this.processSingleEvent(room, event);
        }
    }


    /**
     * process the specific event provided by the parameter
     * @param room the room this event occured in
     * @param event the event that occured
     */
    public static processSingleEvent(room: Room, event: CustomEvent): void {

        // Handle saftey and early returns
        const subject = Game.getObjectById(event.targetId);
        if (!subject) {
            return;
        }

        // Call the appropriate helper for each event
        switch (event.type) {

            // Handle all construction site built events
            case C_EVENT_BUILD_COMPLETE:
                this.processConstructionSiteEvent(room, event, subject);
                break;

            // Handle all creep spawned events
            case C_EVENT_CREEP_SPAWNED:
                this.processCreepSpawnEvent(room, event, subject);
                break;

            default:
                throw new UserException(
                    "Event type unhandled",
                    "eventApi/processEvents/processSingleEvent",
                    ERROR_WARN
                );
        }
    }


    /**
     * process construction site events
     */
    public static processConstructionSiteEvent(room: Room, event: CustomEvent, subject: {}): void {

        const constructionSite: ConstructionSite = subject as ConstructionSite;

        // Handle ramparts being built
        if (constructionSite.structureType === STRUCTURE_RAMPART) {
            EventHelper.rampartBuiltTrigger(room, event, constructionSite);
        }
    }


    /**
     * process creep spawning event
     * @param room the room the event occured in
     * @param event the event that occured
     */
    public static processCreepSpawnEvent(room: Room, event: CustomEvent, subject: {}): void {
        const creep: Creep = subject as Creep;

        // Handle military creep being spawned
        if (SpawnHelper.isMilitaryRole(creep.memory.role)) {
            EventHelper.miltaryCreepSpawnTrigger(room, event, creep);
        }
    }
}
