// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title FactionLibrary
 * @dev Library of functions for managing faction-related calculations in the Police & Thief ecosystem.
 *      This library provides functionality for reputation management, rank determination,
 *      role authorization, influence calculation, and faction conflict resolution.
 */
library FactionLibrary {
    // Constants for faction IDs
    uint8 internal constant NO_FACTION = 0;
    uint8 internal constant LAW_ENFORCEMENT = 1;
    uint8 internal constant CRIMINAL_SYNDICATE = 2;
    uint8 internal constant VIGILANTE = 3;
    uint8 internal constant FACTION_COUNT = 3;

    // Constants for rank limits
    uint8 internal constant MIN_RANK = 1;
    uint8 internal constant MAX_RANK = 10;

    // Constants for action types
    uint8 internal constant ACTION_MISSION_COMPLETE = 1;
    uint8 internal constant ACTION_TERRITORY_CONTROL = 2;
    uint8 internal constant ACTION_CRIMINAL_ACTIVITY = 3;
    uint8 internal constant ACTION_LAW_ENFORCEMENT = 4;
    uint8 internal constant ACTION_COMMUNITY_SERVICE = 5;
    uint8 internal constant ACTION_BETRAYAL = 6;
    uint8 internal constant ACTION_FACTION_SUPPORT = 7;

    // Struct for reputation requirements for ranks
    struct RankRequirements {
        uint256 reputationRequired;
        uint256 timeInFactionRequired; // in seconds
        uint16 actionsRequired;
    }

    /**
     * @dev Calculates reputation change based on action type and parameters
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
    ) internal pure returns (uint256 newReputation) {
        // Start with current reputation
        newReputation = currentReputation;

        // Base multiplier for the action type
        uint256 multiplier;
        bool isPositive = true;

        if (actionType == ACTION_MISSION_COMPLETE) {
            multiplier = 10;
            // No faction-specific modifiers
        } else if (actionType == ACTION_TERRITORY_CONTROL) {
            multiplier = 15;
            // Territory control is valued slightly higher by Vigilantes
            if (factionId == VIGILANTE) {
                multiplier = 20;
            }
        } else if (actionType == ACTION_CRIMINAL_ACTIVITY) {
            multiplier = 12;
            // Criminal activity gives reputation to Criminal Syndicate
            if (factionId == CRIMINAL_SYNDICATE) {
                multiplier = 20;
            }
            // But damages reputation for Law Enforcement
            else if (factionId == LAW_ENFORCEMENT) {
                multiplier = 15;
                isPositive = false;
            }
        } else if (actionType == ACTION_LAW_ENFORCEMENT) {
            multiplier = 10;
            // Law enforcement activities give extra reputation to Law Enforcement
            if (factionId == LAW_ENFORCEMENT) {
                multiplier = 20;
            }
            // But damages reputation for Criminal Syndicate
            else if (factionId == CRIMINAL_SYNDICATE) {
                multiplier = 15;
                isPositive = false;
            }
        } else if (actionType == ACTION_COMMUNITY_SERVICE) {
            multiplier = 8;
            // Community service is valued higher by Vigilantes
            if (factionId == VIGILANTE) {
                multiplier = 15;
            }
        } else if (actionType == ACTION_BETRAYAL) {
            multiplier = 25;
            isPositive = false; // Betrayal always reduces reputation
        } else if (actionType == ACTION_FACTION_SUPPORT) {
            multiplier = 5;
            // Supporting your faction is always positive
        } else {
            // If action type is not recognized, make no change
            return currentReputation;
        }

        // Calculate the reputation change
        uint256 reputationChange = actionValue * multiplier;

        // Apply the change according to whether it's positive or negative
        if (isPositive) {
            newReputation += reputationChange;
        } else {
            // Ensure we don't underflow for negative reputation changes
            if (reputationChange > currentReputation) {
                newReputation = 0;
            } else {
                newReputation -= reputationChange;
            }
        }

        return newReputation;
    }

    /**
     * @dev Determines if a member is eligible for rank promotion
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
    ) internal view returns (bool isEligible, uint8 newRank) {
        // If already at max rank, cannot be promoted further
        if (currentRank >= MAX_RANK) {
            return (false, currentRank);
        }

        // Initialize new rank to current rank (in case not eligible)
        newRank = currentRank;

        // Time in faction (in seconds)
        uint256 timeInFaction = block.timestamp - memberSince;

        // Get requirements for next rank based on faction
        RankRequirements memory requirements = getRankRequirements(
            currentRank + 1,
            factionId
        );

        // Check if all requirements are met
        if (
            reputation >= requirements.reputationRequired &&
            timeInFaction >= requirements.timeInFactionRequired &&
            actionsCompleted >= requirements.actionsRequired
        ) {
            isEligible = true;
            newRank = currentRank + 1;
        } else {
            isEligible = false;
        }

        return (isEligible, newRank);
    }

    /**
     * @dev Gets requirements for a specific rank in a faction
     * @param rank The rank to get requirements for
     * @param factionId The faction ID
     * @return requirements The rank requirements
     */
    function getRankRequirements(
        uint8 rank,
        uint8 factionId
    ) internal pure returns (RankRequirements memory requirements) {
        // Base requirements that increase with rank
        uint256 baseReputation = 100 * uint256(rank) * uint256(rank);
        uint256 baseTimeRequired = 7 days * uint256(rank);
        uint16 baseActionsRequired = rank * 5;

        // Apply faction-specific modifiers
        if (factionId == LAW_ENFORCEMENT) {
            // Law Enforcement has stricter reputation requirements
            baseReputation = (baseReputation * 120) / 100;
            // But slightly faster progression in time
            baseTimeRequired = (baseTimeRequired * 90) / 100;
            // Standard action requirements
        } else if (factionId == CRIMINAL_SYNDICATE) {
            // Criminal Syndicate has easier reputation requirements
            baseReputation = (baseReputation * 90) / 100;
            // But requires more actions
            baseActionsRequired = (baseActionsRequired * 120) / 100;
            // Standard time requirements
        } else if (factionId == VIGILANTE) {
            // Vigilantes have balanced requirements
            // But longer time requirements (community building takes time)
            baseTimeRequired = (baseTimeRequired * 110) / 100;
            // And fewer action requirements
            baseActionsRequired = (baseActionsRequired * 90) / 100;
        }

        // Construct the requirements structure
        requirements = RankRequirements({
            reputationRequired: baseReputation,
            timeInFactionRequired: baseTimeRequired,
            actionsRequired: baseActionsRequired
        });

        return requirements;
    }

    /**
     * @dev Checks if a member has a specific role in their faction
     * @param memberRank The member's rank
     * @param memberReputation The member's reputation
     * @param roleId The role to check
     * @param factionId The faction ID
     * @return hasRole Whether the member has the role
     */
    function hasRole(
        uint8 memberRank,
        uint256 memberReputation,
        uint8 roleId,
        uint8 factionId
    ) internal pure returns (bool) {
        // Get role requirements
        (uint8 requiredRank, uint256 requiredReputation) = getRoleRequirements(
            roleId,
            factionId
        );

        // Check if member meets requirements
        return (memberRank >= requiredRank &&
            memberReputation >= requiredReputation);
    }

    /**
     * @dev Gets the requirements for a specific role in a faction
     * @param roleId The role ID to check
     * @param factionId The faction ID
     * @return requiredRank The minimum rank required for the role
     * @return requiredReputation The minimum reputation required for the role
     */
    function getRoleRequirements(
        uint8 roleId,
        uint8 factionId
    ) internal pure returns (uint8 requiredRank, uint256 requiredReputation) {
        // Role IDs can vary by faction, but we'll define some standard roles here

        // Leadership roles (1-10)
        if (roleId <= 10) {
            // Leader (roleId = 1)
            if (roleId == 1) {
                requiredRank = 10; // Top rank required
                requiredReputation = 10000; // Very high reputation required
            }
            // Sub-leader (roleId = 2)
            else if (roleId == 2) {
                requiredRank = 9;
                requiredReputation = 8000;
            }
            // Lieutenant (roleId = 3)
            else if (roleId == 3) {
                requiredRank = 8;
                requiredReputation = 6000;
            }
            // Officer (roleId = 4)
            else if (roleId == 4) {
                requiredRank = 6;
                requiredReputation = 3000;
            }
            // Other leadership roles...
            else {
                requiredRank = 5;
                requiredReputation = 1000;
            }
        }
        // Specialist roles (11-20)
        else if (roleId <= 20) {
            // Base requirements
            requiredRank = 4;
            requiredReputation = 500;

            // Adjust based on faction
            if (factionId == LAW_ENFORCEMENT) {
                // Law Enforcement has stricter requirements for specialists
                requiredRank += 1;
                requiredReputation += 500;
            } else if (factionId == CRIMINAL_SYNDICATE) {
                // Criminal Syndicate values specialized skills more
                requiredReputation += 300;
            }
            // Vigilante uses base requirements
        }
        // General roles (21+)
        else {
            // Base requirements that most members can achieve
            requiredRank = 2;
            requiredReputation = 200;
        }

        return (requiredRank, requiredReputation);
    }

    /**
     * @dev Calculates influence score for a faction based on various metrics
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
    ) internal pure returns (uint256 influenceScore) {
        // Base influence from member count (diminishing returns at higher counts)
        uint256 memberInfluence;
        if (memberCount <= 100) {
            memberInfluence = memberCount * 10;
        } else if (memberCount <= 1000) {
            memberInfluence = 1000 + ((memberCount - 100) * 5);
        } else {
            memberInfluence = 5500 + ((memberCount - 1000) * 2);
        }

        // Influence from reputation (stronger reputation = stronger influence)
        uint256 reputationInfluence = averageReputation * 2;

        // Influence from territories (each territory provides significant influence)
        uint256 territoryInfluence = territoriesControlled * 500;

        // Influence from resources (economic influence)
        uint256 resourceInfluence = resourcesControlled / 100;

        // Influence from member rank (higher ranks = more influence)
        uint256 rankInfluence = averageMemberRank * 300;

        // Calculate total influence as weighted sum of individual factors
        influenceScore =
            ((memberInfluence * 20) / 100) +
            ((reputationInfluence * 15) / 100) +
            ((territoryInfluence * 30) / 100) +
            ((resourceInfluence * 25) / 100) +
            ((rankInfluence * 10) / 100);

        return influenceScore;
    }

    /**
     * @dev Calculates the outcome of a conflict between two factions
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
        internal
        pure
        returns (
            bool attackerWon,
            uint256 attackerDamage,
            uint256 defenderDamage
        )
    {
        // Incorporate faction-specific bonuses
        uint256 adjustedAttackingStrength = adjustStrengthForFaction(
            attackingStrength,
            attackingFactionId,
            true, // Attacking
            defendingFactionId
        );

        uint256 adjustedDefendingStrength = adjustStrengthForFaction(
            defendingStrength,
            defendingFactionId,
            false, // Defending
            attackingFactionId
        );

        // Add a random factor to make conflicts less deterministic
        // Note: This uses a basic approach and should be improved in production
        // with a more secure source of randomness
        uint256 randomFactor = uint256(
            keccak256(
                abi.encodePacked(
                    attackingFactionId,
                    defendingFactionId,
                    attackingStrength,
                    defendingStrength,
                    randomnessSeed
                )
            )
        ) % 50; // Random factor between 0-49

        // Apply random factor to both sides (±25%)
        if (randomFactor < 25) {
            // Bonus to attacker
            adjustedAttackingStrength =
                (adjustedAttackingStrength * (100 + randomFactor)) /
                100;
        } else {
            // Bonus to defender
            adjustedDefendingStrength =
                (adjustedDefendingStrength * (100 + (randomFactor - 25))) /
                100;
        }

        // Calculate base damage each side inflicts
        attackerDamage =
            (adjustedAttackingStrength * 100) /
            (100 + adjustedDefendingStrength / 2);
        defenderDamage =
            (adjustedDefendingStrength * 100) /
            (100 + adjustedAttackingStrength / 2);

        // Determine winner
        attackerWon = adjustedAttackingStrength > adjustedDefendingStrength;

        return (attackerWon, attackerDamage, defenderDamage);
    }

    /**
     * @dev Adjusts the strength of a faction based on faction types and conflict role
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
    ) internal pure returns (uint256 adjustedStrength) {
        adjustedStrength = baseStrength;

        // Faction-specific adjustments
        if (factionId == LAW_ENFORCEMENT) {
            // Law Enforcement is stronger on defense
            if (!isAttacker) {
                adjustedStrength = (adjustedStrength * 120) / 100; // 20% defensive bonus
            }

            // Law Enforcement has an advantage against Vigilantes (not against criminals)
            if (opposingFactionId == VIGILANTE) {
                adjustedStrength = (adjustedStrength * 110) / 100; // 10% bonus vs Vigilantes
            }
        } else if (factionId == CRIMINAL_SYNDICATE) {
            // Criminal Syndicate is stronger on offense
            if (isAttacker) {
                adjustedStrength = (adjustedStrength * 120) / 100; // 20% offensive bonus
            }

            // Criminals have a slight advantage against Vigilantes
            if (opposingFactionId == VIGILANTE) {
                adjustedStrength = (adjustedStrength * 110) / 100; // 10% bonus vs Vigilantes
            }

            // Criminals have an advantage against Law Enforcement
            if (opposingFactionId == LAW_ENFORCEMENT) {
                adjustedStrength = (adjustedStrength * 115) / 100; // 15% bonus vs Law Enforcement
            }
        } else if (factionId == VIGILANTE) {
            // Vigilantes get a bonus in both attack and defense due to community support
            adjustedStrength = (adjustedStrength * 110) / 100; // 10% general bonus

            // Vigilantes have an advantage against Law Enforcement
            if (opposingFactionId == LAW_ENFORCEMENT) {
                adjustedStrength = (adjustedStrength * 110) / 100; // 10% bonus vs Law Enforcement
            }
        }

        return adjustedStrength;
    }
}
