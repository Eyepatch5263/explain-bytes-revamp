import apiDesign from "./api-design";
import blobStorage from "./blob-storage";
import cdn from "./cdn";
import consistentHashing from "./consistent-hashing";
import database from "./database";
import distributedCache from "./distributed-cache";
import distributedLogging from "./distributed-logging";
import distributedSearch from "./distributed-search";
import distributedTaskScheduler from "./distributed-task-scheduler";
import dns from "./dns";
import keyValueStore from "./key-value-store";
import loadBalancing from "./load-balancing";
import messageQueues from "./message-queues";
import pubSubSystems from "./pub-sub-systems";
import rateLimiting from "./rate-limiting";
import sequencer from "./sequencer";
import sharedCounters from "./shared-counters";
import uniqueIdGeneration from "./unique-id-generation";

export const buildingBlocksRaw: Record<string, string> = {
  "api-design": apiDesign,
  "blob-storage": blobStorage,
  "cdn": cdn,
  "consistent-hashing": consistentHashing,
  "database": database,
  "distributed-cache": distributedCache,
  "distributed-logging": distributedLogging,
  "distributed-search": distributedSearch,
  "distributed-task-scheduler": distributedTaskScheduler,
  "dns": dns,
  "key-value-store": keyValueStore,
  "load-balancing": loadBalancing,
  "message-queues": messageQueues,
  "pub-sub-systems": pubSubSystems,
  "rate-limiting": rateLimiting,
  "sequencer": sequencer,
  "shared-counters": sharedCounters,
  "unique-id-generation": uniqueIdGeneration,
};

export {
  apiDesign,
  blobStorage,
  cdn,
  consistentHashing,
  database,
  distributedCache,
  distributedLogging,
  distributedSearch,
  distributedTaskScheduler,
  dns,
  keyValueStore,
  loadBalancing,
  messageQueues,
  pubSubSystems,
  rateLimiting,
  sequencer,
  sharedCounters,
  uniqueIdGeneration,
};

export default buildingBlocksRaw;
