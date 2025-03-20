# Faction Wars Ecosystem - Technical Specification

**Version:** 1.0  
**Date:** March 11, 2025  
**Status:** Draft  
**Classification:** Internal Development Documentation

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
   - [Contract Interactions Diagram](#21-contract-interactions-diagram)
   - [System Components](#22-system-components)
   - [Dependency Relationships](#23-dependency-relationships)
3. [Library Infrastructure](#3-library-infrastructure)
   - [Core Business Logic Libraries](#31-core-business-logic-libraries)
   - [Financial Libraries](#32-financial-libraries)
   - [Security and Utility Libraries](#33-security-and-utility-libraries)
   - [Data Management Libraries](#34-data-management-libraries)
4. [Contract Specifications](#4-contract-specifications)
   - [FactionRegistry](#41-factionregistry)
   - [TerritoryRegistry](#42-territoryregistry)
   - [TerritoryStaking](#43-territorystaking)
   - [TreasuryManagement](#44-treasurymanagement)
   - [NFTMarketplace](#45-nftmarketplace)
5. [Cross-Contract Interactions](#5-cross-contract-interactions)
   - [Territory Control Workflow](#51-territory-control-workflow)
   - [NFT Transaction Workflows](#52-nft-transaction-workflows)
   - [Revenue Distribution Workflows](#53-revenue-distribution-workflows)
   - [Governance Interaction Workflows](#54-governance-interaction-workflows)
6. [Security Considerations](#6-security-considerations)
   - [Access Control Strategy](#61-access-control-strategy)
   - [Reentrancy Protections](#62-reentrancy-protections)
   - [Overflow and Underflow Safeguards](#63-overflow-and-underflow-safeguards)
   - [Oracle Manipulations](#64-oracle-manipulations)
   - [Front-Running Mitigations](#65-front-running-mitigations)
7. [Gas Optimization Strategies](#7-gas-optimization-strategies)
   - [Storage Optimization](#71-storage-optimization)
   - [Computation Efficiency](#72-computation-efficiency)
   - [Batch Processing](#73-batch-processing)
8. [Testing Framework](#8-testing-framework)
   - [Unit Testing](#81-unit-testing)
   - [Integration Testing](#82-integration-testing)
   - [Security Testing](#83-security-testing)
9. [Deployment Guide](#9-deployment-guide)
   - [Deployment Sequence](#91-deployment-sequence)
   - [Contract Initialization](#92-contract-initialization)
   - [Cross-Contract Configuration](#93-cross-contract-configuration)
10. [Upgradeability Considerations](#10-upgradeability-considerations)
    - [Upgrade Patterns](#101-upgrade-patterns)
    - [State Migration](#102-state-migration)
    - [Governance Control](#103-governance-control)
11. [Appendices](#11-appendices)
    - [Data Structure Definitions](#111-data-structure-definitions)
    - [Event Definitions](#112-event-definitions)
    - [Integration with AlstraToken](#113-integration-with-alstratoken)
    - [Integration with BaseGovernor](#114-integration-with-basegovernor)

---

## 1. Executive Summary

This technical specification document provides comprehensive implementation details for the core smart contracts of the Faction Wars ecosystem. The system enables faction-based gameplay with territory control mechanics, economic operations, and decentralized governance within an NFT-powered game economy on the AlstraNet blockchain.

The specification describes five main contracts and their supporting libraries:

1. **FactionRegistry** - Manages faction membership and reputation
2. **TerritoryRegistry** - Defines territory zones and their properties
3. **TerritoryStaking** - Handles staking for territory control
4. **TreasuryManagement** - Manages DAO funds and assets
5. **NFTMarketplace** - Provides trading infrastructure for game assets

The document emphasizes a library-centric approach to promote code reusability, gas optimization, and simplified upgrades. It serves as a comprehensive reference for developers implementing the system, detailing how to create, test, and deploy the contracts according to best practices.

---

## 2. System Architecture

### 2.1 Contract Interactions Diagram

```
                     ┌─────────────────┐
                     │  BaseGovernor   │
                     └─────────┬───────┘
                               │ governs
                               ▼
┌─────────────┐      ┌─────────────────┐
│ AlstraToken │◄────►│ TreasuryManagement │
└──────┬──────┘      └─────────┬───────┘
       │                       │ distributes
       │ used by              │ revenue
       │                       │
┌──────▼──────┐      ┌─────────▼───────┐
│ FactionRegistry │◄─►│  TerritoryRegistry │
└──────┬──────┘      └─────────┬───────┘
       │                       │ provides
       │ provides              │ territory data
       │ faction data          │
       │             ┌─────────▼───────┐
       └────────────►│ TerritoryStaking │
                     └─────────┬───────┘
                               │ affects
                               │ marketplace operations
                               ▼
                     ┌─────────────────┐
                     │  NFTMarketplace │
                     └─────────────────┘
```

### 2.2 System Components

#### 2.2.1 Core Game Mechanics
- **FactionRegistry**: Manages player affiliations with Law Enforcement, Criminal Syndicate, or Vigilante factions
- **TerritoryRegistry**: Manages territory zones with economic properties and faction control status
- **TerritoryStaking**: Implements staking mechanics for gaining territorial control

#### 2.2.2 Economic Infrastructure
- **TreasuryManagement**: Manages DAO funds and faction-specific treasuries
- **NFTMarketplace**: Enables trading of game assets with faction-specific restrictions

#### 2.2.3 External Dependencies
- **AlstraToken**: The ecosystem's native token used for all economic activity
- **BaseGovernor**: The governance system for protocol decisions

#### 2.2.4 Library Infrastructure
- **Core Business Logic Libraries**: Territory calculations, staking algorithms, faction mechanics
- **Financial Libraries**: Fee calculations, revenue distribution
- **Security Libraries**: Access control, validation
- **Data Management Libraries**: Array operations, storage patterns

### 2.3 Dependency Relationships

| Contract | Dependencies |
|----------|--------------|
| FactionRegistry | None (base contract) |
| TerritoryRegistry | None (base contract) |
| TerritoryStaking | TerritoryRegistry, FactionRegistry, AlstraToken |
| TreasuryManagement | AlstraToken, FactionRegistry, TerritoryRegistry, BaseGovernor |
| NFTMarketplace | AlstraToken, FactionRegistry, TerritoryRegistry, TreasuryManagement |

---

## 3. Library Infrastructure

### 3.1 Core Business Logic Libraries

#### 3.1.1 TerritoryLibrary

```solidity
library TerritoryLibrary {
    /**
     * @dev Calculates the current value of a territory
     * @param baseValue The base economic value
     * @param zoneType The type of zone (1=High-Security, 2=Medium-Security, 3=No-Go)
     * @param resourceRate The resource generation rate
     * @param contestedStatus Whether the territory is contested
     * @param lastUpdateBlock The last block when the territory was updated
     * @return The current economic value
     */
    function calculateTerritoryValue(
        uint256 baseValue,
        uint8 zoneType,
        uint256 resourceRate,
        bool contestedStatus,
        uint256 lastUpdateBlock
    ) internal view returns (uint256) {
        // Implementation details...
    }

    /**
     * @dev Calculates resources generated since last update
     * @param resourceRate Base resource generation rate per block
     * @param lastUpdateBlock Last block when resources were calculated
     * @param currentBlock Current block number
     * @param controlModifier Modifier based on controlling faction (0-100)
     * @return Amount of resources generated
     */
    function calculateGeneratedResources(
        uint256 resourceRate,
        uint256 lastUpdateBlock,
        uint256 currentBlock,
        uint8 controlModifier
    ) internal pure returns (uint256) {
        // Implementation details...
    }

    /**
     * @dev Determines if a territory is contested based on faction stakes
     * @param factionStakes Array of stake amounts by faction
     * @param totalStaked Total amount staked on the territory
     * @param contestThreshold Percentage threshold for contested state (e.g., 10 = 10%)
     * @return isContested Whether the territory is contested
     * @return dominantFaction The faction with the highest stake (0 if none)
     * @return challengerFaction The faction with the second highest stake (0 if none)
     */
    function determineContestedStatus(
        uint256[] memory factionStakes,
        uint256 totalStaked,
        uint8 contestThreshold
    ) internal pure returns (
        bool isContested,
        uint8 dominantFaction,
        uint8 challengerFaction
    ) {
        // Implementation details...
    }
}
```

#### 3.1.2 StakingLibrary

```solidity
library StakingLibrary {
    /**
     * @dev Calculates staking rewards for a territory
     * @param stakeAmount Amount of tokens staked
     * @param stakeDuration Duration of the stake in blocks
     * @param territoryValue Economic value of the territory
     * @param baseRewardRate Base reward rate per block
     * @param factionBonus Bonus based on faction (0-100)
     * @return Calculated reward amount
     */
    function calculateStakingReward(
        uint256 stakeAmount,
        uint256 stakeDuration,
        uint256 territoryValue,
        uint256 baseRewardRate,
        uint8 factionBonus
    ) internal pure returns (uint256) {
        // Implementation details...
    }

    /**
     * @dev Calculates controlling faction based on stake distribution
     * @param factionStakes Array of stake amounts by faction (indexed by faction ID)
     * @param totalStaked Total amount staked on the territory
     * @param controlThreshold Minimum percentage needed for control (e.g., 50 = 50%)
     * @return controllingFaction The faction that controls the territory (0 if none)
     * @return controlPercentage The percentage of control the faction has
     */
    function calculateControllingFaction(
        uint256[] memory factionStakes,
        uint256 totalStaked,
        uint8 controlThreshold
    ) internal pure returns (
        uint8 controllingFaction,
        uint256 controlPercentage
    ) {
        // Implementation details...
    }
}
```

#### 3.1.3 FactionLibrary

```solidity
library FactionLibrary {
    /**
     * @dev Calculates reputation change based on action type and parameters
     * @param actionType Type of action performed
     * @param actionValue Value or magnitude of the action
     * @param currentReputation Current reputation of the member
     * @param factionId The faction ID
     * @return New reputation value
     */
    function calculateReputationChange(
        uint8 actionType,
        uint256 actionValue,
        uint256 currentReputation,
        uint8 factionId
    ) internal pure returns (uint256) {
        // Implementation details...
    }

    /**
     * @dev Determines if a member is eligible for rank promotion
     * @param currentRank Current rank of the member
     * @param reputation Current reputation of the member
     * @param memberSince Timestamp when the member joined
     * @param factionId The faction ID
     * @return isEligible Whether the member is eligible for promotion
     * @return newRank The new rank if eligible
     */
    function checkRankEligibility(
        uint8 currentRank,
        uint256 reputation,
        uint256 memberSince,
        uint8 factionId
    ) internal view returns (
        bool isEligible,
        uint8 newRank
    ) {
        // Implementation details...
    }

    /**
     * @dev Checks if a member has a specific role in their faction
     * @param memberRank The member's rank
     * @param memberReputation The member's reputation
     * @param roleId The role to check
     * @param factionId The faction ID
     * @return Whether the member has the role
     */
    function hasRole(
        uint8 memberRank,
        uint256 memberReputation,
        uint8 roleId,
        uint8 factionId
    ) internal pure returns (bool) {
        // Implementation details...
    }
}
```

#### 3.1.4 MarketplaceLibrary

```solidity
library MarketplaceLibrary {
    /**
     * @dev Checks if a listing is valid
     * @param nftContract The NFT contract address
     * @param tokenId The token ID
     * @param quantity The quantity to sell
     * @param price The listing price
     * @param nftType The NFT type (1=ERC721, 2=ERC1155)
     * @return isValid Whether the listing is valid
     * @return errorMessage Error message if not valid
     */
    function validateListing(
        address nftContract,
        uint256 tokenId,
        uint256 quantity,
        uint256 price,
        uint8 nftType
    ) internal view returns (
        bool isValid,
        string memory errorMessage
    ) {
        // Implementation details...
    }

    /**
     * @dev Checks if a user can purchase a listing
     * @param listingType The type of listing
     * @param requiredFaction Required faction to purchase (0 if none)
     * @param minimumRank Minimum rank required (0 if none)
     * @param buyer The buyer address
     * @param userFaction The buyer's faction
     * @param userRank The buyer's rank
     * @return canPurchase Whether the user can purchase
     * @return reason Reason if cannot purchase
     */
    function canPurchaseListing(
        uint8 listingType,
        uint8 requiredFaction,
        uint8 minimumRank,
        address buyer,
        uint8 userFaction,
        uint8 userRank
    ) internal pure returns (
        bool canPurchase,
        string memory reason
    ) {
        // Implementation details...
    }

    /**
     * @dev Calculates auction state based on current conditions
     * @param startTime When the auction started
     * @param endTime When the auction ends
     * @param startingPrice Initial auction price
     * @param reservePrice Minimum acceptable price
     * @param currentBid Current highest bid
     * @param currentTime Current timestamp
     * @return state Current auction state (0=Active, 1=Ended, 2=Reserve Not Met)
     * @return currentPrice Current effective price
     */
    function calculateAuctionState(
        uint256 startTime,
        uint256 endTime,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 currentBid,
        uint256 currentTime
    ) internal pure returns (
        uint8 state,
        uint256 currentPrice
    ) {
        // Implementation details...
    }
}
```

### 3.2 Financial Libraries

#### 3.2.1 FeeLibrary

```solidity
library FeeLibrary {
    /**
     * @dev Calculates marketplace fees based on listing price and parameters
     * @param price The listing price
     * @param baseFeePercentage Base fee percentage (in basis points)
     * @param factionId The faction ID of the seller
     * @param territoryId The territory ID where the listing is created
     * @param controllingFaction The faction controlling the territory
     * @return totalFee Total fee amount
     * @return distribution Struct with fee distribution breakdown
     */
    function calculateMarketplaceFee(
        uint256 price,
        uint256 baseFeePercentage,
        uint8 factionId,
        uint256 territoryId,
        uint8 controllingFaction
    ) internal pure returns (
        uint256 totalFee,
        FeeDistribution memory distribution
    ) {
        // Implementation details...
    }

    /**
     * @dev Calculates transaction tax based on sender and receiver factions
     * @param amount The transaction amount
     * @param senderFaction Faction ID of the sender
     * @param receiverFaction Faction ID of the receiver
     * @param baseTaxRate Base tax rate (in basis points)
     * @return tax The calculated tax amount
     */
    function calculateTransactionTax(
        uint256 amount,
        uint8 senderFaction,
        uint8 receiverFaction,
        uint256 baseTaxRate
    ) internal pure returns (uint256 tax) {
        // Implementation details...
    }

    /**
     * @dev Struct for fee distribution breakdown
     */
    struct FeeDistribution {
        uint256 daoTreasuryAmount;
        uint256 territoryControllerAmount;
        uint256 sellerFactionAmount;
        uint256 burnAmount;
    }
}
```

#### 3.2.2 RevenueLibrary

```solidity
library RevenueLibrary {
    /**
     * @dev Calculates revenue distribution based on territory control
     * @param totalRevenue Total revenue to distribute
     * @param territoryInfluence Array of territory influence percentages by faction
     * @param factionCount Number of factions
     * @param daoTreasuryPercentage Percentage allocated to the DAO treasury
     * @param burnPercentage Percentage to burn
     * @return distribution Array of amounts by faction index
     * @return daoAmount Amount allocated to DAO treasury
     * @return burnAmount Amount to burn
     */
    function calculateRevenueDistribution(
        uint256 totalRevenue,
        uint256[] memory territoryInfluence,
        uint8 factionCount,
        uint256 daoTreasuryPercentage,
        uint256 burnPercentage
    ) internal pure returns (
        uint256[] memory distribution,
        uint256 daoAmount,
        uint256 burnAmount
    ) {
        // Implementation details...
    }

    /**
     * @dev Calculates staking rewards distribution
     * @param totalRewards Total rewards to distribute
     * @param stakes Array of stake amounts by user
     * @param totalStaked Total amount staked
     * @return rewards Array of reward amounts by user index
     */
    function calculateStakingRewardsDistribution(
        uint256 totalRewards,
        uint256[] memory stakes,
        uint256 totalStaked
    ) internal pure returns (uint256[] memory rewards) {
        // Implementation details...
    }
}
```

### 3.3 Security and Utility Libraries

#### 3.3.1 AccessControlLibrary

```solidity
library AccessControlLibrary {
    /**
     * @dev Checks if an address has faction-based access to a function
     * @param user Address to check
     * @param factionId User's faction ID
     * @param rank User's rank
     * @param requiredFaction Required faction (0 for any)
     * @param requiredRank Required minimum rank
     * @return Whether access is granted
     */
    function hasFactionAccess(
        address user,
        uint8 factionId,
        uint8 rank,
        uint8 requiredFaction,
        uint8 requiredRank
    ) internal pure returns (bool) {
        // Implementation details...
    }

    /**
     * @dev Checks if an address has territory-based access to a function
     * @param user Address to check
     * @param factionId User's faction ID
     * @param territoryId Territory ID
     * @param controllingFaction Faction controlling the territory
     * @param isContested Whether the territory is contested
     * @return Whether access is granted
     */
    function hasTerritoryAccess(
        address user,
        uint8 factionId,
        uint256 territoryId,
        uint8 controllingFaction,
        bool isContested
    ) internal pure returns (bool) {
        // Implementation details...
    }

    /**
     * @dev Validates governance-based access to admin functions
     * @param caller Address calling the function
     * @param governorAddress Address of the governor
     * @param timelockAddress Address of the timelock
     * @return Whether access is granted
     */
    function hasGovernanceAccess(
        address caller,
        address governorAddress,
        address timelockAddress
    ) internal pure returns (bool) {
        // Implementation details...
    }
}
```

#### 3.3.2 ValidationLibrary

```solidity
library ValidationLibrary {
    /**
     * @dev Validates an NFT contract implements required interfaces
     * @param nftContract The NFT contract address
     * @return standard The NFT standard (1=ERC721, 2=ERC1155, 0=Unsupported)
     */
    function validateNFTContract(address nftContract) internal view returns (uint8 standard) {
        // Implementation details...
    }

    /**
     * @dev Validates territory parameters
     * @param name Territory name
     * @param zoneType Zone type value
     * @param baseValue Base economic value
     * @param resourceGenerationRate Resource generation rate
     * @return isValid Whether the parameters are valid
     * @return errorMessage Error message if not valid
     */
    function validateTerritoryParameters(
        string memory name,
        uint8 zoneType,
        uint256 baseValue,
        uint256 resourceGenerationRate
    ) internal pure returns (
        bool isValid,
        string memory errorMessage
    ) {
        // Implementation details...
    }

    /**
     * @dev Validates faction parameters
     * @param factionId Faction ID
     * @param rank Rank value
     * @param reputation Reputation value
     * @return isValid Whether the parameters are valid
     * @return errorMessage Error message if not valid
     */
    function validateFactionParameters(
        uint8 factionId,
        uint8 rank,
        uint256 reputation
    ) internal pure returns (
        bool isValid,
        string memory errorMessage
    ) {
        // Implementation details...
    }
}
```

### 3.4 Data Management Libraries

#### 3.4.1 ArrayLibrary

```solidity
library ArrayLibrary {
    /**
     * @dev Removes an element from an array of addresses
     * @param array The array to modify
     * @param element The element to remove
     * @return success Whether the element was found and removed
     */
    function removeAddress(address[] storage array, address element) internal returns (bool success) {
        // Implementation details...
    }

    /**
     * @dev Checks if an array of addresses contains a specific element
     * @param array The array to search
     * @param element The element to find
     * @return Whether the element exists in the array
     */
    function containsAddress(address[] memory array, address element) internal pure returns (bool) {
        // Implementation details...
    }

    /**
     * @dev Returns the index of the maximum value in a uint256 array
     * @param array The array to search
     * @return index The index of the maximum value
     */
    function indexOfMax(uint256[] memory array) internal pure returns (uint256 index) {
        // Implementation details...
    }

    /**
     * @dev Sums all values in a uint256 array
     * @param array The array to sum
     * @return sum The sum of all elements
     */
    function sum(uint256[] memory array) internal pure returns (uint256) {
        // Implementation details...
    }
}
```

#### 3.4.2 StorageLibrary

```solidity
library StorageLibrary {
    /**
     * @dev Efficient mapping operations for nested mappings
     * @param mappingSlot Storage slot of the mapping
     * @param key1 First level key
     * @param key2 Second level key
     * @return The storage pointer to the nested mapping value
     */
    function getNestedMappingLocation(
        bytes32 mappingSlot,
        uint256 key1,
        uint256 key2
    ) internal pure returns (bytes32) {
        // Implementation details...
    }

    /**
     * @dev Efficient storage of packed data
     * @param slot Storage slot
     * @param value1 First value (uint128)
     * @param value2 Second value (uint128)
     */
    function storePackedUint128(
        bytes32 slot,
        uint128 value1,
        uint128 value2
    ) internal {
        // Implementation details...
    }

    /**
     * @dev Retrieves packed data
     * @param slot Storage slot
     * @return value1 First value (uint128)
     * @return value2 Second value (uint128)
     */
    function loadPackedUint128(bytes32 slot) internal view returns (uint128 value1, uint128 value2) {
        // Implementation details...
    }
}
```

---

## 4. Contract Specifications

### 4.1 FactionRegistry

#### 4.1.1 Purpose

The FactionRegistry manages faction membership, ranks, and reputation for all players within the Faction Wars ecosystem. It serves as the source of truth for faction-related data that other contracts (such as TerritoryStaking and NFTMarketplace) rely on for authorization and functionality.

#### 4.1.2 Data Structures

```solidity
// Faction member details
struct FactionMember {
    uint8 factionId;         // 1=Law Enforcement, 2=Criminal, 3=Vigilante
    uint8 rank;              // 1-10 rank scale
    uint256 reputation;      // Accumulated reputation points
    uint256 joinedAt;        // Timestamp when member joined
    bool active;             // Whether membership is active
}

// Faction information
struct FactionInfo {
    string name;             // Faction name
    string description;      // Faction description
    uint256 totalMembers;    // Total number of active members
    uint256 totalReputation; // Cumulative reputation of all members
    uint256 influenceScore;  // Calculated influence score
    bool active;             // Whether faction is active
}

// Role definition
struct FactionRole {
    string name;             // Role name
    uint8 minimumRank;       // Minimum rank required
    uint256 reputationThreshold; // Minimum reputation required
    bool active;             // Whether role is active
}
```

#### 4.1.3 State Variables

```solidity
// Mapping from address to member details
mapping(address => FactionMember) private _members;

// Mapping from faction ID to faction information
mapping(uint8 => FactionInfo) private _factions;

// Mapping from faction ID to member addresses
mapping(uint8 => address[]) private _factionMembers;

// Mapping from faction ID to role ID to role details
mapping(uint8 => mapping(uint8 => FactionRole)) private _factionRoles;

// Constants
uint8 public constant LAW_ENFORCEMENT = 1;
uint8 public constant CRIMINAL_SYNDICATE = 2;
uint8 public constant VIGILANTE = 3;
uint8 public constant MAX_RANK = 10;
```

#### 4.1.4 Access Control

```solidity
// Roles
bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
bytes32 public constant FACTION_MANAGER_ROLE = keccak256("FACTION_MANAGER_ROLE");
bytes32 public constant REPUTATION_MANAGER_ROLE = keccak256("REPUTATION_MANAGER_ROLE");
```

#### 4.1.5 Functions

```solidity
/**
 * @dev Initializes the FactionRegistry with default factions
 */
function initialize(
    address admin,
    address factionManager,
    address reputationManager
) external initializer;

/**
 * @dev Allows a user to join a faction
 * @param factionId The ID of the faction to join
 */
function joinFaction(uint8 factionId) external;

/**
 * @dev Allows a user to leave their current faction
 */
function leaveFaction() external;

/**
 * @dev Updates a member's rank within their faction
 * @param member The address of the member
 * @param newRank The new rank value
 */
function updateRank(address member, uint8 newRank) external onlyRole(FACTION_MANAGER_ROLE);

/**
 * @dev Increases a member's reputation within their faction
 * @param member The address of the member
 * @param amount The amount to increase reputation by
 */
function increaseReputation(address member, uint256 amount) external onlyRole(REPUTATION_MANAGER_ROLE);

/**
 * @dev Decreases a member's reputation within their faction
 * @param member The address of the member
 * @param amount The amount to decrease reputation by
 */
function decreaseReputation(address member, uint256 amount) external onlyRole(REPUTATION_MANAGER_ROLE);

/**
 * @dev Updates a faction's influence score
 * @param factionId The ID of the faction
 * @param newInfluence The new influence score
 */
function updateFactionInfluence(uint8 factionId, uint256 newInfluence) external onlyRole(FACTION_MANAGER_ROLE);

/**
 * @dev Gets a member's details
 * @param member The address of the member
 * @return factionId The ID of the member's faction
 * @return rank The member's rank
 * @return reputation The member's reputation score
 * @return joinedAt When the member joined
 * @return active Whether the member is active
 */
function getMemberDetails(address member) external view returns (
    uint8 factionId,
    uint8 rank,
    uint256 reputation,
    uint256 joinedAt,
    bool active
);

/**
 * @dev Gets faction information
 * @param factionId The ID of the faction
 * @return name The name of the faction
 * @return description The description of the faction
 * @return totalMembers The total number of members in the faction
 * @return totalReputation The combined reputation of all members
 * @return influenceScore The faction's influence score
 * @return active Whether the faction is active
 */
function getFactionInfo(uint8 factionId) external view returns (
    string memory name,
    string memory description,
    uint256 totalMembers,
    uint256 totalReputation,
    uint256 influenceScore,
    bool active
);

/**
 * @dev Gets all members of a faction
 * @param factionId The ID of the faction
 * @return An array of member addresses
 */
function getFactionMembers(uint8 factionId) external view returns (address[] memory);

/**
 * @dev Gets the faction with the highest influence
 * @return The ID of the dominant faction
 */
function getDominantFaction() external view returns (uint8);

/**
 * @dev Checks if a user has a specific role within their faction
 * @param member The address of the member
 * @param roleId The ID of the role to check
 * @return Whether the member has the specified role
 */
function hasFactionRole(address member, uint8 roleId) external view returns (bool);

/**
 * @dev Gets top-ranked members of a faction
 * @param factionId The ID of the faction
 * @param count The number of top members to return
 * @return An array of member addresses sorted by rank and reputation
 */
function getTopFactionMembers(uint8 factionId, uint256 count) external view returns (address[] memory);
```

#### 4.1.6 Events

```solidity
/**
 * @dev Emitted when a user joins a faction
 */
event MemberJoined(address indexed member, uint8 indexed factionId);

/**
 * @dev Emitted when a user leaves a faction
 */
event MemberLeft(address indexed member, uint8 indexed factionId);

/**
 * @dev Emitted when a member's rank changes
 */
event RankChanged(address indexed member, uint8 indexed factionId, uint8 oldRank, uint8 newRank);

/**
 * @dev Emitted when a member's reputation changes
 */
event ReputationChanged(address indexed member, uint8 indexed factionId, uint256 oldReputation, uint256 newReputation);

/**
 * @dev Emitted when a faction's influence score is updated
 */
event InfluenceUpdated(uint8 indexed factionId, uint256 oldInfluence, uint256 newInfluence);

/**
 * @dev Emitted when a new faction role is created
 */
event RoleCreated(uint8 indexed factionId, uint8 indexed roleId, string name, uint8 minimumRank, uint256 reputationThreshold);

/**
 * @dev Emitted when a faction role is updated
 */
event RoleUpdated(uint8 indexed factionId, uint8 indexed roleId, string name, uint8 minimumRank, uint256 reputationThreshold);
```

#### 4.1.7 Implementation Notes

1. Use AccessControl from OpenZeppelin for role-based permissions
2. Implement using the UUPS upgradeable pattern
3. Optimize storage by using compact structs and efficient data layouts
4. Ensure proper validation of all faction and rank values
5. Use the FactionLibrary for reputation calculations and role eligibility checks

### 4.2 TerritoryRegistry

#### 4.2.1 Purpose

The TerritoryRegistry defines and manages territory zones and their properties, serving as the source of truth for territory data in the Faction Wars ecosystem. It tracks economic values, resource generation rates, and faction control status for all territories.

#### 4.2.2 Data Structures

```solidity
/**
 * @dev Structure to define a territory zone
 */
struct Territory {
    string name;                     // Territory name
    uint8 zoneType;                  // 1=High-Security, 2=Medium-Security, 3=No-Go Zone
    uint256 baseValue;               // Base economic value
    uint256 resourceGenerationRate;  // Resources generated per block
    uint8 controllingFaction;        // 0=None, 1=Law Enforcement, 2=Criminal, 3=Vigilante
    uint256 lastUpdateBlock;         // Last block when territory state was updated
    bool contested;                  // Whether territory is currently contested
    bool active;                     // Whether territory is active
}

/**
 * @dev Structure for territory economic data
 */
struct TerritoryEconomics {
    uint256 totalValueLocked;        // Total value of assets in territory
    uint256 dailyTransactionVolume;  // Average daily transaction volume
    uint256 resourceBalance;         // Current unallocated resources
    uint256 taxRate;                 // Territory-specific tax rate (basis points)
    uint256 lastEconomicUpdate;      // Timestamp of last economic update
}
```

#### 4.2.3 State Variables

```solidity
// Mapping from territory ID to territory details
mapping(uint256 => Territory) private _territories;

// Mapping from territory ID to economic data
mapping(uint256 => TerritoryEconomics) private _economics;

// Array of all territory IDs
uint256[] private _territoryIds;

// Mapping from faction ID to array of controlled territory IDs
mapping(uint8 => uint256[]) private _factionTerritories;

// Counter for territory IDs
uint256 private _nextTerritoryId;

// Constants
uint8 public constant HIGH_SECURITY_ZONE = 1;
uint8 public constant MEDIUM_SECURITY_ZONE = 2;
uint8 public constant NO_GO_ZONE = 3;
```

#### 4.2.4 Access Control

```solidity
// Roles
bytes32 public constant TERRITORY_MANAGER_ROLE = keccak256("TERRITORY_MANAGER_ROLE");
bytes32 public constant CONTROL_MANAGER_ROLE = keccak256("CONTROL_MANAGER_ROLE");
bytes32 public constant ECONOMICS_MANAGER_ROLE = keccak256("ECONOMICS_MANAGER_ROLE");
```

#### 4.2.5 Functions

```solidity
/**
 * @dev Initializes the TerritoryRegistry
 */
function initialize(
    address admin,
    address territoryManager,
    address controlManager,
    address economicsManager
) external initializer;

/**
 * @dev Creates a new territory
 * @param name The name of the territory
 * @param zoneType The type of zone (1=High-Security, 2=Medium-Security, 3=No-Go)
 * @param baseValue The base economic value of the territory
 * @param resourceGenerationRate The rate at which this territory generates resources
 * @return territoryId The ID of the created territory
 */
function createTerritory(
    string calldata name,
    uint8 zoneType,
    uint256 baseValue,
    uint256 resourceGenerationRate
) external onlyRole(TERRITORY_MANAGER_ROLE) returns (uint256);

/**
 * @dev Updates a territory's economic value
 * @param territoryId The ID of the territory
 * @param newValue The new economic value
 */
function updateTerritoryValue(uint256 territoryId, uint256 newValue) external onlyRole(ECONOMICS_MANAGER_ROLE);

/**
 * @dev Updates a territory's resource generation rate
 * @param territoryId The ID of the territory
 * @param newRate The new resource generation rate
 */
function updateResourceGenerationRate(uint256 territoryId, uint256 newRate) external onlyRole(TERRITORY_MANAGER_ROLE);

/**
 * @dev Sets a territory's controlling faction
 * @param territoryId The ID of the territory
 * @param factionId The ID of the controlling faction (0=None, 1=Law Enforcement, 2=Criminal, 3=Vigilante)
 */
function setControllingFaction(uint256 territoryId, uint8 factionId) external onlyRole(CONTROL_MANAGER_ROLE);

/**
 * @dev Sets a territory's contested status
 * @param territoryId The ID of the territory
 * @param contested Whether the territory is contested
 */
function setContestedStatus(uint256 territoryId, bool contested) external onlyRole(CONTROL_MANAGER_ROLE);

/**
 * @dev Gets the details of a territory
 * @param territoryId The ID of the territory
 * @return name The name of the territory
 * @return zoneType The type of zone
 * @return baseValue The base economic value
 * @return resourceGenerationRate The resource generation rate
 * @return controllingFaction The controlling faction
 * @return lastUpdateBlock The last update block
 * @return contested Whether the territory is contested
 */
function getTerritoryDetails(uint256 territoryId) external view returns (
    string memory name,
    uint8 zoneType,
    uint256 baseValue,
    uint256 resourceGenerationRate,
    uint8 controllingFaction,
    uint256 lastUpdateBlock,
    bool contested
);

/**
 * @dev Gets the economics data for a territory
 * @param territoryId The ID of the territory
 * @return The territory economics struct
 */
function getTerritoryEconomics(uint256 territoryId) external view returns (TerritoryEconomics memory);

/**
 * @dev Gets the number of territories
 * @return The total number of territories
 */
function getTerritoriesCount() external view returns (uint256);

/**
 * @dev Gets all territories controlled by a faction
 * @param factionId The ID of the faction
 * @return An array of territory IDs controlled by the faction
 */
function getTerritoriesByFaction(uint8 factionId) external view returns (uint256[] memory);

/**
 * @dev Calculates the current value of a territory based on its base value and other factors
 * @param territoryId The ID of the territory
 * @return The current economic value of the territory
 */
function calculateTerritoryValue(uint256 territoryId) external view returns (uint256);

/**
 * @dev Calculates the resources generated by a territory since the last update
 * @param territoryId The ID of the territory
 * @return The amount of resources generated
 */
function calculateResourcesGenerated(uint256 territoryId) external view returns (uint256);

/**
 * @dev Updates territory economic data
 * @param territoryId The ID of the territory
 * @param totalValueLocked New total value locked
 * @param dailyTransactionVolume New daily transaction volume
 */
function updateTerritoryEconomics(
    uint256 territoryId,
    uint256 totalValueLocked,
    uint256 dailyTransactionVolume
) external onlyRole(ECONOMICS_MANAGER_ROLE);

/**
 * @dev Sets the tax rate for a territory
 * @param territoryId The ID of the territory
 * @param taxRate The new tax rate in basis points
 */
function setTerritoryTaxRate(uint256 territoryId, uint256 taxRate) external onlyRole(ECONOMICS_MANAGER_ROLE);
```

#### 4.2.6 Events

```solidity
/**
 * @dev Emitted when a new territory is created
 */
event TerritoryCreated(uint256 indexed territoryId, string name, uint8 zoneType, uint256 baseValue);

/**
 * @dev Emitted when a territory's controlling faction changes
 */
event TerritoryControlChanged(uint256 indexed territoryId, uint8 oldFaction, uint8 newFaction);

/**
 * @dev Emitted when a territory's economic value is updated
 */
event TerritoryValueUpdated(uint256 indexed territoryId, uint256 oldValue, uint256 newValue);

/**
 * @dev Emitted when a territory's resource generation rate is updated
 */
event ResourceRateUpdated(uint256 indexed territoryId, uint256 oldRate, uint256 newRate);

/**
 * @dev Emitted when a territory's contested status changes
 */
event TerritoryContestedStatusChanged(uint256 indexed territoryId, bool contested);

/**
 * @dev Emitted when a territory's economics data is updated
 */
event TerritoryEconomicsUpdated(uint256 indexed territoryId, uint256 totalValueLocked, uint256 dailyTransactionVolume);

/**
 * @dev Emitted when a territory's tax rate is changed
 */
event TerritoryTaxRateChanged(uint256 indexed territoryId, uint256 oldRate, uint256 newRate);
```

#### 4.2.7 Implementation Notes

1. Use TerritoryLibrary for territory value and resource calculations
2. Implement UUPS upgradeable pattern
3. Optimize for batch operations where territories need to be updated
4. Store territory coordinates or boundaries if needed for game integration
5. Ensure proper validation of territory parameters using ValidationLibrary

### 4.3 TerritoryStaking

#### 4.3.1 Purpose

The TerritoryStaking contract manages token staking for territory control, distributes rewards to stakers, and resolves contested territory situations. It serves as the primary mechanism for determining faction control over territories and implements the economic incentives for territorial competition.

#### 4.3.2 Data Structures

```solidity
/**
 * @dev Structure to define a stake
 */
struct Stake {
    address staker;         // Address of the staker
    uint256 territoryId;    // ID of the territory
    uint256 amount;         // Amount of tokens staked
    uint8 factionId;        // Faction ID the staker belongs to
    uint256 startTime;      // When the stake was created
    uint256 lastClaimTime;  // When rewards were last claimed
    bool active;            // Whether the stake is active
}

/**
 * @dev Structure for territory staking info
 */
struct TerritoryStakingInfo {
    uint256 totalStaked;               // Total tokens staked on territory
    mapping(uint8 => uint256) factionStakes; // Total stakes by faction
    uint256 rewardRate;                // Current reward rate
    uint256 lastUpdateTime;            // Last time staking info was updated
    bool autoCompound;                 // Whether rewards auto-compound
}
```

#### 4.3.3 State Variables

```solidity
// Reference to AlstraToken contract
IAlstraToken private _alstraToken;

// Reference to TerritoryRegistry contract
ITerritoryRegistry private _territoryRegistry;

// Reference to FactionRegistry contract
IFactionRegistry private _factionRegistry;

// Mapping from stake ID to stake details
mapping(uint256 => Stake) private _stakes;

// Mapping from territory ID to staking info
mapping(uint256 => TerritoryStakingInfo) private _territoryStakingInfo;

// Mapping from user address to user's stake IDs
mapping(address => uint256[]) private _userStakes;

// Mapping from territory ID to stake IDs
mapping(uint256 => uint256[]) private _territoryStakes;

// Counter for stake IDs
uint256 private _nextStakeId;

// Settings
uint256 public contestThreshold;        // Threshold for contested status (e.g., 5% = 500)
uint256 public minimumStakeAmount;      // Minimum amount that can be staked
uint256 public baseRewardRate;          // Base reward rate per block
uint256 public rewardPercentage;        // Percentage of fees allocated to rewards
bool public emergencyMode;              // Emergency flag to pause staking
```

#### 4.3.4 Access Control

```solidity
// Roles
bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
bytes32 public constant RATE_SETTER_ROLE = keccak256("RATE_SETTER_ROLE");
bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
```

#### 4.3.5 Functions

```solidity
/**
 * @dev Initializes the TerritoryStaking contract
 */
function initialize(
    address admin,
    address alstraToken,
    address territoryRegistry,
    address factionRegistry,
    uint256 initialContestThreshold,
    uint256 initialMinimumStake,
    uint256 initialBaseRewardRate
) external initializer;

/**
 * @dev Stakes tokens for territory control
 * @param territoryId The ID of the territory
 * @param amount The amount of tokens to stake
 * @return stakeId The ID of the created stake
 */
function stakeForTerritory(
    uint256 territoryId,
    uint256 amount
) external returns (uint256);

/**
 * @dev Unstakes tokens from a territory
 * @param stakeId The ID of the stake to withdraw
 */
function unstake(uint256 stakeId) external;

/**
 * @dev Claims rewards from staking
 * @param stakeId The ID of the stake to claim rewards for
 * @return rewards The amount of rewards claimed
 */
function claimRewards(uint256 stakeId) external returns (uint256 rewards);

/**
 * @dev Batch claims rewards from multiple stakes
 * @param stakeIds Array of stake IDs to claim rewards for
 * @return totalRewards The total amount of rewards claimed
 */
function batchClaimRewards(uint256[] calldata stakeIds) external returns (uint256 totalRewards);

/**
 * @dev Adds additional tokens to an existing stake
 * @param stakeId The ID of the stake
 * @param additionalAmount The additional amount to stake
 */
function increaseStake(uint256 stakeId, uint256 additionalAmount) external;

/**
 * @dev Withdraws a portion of staked tokens
 * @param stakeId The ID of the stake
 * @param amount The amount to withdraw
 */
function partialUnstake(uint256 stakeId, uint256 amount) external;

/**
 * @dev Updates the territory control based on current stakes
 * @param territoryId The ID of the territory to update
 */
function updateTerritoryControl(uint256 territoryId) external;

/**
 * @dev Batch updates territory control for multiple territories
 * @param territoryIds Array of territory IDs to update
 */
function batchUpdateTerritoryControl(uint256[] calldata territoryIds) external;

/**
 * @dev Sets the reward rate for a specific territory
 * @param territoryId The ID of the territory
 * @param newRewardRate The new reward rate
 */
function setTerritoryRewardRate(uint256 territoryId, uint256 newRewardRate) external onlyRole(RATE_SETTER_ROLE);

/**
 * @dev Sets the base reward rate for all territories
 * @param newBaseRate The new base reward rate
 */
function setBaseRewardRate(uint256 newBaseRate) external onlyRole(RATE_SETTER_ROLE);

/**
 * @dev Sets the contest threshold
 * @param newThreshold The new contest threshold in basis points
 */
function setContestThreshold(uint256 newThreshold) external onlyRole(ADMIN_ROLE);

/**
 * @dev Sets the minimum stake amount
 * @param newMinimum The new minimum stake amount
 */
function setMinimumStakeAmount(uint256 newMinimum) external onlyRole(ADMIN_ROLE);

/**
 * @dev Enables or disables emergency mode
 * @param enabled Whether emergency mode should be enabled
 */
function setEmergencyMode(bool enabled) external onlyRole(EMERGENCY_ROLE);

/**
 * @dev Emergency withdrawal of all stakes by a user
 * Only available in emergency mode
 */
function emergencyWithdrawAll() external;

/**
 * @dev Gets the details of a stake
 * @param stakeId The ID of the stake
 * @return stake The stake details
 */
function getStakeDetails(uint256 stakeId) external view returns (Stake memory stake);

/**
 * @dev Gets the staking info for a territory
 * @param territoryId The ID of the territory
 * @return totalStaked Total staked on the territory
 * @return factionStakes Array of stakes by faction (indexed by faction ID)
 * @return rewardRate Current reward rate
 * @return lastUpdateTime Last update time
 * @return autoCompound Whether rewards auto-compound
 */
function getTerritoryStakingInfo(uint256 territoryId) external view returns (
    uint256 totalStaked,
    uint256[] memory factionStakes,
    uint256 rewardRate,
    uint256 lastUpdateTime,
    bool autoCompound
);

/**
 * @dev Gets all active stakes for a territory
 * @param territoryId The ID of the territory
 * @return An array of stake IDs for the territory
 */
function getStakesByTerritory(uint256 territoryId) external view returns (uint256[] memory);

/**
 * @dev Gets all active stakes for a user
 * @param staker The address of the staker
 * @return An array of stake IDs for the user
 */
function getStakesByUser(address staker) external view returns (uint256[] memory);

/**
 * @dev Gets the total amount staked for a territory
 * @param territoryId The ID of the territory
 * @return The total amount staked
 */
function getTotalStakedForTerritory(uint256 territoryId) external view returns (uint256);

/**
 * @dev Gets the total amount staked by a faction for a territory
 * @param territoryId The ID of the territory
 * @param factionId The ID of the faction
 * @return The total amount staked by the faction
 */
function getFactionStakeForTerritory(uint256 territoryId, uint8 factionId) external view returns (uint256);

/**
 * @dev Calculates the controlling faction for a territory
 * @param territoryId The ID of the territory
 * @return The ID of the controlling faction (0 if none)
 */
function calculateControllingFaction(uint256 territoryId) external view returns (uint8);

/**
 * @dev Checks if a territory is contested (close competition between factions)
 * @param territoryId The ID of the territory
 * @return Whether the territory is contested
 */
function isContested(uint256 territoryId) external view returns (bool);

/**
 * @dev Calculates the pending rewards for a stake
 * @param stakeId The ID of the stake
 * @return The amount of pending rewards
 */
function calculatePendingRewards(uint256 stakeId) external view returns (uint256);

/**
 * @dev Gets the reward rate for a territory
 * @param territoryId The ID of the territory
 * @return The reward rate (tokens per block per staked token)
 */
function getTerritoryRewardRate(uint256 territoryId) external view returns (uint256);
```

#### 4.3.6 Events

```solidity
/**
 * @dev Emitted when tokens are staked for a territory
 */
event TokensStaked(address indexed staker, uint256 indexed territoryId, uint256 amount, uint8 factionId, uint256 stakeId);

/**
 * @dev Emitted when staked tokens are withdrawn
 */
event TokensUnstaked(address indexed staker, uint256 indexed territoryId, uint256 amount, uint256 stakeId);

/**
 * @dev Emitted when a user claims staking rewards
 */
event RewardsClaimed(address indexed staker, uint256 indexed territoryId, uint256 amount, uint256 stakeId);

/**
 * @dev Emitted when a stake is increased
 */
event StakeIncreased(uint256 indexed stakeId, uint256 additionalAmount, uint256 newTotal);

/**
 * @dev Emitted when a portion of a stake is withdrawn
 */
event PartialUnstake(uint256 indexed stakeId, uint256 amount, uint256 remaining);

/**
 * @dev Emitted when a faction gains control of a territory
 */
event TerritoryControlGained(uint256 indexed territoryId, uint8 factionId);

/**
 * @dev Emitted when a territory becomes contested
 */
event TerritoryContested(uint256 indexed territoryId, uint8 currentController, uint8 challenger);

/**
 * @dev Emitted when the reward rate for a territory is updated
 */
event TerritoryRewardRateUpdated(uint256 indexed territoryId, uint256 oldRate, uint256 newRate);

/**
 * @dev Emitted when the base reward rate is updated
 */
event BaseRewardRateUpdated(uint256 oldRate, uint256 newRate);

/**
 * @dev Emitted when the contest threshold is updated
 */
event ContestThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

/**
 * @dev Emitted when the minimum stake amount is updated
 */
event MinimumStakeAmountUpdated(uint256 oldMinimum, uint256 newMinimum);

/**
 * @dev Emitted when emergency mode is toggled
 */
event EmergencyModeChanged(bool enabled);

/**
 * @dev Emitted when an emergency withdrawal is made
 */
event EmergencyWithdrawal(address indexed staker, uint256[] stakeIds, uint256 totalAmount);
```

#### 4.3.7 Implementation Notes

1. Use StakingLibrary for calculating rewards and determining controlling factions
2. Implement reentrancy protection for all functions that transfer tokens
3. Use efficient batch processing for operations affecting multiple stakes or territories
4. Optimize gas usage by updating territory control only when stake changes are significant
5. Implement emergency withdrawal functionality in case of critical issues
6. Use the UUPS upgradeable pattern for future enhancements

### 4.4 TreasuryManagement

#### 4.4.1 Purpose

The TreasuryManagement contract manages DAO funds and assets, implements spending authorizations, tracks income and expenditures, and provides multi-signature controls for security. It interfaces with the governance system to ensure decentralized control of funds while enabling efficient treasury operations.

#### 4.4.2 Data Structures

```solidity
/**
 * @dev Structure to define treasury allocation
 */
struct TreasuryAllocation {
    uint256 operationalFunds; // Funds for day-to-day operations
    uint256 developmentFunds; // Funds for game development
    uint256 marketingFunds;   // Funds for marketing initiatives
    uint256 communityFunds;   // Funds for community rewards
    uint256 reserveFunds;     // Emergency reserve funds
}

/**
 * @dev Structure to define faction treasury details
 */
struct FactionTreasury {
    uint256 balance;            // Current balance
    uint256 totalReceived;      // Total funds received over time
    uint256 totalSpent;         // Total funds spent over time
    uint256 lastUpdateBlock;    // Block when last updated
}

/**
 * @dev Structure for spending request
 */
struct SpendRequest {
    uint256 id;                 // Request ID
    address proposer;           // Address that proposed the spending
    address recipient;          // Recipient address
    uint256 amount;             // Amount to spend
    string purpose;             // Purpose of the spending
    uint256 proposalId;         // Associated governance proposal ID (if any)
    bool executed;              // Whether the request has been executed
    uint256 createdAt;          // When the request was created
    uint8 requiredApprovals;    // Number of approvals required
    address[] approvers;        // Addresses that approved the request
}
```

#### 4.4.3 State Variables

```solidity
// Reference to AlstraToken contract
IAlstraToken private _alstraToken;

// Reference to BaseGovernor contract
IBaseGovernor private _governor;

// Reference to FactionRegistry contract
IFactionRegistry private _factionRegistry;

// Treasury allocation
TreasuryAllocation private _allocation;

// Mapping from faction ID to faction treasury details
mapping(uint8 => FactionTreasury) private _factionTreasuries;

// Mapping from spend request ID to request details
mapping(uint256 => SpendRequest) private _spendRequests;

// Counter for spend request IDs
uint256 private _nextSpendRequestId;

// Last revenue distribution timestamp
uint256 private _lastDistribution;

// Revenue distribution interval
uint256 private _distributionInterval;

// Total revenue distributed
uint256 private _totalDistributed;

// Distribution percentages
uint256 public daoPercentage;        // Percentage for DAO treasury
uint256 public factionPercentage;     // Percentage for faction treasuries
uint256 public burnPercentage;        // Percentage to burn
```

#### 4.4.4 Access Control

```solidity
// Roles
bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
bytes32 public constant TREASURY_MANAGER_ROLE = keccak256("TREASURY_MANAGER_ROLE");
bytes32 public constant DISTRIBUTION_MANAGER_ROLE = keccak256("DISTRIBUTION_MANAGER_ROLE");
bytes32 public constant FACTION_SPENDER_ROLE = keccak256("FACTION_SPENDER_ROLE");
```

#### 4.4.5 Functions

```solidity
/**
 * @dev Initializes the TreasuryManagement contract
 */
function initialize(
    address admin,
    address treasuryManager,
    address distributionManager,
    address alstraToken,
    address governor,
    address factionRegistry,
    uint256 initialDistributionInterval
) external initializer;

/**
 * @dev Allows depositing funds to the treasury
 * @param note A note explaining the purpose of the deposit
 */
function depositFunds(string calldata note) external payable;

/**
 * @dev Deposits Alstra tokens to the treasury
 * @param amount The amount of tokens to deposit
 * @param note A note explaining the purpose of the deposit
 */
function depositAlstra(uint256 amount, string calldata note) external;

/**
 * @dev Spends funds from the treasury - can only be called by the governor's executor (timelock)
 * @param recipient The recipient address for the funds
 * @param amount The amount to spend
 * @param purpose The purpose of the spending
 * @param proposalId The ID of the governance proposal authorizing this spend
 * @return success Whether the spending was successful
 */
function spendFunds(
    address payable recipient,
    uint256 amount,
    string calldata purpose,
    uint256 proposalId
) external returns (bool success);

/**
 * @dev Spends Alstra tokens from the treasury - can only be called by the governor's executor
 * @param recipient The recipient address for the tokens
 * @param amount The amount to spend
 * @param purpose The purpose of the spending
 * @param proposalId The ID of the governance proposal authorizing this spend
 * @return success Whether the spending was successful
 */
function spendAlstra(
    address recipient,
    uint256 amount,
    string calldata purpose,
    uint256 proposalId
) external returns (bool success);

/**
 * @dev Updates the treasury allocations - can only be called by the governor's executor (timelock)
 * @param operationalFunds New allocation for operational funds
 * @param developmentFunds New allocation for development funds
 * @param marketingFunds New allocation for marketing funds
 * @param communityFunds New allocation for community funds
 * @param reserveFunds New allocation for reserve funds
 * @return success Whether the update was successful
 */
function updateTreasuryAllocations(
    uint256 operationalFunds,
    uint256 developmentFunds,
    uint256 marketingFunds,
    uint256 communityFunds,
    uint256 reserveFunds
) external returns (bool success);

/**
 * @dev Transfers funds between faction treasuries - can only be called by the governor's executor (timelock)
 * @param fromFaction The faction ID to transfer from
 * @param toFaction The faction ID to transfer to
 * @param amount The amount to transfer
 * @param reason The reason for the transfer
 * @return success Whether the transfer was successful
 */
function transferBetweenFactions(
    uint8 fromFaction,
    uint8 toFaction,
    uint256 amount,
    string calldata reason
) external returns (bool success);

/**
 * @dev Distributes revenue to faction treasuries based on territory control
 * This can be called periodically by authorized roles or through governance
 * @return totalDistributed The total amount distributed
 */
function distributeRevenue() external returns (uint256 totalDistributed);

/**
 * @dev Creates a spend request for multi-signature approval
 * @param recipient The recipient address
 * @param amount The amount to spend
 * @param purpose The purpose of the spending
 * @param requiredApprovals Number of approvals needed
 * @return requestId The ID of the created request
 */
function createSpendRequest(
    address recipient,
    uint256 amount,
    string calldata purpose,
    uint8 requiredApprovals
) external onlyRole(TREASURY_MANAGER_ROLE) returns (uint256 requestId);

/**
 * @dev Approves a spend request
 * @param requestId The ID of the request to approve
 */
function approveSpendRequest(uint256 requestId) external onlyRole(TREASURY_MANAGER_ROLE);
/**
 * @dev Executes an approved spend request
 * @param requestId The ID of the request to execute
 * @return success Whether the execution was successful
 */
function executeSpendRequest(uint256 requestId) external onlyRole(TREASURY_MANAGER_ROLE) returns (bool success);

/**
 * @dev Cancels a pending spend request
 * @param requestId The ID of the request to cancel
 */
function cancelSpendRequest(uint256 requestId) external onlyRole(TREASURY_MANAGER_ROLE);

/**
 * @dev Releases funds from a faction treasury to an authorized recipient - can only be called by the governor's executor (timelock)
 * @param factionId The faction ID
 * @param recipient The recipient address
 * @param amount The amount to release
 * @param purpose The purpose of the spending
 * @return success Whether the release was successful
 */
function releaseFactionFunds(
    uint8 factionId,
    address payable recipient,
    uint256 amount,
    string calldata purpose
) external returns (bool success);

/**
 * @dev Releases Alstra tokens from a faction treasury
 * @param factionId The faction ID
 * @param recipient The recipient address
 * @param amount The amount to release
 * @param purpose The purpose of the spending
 * @return success Whether the release was successful
 */
function releaseFactionAlstra(
    uint8 factionId,
    address recipient,
    uint256 amount,
    string calldata purpose
) external returns (bool success);

/**
 * @dev Updates the distribution percentages
 * @param newDaoPercentage New percentage for DAO treasury
 * @param newFactionPercentage New percentage for faction treasuries
 * @param newBurnPercentage New percentage to burn
 */
function updateDistributionPercentages(
    uint256 newDaoPercentage,
    uint256 newFactionPercentage,
    uint256 newBurnPercentage
) external onlyRole(ADMIN_ROLE);

/**
 * @dev Updates the distribution interval
 * @param newInterval New interval in seconds
 */
function updateDistributionInterval(uint256 newInterval) external onlyRole(ADMIN_ROLE);

/**
 * @dev Gets the current treasury balance
 * @return The balance of the treasury in native currency
 */
function getTreasuryBalance() external view returns (uint256);

/**
 * @dev Gets the current treasury Alstra token balance
 * @return The Alstra token balance of the treasury
 */
function getTreasuryAlstraBalance() external view returns (uint256);

/**
 * @dev Gets the current treasury allocations
 * @return operationalFunds The allocation for operational funds
 * @return developmentFunds The allocation for development funds
 * @return marketingFunds The allocation for marketing funds
 * @return communityFunds The allocation for community funds
 * @return reserveFunds The allocation for reserve funds
 */
function getTreasuryAllocations() external view returns (
    uint256 operationalFunds,
    uint256 developmentFunds,
    uint256 marketingFunds,
    uint256 communityFunds,
    uint256 reserveFunds
);

/**
 * @dev Gets the balance of a faction's treasury
 * @param factionId The ID of the faction
 * @return balance The current balance
 * @return totalReceived Total ever received
 * @return totalSpent Total ever spent
 * @return lastUpdateBlock Block when last updated
 */
function getFactionTreasuryDetails(uint8 factionId) external view returns (
    uint256 balance,
    uint256 totalReceived,
    uint256 totalSpent,
    uint256 lastUpdateBlock
);

/**
 * @dev Gets information about the territory revenue distribution
 * @return lastDistribution The timestamp of the last distribution
 * @return distributionInterval The interval between distributions
 * @return totalDistributed Total amount ever distributed
 * @return nextEstimatedDistribution Estimated amount for next distribution
 */
function getRevenueDistributionInfo() external view returns (
    uint256 lastDistribution,
    uint256 distributionInterval,
    uint256 totalDistributed,
    uint256 nextEstimatedDistribution
);

/**
 * @dev Gets details of a spend request
 * @param requestId The ID of the request
 * @return The spend request details
 */
function getSpendRequest(uint256 requestId) external view returns (SpendRequest memory);

/**
 * @dev Generates a proposal description for a treasury spending action
 * Helper function for creating governance proposals
 * @param recipient The recipient address
 * @param amount The amount to spend
 * @param purpose The purpose of the spending
 * @return The formatted proposal description
 */
function formatSpendProposal(
    address recipient,
    uint256 amount,
    string calldata purpose
) external pure returns (string memory);

/**
 * @dev Gets all the data needed for a governance proposal to spend funds
 * Helper function for creating governance proposals
 * @param recipient The recipient address
 * @param amount The amount to spend
 * @param purpose The purpose of the spending
 * @return target The target contract address (this contract)
 * @return value The ETH value to send (0 for this function)
 * @return signature The function signature
 * @return callData The encoded call data
 * @return description The proposal description
 */
function getSpendProposalData(
    address payable recipient,
    uint256 amount,
    string calldata purpose
) external view returns (
    address target,
    uint256 value,
    string memory signature,
    bytes memory callData,
    string memory description
);
```

#### 4.4.6 Events

```solidity
/**
 * @dev Emitted when funds are deposited to the treasury
 */
event FundsDeposited(address indexed from, uint256 amount, string note);

/**
 * @dev Emitted when Alstra tokens are deposited to the treasury
 */
event AlstraDeposited(address indexed from, uint256 amount, string note);

/**
 * @dev Emitted when funds are spent from the treasury through governance
 */
event FundsSpent(uint256 indexed proposalId, address indexed recipient, uint256 amount, string purpose);

/**
 * @dev Emitted when Alstra tokens are spent from the treasury
 */
event AlstraSpent(uint256 indexed proposalId, address indexed recipient, uint256 amount, string purpose);

/**
 * @dev Emitted when treasury allocations are updated through governance
 */
event TreasuryAllocationsUpdated(
    uint256 operationalFunds,
    uint256 developmentFunds,
    uint256 marketingFunds,
    uint256 communityFunds,
    uint256 reserveFunds
);

/**
 * @dev Emitted when funds are transferred between faction treasuries
 */
event FactionTreasuryTransfer(uint8 indexed fromFaction, uint8 indexed toFaction, uint256 amount, string reason);

/**
 * @dev Emitted when revenue is distributed to faction treasuries based on territory control
 */
event RevenueDistributed(uint256 totalAmount, uint256 timestamp);

/**
 * @dev Emitted when a spend request is created
 */
event SpendRequestCreated(uint256 indexed requestId, address indexed proposer, address recipient, uint256 amount, string purpose);

/**
 * @dev Emitted when a spend request is approved
 */
event SpendRequestApproved(uint256 indexed requestId, address indexed approver);

/**
 * @dev Emitted when a spend request is executed
 */
event SpendRequestExecuted(uint256 indexed requestId, address recipient, uint256 amount);

/**
 * @dev Emitted when a spend request is canceled
 */
event SpendRequestCanceled(uint256 indexed requestId, address indexed canceledBy);

/**
 * @dev Emitted when funds are released from a faction treasury
 */
event FactionFundsReleased(uint8 indexed factionId, address indexed recipient, uint256 amount, string purpose);

/**
 * @dev Emitted when Alstra tokens are released from a faction treasury
 */
event FactionAlstraReleased(uint8 indexed factionId, address indexed recipient, uint256 amount, string purpose);

/**
 * @dev Emitted when distribution percentages are updated
 */
event DistributionPercentagesUpdated(uint256 daoPercentage, uint256 factionPercentage, uint256 burnPercentage);

/**
 * @dev Emitted when the distribution interval is updated
 */
event DistributionIntervalUpdated(uint256 oldInterval, uint256 newInterval);
```

#### 4.4.7 Implementation Notes

1. Use RevenueLibrary for calculating distribution amounts
2. Implement multi-signature approval flow for large expenditures
3. Integrate closely with BaseGovernor for governed treasury operations
4. Use reentrancy protection for all functions that transfer funds
5. Implement upgradeability using the UUPS pattern
6. Store large strings (like spending purposes) efficiently using events rather than in storage

### 4.5 NFTMarketplace

#### 4.5.1 Purpose

The NFTMarketplace contract provides a comprehensive trading platform for game assets, supporting both ERC721 and ERC1155 tokens with features like fixed-price listings, auctions, rentals, black market restrictions, and escrow trading. It integrates with faction and territory systems to provide faction-specific features and territorial advantages.

#### 4.5.2 Data Structures

```solidity
/**
 * @dev Enum for listing types
 */
enum ListingType {
    FixedPrice,
    Auction,
    Rental,
    BlackMarket,
    Escrow
}

/**
 * @dev Enum for NFT standard types
 */
enum NFTStandard {
    Unsupported,
    ERC721,
    ERC1155
}

/**
 * @dev Struct for standard listing information
 */
struct Listing {
    uint256 id;
    address seller;
    address nftContract;
    uint256 tokenId;
    uint256 quantity;
    uint256 price;
    ListingType listingType;
    bool active;
    uint256 createdAt;
    uint8 factionRequirement; // 0 = No requirement, 1-3 = Specific faction required
    uint8 minimumRank; // 0 = No rank requirement, 1+ = Minimum rank required
    uint256 territoryId; // 0 = No territory association
}

/**
 * @dev Struct for auction-specific information
 */
struct AuctionInfo {
    uint256 listingId;
    uint256 startingPrice;
    uint256 reservePrice;
    uint256 currentBid;
    address currentBidder;
    uint256 endTime;
    bool finalized;
}

/**
 * @dev Struct for rental-specific information
 */
struct RentalInfo {
    uint256 listingId;
    uint256 duration; // Duration in days
    uint256 pricePerDay;
    address currentRenter;
    uint256 startTime;
    uint256 endTime;
    bool active;
}

/**
 * @dev Struct for escrow trade information
 */
struct EscrowTrade {
    uint256 id;
    address initiator;
    address counterparty;
    address[] offerNftContracts;
    uint256[] offerTokenIds;
    uint256[] offerQuantities;
    address[] requestNftContracts;
    uint256[] requestTokenIds;
    uint256[] requestQuantities;
    uint256 initiatorAlstraAmount;
    uint256 counterpartyAlstraAmount;
    bool initiatorApproved;
    bool counterpartyApproved;
    bool completed;
    bool canceled;
    uint256 createdAt;
    uint256 expiresAt;
}

/**
 * @dev Struct for fee distribution configuration
 */
struct FeeDistribution {
    uint256 daoTreasuryPercentage;
    uint256 territoryControllerPercentage;
    uint256 sellerFactionPercentage;
    uint256 burnPercentage;
}
```

#### 4.5.3 State Variables

```solidity
// Reference to AlstraToken contract
IAlstraToken private _alstraToken;

// Reference to FactionRegistry contract
IFactionRegistry private _factionRegistry;

// Reference to TerritoryRegistry contract
ITerritoryRegistry private _territoryRegistry;

// Reference to TerritoryStaking contract
ITerritoryStaking private _territoryStaking;

// Reference to TreasuryManagement contract
ITreasuryManagement private _treasuryManagement;

// Marketplace fee percentage in basis points (e.g., 250 = 2.5%)
uint256 public marketplaceFeePercentage;

// Fee distribution configuration
FeeDistribution public feeDistribution;

// Mapping from listing ID to listing details
mapping(uint256 => Listing) private _listings;

// Mapping from listing ID to auction info
mapping(uint256 => AuctionInfo) private _auctions;

// Mapping from listing ID to rental info
mapping(uint256 => RentalInfo) private _rentals;

// Mapping from escrow trade ID to trade info
mapping(uint256 => EscrowTrade) private _escrowTrades;

// Mapping from NFT contract to token ID to active listing IDs
mapping(address => mapping(uint256 => uint256[])) private _tokenListings;

// Mapping from seller address to active listing IDs
mapping(address => uint256[]) private _sellerListings;

// Mapping from territory ID to active listing IDs
mapping(uint256 => uint256[]) private _territoryListings;

// Mapping from faction ID to active listing IDs
mapping(uint8 => uint256[]) private _factionListings;

// Counter for listing IDs
uint256 private _nextListingId;

// Counter for escrow trade IDs
uint256 private _nextTradeId;
```

#### 4.5.4 Access Control

```solidity
// Roles
bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");
bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
```

#### 4.5.5 Functions

```solidity
/**
 * @dev Initializes the NFTMarketplace contract
 */
function initialize(
    address admin,
    address feeManager,
    address alstraToken,
    address factionRegistry,
    address territoryRegistry,
    address territoryStaking,
    address treasuryManagement,
    uint256 initialFeePercentage,
    FeeDistribution memory initialFeeDistribution
) external initializer;

/**
 * @dev Creates a new fixed price listing
 * @param nftContract The address of the NFT contract
 * @param tokenId The ID of the token
 * @param quantity The quantity to sell (1 for ERC721)
 * @param price The price for the entire listing
 * @param territoryId Optional territory ID where the listing is available (0 if global)
 * @return listingId The ID of the created listing
 */
function createListing(
    address nftContract,
    uint256 tokenId,
    uint256 quantity,
    uint256 price,
    uint256 territoryId
) external returns (uint256);

/**
 * @dev Updates the price of an existing listing
 * @param listingId The ID of the listing to update
 * @param newPrice The new price for the listing
 */
function updateListingPrice(uint256 listingId, uint256 newPrice) external;

/**
 * @dev Purchases a listing at the listed price
 * @param listingId The ID of the listing to purchase
 */
function buyListing(uint256 listingId) external payable;

/**
 * @dev Purchases a listing using Alstra tokens instead of native currency
 * @param listingId The ID of the listing to purchase
 */
function buyListingWithAlstra(uint256 listingId) external;

/**
 * @dev Cancels a listing that hasn't been sold yet
 * @param listingId The ID of the listing to cancel
 */
function cancelListing(uint256 listingId) external;

/**
 * @dev Creates a black market listing with faction restrictions
 * @param nftContract The address of the NFT contract
 * @param tokenId The ID of the token
 * @param quantity The quantity to sell (1 for ERC721)
 * @param price The price for the entire listing
 * @param requiredFaction The faction ID required to purchase (1=Law Enforcement, 2=Criminal, 3=Vigilante)
 * @param minimumRank The minimum rank required to purchase
 * @return listingId The ID of the created listing
 */
function createBlackMarketListing(
    address nftContract,
    uint256 tokenId,
    uint256 quantity,
    uint256 price,
    uint8 requiredFaction,
    uint8 minimumRank
) external returns (uint256);

/**
 * @dev Creates an auction for an NFT
 * @param nftContract The address of the NFT contract
 * @param tokenId The ID of the token
 * @param quantity The quantity to sell (1 for ERC721)
 * @param startingPrice The starting price for the auction
 * @param reservePrice The minimum price that must be met (0 for no reserve)
 * @param duration The duration of the auction in seconds
 * @return listingId The ID of the created auction
 */
function createAuction(
    address nftContract,
    uint256 tokenId,
    uint256 quantity,
    uint256 startingPrice,
    uint256 reservePrice,
    uint256 duration
) external returns (uint256);

/**
 * @dev Places a bid on an auction
 * @param listingId The ID of the auction
 */
function placeBid(uint256 listingId) external payable;

/**
 * @dev Places a bid on an auction using Alstra tokens
 * @param listingId The ID of the auction
 * @param bidAmount The amount of Alstra tokens to bid
 */
function placeBidWithAlstra(uint256 listingId, uint256 bidAmount) external;

/**
 * @dev Finalizes an auction after it has ended
 * @param listingId The ID of the auction to finalize
 */
function finalizeAuction(uint256 listingId) external;

/**
 * @dev Creates a rental listing for an NFT
 * @param nftContract The address of the NFT contract
 * @param tokenId The ID of the token
 * @param pricePerDay The price per day in Alstra tokens
 * @param maxDuration The maximum rental duration in days
 * @return listingId The ID of the created rental listing
 */
function createRentalListing(
    address nftContract,
    uint256 tokenId,
    uint256 pricePerDay,
    uint256 maxDuration
) external returns (uint256);

/**
 * @dev Rents an asset from a rental listing
 * @param listingId The ID of the rental listing
 * @param durationInDays The number of days to rent for
 */
function rentAsset(uint256 listingId, uint256 durationInDays) external payable;

/**
 * @dev Rents an asset using Alstra tokens
 * @param listingId The ID of the rental listing
 * @param durationInDays The number of days to rent for
 */
function rentAssetWithAlstra(uint256 listingId, uint256 durationInDays) external;

/**
 * @dev Ends a rental and returns the asset to the owner
 * @param listingId The ID of the rental listing
 */
function endRental(uint256 listingId) external;

/**
 * @dev Claims an asset that has exceeded its rental period
 * @param listingId The ID of the rental listing
 */
function claimExpiredRental(uint256 listingId) external;

/**
 * @dev Creates an escrow trade between two parties
 * @param counterparty The address of the trade counterparty
 * @param offerNftContracts Array of NFT contract addresses being offered
 * @param offerTokenIds Array of token IDs being offered
 * @param offerQuantities Array of quantities being offered
 * @param requestNftContracts Array of NFT contract addresses being requested
 * @param requestTokenIds Array of token IDs being requested
 * @param requestQuantities Array of quantities being requested
 * @param initiatorAlstraAmount Amount of Alstra tokens offered by initiator (0 if none)
 * @param counterpartyAlstraAmount Amount of Alstra tokens requested from counterparty (0 if none)
 * @param expirationTime Timestamp when the trade offer expires (0 for no expiration)
 * @return tradeId The ID of the created escrow trade
 */
function createEscrowTrade(
    address counterparty,
    address[] calldata offerNftContracts,
    uint256[] calldata offerTokenIds,
    uint256[] calldata offerQuantities,
    address[] calldata requestNftContracts,
    uint256[] calldata requestTokenIds,
    uint256[] calldata requestQuantities,
    uint256 initiatorAlstraAmount,
    uint256 counterpartyAlstraAmount,
    uint256 expirationTime
) external returns (uint256);

/**
 * @dev Approves an escrow trade
 * @param tradeId The ID of the escrow trade
 */
function approveEscrowTrade(uint256 tradeId) external;

/**
 * @dev Cancels an escrow trade
 * @param tradeId The ID of the escrow trade
 */
function cancelEscrowTrade(uint256 tradeId) external;

/**
 * @dev Updates the marketplace fee percentage - only callable through governance
 * @param newFeePercentage The new fee percentage in basis points
 */
function updateMarketplaceFee(uint256 newFeePercentage) external;

/**
 * @dev Updates the fee distribution configuration - only callable through governance
 * @param newDistribution The new fee distribution configuration
 */
function updateFeeDistribution(FeeDistribution calldata newDistribution) external;

/**
 * @dev Updates the Alstra token address - only callable through governance
 * @param newAlstraToken The new Alstra token address
 */
function updateAlstraTokenAddress(address newAlstraToken) external;

/**
 * @dev Updates the FactionRegistry address - only callable through governance
 * @param newFactionRegistry The new FactionRegistry address
 */
function updateFactionRegistry(address newFactionRegistry) external;

/**
 * @dev Updates the TerritoryRegistry address - only callable through governance
 * @param newTerritoryRegistry The new TerritoryRegistry address
 */
function updateTerritoryRegistry(address newTerritoryRegistry) external;

/**
 * @dev Updates the TerritoryStaking address - only callable through governance
 * @param newTerritoryStaking The new TerritoryStaking address
 */
function updateTerritoryStaking(address newTerritoryStaking) external;

/**
 * @dev Updates the TreasuryManagement address - only callable through governance
 * @param newTreasuryManagement The new TreasuryManagement address
 */
function updateTreasuryManagement(address newTreasuryManagement) external;

/**
 * @dev Creates a governance proposal to update marketplace parameters
 * @param newFeePercentage The proposed new fee percentage
 * @param newDistribution The proposed new fee distribution
 * @return proposalId The ID of the created governance proposal
 */
function proposeMarketplaceParameterChange(
    uint256 newFeePercentage,
    FeeDistribution calldata newDistribution
) external returns (uint256);

/**
 * @dev Returns the current fee percentage charged by the marketplace
 * @return The fee percentage in basis points (e.g., 250 = 2.5%)
 */
function getMarketplaceFeePercentage() external view returns (uint256);

/**
 * @dev Returns the current fee distribution configuration
 * @return A FeeDistribution struct with the current fee allocation
 */
function getFeeDistribution() external view returns (FeeDistribution memory);

/**
 * @dev Returns the adjusted fee percentage for a territory
 * @param territoryId The ID of the territory
 * @return The fee percentage in basis points adjusted for territory control
 */
function getFeeForTerritory(uint256 territoryId) external view returns (uint256);

/**
 * @dev Returns whether a contract implements ERC721 or ERC1155
 * @param nftContract The address of the NFT contract to check
 * @return The NFT standard type
 */
function getNFTStandard(address nftContract) external view returns (NFTStandard);

/**
 * @dev Returns information about a listing
 * @param listingId The ID of the listing
 * @return The listing struct with all listing details
 */
function getListing(uint256 listingId) external view returns (Listing memory);

/**
 * @dev Returns information about an auction listing
 * @param listingId The ID of the auction listing
 * @return The auction information struct
 */
function getAuctionInfo(uint256 listingId) external view returns (AuctionInfo memory);

/**
 * @dev Returns information about a rental listing
 * @param listingId The ID of the rental listing
 * @return The rental information struct
 */
function getRentalInfo(uint256 listingId) external view returns (RentalInfo memory);

/**
 * @dev Returns information about an escrow trade
 * @param tradeId The ID of the escrow trade
 * @return The escrow trade struct
 */
function getEscrowTrade(uint256 tradeId) external view returns (EscrowTrade memory);

/**
 * @dev Checks if a user can purchase a specific listing
 * @param user The address of the user
 * @param listingId The ID of the listing
 * @return isAllowed Whether the user is allowed to purchase the listing
 * @return reason If not allowed, the reason why (empty string if allowed)
 */
function canPurchaseListing(address user, uint256 listingId) external view returns (bool isAllowed, string memory reason);

/**
 * @dev Returns all active listings for a given NFT contract and token ID
 * @param nftContract The address of the NFT contract
 * @param tokenId The ID of the token
 * @return An array of listing IDs
 */
function getActiveListingsForToken(address nftContract, uint256 tokenId) external view returns (uint256[] memory);

/**
 * @dev Returns all active listings created by a user
 * @param user The address of the user
 * @return An array of listing IDs
 */
function getActiveListingsByUser(address user) external view returns (uint256[] memory);

/**
 * @dev Returns all active listings by faction requirement
 * @param factionId The faction ID (1=Law Enforcement, 2=Criminal, 3=Vigilante)
 * @return An array of listing IDs
 */
function getActiveListingsByFaction(uint8 factionId) external view returns (uint256[] memory);

/**
 * @dev Returns all active listings in a territory
 * @param territoryId The ID of the territory
 * @return An array of listing IDs
 */
function getActiveListingsByTerritory(uint256 territoryId) external view returns (uint256[] memory);

/**
 * @dev Returns the Alstra token address used by the marketplace
 * @return The address of the Alstra token contract
 */
function getAlstraTokenAddress() external view returns (address);

/**
 * @dev Returns the FactionRegistry address used by the marketplace
 * @return The address of the FactionRegistry contract
 */
function getFactionRegistryAddress() external view returns (address);

/**
 * @dev Returns the TerritoryRegistry address used by the marketplace
 * @return The address of the TerritoryRegistry contract
 */
function getTerritoryRegistryAddress() external view returns (address);

/**
 * @dev Returns the TreasuryManagement address used by the marketplace
 * @return The address of the TreasuryManagement contract
 */
function getTreasuryManagementAddress() external view returns (address);
```

#### 4.5.6 Events

```solidity
/**
 * @dev Emitted when a new listing is created
 */
event ListingCreated(
    uint256 indexed listingId,
    address indexed seller,
    address indexed nftContract,
    uint256 tokenId,
    uint256 quantity,
    uint256 price,
    ListingType listingType
);

/**
 * @dev Emitted when a listing is updated
 */
event ListingUpdated(
    uint256 indexed listingId,
    uint256 newPrice
);

/**
 * @dev Emitted when a listing is canceled
 */
event ListingCanceled(uint256 indexed listingId);

/**
 * @dev Emitted when a listing is sold
 */
event ListingSold(
    uint256 indexed listingId,
    address indexed seller,
    address indexed buyer,
    uint256 price
);

/**
 * @dev Emitted when a black market listing is created
 */
event BlackMarketListingCreated(
    uint256 indexed listingId,
    uint8 requiredFaction,
    uint8 minimumRank
);

/**
 * @dev Emitted when an auction is created
 */
event AuctionCreated(
    uint256 indexed listingId,
    address indexed seller,
    address indexed nftContract,
    uint256 tokenId,
    uint256 startingPrice,
    uint256 reservePrice,
    uint256 endTime
);

/**
 * @dev Emitted when a bid is placed
 */
event BidPlaced(
    uint256 indexed listingId,
    address indexed bidder,
    uint256 bidAmount
);

/**
 * @dev Emitted when an auction is finalized
 */
event AuctionFinalized(
    uint256 indexed listingId,
    address indexed winner,
    uint256 finalPrice
);

/**
 * @dev Emitted when a rental listing is created
 */
event RentalCreated(
    uint256 indexed listingId,
    address indexed owner,
    address indexed nftContract,
    uint256 tokenId,
    uint256 pricePerDay,
    uint256 maxDuration
);

/**
 * @dev Emitted when an asset is rented
 */
event AssetRented(
    uint256 indexed listingId,
    address indexed renter,
    uint256 startTime,
    uint256 endTime
);

/**
 * @dev Emitted when a rental is ended
 */
event RentalEnded(
    uint256 indexed listingId,
    address indexed renter
);

/**
 * @dev Emitted when an expired rental is claimed
 */
event ExpiredRentalClaimed(
    uint256 indexed listingId,
    address indexed owner
);

/**
 * @dev Emitted when an escrow trade is created
 */
event EscrowTradeCreated(
    uint256 indexed tradeId,
    address indexed initiator,
    address indexed counterparty
);

/**
 * @dev Emitted when an escrow trade is approved
 */
event EscrowTradeApproved(
    uint256 indexed tradeId,
    address indexed approver
);

/**
 * @dev Emitted when an escrow trade is completed
 */
event EscrowTradeCompleted(
    uint256 indexed tradeId
);

/**
 * @dev Emitted when an escrow trade is canceled
 */
event EscrowTradeCanceled(
    uint256 indexed tradeId,
    address indexed canceledBy
);

/**
 * @dev Emitted when the marketplace fee is updated
 */
event MarketplaceFeeUpdated(
    uint256 oldFeePercentage,
    uint256 newFeePercentage
);

/**
 * @dev Emitted when the fee distribution is updated
 */
event FeeDistributionUpdated(
    uint256 daoTreasuryPercentage,
    uint256 territoryControllerPercentage,
    uint256 sellerFactionPercentage,
    uint256 burnPercentage
);

/**
 * @dev Emitted when a contract address is updated
 */
event ContractAddressUpdated(
    string indexed contractType,
    address oldAddress,
    address newAddress
);

/**
 * @dev Emitted when marketplace fees are collected
 */
event FeesCollected(
    uint256 indexed listingId,
    uint256 totalFee,
    uint256 daoAmount,
    uint256 territoryAmount,
    uint256 factionAmount,
    uint256 burnAmount
);
```

#### 4.5.7 Implementation Notes

1. Use MarketplaceLibrary for validating listings and purchases
2. Use FeeLibrary for calculating marketplace fees
3. Implement reentrancy protection for all functions that transfer assets or tokens
4. Optimize gas usage by batching operations where possible
5. Use the UUPS upgradeable pattern
6. Use access control validation for territory and faction-specific functions
7. Implement events for tracking all marketplace activities

---

## 5. Cross-Contract Interactions

### 5.1 Territory Control Workflow

The territory control mechanism is a key gameplay element that involves interactions between multiple contracts:

#### 5.1.1 Staking for Territory Control

```
┌──────────────┐      1. stake tokens      ┌─────────────────┐
│   Player     │─────────────────────────►│ TerritoryStaking │
└──────────────┘                          └────────┬─────────┘
                                                   │
                                                   │ 2. get faction info
                                                   ▼
                                          ┌─────────────────┐
                                          │ FactionRegistry │
                                          └────────┬────────┘
                                                   │
                                                   │ 3. return faction data
                                                   ▲
                                                   │
┌───────────────┐    5. update control    ┌────────┴─────────┐
│TerritoryRegistry│◄────────────────────────│ TerritoryStaking │
└───────────────┘                         └─────────────────┘
        ▲
        │ 4. check territory data
        │
        └─────────────────────────────────┘
```

**Workflow Description:**

1. Player calls `stakeForTerritory(territoryId, amount)` on TerritoryStaking contract
2. TerritoryStaking retrieves player's faction from FactionRegistry with `getMemberDetails(player)`
3. TerritoryStaking validates the stake and records it, associating with player's faction
4. TerritoryStaking checks current territory control data from TerritoryRegistry
5. If control thresholds are met, TerritoryStaking calls `setControllingFaction(territoryId, factionId)` on TerritoryRegistry

**Implementation Considerations:**

```solidity
// In TerritoryStaking.sol
function stakeForTerritory(uint256 territoryId, uint256 amount) external returns (uint256) {
    // Validate territory exists
    require(_territoryRegistry.getTerritoryDetails(territoryId).active, "Territory does not exist");
    
    // Get player's faction
    (uint8 factionId, , , , bool active) = _factionRegistry.getMemberDetails(msg.sender);
    require(active, "Must be in an active faction to stake");
    
    // Transfer tokens from user to this contract
    _alstraToken.transferFrom(msg.sender, address(this), amount);
    
    // Create stake record
    uint256 stakeId = _nextStakeId++;
    _stakes[stakeId] = Stake({
        staker: msg.sender,
        territoryId: territoryId,
        amount: amount,
        factionId: factionId,
        startTime: block.timestamp,
        lastClaimTime: block.timestamp,
        active: true
    });
    
    // Update territory staking info
    TerritoryStakingInfo storage info = _territoryStakingInfo[territoryId];
    info.totalStaked += amount;
    info.factionStakes[factionId] += amount;
    
    // Add to tracking mappings
    _userStakes[msg.sender].push(stakeId);
    _territoryStakes[territoryId].push(stakeId);
    
    // Check if control changes
    _updateTerritoryControlIfNeeded(territoryId);
    
    // Emit event
    emit TokensStaked(msg.sender, territoryId, amount, factionId, stakeId);
    
    return stakeId;
}

function _updateTerritoryControlIfNeeded(uint256 territoryId) internal {
    TerritoryStakingInfo storage info = _territoryStakingInfo[territoryId];
    
    // Get current controlling faction
    (,,,, uint8 currentController,,) = _territoryRegistry.getTerritoryDetails(territoryId);
    
    // Calculate new controlling faction
    (uint8 newController, bool contested) = StakingLibrary.calculateControllingFaction(
        _getFactionStakesArray(territoryId),
        info.totalStaked,
        uint8(contestThreshold / 100) // Convert basis points to percentage
    );
    
    // Update only if there's a change
    if (newController != currentController || contested != _territoryRegistry.getTerritoryDetails(territoryId).contested) {
        _territoryRegistry.setControllingFaction(territoryId, newController);
        _territoryRegistry.setContestedStatus(territoryId, contested);
        
        if (newController != 0 && newController != currentController) {
            emit TerritoryControlGained(territoryId, newController);
        }
        
        if (contested) {
            emit TerritoryContested(territoryId, currentController, _getChallengingFaction(territoryId, currentController));
        }
    }
}
```

### 5.2 NFT Transaction Workflows

#### 5.2.1 Faction-Restricted Marketplace Listing

```
┌──────────────┐    1. create black     ┌─────────────────┐
│   Seller     │────market listing────►│  NFTMarketplace  │
└──────────────┘                        └────────┬────────┘
                                                 │
                                                 │ 2. check seller faction
                                                 ▼
                                        ┌─────────────────┐
                                        │ FactionRegistry │
                                        └─────────────────┘
                                                 ▲
┌──────────────┐    3. attempt to      ┌─────────┴───────┐
│    Buyer     │────purchase listing──►│  NFTMarketplace  │
└──────────────┘                       └─────────┬───────┘
                                                 │
                                                 │ 4. check buyer faction & rank
                                                 │
                                                 ▼
                                        ┌─────────────────┐
                                        │ FactionRegistry │
                                        └─────────────────┘
```

**Workflow Description:**

1. Seller creates a black market listing with faction requirements
2. NFTMarketplace checks seller's faction from FactionRegistry
3. Buyer attempts to purchase the listing
4. NFTMarketplace validates buyer's faction and rank against listing requirements

**Implementation Considerations:**

```solidity
// In NFTMarketplace.sol
function createBlackMarketListing(
    address nftContract,
    uint256 tokenId,
    uint256 quantity,
    uint256 price,
    uint8 requiredFaction,
    uint8 minimumRank
) external returns (uint256) {
    // Validate NFT ownership and approval
    require(_isOwnerAndApproved(nftContract, tokenId, msg.sender, quantity), "Not owner or not approved");
    
    // Check seller's faction
    (uint8 sellerFaction, uint8 sellerRank, , , bool active) = _factionRegistry.getMemberDetails(msg.sender);
    require(active, "Must be in an active faction to create black market listing");
    
    // Validate faction requirements
    require(requiredFaction >= 0 && requiredFaction <= 3, "Invalid faction requirement");
    require(minimumRank >= 0 && minimumRank <= 10, "Invalid rank requirement");
    
    // Create listing
    uint256 listingId = _nextListingId++;
    _listings[listingId] = Listing({
        id: listingId,
        seller: msg.sender,
        nftContract: nftContract,
        tokenId: tokenId,
        quantity: quantity,
        price: price,
        listingType: ListingType.BlackMarket,
        active: true,
        createdAt: block.timestamp,
        factionRequirement: requiredFaction,
        minimumRank: minimumRank,
        territoryId: 0 // No territory association for black market
    });
    
    // Add to tracking mappings
    _tokenListings[nftContract][tokenId].push(listingId);
    _sellerListings[msg.sender].push(listingId);
    
    if (requiredFaction > 0) {
        _factionListings[requiredFaction].push(listingId);
    }
    
    // Emit events
    emit ListingCreated(
        listingId,
        msg.sender,
        nftContract,
        tokenId,
        quantity,
        price,
        ListingType.BlackMarket
    );
    
    emit BlackMarketListingCreated(
        listingId,
        requiredFaction,
        minimumRank
    );
    
    return listingId;
}

function buyListingWithAlstra(uint256 listingId) external {
    Listing storage listing = _listings[listingId];
    require(listing.active, "Listing is not active");
    require(listing.seller != msg.sender, "Cannot buy your own listing");
    
    // Check faction requirements for black market
    if (listing.listingType == ListingType.BlackMarket) {
        (bool allowed, string memory reason) = canPurchaseListing(msg.sender, listingId);
        require(allowed, reason);
    }
    
    // Transfer Alstra tokens from buyer to seller (minus fees)
    uint256 totalFee = _calculateFee(listing.price, listing.seller, listing.territoryId);
    uint256 sellerAmount = listing.price - totalFee;
    
    // Transfer amount to seller
    _alstraToken.transferFrom(msg.sender, listing.seller, sellerAmount);
    
    // Collect and distribute fees
    _collectAndDistributeFees(listingId, totalFee);
    
    // Transfer NFT to buyer
    _transferNFTToBuyer(listing.nftContract, listing.tokenId, listing.seller, msg.sender, listing.quantity);
    
    // Update listing status
    listing.active = false;
    
    // Emit event
    emit ListingSold(listingId, listing.seller, msg.sender, listing.price);
}

function canPurchaseListing(address user, uint256 listingId) public view returns (bool isAllowed, string memory reason) {
    Listing storage listing = _listings[listingId];
    
    // For black market listings, check faction requirements
    if (listing.listingType == ListingType.BlackMarket && listing.factionRequirement > 0) {
        (uint8 userFaction, uint8 userRank, , , bool active) = _factionRegistry.getMemberDetails(user);
        
        if (!active) {
            return (false, "Must be in an active faction");
        }
        
        if (listing.factionRequirement != userFaction) {
            return (false, "Wrong faction for this black market item");
        }
        
        if (listing.minimumRank > userRank) {
            return (false, "Insufficient rank for this black market item");
        }
    }
    
    return (true, "");
}
```

### 5.3 Revenue Distribution Workflows

#### 5.3.1 Marketplace Fee Distribution

```
┌──────────────┐   1. purchase listing   ┌─────────────────┐
│    Buyer     │───────────────────────►│  NFTMarketplace  │
└──────────────┘                         └────────┬────────┘
                                                  │
                                                  │ 2. calculate fees
                                                  │
                                                  │ 3. distribute fees
                                                  ▼
                                         ┌────────────────┐
                                         │TreasuryManagement│
                                         └────────┬───────┘
                                                  │
                                                  │ 4. allocate to treasuries
                                                  ▼
┌──────────────┐     5. burn portion    ┌────────────────┐
│ AlstraToken  │◄──────────────────────│TreasuryManagement│
└──────────────┘                        └────────────────┘
```

**Workflow Description:**

1. Buyer purchases an NFT listing
2. NFTMarketplace calculates fees based on territory, faction, and base parameters
3. NFTMarketplace distributes fees to TreasuryManagement
4. TreasuryManagement allocates fees to DAO and faction treasuries
5. A portion of fees is burned according to distribution rules

**Implementation Considerations:**

```solidity
// In NFTMarketplace.sol
function _collectAndDistributeFees(uint256 listingId, uint256 totalFee) internal {
    Listing storage listing = _listings[listingId];
    
    // Get seller's faction
    (uint8 sellerFaction, , , , ) = _factionRegistry.getMemberDetails(listing.seller);
    
    // Get territory controlling faction
    uint8 territoryController = 0;
    if (listing.territoryId > 0) {
        (, , , , territoryController, , ) = _territoryRegistry.getTerritoryDetails(listing.territoryId);
    }
    
    // Calculate fee distribution using FeeLibrary
    FeeDistribution memory distribution = FeeLibrary.calculateMarketplaceFee(
        totalFee,
        marketplaceFeePercentage,
        sellerFaction,
        listing.territoryId,
        territoryController
    );
    
    // Burn portion of fees
    if (distribution.burnAmount > 0) {
        _alstraToken.burn(distribution.burnAmount);
    }
    
    // Send to DAO treasury
    if (distribution.daoTreasuryAmount > 0) {
        _alstraToken.transfer(address(_treasuryManagement), distribution.daoTreasuryAmount);
        _treasuryManagement.depositAlstra(distribution.daoTreasuryAmount, "Marketplace fees");
    }
    
    // Send to territory controller's faction treasury
    if (distribution.territoryControllerAmount > 0 && territoryController > 0) {
        _alstraToken.transfer(address(_treasuryManagement), distribution.territoryControllerAmount);
        _treasuryManagement.depositAlstra(distribution.territoryControllerAmount, "Territory controller fees");
    }
    
    // Send to seller's faction treasury
    if (distribution.sellerFactionAmount > 0 && sellerFaction > 0) {
        _alstraToken.transfer(address(_treasuryManagement), distribution.sellerFactionAmount);
        _treasuryManagement.depositAlstra(distribution.sellerFactionAmount, "Seller faction fees");
    }
    
    // Emit event
    emit FeesCollected(
        listingId,
        totalFee,
        distribution.daoTreasuryAmount,
        distribution.territoryControllerAmount,
        distribution.sellerFactionAmount,
        distribution.burnAmount
    );
}
```

### 5.4 Governance Interaction Workflows

#### 5.4.1 Parameter Update Through Governance

```
┌──────────────┐   1. propose parameter  ┌─────────────────┐
│   Governor   │───────────change───────►│  NFTMarketplace  │
└──────────────┘                         └────────┬────────┘
                                                  │
                                                  │ 2. create proposal
                                                  ▼
                                         ┌────────────────┐
                                         │  BaseGovernor  │
                                         └────────┬───────┘
                                                  │
                                                  │ 3. voting & execution
                                                  ▼
┌──────────────┐  4. parameter update   ┌────────────────┐
│NFTMarketplace │◄────────────────────┬─│   Timelock     │
└──────────────┘                      │ └────────────────┘
                                      │
┌──────────────┐                      │
│TreasuryManagement│◄────────────────┘
└──────────────┘
```

**Workflow Description:**

1. Governance participant proposes a parameter change
2. NFTMarketplace creates a proposal in BaseGovernor with the proper calldata
3. BaseGovernor handles voting and scheduling execution through Timelock
4. Timelock executes parameter update after delay

**Implementation Considerations:**

```solidity
// In NFTMarketplace.sol
function proposeMarketplaceParameterChange(
    uint256 newFeePercentage,
    FeeDistribution calldata newDistribution
) external returns (uint256) {
    // Get BaseGovernor contract
    IBaseGovernor governor = IBaseGovernor(governorAddress);
    
    // Create targets array (the marketplace contract address)
    address[] memory targets = new address[](2);
    targets[0] = address(this);
    targets[1] = address(this);
    
    // Create values array (0 since we're not sending ETH)
    uint256[] memory values = new uint256[](2);
    values[0] = 0;
    values[1] = 0;
    
    // Create calldata for the functions
    bytes[] memory calldatas = new bytes[](2);
    calldatas[0] = abi.encodeWithSelector(
        this.updateMarketplaceFee.selector,
        newFeePercentage
    );
    calldatas[1] = abi.encodeWithSelector(
        this.updateFeeDistribution.selector,
        newDistribution
    );
    
    // Create description for the proposal
    string memory description = string(abi.encodePacked(
        "Update marketplace fee to ", 
        _uintToString(newFeePercentage), 
        " basis points and update fee distribution"
    ));
    
    // Submit the proposal to the governor
    return governor.propose(targets, values, calldatas, description);
}

// Function that can only be called by the governance timelock
function updateMarketplaceFee(uint256 newFeePercentage) external {
    // Ensure caller is the timelock controller from the governor
    require(msg.sender == governorTimelock, "Only governance can call");
    
    // Perform the update
    uint256 oldFeePercentage = marketplaceFeePercentage;
    marketplaceFeePercentage = newFeePercentage;
    
    emit MarketplaceFeeUpdated(oldFeePercentage, newFeePercentage);
}
```

---

## 6. Security Considerations

### 6.1 Access Control Strategy

The Faction Wars ecosystem uses a fine-grained access control model based on both explicit roles (via OpenZeppelin's AccessControl) and dynamic permissions based on faction membership and territory control.

#### 6.1.1 Role-Based Access Control

Each contract implements the following roles hierarchy:

1. **DEFAULT_ADMIN_ROLE**: Can grant and revoke all other roles
2. **Contract-Specific Admin Roles**: For contract-specific administration
3. **Manager Roles**: For specific functionality domains
4. **Emergency Roles**: For crisis management

Example implementation:

```solidity
// In contract initialization
_grantRole(DEFAULT_ADMIN_ROLE, admin);
_grantRole(CONTRACT_ADMIN_ROLE, admin);
_grantRole(MANAGER_ROLE, manager);
_grantRole(EMERGENCY_ROLE, emergencyAdmin);

// Role-specific modifiers
modifier onlyRole(bytes32 role) {
    require(hasRole(role, msg.sender), "AccessControl: account does not have role");
    _;
}
```

#### 6.1.2 Faction-Based Access Control

For faction-specific features, permissions are determined dynamically:

```solidity
function _hasFactionAccess(
    address user,
    uint8 requiredFaction,
    uint8 minimumRank
) internal view returns (bool) {
    // Get user's faction data
    (uint8 factionId, uint8 rank, , , bool active) = _factionRegistry.getMemberDetails(user);
    
    // Check requirements
    if (!active) return false;
    if (requiredFaction != 0 && factionId != requiredFaction) return false;
    if (minimumRank != 0 && rank < minimumRank) return false;
    
    return true;
}
```

#### 6.1.3 Territory-Based Access Control

For territory-specific permissions:

```solidity
function _hasTerritoryAccess(
    address user,
    uint256 territoryId
) internal view returns (bool) {
    // Get user's faction
    (uint8 factionId, , , , bool active) = _factionRegistry.getMemberDetails(user);
    if (!active) return false;
    
    // Get territory control info
    (, , , , uint8 controllingFaction, , bool contested) = _territoryRegistry.getTerritoryDetails(territoryId);
    
    // Check if user's faction controls the territory or if uncontested
    return !contested && controllingFaction == factionId;
}
```

#### 6.1.4 Governance-Based Access Control

For functions that can only be called by governance:

```solidity
function _onlyGovernance() internal view {
    require(msg.sender == governorTimelock, "Only governance can call");
}
```

### 6.2 Reentrancy Protections

#### 6.2.1 Reentrancy Guard Pattern

All functions that perform external calls, especially token transfers, should implement reentrancy protection:

```solidity
// Using OpenZeppelin's ReentrancyGuard
contract ProtectedContract is ReentrancyGuardUpgradeable {
    function riskyFunction() external nonReentrant {
        // External calls here
    }
}
```

#### 6.2.2 Checks-Effects-Interactions Pattern

All functions should follow the CEI pattern:

```solidity
function withdraw(uint256 stakeId) external {
    // Checks
    require(_stakes[stakeId].active, "Stake not active");
    require(_stakes[stakeId].staker == msg.sender, "Not stake owner");
    
    // Effects
    uint256 amount = _stakes[stakeId].amount;
    _stakes[stakeId].active = false;
    _totalStaked -= amount;
    
    // Interactions
    _alstraToken.transfer(msg.sender, amount);
}
```

#### 6.2.3 Critical Functions Protection

Particularly sensitive functions, especially in the marketplace and treasury contracts, should implement multiple layers of protection:

```solidity
function executeSpendRequest(uint256 requestId) 
    external 
    nonReentrant 
    onlyRole(TREASURY_MANAGER_ROLE) 
    returns (bool) {
    // Implementation with additional checks
}
```

### 6.3 Overflow and Underflow Safeguards

Solidity 0.8.x provides built-in overflow/underflow checking, but additional measures are recommended:

#### 6.3.1 Pre-operation Validation

```solidity
function decreaseReputation(address member, uint256 amount) external {
    uint256 currentReputation = _members[member].reputation;
    require(currentReputation >= amount, "Cannot decrease below zero");
    
    _members[member].reputation = currentReputation - amount;
}
```

#### 6.3.2 SafeMath For Library Operations

```solidity
library StakingLibrary {
    function calculateStakingReward(
        uint256 stakeAmount,
        uint256 stakeDuration,
        uint256 baseRewardRate
    ) internal pure returns (uint256) {
        // Use safe math operations
        uint256 rawReward = stakeAmount * stakeDuration * baseRewardRate;
        if (rawReward / stakeAmount / stakeDuration != baseRewardRate) {
            revert("Calculation overflow");
        }
        return rawReward / 1e18;
    }
}
```

### 6.4 Oracle Manipulations

#### 6.4.1 Price Manipulation Prevention

For auction mechanisms:

```solidity
function placeBid(uint256 listingId) external payable {
    AuctionInfo storage auction = _auctions[listingId];
    
    // Minimum bid increment to prevent micro-bidding attacks
    uint256 minIncrement = (auction.currentBid * 5) / 100; // 5% increment
    require(msg.value >= auction.currentBid + minIncrement, "Bid too low");
    
    // Extension to prevent last-minute sniping
    if (block.timestamp > auction.endTime - 5 minutes) {
        auction.endTime += 5 minutes;
    }
    
    // Refund previous bidder
    if (auction.currentBidder != address(0)) {
        _sendValue(auction.currentBidder, auction.currentBid);
    }
    
    // Update auction state
    auction.currentBid = msg.value;
    auction.currentBidder = msg.sender;
}
```

#### 6.4.2 Territory Control Manipulation Prevention

```solidity
function updateTerritoryControl(uint256 territoryId) external {
    // Rate limiting to prevent rapid control changes
    TerritoryStakingInfo storage info = _territoryStakingInfo[territoryId];
    require(block.timestamp >= info.lastUpdateTime + 1 hours, "Update too frequent");
    
    // Minimum stake threshold to prevent control with negligible stakes
    require(info.totalStaked >= minimumControlStake, "Insufficient stake for control");
    
    // Update logic here
    info.lastUpdateTime = block.timestamp;
}
```

### 6.5 Front-Running Mitigations

#### 6.5.1 Commit-Reveal Pattern for Critical Operations

```solidity
// Step 1: User commits to an action with a hash
function commitBid(uint256 listingId, bytes32 commitHash) external {
    _bidCommitments[msg.sender][listingId] = commitHash;
    _bidCommitmentTimes[msg.sender][listingId] = block.timestamp;
}

// Step 2: User reveals their action after commitment period
function revealBid(uint256 listingId, uint256 bidAmount, bytes32 salt) external payable {
    // Verify commitment
    bytes32 computedHash = keccak256(abi.encodePacked(listingId, bidAmount, salt, msg.sender));
    require(_bidCommitments[msg.sender][listingId] == computedHash, "Invalid reveal");
    
    // Verify timing
    require(block.timestamp >= _bidCommitmentTimes[msg.sender][listingId] + 5 minutes, "Too early");
    require(block.timestamp <= _bidCommitmentTimes[msg.sender][listingId] + 24 hours, "Too late");
    
    // Verify payment
    require(msg.value == bidAmount, "Bid amount mismatch");
    
    // Process bid
    _processBid(listingId, bidAmount);
}
```

#### 6.5.2 Minimum Block Confirmations

```solidity
function finalizeAuction(uint256 listingId) external {
    AuctionInfo storage auction = _auctions[listingId];
    
    // Ensure auction has been over for at least 5 blocks
    require(block.timestamp >= auction.endTime + 5 * 15, "Wait for more confirmations");
    
    // Finalization logic
}
```

---

## 7. Gas Optimization Strategies

### 7.1 Storage Optimization

#### 7.1.1 Struct Packing

Optimize structs to minimize storage slots:

```solidity
// Unoptimized: 4 storage slots
struct Listing {
    uint256 id;           // 32 bytes (1 slot)
    address seller;       // 20 bytes (1 slot)
    bool active;          // 1 byte  (1 slot)
    uint256 price;        // 32 bytes (1 slot)
}

// Optimized: 3 storage slots
struct Listing {
    uint128 id;           // 16 bytes
    address seller;       // 20 bytes (together in 1 slot)
    bool active;          // 1 byte
    uint8 listingType;    // 1 byte (together in 1 slot with the rest)
    uint256 price;        // 32 bytes (1 slot)
}
```

#### 7.1.2 Bitmap for Flags

Use bitmaps for boolean flags:

```solidity
// Instead of multiple boolean fields
mapping(uint256 => uint8) private _territoryFlags;

// Flag constants
uint8 constant FLAG_ACTIVE = 1;
uint8 constant FLAG_CONTESTED = 2;
uint8 constant FLAG_RESTRICTED = 4;

// Set a flag
function _setTerritoryFlag(uint256 territoryId, uint8 flag, bool value) internal {
    if (value) {
        _territoryFlags[territoryId] |= flag;
    } else {
        _territoryFlags[territoryId] &= ~flag;
    }
}

// Check a flag
function _hasTerritoryFlag(uint256 territoryId, uint8 flag) internal view returns (bool) {
    return (_territoryFlags[territoryId] & flag) != 0;
}
```

#### 7.1.3 Memory vs. Storage

Be deliberate about memory vs. storage usage:

```solidity
// Inefficient: loads whole struct to storage
function updatePrice(uint256 listingId, uint256 newPrice) external {
    Listing storage listing = _listings[listingId]; // Storage reference
    require(listing.seller == msg.sender, "Not seller");
    listing.price = newPrice; // Updates single field in storage
}

// Efficient: direct storage access for single field
function updatePrice(uint256 listingId, uint256 newPrice) external {
    // Check if sender is seller without loading entire struct
    address seller = _listings[listingId].seller;
    require(seller == msg.sender, "Not seller");
    
    // Update only the price field
    _listings[listingId].price = newPrice;
}
```
### 7.2 Computation Efficiency

#### 7.2.1 Avoid Redundant Calculations

Cache calculation results that are used multiple times:

```solidity
// Inefficient: recalculates the same value multiple times
function processFees(uint256 amount) internal {
    uint256 daoFee = (amount * feeDistribution.daoTreasuryPercentage) / 10000;
    uint256 territoryFee = (amount * feeDistribution.territoryControllerPercentage) / 10000;
    uint256 factionFee = (amount * feeDistribution.sellerFactionPercentage) / 10000;
    uint256 burnAmount = (amount * feeDistribution.burnPercentage) / 10000;
    
    // Process each fee...
}

// Efficient: calculates base values once
function processFees(uint256 amount) internal {
    uint256 feeBase = amount / 10000;
    
    uint256 daoFee = feeBase * feeDistribution.daoTreasuryPercentage;
    uint256 territoryFee = feeBase * feeDistribution.territoryControllerPercentage;
    uint256 factionFee = feeBase * feeDistribution.sellerFactionPercentage;
    uint256 burnAmount = feeBase * feeDistribution.burnPercentage;
    
    // Process each fee...
}
```

#### 7.2.2 Optimize Loop Operations

Optimize loops to reduce gas consumption:

```solidity
// Inefficient: reads length in each iteration and modifies storage
function batchUpdateTerritoryControl(uint256[] calldata territoryIds) external {
    for (uint256 i = 0; i < territoryIds.length; i++) {
        updateTerritoryControl(territoryIds[i]);
    }
}

// Efficient: caches length and uses local variables
function batchUpdateTerritoryControl(uint256[] calldata territoryIds) external {
    uint256 length = territoryIds.length;
    for (uint256 i = 0; i < length; i++) {
        uint256 territoryId = territoryIds[i];
        
        // Local processing of territory control
        TerritoryStakingInfo storage info = _territoryStakingInfo[territoryId];
        // ... processing logic
        
        // Batch update the storage state in one operation
        _updateTerritoryControl(territoryId, newController, contested);
    }
}
```

#### 7.2.3 Fixed-Point Math

Use fixed-point math for operations that don't require high precision:

```solidity
// Library for 18-decimal fixed point math
library FixedPoint {
    uint256 constant ONE = 1e18;
    
    function multiply(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0 || b == 0) return 0;
        return (a * b) / ONE;
    }
    
    function divide(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "Division by zero");
        return (a * ONE) / b;
    }
}

// In calculation code
function calculateRewards(uint256 stakeAmount, uint256 rewardRate) internal pure returns (uint256) {
    return FixedPoint.multiply(stakeAmount, rewardRate);
}
```

### 7.3 Batch Processing

#### 7.3.1 Batch Transfers

Implement batch operations for common patterns:

```solidity
// Instead of multiple individual operations
function batchTransferNFTs(
    address[] calldata recipients,
    uint256[] calldata tokenIds,
    address nftContract
) external {
    require(recipients.length == tokenIds.length, "Array length mismatch");
    
    uint256 length = recipients.length;
    for (uint256 i = 0; i < length; i++) {
        IERC721(nftContract).safeTransferFrom(msg.sender, recipients[i], tokenIds[i]);
    }
}

// For batch claim operations
function batchClaimRewards(uint256[] calldata stakeIds) external returns (uint256) {
    uint256 totalRewards = 0;
    uint256 length = stakeIds.length;
    
    for (uint256 i = 0; i < length; i++) {
        totalRewards += _claimRewards(stakeIds[i]);
    }
    
    return totalRewards;
}
```

#### 7.3.2 Batched Storage Updates

Group related storage updates to minimize gas costs:

```solidity
// Instead of separate updates
function updateListingDetails(
    uint256 listingId,
    uint256 newPrice,
    bool isActive,
    uint256 newQuantity
) external {
    Listing storage listing = _listings[listingId];
    require(listing.seller == msg.sender, "Not seller");
    
    // Group storage updates
    listing.price = newPrice;
    listing.active = isActive;
    listing.quantity = newQuantity;
    
    emit ListingUpdated(listingId, newPrice, isActive, newQuantity);
}
```

---

## 8. Testing Framework

### 8.1 Unit Testing

#### 8.1.1 Contract Function Tests

Each contract function should have dedicated unit tests verifying:

- Normal operation with expected inputs
- Handling of edge cases
- Proper access control enforcement
- Event emission
- State changes

Example test structure:

```typescript
describe("TerritoryStaking", function() {
  let territoryStaking: TerritoryStaking;
  let mockAlstraToken: MockAlstraToken;
  let mockTerritoryRegistry: MockTerritoryRegistry;
  let mockFactionRegistry: MockFactionRegistry;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  
  beforeEach(async function() {
    // Setup contract instances and mock dependencies
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy mocks
    mockAlstraToken = await deployMock("MockAlstraToken");
    mockTerritoryRegistry = await deployMock("MockTerritoryRegistry");
    mockFactionRegistry = await deployMock("MockFactionRegistry");
    
    // Configure mocks
    await mockFactionRegistry.mock.getMemberDetails
      .withArgs(user1.address)
      .returns(1, 3, 1000, Math.floor(Date.now() / 1000) - 86400, true);
    
    // Deploy contract
    territoryStaking = await deployContract("TerritoryStaking", [
      owner.address, 
      mockAlstraToken.address,
      mockTerritoryRegistry.address,
      mockFactionRegistry.address,
      500, // contestThreshold (5%)
      ethers.utils.parseEther("10"), // minimumStakeAmount
      100 // baseRewardRate
    ]);
  });
  
  describe("stakeForTerritory", function() {
    it("should create a stake successfully", async function() {
      // Setup
      const territoryId = 1;
      const amount = ethers.utils.parseEther("100");
      
      await mockAlstraToken.mock.transferFrom
        .withArgs(user1.address, territoryStaking.address, amount)
        .returns(true);
        
      await mockTerritoryRegistry.mock.getTerritoryDetails
        .withArgs(territoryId)
        .returns("Test Territory", 2, 1000, 10, 0, 100, false);
        
      // Execute
      await expect(territoryStaking.connect(user1).stakeForTerritory(territoryId, amount))
        .to.emit(territoryStaking, "TokensStaked")
        .withArgs(user1.address, territoryId, amount, 1, 0);
        
      // Verify
      const stake = await territoryStaking.getStakeDetails(0);
      expect(stake.staker).to.equal(user1.address);
      expect(stake.territoryId).to.equal(territoryId);
      expect(stake.amount).to.equal(amount);
      expect(stake.factionId).to.equal(1);
      expect(stake.active).to.be.true;
    });
    
    it("should revert when territory doesn't exist", async function() {
      // Setup
      const territoryId = 999;
      const amount = ethers.utils.parseEther("100");
      
      await mockTerritoryRegistry.mock.getTerritoryDetails
        .withArgs(territoryId)
        .reverts();
        
      // Execute & Verify
      await expect(territoryStaking.connect(user1).stakeForTerritory(territoryId, amount))
        .to.be.reverted;
    });
    
    // Additional test cases...
  });
  
  // Additional function tests...
});
```

#### 8.1.2 Library Testing

Each library function should have dedicated tests:

```typescript
describe("TerritoryLibrary", function() {
  let testLibraryContract: TestTerritoryLibraryWrapper;
  
  beforeEach(async function() {
    // Deploy test wrapper that exposes library functions
    const TestWrapper = await ethers.getContractFactory("TestTerritoryLibraryWrapper");
    testLibraryContract = await TestWrapper.deploy();
  });
  
  describe("calculateTerritoryValue", function() {
    it("should correctly calculate territory value", async function() {
      const baseValue = 1000;
      const zoneType = 2; // Medium-Security
      const resourceRate = 10;
      const contested = false;
      const lastUpdateBlock = 100;
      
      const currentBlock = 200;
      await network.provider.send("hardhat_setBlockNumber", [
        ethers.utils.hexValue(currentBlock),
      ]);
      
      const expectedValue = 1100; // Calculation based on formula
      
      expect(await testLibraryContract.calculateTerritoryValue(
        baseValue, zoneType, resourceRate, contested, lastUpdateBlock
      )).to.equal(expectedValue);
    });
    
    it("should apply contested penalty to value", async function() {
      const baseValue = 1000;
      const zoneType = 2; // Medium-Security
      const resourceRate = 10;
      const contested = true; // Contested
      const lastUpdateBlock = 100;
      
      const currentBlock = 200;
      await network.provider.send("hardhat_setBlockNumber", [
        ethers.utils.hexValue(currentBlock),
      ]);
      
      const expectedValue = 880; // With 20% contested penalty
      
      expect(await testLibraryContract.calculateTerritoryValue(
        baseValue, zoneType, resourceRate, contested, lastUpdateBlock
      )).to.equal(expectedValue);
    });
    
    // Additional test cases...
  });
  
  // Additional function tests...
});
```

### 8.2 Integration Testing

#### 8.2.1 Cross-Contract Interactions

Test interactions between multiple contract components:

```typescript
describe("Marketplace and Treasury Integration", function() {
  let nftMarketplace: NFTMarketplace;
  let treasuryManagement: TreasuryManagement;
  let alstraToken: AlstraToken;
  let mockNFT: MockERC721;
  let owner: SignerWithAddress;
  let seller: SignerWithAddress;
  let buyer: SignerWithAddress;
  
  beforeEach(async function() {
    // Deploy real contracts
    [owner, seller, buyer] = await ethers.getSigners();
    
    alstraToken = await deployContract("AlstraToken", [...]);
    treasuryManagement = await deployContract("TreasuryManagement", [...]);
    nftMarketplace = await deployContract("NFTMarketplace", [...]);
    mockNFT = await deployContract("MockERC721", [...]);
    
    // Setup NFT
    await mockNFT.mint(seller.address, 1);
    await mockNFT.connect(seller).approve(nftMarketplace.address, 1);
    
    // Setup tokens
    await alstraToken.mint(buyer.address, ethers.utils.parseEther("1000"));
    await alstraToken.connect(buyer).approve(nftMarketplace.address, ethers.utils.parseEther("1000"));
  });
  
  it("should distribute fees correctly when NFT is sold", async function() {
    // Initial balances
    const initialTreasuryBalance = await alstraToken.balanceOf(treasuryManagement.address);
    
    // Create listing
    await nftMarketplace.connect(seller).createListing(
      mockNFT.address,
      1,
      1,
      ethers.utils.parseEther("100"),
      0 // No territory
    );
    
    // Purchase listing
    await nftMarketplace.connect(buyer).buyListingWithAlstra(0);
    
    // Verify token transfers
    expect(await mockNFT.ownerOf(1)).to.equal(buyer.address);
    
    // Verify fee distribution
    const finalTreasuryBalance = await alstraToken.balanceOf(treasuryManagement.address);
    expect(finalTreasuryBalance.sub(initialTreasuryBalance)).to.be.gt(0);
    
    // Check fee allocation in treasury
    const daoBalance = await treasuryManagement.getTreasuryBalance();
    expect(daoBalance).to.be.gt(initialTreasuryBalance);
  });
  
  // Additional integration tests...
});
```

#### 8.2.2 Workflow Testing

Test complete workflows spanning multiple contracts:

```typescript
describe("Territory Control Workflow", function() {
  // Contract instances and signers setup...
  
  it("should transfer territory control when staking threshold is met", async function() {
    // Setup
    const territoryId = 1;
    const stakeAmount = ethers.utils.parseEther("10000");
    
    // Initial state
    expect(await territoryRegistry.getTerritoryDetails(territoryId))
      .to.include({controllingFaction: 0}); // No control
    
    // User 1 (Faction 1) stakes tokens
    await alstraToken.connect(faction1User).approve(territoryStaking.address, stakeAmount);
    await territoryStaking.connect(faction1User).stakeForTerritory(territoryId, stakeAmount);
    
    // Verify faction 1 gained control
    expect(await territoryRegistry.getTerritoryDetails(territoryId))
      .to.include({controllingFaction: 1});
    
    // User 2 (Faction 2) stakes more tokens
    await alstraToken.connect(faction2User).approve(territoryStaking.address, stakeAmount.mul(2));
    await territoryStaking.connect(faction2User).stakeForTerritory(territoryId, stakeAmount.mul(2));
    
    // Verify faction 2 gained control
    expect(await territoryRegistry.getTerritoryDetails(territoryId))
      .to.include({controllingFaction: 2});
    
    // Verify territory becomes contested when stakes are close
    await alstraToken.connect(faction1User).approve(territoryStaking.address, stakeAmount);
    await territoryStaking.connect(faction1User).stakeForTerritory(territoryId, stakeAmount);
    
    // Now faction 1 has 20k and faction 2 has 20k
    expect(await territoryRegistry.getTerritoryDetails(territoryId))
      .to.include({contested: true});
  });
  
  // Additional workflow tests...
});
```

### 8.3 Security Testing

#### 8.3.1 Access Control Testing

Test all access control mechanisms:

```typescript
describe("Access Control", function() {
  // Setup contract instances and signers
  
  describe("TreasuryManagement Access Control", function() {
    it("should not allow non-admin to update distribution percentages", async function() {
      await expect(treasuryManagement.connect(user1).updateDistributionPercentages(
        3000, 3000, 4000
      )).to.be.revertedWith("AccessControl: account does not have role");
    });
    
    it("should not allow non-governance to spend funds", async function() {
      await expect(treasuryManagement.connect(user1).spendFunds(
        user1.address, ethers.utils.parseEther("10"), "Unauthorized spend", 0
      )).to.be.revertedWith("Only governance can call");
    });
    
    // Additional tests for each role and protected function
  });
  
  // Additional contract access control tests
});
```

#### 8.3.2 Reentrancy Testing

Test for reentrancy vulnerabilities:

```typescript
describe("Reentrancy Protection", function() {
  let attacker: ReentrancyAttacker;
  
  beforeEach(async function() {
    // Deploy attacker contract
    attacker = await deployContract("ReentrancyAttacker", [
      nftMarketplace.address,
      alstraToken.address
    ]);
    
    // Setup attack preconditions
    await mockNFT.mint(attacker.address, 1);
    await attacker.approve(1);
    await alstraToken.mint(attacker.address, ethers.utils.parseEther("100"));
  });
  
  it("should prevent reentrancy in buyListing", async function() {
    // Create listing with attacker
    await attacker.createListing(1, ethers.utils.parseEther("10"));
    const listingId = 0;
    
    // Attempt reentrancy attack
    await expect(attacker.attackBuyListing(listingId))
      .to.be.revertedWith("ReentrancyGuard: reentrant call");
  });
  
  // Additional reentrancy tests
});
```

#### 8.3.3 Market Manipulation Testing

Test for market and economic manipulation:

```typescript
describe("Market Manipulation Protection", function() {
  it("should prevent auction sniping through time extension", async function() {
    // Create auction
    await nftMarketplace.connect(seller).createAuction(
      mockNFT.address,
      1,
      1,
      ethers.utils.parseEther("10"),
      0,
      3600 // 1 hour
    );
    
    // Get auction end time
    const auctionInfo = await nftMarketplace.getAuctionInfo(0);
    const originalEndTime = auctionInfo.endTime;
    
    // Advance time to 5 seconds before end
    await ethers.provider.send("evm_setNextBlockTimestamp", [
      originalEndTime.toNumber() - 5
    ]);
    
    // Place last-minute bid
    await nftMarketplace.connect(buyer).placeBid(0, {
      value: ethers.utils.parseEther("20")
    });
    
    // Check if end time was extended
    const newAuctionInfo = await nftMarketplace.getAuctionInfo(0);
    expect(newAuctionInfo.endTime).to.be.gt(originalEndTime);
  });
  
  // Additional manipulation tests
});
```

---

## 9. Deployment Guide

### 9.1 Deployment Sequence

The deployment of the Faction Wars ecosystem contracts should follow this specific sequence to ensure proper dependency resolution:

1. **AlstraToken**
   - Deploy base token first as it's needed by most other contracts
   - Initialize with proper roles

2. **BaseGovernor and TimelockController**
   - Deploy governance system early to allow control of subsequent contracts
   - Set appropriate voting delay, period, and quorum

3. **Core Game Mechanics**
   - Deploy FactionRegistry first
   - Deploy TerritoryRegistry next
   - Deploy TerritoryStaking after both registries are deployed

4. **Economic Infrastructure**
   - Deploy TreasuryManagement after governance is set up
   - Deploy NFTMarketplace last as it depends on all other contracts

#### 9.1.1 Deployment Script

```typescript
import { ethers, upgrades } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployEcosystem: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  
  // Get deployment accounts
  const {
    deployer,
    admin,
    pauser,
    minter,
    upgrader,
    feeManager,
    vestingManager,
    stakingManager
  } = await getNamedAccounts();
  
  console.log("Deploying with account:", deployer);
  
  // 1. Deploy AlstraToken
  console.log("Deploying AlstraToken...");
  const alstraToken = await deploy("AlstraToken", {
    from: deployer,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [
          admin,
          pauser,
          minter,
          upgrader,
          feeManager,
          vestingManager,
          stakingManager
        ],
      },
    },
    log: true,
  });
  
  // 2. Deploy TimelockController
  console.log("Deploying TimelockController...");
  const minDelay = 86400; // 1 day
  const timelockController = await deploy("TimelockController", {
    from: deployer,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [
          minDelay,
          [deployer], // proposers
          [ethers.constants.AddressZero], // executors - anyone
          admin
        ],
      },
    },
    log: true,
  });
  
  // 3. Deploy BaseGovernor
  console.log("Deploying BaseGovernor...");
  const baseGovernor = await deploy("BaseGovernor", {
    from: deployer,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [
          alstraToken.address,
          timelockController.address,
          admin,
          86400, // 1 day voting delay
          432000, // 5 days voting period
          ethers.utils.parseEther("100000"), // 100k tokens to propose
          5 // 5% quorum
        ],
      },
    },
    log: true,
  });
  
  // 4. Deploy FactionRegistry
  console.log("Deploying FactionRegistry...");
  const factionRegistry = await deploy("FactionRegistry", {
    from: deployer,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [
          admin,
          admin, // faction manager
          admin  // reputation manager
        ],
      },
    },
    log: true,
  });
  
  // 5. Deploy TerritoryRegistry
  console.log("Deploying TerritoryRegistry...");
  const territoryRegistry = await deploy("TerritoryRegistry", {
    from: deployer,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [
          admin,
          admin, // territory manager
          admin, // control manager
          admin  // economics manager
        ],
      },
    },
    log: true,
  });
  
  // 6. Deploy TerritoryStaking
  console.log("Deploying TerritoryStaking...");
  const territoryStaking = await deploy("TerritoryStaking", {
    from: deployer,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [
          admin,
          alstraToken.address,
          territoryRegistry.address,
          factionRegistry.address,
          500, // 5% contest threshold
          ethers.utils.parseEther("100"), // 100 tokens minimum stake
          100 // base reward rate
        ],
      },
    },
    log: true,
  });
  
  // 7. Deploy TreasuryManagement
  console.log("Deploying TreasuryManagement...");
  const treasuryManagement = await deploy("TreasuryManagement", {
    from: deployer,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [
          admin,
          admin, // treasury manager
          admin, // distribution manager
          alstraToken.address,
          baseGovernor.address,
          factionRegistry.address,
          604800 // 7 days distribution interval
        ],
      },
    },
    log: true,
  });
  
  // 8. Deploy NFTMarketplace
  console.log("Deploying NFTMarketplace...");
  const nftMarketplace = await deploy("NFTMarketplace", {
    from: deployer,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [
          admin,
          feeManager,
          alstraToken.address,
          factionRegistry.address,
          territoryRegistry.address,
          territoryStaking.address,
          treasuryManagement.address,
          250, // 2.5% marketplace fee
          {
            daoTreasuryPercentage: 5000, // 50%
            territoryControllerPercentage: 2000, // 20%
            sellerFactionPercentage: 1000, // 10%
            burnPercentage: 2000 // 20%
          }
        ],
      },
    },
    log: true,
  });
  
  console.log("All contracts deployed!");
  
  // Return deployed contracts for post-deployment setup
  return {
    alstraToken,
    timelockController,
    baseGovernor,
    factionRegistry,
    territoryRegistry,
    territoryStaking,
    treasuryManagement,
    nftMarketplace
  };
};

export default deployEcosystem;
deployEcosystem.tags = ["Ecosystem"];
```

### 9.2 Contract Initialization

After deployment, proper initialization is required to set up roles and permissions:

#### 9.2.1 Role Setup

```typescript
async function setupRoles(
  deployedContracts: DeployedContracts,
  accounts: NamedAccounts
) {
  const {
    alstraToken,
    territoryRegistry,
    territoryStaking,
    treasuryManagement
  } = deployedContracts;
  
  const { admin, timelockAddress } = accounts;
  
  // Grant timelock control over contracts
  console.log("Setting up governance roles...");
  
  // AlstraToken roles
  const alstraContract = await ethers.getContractAt("AlstraToken", alstraToken.address);
  const minterRole = await alstraContract.MINTER_ROLE();
  await alstraContract.grantRole(minterRole, timelockAddress);
  
  // TerritoryRegistry roles
  const territoryContract = await ethers.getContractAt("TerritoryRegistry", territoryRegistry.address);
  const controlManagerRole = await territoryContract.CONTROL_MANAGER_ROLE();
  await territoryContract.grantRole(controlManagerRole, territoryStaking.address);
  
  // Staking interaction with territory
  const stakingContract = await ethers.getContractAt("TerritoryStaking", territoryStaking.address);
  await stakingContract.setTerritoryRegistry(territoryRegistry.address);
  
  console.log("All roles configured!");
}
```

#### 9.2.2 Initial Data Setup

```typescript
async function setupInitialData(
  deployedContracts: DeployedContracts
) {
  const {
    factionRegistry,
    territoryRegistry
  } = deployedContracts;
  
  // Set up initial factions
  console.log("Setting up initial factions...");
  const factionContract = await ethers.getContractAt("FactionRegistry", factionRegistry.address);
  
  // Create the three main factions
  await factionContract.createFaction(
    "Law Enforcement",
    "Lagos Police Department and allied agencies",
    true
  );
  
  await factionContract.createFaction(
    "Criminal Syndicate",
    "Organized crime groups operating throughout Lagos",
    true
  );
  
  await factionContract.createFaction(
    "Vigilante",
    "Community protection groups operating in the shadows",
    true
  );
  
  // Create initial territories
  console.log("Setting up initial territories...");
  const territoryContract = await ethers.getContractAt("TerritoryRegistry", territoryRegistry.address);
  
  // Create initial territories with different zone types
  await territoryContract.createTerritory(
    "Victoria Island",
    1, // High-Security
    10000, // High base value
    100 // High resource generation
  );
  
  await territoryContract.createTerritory(
    "Mainland Bridge",
    2, // Medium-Security
    5000, // Medium base value
    50 // Medium resource generation
  );
  
  await territoryContract.createTerritory(
    "Makoko",
    3, // No-Go Zone
    2000, // Lower base value
    200 // High resource generation (risk/reward)
  );
  
  console.log("Initial data setup complete!");
}
```

### 9.3 Cross-Contract Configuration

Final step is to ensure contracts are correctly configured to interact with each other:

```typescript
async function setupContractInteractions(
  deployedContracts: DeployedContracts
) {
  const {
    timelockController,
    baseGovernor,
    territoryStaking,
    treasuryManagement,
    nftMarketplace
  } = deployedContracts;
  
  // Set up governance permissions
  console.log("Configuring governance interactions...");
  
  // Give governor control over timelock
  const timeLockContract = await ethers.getContractAt(
    "TimelockController",
    timelockController.address
  );
  const proposerRole = await timeLockContract.PROPOSER_ROLE();
  const executorRole = await timeLockContract.EXECUTOR_ROLE();
  
  await timeLockContract.grantRole(proposerRole, baseGovernor.address);
  await timeLockContract.grantRole(executorRole, baseGovernor.address);
  
  // Set treasury as reward distributor in staking
  console.log("Configuring economic interactions...");
  const stakingContract = await ethers.getContractAt(
    "TerritoryStaking",
    territoryStaking.address
  );
  
  await stakingContract.setRewardDistributor(treasuryManagement.address);
  
  // Set up marketplace fee recipient
  const marketplaceContract = await ethers.getContractAt(
    "NFTMarketplace",
    nftMarketplace.address
  );
  
  await marketplaceContract.setTreasuryManagement(treasuryManagement.address);
  
  console.log("Contract interactions configured!");
}
```

---

## 10. Upgradeability Considerations

### 10.1 Upgrade Patterns

All contracts in the Faction Wars ecosystem will follow the Universal Upgradeable Proxy Standard (UUPS) pattern to enable future upgrades while maintaining the same contract address and state.

#### 10.1.1 UUPS Implementation

The implementation includes:

```solidity
// In all upgradeable contracts
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract UpgradeableContract is UUPSUpgradeable, AccessControlUpgradeable {
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}
}
```

#### 10.1.2 Upgrade Strategies

Different approaches based on the nature of the upgrade:

1. **Bugfix Upgrades**: Small changes to fix issues
   - Maintain the same storage layout
   - Use direct implementation upgrade

2. **Feature Upgrades**: Adding new functionality
   - Add new storage variables at the end
   - Modify existing functions without changing signatures
   - Add new functions as needed

3. **Major Upgrades**: Significant architecture changes
   - Migrate state to new storage format
   - Implement detailed migration plan
   - Consider two-phase upgrade approach

#### 10.1.3 Example Upgrade Workflow

```typescript
async function upgradeContract(
  contractName: string,
  proxyAddress: string,
  constructorArgs: any[] = []
) {
  console.log(`Upgrading ${contractName}...`);
  
  // Get the upgraded contract factory
  const ContractFactory = await ethers.getContractFactory(contractName);
  
  // Prepare the implementation
  const implementation = await ContractFactory.deploy(...constructorArgs);
  await implementation.deployed();
  
  console.log(`New implementation deployed at: ${implementation.address}`);
  
  // Get proxy admin
  const proxyAdmin = await upgrades.admin.getInstance();
  
  // Upgrade the proxy to point to the new implementation
  const upgradeTx = await proxyAdmin.upgrade(
    proxyAddress,
    implementation.address
  );
  
  await upgradeTx.wait();
  console.log(`${contractName} upgraded successfully!`);
  
  return implementation.address;
}
```

### 10.2 State Migration

For upgrades requiring state migration, use a specialized migration contract:

#### 10.2.1 Data Migration Pattern

```solidity
// Example territory storage V1
struct TerritoryV1 {
    string name;
    uint8 zoneType;
    uint256 baseValue;
    uint256 resourceGenerationRate;
    uint8 controllingFaction;
    uint256 lastUpdateBlock;
    bool contested;
}

// Example upgraded storage V2
struct TerritoryV2 {
    string name;
    uint8 zoneType;
    uint256 baseValue;
    uint256 resourceGenerationRate;
    uint8 controllingFaction;
    uint256 lastUpdateBlock;
    bool contested;
    uint8 dangerLevel; // New field
    uint256[] connectedTerritories; // New field
}

// Migration contract
contract TerritoryMigrator {
    TerritoryRegistryV1 public oldRegistry;
    TerritoryRegistryV2 public newRegistry;
    
    constructor(address _oldRegistry, address _newRegistry) {
        oldRegistry = TerritoryRegistryV1(_oldRegistry);
        newRegistry = TerritoryRegistryV2(_newRegistry);
    }
    
    function migrateTerritory(uint256 territoryId) external {
        // Get old data
        TerritoryV1 memory oldTerritory = oldRegistry.getTerritoryDetails(territoryId);
        
        // Create new data with defaults for new fields
        uint8 dangerLevel = deriveDangerLevel(oldTerritory.zoneType);
        uint256[] memory connectedTerritories = new uint256[](0);
        
        // Migrate to new contract
        newRegistry.setTerritoryDetails(
            territoryId,
            oldTerritory.name,
            oldTerritory.zoneType,
            oldTerritory.baseValue,
            oldTerritory.resourceGenerationRate,
            oldTerritory.controllingFaction,
            oldTerritory.lastUpdateBlock,
            oldTerritory.contested,
            dangerLevel,
            connectedTerritories
        );
    }
    
    function deriveDangerLevel(uint8 zoneType) internal pure returns (uint8) {
        // Logic to derive new field from existing data
        if (zoneType == 1) return 2;
        if (zoneType == 2) return 5;
        if (zoneType == 3) return 8;
        return 0;
    }
}
```

#### 10.2.2 Phased Migration Approach

For larger contracts:

```typescript
async function phasedMigration(
  oldContract: string,
  newContractName: string,
  batchSize: number
) {
  console.log("Starting phased migration...");
  
  // Deploy new implementation
  const NewContract = await ethers.getContractFactory(newContractName);
  const newImplementation = await NewContract.deploy();
  await newImplementation.deployed();
  
  // Deploy migrator
  const Migrator = await ethers.getContractFactory("Migrator");
  const migrator = await Migrator.deploy(oldContract, newImplementation.address);
  await migrator.deployed();
  
  // Get total items to migrate
  const oldContractInstance = await ethers.getContractAt("OldContract", oldContract);
  const totalItems = await oldContractInstance.getTotalItems();
  
  // Migrate in batches
  let migrated = 0;
  while (migrated < totalItems) {
    const batch = Math.min(batchSize, totalItems - migrated);
    console.log(`Migrating batch ${migrated} to ${migrated + batch}...`);
    
    const tx = await migrator.migrateBatch(migrated, batch);
    await tx.wait();
    
    migrated += batch;
    console.log(`Progress: ${migrated}/${totalItems}`);
  }
  
  // Upgrade proxy to new implementation
  const proxyAdmin = await upgrades.admin.getInstance();
  await proxyAdmin.upgrade(oldContract, newImplementation.address);
  
  console.log("Migration complete!");
}
```

### 10.3 Governance Control

Upgrades will be controlled through the governance system to ensure decentralized decision-making.

#### 10.3.1 Upgrade Proposal Process

```solidity
// In the contract to be upgraded
function proposeUpgrade(address newImplementation) external returns (uint256) {
    // Get BaseGovernor contract
    IBaseGovernor governor = IBaseGovernor(governorAddress);
    
    // Create targets array
    address[] memory targets = new address[](1);
    targets[0] = address(this);
    
    // Create values array
    uint256[] memory values = new uint256[](1);
    values[0] = 0;
    
    // Create calldata for the functions
    bytes[] memory calldatas = new bytes[](1);
    calldatas[0] = abi.encodeWithSelector(
        UUPSUpgradeable.upgradeToAndCall.selector,
        newImplementation,
        ""
    );
    
    // Create description for the proposal
    string memory description = string(abi.encodePacked(
        "Upgrade contract to new implementation: ", 
        toAsciiString(newImplementation)
    ));
    
    // Submit the proposal to the governor
    return governor.propose(targets, values, calldatas, description);
}
```

#### 10.3.2 Timelocked Execution

Upgrades will respect the governance timelock to give users time to evaluate changes:

```typescript
async function governanceUpgrade(
  contractName: string,
  proxyAddress: string,
  newImplementationAddress: string,
  governorAddress: string
) {
  // Get the governor
  const governor = await ethers.getContractAt("BaseGovernor", governorAddress);
  
  // Create proposal
  const targets = [proxyAddress];
  const values = [0];
  const signatures = ["upgradeToAndCall(address,bytes)"];
  const calldatas = [
    ethers.utils.defaultAbiCoder.encode(
      ["address", "bytes"],
      [newImplementationAddress, "0x"]
    )
  ];
  const description = `Upgrade ${contractName} to implementation ${newImplementationAddress}`;
  
  // Submit proposal
  const proposeTx = await governor.propose(
    targets,
    values,
    signatures,
    calldatas,
    description
  );
  
  const receipt = await proposeTx.wait();
  const event = receipt.events.find(e => e.event === "ProposalCreated");
  const proposalId = event.args.proposalId;
  
  console.log(`Proposal created with ID: ${proposalId}`);
  console.log("Waiting for voting period...");
  
  // Wait for voting delay
  await time.increase(await governor.votingDelay());
  
  // Cast votes (simulation)
  await governor.castVote(proposalId, 1); // Vote in favor
  
  // Wait for voting period to end
  await time.increase(await governor.votingPeriod());
  
  // Queue the proposal
  await governor.queue(
    targets,
    values,
    signatures,
    calldatas,
    ethers.utils.id(description)
  );
  
  // Wait for timelock delay
  const timelockDelay = await governor.timelock().then(addr => {
    return ethers.getContractAt("TimelockController", addr)
      .then(contract => contract.getMinDelay());
  });
  
  await time.increase(timelockDelay);
  
  // Execute the upgrade
  await governor.execute(
    targets,
    values,
    signatures,
    calldatas,
    ethers.utils.id(description)
  );
  
  console.log("Upgrade executed successfully!");
}
```

---

## 11. Appendices

### 11.1 Data Structure Definitions

#### 11.1.1 FactionRegistry Structures

```solidity
// Faction member details
struct FactionMember {
    uint8 factionId;         // 1=Law Enforcement, 2=Criminal, 3=Vigilante
    uint8 rank;              // 1-10 rank scale
    uint256 reputation;      // Accumulated reputation points
    uint256 joinedAt;        // Timestamp when member joined
    bool active;             // Whether membership is active
}

// Faction information
struct FactionInfo {
    string name;             // Faction name
    string description;      // Faction description
    uint256 totalMembers;    // Total number of active members
    uint256 totalReputation; // Cumulative reputation of all members
    uint256 influenceScore;  // Calculated influence score
    bool active;             // Whether faction is active
}

// Role definition
struct FactionRole {
    string name;             // Role name
    uint8 minimumRank;       // Minimum rank required
    uint256 reputationThreshold; // Minimum reputation required
    bool active;             // Whether role is active
}
```

#### 11.1.2 TerritoryRegistry Structures

```solidity
// Territory zone definition
struct Territory {
    string name;                     // Territory name
    uint8 zoneType;                  // 1=High-Security, 2=Medium-Security, 3=No-Go Zone
    uint256 baseValue;               // Base economic value
    uint256 resourceGenerationRate;  // Resources generated per block
    uint8 controllingFaction;        // 0=None, 1=Law Enforcement, 2=Criminal, 3=Vigilante
    uint256 lastUpdateBlock;         // Last block when territory state was updated
    bool contested;                  // Whether territory is currently contested
    bool active;                     // Whether territory is active
}

// Territory economic data
struct TerritoryEconomics {
    uint256 totalValueLocked;        // Total value of assets in territory
    uint256 dailyTransactionVolume;  // Average daily transaction volume
    uint256 resourceBalance;         // Current unallocated resources
    uint256 taxRate;                 // Territory-specific tax rate (basis points)
    uint256 lastEconomicUpdate;      // Timestamp of last economic update
}
```

#### 11.1.3 TerritoryStaking Structures

```solidity
// Stake definition
struct Stake {
    address staker;         // Address of the staker
    uint256 territoryId;    // ID of the territory
    uint256 amount;         // Amount of tokens staked
    uint8 factionId;        // Faction ID the staker belongs to
    uint256 startTime;      // When the stake was created
    uint256 lastClaimTime;  // When rewards were last claimed
    bool active;            // Whether the stake is active
}

// Territory staking info
struct TerritoryStakingInfo {
    uint256 totalStaked;               // Total tokens staked on territory
    mapping(uint8 => uint256) factionStakes; // Total stakes by faction
    uint256 rewardRate;                // Current reward rate
    uint256 lastUpdateTime;            // Last time staking info was updated
    bool autoCompound;                 // Whether rewards auto-compound
}
```

#### 11.1.4 TreasuryManagement Structures

```solidity
// Treasury allocation
struct TreasuryAllocation {
    uint256 operationalFunds; // Funds for day-to-day operations
    uint256 developmentFunds; // Funds for game development
    uint256 marketingFunds;   // Funds for marketing initiatives
    uint256 communityFunds;   // Funds for community rewards
    uint256 reserveFunds;     // Emergency reserve funds
}

// Faction treasury details
struct FactionTreasury {
    uint256 balance;            // Current balance
    uint256 totalReceived;      // Total funds received over time
    uint256 totalSpent;         // Total funds spent over time
    uint256 lastUpdateBlock;    // Block when last updated
}

// Spending request
struct SpendRequest {
    uint256 id;                 // Request ID
    address proposer;           // Address that proposed the spending
    address recipient;          // Recipient address
    uint256 amount;             // Amount to spend
    string purpose;             // Purpose of the spending
    uint256 proposalId;         // Associated governance proposal ID (if any)
    bool executed;              // Whether the request has been executed
    uint256 createdAt;          // When the request was created
    uint8 requiredApprovals;    // Number of approvals required
    address[] approvers;        // Addresses that approved the request
}
```

#### 11.1.5 NFTMarketplace Structures

```solidity
// Listing types
enum ListingType {
    FixedPrice,
    Auction,
    Rental,
    BlackMarket,
    Escrow
}

// NFT standards
enum NFTStandard {
    Unsupported,
    ERC721,
    ERC1155
}

// Listing information
struct Listing {
    uint256 id;
    address seller;
    address nftContract;
    uint256 tokenId;
    uint256 quantity;
    uint256 price;
    ListingType listingType;
    bool active;
    uint256 createdAt;
    uint8 factionRequirement; // 0 = No requirement, 1-3 = Specific faction required
    uint8 minimumRank; // 0 = No rank requirement, 1+ = Minimum rank required
    uint256 territoryId; // 0 = No territory association
}

// Auction information
struct AuctionInfo {
    uint256 listingId;
    uint256 startingPrice;
    uint256 reservePrice;
    uint256 currentBid;
    address currentBidder;
    uint256 endTime;
    bool finalized;
}

// Rental information
struct RentalInfo {
    uint256 listingId;
    uint256 duration; // Duration in days
    uint256 pricePerDay;
    address currentRenter;
    uint256 startTime;
    uint256 endTime;
    bool active;
}

// Escrow trade information
struct EscrowTrade {
    uint256 id;
    address initiator;
    address counterparty;
    address[] offerNftContracts;
    uint256[] offerTokenIds;
    uint256[] offerQuantities;
    address[] requestNftContracts;
    uint256[] requestTokenIds;
    uint256[] requestQuantities;
    uint256 initiatorAlstraAmount;
    uint256 counterpartyAlstraAmount;
    bool initiatorApproved;
    bool counterpartyApproved;
    bool completed;
    bool canceled;
    uint256 createdAt;
    uint256 expiresAt;
}

// Fee distribution configuration
struct FeeDistribution {
    uint256 daoTreasuryPercentage;
    uint256 territoryControllerPercentage;
    uint256 sellerFactionPercentage;
    uint256 burnPercentage;
}
```

### 11.2 Event Definitions

#### 11.2.1 FactionRegistry Events

```solidity
// User joins a faction
event MemberJoined(address indexed member, uint8 indexed factionId);

// User leaves a faction
event MemberLeft(address indexed member, uint8 indexed factionId);

// Member rank changes
event RankChanged(address indexed member, uint8 indexed factionId, uint8 oldRank, uint8 newRank);

// Member reputation changes
event ReputationChanged(address indexed member, uint8 indexed factionId, uint256 oldReputation, uint256 newReputation);

// Faction influence updates
event InfluenceUpdated(uint8 indexed factionId, uint256 oldInfluence, uint256 newInfluence);

// Faction role creation
event RoleCreated(uint8 indexed factionId, uint8 indexed roleId, string name, uint8 minimumRank, uint256 reputationThreshold);

// Faction role update
event RoleUpdated(uint8 indexed factionId, uint8 indexed roleId, string name, uint8 minimumRank, uint256 reputationThreshold);
```

#### 11.2.2 TerritoryRegistry Events

```solidity
// New territory creation
event TerritoryCreated(uint256 indexed territoryId, string name, uint8 zoneType, uint256 baseValue);

// Territory control change
event TerritoryControlChanged(uint256 indexed territoryId, uint8 oldFaction, uint8 newFaction);

// Territory value update
event TerritoryValueUpdated(uint256 indexed territoryId, uint256 oldValue, uint256 newValue);

// Resource rate update
event ResourceRateUpdated(uint256 indexed territoryId, uint256 oldRate, uint256 newRate);

// Territory contest status change
event TerritoryContestedStatusChanged(uint256 indexed territoryId, bool contested);

// Economic data update
event TerritoryEconomicsUpdated(uint256 indexed territoryId, uint256 totalValueLocked, uint256 dailyTransactionVolume);

// Tax rate change
event TerritoryTaxRateChanged(uint256 indexed territoryId, uint256 oldRate, uint256 newRate);
```

### 11.3 Integration with AlstraToken

The AlstraToken serves as the foundation of the economic system in the Faction Wars ecosystem. All contracts interacting with AlstraToken should follow these integration patterns:

#### 11.3.1 Token Transfer Patterns

```solidity
// For contract interactions and approvals
interface IAlstraToken {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
}

// Efficient transfer pattern
function _safeTransferFrom(
    address token,
    address from,
    address to,
    uint256 amount
) internal {
    bool success = IERC20(token).transferFrom(from, to, amount);
    require(success, "Token transfer failed");
}

// Efficient approval pattern
function _safeApprove(
    address token,
    address spender,
    uint256 amount
) internal {
    // Reset approval to 0 first to prevent certain ERC20 issues
    IERC20(token).approve(spender, 0);
    bool success = IERC20(token).approve(spender, amount);
    require(success, "Token approval failed");
}
```

#### 11.3.2 Fee Handling Integration

Integrating with AlstraToken's fee mechanism requires special handling:

```solidity
// For contracts that need to account for fees
function _getAmountAfterFees(uint256 amount) internal view returns (uint256) {
    uint256 feeRate = _alstraToken.feeRate();
    uint256 feeDenominator = _alstraToken.FEE_DENOMINATOR();
    uint256 totalFee = (amount * feeRate) / feeDenominator;
    
    return amount - totalFee;
}

// For contracts that need to ensure specific amounts are received
function _transferWithFeesCompensation(
    address from,
    address to,
    uint256 exactAmountToReceive
) internal {
    uint256 feeRate = _alstraToken.feeRate();
    uint256 feeDenominator = _alstraToken.FEE_DENOMINATOR();
    
    // Calculate gross amount needed to result in the exact net amount
    uint256 grossAmount = (exactAmountToReceive * feeDenominator) / (feeDenominator - feeRate);
    
    // Transfer with fee compensation
    _alstraToken.transferFrom(from, to, grossAmount);
}
```

### 11.4 Integration with BaseGovernor

The Faction Wars ecosystem uses the BaseGovernor contract for governance. Contracts that need governance control should implement these patterns:

#### 11.4.1 Governance-Controlled Functions

```solidity
// For functions that can only be called through governance
modifier onlyGovernance() {
    require(
        msg.sender == address(_timelock),
        "Only governance can call this function"
    );
    _;
}

// Example governance-controlled function
function updateMarketplaceFee(uint256 newFeePercentage) external onlyGovernance {
    uint256 oldFeePercentage = marketplaceFeePercentage;
    marketplaceFeePercentage = newFeePercentage;
    
    emit MarketplaceFeeUpdated(oldFeePercentage, newFeePercentage);
}
```

#### 11.4.2 Proposal Creation Helpers

```solidity
// Interface for BaseGovernor
interface IBaseGovernor {
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256);
    
    function queue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) external returns (uint256);
    
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) external payable returns (uint256);
}

// Helper for creating proposals
function createProposal(
    address target,
    uint256 value,
    bytes memory callData,
    string memory description
) external returns (uint256) {
    address[] memory targets = new address[](1);
    targets[0] = target;
    
    uint256[] memory values = new uint256[](1);
    values[0] = value;
    
    bytes[] memory calldatas = new bytes[](1);
    calldatas[0] = callData;
    
    return IBaseGovernor(_governor).propose(
        targets,
        values,
        calldatas,
        description
    );
}
```

This comprehensive technical specification document provides the foundation for developing the Faction Wars ecosystem contracts according to best practices. It emphasizes code reusability through libraries, secure implementation patterns, and integration with the governance system.

Developers implementing these contracts should follow the guidelines and implementation considerations outlined in this document to ensure security, efficiency, and proper integration between the different components of the ecosystem.