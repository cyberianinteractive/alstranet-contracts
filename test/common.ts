// test/common.ts
import { ethers } from 'hardhat';
import { Signer } from 'ethers';

/**
 * Helper function to get all signers with appropriate names
 */
export async function getSigners() {
    const [deployer, defaultAdmin, pauser, minter, upgrader, feeManager, vestingManager, stakingManager, ...users] = await ethers.getSigners();

    return {
        // Named signers
        deployer,
        defaultAdmin,
        pauser,
        minter,
        upgrader,
        feeManager,
        vestingManager,
        stakingManager,

        // Test users
        user1: users[0],
        user2: users[1],
        user3: users[2],
    };
}

/**
 * Helper function to get a contract instance connected to a specific signer
 */
export function getContractWithSigner<T>(contract: T, signer: Signer): T {
    return (contract as any).connect(signer) as T;
}