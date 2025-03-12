// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "../protocol/libraries/FeeLibrary.sol";

/**
 * @title FeeLibraryTestWrapper
 * @dev A testing wrapper contract that exposes the internal functions of FeeLibrary
 *      as public functions for testing purposes. This contract is NOT meant for
 *      production use and should only be deployed in test environments.
 *
 *      This pattern allows us to:
 *      1. Maintain proper library design with internal functions
 *      2. Still be able to test library functions directly
 *      3. Generate accurate test coverage metrics
 */
contract FeeLibraryTestWrapper {
    /**
     * @dev Exposes the FEE_DENOMINATOR constant from FeeLibrary
     * @return The denominator used for basis point calculations
     */
    function getFEE_DENOMINATOR() public pure returns (uint256) {
        return FeeLibrary.FEE_DENOMINATOR;
    }

    /**
     * @dev Exposes the MIN_FEE constant from FeeLibrary
     * @return The minimum fee amount
     */
    function getMIN_FEE() public pure returns (uint256) {
        return FeeLibrary.MIN_FEE;
    }

    /**
     * @dev Wrapper for FeeLibrary.calculateMarketplaceFee
     * @param price The listing price
     * @param baseFeePercentage Base fee percentage (in basis points)
     * @param factionId The faction ID of the seller
     * @param territoryId The territory ID where the listing is created
     * @param controllingFaction The faction controlling the territory
     * @param percentages Distribution percentages for different stakeholders
     * @return totalFee Total fee amount
     * @return distribution Struct with fee distribution breakdown
     */
    function calculateMarketplaceFee(
        uint256 price,
        uint256 baseFeePercentage,
        uint8 factionId,
        uint256 territoryId,
        uint8 controllingFaction,
        FeeLibrary.FeeDistributionPercentages memory percentages
    )
        public
        pure
        returns (
            uint256 totalFee,
            FeeLibrary.FeeDistribution memory distribution
        )
    {
        return
            FeeLibrary.calculateMarketplaceFee(
                price,
                baseFeePercentage,
                factionId,
                territoryId,
                controllingFaction,
                percentages
            );
    }

    /**
     * @dev Wrapper for FeeLibrary.adjustFeeByTerritory
     * @param baseFeePercentage Base fee percentage (in basis points)
     * @param territoryId The territory ID where the listing is created
     * @param sellerFactionId The seller's faction ID
     * @param controllingFaction The faction controlling the territory
     * @return adjustedFeePercentage The adjusted fee percentage
     */
    function adjustFeeByTerritory(
        uint256 baseFeePercentage,
        uint256 territoryId,
        uint8 sellerFactionId,
        uint8 controllingFaction
    ) public pure returns (uint256 adjustedFeePercentage) {
        return
            FeeLibrary.adjustFeeByTerritory(
                baseFeePercentage,
                territoryId,
                sellerFactionId,
                controllingFaction
            );
    }

    /**
     * @dev Wrapper for FeeLibrary.distributeFees
     * @param totalFee The total fee amount
     * @param percentages The distribution percentages
     * @param sellerFactionId The seller's faction ID
     * @param controllingFaction The faction controlling the territory
     * @return distribution Structure with the distributed amounts
     */
    function distributeFees(
        uint256 totalFee,
        FeeLibrary.FeeDistributionPercentages memory percentages,
        uint8 sellerFactionId,
        uint8 controllingFaction
    ) public pure returns (FeeLibrary.FeeDistribution memory distribution) {
        return
            FeeLibrary.distributeFees(
                totalFee,
                percentages,
                sellerFactionId,
                controllingFaction
            );
    }

    /**
     * @dev Wrapper for FeeLibrary.calculateTransactionTax
     * @param amount The transaction amount
     * @param senderFaction Faction ID of the sender
     * @param receiverFaction Faction ID of the receiver
     * @param baseTaxRate Base tax rate (in basis points)
     * @return tax The calculated tax amount
     */
    function calculateTransactionTax(
        uint256 amount,
        uint8 senderFaction,
        uint8 receiverFaction,
        uint256 baseTaxRate
    ) public pure returns (uint256 tax) {
        return
            FeeLibrary.calculateTransactionTax(
                amount,
                senderFaction,
                receiverFaction,
                baseTaxRate
            );
    }

    /**
     * @dev Wrapper for FeeLibrary.distributeTax
     * @param taxAmount The total tax amount
     * @param burnPercentage Percentage of tax to burn (in basis points)
     * @param senderFaction Faction ID of the sender
     * @param receiverFaction Faction ID of the receiver
     * @return burnAmount Amount to burn
     * @return daoAmount Amount for DAO treasury
     * @return factionAmounts Array of amounts for each faction
     */
    function distributeTax(
        uint256 taxAmount,
        uint256 burnPercentage,
        uint8 senderFaction,
        uint8 receiverFaction
    )
        public
        pure
        returns (
            uint256 burnAmount,
            uint256 daoAmount,
            uint256[] memory factionAmounts
        )
    {
        return
            FeeLibrary.distributeTax(
                taxAmount,
                burnPercentage,
                senderFaction,
                receiverFaction
            );
    }
}
