// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {IFactionRegistry} from "./IFactionRegistry.sol";
import {ITerritoryRegistry} from "./ITerritoryRegistry.sol";
import {ITreasuryManagement} from "./ITreasuryManagement.sol";

/**
 * @title INFTMarketplace
 * @dev Comprehensive interface for an NFT marketplace supporting both ERC721 and ERC1155 tokens
 * with features specific to the Police & Thief ecosystem including faction-based access control,
 * territory influence, rental system, and escrow mechanics.
 */
interface INFTMarketplace {
    /**
     * @dev Enum for listing types
     */
    enum ListingType {
        FixedPrice,
        Auction,
        Rental,
        BlackMarket,
        Escrow
    }

    /**
     * @dev Enum for NFT standard types
     */
    enum NFTStandard {
        Unsupported,
        ERC721,
        ERC1155
    }

    /**
     * @dev Struct for standard listing information
     */
    struct Listing {
        uint256 id;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 quantity;
        uint256 price;
        ListingType listingType;
        bool active;
        uint256 createdAt;
        uint8 factionRequirement; // 0 = No requirement, 1-3 = Specific faction required
        uint8 minimumRank; // 0 = No rank requirement, 1+ = Minimum rank required
        uint256 territoryId; // 0 = No territory association
    }

    /**
     * @dev Struct for auction-specific information
     */
    struct AuctionInfo {
        uint256 listingId;
        uint256 startingPrice;
        uint256 reservePrice;
        uint256 currentBid;
        address currentBidder;
        uint256 endTime;
        bool finalized;
    }

    /**
     * @dev Struct for rental-specific information
     */
    struct RentalInfo {
        uint256 listingId;
        uint256 duration; // Duration in seconds
        uint256 pricePerDay;
        address currentRenter;
        uint256 startTime;
        uint256 endTime;
        bool active;
    }

    /**
     * @dev Struct for escrow trade information
     */
    struct EscrowTrade {
        uint256 id;
        address initiator;
        address counterparty;
        address[] offerNftContracts;
        uint256[] offerTokenIds;
        uint256[] offerQuantities;
        address[] requestNftContracts;
        uint256[] requestTokenIds;
        uint256[] requestQuantities;
        uint256 initiatorAlstraAmount;
        uint256 counterpartyAlstraAmount;
        bool initiatorApproved;
        bool counterpartyApproved;
        bool completed;
        bool canceled;
        uint256 createdAt;
        uint256 expiresAt;
    }

    /**
     * @dev Struct for fee distribution configuration
     */
    struct FeeDistribution {
        uint256 daoTreasuryPercentage;
        uint256 territoryControllerPercentage;
        uint256 sellerFactionPercentage;
        uint256 burnPercentage;
    }

