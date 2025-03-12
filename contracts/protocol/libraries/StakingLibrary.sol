// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title StakingLibrary
 * @dev Simplified library for staking-related calculations in the Police & Thief ecosystem.
 *      Handles territory control, staking rewards, and contested status.
 */
library StakingLibrary {
    // Single precision constant for all calculations
    uint256 public constant PRECISION = 1e18;

    // Time constants
    uint256 public constant SECONDS_IN_DAY = 86400;
    uint256 public constant SECONDS_IN_YEAR = 365 * SECONDS_IN_DAY;

    // Staking parameters
    uint256 public constant MIN_STAKE_PERIOD = 7 * SECONDS_IN_DAY; // 7 days
    uint256 public constant MAX_STAKE_PERIOD = 365 * SECONDS_IN_DAY; // 1 year
    uint256 public constant MAX_MULTIPLIER = 3 * PRECISION; // 3x max multiplier

    // Emergency withdrawal parameters
    uint256 public constant MIN_PENALTY = (5 * PRECISION) / 100; // 5%
    uint256 public constant MAX_PENALTY = (50 * PRECISION) / 100; // 50%

    /**
     * @dev Calculates staking rewards based on amount, duration and territory value
     * @param stakeAmount Amount of tokens staked
     * @param stakeDuration Duration of the stake in seconds
     * @param territoryValue Economic value of the territory
     * @param baseRewardRate Base reward rate per year (annual percentage with precision)
     * @param factionBonus Bonus based on faction (0-100)
     * @return The calculated reward amount
     */
    function calculateStakingReward(
        uint256 stakeAmount,
        uint256 stakeDuration,
        uint256 territoryValue,
        uint256 baseRewardRate,
        uint8 factionBonus
    ) public pure returns (uint256) {
        // Early return for zero values
        if (stakeAmount == 0 || stakeDuration == 0) {
            return 0;
        }

        // Calculate annual reward
        uint256 annualReward = (stakeAmount * baseRewardRate) / PRECISION;

        // Calculate pro-rated reward based on duration
        uint256 durationFactor = (stakeDuration * PRECISION) / SECONDS_IN_YEAR;
        uint256 baseReward = (annualReward * durationFactor) / PRECISION;

        // Calculate territory value multiplier (linear approach)
        uint256 territoryMultiplier = PRECISION;
        if (territoryValue > 0) {
            // Create multiplier between 1x-2x based on territory value
            territoryMultiplier =
                PRECISION +
                ((territoryValue * PRECISION) / 10000);

            // Cap multiplier at 2x
            if (territoryMultiplier > 2 * PRECISION) {
                territoryMultiplier = 2 * PRECISION;
            }
        }

        // Calculate faction bonus multiplier
        uint256 factionMultiplier = PRECISION +
            ((uint256(factionBonus) * PRECISION) / 100);

        // Calculate final reward with both multipliers
        return
            (baseReward * territoryMultiplier * factionMultiplier) /
            (PRECISION * PRECISION);
    }

    /**
     * @dev Calculates the controlling faction based on stake distribution
     * @param factionStakes Array of stake amounts by faction (indexed by faction ID)
     * @param totalStaked Total amount staked on the territory
     * @param controlThreshold Minimum percentage for control (e.g., 50 = 50%)
     * @return controllingFaction The faction that controls the territory (0 if none)
     * @return controlPercentage The percentage of control the faction has
     * @return hasControl Whether any faction has established control
     */
    function calculateControllingFaction(
        uint256[] memory factionStakes,
        uint256 totalStaked,
        uint8 controlThreshold
    )
        public
        pure
        returns (
            uint8 controllingFaction,
            uint256 controlPercentage,
            bool hasControl
        )
    {
        // Return early if no stakes
        if (totalStaked == 0) {
            return (0, 0, false);
        }

        // Find faction with highest stake
        uint256 highestStake = 0;
        controllingFaction = 0;

        // Start from index 1 since faction IDs start from 1
        for (uint8 i = 1; i < factionStakes.length; i++) {
            if (factionStakes[i] > highestStake) {
                highestStake = factionStakes[i];
                controllingFaction = i;
            }
        }

        // Calculate control percentage
        controlPercentage = (highestStake * 100) / totalStaked;

        // Check if control threshold is met
        hasControl = (controlPercentage >= controlThreshold);

        // Reset controlling faction to 0 if threshold not met
        if (!hasControl) {
            controllingFaction = 0;
        }

        return (controllingFaction, controlPercentage, hasControl);
    }

    /**
     * @dev Determines if territory control is contested based on stake distribution
     * @param factionStakes Array of stake amounts by faction (indexed by faction ID)
     * @param totalStaked Total amount staked on the territory
     * @param contestThreshold Percentage gap below which territory is contested
     * @return isContested Whether the territory is contested
     * @return dominantFaction The faction with the highest stake (0 if none)
     * @return challengerFaction The faction with the second highest stake (0 if none)
     */
    function evaluateContestedStatus(
        uint256[] memory factionStakes,
        uint256 totalStaked,
        uint8 contestThreshold
    )
        public
        pure
        returns (
            bool isContested,
            uint8 dominantFaction,
            uint8 challengerFaction
        )
    {
        // Return early if no stakes
        if (totalStaked == 0) {
            return (false, 0, 0);
        }

        // Find dominant and challenger factions
        uint256 highestStake = 0;
        uint256 secondHighestStake = 0;
        dominantFaction = 0;
        challengerFaction = 0;

        // Start from index 1 since faction IDs start from 1
        for (uint8 i = 1; i < factionStakes.length; i++) {
            if (factionStakes[i] > highestStake) {
                // Current highest becomes second highest
                secondHighestStake = highestStake;
                challengerFaction = dominantFaction;

                // New highest
                highestStake = factionStakes[i];
                dominantFaction = i;
            } else if (factionStakes[i] > secondHighestStake) {
                // New second highest
                secondHighestStake = factionStakes[i];
                challengerFaction = i;
            }
        }

        // Calculate control percentages
        uint256 dominantPercentage = (highestStake * 100) / totalStaked;
        uint256 challengerPercentage = (secondHighestStake * 100) / totalStaked;

        // Territory is contested if:
        // 1. The dominant faction has less than 50% control, or
        // 2. The gap between dominant and challenger is less than the contest threshold
        isContested =
            (dominantPercentage < 50) ||
            (dominantPercentage - challengerPercentage < contestThreshold);

        return (isContested, dominantFaction, challengerFaction);
    }

    /**
     * @dev Calculates penalty for emergency withdrawal based on remaining lock time
     * @param originalStakePeriod Original intended staking period in seconds
     * @param timeStaked Time already staked in seconds
     * @return The penalty percentage (with precision)
     */
    function calculateEmergencyWithdrawalPenalty(
        uint256 originalStakePeriod,
        uint256 timeStaked
    ) public pure returns (uint256) {
        // No penalty if stake period is complete
        if (timeStaked >= originalStakePeriod) {
            return 0;
        }

        // Calculate the percentage of time remaining
        uint256 timeRemaining = originalStakePeriod - timeStaked;

        // Linear penalty based on remaining time
        return
            MIN_PENALTY +
            ((timeRemaining * (MAX_PENALTY - MIN_PENALTY)) /
                originalStakePeriod);
    }

    /**
     * @dev Calculates a stake period multiplier based on stake duration
     * @param stakePeriod The intended period of the stake in seconds
     * @param factionBonus Bonus percentage based on faction type (0-100)
     * @return The stake period multiplier (with precision)
     */
    function calculateStakePeriodMultiplier(
        uint256 stakePeriod,
        uint256 factionBonus
    ) public pure returns (uint256) {
        // No multiplier for periods shorter than minimum
        if (stakePeriod < MIN_STAKE_PERIOD) {
            return PRECISION; // 1x multiplier
        }

        // Cap the period at the maximum
        uint256 effectivePeriod = stakePeriod > MAX_STAKE_PERIOD
            ? MAX_STAKE_PERIOD
            : stakePeriod;

        // Base multiplier increases linearly with stake period
        // From 1x at minimum period to 2x at maximum period
        uint256 baseMultiplier = PRECISION +
            (((effectivePeriod - MIN_STAKE_PERIOD) * PRECISION) /
                (MAX_STAKE_PERIOD - MIN_STAKE_PERIOD));

        // Apply faction bonus
        uint256 multiplier = (baseMultiplier * (100 + factionBonus)) / 100;

        // Ensure multiplier doesn't exceed maximum
        return multiplier > MAX_MULTIPLIER ? MAX_MULTIPLIER : multiplier;
    }

    /**
     * @dev Returns the minimum of two numbers
     * @param a First number
     * @param b Second number
     * @return The smaller of the two numbers
     */
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
