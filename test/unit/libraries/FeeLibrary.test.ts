// test/unit/libraries/FeeLibrary.test.ts
import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { FeeLibraryTestWrapper } from "../../../typechain/contracts/test/FeeLibraryTestWrapper";

describe("FeeLibrary (via TestWrapper)", function () {
    let feeLibraryWrapper: FeeLibraryTestWrapper;

    // Constants from the library
    let FEE_DENOMINATOR: bigint;
    let MIN_FEE: bigint;

    before(async function () {
        // Deploy all contracts with the TestWrappers tag
        await deployments.fixture(["TestWrappers"]);
        
        // Get the deployed FeeLibraryTestWrapper
        const feeLibraryWrapperDeployment = await deployments.get("FeeLibraryTestWrapper");
        
        // Get the contract instance
        feeLibraryWrapper = await ethers.getContractAt(
            "FeeLibraryTestWrapper", 
            feeLibraryWrapperDeployment.address
        );

        // Get constants from the wrapper
        FEE_DENOMINATOR = await feeLibraryWrapper.getFEE_DENOMINATOR();
        MIN_FEE = await feeLibraryWrapper.getMIN_FEE();
    });

    describe("Marketplace Fee Calculation", function () {
        it("should calculate standard marketplace fee correctly", async function () {
            const price = ethers.parseEther("100"); // 100 tokens
            const baseFeePercentage = 250; // 2.5%
            const factionId = 0; // No faction
            const territoryId = 0; // No territory
            const controllingFaction = 0; // No controlling faction
            
            // Fee distribution percentages
            const percentages = {
                daoTreasuryPercentage: 5000, // 50%
                territoryControllerPercentage: 2000, // 20%
                sellerFactionPercentage: 1000, // 10%
                burnPercentage: 2000 // 20%
            };

            const [totalFee, distribution] = await feeLibraryWrapper.calculateMarketplaceFee(
                price,
                baseFeePercentage,
                factionId,
                territoryId,
                controllingFaction,
                percentages
            );

            // Expected fee: 100 * 2.5% = 2.5 tokens
            expect(totalFee).to.equal(ethers.parseEther("2.5"));
            
            // Expected distribution:
            // DAO: 2.5 * 50% = 1.25 tokens
            // Territory: 0 (no controlling faction)
            // Faction: 0 (seller has no faction)
            // Burn: 2.5 * 20% = 0.5 tokens
            // The remaining 0.75 should go to DAO due to rounding
            expect(distribution.daoTreasuryAmount).to.equal(ethers.parseEther("2"));
            expect(distribution.territoryControllerAmount).to.equal(0);
            expect(distribution.sellerFactionAmount).to.equal(0);
            expect(distribution.burnAmount).to.equal(ethers.parseEther("0.5"));
        });

        it("should apply territory discount when seller controls territory", async function () {
            const price = ethers.parseEther("100"); // 100 tokens
            const baseFeePercentage = 250; // 2.5%
            const factionId = 1; // Law Enforcement
            const territoryId = 1; // Some territory
            const controllingFaction = 1; // Same faction controls territory
            
            // Fee distribution percentages
            const percentages = {
                daoTreasuryPercentage: 5000, // 50%
                territoryControllerPercentage: 2000, // 20%
                sellerFactionPercentage: 1000, // 10%
                burnPercentage: 2000 // 20%
            };

            const [totalFee, distribution] = await feeLibraryWrapper.calculateMarketplaceFee(
                price,
                baseFeePercentage,
                factionId,
                territoryId,
                controllingFaction,
                percentages
            );

            // Expected fee with 30% discount: 100 * 2.5% * 70% = 1.75 tokens
            expect(totalFee).to.equal(ethers.parseEther("1.75"));
            
            // Check that distribution adds up to total fee
            const totalDistributed = distribution.daoTreasuryAmount + 
                distribution.territoryControllerAmount + 
                distribution.sellerFactionAmount + 
                distribution.burnAmount;
            
            expect(totalDistributed).to.equal(totalFee);
        });

        it("should enforce minimum fee for low-value transactions", async function () {
            // Use an extremely small amount that will generate a fee below MIN_FEE
            // For a fee rate of 2.5% (250 basis points), we need price < 40000 wei to get
            // a fee below the 1000 wei minimum (1000 * 10000 / 250 = 40000)
            const price = 10n; // Just 10 wei
            const baseFeePercentage = 250; // 2.5%
            const factionId = 0;
            const territoryId = 0;
            const controllingFaction = 0;
            
            const percentages = {
                daoTreasuryPercentage: 5000,
                territoryControllerPercentage: 2000,
                sellerFactionPercentage: 1000,
                burnPercentage: 2000
            };
        
            const [totalFee, _] = await feeLibraryWrapper.calculateMarketplaceFee(
                price,
                baseFeePercentage,
                factionId,
                territoryId,
                controllingFaction,
                percentages
            );
        
            // With such a small amount, the calculated fee would be too small
            // so minimum fee (1000 wei) should be applied
            expect(totalFee).to.equal(MIN_FEE);
        });
    });

    describe("Territory Fee Adjustment", function () {
        it("should not adjust fee when no territory is specified", async function () {
            const baseFeePercentage = 250; // 2.5%
            const territoryId = 0; // No territory
            const sellerFactionId = 1;
            const controllingFaction = 2;

            const adjustedFee = await feeLibraryWrapper.adjustFeeByTerritory(
                baseFeePercentage,
                territoryId,
                sellerFactionId,
                controllingFaction
            );

            // No adjustment when no territory specified
            expect(adjustedFee).to.equal(baseFeePercentage);
        });

        it("should not adjust fee when territory has no controlling faction", async function () {
            const baseFeePercentage = 250; // 2.5%
            const territoryId = 1; // Some territory
            const sellerFactionId = 1;
            const controllingFaction = 0; // No controlling faction

            const adjustedFee = await feeLibraryWrapper.adjustFeeByTerritory(
                baseFeePercentage,
                territoryId,
                sellerFactionId,
                controllingFaction
            );

            // No adjustment when no controlling faction
            expect(adjustedFee).to.equal(baseFeePercentage);
        });

        it("should discount fee when seller faction controls territory", async function () {
            const baseFeePercentage = 250; // 2.5%
            const territoryId = 1; // Some territory
            const sellerFactionId = 2;
            const controllingFaction = 2; // Seller faction controls

            const adjustedFee = await feeLibraryWrapper.adjustFeeByTerritory(
                baseFeePercentage,
                territoryId,
                sellerFactionId,
                controllingFaction
            );

            // Expected discount: 250 * 70% = 175
            expect(adjustedFee).to.equal(175);
        });
    });

    describe("Fee Distribution", function () {
        it("should distribute fees correctly with all stakeholders", async function () {
            const totalFee = ethers.parseEther("10"); // 10 tokens
            const percentages = {
                daoTreasuryPercentage: 5000, // 50%
                territoryControllerPercentage: 2000, // 20%
                sellerFactionPercentage: 1000, // 10%
                burnPercentage: 2000 // 20%
            };
            const sellerFactionId = 1; // Law Enforcement
            const controllingFaction = 2; // Criminal Syndicate

            const distribution = await feeLibraryWrapper.distributeFees(
                totalFee,
                percentages,
                sellerFactionId,
                controllingFaction
            );

            // Expected distribution:
            // DAO: 10 * 50% = 5 tokens
            // Territory: 10 * 20% = 2 tokens
            // Faction: 10 * 10% = 1 token
            // Burn: 10 * 20% = 2 tokens
            expect(distribution.daoTreasuryAmount).to.equal(ethers.parseEther("5"));
            expect(distribution.territoryControllerAmount).to.equal(ethers.parseEther("2"));
            expect(distribution.sellerFactionAmount).to.equal(ethers.parseEther("1"));
            expect(distribution.burnAmount).to.equal(ethers.parseEther("2"));
            
            // Check total adds up
            const totalDistributed = distribution.daoTreasuryAmount +
                distribution.territoryControllerAmount +
                distribution.sellerFactionAmount +
                distribution.burnAmount;
            
            expect(totalDistributed).to.equal(totalFee);
        });

        it("should not allocate to territory controller when no controlling faction", async function () {
            const totalFee = ethers.parseEther("10");
            const percentages = {
                daoTreasuryPercentage: 5000,
                territoryControllerPercentage: 2000,
                sellerFactionPercentage: 1000,
                burnPercentage: 2000
            };
            const sellerFactionId = 1;
            const controllingFaction = 0; // No controlling faction

            const distribution = await feeLibraryWrapper.distributeFees(
                totalFee,
                percentages,
                sellerFactionId,
                controllingFaction
            );

            // No allocation to territory controller
            expect(distribution.territoryControllerAmount).to.equal(0);
            
            // Extra should be distributed elsewhere
            const totalDistributed = distribution.daoTreasuryAmount +
                distribution.territoryControllerAmount +
                distribution.sellerFactionAmount +
                distribution.burnAmount;
            
            expect(totalDistributed).to.equal(totalFee);
        });

        it("should not allocate to seller faction when seller has no faction", async function () {
            const totalFee = ethers.parseEther("10");
            const percentages = {
                daoTreasuryPercentage: 5000,
                territoryControllerPercentage: 2000,
                sellerFactionPercentage: 1000,
                burnPercentage: 2000
            };
            const sellerFactionId = 0; // No faction
            const controllingFaction = 2;

            const distribution = await feeLibraryWrapper.distributeFees(
                totalFee,
                percentages,
                sellerFactionId,
                controllingFaction
            );

            // No allocation to seller faction
            expect(distribution.sellerFactionAmount).to.equal(0);
            
            // Total should still add up to fee amount
            const totalDistributed = distribution.daoTreasuryAmount +
                distribution.territoryControllerAmount +
                distribution.sellerFactionAmount +
                distribution.burnAmount;
            
            expect(totalDistributed).to.equal(totalFee);
        });
    });

    describe("Transaction Tax Calculation", function () {
        it("should calculate standard transaction tax", async function () {
            const amount = ethers.parseEther("1000");
            const senderFaction = 0; // No faction
            const receiverFaction = 0; // No faction
            const baseTaxRate = 200; // 2%

            const tax = await feeLibraryWrapper.calculateTransactionTax(
                amount,
                senderFaction,
                receiverFaction,
                baseTaxRate
            );

            // Expected tax: 1000 * 2% = 20 tokens
            expect(tax).to.equal(ethers.parseEther("20"));
        });

        it("should apply discount for same-faction transactions", async function () {
            const amount = ethers.parseEther("1000");
            const senderFaction = 1; // Law Enforcement
            const receiverFaction = 1; // Same faction
            const baseTaxRate = 200; // 2%

            const tax = await feeLibraryWrapper.calculateTransactionTax(
                amount,
                senderFaction,
                receiverFaction,
                baseTaxRate
            );

            // Expected tax with 50% discount: 1000 * 2% * 50% = 10 tokens
            expect(tax).to.equal(ethers.parseEther("10"));
        });

        it("should apply premium for cross-faction transactions", async function () {
            const amount = ethers.parseEther("1000");
            const senderFaction = 1; // Law Enforcement
            const receiverFaction = 2; // Criminal Syndicate (different faction)
            const baseTaxRate = 200; // 2%

            const tax = await feeLibraryWrapper.calculateTransactionTax(
                amount,
                senderFaction,
                receiverFaction,
                baseTaxRate
            );

            // Expected tax with 50% premium: 1000 * 2% * 150% = 30 tokens
            expect(tax).to.equal(ethers.parseEther("30"));
        });

        it("should enforce minimum tax for small transactions", async function () {
            // Use an extremely small amount that will generate a tax below MIN_FEE
            // For a cross-faction tax rate of 3% (300 basis points), we need amount < 33333 wei
            // to get a tax below the 1000 wei minimum (1000 * 10000 / 300 = 33333)
            const amount = 10n; // Just 10 wei
            const senderFaction = 1;
            const receiverFaction = 2;
            const baseTaxRate = 200; // 2%
        
            const tax = await feeLibraryWrapper.calculateTransactionTax(
                amount,
                senderFaction,
                receiverFaction,
                baseTaxRate
            );
        
            // With such a small amount, the calculated tax would be too small
            // so minimum tax (1000 wei) should be applied
            expect(tax).to.equal(MIN_FEE);
        });

        it("should return zero tax for zero amount", async function () {
            const amount = 0n;
            const senderFaction = 1;
            const receiverFaction = 2;
            const baseTaxRate = 200;

            const tax = await feeLibraryWrapper.calculateTransactionTax(
                amount,
                senderFaction,
                receiverFaction,
                baseTaxRate
            );

            expect(tax).to.equal(0n);
        });
    });

    describe("Tax Distribution", function () {
        it("should distribute tax correctly between burn, DAO and factions", async function () {
            const taxAmount = ethers.parseEther("100");
            const burnPercentage = 3000; // 30%
            const senderFaction = 1; // Law Enforcement
            const receiverFaction = 2; // Criminal Syndicate

            const [burnAmount, daoAmount, factionAmounts] = await feeLibraryWrapper.distributeTax(
                taxAmount,
                burnPercentage,
                senderFaction,
                receiverFaction
            );

            // Expected distributions:
            // Burn: 100 * 30% = 30 tokens
            // Remaining: 70 tokens
            // DAO: 70 * 30% = 21 tokens
            // Factions: 49 tokens split between factions 1 and 2
            // Faction 1: 24.5 tokens
            // Faction 2: 24.5 tokens
            expect(burnAmount).to.equal(ethers.parseEther("30"));
            expect(daoAmount).to.equal(ethers.parseEther("21"));
            
            // Check that faction amounts array is correct length and properly indexed
            expect(factionAmounts.length).to.equal(4); // [0, 1, 2, 3]
            expect(factionAmounts[1]).to.equal(ethers.parseEther("24.5"));
            expect(factionAmounts[2]).to.equal(ethers.parseEther("24.5"));
            expect(factionAmounts[0]).to.equal(0n); // Unused index
            expect(factionAmounts[3]).to.equal(0n); // No faction 3 involved
            
            // Verify total adds up to tax amount
            const totalDistributed = burnAmount + daoAmount +
                factionAmounts[0] + factionAmounts[1] + 
                factionAmounts[2] + factionAmounts[3];
            
            expect(totalDistributed).to.equal(taxAmount);
        });

        it("should allocate all faction share to the same faction for same-faction transaction", async function () {
            const taxAmount = ethers.parseEther("100");
            const burnPercentage = 3000; // 30%
            const senderFaction = 2; // Criminal Syndicate
            const receiverFaction = 2; // Same faction

            const [burnAmount, daoAmount, factionAmounts] = await feeLibraryWrapper.distributeTax(
                taxAmount,
                burnPercentage,
                senderFaction,
                receiverFaction
            );

            // Expected:
            // Burn: 100 * 30% = 30 tokens
            // Remaining: 70 tokens
            // DAO: 70 * 30% = 21 tokens
            // Factions: 49 tokens all to faction 2
            expect(burnAmount).to.equal(ethers.parseEther("30"));
            expect(daoAmount).to.equal(ethers.parseEther("21"));
            expect(factionAmounts[2]).to.equal(ethers.parseEther("49"));
            expect(factionAmounts[1]).to.equal(0n);
            expect(factionAmounts[3]).to.equal(0n);
        });

        it("should allocate faction share to DAO when no factions involved", async function () {
            const taxAmount = ethers.parseEther("100");
            const burnPercentage = 3000; // 30%
            const senderFaction = 0; // No faction
            const receiverFaction = 0; // No faction

            const [burnAmount, daoAmount, factionAmounts] = await feeLibraryWrapper.distributeTax(
                taxAmount,
                burnPercentage,
                senderFaction,
                receiverFaction
            );

            // Expected:
            // Burn: 100 * 30% = 30 tokens
            // Remaining: 70 tokens
            // DAO: 70 * 30% + remaining = 70 tokens (all goes to DAO)
            expect(burnAmount).to.equal(ethers.parseEther("30"));
            expect(daoAmount).to.equal(ethers.parseEther("70"));
            
            // No allocation to any faction
            expect(factionAmounts[1]).to.equal(0n);
            expect(factionAmounts[2]).to.equal(0n);
            expect(factionAmounts[3]).to.equal(0n);
        });
    });
});