// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import {GovernorUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol";
import {GovernorCountingSimpleUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import {GovernorSettingsUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorSettingsUpgradeable.sol";
import {GovernorTimelockControlUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorTimelockControlUpgradeable.sol";
import {GovernorVotesUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesUpgradeable.sol";
import {GovernorVotesQuorumFractionUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesQuorumFractionUpgradeable.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {TimelockControllerUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";

/**
 * @title BaseGovernor
 * @dev A governance contract that combines multiple OpenZeppelin governance features.
 * This contract provides token-based voting with a configurable name, settings for voting parameters,
 * simple vote counting (for, against, abstain), quorum calculation, and timelock control for
 * delayed execution of approved proposals.
 */
contract BaseGovernor is Initializable, GovernorUpgradeable, GovernorSettingsUpgradeable, GovernorCountingSimpleUpgradeable, GovernorVotesUpgradeable, GovernorVotesQuorumFractionUpgradeable, GovernorTimelockControlUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
    * @dev Initializes the governance contract with required parameters.
    * 
    * @param name The name for this governor instance
    * @param _token The token used to determine voting power
    * @param _timelock The timelock controller for delayed execution of proposals
    * @param _votingDelay The delay before voting on a proposal may take place, in blocks
    * @param _votingPeriod The duration of the voting period in blocks
    * @param _proposalThreshold The minimum number of votes required to create a proposal
    * @param _quorumPercentage The percentage of total supply required for a quorum
    */
    function initialize(
        string memory name, 
        IVotes _token, 
        TimelockControllerUpgradeable _timelock,
        uint48 _votingDelay,
        uint32 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumPercentage
    )
        public initializer
    {
        __Governor_init(name);
        __GovernorSettings_init(_votingDelay, _votingPeriod, _proposalThreshold);
        __GovernorCountingSimple_init();
        __GovernorVotes_init(_token);
        __GovernorVotesQuorumFraction_init(_quorumPercentage);
        __GovernorTimelockControl_init(_timelock);
    }

    // The following functions are overrides required by Solidity.

    /**
     * @dev Returns the delay before voting on a proposal may take place, in blocks.
     * Overrides both GovernorUpgradeable and GovernorSettingsUpgradeable versions.
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
     * @dev Returns the duration of the voting period in blocks.
     * Overrides both GovernorUpgradeable and GovernorSettingsUpgradeable versions.
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
     * @dev Returns the quorum for a block number, in terms of number of votes.
     * Overrides both GovernorUpgradeable and GovernorVotesQuorumFractionUpgradeable versions.
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
     * Overrides both GovernorUpgradeable and GovernorTimelockControlUpgradeable versions.
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
     * @dev Returns whether a proposal needs to be queued.
     * Overrides both GovernorUpgradeable and GovernorTimelockControlUpgradeable versions.
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
     * @dev Returns the minimum number of votes required for an account to create a proposal.
     * Overrides both GovernorUpgradeable and GovernorSettingsUpgradeable versions.
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
     * @dev Queues operations for a proposal.
     * Overrides both GovernorUpgradeable and GovernorTimelockControlUpgradeable versions.
     */
    function _queueOperations(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (uint48)
    {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    /**
     * @dev Executes operations for a proposal.
     * Overrides both GovernorUpgradeable and GovernorTimelockControlUpgradeable versions.
     */
    function _executeOperations(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
    {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    /**
     * @dev Cancels operations for a proposal.
     * Overrides both GovernorUpgradeable and GovernorTimelockControlUpgradeable versions.
     */
    function _cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    /**
     * @dev Returns the executor of the governor.
     * Overrides both GovernorUpgradeable and GovernorTimelockControlUpgradeable versions.
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