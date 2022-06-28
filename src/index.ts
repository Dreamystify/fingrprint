import bigInteger from 'big-integer';
import { createClient, defineScript } from 'redis';

type FingrprintConfig = {
    host?: string
    port?: number
    username?: string
    password?: string
}

// shard name and id for single use
const FINGRPRINT_SHARD_ID_KEY = process.env.FINGRPRINT_SHARD_ID_KEY || `fingrprint-shard-id`;
const FINGRPRINT_SHARD_ID = process.env.FINGRPRINT_SHARD_ID || 1;

// We specify an custom epoch that we will use to fit our timestamps within the bounds of the 41 bits we have
// available. This gives us a range of ~69 years within which we can generate IDs.
const CUSTOM_EPOCH = 1451566800,
  	  LOGICAL_SHARD_ID_BITS = 10,
  	  SEQUENCE_BITS = 12,
  	  TIMESTAMP_SHIFT = SEQUENCE_BITS + LOGICAL_SHARD_ID_BITS,
  	  LOGICAL_SHARD_ID_SHIFT = SEQUENCE_BITS;

// These three bitopped constants are also used as bit masks for the maximum value of the data they represent.
const MAX_SEQUENCE = ~(-1 << SEQUENCE_BITS),
      MAX_LOGICAL_SHARD_ID = ~(-1 << LOGICAL_SHARD_ID_BITS),
      MIN_LOGICAL_SHARD_ID = 1;

const MAX_BATCH_SIZE = MAX_SEQUENCE + 1;
const ONE_MILLI_IN_MICRO_SECS = 1000; // TimeUnit.MICROSECONDS.convert(1, TimeUnit.MILLISECONDS);

// class attempt
export default class Fingrprint {
    #client;
    #host;
    #port;
    #password;
    #username;

