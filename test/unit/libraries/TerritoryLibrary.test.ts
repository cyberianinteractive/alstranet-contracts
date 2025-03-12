// test/unit/libraries/TerritoryLibrary.test.ts
import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { TerritoryLibraryTestWrapper } from "../../../typechain/contracts/test/TerritoryLibraryTestWrapper";

describe("TerritoryLibrary", function () {
    let territoryLibraryWrapper: TerritoryLibraryTestWrapper;

    before(async function () {
        // Deploy using the deployment script via fixture
        await deployments.fixture(["TestWrappers"]);

        // Get the deployed TerritoryLibraryTestWrapper
        const territoryLibraryWrapperDeployment = await deployments.get("TerritoryLibraryTestWrapper");

        // Get the contract instance
        territoryLibraryWrapper = await ethers.getContractAt(
            "TerritoryLibraryTestWrapper",
            territoryLibraryWrapperDeployment.address
        ) as TerritoryLibraryTestWrapper;
    });

    describe("Territory Value Calculation", function () {
        it("should calculate territory value correctly for high security zone", async function () {
            const baseValue = 1000;
            const zoneType = await territoryLibraryWrapper.HIGH_SECURITY_ZONE();
            const resourceRate = 10;
            const contestedStatus = false;
            const lastUpdateBlock = 100;
            const currentBlock = 200;

            const value = await territoryLibraryWrapper.calculateTerritoryValue(
                baseValue,
                zoneType,
                resourceRate,
                contestedStatus,
                lastUpdateBlock,
                currentBlock
            );

            // High security zone gets 20% premium
            // Base value with premium: 1000 * 1.2 = 1200
            // Resources generated: 10 * (200-100) = 1000
            // Resource value added: 1000 * 10 = 10000
            // Total: 1200 + 10000 = 11200
            expect(value).to.equal(11200);
        });

        it("should apply contested penalty to territory value", async function () {
            const baseValue = 1000;
            const zoneType = await territoryLibraryWrapper.MEDIUM_SECURITY_ZONE();
            const resourceRate = 10;
            const contestedStatus = true; // Contested
            const lastUpdateBlock = 100;
            const currentBlock = 200;

            const value = await territoryLibraryWrapper.calculateTerritoryValue(
                baseValue,
                zoneType,
                resourceRate,
                contestedStatus,
                lastUpdateBlock,
                currentBlock
            );

            // Medium security zone gets no premium: 1000
            // Resources generated: 10 * (200-100) = 1000
            // Resource value added: 1000 * 10 = 10000
            // Value before contested penalty: 1000 + 10000 = 11000
            // With 20% contested penalty: 11000 * 0.8 = 8800
            expect(value).to.equal(8800);
        });
    });

    describe("Resource Generation", function () {
        it("should calculate generated resources correctly", async function () {
            const resourceRate = 10;
            const lastUpdateBlock = 100;
            const currentBlock = 200;
            const controlModifier = 80; // 80% efficiency

            const resources = await territoryLibraryWrapper.calculateGeneratedResources(
                resourceRate,
                lastUpdateBlock,
                currentBlock,
                controlModifier
            );

            // Expected: 10 * (200-100) * 0.8 = 800
            expect(resources).to.equal(800);
        });

        it("should return zero resources when no blocks have passed", async function () {
            const resourceRate = 10;
            const lastUpdateBlock = 100;
            const currentBlock = 100;
            const controlModifier = 100;

            const resources = await territoryLibraryWrapper.calculateGeneratedResources(
                resourceRate,
                lastUpdateBlock,
                currentBlock,
                controlModifier
            );

            expect(resources).to.equal(0);
        });
    });

    describe("Contested Status Determination", function () {
        it("should identify a contested territory correctly", async function () {
            // Create an array with faction stakes [unused, faction1, faction2, faction3]
            const factionStakes = [0, 45, 40, 15]; // Close contest between faction 1 and 2
            const totalStaked = 100;
            const contestThreshold = 10; // 10% threshold for contest

            const [isContested, dominantFaction, challengerFaction] = await territoryLibraryWrapper.determineContestedStatus(
                factionStakes,
                totalStaked,
                contestThreshold
            );

            expect(isContested).to.be.true;
            expect(dominantFaction).to.equal(1);
            expect(challengerFaction).to.equal(2);
        });

        it("should identify a non-contested territory correctly", async function () {
            // Create an array with faction stakes [unused, faction1, faction2, faction3]
            const factionStakes = [0, 70, 20, 10]; // Clear dominance by faction 1
            const totalStaked = 100;
            const contestThreshold = 10; // 10% threshold for contest

            const [isContested, dominantFaction, challengerFaction] = await territoryLibraryWrapper.determineContestedStatus(
                factionStakes,
                totalStaked,
                contestThreshold
            );

            expect(isContested).to.be.false;
            expect(dominantFaction).to.equal(1);
            expect(challengerFaction).to.equal(2);
        });

        it("should handle territories with no stakes", async function () {
            const factionStakes = [0, 0, 0, 0]; // No stakes
            const totalStaked = 0;
            const contestThreshold = 10;

            const [isContested, dominantFaction, challengerFaction] = await territoryLibraryWrapper.determineContestedStatus(
                factionStakes,
                totalStaked,
                contestThreshold
            );

            expect(isContested).to.be.false;
            expect(dominantFaction).to.equal(0);
            expect(challengerFaction).to.equal(0);
        });
    });

    describe("Economic Impact Calculation", function () {
        it("should calculate higher economic impact for controlling faction", async function () {
            const factionId = 1;
            const controllingFaction = 1; // Same faction controls
            const isContested = false;
            const baseImpact = 1000;
            const factionPresencePercentage = 60;

            const impact = await territoryLibraryWrapper.calculateEconomicImpact(
                factionId,
                controllingFaction,
                isContested,
                baseImpact,
                factionPresencePercentage
            );

            // Expected: (1000 * 0.6) * 1.5 = 900
            expect(impact).to.equal(900);
        });

        it("should calculate reduced economic impact for contested territories", async function () {
            const factionId = 1;
            const controllingFaction = 1;
            const isContested = true; // Contested
            const baseImpact = 1000;
            const factionPresencePercentage = 60;

            const impact = await territoryLibraryWrapper.calculateEconomicImpact(
                factionId,
                controllingFaction,
                isContested,
                baseImpact,
                factionPresencePercentage
            );

            // With contested penalty: (1000 * 0.6) * 0.75 = 450
            expect(impact).to.equal(450);
        });
    });

    describe("Territory Tax Rate", function () {
        it("should calculate higher tax rate for Law Enforcement controlled territories", async function () {
            const zoneType = await territoryLibraryWrapper.MEDIUM_SECURITY_ZONE();
            const controllingFaction = 1; // Law Enforcement
            const isContested = false;

            const taxRate = await territoryLibraryWrapper.calculateTerritoryTaxRate(
                zoneType,
                controllingFaction,
                isContested
            );

            // Medium security base: 300
            // Law Enforcement multiplier: x1.2
            // Expected: 300 * 1.2 = 360 basis points (3.6%)
            expect(taxRate).to.equal(360);
        });

        it("should calculate lower tax rate for Criminal controlled territories", async function () {
            const zoneType = await territoryLibraryWrapper.MEDIUM_SECURITY_ZONE();
            const controllingFaction = 2; // Criminal Syndicate
            const isContested = false;

            const taxRate = await territoryLibraryWrapper.calculateTerritoryTaxRate(
                zoneType,
                controllingFaction,
                isContested
            );

            // Medium security base: 300
            // Criminal multiplier: x0.5
            // Expected: 300 * 0.5 = 150 basis points (1.5%)
            expect(taxRate).to.equal(150);
        });

        it("should increase tax rate for contested territories", async function () {
            const zoneType = await territoryLibraryWrapper.MEDIUM_SECURITY_ZONE();
            const controllingFaction = 3; // Vigilante
            const isContested = true; // Contested

            const taxRate = await territoryLibraryWrapper.calculateTerritoryTaxRate(
                zoneType,
                controllingFaction,
                isContested
            );

            // Medium security base: 300
            // Vigilante multiplier: x0.8 = 240
            // Contested multiplier: x1.3
            // Expected: 240 * 1.3 = 312 basis points (3.12%)
            expect(taxRate).to.equal(312);
        });
    });

    describe("Territory Connection Calculation", function () {
        it("should calculate strong connection for territories with border connection", async function () {
            const distanceScore = 20; // Low distance (closer)
            const hasBorderConnection = true;
            const territoryAZoneType = await territoryLibraryWrapper.MEDIUM_SECURITY_ZONE();
            const territoryBZoneType = await territoryLibraryWrapper.MEDIUM_SECURITY_ZONE(); // Same zone type

            const connectionScore = await territoryLibraryWrapper.calculateTerritoryConnection(
                distanceScore,
                hasBorderConnection,
                territoryAZoneType,
                territoryBZoneType
            );

            // Base: 100 - 20 = 80
            // Border bonus: +50
            // Same zone type: +20
            // Expected: 80 + 50 + 20 = 150, capped at 100
            expect(connectionScore).to.equal(100);
        });

        it("should calculate weak connection for distant territories of incompatible types", async function () {
            const distanceScore = 80; // High distance (farther)
            const hasBorderConnection = false;
            const territoryAZoneType = await territoryLibraryWrapper.HIGH_SECURITY_ZONE();
            const territoryBZoneType = await territoryLibraryWrapper.NO_GO_ZONE(); // Incompatible zone types

            const connectionScore = await territoryLibraryWrapper.calculateTerritoryConnection(
                distanceScore,
                hasBorderConnection,
                territoryAZoneType,
                territoryBZoneType
            );

            // Base: 100 - 80 = 20
            // Incompatible zones: -30 (but minimum is 0)
            // Expected: 0
            expect(connectionScore).to.equal(0);
        });

        it("should return zero for territories that are too far apart", async function () {
            const distanceScore = 120; // Beyond maximum distance
            const hasBorderConnection = false;
            const territoryAZoneType = await territoryLibraryWrapper.MEDIUM_SECURITY_ZONE();
            const territoryBZoneType = await territoryLibraryWrapper.MEDIUM_SECURITY_ZONE();

            const connectionScore = await territoryLibraryWrapper.calculateTerritoryConnection(
                distanceScore,
                hasBorderConnection,
                territoryAZoneType,
                territoryBZoneType
            );

            expect(connectionScore).to.equal(0);
        });
    });

    describe("Territory Connections Mapping", function () {
        it("should correctly map territory connections to adjacency list", async function () {
            // Create a simple 3x3 connection matrix
            // Each territory's connection to itself is ignored
            const connectionScores = [
                [0, 80, 20],  // Territory 0 connections
                [80, 0, 60],  // Territory 1 connections
                [20, 60, 0]   // Territory 2 connections
            ];

            const minimumConnectionStrength = 50; // Only strong connections count

            const [adjacencyList, connectionStrengths] = await territoryLibraryWrapper.mapTerritoryConnections(
                3, // 3 territories
                connectionScores,
                minimumConnectionStrength
            );

            // Expected adjacency list for minimum strength 50:
            // - Territory 0 connects to: [1] with strength [80]
            // - Territory 1 connects to: [0, 2] with strengths [80, 60]
            // - Territory 2 connects to: [1] with strength [60]

            // Check first territory connections
            expect(adjacencyList[0].length).to.equal(1);
            expect(adjacencyList[0][0]).to.equal(1);
            expect(connectionStrengths[0][0]).to.equal(80);

            // Check second territory connections
            expect(adjacencyList[1].length).to.equal(2);
            expect(adjacencyList[1][0]).to.equal(0);
            expect(adjacencyList[1][1]).to.equal(2);
            expect(connectionStrengths[1][0]).to.equal(80);
            expect(connectionStrengths[1][1]).to.equal(60);

            // Check third territory connections
            expect(adjacencyList[2].length).to.equal(1);
            expect(adjacencyList[2][0]).to.equal(1);
            expect(connectionStrengths[2][0]).to.equal(60);
        });
    });

    describe("Resource Flow Calculation", function () {
        it("should calculate resource flow between connected territories", async function () {
            // Setup
            const territoryResourceRates = [100, 200, 50]; // Resource generation rates

            // Adjacency list representation:
            // - Territory 0 connects to: [1]
            // - Territory 1 connects to: [0, 2]
            // - Territory 2 connects to: [1]
            const adjacencyList = [
                [1],
                [0, 2],
                [1]
            ];

            // Connection strengths corresponding to adjacency list
            const connectionStrengths = [
                [80],
                [80, 60],
                [60]
            ];

            const flowPercentage = 10; // 10% resources flow through connections

            const resourceFlows = await territoryLibraryWrapper.calculateResourceFlow(
                territoryResourceRates,
                adjacencyList,
                connectionStrengths,
                flowPercentage
            );

            // Calculate expected flows:
            // From Territory 0 to 1: 100 * 80 * 10 / 10000 = 8
            // From Territory 1 to 0: 200 * 80 * 10 / 10000 = 16
            // From Territory 1 to 2: 200 * 60 * 10 / 10000 = 12
            // From Territory 2 to 1: 50 * 60 * 10 / 10000 = 3

            // Net flow for Territory 0: -8 + 16 = 8
            // Net flow for Territory 1: -16 - 12 + 8 + 3 = -17
            // Net flow for Territory 2: -3 + 12 = 9

            expect(resourceFlows[0]).to.equal(8);
            expect(resourceFlows[1]).to.equal(-17);
            expect(resourceFlows[2]).to.equal(9);
        });
    });
});