// test/unit/tokens/BaseERC721Token.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { setupBaseERC721TokenFixture } from "../../fixtures/tokens/BaseERC721Token.fixture";
import { getContractWithSigner } from "../../common";
import { BaseERC721Token } from "../../../typechain/contracts/protocol/tokens/BaseERC721Token";
import { Signer } from "ethers";

describe("BaseERC721Token", function () {
    // Test variables
    let baseERC721Token: BaseERC721Token;
    let deployer: Signer;
    let defaultAdmin: Signer;
    let pauser: Signer;
    let minter: Signer;
    let upgrader: Signer;
    let user1: Signer;
    let user2: Signer;
    let roles: Record<string, string>;
    let tokenIds: {
        explicit: number[];
        auto: number[];
        batch: number[];
    };

    // Store addresses for easier access
    let user1Address: string;
    let user2Address: string;
    let pauserAddress: string;
    let minterAddress: string;
    let defaultAdminAddress: string;

    // Use beforeEach to reset the state before each test
    beforeEach(async function () {
        // Load the fixture
        const fixture = await setupBaseERC721TokenFixture();

        // Assign all returned values from fixture
        baseERC721Token = fixture.baseERC721Token;
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
        it("should correctly set the token name and symbol", async function () {
            expect(await baseERC721Token.name()).to.equal("Base NFT 721 Token");
            expect(await baseERC721Token.symbol()).to.equal("BNFT721");
        });

        it("should correctly assign roles", async function () {
            expect(await baseERC721Token.hasRole(roles.DEFAULT_ADMIN_ROLE, defaultAdminAddress)).to.be.true;
            expect(await baseERC721Token.hasRole(roles.PAUSER_ROLE, pauserAddress)).to.be.true;
            expect(await baseERC721Token.hasRole(roles.MINTER_ROLE, minterAddress)).to.be.true;
            expect(await baseERC721Token.hasRole(roles.UPGRADER_ROLE, await upgrader.getAddress())).to.be.true;
        });

        it("should start with the correct initial state", async function () {
            expect(await baseERC721Token.paused()).to.be.false;
            expect(await baseERC721Token.totalSupply()).to.equal(8n); // 3+3 for user1 + 2 for user2
            expect(await baseERC721Token.balanceOf(user1Address)).to.equal(6n);
            expect(await baseERC721Token.balanceOf(user2Address)).to.equal(2n);
        });
    });

    describe("Role-Based Access Control", function () {
        it("should allow minter to mint tokens with explicit URI", async function () {
            const tokenAsMinter = getContractWithSigner(baseERC721Token, minter);
            const initialBalance = await baseERC721Token.balanceOf(user1Address);
            const initialSupply = await baseERC721Token.totalSupply();

            await tokenAsMinter.safeMint(user1Address, "ipfs://new-test-hash");

            expect(await baseERC721Token.balanceOf(user1Address)).to.equal(initialBalance + 1n);
            expect(await baseERC721Token.totalSupply()).to.equal(initialSupply + 1n);
        });
        
        it("should allow minter to mint tokens with auto-generated URI", async function () {
            const tokenAsMinter = getContractWithSigner(baseERC721Token, minter);
            const initialBalance = await baseERC721Token.balanceOf(user1Address);
            const initialSupply = await baseERC721Token.totalSupply();
        
            // Set the base URI explicitly before minting the token
            await getContractWithSigner(baseERC721Token, defaultAdmin).setBaseURI("ipfs://collection-hash/");
        
            await tokenAsMinter.safeMintAutoURI(user1Address);
            
            const newTokenId = initialSupply; // Token ID should be the previous total supply
            expect(await baseERC721Token.balanceOf(user1Address)).to.equal(initialBalance + 1n);
            expect(await baseERC721Token.totalSupply()).to.equal(initialSupply + 1n);
            expect(await baseERC721Token.tokenURI(newTokenId)).to.equal(`ipfs://collection-hash/${newTokenId}`);
        });
        
        it("should allow minter to batch mint tokens", async function () {
            const tokenAsMinter = getContractWithSigner(baseERC721Token, minter);
            const initialBalance = await baseERC721Token.balanceOf(user2Address);
            const initialSupply = await baseERC721Token.totalSupply();
            const batchSize = 5;

            await tokenAsMinter.batchMintAutoURI(user2Address, batchSize);
            
            expect(await baseERC721Token.balanceOf(user2Address)).to.equal(initialBalance + BigInt(batchSize));
            expect(await baseERC721Token.totalSupply()).to.equal(initialSupply + BigInt(batchSize));
        });

        it("should prevent non-minters from minting tokens", async function () {
            const tokenAsUser = getContractWithSigner(baseERC721Token, user1);

            await expect(tokenAsUser.safeMint(user2Address, "ipfs://test-uri"))
                .to.be.revertedWithCustomError(baseERC721Token, "AccessControlUnauthorizedAccount")
                .withArgs(user1Address, roles.MINTER_ROLE);
        });

        it("should allow pauser to pause and unpause the token", async function () {
            const tokenAsPauser = getContractWithSigner(baseERC721Token, pauser);
            const tokenAsUser1 = getContractWithSigner(baseERC721Token, user1);

            // Test pausing
            await tokenAsPauser.pause();
            expect(await baseERC721Token.paused()).to.be.true;

            // Test that transfers are blocked when paused
            await expect(tokenAsUser1.transferFrom(user1Address, user2Address, 0))
                .to.be.revertedWithCustomError(baseERC721Token, "EnforcedPause");

            // Test unpausing
            await tokenAsPauser.unpause();
            expect(await baseERC721Token.paused()).to.be.false;

            // Approve and test that transfers work after unpausing
            await tokenAsUser1.approve(user2Address, 0);
            const tokenAsUser2 = getContractWithSigner(baseERC721Token, user2);
            await tokenAsUser2.transferFrom(user1Address, user2Address, 0);
            expect(await baseERC721Token.ownerOf(0)).to.equal(user2Address);
        });

        it("should prevent non-pausers from pausing the token", async function () {
            const tokenAsUser = getContractWithSigner(baseERC721Token, user1);

            await expect(tokenAsUser.pause())
                .to.be.revertedWithCustomError(baseERC721Token, "AccessControlUnauthorizedAccount")
                .withArgs(user1Address, roles.PAUSER_ROLE);
        });
        
        it("should allow URI setter to update the base URI", async function () {
            const tokenAsAdmin = getContractWithSigner(baseERC721Token, defaultAdmin);
            const newBaseURI = "ipfs://new-collection-hash/";
            
            // Update the base URI
            await tokenAsAdmin.setBaseURI(newBaseURI);
            
            // Check that auto-generated URIs use the new base URI
            const tokenId = tokenIds.auto[0];
            expect(await baseERC721Token.tokenURI(tokenId)).to.equal(`${newBaseURI}${tokenId}`);
        });
        
        it("should prevent non-URI setters from updating the base URI", async function () {
            const tokenAsUser = getContractWithSigner(baseERC721Token, user1);
            const newBaseURI = "ipfs://unauthorized-uri/";
            
            await expect(tokenAsUser.setBaseURI(newBaseURI))
                .to.be.revertedWithCustomError(baseERC721Token, "AccessControlUnauthorizedAccount")
                .withArgs(user1Address, roles.URI_SETTER_ROLE);
        });

        it("should allow admin to grant and revoke roles", async function () {
            const tokenAsAdmin = getContractWithSigner(baseERC721Token, defaultAdmin);

            // Grant minter role to user1
            await tokenAsAdmin.grantRole(roles.MINTER_ROLE, user1Address);
            expect(await baseERC721Token.hasRole(roles.MINTER_ROLE, user1Address)).to.be.true;

            // Now user1 should be able to mint
            const tokenAsUser1 = getContractWithSigner(baseERC721Token, user1);
            await tokenAsUser1.safeMint(user1Address, "ipfs://user-minted-token");

            // Revoke minter role from user1
            await tokenAsAdmin.revokeRole(roles.MINTER_ROLE, user1Address);
            expect(await baseERC721Token.hasRole(roles.MINTER_ROLE, user1Address)).to.be.false;

            // Now user1 should not be able to mint
            await expect(tokenAsUser1.safeMint(user1Address, "ipfs://should-fail"))
                .to.be.revertedWithCustomError(baseERC721Token, "AccessControlUnauthorizedAccount");
        });
    });

    describe("Token Functionality", function () {
        it("should store and retrieve token URIs correctly for explicitly set URIs", async function () {
            // Need to set base URI to empty for explicit URI tests
            await getContractWithSigner(baseERC721Token, defaultAdmin).setBaseURI("");
            
            // Get the first token with explicit URI
            const tokenId = tokenIds.explicit[0]; // Should be 0
            const expectedUri = "ipfs://test-ipfs-hash-0";
            
            // Check that URI is stored correctly
            expect(await baseERC721Token.tokenURI(tokenId)).to.equal(expectedUri);
        });
        
        it("should generate URIs correctly for auto URI tokens", async function () {
            // Set the base URI for auto-generated tokens
            await getContractWithSigner(baseERC721Token, defaultAdmin).setBaseURI("ipfs://collection-hash/");
            
            // Get the first token with auto URI
            const tokenId = tokenIds.auto[0]; // Should be 3
            const expectedUri = "ipfs://collection-hash/3";
            
            // Check that URI is generated correctly from baseURI
            expect(await baseERC721Token.tokenURI(tokenId)).to.equal(expectedUri);
        });

        it("should generate URIs correctly for batch minted tokens", async function () {
            // Set the base URI for auto-generated tokens
            await getContractWithSigner(baseERC721Token, defaultAdmin).setBaseURI("ipfs://collection-hash/");
            
            // Get a token from batch minting
            const tokenId = tokenIds.batch[1]; // Should be 6
            const expectedUri = "ipfs://collection-hash/6";
            
            // Check that URI is generated correctly from baseURI
            expect(await baseERC721Token.tokenURI(tokenId)).to.equal(expectedUri);
        });

        it("should allow token transfers", async function () {
            const tokenId = 0; // First token minted to user1
            const tokenAsUser1 = getContractWithSigner(baseERC721Token, user1);
            
            // Approve user2 to transfer the token
            await tokenAsUser1.approve(user2Address, tokenId);
            
            // Check approval is set correctly
            expect(await baseERC721Token.getApproved(tokenId)).to.equal(user2Address);
            
            // User2 transfers the token to themselves
            const tokenAsUser2 = getContractWithSigner(baseERC721Token, user2);
            await tokenAsUser2.transferFrom(user1Address, user2Address, tokenId);
            
            expect(await baseERC721Token.ownerOf(tokenId)).to.equal(user2Address);
            // User1 had 6 tokens (3 explicit + 3 batch), now has 5
            expect(await baseERC721Token.balanceOf(user1Address)).to.equal(5n);
            // User2 had 2 tokens (2 auto), now has 3
            expect(await baseERC721Token.balanceOf(user2Address)).to.equal(3n);
        });

        it("should handle safe transfers correctly", async function () {
            const tokenId = 1; // Second token minted to user1
            const tokenAsUser1 = getContractWithSigner(baseERC721Token, user1);
            
            // User1 transfers the token directly to user2
            await tokenAsUser1['safeTransferFrom(address,address,uint256)'](
                user1Address, 
                user2Address, 
                tokenId
            );
            
            // Check ownership has changed
            expect(await baseERC721Token.ownerOf(tokenId)).to.equal(user2Address);
        });

        it("should allow token burning", async function () {
            const tokenId = 2; // Third token minted to user1
            const tokenAsUser1 = getContractWithSigner(baseERC721Token, user1);
            
            const initialSupply = await baseERC721Token.totalSupply();
            const initialBalance = await baseERC721Token.balanceOf(user1Address);
            
            // Burn the token
            await tokenAsUser1.burn(tokenId);
            
            // Check the token is burned
            await expect(baseERC721Token.ownerOf(tokenId)).to.be.reverted;
            expect(await baseERC721Token.totalSupply()).to.equal(initialSupply - 1n);
            expect(await baseERC721Token.balanceOf(user1Address)).to.equal(initialBalance - 1n);
        });
    });

    describe("Enumeration", function () {
        it("should correctly enumerate tokens", async function () {
            // Get total supply
            const totalSupply = await baseERC721Token.totalSupply();
            expect(totalSupply).to.equal(8n);
            
            // Check each token by index
            for (let i = 0; i < Number(totalSupply); i++) {
                const tokenId = await baseERC721Token.tokenByIndex(i);
                expect(tokenId).to.not.be.undefined;
                expect(await baseERC721Token.ownerOf(tokenId)).to.not.be.undefined;
            }
        });
        
        it("should correctly enumerate tokens by owner", async function () {
            // Check tokens owned by user1
            const user1Balance = await baseERC721Token.balanceOf(user1Address);
            for (let i = 0; i < Number(user1Balance); i++) {
                const tokenId = await baseERC721Token.tokenOfOwnerByIndex(user1Address, i);
                expect(await baseERC721Token.ownerOf(tokenId)).to.equal(user1Address);
            }
            
            // Check tokens owned by user2
            const user2Balance = await baseERC721Token.balanceOf(user2Address);
            for (let i = 0; i < Number(user2Balance); i++) {
                const tokenId = await baseERC721Token.tokenOfOwnerByIndex(user2Address, i);
                expect(await baseERC721Token.ownerOf(tokenId)).to.equal(user2Address);
            }
        });
    });

    describe("Voting Functionality", function () {
        it("should track voting power after delegation", async function () {
            const tokenAsUser1 = getContractWithSigner(baseERC721Token, user1);

            // Initial state - no delegation
            expect(await baseERC721Token.getVotes(user1Address)).to.equal(0n);

            // User1 delegates to self
            await tokenAsUser1.delegate(user1Address);

            // After delegation, voting power should match number of NFTs
            expect(await baseERC721Token.getVotes(user1Address)).to.equal(
                await baseERC721Token.balanceOf(user1Address)
            );

            // Test transfer affects voting power
            await tokenAsUser1['safeTransferFrom(address,address,uint256)'](
                user1Address, 
                user2Address, 
                0
            );
            
            expect(await baseERC721Token.getVotes(user1Address)).to.equal(
                await baseERC721Token.balanceOf(user1Address)
            );
        });

        it("should allow delegation to another address", async function () {
            const tokenAsUser1 = getContractWithSigner(baseERC721Token, user1);

            // Initial state
            expect(await baseERC721Token.getVotes(user2Address)).to.equal(0n);

            // User1 delegates to User2
            await tokenAsUser1.delegate(user2Address);

            // User2 should now have User1's voting power
            expect(await baseERC721Token.getVotes(user2Address)).to.equal(
                await baseERC721Token.balanceOf(user1Address)
            );
            expect(await baseERC721Token.delegates(user1Address)).to.equal(user2Address);
        });
    });

    // More test sections could be added if needed
});