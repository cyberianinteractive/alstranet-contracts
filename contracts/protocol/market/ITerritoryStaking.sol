// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title ITerritoryStaking
 * @dev Interface for the Territory Staking contract that manages token staking for territory control
 */
interface ITerritoryStaking {
    /**
     * @dev Structure to define a stake
     */
    struct Stake {
        address staker;
        uint256 territoryId;
        uint256 amount;
        uint8 factionId;
        uint256 startTime;
        uint256 lastClaimTime;
        bool active;
    }

    /**
     * @dev Emitted when tokens are staked for a territory
     */
    event TokensStaked(address indexed staker, uint256 indexed territoryId, uint256 amount, uint8 factionId);

    /**
     * @dev Emitted when staked tokens are withdrawn
     */
    event TokensUnstaked(address indexed staker, uint256 indexed territoryId, uint256 amount);

    /**
     * @dev Emitted when a user claims staking rewards
     */
    event RewardsClaimed(address indexed staker, uint256 indexed territoryId, uint256 amount);

    /**
     * @dev Emitted when a faction gains control of a territory
     */
    event TerritoryControlGained(uint256 indexed territoryId, uint8 factionId);

    /**
     * @dev Emitted when a territory becomes contested
     */
    event TerritoryContested(uint256 indexed territoryId, uint8 currentController, uint8 challenger);

    /**
     * @dev Stakes tokens for territory control
     * @param territoryId The ID of the territory
     * @param amount The amount of tokens to stake
     * @param factionId The faction ID the staker belongs to
     * @return stakeId The ID of the created stake
     */
    function stakeForTerritory(
        uint256 territoryId,
        uint256 amount,
        uint8 factionId
    ) external returns (uint256);

    /**
     * @dev Unstakes tokens from a territory
     * @param stakeId The ID of the stake to withdraw
     */
    function unstake(uint256 stakeId) external;

    /**
     * @dev Claims rewards from staking
     * @param stakeId The ID of the stake to claim rewards for
     * @return The amount of rewards claimed
     */
    function claimRewards(uint256 stakeId) external returns (uint256);

    /**
     * @dev Gets the details of a stake
     * @param stakeId The ID of the stake
     * @return staker The address that created the stake
     * @return territoryId The ID of the territory
     * @return amount The amount staked
     * @return factionId The faction ID associated with the stake
     * @return startTime When the stake was created
     * @return lastClaimTime When rewards were last claimed
     * @return active Whether the stake is still active
     */
    function getStakeDetails(uint256 stakeId) external view returns (
        address staker,
        uint256 territoryId,
        uint256 amount,
        uint8 factionId,
        uint256 startTime,
        uint256 lastClaimTime,
        bool active
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
}