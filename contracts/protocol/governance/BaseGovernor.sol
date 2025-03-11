// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import {GovernorUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol";
import {GovernorCountingSimpleUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import {GovernorSettingsUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorSettingsUpgradeable.sol";
import {GovernorStorageUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorStorageUpgradeable.sol";
import {GovernorTimelockControlUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorTimelockControlUpgradeable.sol";
import {GovernorVotesUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesUpgradeable.sol";
import {GovernorVotesQuorumFractionUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesQuorumFractionUpgradeable.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {TimelockControllerUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title BaseGovernor
 * @dev A governance contract for decentralized decision-making based on OpenZeppelin's Governor modules.
 * This contract implements:
 *  - Basic governance functionality with proposal creation, voting, and execution
 *  - Configurable voting settings (delay, period, and proposal threshold)
 *  - Simple majority voting with for/against/abstain options
 *  - Proposal storage for on-chain proposals
 *  - Token-based voting power using an external token that implements IVotes
 *  - Fractional quorum requirement based on percentage of total supply
 *  - Timelock functionality for delayed execution of approved proposals
 *  - Ownership for controlled upgrades
 *  - UUPS upgradability pattern
 *
 * The contract is designed to be initialized with configurable parameters 
 * for voting delay, voting period, proposal threshold, and quorum percentage.
 */
contract BaseGovernor is Initializable, GovernorUpgradeable, GovernorSettingsUpgradeable, GovernorCountingSimpleUpgradeable, GovernorStorageUpgradeable, GovernorVotesUpgradeable, GovernorVotesQuorumFractionUpgradeable, GovernorTimelockControlUpgradeable, OwnableUpgradeable, UUPSUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the governor with configurable governance parameters.
     * @param _token The token used for voting power (must implement IVotes interface)
     * @param _timelock The timelock controller that will hold and execute proposals
     * @param initialOwner The initial owner of the governor contract (for upgrades)
     * @param _votingDelay The delay between proposal creation and voting start, in seconds
     * @param _votingPeriod The duration of the voting period, in seconds
     * @param _proposalThreshold The minimum voting power required to create proposals
     * @param _quorumNumerator The percentage (1-100) of total supply required for quorum
     */
    function initialize(
        IVotes _token, 
        TimelockControllerUpgradeable _timelock, 
        address initialOwner,
        uint48 _votingDelay,
        uint32 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumNumerator
    ) public initializer {
        // Initialize the base Governor with a name
        __Governor_init("BaseGovernor");
        
        // Initialize governance settings with configurable parameters
        __GovernorSettings_init(_votingDelay, _votingPeriod, _proposalThreshold);
        
        // Initialize the vote counting mechanism
        __GovernorCountingSimple_init();
        
        // Initialize proposal storage
        __GovernorStorage_init();
        
        // Initialize token-based voting
        __GovernorVotes_init(_token);
        
        // Initialize quorum requirements with configurable percentage
        __GovernorVotesQuorumFraction_init(_quorumNumerator);
        
        // Initialize timelock control
        __GovernorTimelockControl_init(_timelock);
        
        // Initialize ownership for upgrades
        __Ownable_init(initialOwner);
        
        // Initialize upgradability
        __UUPSUpgradeable_init();
    }

    /**
     * @dev Function to authorize contract upgrades.
     * Only callable by the contract owner.
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    // The following functions are overrides required by Solidity.

    /**
     * @dev Returns the delay between proposal creation and voting start.
     * @return The voting delay in seconds
     */
    function votingDelay()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.votingDelay();
    }

    /**
     * @dev Returns the voting period duration.
     * @return The voting period in seconds
     */
    function votingPeriod()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    /**
     * @dev Returns the quorum required for a proposal at a specific block number.
     * @param blockNumber The block number to get the quorum for
     * @return The minimum number of votes required for quorum
     */
    function quorum(uint256 blockNumber)
        public
        view
        override(GovernorUpgradeable, GovernorVotesQuorumFractionUpgradeable)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    /**
     * @dev Returns the current state of a proposal.
     * @param proposalId The ID of the proposal
     * @return The current state of the proposal
     */
    function state(uint256 proposalId)
        public
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    /**
     * @dev Determines if a proposal needs to be queued in the timelock.
     * @param proposalId The ID of the proposal
     * @return Whether the proposal needs queueing
     */
    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    /**
     * @dev Returns the minimum number of votes required to create a proposal.
     * @return The proposal threshold
     */
    function proposalThreshold()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    /**
     * @dev Internal function to create a new proposal.
     * @param targets The addresses of the contracts to call
     * @param values The ETH values to send with the calls
     * @param calldatas The call data for each target
     * @param description A description of the proposal
     * @param proposer The address of the proposer
     * @return The ID of the new proposal
     */
    function _propose(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description, address proposer)
        internal
        override(GovernorUpgradeable, GovernorStorageUpgradeable)
        returns (uint256)
    {
        return super._propose(targets, values, calldatas, description, proposer);
    }

    /**
     * @dev Internal function to queue operations in the timelock.
     * @param proposalId The ID of the proposal
     * @param targets The addresses of the contracts to call
     * @param values The ETH values to send with the calls
     * @param calldatas The call data for each target
     * @param descriptionHash The hash of the proposal description
     * @return The timestamp when the proposal will be ready for execution
     */
    function _queueOperations(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (uint48)
    {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    /**
     * @dev Internal function to execute the operations of a proposal.
     * @param proposalId The ID of the proposal
     * @param targets The addresses of the contracts to call
     * @param values The ETH values to send with the calls
     * @param calldatas The call data for each target
     * @param descriptionHash The hash of the proposal description
     */
    function _executeOperations(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
    {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    /**
     * @dev Internal function to cancel a proposal.
     * @param targets The addresses of the contracts to call
     * @param values The ETH values to send with the calls
     * @param calldatas The call data for each target
     * @param descriptionHash The hash of the proposal description
     * @return The ID of the canceled proposal
     */
    function _cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    /**
     * @dev Internal function to determine the executor of proposal operations.
     * @return The address of the executor (typically the timelock)
     */
    function _executor()
        internal
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (address)
    {
        return super._executor();
    }
}