// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title IFactionRegistry
 * @dev Interface for the Faction Registry contract that manages faction membership and reputation
 */
interface IFactionRegistry {
    /**
     * @dev Structure to define a faction member
     */
    struct FactionMember {
        uint8 factionId;
        uint8 rank;
        uint256 reputation;
        uint256 joinedAt;
        bool active;
    }

    /**
     * @dev Structure to define faction metadata
     */
    struct FactionInfo {
        string name;
        string description;
        uint256 totalMembers;
        uint256 totalReputation;
        uint256 influenceScore;
        bool active;
    }

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
     * @dev Allows a user to join a faction
     * @param factionId The ID of the faction to join (1=Law Enforcement, 2=Criminal, 3=Vigilante)
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
    function updateRank(address member, uint8 newRank) external;

    /**
     * @dev Increases a member's reputation within their faction
     * @param member The address of the member
     * @param amount The amount to increase reputation by
     */
    function increaseReputation(address member, uint256 amount) external;

    /**
     * @dev Decreases a member's reputation within their faction
     * @param member The address of the member
     * @param amount The amount to decrease reputation by
     */
    function decreaseReputation(address member, uint256 amount) external;

    /**
     * @dev Updates a faction's influence score
     * @param factionId The ID of the faction
     * @param newInfluence The new influence score
     */
    function updateFactionInfluence(uint8 factionId, uint256 newInfluence) external;

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
}