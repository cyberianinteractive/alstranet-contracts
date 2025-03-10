// test/fixtures/tokens/BaseGovernanceToken.fixture.ts
import { deployments, ethers, getNamedAccounts } from 'hardhat';
import { BaseGovernanceToken } from '../../../typechain/contracts/protocol/tokens/BaseGovernanceToken';

/**
 * Fixture specifically for BaseGovernanceToken tests
 * Sets up the contract and necessary test data
 */
export async function setupBaseGovernanceTokenFixture() {
    // Deploy the contract using tag
    await deployments.fixture(['BaseGovernanceToken']);
    
    // Get the named accounts that were used during deployment
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
        // Get some extra signers for testing as users
        user1: allSigners[10], // Using account #10 to avoid collision with named accounts
        user2: allSigners[11],
    };

    // Get the contract instance with proper typing
    const baseGovernanceToken = await ethers.getContract<BaseGovernanceToken>('BaseGovernanceToken');
    
    // Get role identifiers for testing access control
    const roles = {
        DEFAULT_ADMIN_ROLE: await baseGovernanceToken.DEFAULT_ADMIN_ROLE(),
        PAUSER_ROLE: await baseGovernanceToken.PAUSER_ROLE(),
        MINTER_ROLE: await baseGovernanceToken.MINTER_ROLE(),
        UPGRADER_ROLE: await baseGovernanceToken.UPGRADER_ROLE(),
    };
    
    // Get addresses for users
    const user1Address = await signers.user1.getAddress();
    const user2Address = await signers.user2.getAddress();
    
    // Mint tokens to users for testing
    const mintAmount = ethers.parseEther('1000');
    const baseGovernanceTokenAsMinter = baseGovernanceToken.connect(signers.minter);
    await baseGovernanceTokenAsMinter.mint(user1Address, mintAmount);
    await baseGovernanceTokenAsMinter.mint(user2Address, mintAmount);

    return {
        baseGovernanceToken,
        ...signers,
        mintAmount,
        roles,
    };
}