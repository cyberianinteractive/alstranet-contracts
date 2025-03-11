// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title ITreasuryManagement
 * @dev Interface for the Treasury Management contract that manages DAO funds and assets
 * Designed to work specifically with the BaseGovernor governance system
 */
interface ITreasuryManagement {
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
     * @dev Emitted when funds are deposited to the treasury
     */
    event FundsDeposited(address indexed from, uint256 amount, string note);

    /**
     * @dev Emitted when funds are spent from the treasury through governance
     */
    event FundsSpent(uint256 indexed proposalId, address indexed recipient, uint256 amount, string purpose);

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
     * @dev Allows depositing funds to the treasury
     * @param note A note explaining the purpose of the deposit
     */
    function depositFunds(string calldata note) external payable;

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
    ) external returns (bool);

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
    ) external returns (bool);

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
    ) external returns (bool);

    /**
     * @dev Distributes revenue to faction treasuries based on territory control
     * This can be called periodically by authorized roles or through governance
     * @return totalDistributed The total amount distributed
     */
    function distributeRevenue() external returns (uint256);

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
    ) external returns (bool);

    /**
     * @dev Gets the current treasury balance
     * @return The balance of the treasury
     */
    function getTreasuryBalance() external view returns (uint256);

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
}