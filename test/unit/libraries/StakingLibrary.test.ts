// test/StakingLibraryTestWrapper.test.ts
import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { StakingLibraryTestWrapper } from "../../../typechain/contracts/test/StakingLibraryTestWrapper";

describe("StakingLibrary (via TestWrapper)", function () {
    let stakingLibraryWrapper: StakingLibraryTestWrapper;

    // We'll get the constants from the wrapper
    let PRECISION: bigint;
    let SECONDS_IN_DAY: bigint;
    let SECONDS_IN_YEAR: bigint;
    let MIN_STAKE_PERIOD: bigint;
    let MAX_STAKE_PERIOD: bigint;
    let MIN_PENALTY: bigint;
    let MAX_PENALTY: bigint;

    before(async function () {
        // Deploy all contracts with the TestWrappers tag
        await deployments.fixture(["TestWrappers"]);
        
        // Get the deployed StakingLibraryTestWrapper
        const stakingLibraryWrapperDeployment = await deployments.get("StakingLibraryTestWrapper");
        
        // Get the contract instance
        stakingLibraryWrapper = await ethers.getContractAt(
            "StakingLibraryTestWrapper", 
            stakingLibraryWrapperDeployment.address
        );

        // Get constants from the wrapper
        PRECISION = await stakingLibraryWrapper.getPRECISION();
        SECONDS_IN_DAY = await stakingLibraryWrapper.getSECONDS_IN_DAY();
        SECONDS_IN_YEAR = await stakingLibraryWrapper.getSECONDS_IN_YEAR();
        MIN_STAKE_PERIOD = await stakingLibraryWrapper.getMIN_STAKE_PERIOD();
        MAX_STAKE_PERIOD = await stakingLibraryWrapper.getMAX_STAKE_PERIOD();
        MIN_PENALTY = await stakingLibraryWrapper.getMIN_PENALTY();
        MAX_PENALTY = await stakingLibraryWrapper.getMAX_PENALTY();
    });

    describe("calculateStakingReward", function () {
        it("should return 0 for zero stake amount", async function () {
            const reward = await stakingLibraryWrapper.calculateStakingReward(
                0n, // stakeAmount
                SECONDS_IN_DAY * 30n, // 30 days
                1000n, // territoryValue
                PRECISION * 10n / 100n, // 10% baseRewardRate
                5 // 5% factionBonus
            );
            expect(reward).to.equal(0n);
        });

        it("should return 0 for zero stake duration", async function () {
            const reward = await stakingLibraryWrapper.calculateStakingReward(
                ethers.parseEther("100"), // stakeAmount
                0n, // 0 duration
                1000n, // territoryValue
                PRECISION * 10n / 100n, // 10% baseRewardRate
                5 // 5% factionBonus
            );
            expect(reward).to.equal(0n);
        });

        it("should calculate rewards correctly for a 30-day stake", async function () {
            const stakeAmount = ethers.parseEther("1000");
            const stakeDuration = SECONDS_IN_DAY * 30n; // 30 days
            const territoryValue = 1000n;
            const baseRewardRate = PRECISION * 10n / 100n; // 10% annual rate
            const factionBonus = 5; // 5% faction bonus

            const reward = await stakingLibraryWrapper.calculateStakingReward(
                stakeAmount,
                stakeDuration,
                territoryValue,
                baseRewardRate,
                factionBonus
            );

            // Expected calculation:
            // Annual reward: 1000 * 10% = 100 ETH
            // Duration factor: (30 days / 365 days) = ~0.0822
            // Base reward: 100 ETH * 0.0822 = ~8.22 ETH
            // Territory multiplier: 1 + (1000 / 10000) = 1.1
            // Faction multiplier: 1 + (5 / 100) = 1.05
            // Final reward: 8.22 * 1.1 * 1.05 = ~9.49 ETH

            // We don't need the exact number, but check it's in the expected range
            expect(reward).to.be.gt(ethers.parseEther("8"));
            expect(reward).to.be.lt(ethers.parseEther("10"));
        });

        it("should cap territory multiplier at 2x", async function () {
            const stakeAmount = ethers.parseEther("1000");
            const stakeDuration = SECONDS_IN_DAY * 30n; // 30 days
            const territoryValue = 100000n; // Very high territory value
            const baseRewardRate = PRECISION * 10n / 100n; // 10% annual rate
            const factionBonus = 5; // 5% faction bonus

            const reward = await stakingLibraryWrapper.calculateStakingReward(
                stakeAmount,
                stakeDuration,
                territoryValue,
                baseRewardRate,
                factionBonus
            );

            // With a very high territory value, the multiplier should cap at 2x
            // Expected reward should be higher than with the normal territory value
            const normalReward = await stakingLibraryWrapper.calculateStakingReward(
                stakeAmount,
                stakeDuration,
                1000n, // normal territory value
                baseRewardRate,
                factionBonus
            );

            expect(reward).to.be.gt(normalReward);
            // The cap would make it less than 3x the normal reward
            expect(reward).to.be.lt(normalReward * 3n); // Sanity check
        });

        it("should apply faction bonus correctly", async function () {
            const stakeAmount = ethers.parseEther("1000");
            const stakeDuration = SECONDS_IN_DAY * 30n; // 30 days
            const territoryValue = 1000n;
            const baseRewardRate = PRECISION * 10n / 100n; // 10% annual rate

            // Test with 0% faction bonus
            const rewardWithNoBonus = await stakingLibraryWrapper.calculateStakingReward(
                stakeAmount,
                stakeDuration,
                territoryValue,
                baseRewardRate,
                0
            );

            // Test with 20% faction bonus
            const rewardWithBonus = await stakingLibraryWrapper.calculateStakingReward(
                stakeAmount,
                stakeDuration,
                territoryValue,
                baseRewardRate,
                20
            );

            // Reward with bonus should be higher than without bonus
            expect(rewardWithBonus).to.be.gt(rewardWithNoBonus);

            // The faction multiplier is (100 + 20) / 100 = 1.2
            // So the bonus reward should be approximately 1.2x the no-bonus reward
            const expectedIncrease = rewardWithNoBonus * 20n / 100n;
            const actualIncrease = rewardWithBonus - rewardWithNoBonus;

            // Allow for some rounding errors in Solidity calculations
            const tolerance = ethers.parseEther("0.1");
            expect(actualIncrease).to.be.closeTo(expectedIncrease, tolerance);
        });
    });

    describe("calculateControllingFaction", function () {
        it("should return no controlling faction for zero total staked", async function () {
            const factionStakes = [0n, 0n, 0n, 0n]; // No stakes
            const totalStaked = 0n;
            const controlThreshold = 50; // 50%

            const result = await stakingLibraryWrapper.calculateControllingFaction(
                factionStakes,
                totalStaked,
                controlThreshold
            );

            expect(result[0]).to.equal(0); // controllingFaction
            expect(result[1]).to.equal(0n); // controlPercentage
            expect(result[2]).to.be.false; // hasControl
        });

        it("should correctly identify the controlling faction", async function () {
            const factionStakes = [0n, 600n, 300n, 100n]; // Faction 1 has highest stake
            const totalStaked = 1000n;
            const controlThreshold = 50; // 50%

            const result = await stakingLibraryWrapper.calculateControllingFaction(
                factionStakes,
                totalStaked,
                controlThreshold
            );

            expect(result[0]).to.equal(1); // controllingFaction = Faction 1
            expect(result[1]).to.equal(60n); // controlPercentage = 60%
            expect(result[2]).to.be.true; // hasControl = true
        });

        it("should return no controlling faction if threshold not met", async function () {
            const factionStakes = [0n, 400n, 300n, 300n]; // Faction 1 has highest stake but < 50%
            const totalStaked = 1000n;
            const controlThreshold = 50; // 50%

            const result = await stakingLibraryWrapper.calculateControllingFaction(
                factionStakes,
                totalStaked,
                controlThreshold
            );

            expect(result[0]).to.equal(0); // controllingFaction = No controlling faction
            expect(result[1]).to.equal(40n); // controlPercentage = 40%
            expect(result[2]).to.be.false; // hasControl = false
        });

        it("should handle the case with equal highest stakes", async function () {
            // In this case, the first faction with the highest stake becomes controlling
            const factionStakes = [0n, 400n, 400n, 200n]; // Factions 1 and 2 tied
            const totalStaked = 1000n;
            const controlThreshold = 40; // 40%

            const result = await stakingLibraryWrapper.calculateControllingFaction(
                factionStakes,
                totalStaked,
                controlThreshold
            );

            expect(result[0]).to.equal(1); // controllingFaction = Faction 1 (first one)
            expect(result[1]).to.equal(40n); // controlPercentage = 40%
            expect(result[2]).to.be.true; // hasControl = true
        });
    });

    describe("evaluateContestedStatus", function () {
        it("should return not contested for zero total staked", async function () {
            const factionStakes = [0n, 0n, 0n, 0n]; // No stakes
            const totalStaked = 0n;
            const contestThreshold = 10; // 10%

            const result = await stakingLibraryWrapper.evaluateContestedStatus(
                factionStakes,
                totalStaked,
                contestThreshold
            );

            expect(result[0]).to.be.false; // isContested
            expect(result[1]).to.equal(0); // dominantFaction
            expect(result[2]).to.equal(0); // challengerFaction
        });

        it("should correctly identify contested territory when difference is below threshold", async function () {
            const factionStakes = [0n, 450n, 400n, 150n]; // Faction 1 and 2 are close
            const totalStaked = 1000n;
            const contestThreshold = 10; // 10%

            const result = await stakingLibraryWrapper.evaluateContestedStatus(
                factionStakes,
                totalStaked,
                contestThreshold
            );

            // 45% vs 40% = 5% difference, which is less than 10% threshold
            expect(result[0]).to.be.true; // isContested
            expect(result[1]).to.equal(1); // dominantFaction
            expect(result[2]).to.equal(2); // challengerFaction
        });

        it("should identify uncontested territory when difference is above threshold", async function () {
            const factionStakes = [0n, 600n, 300n, 100n]; // Faction 1 dominates
            const totalStaked = 1000n;
            const contestThreshold = 10; // 10%

            const result = await stakingLibraryWrapper.evaluateContestedStatus(
                factionStakes,
                totalStaked,
                contestThreshold
            );

            // 60% vs 30% = 30% difference, which is greater than 10% threshold
            // Dominant faction has more than 50%, so it should not be contested
            expect(result[0]).to.be.false; // isContested
            expect(result[1]).to.equal(1); // dominantFaction
            expect(result[2]).to.equal(2); // challengerFaction
        });

        it("should mark territory as contested if dominant faction has less than 50%", async function () {
            const factionStakes = [0n, 400n, 350n, 250n]; // Faction 1 has highest, but < 50%
            const totalStaked = 1000n;
            const contestThreshold = 20; // 20%

            const result = await stakingLibraryWrapper.evaluateContestedStatus(
                factionStakes,
                totalStaked,
                contestThreshold
            );

            // 40% vs 35% = 5% difference, which is less than 20% threshold
            // Additionally, dominant faction has less than 50%
            expect(result[0]).to.be.true; // isContested
            expect(result[1]).to.equal(1); // dominantFaction
            expect(result[2]).to.equal(2); // challengerFaction
        });
    });

    describe("calculateEmergencyWithdrawalPenalty", function () {
        it("should return zero penalty for completed stake period", async function () {
            const originalStakePeriod = SECONDS_IN_DAY * 30n; // 30 days
            const timeStaked = SECONDS_IN_DAY * 30n; // Fully staked

            const penalty = await stakingLibraryWrapper.calculateEmergencyWithdrawalPenalty(
                originalStakePeriod,
                timeStaked
            );

            expect(penalty).to.equal(0n);
        });

        it("should return maximum penalty for immediate withdrawal", async function () {
            const originalStakePeriod = SECONDS_IN_DAY * 30n; // 30 days
            const timeStaked = 0n; // Just staked

            const penalty = await stakingLibraryWrapper.calculateEmergencyWithdrawalPenalty(
                originalStakePeriod,
                timeStaked
            );

            // With 0 time staked, penalty should be MAX_PENALTY
            expect(penalty).to.equal(MAX_PENALTY);
        });

        it("should calculate linear penalty between min and max", async function () {
            const originalStakePeriod = SECONDS_IN_DAY * 30n; // 30 days
            const timeStaked = SECONDS_IN_DAY * 15n; // Half way through

            const penalty = await stakingLibraryWrapper.calculateEmergencyWithdrawalPenalty(
                originalStakePeriod,
                timeStaked
            );

            // Half way through, penalty should be halfway between MIN and MAX
            const expectedPenalty = MIN_PENALTY + (MAX_PENALTY - MIN_PENALTY) / 2n;

            // Allow for some rounding errors in Solidity calculations
            const tolerance = PRECISION / 1000n; // 0.1% precision
            expect(penalty).to.be.closeTo(expectedPenalty, tolerance);
        });

        it("should handle the case where time staked exceeds original period", async function () {
            const originalStakePeriod = SECONDS_IN_DAY * 30n; // 30 days
            const timeStaked = SECONDS_IN_DAY * 40n; // More than original period

            const penalty = await stakingLibraryWrapper.calculateEmergencyWithdrawalPenalty(
                originalStakePeriod,
                timeStaked
            );

            expect(penalty).to.equal(0n);
        });
    });

    describe("calculateStakePeriodMultiplier", function () {
        it("should return 1x multiplier for minimum stake period", async function () {
            const stakePeriod = MIN_STAKE_PERIOD;
            const factionBonus = 0n;

            const multiplier = await stakingLibraryWrapper.calculateStakePeriodMultiplier(
                stakePeriod,
                factionBonus
            );

            expect(multiplier).to.equal(PRECISION); // 1.0
        });

        it("should return 1x multiplier for below minimum stake period", async function () {
            const stakePeriod = MIN_STAKE_PERIOD - 1n; // Just below minimum
            const factionBonus = 0n;

            const multiplier = await stakingLibraryWrapper.calculateStakePeriodMultiplier(
                stakePeriod,
                factionBonus
            );

            expect(multiplier).to.equal(PRECISION); // 1.0
        });

        it("should calculate linear multiplier based on stake period", async function () {
            // Halfway between min and max stake periods
            const stakePeriod = MIN_STAKE_PERIOD + (MAX_STAKE_PERIOD - MIN_STAKE_PERIOD) / 2n;
            const factionBonus = 0n;

            const multiplier = await stakingLibraryWrapper.calculateStakePeriodMultiplier(
                stakePeriod,
                factionBonus
            );

            // Halfway through, multiplier should be approximately 1.5x
            const expectedMultiplier = PRECISION + (PRECISION / 2n);

            // Allow for some rounding errors due to integer division
            const tolerance = PRECISION / 100n; // 1% precision
            expect(multiplier).to.be.closeTo(expectedMultiplier, tolerance);
        });

        it("should cap at maximum stake period", async function () {
            const stakePeriod = MAX_STAKE_PERIOD * 2n; // Double the maximum
            const factionBonus = 0n;

            const multiplier = await stakingLibraryWrapper.calculateStakePeriodMultiplier(
                stakePeriod,
                factionBonus
            );

            // At or above max stake period, multiplier should be 2x
            const expectedMultiplier = PRECISION * 2n;

            expect(multiplier).to.equal(expectedMultiplier);
        });

        it("should apply faction bonus correctly", async function () {
            const stakePeriod = MAX_STAKE_PERIOD; // Max period for 2x base multiplier
            const factionBonus = 20n; // 20% faction bonus

            const multiplier = await stakingLibraryWrapper.calculateStakePeriodMultiplier(
                stakePeriod,
                factionBonus
            );

            // Base multiplier is 2x at MAX_STAKE_PERIOD
            // With 20% faction bonus: 2x * 1.2 = 2.4x
            const expectedMultiplier = (PRECISION * 2n * 120n) / 100n;

            expect(multiplier).to.equal(expectedMultiplier);
        });

        it("should cap the final multiplier at MAX_MULTIPLIER", async function () {
            const stakePeriod = MAX_STAKE_PERIOD; // Max period for 2x base multiplier
            const factionBonus = 100n; // 100% faction bonus (very high)

            const multiplier = await stakingLibraryWrapper.calculateStakePeriodMultiplier(
                stakePeriod,
                factionBonus
            );

            // Base multiplier is 2x at MAX_STAKE_PERIOD
            // With 100% faction bonus: 2x * 2 = 4x, but should be capped at 3x
            expect(multiplier).to.equal(PRECISION * 3n); // MAX_MULTIPLIER is 3x
        });
    });
});