    // Events for standard listings
    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 quantity,
        uint256 price,
        ListingType listingType
    );
    
    event ListingUpdated(
        uint256 indexed listingId,
        uint256 newPrice
    );
    
    event ListingCanceled(uint256 indexed listingId);
    
    event ListingSold(
        uint256 indexed listingId,
        address indexed seller,
        address indexed buyer,
        uint256 price
    );

    // Events for auctions
    event AuctionCreated(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 endTime
    );
    
    event BidPlaced(
        uint256 indexed listingId,
        address indexed bidder,
        uint256 bidAmount
    );
    
    event AuctionFinalized(
        uint256 indexed listingId,
        address indexed winner,
        uint256 finalPrice
    );

    // Events for rentals
    event RentalCreated(
        uint256 indexed listingId,
        address indexed owner,
        address indexed nftContract,
        uint256 tokenId,
        uint256 pricePerDay,
        uint256 duration
    );
    
    event AssetRented(
        uint256 indexed listingId,
        address indexed renter,
        uint256 startTime,
        uint256 endTime
    );
    
    event RentalEnded(
        uint256 indexed listingId,
        address indexed renter
    );

    // Events for black market
    event BlackMarketListingCreated(
        uint256 indexed listingId,
        uint8 requiredFaction,
        uint8 minimumRank
    );

    // Events for escrow system
    event EscrowTradeCreated(
        uint256 indexed tradeId,
        address indexed initiator,
        address indexed counterparty
    );
    
    event EscrowTradeApproved(
        uint256 indexed tradeId,
        address indexed approver
    );
    
    event EscrowTradeCompleted(
        uint256 indexed tradeId
    );
    
    event EscrowTradeCanceled(
        uint256 indexed tradeId,
        address indexed canceledBy
    );

    // Events for marketplace administration
    event MarketplaceFeeUpdated(
        uint256 oldFeePercentage,
        uint256 newFeePercentage
    );
    
    event FeeDistributionUpdated(
        uint256 daoTreasuryPercentage,
        uint256 territoryControllerPercentage,
        uint256 sellerFactionPercentage,
        uint256 burnPercentage
    );

    /**
     * @dev Creates a new fixed price listing
     * @param nftContract The address of the NFT contract
     * @param tokenId The ID of the token
     * @param quantity The quantity to sell (1 for ERC721)
     * @param price The price for the entire listing
     * @param territoryId Optional territory ID where the listing is available (0 if global)
     * @return listingId The ID of the created listing
     */
    function createListing(
        address nftContract,
        uint256 tokenId,
        uint256 quantity,
        uint256 price,
        uint256 territoryId
    ) external returns (uint256);

    /**
     * @dev Updates the price of an existing listing
     * @param listingId The ID of the listing to update
     * @param newPrice The new price for the listing
     */
    function updateListingPrice(uint256 listingId, uint256 newPrice) external;

    /**
     * @dev Purchases a listing at the listed price
     * @param listingId The ID of the listing to purchase
     */
    function buyListing(uint256 listingId) external payable;

    /**
     * @dev Purchases a listing using Alstra tokens instead of native currency
     * @param listingId The ID of the listing to purchase
     */
    function buyListingWithAlstra(uint256 listingId) external;

    /**
     * @dev Cancels a listing that hasn't been sold yet
     * @param listingId The ID of the listing to cancel
     */
    function cancelListing(uint256 listingId) external;

    /**
     * @dev Creates a black market listing with faction restrictions
     * @param nftContract The address of the NFT contract
     * @param tokenId The ID of the token
     * @param quantity The quantity to sell (1 for ERC721)
     * @param price The price for the entire listing
     * @param requiredFaction The faction ID required to purchase (1=Law Enforcement, 2=Criminal, 3=Vigilante)
     * @param minimumRank The minimum rank required to purchase
     * @return listingId The ID of the created listing
     */
    function createBlackMarketListing(
        address nftContract,
        uint256 tokenId,
        uint256 quantity,
        uint256 price,
        uint8 requiredFaction,
        uint8 minimumRank
    ) external returns (uint256);

    /**
     * @dev Creates an auction for an NFT
     * @param nftContract The address of the NFT contract
     * @param tokenId The ID of the token
     * @param quantity The quantity to sell (1 for ERC721)
     * @param startingPrice The starting price for the auction
     * @param reservePrice The minimum price that must be met (0 for no reserve)
     * @param duration The duration of the auction in seconds
     * @return listingId The ID of the created auction
     */
    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 quantity,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 duration
    ) external returns (uint256);

    /**
     * @dev Places a bid on an auction
     * @param listingId The ID of the auction
     */
    function placeBid(uint256 listingId) external payable;

    /**
     * @dev Places a bid on an auction using Alstra tokens
     * @param listingId The ID of the auction
     * @param bidAmount The amount of Alstra tokens to bid
     */
    function placeBidWithAlstra(uint256 listingId, uint256 bidAmount) external;

    /**
     * @dev Finalizes an auction after it has ended
     * @param listingId The ID of the auction to finalize
     */
    function finalizeAuction(uint256 listingId) external;

    /**
     * @dev Creates a rental listing for an NFT
     * @param nftContract The address of the NFT contract
     * @param tokenId The ID of the token
     * @param pricePerDay The price per day in Alstra tokens
     * @param maxDuration The maximum rental duration in days
     * @return listingId The ID of the created rental listing
     */
    function createRentalListing(
        address nftContract,
        uint256 tokenId,
        uint256 pricePerDay,
        uint256 maxDuration
    ) external returns (uint256);

    /**
     * @dev Rents an asset from a rental listing
     * @param listingId The ID of the rental listing
     * @param durationInDays The number of days to rent for
     */
    function rentAsset(uint256 listingId, uint256 durationInDays) external payable;

    /**
     * @dev Rents an asset using Alstra tokens
     * @param listingId The ID of the rental listing
     * @param durationInDays The number of days to rent for
     */
    function rentAssetWithAlstra(uint256 listingId, uint256 durationInDays) external;

    /**
     * @dev Ends a rental and returns the asset to the owner
     * @param listingId The ID of the rental listing
     */
    function endRental(uint256 listingId) external;

    /**
     * @dev Claims an asset that has exceeded its rental period
     * @param listingId The ID of the rental listing
     */
    function claimExpiredRental(uint256 listingId) external;

    /**
     * @dev Creates an escrow trade between two parties
     * @param counterparty The address of the trade counterparty
     * @param offerNftContracts Array of NFT contract addresses being offered
     * @param offerTokenIds Array of token IDs being offered
     * @param offerQuantities Array of quantities being offered
     * @param requestNftContracts Array of NFT contract addresses being requested
     * @param requestTokenIds Array of token IDs being requested
     * @param requestQuantities Array of quantities being requested
     * @param initiatorAlstraAmount Amount of Alstra tokens offered by initiator (0 if none)
     * @param counterpartyAlstraAmount Amount of Alstra tokens requested from counterparty (0 if none)
     * @param expirationTime Timestamp when the trade offer expires (0 for no expiration)
     * @return tradeId The ID of the created escrow trade
     */
    function createEscrowTrade(
        address counterparty,
        address[] calldata offerNftContracts,
        uint256[] calldata offerTokenIds,
        uint256[] calldata offerQuantities,
        address[] calldata requestNftContracts,
        uint256[] calldata requestTokenIds,
        uint256[] calldata requestQuantities,
        uint256 initiatorAlstraAmount,
        uint256 counterpartyAlstraAmount,
        uint256 expirationTime
    ) external returns (uint256);

    /**
     * @dev Approves an escrow trade
     * @param tradeId The ID of the escrow trade
     */
    function approveEscrowTrade(uint256 tradeId) external;

    /**
     * @dev Cancels an escrow trade
     * @param tradeId The ID of the escrow trade
     */
    function cancelEscrowTrade(uint256 tradeId) external;

    /**
     * @dev Returns the current fee percentage charged by the marketplace
     * @return The fee percentage in basis points (e.g., 250 = 2.5%)
     */
    function getMarketplaceFeePercentage() external view returns (uint256);

    /**
     * @dev Returns the current fee distribution configuration
     * @return A FeeDistribution struct with the current fee allocation
     */
    function getFeeDistribution() external view returns (FeeDistribution memory);

    /**
     * @dev Returns the adjusted fee percentage for a territory
     * @param territoryId The ID of the territory
     * @return The fee percentage in basis points adjusted for territory control
     */
    function getFeeForTerritory(uint256 territoryId) external view returns (uint256);

    /**
     * @dev Returns whether a contract implements ERC721 or ERC1155
     * @param nftContract The address of the NFT contract to check
     * @return The NFT standard type
     */
    function getNFTStandard(address nftContract) external view returns (NFTStandard);

    /**
     * @dev Returns information about a listing
     * @param listingId The ID of the listing
     * @return The listing struct with all listing details
     */
    function getListing(uint256 listingId) external view returns (Listing memory);

    /**
     * @dev Returns information about an auction listing
     * @param listingId The ID of the auction listing
     * @return The auction information struct
     */
    function getAuctionInfo(uint256 listingId) external view returns (AuctionInfo memory);

    /**
     * @dev Returns information about a rental listing
     * @param listingId The ID of the rental listing
     * @return The rental information struct
     */
    function getRentalInfo(uint256 listingId) external view returns (RentalInfo memory);

    /**
     * @dev Returns information about an escrow trade
     * @param tradeId The ID of the escrow trade
     * @return The escrow trade struct
     */
    function getEscrowTrade(uint256 tradeId) external view returns (EscrowTrade memory);

    /**
     * @dev Checks if a user can purchase a specific listing
     * @param user The address of the user
     * @param listingId The ID of the listing
     * @return isAllowed Whether the user is allowed to purchase the listing
     * @return reason If not allowed, the reason why (empty string if allowed)
     */
    function canPurchaseListing(address user, uint256 listingId) external view returns (bool isAllowed, string memory reason);

    /**
     * @dev Returns all active listings for a given NFT contract and token ID
     * @param nftContract The address of the NFT contract
     * @param tokenId The ID of the token
     * @return An array of listing IDs
     */
    function getActiveListingsForToken(address nftContract, uint256 tokenId) external view returns (uint256[] memory);

    /**
     * @dev Returns all active listings created by a user
     * @param user The address of the user
     * @return An array of listing IDs
     */
    function getActiveListingsByUser(address user) external view returns (uint256[] memory);

    /**
     * @dev Returns all active listings by faction requirement
     * @param factionId The faction ID (1=Law Enforcement, 2=Criminal, 3=Vigilante)
     * @return An array of listing IDs
     */
    function getActiveListingsByFaction(uint8 factionId) external view returns (uint256[] memory);

    /**
     * @dev Returns all active listings in a territory
     * @param territoryId The ID of the territory
     * @return An array of listing IDs
     */
    function getActiveListingsByTerritory(uint256 territoryId) external view returns (uint256[] memory);

    /**
     * @dev Returns the Alstra token address used by the marketplace
     * @return The address of the Alstra token contract
     */
    function getAlstraTokenAddress() external view returns (address);

    /**
     * @dev Returns the FactionRegistry address used by the marketplace
     * @return The address of the FactionRegistry contract
     */
    function getFactionRegistryAddress() external view returns (address);

    /**
     * @dev Returns the TerritoryRegistry address used by the marketplace
     * @return The address of the TerritoryRegistry contract
     */
    function getTerritoryRegistryAddress() external view returns (address);

    /**
     * @dev Returns the TreasuryManagement address used by the marketplace
     * @return The address of the TreasuryManagement contract
     */
    function getTreasuryManagementAddress() external view returns (address);

    // Governance and administration functions

    /**
     * @dev Updates the marketplace fee percentage - only callable through governance
     * @param newFeePercentage The new fee percentage in basis points
     */
    function updateMarketplaceFee(uint256 newFeePercentage) external;

    /**
     * @dev Updates the fee distribution configuration - only callable through governance
     * @param newDistribution The new fee distribution configuration
     */
    function updateFeeDistribution(FeeDistribution calldata newDistribution) external;

    /**
     * @dev Updates the Alstra token address - only callable through governance
     * @param newAlstraToken The new Alstra token address
     */
    function updateAlstraTokenAddress(address newAlstraToken) external;

    /**
     * @dev Updates the FactionRegistry address - only callable through governance
     * @param newFactionRegistry The new FactionRegistry address
     */
    function updateFactionRegistry(address newFactionRegistry) external;

    /**
     * @dev Updates the TerritoryRegistry address - only callable through governance
     * @param newTerritoryRegistry The new TerritoryRegistry address
     */
    function updateTerritoryRegistry(address newTerritoryRegistry) external;

    /**
     * @dev Updates the TreasuryManagement address - only callable through governance
     * @param newTreasuryManagement The new TreasuryManagement address
     */
    function updateTreasuryManagement(address newTreasuryManagement) external;

    /**
     * @dev Creates a governance proposal to update marketplace parameters
     * @param newFeePercentage The proposed new fee percentage
     * @param newDistribution The proposed new fee distribution
     * @return proposalId The ID of the created governance proposal
     */
    function proposeMarketplaceParameterChange(
        uint256 newFeePercentage,
        FeeDistribution calldata newDistribution
    ) external returns (uint256);
}