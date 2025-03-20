// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "../protocol/libraries/RevenueLibrary.sol";

/**
 * @title RevenueLibraryTestWrapper
 * @dev A testing wrapper contract that exposes the internal functions of RevenueLibrary
 *      as public functions for testing purposes. This contract is NOT meant for
 *      production use and should only be deployed in test environments.
 *
 *      This pattern allows us to:
 *      1. Maintain proper library design with internal functions
 *      2. Still be able to test library functions directly
 *      3. Generate accurate test coverage metrics
 */
contract RevenueLibraryTestWrapper {
    /**
     * @dev Exposes the PRECISION constant from RevenueLibrary
     * @return The precision value used in calculations
     */
    function getPRECISION() public pure returns (uint256) {
        return RevenueLibrary.PRECISION;
    }

    /**
     * @dev Exposes the PERCENTAGE_DENOMINATOR constant from RevenueLibrary
     * @return The denominator used for percentage calculations
     */
    function getPERCENTAGE_DENOMINATOR() public pure returns (uint256) {
        return RevenueLibrary.PERCENTAGE_DENOMINATOR;
    }

    /**
     * @dev Exposes the MINIMUM_DISTRIBUTION constant from RevenueLibrary
     * @return The minimum distribution amount
     */
    function getMINIMUM_DISTRIBUTION() public pure returns (uint256) {
        return RevenueLibrary.MINIMUM_DISTRIBUTION;
    }

    /**
     * @dev Exposes the MAX_DOMINANCE_FACTOR constant from RevenueLibrary
     * @return The maximum dominance factor allowed
     */
    function getMAX_DOMINANCE_FACTOR() public pure returns (uint256) {
        return RevenueLibrary.MAX_DOMINANCE_FACTOR;
    }

    /**
     * @dev Exposes the MIN_DISTRIBUTION_SHARES constant from RevenueLibrary
     * @return The minimum shares for each faction
     */
    function getMIN_DISTRIBUTION_SHARES() public pure returns (uint256) {
        return RevenueLibrary.MIN_DISTRIBUTION_SHARES;
    }

    /**
     * @dev Wrapper for RevenueLibrary.calculateRevenueDistribution
     * @param totalRevenue Total revenue to distribute
     * @param territoryInfluence Array of territory influence percentages by faction
     * @param factionCount Number of factions
     * @param daoTreasuryPercentage Percentage allocated to the DAO treasury (in basis points)
     * @param burnPercentage Percentage to burn (in basis points)
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
    ) public pure returns (
        uint256[] memory distribution,
        uint256 daoAmount,
        uint256 burnAmount
    ) {
        return RevenueLibrary.calculateRevenueDistribution(
            totalRevenue,
            territoryInfluence,
            factionCount,
            daoTreasuryPercentage,
            burnPercentage
        );
    }

    /**
     * @dev Wrapper for RevenueLibrary.calculateStakingRewardsDistribution
     * @param totalRewards Total rewards to distribute
     * @param stakes Array of stake amounts by user
     * @param totalStaked Total amount staked
     * @return rewards Array of reward amounts by user index
     */
    function calculateStakingRewardsDistribution(
        uint256 totalRewards,
        uint256[] memory stakes,
        uint256 totalStaked
    ) public pure returns (uint256[] memory rewards) {
        return RevenueLibrary.calculateStakingRewardsDistribution(
            totalRewards,
            stakes,
            totalStaked
        );
    }

    /**
     * @dev Wrapper for RevenueLibrary.calculateTreasuryAllocation
     * @param totalTreasury Total treasury amount to allocate
     * @param operationalWeight Weight for operational funds (basis points)
     * @param developmentWeight Weight for development funds (basis points)
     * @param marketingWeight Weight for marketing funds (basis points)
     * @param communityWeight Weight for community funds (basis points)
     * @param reserveWeight Weight for reserve funds (basis points)
     * @return operationalFunds Amount allocated for operations
     * @return developmentFunds Amount allocated for development
     * @return marketingFunds Amount allocated for marketing
     * @return communityFunds Amount allocated for community
     * @return reserveFunds Amount allocated for reserves
     */
    function calculateTreasuryAllocation(
        uint256 totalTreasury,
        uint256 operationalWeight,
        uint256 developmentWeight,
        uint256 marketingWeight,
        uint256 communityWeight,
        uint256 reserveWeight
    ) public pure returns (
        uint256 operationalFunds,
        uint256 developmentFunds,
        uint256 marketingFunds,
        uint256 communityFunds,
        uint256 reserveFunds
    ) {
        return RevenueLibrary.calculateTreasuryAllocation(
            totalTreasury,
            operationalWeight,
            developmentWeight,
            marketingWeight,
            communityWeight,
            reserveWeight
        );
    }

    /**
     * @dev Wrapper for RevenueLibrary.calculateFactionRevenueBoost
     * @param baseRevenue Base revenue amount
     * @param factionMemberCount Number of members in the faction
     * @param factionActivity Faction activity score (higher means more active)
     * @param territoryControl Percentage of territory controlled by faction (basis points)
     * @param marketDominance Percentage of marketplace activity by faction (basis points)
     * @return The revenue after applying performance-based boost
     */
    function calculateFactionRevenueBoost(
        uint256 baseRevenue,
        uint256 factionMemberCount,
        uint256 factionActivity,
        uint256 territoryControl,
        uint256 marketDominance
    ) public pure returns (uint256) {
        return RevenueLibrary.calculateFactionRevenueBoost(
            baseRevenue,
            factionMemberCount,
            factionActivity,
            territoryControl,
            marketDominance
        );
    }

    /**
     * @dev Wrapper for RevenueLibrary.calculateDynamicRevenueSharing
     * @param totalRevenue Total revenue to distribute
     * @param factions Array of faction IDs
     * @param contributions Array of contribution scores by faction
     * @param baseSplit Base split percentage (basis points) guaranteed to each faction
     * @return shares Array of revenue shares by faction index
     */
    function calculateDynamicRevenueSharing(
        uint256 totalRevenue,
        uint8[] memory factions,
        uint256[] memory contributions,
        uint256 baseSplit
    ) public pure returns (uint256[] memory shares) {
        return RevenueLibrary.calculateDynamicRevenueSharing(
            totalRevenue,
            factions,
            contributions,
            baseSplit
        );
    }

    /**
     * @dev Wrapper for RevenueLibrary.calculateAntiMonopolyAdjustment
     * @param shares Original revenue shares
     * @param dominanceFactor Current dominance factor of top factions (basis points)
     * @param targetFactor Target dominance factor (basis points)
     * @return adjustedShares Revenue shares after anti-monopoly adjustment
     */
    function calculateAntiMonopolyAdjustment(
        uint256[] memory shares,
        uint256 dominanceFactor,
        uint256 targetFactor
    ) public pure returns (uint256[] memory adjustedShares) {
        return RevenueLibrary.calculateAntiMonopolyAdjustment(
            shares,
            dominanceFactor,
            targetFactor
        );
    }

    /**
     * @dev Wrapper for RevenueLibrary.calculateTerritoryValue
     * @param baseValue Base value of the territory
     * @param economicActivity Level of economic activity (transaction volume, etc.)
     * @param controlDuration Duration the territory has been controlled (in blocks)
     * @param isContested Whether the territory is currently contested
     * @return territoryValue Calculated value of the territory for revenue distribution
     */
    function calculateTerritoryValue(
        uint256 baseValue,
        uint256 economicActivity,
        uint256 controlDuration,
        bool isContested
    ) public pure returns (uint256 territoryValue) {
        return RevenueLibrary.calculateTerritoryValue(
            baseValue,
            economicActivity,
            controlDuration,
            isContested
        );
    }

    /**
     * @dev Wrapper for RevenueLibrary.min
     * @param a First number
     * @param b Second number
     * @return The smaller of the two numbers
     */
    function min(uint256 a, uint256 b) public pure returns (uint256) {
        return RevenueLibrary.min(a, b);
    }

    /**
     * @dev Wrapper for RevenueLibrary.sqrt
     * @param x The number to find the square root of
     * @return The square root of the given number
     */
    function sqrt(uint256 x) public pure returns (uint256) {
        return RevenueLibrary.sqrt(x);
    }
}