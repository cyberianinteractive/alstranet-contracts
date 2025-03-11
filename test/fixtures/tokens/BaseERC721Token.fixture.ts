// test/fixtures/tokens/BaseERC721Token.fixture.ts
import { deployments, ethers, getNamedAccounts } from 'hardhat';
import { BaseERC721Token } from '../../../typechain/contracts/protocol/tokens/BaseERC721Token';

/**
 * Fixture specifically for BaseERC721Token tests
 * Sets up the contract and necessary test data
 */
export async function setupBaseERC721TokenFixture() {
    // Deploy the contract using tag
    await deployments.fixture(['BaseERC721Token']);
    
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
        // Get some extra signers for testing as users
        user1: allSigners[10], // Using account #10 to avoid collision with named accounts
        user2: allSigners[11],
    };

    // Get the contract instance with proper typing
    const baseERC721Token = await ethers.getContract<BaseERC721Token>('BaseERC721Token');
    
    // Get role identifiers for testing access control
    const roles = {
        DEFAULT_ADMIN_ROLE: await baseERC721Token.DEFAULT_ADMIN_ROLE(),
        PAUSER_ROLE: await baseERC721Token.PAUSER_ROLE(),
        MINTER_ROLE: await baseERC721Token.MINTER_ROLE(),
        UPGRADER_ROLE: await baseERC721Token.UPGRADER_ROLE(),
        URI_SETTER_ROLE: await baseERC721Token.URI_SETTER_ROLE(),
    };
    
    // Get addresses for users
    const user1Address = await signers.user1.getAddress();
    const user2Address = await signers.user2.getAddress();
    
    // Mint some NFTs for testing
    const baseERC721TokenAsMinter = baseERC721Token.connect(signers.minter);
    const baseERC721TokenAsAdmin = baseERC721Token.connect(signers.defaultAdmin);
    const tokenIds: {
        explicit: number[];
        auto: number[];
        batch: number[];
    } = {
        explicit: [],  // Tokens with explicit URIs
        auto: [],      // Tokens with auto-generated URIs
        batch: []      // Tokens from batch minting
    };
    
    // Set base URI for auto-generated URIs (do this before minting)
    await baseERC721TokenAsAdmin.setBaseURI("");
    
    // Mint 3 NFTs to user1 with explicit URIs
    for (let i = 0; i < 3; i++) {
        const tx = await baseERC721TokenAsMinter.safeMint(
            user1Address, 
            `ipfs://test-ipfs-hash-${i}`
        );
        const receipt = await tx.wait();
        tokenIds.explicit.push(i); // The tokenIds will be 0, 1, 2
    }
    
    // Now set the base URI for auto-generated URIs
    await baseERC721TokenAsAdmin.setBaseURI("ipfs://collection-hash/");
    
    // Mint 2 NFTs to user2 with auto URIs
    for (let i = 0; i < 2; i++) {
        const tx = await baseERC721TokenAsMinter.safeMintAutoURI(user2Address);
        const receipt = await tx.wait();
        tokenIds.auto.push(i + 3); // The tokenIds will be 3, 4
    }
    
    // Batch mint 3 NFTs to user1
    const batchTx = await baseERC721TokenAsMinter.batchMintAutoURI(user1Address, 3);
    const batchReceipt = await batchTx.wait();
    tokenIds.batch.push(5, 6, 7); // The tokenIds will be 5, 6, 7

    // Note: We are keeping the base URI as "ipfs://collection-hash/" 
    // at the end of the fixture to support auto-URI tests.

    return {
        baseERC721Token,
        ...signers,
        tokenIds,
        roles,
    };
}