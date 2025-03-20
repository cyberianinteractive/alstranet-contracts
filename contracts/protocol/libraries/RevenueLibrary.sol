// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title RevenueLibrary
 * @dev Library for handling revenue distribution, staking rewards, and treasury allocation
 *      within the Police & Thief ecosystem.
 */
library RevenueLibrary {
    // Single precision constant for all calculations
    uint256 internal constant PRECISION = 1e18;

    // Constants for percentage calculations
    uint256 internal constant PERCENTAGE_DENOMINATOR = 10000; // 100% = 10000
    uint256 internal constant MINIMUM_DISTRIBUTION = 100; // Minimum distribution amount

    // Constants for anti-monopoly calculations
    uint256 internal constant MAX_DOMINANCE_FACTOR = 7000; // 70% maximum dominance
    uint256 internal constant MIN_DISTRIBUTION_SHARES = 5; // Minimum shares for each faction

    /**
     * @dev Calculates revenue distribution based on territory control
     * @param totalRevenue Total revenue to distribute
     * @param territoryInfluence Array of territory influence percentages by faction (indexed by faction ID)
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
    )
        internal
        pure
        returns (
            uint256[] memory distribution,
            uint256 daoAmount,
            uint256 burnAmount
        )
    {
        // Input validation
        require(
            factionCount > 0,
            "RevenueLibrary: factionCount must be greater than 0"
        );
        require(
            daoTreasuryPercentage + burnPercentage <= PERCENTAGE_DENOMINATOR,
            "RevenueLibrary: percentages exceed 100%"
        );
        require(
            territoryInfluence.length >= factionCount,
            "RevenueLibrary: territoryInfluence array too small"
        );

        // Calculate amounts for DAO treasury and burning
        daoAmount =
            (totalRevenue * daoTreasuryPercentage) /
            PERCENTAGE_DENOMINATOR;
        burnAmount = (totalRevenue * burnPercentage) / PERCENTAGE_DENOMINATOR;

        // Calculate remaining amount for faction distribution
        uint256 factionAmount = totalRevenue - daoAmount - burnAmount;

        // Initialize distribution array
        distribution = new uint256[](factionCount);

        // Calculate total influence to determine proportional distribution
        uint256 totalInfluence = 0;
        for (uint8 i = 0; i < factionCount; i++) {
            totalInfluence += territoryInfluence[i];
        }

        // If no influence, distribute equally
        if (totalInfluence == 0) {
            uint256 equalShare = factionAmount / factionCount;
            for (uint8 i = 0; i < factionCount; i++) {
                distribution[i] = equalShare;
            }

            // Handle any remainder due to division
            uint256 remainder = factionAmount - (equalShare * factionCount);
            if (remainder > 0) {
                distribution[0] += remainder;
            }

            return (distribution, daoAmount, burnAmount);
        }

        // Distribute based on territory influence
        uint256 distributedAmount = 0;

        for (uint8 i = 0; i < factionCount; i++) {
            // Calculate faction's share based on influence
            if (territoryInfluence[i] > 0) {
                distribution[i] =
                    (factionAmount * territoryInfluence[i]) /
                    totalInfluence;

                // Ensure minimum distribution for active factions
                if (
                    distribution[i] < MINIMUM_DISTRIBUTION &&
                    factionAmount > MINIMUM_DISTRIBUTION
                ) {
                    distribution[i] = MINIMUM_DISTRIBUTION;
                }

                distributedAmount += distribution[i];
            }
        }

        // Handle any remainder due to rounding
        if (distributedAmount < factionAmount) {
            uint256 remainder = factionAmount - distributedAmount;

            // Add remainder to the faction with highest influence
            uint8 highestInfluenceFaction = 0;
            uint256 highestInfluence = 0;

            for (uint8 i = 0; i < factionCount; i++) {
                if (territoryInfluence[i] > highestInfluence) {
                    highestInfluence = territoryInfluence[i];
                    highestInfluenceFaction = i;
                }
            }

            distribution[highestInfluenceFaction] += remainder;
        }

        return (distribution, daoAmount, burnAmount);
    }

    /**
     * @dev Calculates staking rewards distribution based on each staker's proportion
     * @param totalRewards Total rewards to distribute
     * @param stakes Array of stake amounts by user
     * @param totalStaked Total amount staked
     * @return rewards Array of reward amounts by user index
     */
    function calculateStakingRewardsDistribution(
        uint256 totalRewards,
        uint256[] memory stakes,
        uint256 totalStaked
    ) internal pure returns (uint256[] memory) {
        // Input validation
        require(stakes.length > 0, "RevenueLibrary: empty stakes array");
        require(
            totalStaked > 0,
            "RevenueLibrary: totalStaked must be greater than 0"
        );

        uint256[] memory rewards = new uint256[](stakes.length);
        uint256 distributedRewards = 0;

        for (uint256 i = 0; i < stakes.length; i++) {
            if (stakes[i] > 0) {
                // Calculate proportional reward
                rewards[i] = (totalRewards * stakes[i]) / totalStaked;
                distributedRewards += rewards[i];
            }
        }

        // Handle any remainder due to rounding
        if (distributedRewards < totalRewards) {
            uint256 remainder = totalRewards - distributedRewards;

            // Find the index with the highest stake to add the remainder
            uint256 highestStakeIndex = 0;
            uint256 highestStake = 0;

            for (uint256 i = 0; i < stakes.length; i++) {
                if (stakes[i] > highestStake) {
                    highestStake = stakes[i];
                    highestStakeIndex = i;
                }
            }

            rewards[highestStakeIndex] += remainder;
        }

        return rewards;
    }

    /**
     * @dev Calculates optimal treasury allocation based on ecosystem needs
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
    )
        internal
        pure
        returns (
            uint256 operationalFunds,
            uint256 developmentFunds,
            uint256 marketingFunds,
            uint256 communityFunds,
            uint256 reserveFunds
        )
    {
        // Calculate total weight
        uint256 totalWeight = operationalWeight +
            developmentWeight +
            marketingWeight +
            communityWeight +
            reserveWeight;

        require(
            totalWeight > 0,
            "RevenueLibrary: total weight must be greater than 0"
        );

        // Calculate allocations based on weights
        operationalFunds = (totalTreasury * operationalWeight) / totalWeight;
        developmentFunds = (totalTreasury * developmentWeight) / totalWeight;
        marketingFunds = (totalTreasury * marketingWeight) / totalWeight;
        communityFunds = (totalTreasury * communityWeight) / totalWeight;

        // Calculate reserve funds based on remainder to ensure exact total
        uint256 allocated = operationalFunds +
            developmentFunds +
            marketingFunds +
            communityFunds;

        reserveFunds = totalTreasury - allocated;

        return (
            operationalFunds,
            developmentFunds,
            marketingFunds,
            communityFunds,
            reserveFunds
        );
    }

    /**
     * @dev Calculates balanced revenue boost based on faction performance metrics
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
    ) internal pure returns (uint256) {
        // Early return for zero base revenue
        if (baseRevenue == 0) {
            return 0;
        }

        // Calculate weighted boost score (max 5000 basis points = 50% boost)
        uint256 memberBoost = factionMemberCount > 0
            ? min(1000, (100 * PERCENTAGE_DENOMINATOR) / factionMemberCount)
            : 0;

        uint256 activityBoost = min(1500, (factionActivity * 15));

        uint256 territoryBoost = min(1500, territoryControl / 2);

        uint256 marketBoost = min(1000, marketDominance / 3);

        // Sum all boosts (capped at 50% total boost)
        uint256 totalBoost = min(
            5000,
            memberBoost + activityBoost + territoryBoost + marketBoost
        );

        // Apply boost to base revenue
        return
            baseRevenue + ((baseRevenue * totalBoost) / PERCENTAGE_DENOMINATOR);
    }

    /**
     * @dev Calculates dynamic revenue sharing model for factions based on their contribution
     * @param totalRevenue Total revenue to distribute
     * @param factions Array of faction IDs
     * @param contributions Array of contribution scores by faction
     * @param baseSplit Base split percentage (basis points) guaranteed to each faction
     * @return Array of revenue shares by faction index
     */
    function calculateDynamicRevenueSharing(
        uint256 totalRevenue,
        uint8[] memory factions,
        uint256[] memory contributions,
        uint256 baseSplit
    ) internal pure returns (uint256[] memory) {
        // Validation
        require(factions.length > 0, "RevenueLibrary: empty factions array");
        require(
            factions.length == contributions.length,
            "RevenueLibrary: array length mismatch"
        );
        require(
            baseSplit * factions.length <= PERCENTAGE_DENOMINATOR,
            "RevenueLibrary: base split too high"
        );

        // Initialize shares array
        uint256[] memory shares = new uint256[](factions.length);

        // Early return for zero revenue
        if (totalRevenue == 0) {
            return shares;
        }

        // Calculate total contributions
        uint256 totalContributions = 0;
        for (uint256 i = 0; i < contributions.length; i++) {
            totalContributions += contributions[i];
        }

        // Calculate base amount each faction gets
        uint256 baseAmount = (totalRevenue * baseSplit) /
            PERCENTAGE_DENOMINATOR;
        uint256 totalBaseAmount = baseAmount * factions.length;

        // Calculate remaining amount to distribute based on contributions
        uint256 remainingAmount = totalRevenue > totalBaseAmount
            ? totalRevenue - totalBaseAmount
            : 0;

        // Distribute base amount plus contribution-based share
        uint256 distributedAmount = 0;

        for (uint256 i = 0; i < factions.length; i++) {
            // Start with base amount
            shares[i] = baseAmount;

            // Add contribution-based share if there are any contributions
            if (totalContributions > 0 && remainingAmount > 0) {
                uint256 additionalShare = (remainingAmount * contributions[i]) /
                    totalContributions;
                shares[i] += additionalShare;
            } else if (totalContributions == 0 && remainingAmount > 0) {
                // If no contributions but there's remaining amount, distribute equally
                shares[i] += remainingAmount / factions.length;
            }

            distributedAmount += shares[i];
        }

        // Handle any remainder due to rounding
        if (distributedAmount < totalRevenue) {
            uint256 remainder = totalRevenue - distributedAmount;

            if (totalContributions > 0) {
                // Add remainder to the faction with highest contribution
                uint256 highestContributionIndex = 0;
                uint256 highestContribution = 0;

                for (uint256 i = 0; i < contributions.length; i++) {
                    if (contributions[i] > highestContribution) {
                        highestContribution = contributions[i];
                        highestContributionIndex = i;
                    }
                }

                shares[highestContributionIndex] += remainder;
            } else {
                // If no contributions, add remainder to first faction
                shares[0] += remainder;
            }
        }

        return shares;
    }

    /**
     * @dev Helper function for anti-monopoly adjustment to find non-dominant shares count
     */
    function countNonDominantActive(
        uint256[] memory shares,
        uint256 dominantIndex
    ) internal pure returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < shares.length; i++) {
            if (i != dominantIndex && shares[i] > 0) {
                count++;
            }
        }
        return count;
    }

    /**
     * @dev Calculates anti-monopoly revenue adjustments to balance economic power
     * @param shares Original revenue shares
     * @param dominanceFactor Current dominance factor of top factions (basis points)
     * @param targetFactor Target dominance factor (basis points)
     * @return Revenue shares after anti-monopoly adjustment
     */
    function calculateAntiMonopolyAdjustment(
        uint256[] memory shares,
        uint256 dominanceFactor,
        uint256 targetFactor
    ) internal pure returns (uint256[] memory) {
        // Validation and early returns
        require(shares.length > 0, "RevenueLibrary: empty shares array");
        if (dominanceFactor <= targetFactor) {
            return shares;
        }

        // Initialize adjusted shares and find dominant faction
        uint256[] memory adjustedShares = new uint256[](shares.length);
        uint256 totalShares = 0;
        uint256 dominantIndex = 0;
        uint256 dominantShare = 0;
        bool hasOtherActiveShares = false;

        for (uint256 i = 0; i < shares.length; i++) {
            adjustedShares[i] = shares[i]; // Initialize with original values
            totalShares += shares[i];

            if (shares[i] > dominantShare) {
                dominantShare = shares[i];
                dominantIndex = i;
            }

            // Check if there are other active shares
            if (shares[i] > 0 && i != dominantIndex) {
                hasOtherActiveShares = true;
            }
        }

        // Return original shares if no total shares or no other active shares
        if (totalShares == 0 || !hasOtherActiveShares) {
            return shares;
        }

        // Calculate redistribution amount
        uint256 currentDominance = (dominantShare * PERCENTAGE_DENOMINATOR) /
            totalShares;
        uint256 excessDominance = currentDominance > targetFactor
            ? currentDominance - targetFactor
            : 0;
        uint256 redistributeAmount = (dominantShare * excessDominance) /
            currentDominance;

        // Reduce dominant faction's share
        adjustedShares[dominantIndex] = dominantShare - redistributeAmount;

        // Prepare for redistribution
        uint256 totalForRedistribution = 0;
        uint256 nonDominantCount = countNonDominantActive(shares, dominantIndex);

        // First pass: calculate total eligible for redistribution
        for (uint256 i = 0; i < shares.length; i++) {
            if (i != dominantIndex && shares[i] > 0) {
                totalForRedistribution += shares[i];
            }
        }

        // Second pass: redistribute proportionally
        uint256 distributedExtra = 0;
        
        // Pre-calculate fallback amount if needed
        uint256 fallbackAmount = 0;
        if (totalForRedistribution == 0 && nonDominantCount > 0) {
            fallbackAmount = redistributeAmount / nonDominantCount;
        }
        
        for (uint256 i = 0; i < shares.length; i++) {
            if (i != dominantIndex && shares[i] > 0) {
                uint256 extra;
                
                if (totalForRedistribution > 0) {
                    extra = (redistributeAmount * shares[i]) / totalForRedistribution;
                } else {
                    extra = fallbackAmount;
                }

                adjustedShares[i] += extra;
                distributedExtra += extra;
            }
        }

        // Handle any remainder due to division rounding
        if (distributedExtra < redistributeAmount) {
            for (uint256 i = 0; i < shares.length; i++) {
                if (i != dominantIndex && shares[i] > 0) {
                    adjustedShares[i] += redistributeAmount - distributedExtra;
                    break;
                }
            }
        }

        return adjustedShares;
    }

    /**
     * @dev Calculates territory value based on economic activity for revenue distribution
     * @param baseValue Base value of the territory
     * @param economicActivity Level of economic activity (transaction volume, etc.)
     * @param controlDuration Duration the territory has been controlled (in blocks)
     * @param isContested Whether the territory is currently contested
     * @return Calculated value of the territory for revenue distribution
     */
    function calculateTerritoryValue(
        uint256 baseValue,
        uint256 economicActivity,
        uint256 controlDuration,
        bool isContested
    ) internal pure returns (uint256) {
        // Early return for zero base value
        if (baseValue == 0) {
            return 0;
        }

        // Base multiplier starts at 100%
        uint256 valueMultiplier = PERCENTAGE_DENOMINATOR;

        // Add economic activity bonus (up to 100%)
        uint256 activityBonus = min(
            PERCENTAGE_DENOMINATOR,
            economicActivity * 10
        );
        valueMultiplier += activityBonus;

        // Add control duration bonus (up to 50%, scales with sqrt of duration)
        uint256 durationBonus = min(
            PERCENTAGE_DENOMINATOR / 2,
            sqrt(controlDuration) * 10
        );
        valueMultiplier += durationBonus;

        // Apply contested penalty (-30% if contested)
        if (isContested) {
            valueMultiplier = (valueMultiplier * 7) / 10; // 30% reduction
        }

        // Calculate final value
        return (baseValue * valueMultiplier) / PERCENTAGE_DENOMINATOR;
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

    /**
     * @dev Calculates square root using binary search
     * @param x The number to find the square root of
     * @return The square root of the given number
     */
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;

        uint256 z = (x + 1) / 2;
        uint256 y = x;

        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }

        return y;
    }
}