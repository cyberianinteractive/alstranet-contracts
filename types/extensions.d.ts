// types/extensions.d.ts
import { BaseContract, BigNumberish, BytesLike } from "ethers";

// Extend the BaseGovernor type with methods from OpenZeppelin Governor extensions
declare module "../typechain/contracts/protocol/governance/BaseGovernor" {
    interface BaseGovernor extends BaseContract {
        // Add the missing methods from GovernorTimelockControlUpgradeable
        queue(
            targets: string[], 
            values: BigNumberish[], 
            calldatas: BytesLike[], 
            descriptionHash: BytesLike
        ): Promise<any>;
        
        execute(
            targets: string[], 
            values: BigNumberish[], 
            calldatas: BytesLike[], 
            descriptionHash: BytesLike
        ): Promise<any>;
        
        // Add additional methods as needed
        cancel(
            targets: string[], 
            values: BigNumberish[], 
            calldatas: BytesLike[], 
            descriptionHash: BytesLike
        ): Promise<any>;
        
        castVote(
            proposalId: BigNumberish,
            support: BigNumberish
        ): Promise<any>;
        
        castVoteWithReason(
            proposalId: BigNumberish,
            support: BigNumberish,
            reason: string
        ): Promise<any>;
        
        castVoteWithReasonAndParams(
            proposalId: BigNumberish,
            support: BigNumberish,
            reason: string,
            params: BytesLike
        ): Promise<any>;
        
        // TimelockController methods
        timelock(): Promise<string>;
        
        // GovernorSettings methods
        setVotingDelay(newVotingDelay: BigNumberish): Promise<any>;
        setVotingPeriod(newVotingPeriod: BigNumberish): Promise<any>;
        setProposalThreshold(newProposalThreshold: BigNumberish): Promise<any>;
    }
}