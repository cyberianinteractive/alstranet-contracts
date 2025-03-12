// test/unit/libraries/FactionLibrary.test.ts
import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { FactionLibraryTestWrapper } from "../../../typechain/contracts/test/FactionLibraryTestWrapper";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("FactionLibrary (via TestWrapper)", function () {
    let factionLibraryWrapper: FactionLibraryTestWrapper;
    
    // Constants we'll retrieve from the wrapper
    let NO_FACTION: bigint;
    let LAW_ENFORCEMENT: bigint;
    let CRIMINAL_SYNDICATE: bigint;
    let VIGILANTE: bigint; 
    let FACTION_COUNT: bigint;
    let MIN_RANK: bigint;
    let MAX_RANK: bigint;
    let ACTION_MISSION_COMPLETE: bigint;
    let ACTION_TERRITORY_CONTROL: bigint;
    let ACTION_CRIMINAL_ACTIVITY: bigint;
    let ACTION_LAW_ENFORCEMENT: bigint;
    let ACTION_COMMUNITY_SERVICE: bigint;
    let ACTION_BETRAYAL: bigint;
    let ACTION_FACTION_SUPPORT: bigint;

    before(async function () {
        // Deploy all contracts with the TestWrappers tag
        await deployments.fixture(["TestWrappers"]);
        
        // Get the deployed FactionLibraryTestWrapper
        const factionLibraryWrapperDeployment = await deployments.get("FactionLibraryTestWrapper");
        
        // Get the contract instance
        factionLibraryWrapper = await ethers.getContractAt(
            "FactionLibraryTestWrapper", 
            factionLibraryWrapperDeployment.address
        );

        // Get constants from the wrapper contract
        const factionConstants = await factionLibraryWrapper.getFactionConstants();
        NO_FACTION = factionConstants[0];
        LAW_ENFORCEMENT = factionConstants[1];
        CRIMINAL_SYNDICATE = factionConstants[2];
        VIGILANTE = factionConstants[3];
        FACTION_COUNT = factionConstants[4];
        
        const rankConstants = await factionLibraryWrapper.getRankConstants();
        MIN_RANK = rankConstants[0];
        MAX_RANK = rankConstants[1];
        
        const actionTypeConstants = await factionLibraryWrapper.getActionTypeConstants();
        ACTION_MISSION_COMPLETE = actionTypeConstants[0];
        ACTION_TERRITORY_CONTROL = actionTypeConstants[1];
        ACTION_CRIMINAL_ACTIVITY = actionTypeConstants[2];
        ACTION_LAW_ENFORCEMENT = actionTypeConstants[3];
        ACTION_COMMUNITY_SERVICE = actionTypeConstants[4];
        ACTION_BETRAYAL = actionTypeConstants[5];
        ACTION_FACTION_SUPPORT = actionTypeConstants[6];
    });

    describe("Reputation Change Calculation", function () {
        it("should calculate positive reputation change correctly", async function () {
            const actionValue = 100n;
            const currentReputation = 500n;

            const newReputation = await factionLibraryWrapper.calculateReputationChange(
                ACTION_MISSION_COMPLETE,
                actionValue,
                currentReputation,
                LAW_ENFORCEMENT
            );

            // Mission complete has 10x multiplier: 100 * 10 = 1000
            // New reputation: 500 + 1000 = 1500
            expect(newReputation).to.equal(1500n);
        });

        it("should calculate negative reputation change correctly", async function () {
            const actionValue = 100n;
            const currentReputation = 2000n;

            const newReputation = await factionLibraryWrapper.calculateReputationChange(
                ACTION_CRIMINAL_ACTIVITY,
                actionValue,
                currentReputation,
                LAW_ENFORCEMENT
            );

            // Criminal activity is negative for Law Enforcement with 15x multiplier: 100 * 15 = 1500
            // New reputation: 2000 - 1500 = 500
            expect(newReputation).to.equal(500n);
        });

        it("should handle different faction-specific reputation changes", async function () {
            const actionValue = 100n;

            // Test for Law Enforcement faction
            const reputationLaw = await factionLibraryWrapper.calculateReputationChange(
                ACTION_LAW_ENFORCEMENT,
                actionValue,
                1000n,
                LAW_ENFORCEMENT
            );

            // Test for Criminal faction
            const reputationCriminal = await factionLibraryWrapper.calculateReputationChange(
                ACTION_LAW_ENFORCEMENT,
                actionValue,
                1000n,
                CRIMINAL_SYNDICATE
            );

            // Law Enforcement action gives 20x multiplier to Law Enforcement: 100 * 20 = 2000
            // New reputation: 1000 + 2000 = 3000
            expect(reputationLaw).to.equal(3000n);

            // Law Enforcement action is negative for Criminal with 15x multiplier: 100 * 15 = 1500
            // New reputation: 1000 - 1500 = 0 (clipped at 0 to prevent underflow)
            expect(reputationCriminal).to.equal(0n);
        });

        it("should prevent underflow for large negative changes", async function () {
            const actionValue = 1000n;
            const currentReputation = 500n;

            const newReputation = await factionLibraryWrapper.calculateReputationChange(
                ACTION_BETRAYAL,
                actionValue,
                currentReputation,
                VIGILANTE
            );

            // Betrayal has 25x multiplier and is always negative: 1000 * 25 = 25000
            // 25000 > 500, so result should be capped at 0
            expect(newReputation).to.equal(0n);
        });
    });

    describe("Rank Eligibility", function () {
        it("should determine eligibility for promotion correctly", async function () {
            const currentRank = 3n;
            const reputation = 2000n;
            const memberSince = BigInt(await time.latest()) - (60n * 60n * 24n * 30n); // 30 days ago
            const actionsCompleted = 25n;

            const [isEligible, newRank] = await factionLibraryWrapper.checkRankEligibility(
                currentRank,
                reputation,
                memberSince,
                actionsCompleted,
                LAW_ENFORCEMENT
            );

            expect(isEligible).to.be.true;
            expect(newRank).to.equal(4n);
        });

        it("should return false when promotion requirements are not met", async function () {
            const currentRank = 3n;
            const reputation = 100n; // Too low for rank 4
            const memberSince = BigInt(await time.latest()) - (60n * 60n * 24n * 10n); // Only 10 days ago
            const actionsCompleted = 5n; // Too few actions

            const [isEligible, newRank] = await factionLibraryWrapper.checkRankEligibility(
                currentRank,
                reputation,
                memberSince,
                actionsCompleted,
                LAW_ENFORCEMENT
            );

            expect(isEligible).to.be.false;
            expect(newRank).to.equal(3n); // Stays at current rank
        });

        it("should not promote beyond max rank", async function () {
            const reputation = 100000n; // Very high reputation
            const memberSince = BigInt(await time.latest()) - (60n * 60n * 24n * 365n); // 1 year ago
            const actionsCompleted = 100n; // Many actions

            const [isEligible, newRank] = await factionLibraryWrapper.checkRankEligibility(
                MAX_RANK,
                reputation,
                memberSince,
                actionsCompleted,
                LAW_ENFORCEMENT
            );

            expect(isEligible).to.be.false;
            expect(newRank).to.equal(MAX_RANK); // Stays at max rank
        });

        it("should apply different requirements for different factions", async function () {
            // Set up test scenario where parameters are:
            // Just enough for Criminal Syndicate rank 3
            // Not enough for Law Enforcement rank 3
            const currentRank = 2n;
            const reputation = 810n; // Exactly meets Criminal Syndicate requirements
            const memberSince = BigInt(await time.latest()) - (60n * 60n * 24n * 45n); // 45 days ago (more time)
            const actionsCompleted = 18n; // Matches Criminal Syndicate action requirements
        
            // Check for Criminal Syndicate
            const [isEligibleCriminal, newRankCriminal] = await factionLibraryWrapper.checkRankEligibility(
                currentRank,
                reputation,
                memberSince,
                actionsCompleted,
                CRIMINAL_SYNDICATE
            );
        
            // Check for Law Enforcement
            const [isEligibleLaw, newRankLaw] = await factionLibraryWrapper.checkRankEligibility(
                currentRank,
                reputation,
                memberSince,
                actionsCompleted,
                LAW_ENFORCEMENT
            );
        
            // Get detailed requirements for logging/debugging
            const criminalRequirements = await factionLibraryWrapper.getRankRequirements(3n, CRIMINAL_SYNDICATE);
            const lawRequirements = await factionLibraryWrapper.getRankRequirements(3n, LAW_ENFORCEMENT);
        
            console.log("Criminal Syndicate Rank 3 Requirements:", {
                reputationRequired: criminalRequirements.reputationRequired.toString(),
                timeRequired: criminalRequirements.timeInFactionRequired.toString(),
                actionsRequired: criminalRequirements.actionsRequired.toString()
            });
        
            console.log("Law Enforcement Rank 3 Requirements:", {
                reputationRequired: lawRequirements.reputationRequired.toString(),
                timeRequired: lawRequirements.timeInFactionRequired.toString(),
                actionsRequired: lawRequirements.actionsRequired.toString()
            });
        
            console.log("Test Values:", {
                reputation: reputation.toString(),
                memberSince: memberSince.toString(),
                actionsCompleted: actionsCompleted.toString()
            });
        
            // Assertions
            expect(isEligibleCriminal).to.be.true;
            expect(newRankCriminal).to.equal(3n);
        
            expect(isEligibleLaw).to.be.false;
            expect(newRankLaw).to.equal(2n); // Stays at current rank
        });
    });

    describe("Rank Requirements", function () {
        it("should provide correct rank requirements for different factions", async function () {
            // Check rank 5 requirements for all factions
            const lawRequirements = await factionLibraryWrapper.getRankRequirements(5n, LAW_ENFORCEMENT);
            const criminalRequirements = await factionLibraryWrapper.getRankRequirements(5n, CRIMINAL_SYNDICATE);
            const vigilanteRequirements = await factionLibraryWrapper.getRankRequirements(5n, VIGILANTE);

            // Law Enforcement has stricter reputation requirements
            expect(lawRequirements.reputationRequired).to.be.gt(criminalRequirements.reputationRequired);

            // Criminal Syndicate has more actions required
            expect(criminalRequirements.actionsRequired).to.be.gt(vigilanteRequirements.actionsRequired);

            // Vigilante has longer time requirements
            expect(vigilanteRequirements.timeInFactionRequired).to.be.gt(lawRequirements.timeInFactionRequired);
        });

        it("should increase requirements with rank", async function () {
            const rank3Requirements = await factionLibraryWrapper.getRankRequirements(3n, LAW_ENFORCEMENT);
            const rank7Requirements = await factionLibraryWrapper.getRankRequirements(7n, LAW_ENFORCEMENT);

            expect(rank7Requirements.reputationRequired).to.be.gt(rank3Requirements.reputationRequired);
            expect(rank7Requirements.timeInFactionRequired).to.be.gt(rank3Requirements.timeInFactionRequired);
            expect(rank7Requirements.actionsRequired).to.be.gt(rank3Requirements.actionsRequired);
        });
    });

    describe("Role Authorization", function () {
        it("should correctly authorize roles based on rank and reputation", async function () {
            const memberRank = 8n;
            const memberReputation = 7000n;
            const roleId = 3n; // Lieutenant role

            const hasRole = await factionLibraryWrapper.hasRole(
                memberRank,
                memberReputation,
                roleId,
                LAW_ENFORCEMENT
            );

            expect(hasRole).to.be.true;
        });

        it("should deny roles when requirements are not met", async function () {
            const memberRank = 5n; // Too low
            const memberReputation = 2000n; // Too low
            const roleId = 2n; // Sub-leader role (requires rank 9)

            const hasRole = await factionLibraryWrapper.hasRole(
                memberRank,
                memberReputation,
                roleId,
                CRIMINAL_SYNDICATE
            );

            expect(hasRole).to.be.false;
        });

        it("should return correct role requirements", async function () {
            const roleId = 1n; // Leader role

            const [requiredRank, requiredReputation] = await factionLibraryWrapper.getRoleRequirements(
                roleId,
                LAW_ENFORCEMENT
            );

            expect(requiredRank).to.equal(10n); // Top rank required for leader
            expect(requiredReputation).to.equal(10000n); // High reputation required
        });

        it("should apply faction-specific role requirements", async function () {
            const roleId = 15n; // Specialist role

            // Check requirements for Law Enforcement
            const [lawRank, lawReputation] = await factionLibraryWrapper.getRoleRequirements(
                roleId,
                LAW_ENFORCEMENT
            );

            // Check requirements for Criminal Syndicate
            const [criminalRank, criminalReputation] = await factionLibraryWrapper.getRoleRequirements(
                roleId,
                CRIMINAL_SYNDICATE
            );

            // Check requirements for Vigilante
            const [vigilanteRank, vigilanteReputation] = await factionLibraryWrapper.getRoleRequirements(
                roleId,
                VIGILANTE
            );

            // Law Enforcement has higher rank requirements
            expect(lawRank).to.be.gt(vigilanteRank);

            // Criminal Syndicate has higher reputation requirements than Vigilante
            expect(criminalReputation).to.be.gt(vigilanteReputation);
        });
    });

    describe("Influence Score Calculation", function () {
        it("should calculate influence score correctly", async function () {
            const memberCount = 500n;
            const averageReputation = 1000n;
            const territoriesControlled = 10n;
            const resourcesControlled = 50000n;
            const averageMemberRank = 5n;

            const influenceScore = await factionLibraryWrapper.calculateInfluenceScore(
                memberCount,
                averageReputation,
                territoriesControlled,
                resourcesControlled,
                averageMemberRank
            );

            // Expected calculation:
            // Member influence: 1000 + (400 * 5) = 3000
            // Member influence portion: 3000 * 20 / 100 = 600
            // Reputation influence: 1000 * 2 = 2000, portion: 2000 * 15 / 100 = 300
            // Territory influence: 10 * 500 = 5000, portion: 5000 * 30 / 100 = 1500
            // Resource influence: 50000 / 100 = 500, portion: 500 * 25 / 100 = 125
            // Rank influence: 5 * 300 = 1500, portion: 1500 * 10 / 100 = 150
            // Total: 600 + 300 + 1500 + 125 + 150 = 2675
            expect(influenceScore).to.equal(2675n);
        });

        it("should handle large member counts with diminishing returns", async function () {
            const smallMemberCount = 100n;
            const largeMemberCount = 2000n;

            // Keep other parameters constant
            const averageReputation = 1000n;
            const territoriesControlled = 10n;
            const resourcesControlled = 50000n;
            const averageMemberRank = 5n;

            const smallInfluence = await factionLibraryWrapper.calculateInfluenceScore(
                smallMemberCount,
                averageReputation,
                territoriesControlled,
                resourcesControlled,
                averageMemberRank
            );

            const largeInfluence = await factionLibraryWrapper.calculateInfluenceScore(
                largeMemberCount,
                averageReputation,
                territoriesControlled,
                resourcesControlled,
                averageMemberRank
            );

            // Verify that influence increases with member count
            expect(largeInfluence).to.be.gt(smallInfluence);

            // Verify diminishing returns:
            // 2000 members is 20x more than 100 members
            // But influence should not be 20x higher due to diminishing returns
            const ratio = Number(largeInfluence) / Number(smallInfluence);
            expect(ratio).to.be.lt(5); // Much less than 20x
        });
    });

    describe("Conflict Resolution", function () {
        it("should determine winner based on adjusted strengths", async function () {
            // Use slightly higher attacker strength to ensure consistency
            const attackingStrength = 1100n;
            const defendingStrength = 1000n;
            const randomnessSeed = 12345n;

            const [attackerWon, attackerDamage, defenderDamage] = await factionLibraryWrapper.resolveConflict(
                CRIMINAL_SYNDICATE,
                LAW_ENFORCEMENT,
                attackingStrength,
                defendingStrength,
                randomnessSeed
            );

            // Criminal attackers get 20% bonus and 15% bonus against Law Enforcement
            // Law defenders get 20% bonus
            // With a slight base advantage, criminals should consistently win
            expect(attackerWon).to.be.true;

            // Both should deal damage
            expect(attackerDamage).to.be.gt(0n);
            expect(defenderDamage).to.be.gt(0n);
        });
        
        it("should apply faction-specific combat bonuses", async function () {
            // Test strength adjustment directly for clarity
            
            // Law Enforcement defending against Criminals
            const lawDefendingStrength = await factionLibraryWrapper.adjustStrengthForFaction(
                1000n, // Base strength
                LAW_ENFORCEMENT, // Faction
                false, // Defending
                CRIMINAL_SYNDICATE // Against Criminals
            );
            
            // Criminals attacking Law Enforcement
            const criminalsAttackingStrength = await factionLibraryWrapper.adjustStrengthForFaction(
                1000n, // Base strength
                CRIMINAL_SYNDICATE, // Faction
                true, // Attacking
                LAW_ENFORCEMENT // Against Law Enforcement
            );
            
            // Law Enforcement should have defensive bonus
            expect(lawDefendingStrength).to.be.gt(1000n);
            
            // Criminals should have both offensive bonus and bonus against Law Enforcement
            expect(criminalsAttackingStrength).to.be.gt(1200n); // Should have at least 20% (attack) + 15% (vs Law) bonus
        });

        it("should calculate damage based on strength differentials", async function () {
            // Much stronger attacker
            const [, strongAttackerDamage, weakDefenderDamage] = await factionLibraryWrapper.resolveConflict(
                CRIMINAL_SYNDICATE,
                VIGILANTE,
                2000n, // Strong attacker
                500n,  // Weak defender
                12345n
            );

            // Much stronger defender
            const [, weakAttackerDamage, strongDefenderDamage] = await factionLibraryWrapper.resolveConflict(
                CRIMINAL_SYNDICATE,
                VIGILANTE,
                500n,  // Weak attacker
                2000n, // Strong defender
                67890n
            );

            // Strong attacker should deal more damage than weak defender
            expect(strongAttackerDamage).to.be.gt(weakDefenderDamage);

            // Strong defender should deal more damage than weak attacker
            expect(strongDefenderDamage).to.be.gt(weakAttackerDamage);

            // The differences should be significant
            expect(strongAttackerDamage).to.be.gt(weakAttackerDamage * 2n);
            expect(strongDefenderDamage).to.be.gt(weakDefenderDamage * 2n);
        });
        
        it("should have random variations in conflict outcomes", async function () {
            // Test with exactly equal strengths but different randomness seeds
            const results = [];
            
            for (let i = 0; i < 5; i++) {
                const [attackerWon, attackerDamage, defenderDamage] = await factionLibraryWrapper.resolveConflict(
                    CRIMINAL_SYNDICATE,
                    LAW_ENFORCEMENT,
                    1000n, // Equal base strength
                    1000n, 
                    BigInt(123456 + i) // Different seeds
                );
                
                results.push({
                    attackerWon,
                    attackerDamage,
                    defenderDamage
                });
            }
            
            // Check if there's at least some variation in the results
            // This is a probabilistic test, but with the implementation it should almost always pass
            const uniqueOutcomes = new Set(results.map(r => r.attackerWon.toString())).size;
            const uniqueDamages = new Set(results.map(r => r.attackerDamage.toString())).size;
            
            // There should be at least some variation in either outcomes or damage values
            expect(uniqueOutcomes > 1 || uniqueDamages > 1).to.be.true;
        });
    });
});