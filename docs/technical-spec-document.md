# Police & Thief Core Gameplay Contracts
## Technical Specification Document

**Version:** 1.0  
**Date:** March 11, 2025  
**Classification:** Development Reference  

---

## Table of Contents

1. [Overview](#overview)
2. [Contract Specifications](#contract-specifications)
   - [TerritoryRegistry](#territoryregistry)
   - [TerritoryStaking](#territorystaking)
   - [FactionRegistry](#factionregistry)
   - [DAOGovernor](#daogovernor)
   - [TreasuryManagement](#treasurymanagement)
3. [Contract Interactions](#contract-interactions)
4. [Game Mechanics Implementation](#game-mechanics-implementation)
5. [Security Considerations](#security-considerations)
6. [Testing Strategy](#testing-strategy)
7. [Upgrade Paths](#upgrade-paths)

---

## Overview

This technical specification document defines the implementation details for the core gameplay contracts of the Police & Thief game on the AlstraNet blockchain. These contracts implement territory control, faction dynamics, governance, and economic systems that form the backbone of gameplay.

The gameplay centers around three competing factions (Law Enforcement, Criminal Syndicate, and Vigilante) that vie for control of territories within Lagos, Nigeria. Players earn reputation and rewards by staking tokens on territories, participating in governance, and engaging in faction-specific activities.

---

## Contract Specifications

### TerritoryRegistry

#### Purpose
Defines territory zones across Lagos and tracks their properties, including economic value, resource generation rates, and controlling factions.

#### State Variables

```solidity
// Territory structure
struct Territory {
    string name;
    uint8 zoneType; // 1=High-Security, 2=Medium-Security, 3=No-Go Zone
    uint256 baseValue; // Base economic value
    uint256 resourceGenerationRate; // Resources generated per block
    uint8 controllingFaction; // 0=None, 1=Law Enforcement, 2=Criminal, 3=Vigilante
    uint256 lastUpdateBlock; // Last block when territory state was updated
    bool contested; // Whether territory is currently contested
    mapping(uint8 => uint256) factionInfluence; // Influence by faction
}

// Mapping of territory ID to Territory
mapping(uint256 => Territory) public territories;

// Total number of territories
uint256 public territoriesCount;

// Mapping of faction ID to territory IDs controlled by that faction
mapping(uint8 => uint256[]) public territoriesByFaction;

// Territory event trigger thresholds
struct EventThresholds {
    uint256 crimeWaveThreshold;
    uint256 policeRaidThreshold;
    uint256 vigilanteInterventionThreshold;
}
mapping(uint256 => EventThresholds) public territoryEventThresholds;

// Access control roles
bytes32 public constant TERRITORY_MANAGER_ROLE = keccak256("TERRITORY_MANAGER_ROLE");
bytes32 public constant EVENT_MANAGER_ROLE = keccak256("EVENT_MANAGER_ROLE");
```

#### Functions

**createTerritory**
```solidity
function createTerritory(
    string calldata name,
    uint8 zoneType,
    uint256 baseValue,
    uint256 resourceGenerationRate
) external onlyRole(TERRITORY_MANAGER_ROLE) returns (uint256)
```
- Creates a new territory with the specified parameters
- Returns the ID of the created territory
- Validates that zoneType is in range 1-3
- Emits TerritoryCreated event

**updateTerritoryValue**
```solidity
function updateTerritoryValue(uint256 territoryId, uint256 newValue) 
    external onlyRole(TERRITORY_MANAGER_ROLE)
```
- Updates the economic value of a territory
- Validates territory exists
- Emits TerritoryValueUpdated event

**setControllingFaction**
```solidity
function setControllingFaction(uint256 territoryId, uint8 factionId) 
    external onlyRole(TERRITORY_MANAGER_ROLE)
```
- Sets the controlling faction for a territory
- Called by the TerritoryStaking contract when control changes
- Updates territoriesByFaction mapping
- Emits TerritoryControlChanged event

**setContestedStatus**
```solidity
function setContestedStatus(uint256 territoryId, bool contested) 
    external onlyRole(TERRITORY_MANAGER_ROLE)
```
- Marks a territory as contested or uncontested
- Called by TerritoryStaking when stakes are close
- Emits TerritoryContestedStatusChanged event

**calculateTerritoryValue**
```solidity
function calculateTerritoryValue(uint256 territoryId) 
    external view returns (uint256)
```
- Calculates current value based on base value, controlling faction, and contested status
- Contested territories have their value multiplied by 1.5
- Territories controlled by factions for long periods get value bonuses

**calculateResourcesGenerated**
```solidity
function calculateResourcesGenerated(uint256 territoryId) 
    external view returns (uint256)
```
- Calculates resources generated since last update
- Based on resource generation rate and blocks elapsed
- No resources generated if territory is contested

**setEventThresholds**
```solidity
function setEventThresholds(
    uint256 territoryId,
    uint256 crimeWaveThreshold,
    uint256 policeRaidThreshold,
    uint256 vigilanteInterventionThreshold
) external onlyRole(EVENT_MANAGER_ROLE)
```
- Sets the thresholds for triggering various events in a territory
- Thresholds based on faction influence levels

**checkEventTriggers**
```solidity
function checkEventTriggers(uint256 territoryId)
    external view returns (bool crimeWave, bool policeRaid, bool vigilanteIntervention)
```
- Checks if any events should be triggered in a territory
- Compares current faction influences against thresholds

**getTerritoryZoneType**
```solidity
function getTerritoryZoneType(uint256 territoryId)
    external view returns (uint8)
```
- Returns the zone type of a territory
- Used by other contracts to apply zone-specific rules

#### Security Considerations
- Only TERRITORY_MANAGER_ROLE should be able to create or modify territories
- TerritoryStaking contract should be granted this role
- Value calculations should prevent integer overflow
- Validation of all inputs, particularly territory IDs

### TerritoryStaking

#### Purpose
Manages the staking of Alstra tokens to gain control of territories and distributes rewards to stakers based on territory control.

#### State Variables

```solidity
// Stake structure
struct Stake {
    address staker;
    uint256 territoryId;
    uint256 amount;
    uint8 factionId;
    uint256 startTime;
    uint256 lastClaimTime;
    bool active;
}

// Mapping of stake ID to Stake
mapping(uint256 => Stake) public stakes;

// Counter for stake IDs
uint256 public nextStakeId;

// Mapping of territory ID to total staked amount
mapping(uint256 => uint256) public totalStakedByTerritory;

// Mapping of territory ID to faction ID to staked amount
mapping(uint256 => mapping(uint8 => uint256)) public factionStakesByTerritory;

// Mapping of user address to array of their stake IDs
mapping(address => uint256[]) public userStakes;

// Mapping of territory ID to array of stake IDs
mapping(uint256 => uint256[]) public territoryStakes;

// Threshold for considering a territory contested (percentage difference)
uint256 public contestThreshold = 10; // 10% difference

// Reference to TerritoryRegistry contract
ITerritoryRegistry public territoryRegistry;

// Reference to AlstraToken contract
IAlstraToken public alstraToken;

// Access control roles
bytes32 public constant STAKE_MANAGER_ROLE = keccak256("STAKE_MANAGER_ROLE");
bytes32 public constant REWARD_MANAGER_ROLE = keccak256("REWARD_MANAGER_ROLE");
```

#### Functions

**initialize**
```solidity
function initialize(
    address territoryRegistryAddress,
    address alstraTokenAddress,
    address defaultAdmin,
    address stakeManager,
    address rewardManager
) external initializer
```
- Initializes the contract with references to other contracts
- Sets up roles and initial state

**stakeForTerritory**
```solidity
function stakeForTerritory(
    uint256 territoryId,
    uint256 amount,
    uint8 factionId
) external returns (uint256)
```
- Allows a user to stake tokens on a territory
- Validates territory exists, faction is valid, and amount > 0
- Transfers tokens from user to contract
- Updates faction influence on territory
- Calls territoryRegistry to potentially update controlling faction
- Returns a unique stake ID
- Emits TokensStaked event

**unstake**
```solidity
function unstake(uint256 stakeId) external
```
- Allows a user to withdraw their stake
- Automatically claims any pending rewards
- Updates faction influence
- Transfers tokens back to user
- Emits TokensUnstaked event

**claimRewards**
```solidity
function claimRewards(uint256 stakeId) external returns (uint256)
```
- Allows a user to claim rewards from staking
- Calculates rewards based on stake amount, time elapsed, and territory value
- Transfers reward tokens to user
- Updates lastClaimTime
- Emits RewardsClaimed event

**calculatePendingRewards**
```solidity
function calculatePendingRewards(uint256 stakeId) 
    public view returns (uint256)
```
- Calculates pending rewards for a stake
- Formula: 
  `reward = (territory_value * stake_amount * time_elapsed * reward_rate) / total_staked_on_territory`
- Applies bonus multipliers for controlled territories
- Returns 0 if stake is inactive or territory is contested

**calculateControllingFaction**
```solidity
function calculateControllingFaction(uint256 territoryId) 
    public view returns (uint8)
```
- Determines which faction controls a territory
- Based on highest stake amount
- Returns 0 if no stakes or territory is contested

**isContested**
```solidity
function isContested(uint256 territoryId) 
    public view returns (bool)
```
- Checks if a territory is contested
- Territory is contested if the difference between the top two factions' stakes is less than contestThreshold percentage
- Used to determine if rewards should be distributed

**updateContestThreshold**
```solidity
function updateContestThreshold(uint256 newThreshold) 
    external onlyRole(STAKE_MANAGER_ROLE)
```
- Updates the threshold for determining contested territories
- Validates newThreshold is reasonable (e.g., between 1-50%)

**updateControllingFaction**
```solidity
function updateControllingFaction(uint256 territoryId) 
    internal
```
- Internal function to update the controlling faction of a territory
- Calls calculateControllingFaction
- Updates the TerritoryRegistry if control has changed
- Updates contested status

**getStakesByTerritory**
```solidity
function getStakesByTerritory(uint256 territoryId) 
    external view returns (uint256[] memory)
```
- Returns all stake IDs for a territory

**getStakesByUser**
```solidity
function getStakesByUser(address user) 
    external view returns (uint256[] memory)
```
- Returns all stake IDs for a user

#### Security Considerations
- Prevent double-claiming of rewards
- Check for integer overflow in reward calculations
- Ensure only stake owner can unstake or claim rewards
- Verify token transfers succeed
- Protect against reentrancy attacks

### FactionRegistry

#### Purpose
Manages faction membership, reputation, and influence scores to determine faction standings and access to faction-specific features.

#### State Variables

```solidity
// Faction member structure
struct FactionMember {
    uint8 factionId;
    uint8 rank;
    uint256 reputation;
    uint256 joinedAt;
    bool active;
}

// Faction information structure
struct FactionInfo {
    string name;
    string description;
    uint256 totalMembers;
    uint256 totalReputation;
    uint256 influenceScore;
    bool active;
}

// Mapping of address to FactionMember
mapping(address => FactionMember) public members;

// Mapping of faction ID to FactionInfo
mapping(uint8 => FactionInfo) public factions;

// Mapping of faction ID to array of member addresses
mapping(uint8 => address[]) public factionMembers;

// Mapping for faction-specific roles
mapping(uint8 => mapping(uint8 => mapping(address => bool))) public factionRoles;

// Cooldown period for switching factions (in seconds)
uint256 public factionSwitchCooldown = 7 days;

// Mapping of address to last faction switch timestamp
mapping(address => uint256) public lastFactionSwitch;

// Access control roles
bytes32 public constant FACTION_MANAGER_ROLE = keccak256("FACTION_MANAGER_ROLE");
bytes32 public constant REPUTATION_MANAGER_ROLE = keccak256("REPUTATION_MANAGER_ROLE");
```

#### Functions

**initialize**
```solidity
function initialize(
    address defaultAdmin,
    address factionManager,
    address reputationManager
) external initializer
```
- Initializes the contract with default faction data
- Sets up roles and initial state

**setFactionInfo**
```solidity
function setFactionInfo(
    uint8 factionId, 
    string calldata name,
    string calldata description,
    bool active
) external onlyRole(FACTION_MANAGER_ROLE)
```
- Sets or updates information for a faction
- Emits FactionUpdated event

**joinFaction**
```solidity
function joinFaction(uint8 factionId) external
```
- Allows a user to join a faction
- Validates faction ID is valid and active
- Checks if user is already in a faction (enforces cooldown if switching)
- Updates faction member counts and user status
- Default rank is 1, reputation is 0
- Emits MemberJoined event

**leaveFaction**
```solidity
function leaveFaction() external
```
- Allows a user to leave their current faction
- Updates last faction switch timestamp
- Updates faction member counts
- Emits MemberLeft event

**updateRank**
```solidity
function updateRank(address member, uint8 newRank) 
    external onlyRole(REPUTATION_MANAGER_ROLE)
```
- Updates a member's rank within their faction
- Validates new rank is within allowed range (1-10)
- Emits RankChanged event

**increaseReputation**
```solidity
function increaseReputation(address member, uint256 amount) 
    external onlyRole(REPUTATION_MANAGER_ROLE)
```
- Increases a member's reputation
- Updates faction's total reputation
- Emits ReputationChanged event

**decreaseReputation**
```solidity
function decreaseReputation(address member, uint256 amount) 
    external onlyRole(REPUTATION_MANAGER_ROLE)
```
- Decreases a member's reputation (never below 0)
- Updates faction's total reputation
- Emits ReputationChanged event

**updateFactionInfluence**
```solidity
function updateFactionInfluence(uint8 factionId, uint256 newInfluence) 
    external onlyRole(FACTION_MANAGER_ROLE)
```
- Updates a faction's influence score
- Influence affects governance weight and territory control benefits
- Emits InfluenceUpdated event

**grantFactionRole**
```solidity
function grantFactionRole(address member, uint8 factionId, uint8 roleId) 
    external onlyRole(FACTION_MANAGER_ROLE)
```
- Grants a specific role within a faction to a member
- Validates member belongs to specified faction
- Emits FactionRoleGranted event

**revokeFactionRole**
```solidity
function revokeFactionRole(address member, uint8 factionId, uint8 roleId) 
    external onlyRole(FACTION_MANAGER_ROLE)
```
- Revokes a faction role from a member
- Emits FactionRoleRevoked event

**getFactionMembers**
```solidity
function getFactionMembers(uint8 factionId) 
    external view returns (address[] memory)
```
- Returns all members of a faction

**getDominantFaction**
```solidity
function getDominantFaction() 
    external view returns (uint8)
```
- Returns the faction with the highest influence score
- Used by other contracts for faction-based bonuses

**getTopFactionMembers**
```solidity
function getTopFactionMembers(uint8 factionId, uint256 count) 
    external view returns (address[] memory)
```
- Returns the top members of a faction by reputation
- Limited to the requested count

#### Security Considerations
- Prevent manipulation of faction influence
- Validate all faction IDs and role IDs
- Enforce cooldown for faction switching
- Only authorized roles should modify reputation or ranks

### DAOGovernor

#### Purpose
Enables decentralized governance of the game ecosystem through proposals and voting, with special consideration for faction influence on voting power.

#### State Variables

```solidity
// Proposal structure
struct ProposalDetails {
    string title;
    string description;
    address proposer;
    uint8 proposerFaction;
    uint256 startBlock;
    uint256 endBlock;
    bool executed;
    uint256 forVotes;
    uint256 againstVotes;
    uint256 abstainVotes;
    mapping(uint8 => uint256) factionVotes;
}

// Mapping of proposal ID to ProposalDetails
mapping(uint256 => ProposalDetails) public proposals;

// Mapping of proposal ID to vote receipt by voter
mapping(uint256 => mapping(address => Receipt)) public voteReceipts;

// Vote receipt structure
struct Receipt {
    bool hasVoted;
    uint8 support; // 0=against, 1=for, 2=abstain
    uint256 votes;
}

// Governance parameters
uint256 public votingDelay; // Blocks before voting starts
uint256 public votingPeriod; // Blocks voting remains active
uint256 public proposalThreshold; // Minimum tokens needed to submit proposal

// Reference to token used for voting
IAlstraToken public token;

// Reference to FactionRegistry for faction info
IFactionRegistry public factionRegistry;

// Faction influence multipliers for voting (in basis points)
mapping(uint8 => uint256) public factionVotingMultiplier;

// Mapping of executed proposal IDs to prevent replay
mapping(bytes32 => bool) public proposalExecuted;
```

#### Functions

**initialize**
```solidity
function initialize(
    address tokenAddress,
    address factionRegistryAddress,
    address timelock,
    uint256 initialVotingDelay,
    uint256 initialVotingPeriod,
    uint256 initialProposalThreshold
) external initializer
```
- Initializes the contract with configuration and references
- Sets up initial governance parameters

**propose**
```solidity
function propose(
    address[] memory targets,
    uint256[] memory values,
    string[] memory signatures,
    bytes[] memory calldatas,
    string memory title,
    string memory description
) external returns (uint256)
```
- Creates a new governance proposal
- Verifies caller has enough voting power (>= proposalThreshold)
- Validates proposal parameters
- Returns unique proposal ID
- Emits ProposalCreated event

**castVote**
```solidity
function castVote(uint256 proposalId, uint8 support) external
```
- Allows a token holder to vote on a proposal
- Validates proposal is active and user hasn't already voted
- Applies faction influence multipliers to voting power
- Updates proposal vote counts
- Emits VoteCast event

**castVoteWithReason**
```solidity
function castVoteWithReason(
    uint256 proposalId,
    uint8 support,
    string calldata reason
) external
```
- Same as castVote but includes a reason string
- Reason is included in VoteCast event

**execute**
```solidity
function execute(uint256 proposalId) external
```
- Executes a successful proposal
- Validates proposal exists, succeeded, and hasn't been executed
- Executes each action in the proposal
- Emits ProposalExecuted event

**cancel**
```solidity
function cancel(uint256 proposalId) external
```
- Cancels a proposal before execution
- Only proposer can cancel or if proposer's voting power falls below threshold
- Emits ProposalCanceled event

**state**
```solidity
function state(uint256 proposalId) 
    public view returns (ProposalState)
```
- Returns the current state of a proposal
- States: Pending, Active, Canceled, Defeated, Succeeded, Queued, Executed, Expired

**calculateVotingPower**
```solidity
function calculateVotingPower(address voter, uint256 blockNumber) 
    public view returns (uint256)
```
- Calculates voting power of an address at a specific block
- Base voting power comes from token delegation
- Applies faction influence multiplier based on voter's faction
- Formula: `base_voting_power * faction_multiplier / 10000`

**updateFactionVotingMultiplier**
```solidity
function updateFactionVotingMultiplier(uint8 factionId, uint256 multiplier) 
    external onlyRole(GOVERNOR_ADMIN_ROLE)
```
- Updates the voting power multiplier for a faction
- Multiplier in basis points (e.g., 10000 = 1x, 15000 = 1.5x)
- Rewards dominant faction with higher multiplier

**updateGovernanceParameters**
```solidity
function updateGovernanceParameters(
    uint256 newVotingDelay,
    uint256 newVotingPeriod,
    uint256 newProposalThreshold
) external onlyRole(GOVERNOR_ADMIN_ROLE)
```
- Updates governance parameters
- Validates parameters are within reasonable ranges

**getProposalVotes**
```solidity
function getProposalVotes(uint256 proposalId)
    external view returns (uint256 forVotes, uint256 againstVotes, uint256 abstainVotes)
```
- Returns the current vote counts for a proposal

**getFactionVotes**
```solidity
function getFactionVotes(uint256 proposalId, uint8 factionId)
    external view returns (uint256)
```
- Returns the total votes from a specific faction on a proposal

#### Security Considerations
- Prevent double-voting
- Validate proposal parameters
- Ensure proper counting of votes with faction multipliers
- Protect against proposal spam by enforcing threshold

### TreasuryManagement

#### Purpose
Manages DAO funds and assets, handles spending authorizations, and tracks income and expenditures for the game economy.

#### State Variables

```solidity
// Spending proposal structure
struct SpendingProposal {
    uint256 proposalId;
    address proposer;
    address payable recipient;
    uint256 amount;
    string purpose;
    uint256 createdAt;
    uint256 approvalCount;
    bool executed;
    mapping(address => bool) approvals;
}

// Treasury allocation structure
struct TreasuryAllocation {
    uint256 operationalFunds;
    uint256 developmentFunds;
    uint256 marketingFunds;
    uint256 communityFunds;
    uint256 reserveFunds;
}

// Mapping of proposal ID to SpendingProposal
mapping(uint256 => SpendingProposal) public spendingProposals;

// Counter for proposal IDs
uint256 public nextProposalId;

// Current treasury allocation
TreasuryAllocation public allocation;

// Mapping of faction ID to treasury balance
mapping(uint8 => uint256) public factionTreasury;

// Number of approvals required to execute a spending proposal
uint256 public requiredApprovals;

// List of authorized signers
address[] public authorizedSigners;

// Access control roles
bytes32 public constant TREASURY_ADMIN_ROLE = keccak256("TREASURY_ADMIN_ROLE");
bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
```

#### Functions

**initialize**
```solidity
function initialize(
    address[] memory initialSigners,
    uint256 initialRequiredApprovals,
    address treasuryAdmin
) external initializer
```
- Initializes the contract with initial signers and approval threshold
- Sets up roles and initial state

**depositFunds**
```solidity
function depositFunds(string calldata note) external payable
```
- Accepts funds into the treasury
- Emits FundsDeposited event with note

**createSpendingProposal**
```solidity
function createSpendingProposal(
    address payable recipient,
    uint256 amount,
    string calldata purpose
) external onlyRole(SIGNER_ROLE) returns (uint256)
```
- Creates a proposal to spend treasury funds
- Validates recipient is not zero address and amount > 0
- Returns unique proposal ID
- Emits SpendingProposalCreated event

**approveSpendingProposal**
```solidity
function approveSpendingProposal(uint256 proposalId) 
    external onlyRole(SIGNER_ROLE)
```
- Approves a spending proposal
- Checks signer hasn't already approved
- Updates approval count
- Emits SpendingProposalApproved event

**executeSpendingProposal**
```solidity
function executeSpendingProposal(uint256 proposalId) 
    external onlyRole(SIGNER_ROLE)
```
- Executes a spending proposal that has met approval threshold
- Transfers funds to recipient
- Marks proposal as executed
- Emits SpendingProposalExecuted event

**updateTreasuryAllocations**
```solidity
function updateTreasuryAllocations(
    uint256 operationalFunds,
    uint256 developmentFunds,
    uint256 marketingFunds,
    uint256 communityFunds,
    uint256 reserveFunds
) external onlyRole(TREASURY_ADMIN_ROLE)
```
- Updates the allocation percentages for different treasury categories
- Validates total equals 100%
- Emits TreasuryAllocationsUpdated event

**transferBetweenFactions**
```solidity
function transferBetweenFactions(
    uint8 fromFaction,
    uint8 toFaction,
    uint256 amount,
    string calldata reason
) external onlyRole(TREASURY_ADMIN_ROLE)
```
- Transfers funds between faction treasuries
- Validates sufficient funds in source treasury
- Emits FactionTreasuryTransfer event

**allocateFactionFunds**
```solidity
function allocateFactionFunds(uint8 factionId, uint256 amount) 
    external onlyRole(TREASURY_ADMIN_ROLE)
```
- Allocates funds from main treasury to a faction treasury
- Validates sufficient funds in main treasury
- Emits FactionTreasuryAllocation event

**addSigner**
```solidity
function addSigner(address newSigner) 
    external onlyRole(TREASURY_ADMIN_ROLE)
```
- Adds a new authorized signer
- Grants SIGNER_ROLE to the address
- Emits SignerAdded event

**removeSigner**
```solidity
function removeSigner(address signer) 
    external onlyRole(TREASURY_ADMIN_ROLE)
```
- Removes an authorized signer
- Revokes SIGNER_ROLE from the address
- Emits SignerRemoved event

**updateRequiredApprovals**
```solidity
function updateRequiredApprovals(uint256 newRequiredApprovals) 
    external onlyRole(TREASURY_ADMIN_ROLE)
```
- Updates the number of approvals required to execute a proposal
- Validates newRequiredApprovals is reasonable (e.g., <= number of signers)
- Emits RequiredApprovalsUpdated event

**getTreasuryBalance**
```solidity
function getTreasuryBalance() 
    external view returns (uint256)
```
- Returns the current balance of the treasury

**getFactionTreasuryBalance**
```solidity
function getFactionTreasuryBalance(uint8 factionId) 
    external view returns (uint256)
```
- Returns the balance of a faction's treasury

#### Security Considerations
- Multi-signature requirements for all fund movements
- Validation of fund allocation percentages
- Protection against reentrancy attacks during fund transfers
- Proper access control for administrative functions

---

## Contract Interactions

The following diagram illustrates the interactions between the core gameplay contracts:

```
TerritoryRegistry <--------> TerritoryStaking
      ^                           ^
      |                           |
      v                           v
FactionRegistry <--------> DAOGovernor
      ^                           ^
      |                           |
      v                           v
                TreasuryManagement
```

### Key Interaction Flows

1. **Territory Control**:
   - TerritoryStaking calls TerritoryRegistry to update controlling faction
   - TerritoryRegistry provides territory info to TerritoryStaking for rewards

2. **Faction Influence**:
   - FactionRegistry provides faction data to DAOGovernor for voting multipliers
   - Territory control affects faction influence in FactionRegistry

3. **Treasury Operations**:
   - DAOGovernor can execute proposals affecting TreasuryManagement
   - TerritoryStaking rewards come from TreasuryManagement allocations

4. **Player Progression**:
   - FactionRegistry tracks player reputation gained from TerritoryStaking
   - Higher reputation unlocks permissions in other contracts

---

## Game Mechanics Implementation

### Scoring Mechanism

The Police & Thief game uses a multi-faceted approach to scoring and progression:

1. **Individual Scoring**:
   - Personal reputation within faction (FactionRegistry)
   - Total staked amount across territories (TerritoryStaking)
   - Governance participation score (DAOGovernor)

2. **Faction Scoring**:
   - Territorial control percentage (TerritoryRegistry)
   - Total faction influence (FactionRegistry)
   - Treasury size (TreasuryManagement)

### Territory Control Mechanics

Territories are controlled through a staking mechanism with these key features:

1. **Staking-Based Control**:
   - Faction with highest total stake controls a territory
   - Minimum stake threshold required for initial control
   - Stake withdrawal has cooldown period in contested territories

2. **Contested Territories**:
   - Territory is contested when top two factions are within contestThreshold
   - Contested territories generate no rewards but have 1.5x economic value
   - Resolving contests provides bonus reputation

3. **Zone-Specific Rules**:
   - High-Security zones: Higher rewards, higher stake requirements
   - Medium-Security zones: Balanced rewards and requirements
   - No-Go zones: Highest risk/reward, contested more frequently

### Reputation and Rank System

Player progression is tracked through:

1. **Reputation Points**:
   - Earned from successful territory control
   - Bonus for contested territory resolution
   - Penalty for losing territory control
   - Decays slightly over time if inactive

2. **Rank System**:
   - Ranks 1-10 within each faction
   - Promotion requirements combine reputation and activity
   - Higher ranks unlock voting multipliers and special abilities
   - Leadership positions (ranks 8-10) can manage faction resources

### Economic Incentives

The economic model incentivizes strategic gameplay:

1. **Reward Distribution**:
   - Controlled territories generate Alstra token rewards
   - Reward rate depends on territory value and resource generation
   - Faction influence affects reward multipliers
   - Controlled territory clusters provide adjacency bonuses

2. **Treasury Allocation**:
   - Marketplace fees contribute to faction treasuries
   - Dominant faction receives larger allocation of general treasury
   - Community-voted initiatives funded from treasury

---

## Security Considerations

### Access Control

All contracts implement role-based access control with these principles:

1. **Role Separation**:
   - Administrative roles for contract management
   - Operational roles for regular gameplay functions
   - Emergency roles for critical functions (e.g., pause)

2. **Role Hierarchy**:
   - DEFAULT_ADMIN_ROLE at the top
   - Specialized roles for specific functions
   - Faction-specific roles managed by FactionRegistry

### Funds Protection

Treasury and staked tokens are protected through:

1. **Multi-Signature Requirements**:
   - Treasury spending requires multiple approvals
   - Higher amounts require more approvals

2. **Rate Limiting**:
   - Cooldown periods on large withdrawals
   - Gradual unlocking for large treasury allocations

### Attack Vectors & Mitigations

| Attack Vector | Mitigation Strategy |
|---------------|---------------------|
| Stake Manipulation | Minimum stake amounts, cooldown periods, rate limiting |
| Governance Capture | Faction voting caps, proposal thresholds, timelock delays |
| Economic Exploitation | Dynamic reward rates, anti-farm detection, activity requirements |
| Faction Dominance | Handicap system for dominant faction, catch-up mechanics |

---

## Testing Strategy

### Unit Testing

Each contract should have comprehensive unit tests covering:

1. **Basic Functionality**:
   - All public and external functions
   - Expected state changes
   - Event emissions

2. **Access Control**:
   - Role restrictions
   - Permission checks
   - Ownership validations

3. **Edge Cases**:
   - Zero values
   - Maximum values
   - Invalid inputs

### Integration Testing

Test interactions between contracts:

1. **Contract Dependency Tests**:
   - TerritoryStaking → TerritoryRegistry
   - FactionRegistry → DAOGovernor
   - All contracts → TreasuryManagement

2. **Full Gameplay Flows**:
   - Joining faction → Staking territory → Earning rewards
   - Creating proposal → Voting → Execution
   - Territory contests → Resolution → Reward distribution

### Scenario Testing

Simulate realistic gameplay scenarios:

1. **Faction Competition**:
   - Three-way battle for valuable territory
   - Dominant faction challenged by alliance

2. **Economic Tests**:
   - Long-term token emission and reward rates
   - Treasury growth and spending patterns

3. **Governance Scenarios**:
   - Controversial proposal voting
   - Parameter adjustment impact

---

## Upgrade Paths

All contracts follow the UUPS (Universal Upgradeable Proxy Standard) pattern:

### Upgrade Considerations

1. **State Preservation**:
   - All upgrades must preserve existing state
   - New state variables should be carefully added at the end

2. **Function Compatibility**:
   - Existing function signatures must be maintained
   - New functions can be added
   - Functionality can be enhanced but not removed

3. **Role Transitions**:
   - New roles must be introduced carefully
   - Existing role permissions should not be reduced

### Planned Upgrades

The following upgrade paths are anticipated:

1. **Phase 2: Advanced Features**
   - Enhanced territory events system
   - Deeper faction mechanics
   - More sophisticated reward distribution

2. **Phase 3: Faction-Specific Features**
   - Law enforcement evidence repository
   - Criminal syndicate black market
   - Vigilante community initiatives

3. **Phase 4: Cross-Game Integration**
   - Connect with other AlstraNet ecosystem games
   - Shared economy features
   - Interoperable assets and territories