// test/fixtures/tokens/AlstraToken.fixture.ts
import { deployments, ethers, getNamedAccounts } from 'hardhat';
import { AlstraToken } from '../../../typechain/contracts/protocol/governance/AlstraToken';

/**
 * Fixture specifically for AlstraToken tests
 * Sets up the contract and necessary test data
 */
export async function setupAlstraTokenFixture() {
    // Deploy the contract using tag
    await deployments.fixture(['AlstraToken']);
    
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
        feeManager: await ethers.getSigner(namedAccounts.feeManager),
        vestingManager: await ethers.getSigner(namedAccounts.vestingManager),
        stakingManager: await ethers.getSigner(namedAccounts.stakingManager),
        // Get some extra signers for testing as users
        user1: allSigners[10], // Using account #10 to avoid collision with named accounts
        user2: allSigners[11],
        user3: allSigners[12],
    };

    // Get the contract instance with proper typing
    const alstraToken = await ethers.getContract<AlstraToken>('AlstraToken');
    
    // Get role identifiers for testing access control
    const roles = {
        DEFAULT_ADMIN_ROLE: await alstraToken.DEFAULT_ADMIN_ROLE(),
        PAUSER_ROLE: await alstraToken.PAUSER_ROLE(),
        MINTER_ROLE: await alstraToken.MINTER_ROLE(),
        UPGRADER_ROLE: await alstraToken.UPGRADER_ROLE(),
        FEE_MANAGER_ROLE: await alstraToken.FEE_MANAGER_ROLE(),
        VESTING_MANAGER_ROLE: await alstraToken.VESTING_MANAGER_ROLE(),
        STAKING_MANAGER_ROLE: await alstraToken.STAKING_MANAGER_ROLE()
    };
    
    // Get addresses for users
    const user1Address = await signers.user1.getAddress();
    const user2Address = await signers.user2.getAddress();
    const user3Address = await signers.user3.getAddress();
    
    // Get constants from the contract
    const feeRate = await alstraToken.feeRate();
    const burnRate = await alstraToken.burnRate();
    const feeDenominator = await alstraToken.FEE_DENOMINATOR();
    const maxLockPeriod = await alstraToken.MAX_LOCK_PERIOD();
    const emergencyWithdrawalPenaltyRate = await alstraToken.EMERGENCY_WITHDRAWAL_PENALTY_RATE();

    // Mint tokens to users for testing
    const mintAmount = ethers.parseEther('10000'); // Higher amount for fee testing
    const alstraTokenAsMinter = alstraToken.connect(signers.minter);
    await alstraTokenAsMinter.mint(user1Address, mintAmount);
    await alstraTokenAsMinter.mint(user2Address, mintAmount);
    await alstraTokenAsMinter.mint(user3Address, mintAmount);

    return {
        alstraToken,
        ...signers,
        mintAmount,
        roles,
        constants: {
            feeRate,
            burnRate,
            feeDenominator,
            maxLockPeriod,
            emergencyWithdrawalPenaltyRate
        }
    };
}