// test/unit/tokens/BaseERC20Token.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { getContractWithSigner } from "../../common";
import { setupBaseERC20TokenFixture } from "../../fixtures/tokens/BaseERC20Token.fixture";
import { BaseERC20Token } from "../../../typechain/contracts/protocol/tokens/BaseERC20Token";
import { Signer } from "ethers";

describe("BaseERC20Token", function () {
    // Test variables
    let baseERC20Token: BaseERC20Token;
    let deployer: Signer;
    let defaultAdmin: Signer;
    let pauser: Signer;
    let minter: Signer;
    let upgrader: Signer;
    let user1: Signer;
    let user2: Signer;
    let roles: Record<string, string>;
    let mintAmount: bigint;

    // Store addresses for easier access
    let user1Address: string;
    let user2Address: string;
    let pauserAddress: string;
    let minterAddress: string;
    let defaultAdminAddress: string;

    // Use beforeEach to reset the state before each test
    beforeEach(async function () {
        // Load the fixture
        const fixture = await setupBaseERC20TokenFixture();

        // Assign all returned values from fixture
        baseERC20Token = fixture.baseERC20Token;
        deployer = fixture.deployer;
        defaultAdmin = fixture.defaultAdmin;
        pauser = fixture.pauser;
        minter = fixture.minter;
        upgrader = fixture.upgrader;
        user1 = fixture.user1;
        user2 = fixture.user2;
        roles = fixture.roles;
        mintAmount = fixture.mintAmount;

        // Get addresses for use in tests
        user1Address = await user1.getAddress();
        user2Address = await user2.getAddress();
        pauserAddress = await pauser.getAddress();
        minterAddress = await minter.getAddress();
        defaultAdminAddress = await defaultAdmin.getAddress();
    });

    describe("Initialization", function () {
        it("should correctly set the token name and symbol", async function () {
            expect(await baseERC20Token.name()).to.equal("Base ERC20 Token");
            expect(await baseERC20Token.symbol()).to.equal("BERC20");
        });

        it("should correctly assign roles", async function () {
            expect(await baseERC20Token.hasRole(roles.DEFAULT_ADMIN_ROLE, defaultAdminAddress)).to.be.true;
            expect(await baseERC20Token.hasRole(roles.PAUSER_ROLE, pauserAddress)).to.be.true;
            expect(await baseERC20Token.hasRole(roles.MINTER_ROLE, minterAddress)).to.be.true;
            expect(await baseERC20Token.hasRole(roles.UPGRADER_ROLE, await upgrader.getAddress())).to.be.true;
        });

        it("should start with the correct initial state", async function () {
            expect(await baseERC20Token.paused()).to.be.false;
            expect(await baseERC20Token.totalSupply()).to.equal(mintAmount * 2n); // User1 and User2 each got mintAmount
        });
    });

    describe("Role-Based Access Control", function () {
        it("should allow minter to mint tokens", async function () {
            const tokenAsMinter = getContractWithSigner(baseERC20Token, minter);
            const additionalAmount = ethers.parseEther("500");

            const initialBalance = await baseERC20Token.balanceOf(user1Address);
            await tokenAsMinter.mint(user1Address, additionalAmount);
            const finalBalance = await baseERC20Token.balanceOf(user1Address);

            expect(finalBalance).to.equal(initialBalance + additionalAmount);
        });

        it("should prevent non-minters from minting tokens", async function () {
            const tokenAsUser = getContractWithSigner(baseERC20Token, user1);
            const amount = ethers.parseEther("100");

            await expect(tokenAsUser.mint(user2Address, amount))
                .to.be.revertedWithCustomError(baseERC20Token, "AccessControlUnauthorizedAccount")
                .withArgs(user1Address, roles.MINTER_ROLE);
        });

        it("should allow pauser to pause and unpause the token", async function () {
            const tokenAsPauser = getContractWithSigner(baseERC20Token, pauser);

            // Test pausing
            await tokenAsPauser.pause();
            expect(await baseERC20Token.paused()).to.be.true;

            // Test that transfers are blocked when paused
            const tokenAsUser = getContractWithSigner(baseERC20Token, user1);
            const transferAmount = ethers.parseEther("10");
            await expect(tokenAsUser.transfer(user2Address, transferAmount))
                .to.be.revertedWithCustomError(baseERC20Token, "EnforcedPause");

            // Test unpausing
            await tokenAsPauser.unpause();
            expect(await baseERC20Token.paused()).to.be.false;

            // Test that transfers work after unpausing
            await tokenAsUser.transfer(user2Address, transferAmount);
            expect(await baseERC20Token.balanceOf(user2Address)).to.equal(mintAmount + transferAmount);
        });

        it("should prevent non-pausers from pausing the token", async function () {
            const tokenAsUser = getContractWithSigner(baseERC20Token, user1);

            await expect(tokenAsUser.pause())
                .to.be.revertedWithCustomError(baseERC20Token, "AccessControlUnauthorizedAccount")
                .withArgs(user1Address, roles.PAUSER_ROLE);
        });

        it("should allow admin to grant and revoke roles", async function () {
            const tokenAsAdmin = getContractWithSigner(baseERC20Token, defaultAdmin);

            // Grant minter role to user1
            await tokenAsAdmin.grantRole(roles.MINTER_ROLE, user1Address);
            expect(await baseERC20Token.hasRole(roles.MINTER_ROLE, user1Address)).to.be.true;

            // Now user1 should be able to mint
            const tokenAsUser1 = getContractWithSigner(baseERC20Token, user1);
            await tokenAsUser1.mint(user1Address, ethers.parseEther("100"));

            // Revoke minter role from user1
            await tokenAsAdmin.revokeRole(roles.MINTER_ROLE, user1Address);
            expect(await baseERC20Token.hasRole(roles.MINTER_ROLE, user1Address)).to.be.false;

            // Now user1 should not be able to mint
            await expect(tokenAsUser1.mint(user1Address, ethers.parseEther("100")))
                .to.be.revertedWithCustomError(baseERC20Token, "AccessControlUnauthorizedAccount");
        });
    });

    describe("Token Functionality", function () {
        it("should allow token transfers", async function () {
            const transferAmount = ethers.parseEther("100");
            const tokenAsUser1 = getContractWithSigner(baseERC20Token, user1);

            const initialBalanceUser1 = await baseERC20Token.balanceOf(user1Address);
            const initialBalanceUser2 = await baseERC20Token.balanceOf(user2Address);

            await tokenAsUser1.transfer(user2Address, transferAmount);

            const finalBalanceUser1 = await baseERC20Token.balanceOf(user1Address);
            const finalBalanceUser2 = await baseERC20Token.balanceOf(user2Address);

            expect(finalBalanceUser1).to.equal(initialBalanceUser1 - transferAmount);
            expect(finalBalanceUser2).to.equal(initialBalanceUser2 + transferAmount);
        });

        it("should handle approvals and transferFrom correctly", async function () {
            const approvalAmount = ethers.parseEther("150");
            const transferAmount = ethers.parseEther("100");

            const tokenAsUser1 = getContractWithSigner(baseERC20Token, user1);
            const tokenAsUser2 = getContractWithSigner(baseERC20Token, user2);

            // User1 approves User2 to spend tokens
            await tokenAsUser1.approve(user2Address, approvalAmount);
            expect(await baseERC20Token.allowance(user1Address, user2Address)).to.equal(approvalAmount);

            // User2 transfers tokens from User1 to themselves
            await tokenAsUser2.transferFrom(user1Address, user2Address, transferAmount);

            // Check balances
            expect(await baseERC20Token.balanceOf(user1Address)).to.equal(mintAmount - transferAmount);
            expect(await baseERC20Token.balanceOf(user2Address)).to.equal(mintAmount + transferAmount);

            // Check remaining allowance
            expect(await baseERC20Token.allowance(user1Address, user2Address)).to.equal(approvalAmount - transferAmount);
        });

        it("should allow token burning", async function () {
            const burnAmount = ethers.parseEther("50");
            const tokenAsUser1 = getContractWithSigner(baseERC20Token, user1);

            const initialSupply = await baseERC20Token.totalSupply();
            const initialBalance = await baseERC20Token.balanceOf(user1Address);

            await tokenAsUser1.burn(burnAmount);

            const finalSupply = await baseERC20Token.totalSupply();
            const finalBalance = await baseERC20Token.balanceOf(user1Address);

            expect(finalSupply).to.equal(initialSupply - burnAmount);
            expect(finalBalance).to.equal(initialBalance - burnAmount);
        });
    });

    describe("Voting Functionality", function () {
        it("should track voting power after delegation", async function () {
            const tokenAsUser1 = getContractWithSigner(baseERC20Token, user1);

            // Initial state - no delegation
            expect(await baseERC20Token.getVotes(user1Address)).to.equal(0n);

            // User1 delegates to self
            await tokenAsUser1.delegate(user1Address);

            // After delegation, voting power should match balance
            expect(await baseERC20Token.getVotes(user1Address)).to.equal(await baseERC20Token.balanceOf(user1Address));

            // Test transfer affects voting power
            await tokenAsUser1.transfer(user2Address, ethers.parseEther("200"));
            expect(await baseERC20Token.getVotes(user1Address)).to.equal(await baseERC20Token.balanceOf(user1Address));
        });

        it("should allow delegation to another address", async function () {
            const tokenAsUser1 = getContractWithSigner(baseERC20Token, user1);

            // Initial state
            expect(await baseERC20Token.getVotes(user2Address)).to.equal(0n);

            // User1 delegates to User2
            await tokenAsUser1.delegate(user2Address);

            // User2 should now have User1's voting power
            expect(await baseERC20Token.getVotes(user2Address)).to.equal(await baseERC20Token.balanceOf(user1Address));
            expect(await baseERC20Token.delegates(user1Address)).to.equal(user2Address);
        });
    });

    // More test sections could be added if needed
});