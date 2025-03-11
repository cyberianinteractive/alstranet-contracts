// test/fixtures/governance/BaseGovernor.fixture.ts
import { deployments, ethers, getNamedAccounts } from 'hardhat';
import { BaseGovernor } from '../../../typechain/contracts/protocol/governance/BaseGovernor';
import { TimelockControllerUpgradeable } from '../../../typechain/@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable';
import { AlstraToken } from '../../../typechain/contracts/protocol/tokens/AlstraToken';
import { time } from '@nomicfoundation/hardhat-network-helpers';

/**
 * Fixture specifically for BaseGovernor tests
 * Sets up all necessary contracts and roles for governance testing
 */
export async function setupBaseGovernorFixture() {
    // Deploy all required contracts using tags
    await deployments.fixture(['AlstraToken', 'Governance', 'GovernanceSetup']);
    
    // Get the named accounts
    const namedAccounts = await getNamedAccounts();
    
    // Get actual signers so we can send transactions
    const allSigners = await ethers.getSigners();
    
    // Get signers that match our named accounts from deployment
    const signers = {
        deployer: await ethers.getSigner(namedAccounts.deployer),
        defaultAdmin: await ethers.getSigner(namedAccounts.defaultAdmin),
        pauser: await ethers.getSigner(namedAccounts.pauser),
        minter: await ethers.getSigner(namedAccounts.minter),
        upgrader: await ethers.getSigner(namedAccounts.upgrader),
        feeManager: await ethers.getSigner(namedAccounts.feeManager),
        vestingManager: await ethers.getSigner(namedAccounts.vestingManager),
        stakingManager: await ethers.getSigner(namedAccounts.stakingManager),
        // Get some extra signers for testing as users with voting power
        user1: allSigners[10],
        user2: allSigners[11],
        user3: allSigners[12],
        user4: allSigners[13],
    };

    // Get the deployed contract instances
    const alstraToken = await ethers.getContract<AlstraToken>('AlstraToken');
    const timelock = await ethers.getContract<TimelockControllerUpgradeable>('TimelockController');
    const governor = await ethers.getContract<BaseGovernor>('BaseGovernor');
    
    // Get governance parameters
    const votingDelay = await governor.votingDelay();
    const votingPeriod = await governor.votingPeriod();
    const proposalThreshold = await governor.proposalThreshold();
    
    // Get TimelockController roles
    const timelockRoles = {
        PROPOSER_ROLE: await timelock.PROPOSER_ROLE(),
        EXECUTOR_ROLE: await timelock.EXECUTOR_ROLE(),
        CANCELLER_ROLE: await timelock.CANCELLER_ROLE(),
        DEFAULT_ADMIN_ROLE: await timelock.DEFAULT_ADMIN_ROLE(),
    };
    
    // Ensure minter has role to mint tokens
    const alstraTokenAsAdmin = alstraToken.connect(signers.defaultAdmin);
    
    // Get all relevant roles
    const minterRole = await alstraToken.MINTER_ROLE();
    const feeManagerRole = await alstraToken.FEE_MANAGER_ROLE();
    
    // Grant roles to timelock to allow it to execute mint functions
    if (!await alstraToken.hasRole(minterRole, timelock.getAddress())) {
        await alstraTokenAsAdmin.grantRole(minterRole, await timelock.getAddress());
        console.log("Granted MINTER_ROLE to Timelock");
    }
    
    // Also grant fee manager role to timelock
    if (!await alstraToken.hasRole(feeManagerRole, timelock.getAddress())) {
        await alstraTokenAsAdmin.grantRole(feeManagerRole, await timelock.getAddress());
        console.log("Granted FEE_MANAGER_ROLE to Timelock");
    }
    
    // Ensure minter has role to mint tokens for testing
    if (!await alstraToken.hasRole(minterRole, await signers.minter.getAddress())) {
        await alstraTokenAsAdmin.grantRole(minterRole, await signers.minter.getAddress());
        console.log("Granted MINTER_ROLE to minter signer");
    }
    
    // Prepare users with tokens and delegated voting power
    // Using much larger amounts to ensure we exceed quorum requirements
    const mintAmount = ethers.parseEther('10000000'); // 10 million tokens for testing
    const alstraTokenAsMinter = alstraToken.connect(signers.minter);
    
    // Mint tokens to test users
    const user1Address = await signers.user1.getAddress();
    const user2Address = await signers.user2.getAddress();
    const user3Address = await signers.user3.getAddress();
    const user4Address = await signers.user4.getAddress();
    const minterAddress = await signers.minter.getAddress();
    
    // Mint extra tokens to minter for tests requiring high voting power
    await alstraTokenAsMinter.mint(minterAddress, ethers.parseEther('100000000')); // 100 million tokens
    
    // Check balances first to avoid minting twice
    const user1Balance = await alstraToken.balanceOf(user1Address);
    if (user1Balance < mintAmount) {
        await alstraTokenAsMinter.mint(user1Address, mintAmount);
    }
    
    const user2Balance = await alstraToken.balanceOf(user2Address);
    if (user2Balance < mintAmount) {
        await alstraTokenAsMinter.mint(user2Address, mintAmount);
    }
    
    const user3Balance = await alstraToken.balanceOf(user3Address);
    if (user3Balance < mintAmount) {
        await alstraTokenAsMinter.mint(user3Address, mintAmount);
    }
    
    const user4Balance = await alstraToken.balanceOf(user4Address);
    if (user4Balance < mintAmount) {
        await alstraTokenAsMinter.mint(user4Address, mintAmount);
    }
    
    // Users delegate to themselves to activate voting power
    const alstraTokenAsUser1 = alstraToken.connect(signers.user1);
    const alstraTokenAsUser2 = alstraToken.connect(signers.user2);
    const alstraTokenAsUser3 = alstraToken.connect(signers.user3);
    const alstraTokenAsUser4 = alstraToken.connect(signers.user4);
    const alstraTokenAsMinterSigner = alstraToken.connect(signers.minter);
    
    // Check if already delegated, if not delegate
    if ((await alstraToken.getVotes(user1Address)) === 0n) {
        await alstraTokenAsUser1.delegate(user1Address);
    }
    
    if ((await alstraToken.getVotes(user2Address)) === 0n) {
        await alstraTokenAsUser2.delegate(user2Address);
    }
    
    if ((await alstraToken.getVotes(user3Address)) === 0n) {
        await alstraTokenAsUser3.delegate(user3Address);
    }
    
    if ((await alstraToken.getVotes(user4Address)) === 0n) {
        await alstraTokenAsUser4.delegate(user4Address);
    }
    
    if ((await alstraToken.getVotes(minterAddress)) === 0n) {
        await alstraTokenAsMinterSigner.delegate(minterAddress);
    }
    
    // Advance time by enough blocks to ensure quorum can be calculated
    // This is critical for ERC20Votes to properly checkpoint voting power
    await time.increase(10); // Advance 10 seconds
    await ethers.provider.send("evm_mine", []); // Mine a new block
    
    // Create a transaction to ensure a checkpoint exists for quorum calculation
    // This is necessary because quorum() needs a past block with voting data
    await alstraTokenAsMinterSigner.transfer(user1Address, ethers.parseEther("1"));
    await time.increase(1);
    await ethers.provider.send("evm_mine", []);
    
    // Helper function to create a proposal
    const createProposal = async (
        description: string, 
        targets: string[], 
        values: bigint[], 
        calldatas: string[],
        proposer: typeof signers.user1
    ) => {
        const governorAsProposer = governor.connect(proposer);
        const descriptionHash = ethers.id(description);
        
        // Calculate the proposal ID directly using the Governor contract's hash function
        const proposalId = await governor.hashProposal(
            targets,
            values,
            calldatas,
            descriptionHash
        );
        
        console.log(`Creating proposal with ID: ${proposalId}`);
        
        // Submit the proposal
        const tx = await governorAsProposer.propose(
            targets,
            values,
            calldatas,
            description
        );
        
        const receipt = await tx.wait();
        
        // Get snapshot
        const snapshot = await governor.proposalSnapshot(proposalId);
        console.log(`Proposal snapshot block: ${snapshot}`);
        
        return {
            proposalId,
            descriptionHash,
            tx,
            receipt
        };
    };
    
    // Helper function to move through proposal states
    const advanceProposalState = async (proposalId: bigint, castVotes = true) => {
        // Move from Pending to Active
        await time.increase(Number(votingDelay) + 1);
        await ethers.provider.send("evm_mine", []);
        
        // Cast votes if needed - by default the minter votes in favor with overwhelming voting power
        if (castVotes) {
            const governorAsMinter = governor.connect(signers.minter);
            await governorAsMinter.castVote(proposalId, 1); // 1 = For
        }
        
        // Move from Active to Succeeded (assuming it passes)
        await time.increase(Number(votingPeriod) + 1);
        await ethers.provider.send("evm_mine", []);
        
        return await governor.state(proposalId);
    };
    
    return {
        alstraToken,
        timelock,
        governor,
        ...signers,
        votingDelay,
        votingPeriod,
        proposalThreshold,
        timelockRoles,
        mintAmount,
        createProposal,
        advanceProposalState
    };
}