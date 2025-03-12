// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title FeeLibrary
 * @dev Library for fee calculations and distribution in the Police & Thief ecosystem.
 * Handles marketplace fees, transaction taxes, and fee distribution among various stakeholders.
 * Designed to be used by NFTMarketplace, TreasuryManagement and other fee-handling contracts.
 */
library FeeLibrary {
    // Fee denominator for basis points calculations (100% = 10000)
    uint256 internal constant FEE_DENOMINATOR = 10000;

    // Minimum fee to prevent dust amounts
    uint256 internal constant MIN_FEE = 1000; // Minimum fee of 1000 wei to prevent dust transactions

    /**
     * @dev Structure for fee distribution breakdown
     */
    struct FeeDistribution {
        uint256 daoTreasuryAmount; // Amount allocated to DAO treasury
        uint256 territoryControllerAmount; // Amount allocated to territory controller
        uint256 sellerFactionAmount; // Amount allocated to seller's faction
        uint256 burnAmount; // Amount to be burned
    }

    /**
     * @dev Structure for fee distribution percentages
     */
    struct FeeDistributionPercentages {
        uint256 daoTreasuryPercentage; // Percentage allocated to DAO treasury (basis points)
        uint256 territoryControllerPercentage; // Percentage allocated to territory controller (basis points)
        uint256 sellerFactionPercentage; // Percentage allocated to seller's faction (basis points)
        uint256 burnPercentage; // Percentage to be burned (basis points)
    }

    /**
     * @dev Calculates marketplace fees based on listing price and parameters
     * @param price The listing price
     * @param baseFeePercentage Base fee percentage (in basis points, e.g. 250 = 2.5%)
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
        FeeDistributionPercentages memory percentages
    )
        internal
        pure
        returns (uint256 totalFee, FeeDistribution memory distribution)
    {
        // Apply territory-based fee adjustment
        uint256 adjustedFeePercentage = adjustFeeByTerritory(
            baseFeePercentage,
            territoryId,
            factionId,
            controllingFaction
        );

        // Calculate total fee
        totalFee = (price * adjustedFeePercentage) / FEE_DENOMINATOR;

        // Ensure minimum fee if price is non-zero
        if (price > 0 && totalFee < MIN_FEE) {
            totalFee = MIN_FEE;
        }

        // Calculate fee distribution
        distribution = distributeFees(
            totalFee,
            percentages,
            factionId,
            controllingFaction
        );

        return (totalFee, distribution);
    }

    /**
     * @dev Adjusts marketplace fee based on territory control and faction
     * Sellers get discounts in territories controlled by their faction
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
    ) internal pure returns (uint256 adjustedFeePercentage) {
        // Start with base fee
        adjustedFeePercentage = baseFeePercentage;

        // No territory association or no controlling faction
        if (territoryId == 0 || controllingFaction == 0) {
            return baseFeePercentage;
        }

        // Seller gets a discount if their faction controls the territory
        if (sellerFactionId == controllingFaction) {
            // 30% discount for selling in your faction's territory
            adjustedFeePercentage = (baseFeePercentage * 70) / 100;
        }

        return adjustedFeePercentage;
    }

    /**
     * @dev Distributes total fee among various stakeholders
     * @param totalFee The total fee amount
     * @param percentages The distribution percentages
     * @param sellerFactionId The seller's faction ID
     * @param controllingFaction The faction controlling the territory
     * @return distribution Structure with the distributed amounts
     */
    function distributeFees(
        uint256 totalFee,
        FeeDistributionPercentages memory percentages,
        uint8 sellerFactionId,
        uint8 controllingFaction
    ) internal pure returns (FeeDistribution memory distribution) {
        // Calculate DAO treasury amount
        distribution.daoTreasuryAmount =
            (totalFee * percentages.daoTreasuryPercentage) /
            FEE_DENOMINATOR;

        // Calculate territory controller amount (only if there is a controlling faction)
        if (controllingFaction > 0) {
            distribution.territoryControllerAmount =
                (totalFee * percentages.territoryControllerPercentage) /
                FEE_DENOMINATOR;
        }

        // Calculate seller faction amount (only if seller belongs to a faction)
        if (sellerFactionId > 0) {
            distribution.sellerFactionAmount =
                (totalFee * percentages.sellerFactionPercentage) /
                FEE_DENOMINATOR;
        }

        // Calculate burn amount
        distribution.burnAmount =
            (totalFee * percentages.burnPercentage) /
            FEE_DENOMINATOR;

        // Adjust for rounding errors by ensuring the total equals the input fee
        uint256 totalDistributed = distribution.daoTreasuryAmount +
            distribution.territoryControllerAmount +
            distribution.sellerFactionAmount +
            distribution.burnAmount;

        // If there's a difference due to rounding, add it to the DAO treasury
        if (totalDistributed < totalFee) {
            distribution.daoTreasuryAmount += (totalFee - totalDistributed);
        }

        return distribution;
    }

    /**
     * @dev Calculates transaction tax based on sender and receiver factions
     * Cross-faction transactions have higher taxes than within-faction transactions
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
    ) internal pure returns (uint256 tax) {
        // No tax if amount is 0
        if (amount == 0) {
            return 0;
        }

        // Start with base tax rate
        uint256 adjustedTaxRate = baseTaxRate;

        // Adjust tax rate based on faction relationship
        if (senderFaction > 0 && receiverFaction > 0) {
            if (senderFaction == receiverFaction) {
                // Same faction transactions get a 50% discount
                adjustedTaxRate = (baseTaxRate * 50) / 100;
            } else {
                // Cross-faction transactions get a 50% premium
                adjustedTaxRate = (baseTaxRate * 150) / 100;
            }
        }

        // Calculate tax amount
        tax = (amount * adjustedTaxRate) / FEE_DENOMINATOR;

        // Ensure minimum tax if amount is non-zero
        if (tax < MIN_FEE) {
            tax = MIN_FEE;
        }

        return tax;
    }

    /**
     * @dev Splits tax between burning and distribution to factions
     * @param taxAmount The total tax amount
     * @param burnPercentage Percentage of tax to burn (in basis points)
     * @param senderFaction Faction ID of the sender
     * @param receiverFaction Faction ID of the receiver
     * @return burnAmount Amount to burn
     * @return daoAmount Amount for DAO treasury
     * @return factionAmounts Array of amounts for each faction (indexed by faction ID)
     */
    function distributeTax(
        uint256 taxAmount,
        uint256 burnPercentage,
        uint8 senderFaction,
        uint8 receiverFaction
    )
        internal
        pure
        returns (
            uint256 burnAmount,
            uint256 daoAmount,
            uint256[] memory factionAmounts
        )
    {
        // Calculate burn amount
        burnAmount = (taxAmount * burnPercentage) / FEE_DENOMINATOR;

        // Remaining amount after burning
        uint256 remainingAmount = taxAmount - burnAmount;

        // Allocate 30% to DAO treasury
        daoAmount = (remainingAmount * 3000) / FEE_DENOMINATOR;

        // Initialize faction amounts array (index 0 not used, 1-3 for factions)
        factionAmounts = new uint256[](4);

        // Remaining amount for factions
        uint256 factionsAmount = remainingAmount - daoAmount;

        // Distribute to factions based on transaction participants
        if (
            senderFaction > 0 &&
            senderFaction < 4 &&
            receiverFaction > 0 &&
            receiverFaction < 4
        ) {
            if (senderFaction == receiverFaction) {
                // Same faction gets all faction allocation
                factionAmounts[senderFaction] = factionsAmount;
            } else {
                // Split between the two factions
                factionAmounts[senderFaction] = factionsAmount / 2;
                factionAmounts[receiverFaction] =
                    factionsAmount -
                    factionAmounts[senderFaction];
            }
        } else if (senderFaction > 0 && senderFaction < 4) {
            // Only sender has a faction
            factionAmounts[senderFaction] = factionsAmount;
        } else if (receiverFaction > 0 && receiverFaction < 4) {
            // Only receiver has a faction
            factionAmounts[receiverFaction] = factionsAmount;
        } else {
            // No faction involved, add to DAO amount
            daoAmount += factionsAmount;
        }

        return (burnAmount, daoAmount, factionAmounts);
    }
}
