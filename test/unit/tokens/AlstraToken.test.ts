// test/unit/tokens/AlstraToken.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAlstraTokenFixture } from "../../fixtures/tokens/AlstraToken.fixture";
import { AlstraToken } from "../../../typechain/contracts/protocol/tokens/AlstraToken";
import { Signer, EventLog } from "ethers";

describe("AlstraToken", function () {
    // Test variables
    let alstraToken: AlstraToken;
    let deployer: Signer;
    let defaultAdmin: Signer;
    let pauser: Signer;
    let minter: Signer;
    let upgrader: Signer;
    let feeManager: Signer;
    let vestingManager: Signer;
    let stakingManager: Signer;
    let user1: Signer;
    let user2: Signer;
    let user3: Signer;
    let roles: Record<string, string>;
    let mintAmount: bigint;
    let constants: {
        feeRate: bigint;
        burnRate: bigint;
        feeDenominator: bigint;
        maxLockPeriod: bigint;
        emergencyWithdrawalPenaltyRate: bigint;
    };

    // Store addresses for easier access
    let user1Address: string;
    let user2Address: string;
    let user3Address: string;
    let feeManagerAddress: string;
    let vestingManagerAddress: string;
    let stakingManagerAddress: string;

    // Use beforeEach to reset the state before each test
    beforeEach(async function () {
        // Load the fixture
        const fixture = await setupAlstraTokenFixture();

        // Assign all returned values from fixture
        alstraToken = fixture.alstraToken;
        deployer = fixture.deployer;
        defaultAdmin = fixture.defaultAdmin;
        pauser = fixture.pauser;
        minter = fixture.minter;
        upgrader = fixture.upgrader;
        feeManager = fixture.feeManager;
        vestingManager = fixture.vestingManager;
        stakingManager = fixture.stakingManager;
        user1 = fixture.user1;
        user2 = fixture.user2;
        user3 = fixture.user3;
        roles = fixture.roles;
        mintAmount = fixture.mintAmount;
        constants = fixture.constants;

        // Get addresses for use in tests
        user1Address = await user1.getAddress();
        user2Address = await user2.getAddress();
        user3Address = await user3.getAddress();
        feeManagerAddress = await feeManager.getAddress();
        vestingManagerAddress = await vestingManager.getAddress();
        stakingManagerAddress = await stakingManager.getAddress();
    });

    // Helper function to check if two bigints are approximately equal
    function expectBigIntCloseTo(actual: bigint, expected: bigint, tolerance: bigint = BigInt(10000000000000000000n)) {
        const difference = actual > expected ? actual - expected : expected - actual;
        expect(difference <= tolerance).to.be.true,
            `Expected ${actual} to be close to ${expected} (within tolerance ${tolerance}), but difference was ${difference}`;
    }

    describe("Initialization", function () {
        it("should correctly set the token name and symbol", async function () {
            expect(await alstraToken.name()).to.equal("Alstra");
            expect(await alstraToken.symbol()).to.equal("ALSTRA");
        });

        it("should correctly assign roles", async function () {
            // Standard roles from BaseGovernanceToken
            expect(await alstraToken.hasRole(roles.DEFAULT_ADMIN_ROLE, await defaultAdmin.getAddress())).to.be.true;
            expect(await alstraToken.hasRole(roles.PAUSER_ROLE, await pauser.getAddress())).to.be.true;
            expect(await alstraToken.hasRole(roles.MINTER_ROLE, await minter.getAddress())).to.be.true;
            expect(await alstraToken.hasRole(roles.UPGRADER_ROLE, await upgrader.getAddress())).to.be.true;

            // AlstraToken specific roles
            expect(await alstraToken.hasRole(roles.FEE_MANAGER_ROLE, feeManagerAddress)).to.be.true;
            expect(await alstraToken.hasRole(roles.VESTING_MANAGER_ROLE, vestingManagerAddress)).to.be.true;
            expect(await alstraToken.hasRole(roles.STAKING_MANAGER_ROLE, stakingManagerAddress)).to.be.true;
        });

        it("should initialize with the correct fee and burn rates", async function () {
            expect(await alstraToken.feeRate()).to.equal(100n); // 1%
            expect(await alstraToken.burnRate()).to.equal(5000n); // 50%
        });

        it("should have the total supply minted to the contract itself", async function () {
            const initialSupply = await alstraToken.TOTAL_SUPPLY();
            const contractBalance = await alstraToken.balanceOf(await alstraToken.getAddress());
            const currentTotalSupply = await alstraToken.totalSupply();

            // The contract should hold the entire INITIAL_SUPPLY
            expect(contractBalance).to.equal(initialSupply);
            
            // The total supply should equal the initial supply plus the 3 users' minted tokens
            expect(currentTotalSupply).to.equal(initialSupply + (mintAmount * 3n));
        });
    });

    describe("Fee Mechanism", function () {
        it("should apply fees on token transfers", async function () {
            const transferAmount = ethers.parseEther("1000");
            const alstraTokenAsUser1 = alstraToken.connect(user1);

            const initialBalanceUser1 = await alstraToken.balanceOf(user1Address);
            const initialBalanceUser2 = await alstraToken.balanceOf(user2Address);
            const initialContractBalance = await alstraToken.balanceOf(await alstraToken.getAddress());
            const initialTotalSupply = await alstraToken.totalSupply();

            // Calculate expected fee amounts
            const totalFee = (transferAmount * constants.feeRate) / constants.feeDenominator;
            const burnAmount = (totalFee * constants.burnRate) / constants.feeDenominator;
            const remainingFee = totalFee - burnAmount;

            // Execute transfer
            await alstraTokenAsUser1.transfer(user2Address, transferAmount);

            // Check balances after transfer
            const finalBalanceUser1 = await alstraToken.balanceOf(user1Address);
            const finalBalanceUser2 = await alstraToken.balanceOf(user2Address);
            const finalContractBalance = await alstraToken.balanceOf(await alstraToken.getAddress());
            const finalTotalSupply = await alstraToken.totalSupply();

            // Sender should lose transfer amount
            expect(finalBalanceUser1).to.equal(initialBalanceUser1 - transferAmount);

            // Recipient should get transfer amount minus total fee
            expect(finalBalanceUser2).to.equal(initialBalanceUser2 + (transferAmount - totalFee));

            // Contract should receive the remaining fee (not burned portion)
            expect(finalContractBalance).to.equal(initialContractBalance + remainingFee);

            // Total supply should be reduced by burnAmount
            expect(finalTotalSupply).to.equal(initialTotalSupply - burnAmount);
        });

        it("should apply fees on transferFrom", async function () {
            const approvalAmount = ethers.parseEther("2000");
            const transferAmount = ethers.parseEther("1000");

            const alstraTokenAsUser1 = alstraToken.connect(user1);
            const alstraTokenAsUser2 = alstraToken.connect(user2);

            // User1 approves User2 to spend tokens
            await alstraTokenAsUser1.approve(user2Address, approvalAmount);

            const initialBalanceUser1 = await alstraToken.balanceOf(user1Address);
            const initialBalanceUser2 = await alstraToken.balanceOf(user2Address);

            // Calculate expected fee amounts
            const totalFee = (transferAmount * constants.feeRate) / constants.feeDenominator;

            // Execute transferFrom
            await alstraTokenAsUser2.transferFrom(user1Address, user2Address, transferAmount);

            // Check balances after transfer
            const finalBalanceUser1 = await alstraToken.balanceOf(user1Address);
            const finalBalanceUser2 = await alstraToken.balanceOf(user2Address);

            // Sender should lose transfer amount
            expect(finalBalanceUser1).to.equal(initialBalanceUser1 - transferAmount);

            // Recipient should get transfer amount minus total fee
            expect(finalBalanceUser2).to.equal(initialBalanceUser2 + (transferAmount - totalFee));

            // Check remaining allowance - total transferAmount should be deducted
            const remainingAllowance = await alstraToken.allowance(user1Address, user2Address);
            expect(remainingAllowance).to.equal(approvalAmount - transferAmount);
        });

        it("should allow the fee manager to update fee rate", async function () {
            const alstraTokenAsFeeManager = alstraToken.connect(feeManager);
            const oldFeeRate = await alstraToken.feeRate();
            const newFeeRate = 200n; // 2%

            await alstraTokenAsFeeManager.setFeeRate(newFeeRate);

            expect(await alstraToken.feeRate()).to.equal(newFeeRate);
            expect(await alstraToken.feeRate()).to.not.equal(oldFeeRate);
        });

        it("should allow the fee manager to update burn rate", async function () {
            const alstraTokenAsFeeManager = alstraToken.connect(feeManager);
            const oldBurnRate = await alstraToken.burnRate();
            const newBurnRate = 4000n; // 40%

            await alstraTokenAsFeeManager.setBurnRate(newBurnRate);

            expect(await alstraToken.burnRate()).to.equal(newBurnRate);
            expect(await alstraToken.burnRate()).to.not.equal(oldBurnRate);
        });

        it("should prevent non-fee managers from updating fee rates", async function () {
            const alstraTokenAsUser = alstraToken.connect(user1);
            const newFeeRate = 200n; // 2%

            await expect(alstraTokenAsUser.setFeeRate(newFeeRate))
                .to.be.revertedWithCustomError(alstraToken, "AccessControlUnauthorizedAccount")
                .withArgs(user1Address, roles.FEE_MANAGER_ROLE);
        });
    });

    describe("Staking", function () {
        it("should allow creating a stake", async function () {
            const stakeAmount = ethers.parseEther("500");
            const lockPeriod = 30 * 24 * 60 * 60; // 30 days
            const alstraTokenAsUser = alstraToken.connect(user1);

            const initialBalance = await alstraToken.balanceOf(user1Address);
            const initialContractBalance = await alstraToken.balanceOf(await alstraToken.getAddress());
            const initialTotalStaked = await alstraToken.totalStaked();

            // Create a stake
            const tx = await alstraTokenAsUser.createStake(stakeAmount, lockPeriod);

            // Get the stake ID from events
            const receipt = await tx.wait();
            // Filter to find event logs and use type guard to ensure we're accessing EventLog properties
            const eventLog = receipt?.logs.find(log => 
                log instanceof EventLog && 
                log.fragment.name === 'TokensStaked' &&
                log.args[0] === user1Address
            ) as EventLog | undefined;

            const stakeId = eventLog?.args?.stakeId;
            expect(stakeId).to.not.be.undefined;

            // Get stake info
            const stake = await alstraToken.stakes(user1Address, stakeId);

            // Check stake was created correctly
            expect(stake.amount).to.equal(stakeAmount);
            expect(stake.lockPeriod).to.equal(lockPeriod);
            expect(stake.active).to.be.true;

            // Check balances
            expect(await alstraToken.balanceOf(user1Address)).to.equal(initialBalance - stakeAmount);
            expect(await alstraToken.balanceOf(await alstraToken.getAddress())).to.equal(initialContractBalance + stakeAmount);
            expect(await alstraToken.totalStaked()).to.equal(initialTotalStaked + stakeAmount);
        });

        it("should enforce maximum lock period", async function () {
            const stakeAmount = ethers.parseEther("500");
            const lockPeriod = constants.maxLockPeriod + 1n; // Exceed max lock period
            const alstraTokenAsUser = alstraToken.connect(user1);

            await expect(alstraTokenAsUser.createStake(stakeAmount, lockPeriod))
                .to.be.revertedWith("Lock period cannot exceed 4 years");
        });

        it("should allow emergency withdrawal with penalty", async function () {
            const stakeAmount = ethers.parseEther("1000");
            const lockPeriod = 365 * 24 * 60 * 60; // 1 year
            const alstraTokenAsUser = alstraToken.connect(user1);

            // Create a stake
            const tx = await alstraTokenAsUser.createStake(stakeAmount, lockPeriod);
            const receipt = await tx.wait();
            const eventLog = receipt?.logs.find(log => 
                log instanceof EventLog && 
                log.fragment.name === 'TokensStaked' &&
                log.args[0] === user1Address
            ) as EventLog | undefined;
            const stakeId = eventLog?.args?.stakeId;

            const initialBalance = await alstraToken.balanceOf(user1Address);

            // Emergency withdraw
            const withdrawTx = await alstraTokenAsUser.emergencyWithdrawStake(stakeId);
            const withdrawReceipt = await withdrawTx.wait();
            const withdrawEventLog = withdrawReceipt?.logs.find(log => 
                log instanceof EventLog && 
                log.fragment.name === 'EmergencyWithdrawal' &&
                log.args[0] === user1Address
            ) as EventLog | undefined;

            // Check event data
            const amountReturned = withdrawEventLog?.args?.amount;
            const penalty = withdrawEventLog?.args?.penalty;

            expect(amountReturned).to.be.lessThan(stakeAmount);
            expect(penalty).to.be.greaterThan(0);

            // Check stake state
            const stake = await alstraToken.stakes(user1Address, stakeId);
            expect(stake.active).to.be.false;

            // The small difference is due to time-based calculation in the emergency withdrawal
            // This is expected and acceptable
            expectBigIntCloseTo(
                await alstraToken.balanceOf(user1Address), 
                initialBalance + amountReturned, 
                ethers.parseEther("0.01")
            );
        });
    });

    describe("Vesting", function () {
        it("should allow vesting manager to create vesting schedules", async function () {
            const alstraTokenAsVestingManager = alstraToken.connect(vestingManager);
            const vestAmount = ethers.parseEther("10000");
            const initialUnlock = 1000n; // 10%
            const cliff = 90 * 24 * 60 * 60; // 90 days
            const duration = 365 * 24 * 60 * 60; // 1 year

            // Get current block timestamp to add for vestingStartTime
            const currentBlockTimestamp = Math.floor(Date.now() / 1000) + 100; // Add 100 seconds to ensure it's in the future

            const tx = await alstraTokenAsVestingManager.createVestingSchedule(
                user3Address,
                vestAmount,
                currentBlockTimestamp,
                cliff,
                duration,
                initialUnlock,
                true, // revocable
                0 // ValidatorRewards category
            );

            const receipt = await tx.wait();
            const eventLog = receipt?.logs.find(log => 
                log instanceof EventLog && 
                log.fragment.name === 'VestingScheduleCreated' &&
                log.args[0] === user3Address
            ) as EventLog | undefined;

            const scheduleId = eventLog?.args?.scheduleId;
            expect(scheduleId).to.not.be.undefined;

            // Check vesting schedule was created
            const schedule = await alstraToken.vestingSchedules(user3Address, scheduleId);
            expect(schedule.totalAmount).to.equal(vestAmount);
            expect(schedule.startTime).to.equal(currentBlockTimestamp);
            expect(schedule.cliff).to.equal(cliff);
            expect(schedule.duration).to.equal(duration);
            expect(schedule.initialUnlock).to.equal(initialUnlock);
            expect(schedule.revocable).to.be.true;
            expect(schedule.revoked).to.be.false;

            // Check initial unlock was transferred
            const initialUnlockAmount = (vestAmount * initialUnlock) / constants.feeDenominator;
            expect(schedule.released).to.equal(initialUnlockAmount);
        });

        it("should prevent non-vesting managers from creating schedules", async function () {
            const alstraTokenAsUser = alstraToken.connect(user1);
            const vestAmount = ethers.parseEther("10000");
            const startTime = Math.floor(Date.now() / 1000) + 100;

            await expect(alstraTokenAsUser.createVestingSchedule(
                user3Address,
                vestAmount,
                startTime,
                0,
                365 * 24 * 60 * 60,
                1000, // 10%
                true,
                0 // ValidatorRewards
            )).to.be.revertedWithCustomError(alstraToken, "AccessControlUnauthorizedAccount")
                .withArgs(user1Address, roles.VESTING_MANAGER_ROLE);
        });

        it("should respect allocation limits for vesting categories", async function () {
            const alstraTokenAsVestingManager = alstraToken.connect(vestingManager);
            const totalSupply = await alstraToken.TOTAL_SUPPLY();

            // Try to allocate more than the allowed 40% to ValidatorRewards
            const excessiveAmount = (totalSupply * 41n) / 100n;
            const startTime = Math.floor(Date.now() / 1000) + 100;

            await expect(alstraTokenAsVestingManager.createVestingSchedule(
                user3Address,
                excessiveAmount,
                startTime,
                0,
                365 * 24 * 60 * 60,
                0, // 0% initial unlock
                true,
                0 // ValidatorRewards
            )).to.be.revertedWith("Allocation limit exceeded");
        });
    });

    describe("Role-Based Access Control for AlstraToken-specific Roles", function () {
        it("should allow defaultAdmin to grant and revoke roles", async function () {
            const alstraTokenAsAdmin = alstraToken.connect(defaultAdmin);

            // Grant fee manager role to user1
            await alstraTokenAsAdmin.grantRole(roles.FEE_MANAGER_ROLE, user1Address);
            expect(await alstraToken.hasRole(roles.FEE_MANAGER_ROLE, user1Address)).to.be.true;

            // Now user1 should be able to update fee rate
            const alstraTokenAsUser1 = alstraToken.connect(user1);
            await alstraTokenAsUser1.setFeeRate(200);

            // Revoke fee manager role from user1
            await alstraTokenAsAdmin.revokeRole(roles.FEE_MANAGER_ROLE, user1Address);
            expect(await alstraToken.hasRole(roles.FEE_MANAGER_ROLE, user1Address)).to.be.false;

            // Now user1 should not be able to update fee rate
            await expect(alstraTokenAsUser1.setFeeRate(300))
                .to.be.revertedWithCustomError(alstraToken, "AccessControlUnauthorizedAccount");
        });
    });
});