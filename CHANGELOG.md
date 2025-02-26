# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-02-25

### Added

- **ioredis Support:** Migrated from using the `redis` package to `ioredis` to leverage its advanced features.
- **Cluster and Sentinel Modes:**  
  - Added support for Redis Cluster via the `clusterNodes` configuration.
  - Added support for Redis Sentinel via the `sentinels`, `sentinelUsername`, `sentinelPassword`, and `name` options.
- **Extended Configuration Options:**  
  - Updated the `FingrprintConfig` interface to include new options for cluster and Sentinel connections.
  - Added custom retry strategies and reconnection policies.
- **Module Augmentation:** Extended the `ioredis` interfaces to include a new `generateIds` method for generating unique IDs.
- **Enhanced Documentation:** Added detailed JSDoc comments for classes, methods, and events throughout the codebase.

### Changed

- **ID Generation Implementation:**  
  - Refactored the unique ID generation logic to integrate with `ioredis` and support multiple Redis connection modes.
  - The Lua script for generating IDs is now loaded from an external file (`scripts/generateIds.lua`) rather than being hardcoded.
- **Default Constants and Environment Variables:**  
  - Updated naming conventions and default values (e.g., `FINGRPRINT_SHARD_ID_KEY`, `FINGRPRINT_SHARD_ID`) to reflect the new implementation.
- **Error Handling and Event Management:** Improved error detection, handling, and event emissions during initialization and connection processes.

### Fixed

- **Robustness Across Environments:**  
  - Resolved issues related to connection failures and error propagation across different Redis modes.
- **Improved Compatibility:** Ensured that the library behaves consistently whether using a single-node, cluster, or Sentinel Redis setup.

### Breaking Changes

- **Library Migration:**  
  - The switch from `redis` to `ioredis` may require adjustments in how the library is imported and configured in your project.
- **Configuration Updates:**  
  - New configuration options are introduced, and some defaults have changed. Please review and update your configuration to be compatible with v1.0.0.
