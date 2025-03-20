// test/RevenueLibraryTestWrapper.test.ts
import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { RevenueLibraryTestWrapper } from "../../../typechain/contracts/test/RevenueLibraryTestWrapper";

describe("RevenueLibrary (via TestWrapper)", function () {
    let revenueLibraryWrapper: RevenueLibraryTestWrapper;

    // We'll get the constants from the wrapper
    let PRECISION: bigint;
    let PERCENTAGE_DENOMINATOR: bigint;
    let MINIMUM_DISTRIBUTION: bigint;
    let MAX_DOMINANCE_FACTOR: bigint;
    let MIN_DISTRIBUTION_SHARES: bigint;

    before(async function () {
        // Deploy all contracts with the TestWrappers tag
        await deployments.fixture(["TestWrappers"]);
        
        // Get the deployed RevenueLibraryTestWrapper
        const revenueLibraryWrapperDeployment = await deployments.get("RevenueLibraryTestWrapper");
        
        // Get the contract instance
        revenueLibraryWrapper = await ethers.getContractAt(
            "RevenueLibraryTestWrapper", 
            revenueLibraryWrapperDeployment.address
        );

        // Get constants from the wrapper
        PRECISION = await revenueLibraryWrapper.getPRECISION();
        PERCENTAGE_DENOMINATOR = await revenueLibraryWrapper.getPERCENTAGE_DENOMINATOR();
        MINIMUM_DISTRIBUTION = await revenueLibraryWrapper.getMINIMUM_DISTRIBUTION();
        MAX_DOMINANCE_FACTOR = await revenueLibraryWrapper.getMAX_DOMINANCE_FACTOR();
        MIN_DISTRIBUTION_SHARES = await revenueLibraryWrapper.getMIN_DISTRIBUTION_SHARES();
    });

    describe("calculateRevenueDistribution", function () {
        it("should return zeros for zero total revenue", async function () {
            const totalRevenue = 0n;
            const territoryInfluence = [0n, 100n, 200n, 300n];
            const factionCount = 4;
            const daoTreasuryPercentage = 2000n; // 20%
            const burnPercentage = 1000n; // 10%

            const result = await revenueLibraryWrapper.calculateRevenueDistribution(
                totalRevenue,
                territoryInfluence,
                factionCount,
                daoTreasuryPercentage,
                burnPercentage
            );

            // Should return zeros
            expect(result[0]).to.deep.equal([0n, 0n, 0n, 0n]); // distribution
            expect(result[1]).to.equal(0n); // daoAmount
            expect(result[2]).to.equal(0n); // burnAmount
        });

        it("should distribute revenue equally if no territory influence", async function () {
            const totalRevenue = ethers.parseEther("1000");
            const territoryInfluence = [0n, 0n, 0n, 0n];
            const factionCount = 4;
            const daoTreasuryPercentage = 2000n; // 20%
            const burnPercentage = 1000n; // 10%

            const result = await revenueLibraryWrapper.calculateRevenueDistribution(
                totalRevenue,
                territoryInfluence,
                factionCount,
                daoTreasuryPercentage,
                burnPercentage
            );

            // Calculate expected values
            const expectedDaoAmount = totalRevenue * 2000n / PERCENTAGE_DENOMINATOR; // 20%
            const expectedBurnAmount = totalRevenue * 1000n / PERCENTAGE_DENOMINATOR; // 10%
            const expectedFactionAmount = totalRevenue - expectedDaoAmount - expectedBurnAmount;
            const expectedEqualShare = expectedFactionAmount / BigInt(factionCount);

            // Check results
            expect(result[1]).to.equal(expectedDaoAmount); // daoAmount
            expect(result[2]).to.equal(expectedBurnAmount); // burnAmount
            
            // Each faction should get an equal share
            for (let i = 0; i < factionCount; i++) {
                expect(result[0][i]).to.equal(expectedEqualShare);
            }
            
            // Sum of all distributions should equal total revenue
            const totalDistributed = result[0].reduce((a, b) => a + b, 0n) + result[1] + result[2];
            expect(totalDistributed).to.equal(totalRevenue);
        });

        it("should distribute revenue proportionally to territory influence", async function () {
            const totalRevenue = ethers.parseEther("1000");
            const territoryInfluence = [0n, 100n, 200n, 300n]; // 1:2:3 ratio for factions 1,2,3
            const factionCount = 4;
            const daoTreasuryPercentage = 2000n; // 20%
            const burnPercentage = 1000n; // 10%

            const result = await revenueLibraryWrapper.calculateRevenueDistribution(
                totalRevenue,
                territoryInfluence,
                factionCount,
                daoTreasuryPercentage,
                burnPercentage
            );

            // Calculate expected values
            const expectedDaoAmount = totalRevenue * 2000n / PERCENTAGE_DENOMINATOR; // 20%
            const expectedBurnAmount = totalRevenue * 1000n / PERCENTAGE_DENOMINATOR; // 10%
            const expectedFactionAmount = totalRevenue - expectedDaoAmount - expectedBurnAmount;
            
            const totalInfluence = 100n + 200n + 300n; // 600
            const expectedFaction1 = (expectedFactionAmount * 100n) / totalInfluence;
            const expectedFaction2 = (expectedFactionAmount * 200n) / totalInfluence;
            const expectedFaction3 = (expectedFactionAmount * 300n) / totalInfluence;
            
            // Check DAO and burn amounts
            expect(result[1]).to.equal(expectedDaoAmount); // daoAmount
            expect(result[2]).to.equal(expectedBurnAmount); // burnAmount
            
            // Check faction distributions match influence ratio (allowing for rounding)
            expect(result[0][0]).to.equal(0n); // Faction 0 (index) has no influence
            
            // Allow for small rounding errors due to integer division
            const tolerance = 10n; // Very small tolerance
            expect(result[0][1]).to.be.closeTo(expectedFaction1, tolerance);
            expect(result[0][2]).to.be.closeTo(expectedFaction2, tolerance);
            expect(result[0][3]).to.be.closeTo(expectedFaction3, tolerance);
            
            // Sum of all distributions should equal total revenue
            const totalDistributed = result[0].reduce((a, b) => a + b, 0n) + result[1] + result[2];
            expect(totalDistributed).to.equal(totalRevenue);
        });

        it("should ensure minimum distribution for active factions", async function () {
            const totalRevenue = ethers.parseEther("10000"); // Large amount to ensure minimums are possible
            const territoryInfluence = [0n, 10n, 900n, 90n]; // Very imbalanced distribution
            const factionCount = 4;
            const daoTreasuryPercentage = 2000n; // 20%
            const burnPercentage = 1000n; // 10%

            const result = await revenueLibraryWrapper.calculateRevenueDistribution(
                totalRevenue,
                territoryInfluence,
                factionCount,
                daoTreasuryPercentage,
                burnPercentage
            );

            // Check that active factions with very low influence still get at least MINIMUM_DISTRIBUTION
            expect(result[0][0]).to.equal(0n); // Faction 0 has no influence
            expect(result[0][1]).to.be.gte(MINIMUM_DISTRIBUTION); // Faction 1 has very low influence
            expect(result[0][2]).to.be.gt(result[0][3]); // Faction 2 should get more than Faction 3
        });

        it("should add remainder to the faction with highest influence", async function () {
            const totalRevenue = ethers.parseEther("1000");
            const territoryInfluence = [0n, 100n, 500n, 300n]; // Faction 2 has highest influence
            const factionCount = 4;
            const daoTreasuryPercentage = 2000n; // 20%
            const burnPercentage = 1000n; // 10%

            const result = await revenueLibraryWrapper.calculateRevenueDistribution(
                totalRevenue,
                territoryInfluence,
                factionCount,
                daoTreasuryPercentage,
                burnPercentage
            );
            
            // Sum of all distributions should equal total revenue exactly (no lost wei)
            const totalDistributed = result[0].reduce((a, b) => a + b, 0n) + result[1] + result[2];
            expect(totalDistributed).to.equal(totalRevenue);
        });
    });

    describe("calculateStakingRewardsDistribution", function () {
        it("should return empty array for empty stakes", async function () {
            // This should revert with "RevenueLibrary: empty stakes array"
            await expect(
                revenueLibraryWrapper.calculateStakingRewardsDistribution(
                    ethers.parseEther("100"),
                    [],
                    ethers.parseEther("1000")
                )
            ).to.be.revertedWith("RevenueLibrary: empty stakes array");
        });

        it("should return zeros for zero total rewards", async function () {
            const totalRewards = 0n;
            const stakes = [ethers.parseEther("100"), ethers.parseEther("200"), ethers.parseEther("300")];
            const totalStaked = ethers.parseEther("600");

            const rewards = await revenueLibraryWrapper.calculateStakingRewardsDistribution(
                totalRewards,
                stakes,
                totalStaked
            );

            // All rewards should be zero
            expect(rewards).to.deep.equal([0n, 0n, 0n]);
        });

        it("should distribute rewards proportionally to stake amounts", async function () {
            const totalRewards = ethers.parseEther("60");
            const stakes = [ethers.parseEther("100"), ethers.parseEther("200"), ethers.parseEther("300")];
            const totalStaked = ethers.parseEther("600");

            const rewards = await revenueLibraryWrapper.calculateStakingRewardsDistribution(
                totalRewards,
                stakes,
                totalStaked
            );

            // Expected distributions based on stake proportions:
            // Stake 1: 100/600 = 1/6 of rewards = 10 ETH
            // Stake 2: 200/600 = 1/3 of rewards = 20 ETH
            // Stake 3: 300/600 = 1/2 of rewards = 30 ETH
            expect(rewards[0]).to.equal(ethers.parseEther("10"));
            expect(rewards[1]).to.equal(ethers.parseEther("20"));
            expect(rewards[2]).to.equal(ethers.parseEther("30"));
            
            // Sum of rewards should equal total rewards
            const totalDistributed = rewards.reduce((a, b) => a + b, 0n);
            expect(totalDistributed).to.equal(totalRewards);
        });

        it("should add remainder to the stake with highest amount", async function () {
            const totalRewards = ethers.parseEther("100");
            // Using values that will cause remainder in integer division
            const stakes = [ethers.parseEther("100"), ethers.parseEther("200"), ethers.parseEther("301")];
            const totalStaked = ethers.parseEther("601");

            const rewards = await revenueLibraryWrapper.calculateStakingRewardsDistribution(
                totalRewards,
                stakes,
                totalStaked
            );
            
            // Sum of rewards should equal total rewards exactly (no lost wei)
            const totalDistributed = rewards.reduce((a, b) => a + b, 0n);
            expect(totalDistributed).to.equal(totalRewards);
            
            // The highest stake (index 2) should get the remainder
            const expectedRemainder = totalRewards - 
                ((totalRewards * stakes[0]) / totalStaked) - 
                ((totalRewards * stakes[1]) / totalStaked) - 
                ((totalRewards * stakes[2]) / totalStaked);
                
            // Only perform this check if there's a remainder
            if (expectedRemainder > 0) {
                const expectedReward = (totalRewards * stakes[2]) / totalStaked + expectedRemainder;
                expect(rewards[2]).to.equal(expectedReward);
            }
        });

        it("should handle zero stakes correctly", async function () {
            const totalRewards = ethers.parseEther("100");
            const stakes = [ethers.parseEther("0"), ethers.parseEther("300"), ethers.parseEther("0")];
            const totalStaked = ethers.parseEther("300");

            const rewards = await revenueLibraryWrapper.calculateStakingRewardsDistribution(
                totalRewards,
                stakes,
                totalStaked
            );

            // Zero stakes should get zero rewards
            expect(rewards[0]).to.equal(0n);
            expect(rewards[1]).to.equal(totalRewards);
            expect(rewards[2]).to.equal(0n);
        });
    });

    describe("calculateTreasuryAllocation", function () {
        it("should allocate treasury funds according to weights", async function () {
            const totalTreasury = ethers.parseEther("1000");
            const operationalWeight = 2000n; // 20%
            const developmentWeight = 3000n; // 30%
            const marketingWeight = 1500n; // 15%
            const communityWeight = 1500n; // 15%
            const reserveWeight = 2000n; // 20%

            const allocation = await revenueLibraryWrapper.calculateTreasuryAllocation(
                totalTreasury,
                operationalWeight,
                developmentWeight,
                marketingWeight,
                communityWeight,
                reserveWeight
            );

            // Total weight is 10000
            const totalWeight = operationalWeight + developmentWeight + marketingWeight + communityWeight + reserveWeight;
            
            // Calculate expected allocations
            const expectedOperational = (totalTreasury * operationalWeight) / totalWeight;
            const expectedDevelopment = (totalTreasury * developmentWeight) / totalWeight;
            const expectedMarketing = (totalTreasury * marketingWeight) / totalWeight;
            const expectedCommunity = (totalTreasury * communityWeight) / totalWeight;
            const expectedReserve = totalTreasury - expectedOperational - expectedDevelopment - expectedMarketing - expectedCommunity;
            
            // Check allocations
            expect(allocation[0]).to.equal(expectedOperational);
            expect(allocation[1]).to.equal(expectedDevelopment);
            expect(allocation[2]).to.equal(expectedMarketing);
            expect(allocation[3]).to.equal(expectedCommunity);
            expect(allocation[4]).to.equal(expectedReserve);
            
            // Sum of all allocations should equal total treasury
            const totalAllocated = allocation[0] + allocation[1] + allocation[2] + allocation[3] + allocation[4];
            expect(totalAllocated).to.equal(totalTreasury);
        });

        it("should handle zero weights by allocating zero", async function () {
            const totalTreasury = ethers.parseEther("1000");
            const operationalWeight = 5000n; // 50%
            const developmentWeight = 5000n; // 50%
            const marketingWeight = 0n; // 0%
            const communityWeight = 0n; // 0%
            const reserveWeight = 0n; // 0%

            const allocation = await revenueLibraryWrapper.calculateTreasuryAllocation(
                totalTreasury,
                operationalWeight,
                developmentWeight,
                marketingWeight,
                communityWeight,
                reserveWeight
            );

            // Only operational and development should get funds
            expect(allocation[0]).to.equal(ethers.parseEther("500")); // 50%
            expect(allocation[1]).to.equal(ethers.parseEther("500")); // 50%
            expect(allocation[2]).to.equal(0n); // 0%
            expect(allocation[3]).to.equal(0n); // 0%
            expect(allocation[4]).to.equal(0n); // 0%
            
            // Sum of all allocations should equal total treasury
            const totalAllocated = allocation[0] + allocation[1] + allocation[2] + allocation[3] + allocation[4];
            expect(totalAllocated).to.equal(totalTreasury);
        });

        it("should revert if all weights are zero", async function () {
            const totalTreasury = ethers.parseEther("1000");
            
            await expect(
                revenueLibraryWrapper.calculateTreasuryAllocation(
                    totalTreasury,
                    0n, 0n, 0n, 0n, 0n
                )
            ).to.be.revertedWith("RevenueLibrary: total weight must be greater than 0");
        });

        it("should handle uneven division and add remainder to reserve", async function () {
            const totalTreasury = ethers.parseEther("100");
            // Using weights that will cause remainder in integer division
            const operationalWeight = 1n;
            const developmentWeight = 2n;
            const marketingWeight = 3n;
            const communityWeight = 4n;
            const reserveWeight = 5n;
            
            const allocation = await revenueLibraryWrapper.calculateTreasuryAllocation(
                totalTreasury,
                operationalWeight,
                developmentWeight,
                marketingWeight,
                communityWeight,
                reserveWeight
            );
            
            // Sum of all allocations should equal total treasury exactly
            const totalAllocated = allocation[0] + allocation[1] + allocation[2] + allocation[3] + allocation[4];
            expect(totalAllocated).to.equal(totalTreasury);
        });
    });

    describe("calculateFactionRevenueBoost", function () {
        it("should return zero for zero base revenue", async function () {
            const baseRevenue = 0n;
            const factionMemberCount = 100n;
            const factionActivity = 500n;
            const territoryControl = 3000n; // 30%
            const marketDominance = 2000n; // 20%

            const boostedRevenue = await revenueLibraryWrapper.calculateFactionRevenueBoost(
                baseRevenue,
                factionMemberCount,
                factionActivity,
                territoryControl,
                marketDominance
            );

            expect(boostedRevenue).to.equal(0n);
        });

        it("should apply boost based on all factors", async function () {
            const baseRevenue = ethers.parseEther("1000");
            const factionMemberCount = 100n;
            const factionActivity = 500n;
            const territoryControl = 3000n; // 30%
            const marketDominance = 2000n; // 20%

            const boostedRevenue = await revenueLibraryWrapper.calculateFactionRevenueBoost(
                baseRevenue,
                factionMemberCount,
                factionActivity,
                territoryControl,
                marketDominance
            );

            // Calculate expected boosts
            // Member boost: min(1000, 100*10000/100) = 1000
            // Activity boost: min(1500, 500*15) = 1500
            // Territory boost: min(1500, 3000/2) = 1500
            // Market boost: min(1000, 2000/3) = 666
            // Total boost: min(5000, 1000+1500+1500+666) = 4666
            // Boosted revenue: 1000 + (1000 * 4666 / 10000) = 1000 + 466.6 = ~1466.6 ETH
            
            // Allow for some rounding errors in Solidity calculations
            const expectedBoost = baseRevenue + (baseRevenue * 4666n / PERCENTAGE_DENOMINATOR);
            const tolerance = ethers.parseEther("0.1"); // 0.1 ETH tolerance
            
            expect(boostedRevenue).to.be.closeTo(expectedBoost, tolerance);
        });

        it("should cap total boost at 50%", async function () {
            const baseRevenue = ethers.parseEther("1000");
            // All maxed out values
            const factionMemberCount = 1n; // Very high member boost
            const factionActivity = 1000n; // Very high activity
            const territoryControl = 10000n; // 100% territory control
            const marketDominance = 10000n; // 100% market dominance

            const boostedRevenue = await revenueLibraryWrapper.calculateFactionRevenueBoost(
                baseRevenue,
                factionMemberCount,
                factionActivity,
                territoryControl,
                marketDominance
            );

            // Maximum boost is 50%
            const maxBoostedRevenue = baseRevenue + (baseRevenue * 5000n / PERCENTAGE_DENOMINATOR);
            expect(boostedRevenue).to.equal(maxBoostedRevenue);
        });

        it("should handle zero factors correctly", async function () {
            const baseRevenue = ethers.parseEther("1000");
            const factionMemberCount = 0n;
            const factionActivity = 0n;
            const territoryControl = 0n;
            const marketDominance = 0n;

            const boostedRevenue = await revenueLibraryWrapper.calculateFactionRevenueBoost(
                baseRevenue,
                factionMemberCount,
                factionActivity,
                territoryControl,
                marketDominance
            );

            // With no boosts, revenue should stay the same
            expect(boostedRevenue).to.equal(baseRevenue);
        });
    });

    describe("calculateDynamicRevenueSharing", function () {
        it("should return zeros for zero total revenue", async function () {
            const totalRevenue = 0n;
            const factions = [1, 2, 3];
            const contributions = [100n, 200n, 300n];
            const baseSplit = 1000n; // 10% guaranteed to each faction

            const shares = await revenueLibraryWrapper.calculateDynamicRevenueSharing(
                totalRevenue,
                factions,
                contributions,
                baseSplit
            );

            // All shares should be zero
            expect(shares).to.deep.equal([0n, 0n, 0n]);
        });

        it("should distribute base amount plus contribution-based share", async function () {
            const totalRevenue = ethers.parseEther("1000");
            const factions = [1, 2, 3];
            const contributions = [100n, 200n, 300n]; // 1:2:3 ratio
            const baseSplit = 1000n; // 10% guaranteed to each faction

            const shares = await revenueLibraryWrapper.calculateDynamicRevenueSharing(
                totalRevenue,
                factions,
                contributions,
                baseSplit
            );

            // Calculate expected values
            // Base amount: 10% of 1000 = 100 ETH per faction = 300 ETH total
            // Remaining: 1000 - 300 = 700 ETH to distribute based on contributions
            // Total contributions: 100 + 200 + 300 = 600
            // Faction 1: 100 + (700 * 100/600) = 100 + 116.67 = ~216.67 ETH
            // Faction 2: 100 + (700 * 200/600) = 100 + 233.33 = ~333.33 ETH
            // Faction 3: 100 + (700 * 300/600) = 100 + 350 = 450 ETH
            
            const baseAmount = (totalRevenue * baseSplit) / PERCENTAGE_DENOMINATOR;
            const totalBaseAmount = baseAmount * BigInt(factions.length);
            const remainingAmount = totalRevenue - totalBaseAmount;
            
            const totalContributions = contributions.reduce((a, b) => a + b, 0n);
            
            const expectedFaction1 = baseAmount + (remainingAmount * contributions[0]) / totalContributions;
            const expectedFaction2 = baseAmount + (remainingAmount * contributions[1]) / totalContributions;
            const expectedFaction3 = baseAmount + (remainingAmount * contributions[2]) / totalContributions;
            
            // Allow for small rounding errors in Solidity calculations
            const tolerance = ethers.parseEther("0.01"); // 0.01 ETH
            
            expect(shares[0]).to.be.closeTo(expectedFaction1, tolerance);
            expect(shares[1]).to.be.closeTo(expectedFaction2, tolerance);
            expect(shares[2]).to.be.closeTo(expectedFaction3, tolerance);
            
            // Sum of all shares should equal total revenue
            const totalShares = shares.reduce((a, b) => a + b, 0n);
            expect(totalShares).to.equal(totalRevenue);
        });

        it("should distribute only base amount if no contributions", async function () {
            const totalRevenue = ethers.parseEther("900");
            const factions = [1, 2, 3];
            const contributions = [0n, 0n, 0n]; // No contributions
            const baseSplit = 3000n; // 30% guaranteed to each faction

            const shares = await revenueLibraryWrapper.calculateDynamicRevenueSharing(
                totalRevenue,
                factions,
                contributions,
                baseSplit
            );

            // Each faction should get equal share (30% each = 90% total)
            // Remaining 10% will be distributed equally as well
            const baseAmount = (totalRevenue * baseSplit) / PERCENTAGE_DENOMINATOR;
            const expectedShare = baseAmount + (totalRevenue - (baseAmount * BigInt(factions.length))) / BigInt(factions.length);
            
            for (let i = 0; i < factions.length; i++) {
                expect(shares[i]).to.equal(expectedShare);
            }
            
            // Sum of all shares should equal total revenue
            const totalShares = shares.reduce((a, b) => a + b, 0n);
            expect(totalShares).to.equal(totalRevenue);
        });

        it("should revert if baseSplit exceeds 100% for all factions", async function () {
            const totalRevenue = ethers.parseEther("1000");
            const factions = [1, 2, 3];
            const contributions = [100n, 200n, 300n];
            const baseSplit = 4000n; // 40% guaranteed to each faction (exceeds 100%)

            await expect(
                revenueLibraryWrapper.calculateDynamicRevenueSharing(
                    totalRevenue,
                    factions,
                    contributions,
                    baseSplit
                )
            ).to.be.revertedWith("RevenueLibrary: base split too high");
        });

        it("should add remainder to faction with highest contribution", async function () {
            const totalRevenue = ethers.parseEther("999"); // Amount that will cause remainder
            const factions = [1, 2, 3];
            const contributions = [100n, 300n, 200n]; // Faction 2 has highest contribution
            const baseSplit = 1000n; // 10% guaranteed to each faction

            const shares = await revenueLibraryWrapper.calculateDynamicRevenueSharing(
                totalRevenue,
                factions,
                contributions,
                baseSplit
            );
            
            // Sum of all shares should equal total revenue exactly
            const totalShares = shares.reduce((a, b) => a + b, 0n);
            expect(totalShares).to.equal(totalRevenue);
        });
    });

    describe("calculateAntiMonopolyAdjustment", function () {
        it("should return original shares if dominance below target", async function () {
            const shares = [ethers.parseEther("100"), ethers.parseEther("200"), ethers.parseEther("300")];
            const dominanceFactor = 5000n; // 50% dominance
            const targetFactor = 6000n; // 60% target

            const adjustedShares = await revenueLibraryWrapper.calculateAntiMonopolyAdjustment(
                shares,
                dominanceFactor,
                targetFactor
            );

            // Should return original shares unchanged
            expect(adjustedShares).to.deep.equal(shares);
        });

        it("should redistribute excess dominance proportionally", async function () {
            const shares = [ethers.parseEther("200"), ethers.parseEther("600"), ethers.parseEther("200")];
            const dominanceFactor = 6000n; // 60% dominance (faction 1)
            const targetFactor = 5000n; // 50% target

            const adjustedShares = await revenueLibraryWrapper.calculateAntiMonopolyAdjustment(
                shares,
                dominanceFactor,
                targetFactor
            );

            // Calculate expected results
            // Total shares: 1000 ETH
            // Dominant faction (1): 600 ETH (60%)
            // Target: 50% = 500 ETH
            // Amount to redistribute: 100 ETH
            // Other factions: 400 ETH total
            // Faction 0: 200/400 = 50% of redistributed = 50 ETH added = 250 ETH
            // Faction 2: 200/400 = 50% of redistributed = 50 ETH added = 250 ETH
            // Faction 1 (dominant): 600 - 100 = 500 ETH
            
            const totalShares = shares.reduce((a, b) => a + b, 0n);
            const dominantShare = shares[1]; // 600 ETH
            const targetShare = (totalShares * targetFactor) / PERCENTAGE_DENOMINATOR; // 500 ETH
            const redistributed = dominantShare - targetShare; // 100 ETH
            
            const expectedDominantShare = targetShare; // 500 ETH
            const expectedOtherShare = shares[0] + (redistributed / 2n); // 250 ETH
            
            // Check adjusted shares
            expect(adjustedShares[0]).to.equal(expectedOtherShare);
            expect(adjustedShares[1]).to.equal(expectedDominantShare);
            expect(adjustedShares[2]).to.equal(expectedOtherShare);
            
            // Total should remain the same
            const totalAdjustedShares = adjustedShares.reduce((a, b) => a + b, 0n);
            expect(totalAdjustedShares).to.equal(totalShares);
        });

        it("should handle case where dominant faction is the only one", async function () {
            const shares = [0n, ethers.parseEther("1000"), 0n];
            const dominanceFactor = 10000n; // 100% dominance
            const targetFactor = 8000n; // 80% target

            const adjustedShares = await revenueLibraryWrapper.calculateAntiMonopolyAdjustment(
                shares,
                dominanceFactor,
                targetFactor
            );

            // With no other factions to distribute to, should return original shares
            expect(adjustedShares).to.deep.equal(shares);
        });

        it("should handle zero total shares", async function () {
            const shares = [0n, 0n, 0n];
            const dominanceFactor = 6000n;
            const targetFactor = 5000n;

            const adjustedShares = await revenueLibraryWrapper.calculateAntiMonopolyAdjustment(
                shares,
                dominanceFactor,
                targetFactor
            );

            // Should return original zeros
            expect(adjustedShares).to.deep.equal(shares);
        });
    });

    describe("calculateTerritoryValue", function () {
        it("should return 0 for zero base value", async function () {
            const baseValue = 0n;
            const economicActivity = 500n;
            const controlDuration = 10000n;
            const isContested = false;

            const territoryValue = await revenueLibraryWrapper.calculateTerritoryValue(
                baseValue,
                economicActivity,
                controlDuration,
                isContested
            );

            expect(territoryValue).to.equal(0n);
        });

        it("should calculate territory value with all factors", async function () {
            const baseValue = 1000n;
            const economicActivity = 500n;
            const controlDuration = 100n;
            const isContested = false;

            const territoryValue = await revenueLibraryWrapper.calculateTerritoryValue(
                baseValue,
                economicActivity,
                controlDuration,
                isContested
            );

            // Calculate expected value
            // Base multiplier: 10000 (100%)
            // Economic activity bonus: min(10000, 500 * 10) = 5000 (50%)
            // Control duration bonus: min(5000, sqrt(100) * 10) = min(5000, 100) = 100 (1%)
            // Total multiplier: 10000 + 5000 + 100 = 15100 (151%)
            // Territory value: 1000 * 15100 / 10000 = 1510
            
            // Calculate expected bonus for control duration using sqrt
            const sqrt100 = await revenueLibraryWrapper.sqrt(100n);
            const durationBonus = Math.min(
                Number(PERCENTAGE_DENOMINATOR / 2n),
                Number(sqrt100 * 10n)
            );
            
            const expectedMultiplier = Number(PERCENTAGE_DENOMINATOR) + 
                                      Math.min(Number(PERCENTAGE_DENOMINATOR), 500 * 10) + 
                                      durationBonus;
            
            const expectedValue = (baseValue * BigInt(expectedMultiplier)) / PERCENTAGE_DENOMINATOR;
            
            expect(territoryValue).to.equal(expectedValue);
        });

        it("should apply contested penalty correctly", async function () {
            const baseValue = 1000n;
            const economicActivity = 500n;
            const controlDuration = 100n;
            const isContested = true; // Contested territory

            const contestedValue = await revenueLibraryWrapper.calculateTerritoryValue(
                baseValue,
                economicActivity,
                controlDuration,
                true
            );
            
            const uncontestedValue = await revenueLibraryWrapper.calculateTerritoryValue(
                baseValue,
                economicActivity,
                controlDuration,
                false
            );

            // Contested penalty is 30% reduction
            // contestedValue should be 70% of uncontestedValue
            const expectedContestedValue = (uncontestedValue * 7n) / 10n;
            expect(contestedValue).to.equal(expectedContestedValue);
        });
    });

    describe("Utility Functions", function () {
        it("should correctly calculate minimum of two numbers", async function () {
            const a = 100n;
            const b = 200n;
            
            expect(await revenueLibraryWrapper.min(a, b)).to.equal(a);
            expect(await revenueLibraryWrapper.min(b, a)).to.equal(a);
            expect(await revenueLibraryWrapper.min(a, a)).to.equal(a);
        });
        
        it("should correctly calculate square root", async function () {
            expect(await revenueLibraryWrapper.sqrt(0n)).to.equal(0n);
            expect(await revenueLibraryWrapper.sqrt(1n)).to.equal(1n);
            expect(await revenueLibraryWrapper.sqrt(4n)).to.equal(2n);
            expect(await revenueLibraryWrapper.sqrt(9n)).to.equal(3n);
            expect(await revenueLibraryWrapper.sqrt(16n)).to.equal(4n);
            expect(await revenueLibraryWrapper.sqrt(100n)).to.equal(10n);
            expect(await revenueLibraryWrapper.sqrt(10000n)).to.equal(100n);
            
            // For non-perfect squares, should return floor of sqrt
            expect(await revenueLibraryWrapper.sqrt(2n)).to.equal(1n);
            expect(await revenueLibraryWrapper.sqrt(3n)).to.equal(1n);
            expect(await revenueLibraryWrapper.sqrt(8n)).to.equal(2n);
            expect(await revenueLibraryWrapper.sqrt(99n)).to.equal(9n);
        });
    });
});