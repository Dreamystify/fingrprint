-- local lock_key = '{fingrprint}-generator-lock'
-- local sequence_key = '{fingrprint}-generator-sequence'
-- local logical_shard_id_key = '{fingrprint}-shard-id'

local lock_key = KEYS[1]
local sequence_key = KEYS[2]
local logical_shard_id_key = KEYS[3]

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
}