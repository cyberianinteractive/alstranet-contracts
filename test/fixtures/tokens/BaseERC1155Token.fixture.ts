// test/fixtures/tokens/BaseERC1155Token.fixture.ts
import { deployments, ethers, getNamedAccounts } from 'hardhat';
import { BaseERC1155Token } from '../../../typechain/contracts/protocol/tokens/BaseERC1155Token';

/**
 * Fixture specifically for BaseERC1155Token tests
 * Sets up the contract and necessary test data
 */
export async function setupBaseERC1155TokenFixture() {
    // Deploy the contract using tag
    await deployments.fixture(['BaseERC1155Token']);
    
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
    const baseERC1155Token = await ethers.getContract<BaseERC1155Token>('BaseERC1155Token');
    
    // Get role identifiers for testing access control
    const roles = {
        DEFAULT_ADMIN_ROLE: await baseERC1155Token.DEFAULT_ADMIN_ROLE(),
        PAUSER_ROLE: await baseERC1155Token.PAUSER_ROLE(),
        MINTER_ROLE: await baseERC1155Token.MINTER_ROLE(),
        UPGRADER_ROLE: await baseERC1155Token.UPGRADER_ROLE(),
        URI_SETTER_ROLE: await baseERC1155Token.URI_SETTER_ROLE(),
    };
    
    // Get addresses for users
    const user1Address = await signers.user1.getAddress();
    const user2Address = await signers.user2.getAddress();
    
    // Set a base URI for testing
    const baseERC1155TokenAsAdmin = baseERC1155Token.connect(signers.defaultAdmin);
    await baseERC1155TokenAsAdmin.setURI("https://token-cdn-domain/{id}.json");
    
    // Mint some tokens for testing
    const baseERC1155TokenAsMinter = baseERC1155Token.connect(signers.minter);
    
    // Test token IDs
    const tokenIds = [1, 2, 3, 4, 5];
    
    // Mint token ID 1 to user1 (100 units)
    await baseERC1155TokenAsMinter.mint(user1Address, tokenIds[0], 100n, "0x");
    
    // Mint token ID 2 to user1 (200 units)
    await baseERC1155TokenAsMinter.mint(user1Address, tokenIds[1], 200n, "0x");
    
    // Mint token ID 3 to user2 (150 units)
    await baseERC1155TokenAsMinter.mint(user2Address, tokenIds[2], 150n, "0x");
    
    // Batch mint token IDs 4 and 5 to user2 (50 and 75 units)
    await baseERC1155TokenAsMinter.mintBatch(
        user2Address, 
        [tokenIds[3], tokenIds[4]], 
        [50n, 75n], 
        "0x"
    );

    return {
        baseERC1155Token,
        ...signers,
        tokenIds,
        roles,
    };
}