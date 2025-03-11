// test/unit/tokens/BaseERC1155Token.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { setupBaseERC1155TokenFixture } from "../../fixtures/tokens/BaseERC1155Token.fixture";
import { getContractWithSigner } from "../../common";
import { BaseERC1155Token } from "../../../typechain/contracts/protocol/tokens/BaseERC1155Token";
import { Signer } from "ethers";

describe("BaseERC1155Token", function () {
    // Test variables
    let baseERC1155Token: BaseERC1155Token;
    let deployer: Signer;
    let defaultAdmin: Signer;
    let pauser: Signer;
    let minter: Signer;
    let upgrader: Signer;
    let user1: Signer;
    let user2: Signer;
    let roles: Record<string, string>;
    let tokenIds: number[];

    // Store addresses for easier access
    let user1Address: string;
    let user2Address: string;
    let pauserAddress: string;
    let minterAddress: string;
    let defaultAdminAddress: string;

    // Use beforeEach to reset the state before each test
    beforeEach(async function () {
        // Load the fixture
        const fixture = await setupBaseERC1155TokenFixture();

        // Assign all returned values from fixture
        baseERC1155Token = fixture.baseERC1155Token;
        deployer = fixture.deployer;
        defaultAdmin = fixture.defaultAdmin;
        pauser = fixture.pauser;
        minter = fixture.minter;
        upgrader = fixture.upgrader;
        user1 = fixture.user1;
        user2 = fixture.user2;
        roles = fixture.roles;
        tokenIds = fixture.tokenIds;

        // Get addresses for use in tests
        user1Address = await user1.getAddress();
        user2Address = await user2.getAddress();
        pauserAddress = await pauser.getAddress();
        minterAddress = await minter.getAddress();
        defaultAdminAddress = await defaultAdmin.getAddress();
    });

    describe("Initialization", function () {
        it("should correctly set the token URI", async function () {
            expect(await baseERC1155Token.uri(0)).to.equal("https://token-cdn-domain/{id}.json");
        });

        it("should correctly assign roles", async function () {
            expect(await baseERC1155Token.hasRole(roles.DEFAULT_ADMIN_ROLE, defaultAdminAddress)).to.be.true;
            expect(await baseERC1155Token.hasRole(roles.PAUSER_ROLE, pauserAddress)).to.be.true;
            expect(await baseERC1155Token.hasRole(roles.MINTER_ROLE, minterAddress)).to.be.true;
            expect(await baseERC1155Token.hasRole(roles.UPGRADER_ROLE, await upgrader.getAddress())).to.be.true;
            expect(await baseERC1155Token.hasRole(roles.URI_SETTER_ROLE, defaultAdminAddress)).to.be.true;
        });

        it("should start with the correct initial state", async function () {
            expect(await baseERC1155Token.paused()).to.be.false;
            // Check balances from fixture setup
            expect(await baseERC1155Token.balanceOf(user1Address, tokenIds[0])).to.equal(100n);
            expect(await baseERC1155Token.balanceOf(user1Address, tokenIds[1])).to.equal(200n);
            expect(await baseERC1155Token.balanceOf(user2Address, tokenIds[2])).to.equal(150n);
            expect(await baseERC1155Token.balanceOf(user2Address, tokenIds[3])).to.equal(50n);
            expect(await baseERC1155Token.balanceOf(user2Address, tokenIds[4])).to.equal(75n);
        });
    });

    describe("Role-Based Access Control", function () {
        it("should allow minter to mint tokens", async function () {
            const tokenAsMinter = getContractWithSigner(baseERC1155Token, minter);
            const tokenId = 6; // New token ID
            const amount = 50n;

            await tokenAsMinter.mint(user1Address, tokenId, amount, "0x");
            expect(await baseERC1155Token.balanceOf(user1Address, tokenId)).to.equal(amount);
            expect(await baseERC1155Token["totalSupply(uint256)"](tokenId)).to.equal(amount);
        });

        it("should allow minter to batch mint tokens", async function () {
            const tokenAsMinter = getContractWithSigner(baseERC1155Token, minter);
            const newTokenIds = [7, 8, 9];
            const amounts = [30n, 40n, 50n];

            await tokenAsMinter.mintBatch(user1Address, newTokenIds, amounts, "0x");
            
            for (let i = 0; i < newTokenIds.length; i++) {
                expect(await baseERC1155Token.balanceOf(user1Address, newTokenIds[i])).to.equal(amounts[i]);
                expect(await baseERC1155Token["totalSupply(uint256)"](newTokenIds[i])).to.equal(amounts[i]);
            }
        });

        it("should prevent non-minters from minting tokens", async function () {
            const tokenAsUser = getContractWithSigner(baseERC1155Token, user1);
            const tokenId = 10;
            const amount = 30n;

            await expect(tokenAsUser.mint(user2Address, tokenId, amount, "0x"))
                .to.be.revertedWithCustomError(baseERC1155Token, "AccessControlUnauthorizedAccount")
                .withArgs(user1Address, roles.MINTER_ROLE);
        });

        it("should allow pauser to pause and unpause the token", async function () {
            const tokenAsPauser = getContractWithSigner(baseERC1155Token, pauser);
            const tokenAsUser1 = getContractWithSigner(baseERC1155Token, user1);
            const tokenId = tokenIds[0]; // First token ID
            const amount = 10n;

            // Test pausing
            await tokenAsPauser.pause();
            expect(await baseERC1155Token.paused()).to.be.true;

            // Test that transfers are blocked when paused
            await expect(tokenAsUser1.safeTransferFrom(user1Address, user2Address, tokenId, amount, "0x"))
                .to.be.revertedWithCustomError(baseERC1155Token, "EnforcedPause");

            // Test unpausing
            await tokenAsPauser.unpause();
            expect(await baseERC1155Token.paused()).to.be.false;

            // Test that transfers work after unpausing
            await tokenAsUser1.safeTransferFrom(user1Address, user2Address, tokenId, amount, "0x");
            
            // Check balances after transfer
            expect(await baseERC1155Token.balanceOf(user1Address, tokenId)).to.equal(90n); // 100 - 10
            expect(await baseERC1155Token.balanceOf(user2Address, tokenId)).to.equal(10n);
        });

        it("should prevent non-pausers from pausing the token", async function () {
            const tokenAsUser = getContractWithSigner(baseERC1155Token, user1);

            await expect(tokenAsUser.pause())
                .to.be.revertedWithCustomError(baseERC1155Token, "AccessControlUnauthorizedAccount")
                .withArgs(user1Address, roles.PAUSER_ROLE);
        });

        it("should allow URI setter to update the URI", async function () {
            const tokenAsAdmin = getContractWithSigner(baseERC1155Token, defaultAdmin);
            const newURI = "https://new-domain/{id}.json";

            await tokenAsAdmin.setURI(newURI);
            expect(await baseERC1155Token.uri(0)).to.equal(newURI);
        });

        it("should prevent non-URI setters from updating the URI", async function () {
            const tokenAsUser = getContractWithSigner(baseERC1155Token, user1);
            const newURI = "https://unauthorized-domain/{id}.json";

            await expect(tokenAsUser.setURI(newURI))
                .to.be.revertedWithCustomError(baseERC1155Token, "AccessControlUnauthorizedAccount")
                .withArgs(user1Address, roles.URI_SETTER_ROLE);
        });

        it("should allow admin to grant and revoke roles", async function () {
            const tokenAsAdmin = getContractWithSigner(baseERC1155Token, defaultAdmin);

            // Grant minter role to user1
            await tokenAsAdmin.grantRole(roles.MINTER_ROLE, user1Address);
            expect(await baseERC1155Token.hasRole(roles.MINTER_ROLE, user1Address)).to.be.true;

            // Now user1 should be able to mint
            const tokenAsUser1 = getContractWithSigner(baseERC1155Token, user1);
            const tokenId = 11;
            const amount = 25n;
            await tokenAsUser1.mint(user1Address, tokenId, amount, "0x");
            expect(await baseERC1155Token.balanceOf(user1Address, tokenId)).to.equal(amount);

            // Revoke minter role from user1
            await tokenAsAdmin.revokeRole(roles.MINTER_ROLE, user1Address);
            expect(await baseERC1155Token.hasRole(roles.MINTER_ROLE, user1Address)).to.be.false;

            // Now user1 should not be able to mint
            await expect(tokenAsUser1.mint(user1Address, tokenId + 1, amount, "0x"))
                .to.be.revertedWithCustomError(baseERC1155Token, "AccessControlUnauthorizedAccount");
        });
    });

    describe("Token Functionality", function () {
        it("should allow token transfers", async function () {
            const tokenId = tokenIds[0]; // First token ID
            const transferAmount = 30n;
            const tokenAsUser1 = getContractWithSigner(baseERC1155Token, user1);

            const initialBalanceUser1 = await baseERC1155Token.balanceOf(user1Address, tokenId);
            const initialBalanceUser2 = await baseERC1155Token.balanceOf(user2Address, tokenId);

            await tokenAsUser1.safeTransferFrom(user1Address, user2Address, tokenId, transferAmount, "0x");

            const finalBalanceUser1 = await baseERC1155Token.balanceOf(user1Address, tokenId);
            const finalBalanceUser2 = await baseERC1155Token.balanceOf(user2Address, tokenId);

            expect(finalBalanceUser1).to.equal(initialBalanceUser1 - transferAmount);
            expect(finalBalanceUser2).to.equal(initialBalanceUser2 + transferAmount);
        });

        it("should allow batch token transfers", async function () {
            const ids = [tokenIds[0], tokenIds[1]]; // First and second token IDs
            const transferAmounts = [50n, 75n];
            const tokenAsUser1 = getContractWithSigner(baseERC1155Token, user1);

            const initialBalancesUser1 = [
                await baseERC1155Token.balanceOf(user1Address, ids[0]),
                await baseERC1155Token.balanceOf(user1Address, ids[1])
            ];
            const initialBalancesUser2 = [
                await baseERC1155Token.balanceOf(user2Address, ids[0]),
                await baseERC1155Token.balanceOf(user2Address, ids[1])
            ];

            await tokenAsUser1.safeBatchTransferFrom(
                user1Address, 
                user2Address, 
                ids, 
                transferAmounts, 
                "0x"
            );

            const finalBalancesUser1 = [
                await baseERC1155Token.balanceOf(user1Address, ids[0]),
                await baseERC1155Token.balanceOf(user1Address, ids[1])
            ];
            const finalBalancesUser2 = [
                await baseERC1155Token.balanceOf(user2Address, ids[0]),
                await baseERC1155Token.balanceOf(user2Address, ids[1])
            ];

            for (let i = 0; i < ids.length; i++) {
                expect(finalBalancesUser1[i]).to.equal(initialBalancesUser1[i] - transferAmounts[i]);
                expect(finalBalancesUser2[i]).to.equal(initialBalancesUser2[i] + transferAmounts[i]);
            }
        });

        it("should track token supply correctly", async function () {
            const tokenId = tokenIds[0]; // First token ID
            const burnAmount = 20n;
            const tokenAsUser1 = getContractWithSigner(baseERC1155Token, user1);

            const initialSupply = await baseERC1155Token["totalSupply(uint256)"](tokenId);
            const initialBalance = await baseERC1155Token.balanceOf(user1Address, tokenId);

            // Burn some tokens
            await tokenAsUser1.burn(user1Address, tokenId, burnAmount);

            const finalSupply = await baseERC1155Token["totalSupply(uint256)"](tokenId);
            const finalBalance = await baseERC1155Token.balanceOf(user1Address, tokenId);

            expect(finalSupply).to.equal(initialSupply - burnAmount);
            expect(finalBalance).to.equal(initialBalance - burnAmount);
        });

        it("should allow batch burning", async function () {
            const ids = [tokenIds[0], tokenIds[1]]; // First and second token IDs
            const burnAmounts = [25n, 40n];
            const tokenAsUser1 = getContractWithSigner(baseERC1155Token, user1);

            const initialSupplies = [
                await baseERC1155Token["totalSupply(uint256)"](ids[0]),
                await baseERC1155Token["totalSupply(uint256)"](ids[1])
            ];
            const initialBalances = [
                await baseERC1155Token.balanceOf(user1Address, ids[0]),
                await baseERC1155Token.balanceOf(user1Address, ids[1])
            ];

            // Burn tokens in batch
            await tokenAsUser1.burnBatch(user1Address, ids, burnAmounts);

            const finalSupplies = [
                await baseERC1155Token["totalSupply(uint256)"](ids[0]),
                await baseERC1155Token["totalSupply(uint256)"](ids[1])
            ];
            const finalBalances = [
                await baseERC1155Token.balanceOf(user1Address, ids[0]),
                await baseERC1155Token.balanceOf(user1Address, ids[1])
            ];

            for (let i = 0; i < ids.length; i++) {
                expect(finalSupplies[i]).to.equal(initialSupplies[i] - burnAmounts[i]);
                expect(finalBalances[i]).to.equal(initialBalances[i] - burnAmounts[i]);
            }
        });
    });

    describe("Supply Tracking", function () {
        it("should track total supply for each token type", async function () {
            // Check initial supplies from fixture setup
            expect(await baseERC1155Token["totalSupply(uint256)"](tokenIds[0])).to.equal(100n);
            expect(await baseERC1155Token["totalSupply(uint256)"](tokenIds[1])).to.equal(200n);
            expect(await baseERC1155Token["totalSupply(uint256)"](tokenIds[2])).to.equal(150n);
            expect(await baseERC1155Token["totalSupply(uint256)"](tokenIds[3])).to.equal(50n);
            expect(await baseERC1155Token["totalSupply(uint256)"](tokenIds[4])).to.equal(75n);
            
            // Mint more of an existing token
            const tokenAsMinter = getContractWithSigner(baseERC1155Token, minter);
            const additionalAmount = 50n;
            
            await tokenAsMinter.mint(user1Address, tokenIds[0], additionalAmount, "0x");
            
            // Check updated supply
            expect(await baseERC1155Token["totalSupply(uint256)"](tokenIds[0])).to.equal(100n + additionalAmount);
        });
        
        it("should correctly report exists status", async function () {
            // Token IDs from fixture should exist
            for (const tokenId of tokenIds) {
                expect(await baseERC1155Token.exists(tokenId)).to.be.true;
            }
            
            // Non-existent token ID should return false
            const nonExistentId = 9999;
            expect(await baseERC1155Token.exists(nonExistentId)).to.be.false;
        });
    });
});