    constructor(options?: FingrprintConfig) {
        options = options || {};
        this.#host = options.host || `localhost`;
        this.#port = options.port || 6389;
        this.#password = options.password;
        this.#username = options.username;
        this.#client = createClient({
            socket: {
                host: this.#host, 
                port: this.#port,
                reconnectStrategy: (retries: number) => {
                    return Math.min(retries * 50, 500);
                }
            },
            username: this.#username,
            password: this.#password,
            scripts: {
                generateIds: defineScript({
                    NUMBER_OF_KEYS: 0,
                    SCRIPT: 
                        `local lock_key = 'fingrprint-generator-lock'
                        local sequence_key = 'fingrprint-generator-sequence'
                        local logical_shard_id_key = 'fingrprint-shard-id'
        
                        local max_sequence = tonumber(ARGV[1])
                        local min_logical_shard_id = tonumber(ARGV[2])
                        local max_logical_shard_id = tonumber(ARGV[3])
                        local num_ids = tonumber(ARGV[4])
        
                        if redis.call('EXISTS', lock_key) == 1 then
                            redis.log(redis.LOG_NOTICE, 'Fingrprint: Cannot generate ID, waiting for lock to expire.')
                            return redis.error_reply('Fingrprint: Cannot generate ID, waiting for lock to expire.')
                        end
        
                        --[[
                        Increment by a set number, this can
                        --]]
                        local end_sequence = redis.call('INCRBY', sequence_key, num_ids)
                        local start_sequence = end_sequence - num_ids + 1
                        local logical_shard_id = tonumber(redis.call('GET', logical_shard_id_key)) or -1
        
                        if end_sequence >= max_sequence then
                            redis.log(redis.LOG_NOTICE, 'Fingrprint: Rolling sequence back to the start, locking for 1ms.')
                            redis.call('SET', sequence_key, '-1')
                            redis.call('PSETEX', lock_key, 1, 'lock')
                            end_sequence = max_sequence
                        end
        
                        --[[
                        The TIME command MUST be called after anything that mutates state, or the Redis server will error the script out.
                        This is to ensure the script is "pure" in the sense that randomness or time based input will not change the
                        outcome of the writes.
                        See the "Scripts as pure functions" section at http://redis.io/commands/eval for more information.
                        --]]
                        local time = redis.call('TIME')
        
                        return {
                            start_sequence,
                            end_sequence, -- Doesn't need conversion, the result of INCR or the variable set is always a number.
                            logical_shard_id,
                            tonumber(time[1]),
                            tonumber(time[2])
                        }`,
                    transformArguments(MAX_SEQUENCE: number, MIN_LOGICAL_SHARD_ID: number, MAX_LOGICAL_SHARD_ID: number, batch: number): Array<string> {
                        return [MAX_SEQUENCE.toString(), MIN_LOGICAL_SHARD_ID.toString(), MAX_LOGICAL_SHARD_ID.toString(), batch.toString()];
                    },
                    transformReply(reply: number[]): number[] {
                        return reply;
                    }
                }),
            }
        });
    }

    async #init() {
        try {
            await this.#client.connect();
            const exists = await this.#client.exists(FINGRPRINT_SHARD_ID_KEY);
            if(!exists) await this.#client.set(FINGRPRINT_SHARD_ID_KEY, FINGRPRINT_SHARD_ID);
        } catch (err) {
            throw err;
        }
    }

    async getIds(count?: number): Promise<BigInt[]> {
        let batch: number = (count = count ?? 1) > MAX_BATCH_SIZE ? MAX_BATCH_SIZE : count;

        try {
            // check if client is connected
            if (!this.#client.isOpen) await this.#init();
           
            // get the numbers to create the ids
            const reply = await this.#client.generateIds(MAX_SEQUENCE, MIN_LOGICAL_SHARD_ID, MAX_LOGICAL_SHARD_ID, batch);

            // format the results
            const START_SEQUENCE: number 	= Number(reply[0]);
            const END_SEQUENCE: number 		= Number(reply[1]);
            const LOGICAL_SHARD_ID: number 	= Number(reply[2]);
            const TIME_SECONDS: number 		= Number(reply[3]);
            const TIME_MICROSECONDS: number	= Number(reply[4]);

            // We get the timestamp from Redis in seconds, but we get microseconds too, so we can make a timestamp in
            // milliseconds (losing some precision in the meantime for the sake of keeping things in 41 bits) using both of
            // these values
            let timestamp = Math.trunc((TIME_SECONDS * ONE_MILLI_IN_MICRO_SECS) + (TIME_MICROSECONDS / ONE_MILLI_IN_MICRO_SECS));

            // loop through the sequences to create the batch ids
            let ids: BigInt[] = [];
            for (let i = START_SEQUENCE; i <= END_SEQUENCE; i++) {

                // Here's the fun bit-shifting. The purpose of this is to get a 64-bit ID of the following
                // format:
                //
                // ABBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBCCCCCCCCCCDDDDDDDDDDDD
                //
                // Where:
                //   * A is the reserved signed bit.
                //   * B is the timestamp in milliseconds since custom epoch bits, 41 in total.
                //   * C is the logical shard ID, 10 bits in total.
                //   * D is the sequence, 12 bits in total.

                // compute the id
                let id = bigInteger((timestamp - CUSTOM_EPOCH)).shiftLeft(TIMESTAMP_SHIFT).or(bigInteger(LOGICAL_SHARD_ID).shiftLeft(LOGICAL_SHARD_ID_SHIFT)).or(i).toString();

                // add id to list of ids
                ids.push(BigInt(id));
            }
            //throw new Error(`The connection is: ${this.#client.isOpen}`);
            // return the batch of ids array
            return ids;
        } 
        catch (err) {
            if(err instanceof Error) {
                // IDE type hinting now available
                if (err.message == `redis connection issue`) {
                    throw new Error(`Error connecting to redis server`);
                }

                throw err;
            } else {
                throw err;
            }
        }
    }

    async getId(): Promise<BigInt> {
        const [id] = await this.getIds();
        return id;
    }

    async close() {
        if(this.#client != undefined) {
            await this.#client.quit();
        }
    }
}
