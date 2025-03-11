// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import {ERC721EnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import {ERC721PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721PausableUpgradeable.sol";
import {ERC721URIStorageUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import {ERC721VotesUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721VotesUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title BaseERC721Token
 * @dev An upgradeable ERC721 token with configurable parameters and additional features:
 * - Enumerable: allows enumeration of all tokens
 * - URI Storage: stores metadata URIs for each token
 * - Pausability: allows pausing all token transfers
 * - Burnable: tokens can be burned by their owners
 * - Role-based access control: different roles for different operations
 * - Votes: supports delegation and voting
 * - Upgradability: can be upgraded via UUPS pattern
 * 
 * Token name, symbol, and role assignments are configurable during initialization.
 */
contract BaseERC721Token is Initializable, ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721URIStorageUpgradeable, ERC721PausableUpgradeable, AccessControlUpgradeable, ERC721BurnableUpgradeable, EIP712Upgradeable, ERC721VotesUpgradeable, UUPSUpgradeable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");
    
    uint256 private _nextTokenId;
    string private _baseTokenURI;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the token with a custom name and symbol.
     * 
     * @param name The name of the NFT collection
     * @param symbol The symbol of the NFT collection
     * @param version The version string for EIP712 domain separator
     * @param defaultAdmin Address granted the default admin role
     * @param pauser Address granted the pauser role
     * @param minter Address granted the minter role
     * @param upgrader Address granted the upgrader role
     */
    function initialize(
        string memory name, 
        string memory symbol,
        string memory version,
        address defaultAdmin, 
        address pauser, 
        address minter, 
        address upgrader
    )
        public initializer
    {
        __ERC721_init(name, symbol);
        __ERC721Enumerable_init();
        __ERC721URIStorage_init();
        __ERC721Pausable_init();
        __AccessControl_init();
        __ERC721Burnable_init();
        __EIP712_init(name, version);
        __ERC721Votes_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, pauser);
        _grantRole(MINTER_ROLE, minter);
        _grantRole(UPGRADER_ROLE, upgrader);
        _grantRole(URI_SETTER_ROLE, defaultAdmin);
    }

    /**
     * @dev Pauses all token transfers.
     * Can only be called by accounts with the PAUSER_ROLE.
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses all token transfers.
     * Can only be called by accounts with the PAUSER_ROLE.
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Safely mints a new token and assigns it to `to`.
     * Sets the token URI for the new token.
     * Can only be called by accounts with the MINTER_ROLE.
     *
     * @param to The address that will receive the minted token
     * @param uri The token URI for the new token
     * @return tokenId The ID of the newly minted token
     */
    /**
     * @dev Safely mints a new token with a configurable URI.
     * This method uses the explicit URI storage approach.
     *
     * @param to The address that will receive the minted token
     * @param uri The token URI for the new token
     * @return tokenId The ID of the newly minted token
     */
    function safeMint(address to, string memory uri)
        public
        onlyRole(MINTER_ROLE)
        returns (uint256)
    {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }

    /**
     * @dev Safely mints a new token using the auto-generated URI approach.
     * The URI will be constructed from the base URI + tokenId.
     *
     * @param to The address that will receive the minted token
     * @return tokenId The ID of the newly minted token
     */
    function safeMintAutoURI(address to)
        public
        onlyRole(MINTER_ROLE)
        returns (uint256)
    {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        // No _setTokenURI call - will use baseURI + tokenId
        return tokenId;
    }
    
    /**
     * @dev Safely mints multiple tokens using the auto-generated URI approach.
     * The URIs will be constructed from the base URI + tokenId.
     *
     * @param to The address that will receive the minted tokens
     * @param amount The number of tokens to mint
     * @return startTokenId The first token ID in the minted batch
     */
    function batchMintAutoURI(address to, uint256 amount)
        public
        onlyRole(MINTER_ROLE)
        returns (uint256)
    {
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 startTokenId = _nextTokenId;
        
        for (uint256 i = 0; i < amount; i++) {
            _safeMint(to, _nextTokenId++);
            // No _setTokenURI call - will use baseURI + tokenId
        }
        
        return startTokenId;
    }
    
    /**
     * @dev Sets the base URI for token URIs.
     * The URIs for tokens will be auto-generated as baseURI + tokenId if no specific URI is set.
     * Can only be called by accounts with the URI_SETTER_ROLE.
     *
     * @param baseURI The new base URI
     */
    function setBaseURI(string memory baseURI) 
        public 
        onlyRole(URI_SETTER_ROLE) 
    {
        _baseTokenURI = baseURI;
    }

    /**
     * @dev Returns the current timestamp as seconds since the unix epoch.
     */
    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    /**
     * @dev Returns the clock mode for compatibility checks.
     */
    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    /**
     * @dev Function that should revert when `msg.sender` is not authorized to upgrade the contract.
     * Called by {upgradeTo} and {upgradeToAndCall}.
     *
     * @param newImplementation Address of the new implementation
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}

    // The following functions are overrides required by Solidity.

    /**
     * @dev Update hook that is called on token transfers.
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721PausableUpgradeable, ERC721VotesUpgradeable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Hook that is called when token balance is modified.
     */
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721VotesUpgradeable)
    {
        super._increaseBalance(account, value);
    }

    /**
     * @dev Returns the Uniform Resource Identifier (URI) for `tokenId` token.
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return ERC721URIStorageUpgradeable.tokenURI(tokenId);
    }
    
    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
     * by default, it can be overridden in child contracts.
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721URIStorageUpgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}