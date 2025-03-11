// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title ITreasuryManagement
 * @dev Interface for the Treasury Management contract that manages DAO funds and assets
 */
interface ITreasuryManagement {
    /**
     * @dev Structure to define a spending proposal
     */
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
     * @dev Emitted when funds are deposited to the treasury
     */
    event FundsDeposited(address indexed from, uint256 amount, string note);

    /**
     * @dev Emitted when a spending proposal is created
     */
    event SpendingProposalCreated(uint256 indexed proposalId, address indexed proposer, address recipient, uint256 amount, string purpose);

    /**
     * @dev Emitted when a spending proposal is approved by a signer
     */
    event SpendingProposalApproved(uint256 indexed proposalId, address indexed approver);

    /**
     * @dev Emitted when a spending proposal is executed
     */
    event SpendingProposalExecuted(uint256 indexed proposalId, address indexed recipient, uint256 amount);

    /**
     * @dev Emitted when treasury allocations are updated
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
     * @dev Allows depositing funds to the treasury
     * @param note A note explaining the purpose of the deposit
     */
    function depositFunds(string calldata note) external payable;

    /**
     * @dev Creates a spending proposal for treasury funds
     * @param recipient The recipient address for the funds
     * @param amount The amount to spend
     * @param purpose The purpose of the spending
     * @return proposalId The ID of the created proposal
     */
    function createSpendingProposal(
        address payable recipient,
        uint256 amount,
        string calldata purpose
    ) external returns (uint256);

    /**
     * @dev Approves a spending proposal
     * @param proposalId The ID of the proposal to approve
     */
    function approveSpendingProposal(uint256 proposalId) external;

    /**
     * @dev Executes a spending proposal that has reached approval threshold
     * @param proposalId The ID of the proposal to execute
     */
    function executeSpendingProposal(uint256 proposalId) external;

    /**
     * @dev Updates the treasury allocations
     * @param operationalFunds New allocation for operational funds
     * @param developmentFunds New allocation for development funds
     * @param marketingFunds New allocation for marketing funds
     * @param communityFunds New allocation for community funds
     * @param reserveFunds New allocation for reserve funds
     */
    function updateTreasuryAllocations(
        uint256 operationalFunds,
        uint256 developmentFunds,
        uint256 marketingFunds,
        uint256 communityFunds,
        uint256 reserveFunds
    ) external;

    /**
     * @dev Transfers funds between faction treasuries
     * @param fromFaction The faction ID to transfer from
     * @param toFaction The faction ID to transfer to
     * @param amount The amount to transfer
     * @param reason The reason for the transfer
     */
    function transferBetweenFactions(
        uint8 fromFaction,
        uint8 toFaction,
        uint256 amount,
        string calldata reason
    ) external;

    /**
     * @dev Gets details about a spending proposal
     * @param proposalId The ID of the proposal
     * @return proposer The address that created the proposal
     * @return recipient The recipient of the funds
     * @return amount The amount to be sent
     * @return purpose The purpose of the spending
     * @return createdAt When the proposal was created
     * @return approvalCount The number of approvals received
     * @return executed Whether the proposal has been executed
     */
    function getSpendingProposal(uint256 proposalId) external view returns (
        address proposer,
        address recipient,
        uint256 amount,
        string memory purpose,
        uint256 createdAt,
        uint256 approvalCount,
        bool executed
    );

    /**
     * @dev Checks if an address has approved a spending proposal
     * @param proposalId The ID of the proposal
     * @param approver The address to check for approval
     * @return Whether the address has approved the proposal
     */
    function hasApproved(uint256 proposalId, address approver) external view returns (bool);

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
     * @return The balance of the faction's treasury
     */
    function getFactionTreasuryBalance(uint8 factionId) external view returns (uint256);

    /**
     * @dev Gets the number of approvals required to execute a spending proposal
     * @return The number of required approvals
     */
    function getRequiredApprovals() external view returns (uint256);
}