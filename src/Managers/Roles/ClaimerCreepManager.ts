import RoomApi from "../../Api/Room.Api";
import MemoryApi from "../../Api/Memory.Api";
import CreepDomesticApi from "Api/CreepDomestic.Api";
import CreepApi from "Api/Creep.Api";
import CreepDomestic from "Api/CreepDomestic.Api";
import { ERROR_WARN } from "utils/constants";
import UserException from "utils/UserException";

// Manager for the miner creep role
export default class ClaimerCreepManager {
    /**
     * run the claimer creep
     * @param creep the creep we are running
     */
    public static runCreepRole(creep: Creep): void {
        if (creep.spawning) {
            return;
        }

        if (creep.room.memory.defcon > 0) {
            // flee code here
        }

        const homeRoom = Game.rooms[creep.memory.homeRoom];

        if (creep.memory.job === undefined) {
            this.getClaimJob(creep, homeRoom);

            if (creep.memory.job === undefined) {
                return;
            }

            this.handleNewJob(creep, homeRoom, creep.memory.job as ClaimPartJob);
        }

        if (creep.memory.working) {
            CreepApi.doWork(creep, creep.memory.job);
        }

        CreepApi.travelTo(creep, creep.memory.job);
    }

    public static getClaimJob(creep: Creep, room: Room): ClaimPartJob | undefined {
        const creepOptions = creep.memory.options as CreepOptionsCiv;

        if (creepOptions.claim) {
            const claimJobs = MemoryApi.getClaimJobs(room, (job: ClaimPartJob) => !job.isTaken);

            if (claimJobs.length > 0) {
                return claimJobs[0];
            }
        }

        return undefined;
    }

    public static handleNewJob(creep: Creep, room: Room, job: ClaimPartJob): void {
        const newJob = MemoryApi.searchClaimPartJobs(job, room);

        if (newJob === undefined) {
            const exception = new UserException(
                "Invalid Job For RemoteReserver",
                "Creep: " + creep.name + "\nJob: " + JSON.stringify(creep.memory.job),
                ERROR_WARN
            );

            delete creep.memory.job;

            throw exception;
        } else {
            newJob.isTaken = true;
        }
    }
}
