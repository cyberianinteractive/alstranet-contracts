// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "../protocol/libraries/StakingLibrary.sol";

/**
 * @title StakingLibraryTestWrapper
 * @dev A testing wrapper contract that exposes the internal functions of StakingLibrary
 *      as public functions for testing purposes. This contract is NOT meant for
 *      production use and should only be deployed in test environments.
 *
 *      This pattern allows us to:
 *      1. Maintain proper library design with internal functions
 *      2. Still be able to test library functions directly
 *      3. Generate accurate test coverage metrics
 */
contract StakingLibraryTestWrapper {
    /**
     * @dev Exposes the PRECISION constant from StakingLibrary
     * @return The precision value used in calculations
     */
    function getPRECISION() public pure returns (uint256) {
        return StakingLibrary.PRECISION;
    }

    /**
     * @dev Exposes the SECONDS_IN_DAY constant from StakingLibrary
     * @return The number of seconds in a day
     */
    function getSECONDS_IN_DAY() public pure returns (uint256) {
        return StakingLibrary.SECONDS_IN_DAY;
    }

    /**
     * @dev Exposes the SECONDS_IN_YEAR constant from StakingLibrary
     * @return The number of seconds in a year
     */
    function getSECONDS_IN_YEAR() public pure returns (uint256) {
        return StakingLibrary.SECONDS_IN_YEAR;
    }

    /**
     * @dev Exposes the MIN_STAKE_PERIOD constant from StakingLibrary
     * @return The minimum staking period in seconds
     */
    function getMIN_STAKE_PERIOD() public pure returns (uint256) {
        return StakingLibrary.MIN_STAKE_PERIOD;
    }

    /**
     * @dev Exposes the MAX_STAKE_PERIOD constant from StakingLibrary
     * @return The maximum staking period in seconds
     */
    function getMAX_STAKE_PERIOD() public pure returns (uint256) {
        return StakingLibrary.MAX_STAKE_PERIOD;
    }

    /**
     * @dev Exposes the MAX_MULTIPLIER constant from StakingLibrary
     * @return The maximum multiplier for stake rewards
     */
    function getMAX_MULTIPLIER() public pure returns (uint256) {
        return StakingLibrary.MAX_MULTIPLIER;
    }

    /**
     * @dev Exposes the MIN_PENALTY constant from StakingLibrary
     * @return The minimum penalty for early withdrawals
     */
    function getMIN_PENALTY() public pure returns (uint256) {
        return StakingLibrary.MIN_PENALTY;
    }

    /**
     * @dev Exposes the MAX_PENALTY constant from StakingLibrary
     * @return The maximum penalty for early withdrawals
     */
    function getMAX_PENALTY() public pure returns (uint256) {
        return StakingLibrary.MAX_PENALTY;
    }

    /**
     * @dev Wrapper for StakingLibrary.calculateStakingReward
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
        return StakingLibrary.calculateStakingReward(
            stakeAmount,
            stakeDuration,
            territoryValue,
            baseRewardRate,
            factionBonus
        );
    }

    /**
     * @dev Wrapper for StakingLibrary.calculateControllingFaction
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
        return StakingLibrary.calculateControllingFaction(
            factionStakes,
            totalStaked,
            controlThreshold
        );
    }

    /**
     * @dev Wrapper for StakingLibrary.evaluateContestedStatus
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
        return StakingLibrary.evaluateContestedStatus(
            factionStakes,
            totalStaked,
            contestThreshold
        );
    }

    /**
     * @dev Wrapper for StakingLibrary.calculateEmergencyWithdrawalPenalty
     * @param originalStakePeriod Original intended staking period in seconds
     * @param timeStaked Time already staked in seconds
     * @return The penalty percentage (with precision)
     */
    function calculateEmergencyWithdrawalPenalty(
        uint256 originalStakePeriod,
        uint256 timeStaked
    ) public pure returns (uint256) {
        return StakingLibrary.calculateEmergencyWithdrawalPenalty(
            originalStakePeriod,
            timeStaked
        );
    }

    /**
     * @dev Wrapper for StakingLibrary.calculateStakePeriodMultiplier
     * @param stakePeriod The intended period of the stake in seconds
     * @param factionBonus Bonus percentage based on faction type (0-100)
     * @return The stake period multiplier (with precision)
     */
    function calculateStakePeriodMultiplier(
        uint256 stakePeriod,
        uint256 factionBonus
    ) public pure returns (uint256) {
        return StakingLibrary.calculateStakePeriodMultiplier(
            stakePeriod,
            factionBonus
        );
    }

    /**
     * @dev Wrapper for StakingLibrary.min
     * @param a First number
     * @param b Second number
     * @return The smaller of the two numbers
     */
    function min(uint256 a, uint256 b) public pure returns (uint256) {
        return StakingLibrary.min(a, b);
    }
}