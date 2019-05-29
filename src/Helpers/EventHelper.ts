export default class EventHelper {

    /**
     * process event triggered for ramparts built in a room
     * @param room the room the event occured in
     * @param event the event that occured
     * @param constructionSite the site we are triggering the event for
     */
    public static rampartBuiltTrigger(room: Room, event: CustomEvent, constructionSite: ConstructionSite): void {

        // handle rampart build trigger event here
    }

    /**
     * military creep successfully spawned event
     * @param room the room the event occured in
     * @param event the event that occured
     * @param creep the creep thaat just spawned
     */
    public static miltaryCreepSpawnTrigger(room: Room, event: CustomEvent, creep: Creep): void {

        // handle creep spawned trigger event here
    }

    /**
     * scan for structure built events
     * @param room the room we are scanning
     */
    public static scanForStructureBuiltEvents(room: Room): void {
        // scan for a structure somehow that was completed this turn
    }

    /**
     * scan for creep spawned events
     * @param room the room we are scanning
     */
    public static scanForCreepSpawnedEvents(room: Room): void {
        // scan for creeps with a ttl of 1500 or 1499 this turn
    }
}
