// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "../protocol/libraries/FactionLibrary.sol";

/**
 * @title FactionLibraryTestWrapper
 * @dev Test wrapper contract that exposes FactionLibrary's internal functions as public functions
 * This wrapper is used for unit testing only and should not be deployed to production environments
 * Each function has the same signature as its corresponding library function but with public visibility
 */
contract FactionLibraryTestWrapper {
    /**
     * @dev Provides access to FactionLibrary faction constants
     */
    function getFactionConstants()
        public
        pure
        returns (
            uint8 noFaction,
            uint8 lawEnforcement,
            uint8 criminalSyndicate,
            uint8 vigilante,
            uint8 factionCount
        )
    {
        return (
            FactionLibrary.NO_FACTION,
            FactionLibrary.LAW_ENFORCEMENT,
            FactionLibrary.CRIMINAL_SYNDICATE,
            FactionLibrary.VIGILANTE,
            FactionLibrary.FACTION_COUNT
        );
    }

    /**
     * @dev Provides access to FactionLibrary rank constants
     */
    function getRankConstants()
        public
        pure
        returns (uint8 minRank, uint8 maxRank)
    {
        return (FactionLibrary.MIN_RANK, FactionLibrary.MAX_RANK);
    }

    /**
     * @dev Provides access to FactionLibrary action type constants
     */
    function getActionTypeConstants()
        public
        pure
        returns (
            uint8 missionComplete,
            uint8 territoryControl,
            uint8 criminalActivity,
            uint8 lawEnforcement,
            uint8 communityService,
            uint8 betrayal,
            uint8 factionSupport
        )
    {
        return (
            FactionLibrary.ACTION_MISSION_COMPLETE,
            FactionLibrary.ACTION_TERRITORY_CONTROL,
            FactionLibrary.ACTION_CRIMINAL_ACTIVITY,
            FactionLibrary.ACTION_LAW_ENFORCEMENT,
            FactionLibrary.ACTION_COMMUNITY_SERVICE,
            FactionLibrary.ACTION_BETRAYAL,
            FactionLibrary.ACTION_FACTION_SUPPORT
        );
    }

    /**
     * @dev Wrapper for FactionLibrary.calculateReputationChange
     * Calculates reputation change based on action type and parameters
     * @param actionType Type of action performed
     * @param actionValue Value or magnitude of the action
     * @param currentReputation Current reputation of the member
     * @param factionId The faction ID of the member
     * @return newReputation New reputation value after the change
     */
    function calculateReputationChange(
        uint8 actionType,
        uint256 actionValue,
        uint256 currentReputation,
        uint8 factionId
    ) public pure returns (uint256) {
        return
            FactionLibrary.calculateReputationChange(
                actionType,
                actionValue,
                currentReputation,
                factionId
            );
    }

    /**
     * @dev Wrapper for FactionLibrary.checkRankEligibility
     * Determines if a member is eligible for rank promotion
     * @param currentRank Current rank of the member
     * @param reputation Current reputation of the member
     * @param memberSince Timestamp when the member joined
     * @param actionsCompleted Number of significant actions completed
     * @param factionId The faction ID of the member
     * @return isEligible Whether the member is eligible for promotion
     * @return newRank The new rank if eligible, otherwise same as current rank
     */
    function checkRankEligibility(
        uint8 currentRank,
        uint256 reputation,
        uint256 memberSince,
        uint8 actionsCompleted,
        uint8 factionId
    ) public view returns (bool isEligible, uint8 newRank) {
        return
            FactionLibrary.checkRankEligibility(
                currentRank,
                reputation,
                memberSince,
                actionsCompleted,
                factionId
            );
    }

    /**
     * @dev Wrapper for FactionLibrary.getRankRequirements
     * Gets requirements for a specific rank in a faction
     * @param rank The rank to get requirements for
     * @param factionId The faction ID
     * @return requirements The rank requirements
     */
    function getRankRequirements(
        uint8 rank,
        uint8 factionId
    )
        public
        pure
        returns (FactionLibrary.RankRequirements memory requirements)
    {
        return FactionLibrary.getRankRequirements(rank, factionId);
    }

    /**
     * @dev Wrapper for FactionLibrary.hasRole
     * Checks if a member has a specific role in their faction
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
    ) public pure returns (bool) {
        return
            FactionLibrary.hasRole(
                memberRank,
                memberReputation,
                roleId,
                factionId
            );
    }

    /**
     * @dev Wrapper for FactionLibrary.getRoleRequirements
     * Gets the requirements for a specific role in a faction
     * @param roleId The role ID to check
     * @param factionId The faction ID
     * @return requiredRank The minimum rank required for the role
     * @return requiredReputation The minimum reputation required for the role
     */
    function getRoleRequirements(
        uint8 roleId,
        uint8 factionId
    ) public pure returns (uint8 requiredRank, uint256 requiredReputation) {
        return FactionLibrary.getRoleRequirements(roleId, factionId);
    }

    /**
     * @dev Wrapper for FactionLibrary.calculateInfluenceScore
     * Calculates influence score for a faction based on various metrics
     * @param memberCount Total members in the faction
     * @param averageReputation Average reputation across all faction members
     * @param territoriesControlled Number of territories controlled by the faction
     * @param resourcesControlled Amount of resources under faction control
     * @param averageMemberRank Average rank of faction members
     * @return influenceScore The calculated influence score
     */
    function calculateInfluenceScore(
        uint256 memberCount,
        uint256 averageReputation,
        uint256 territoriesControlled,
        uint256 resourcesControlled,
        uint256 averageMemberRank
    ) public pure returns (uint256 influenceScore) {
        return
            FactionLibrary.calculateInfluenceScore(
                memberCount,
                averageReputation,
                territoriesControlled,
                resourcesControlled,
                averageMemberRank
            );
    }

    /**
     * @dev Wrapper for FactionLibrary.resolveConflict
     * Calculates the outcome of a conflict between two factions
     * @param attackingFactionId ID of the attacking faction
     * @param defendingFactionId ID of the defending faction
     * @param attackingStrength Strength of the attacking faction in the conflict
     * @param defendingStrength Strength of the defending faction in the conflict
     * @param randomnessSeed A seed for pseudo-randomness (should come from a reliable source)
     * @return attackerWon Whether the attacker won the conflict
     * @return attackerDamage Damage inflicted by the attacker
     * @return defenderDamage Damage inflicted by the defender
     */
    function resolveConflict(
        uint8 attackingFactionId,
        uint8 defendingFactionId,
        uint256 attackingStrength,
        uint256 defendingStrength,
        uint256 randomnessSeed
    )
        public
        pure
        returns (
            bool attackerWon,
            uint256 attackerDamage,
            uint256 defenderDamage
        )
    {
        return
            FactionLibrary.resolveConflict(
                attackingFactionId,
                defendingFactionId,
                attackingStrength,
                defendingStrength,
                randomnessSeed
            );
    }

    /**
     * @dev Wrapper for FactionLibrary.adjustStrengthForFaction
     * Adjusts the strength of a faction based on faction types and conflict role
     * This wraps an internal function that is used by resolveConflict
     * @param baseStrength The starting strength value
     * @param factionId The faction ID to adjust for
     * @param isAttacker Whether the faction is attacking or defending
     * @param opposingFactionId The faction ID of the opposing side
     * @return adjustedStrength The adjusted strength value
     */
    function adjustStrengthForFaction(
        uint256 baseStrength,
        uint8 factionId,
        bool isAttacker,
        uint8 opposingFactionId
    ) public pure returns (uint256 adjustedStrength) {
        return
            FactionLibrary.adjustStrengthForFaction(
                baseStrength,
                factionId,
                isAttacker,
                opposingFactionId
            );
    }
}
