// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./BaseERC1155Token.sol";

/**
 * @title EquipmentNFT
 * @dev Implementation of the Equipment NFT for the Police & Thief ecosystem
 * Extends BaseERC1155Token with equipment-specific functionality
 */
contract EquipmentNFT is BaseERC1155Token {
    // Equipment type enum for categorization
    enum EquipmentType {
        Weapon,
        Armor,
        Vehicle,
        Communication,
        Surveillance,
        Utility,
        Special
    }

    // Faction enum
    enum Faction {
        Any,
        LawEnforcement,
        CriminalSyndicate,
        Vigilante
    }

    // Equipment rarity
    enum Rarity {
        Common,
        Uncommon,
        Rare,
        Epic,
        Legendary
    }

    // Equipment attribute structure
    struct EquipmentAttributes {
        string name;
        EquipmentType equipType;
        Faction allowedFaction;
        Rarity rarity;
        uint8 level;
        uint8 durability;           // Current durability (0-100)
        uint8 maxDurability;        // Maximum durability (can increase with upgrades)
        uint256 lastRepairBlock;    // Last block when the equipment was repaired
        bool upgradable;            // Whether this equipment can be upgraded
        mapping(string => uint256) stats; // Dynamic stats (power, stealth, etc.)
    }

    // Equipment template structure (for creating new equipment types)
    struct EquipmentTemplate {
        string name;
        EquipmentType equipType;
        Faction allowedFaction;
        Rarity rarity;
        uint8 maxDurability;
        bool upgradable;
        string[] statNames;
        uint256[] statValues;
    }

    // Roles
    bytes32 public constant TEMPLATE_MANAGER_ROLE = keccak256("TEMPLATE_MANAGER_ROLE");
    bytes32 public constant STATS_MANAGER_ROLE = keccak256("STATS_MANAGER_ROLE");
    bytes32 public constant EQUIPMENT_UPGRADER_ROLE = keccak256("EQUIPMENT_UPGRADER_ROLE");

    // Mapping from token ID to equipment attributes
    mapping(uint256 => EquipmentAttributes) private _equipmentAttributes;
    
    // Mapping from equipment type to token IDs
    mapping(EquipmentType => uint256[]) private _equipmentIdsByType;
    
    // Mapping from faction to token IDs
    mapping(Faction => uint256[]) private _equipmentIdsByFaction;

    // Registry of equipment templates
    mapping(uint256 => EquipmentTemplate) private _templates;
    uint256 private _nextTemplateId = 1;
    
    // Track the next token ID to avoid conflicts
    uint256 private _nextTokenId = 1;

    // Events
    event EquipmentCreated(uint256 indexed tokenId, string name, EquipmentType equipType, Faction faction, Rarity rarity);
    event EquipmentUpgraded(uint256 indexed tokenId, uint8 oldLevel, uint8 newLevel);
    event EquipmentRepaired(uint256 indexed tokenId, uint8 oldDurability, uint8 newDurability);
    event DurabilityDecreased(uint256 indexed tokenId, uint8 oldDurability, uint8 newDurability);
    event TemplateCreated(uint256 indexed templateId, string name, EquipmentType equipType);
    event StatUpdated(uint256 indexed tokenId, string statName, uint256 oldValue, uint256 newValue);

    /**
     * @dev Modifier to check if the token exists
     */
    modifier tokenExists(uint256 tokenId) {
        require(exists(tokenId), "EquipmentNFT: Token does not exist");
        _;
    }

    /**
     * @dev Initialize function that's called by the proxy on deployment
     */
    function initialize(
        address defaultAdmin,
        address pauser,
        address minter,
        address upgrader,
        address templateManager,
        address statsManager,
        address equipmentUpgrader
    ) public initializer {
        // Initialize the base ERC1155 token with roles
        __BaseERC1155Token_init(
            "ipfs://", // Base URI for token metadata
            defaultAdmin,
            pauser,
            minter,
            upgrader
        );

        // Grant additional roles
        _grantRole(TEMPLATE_MANAGER_ROLE, templateManager);
        _grantRole(STATS_MANAGER_ROLE, statsManager);
        _grantRole(EQUIPMENT_UPGRADER_ROLE, equipmentUpgrader);
    }

    /**
     * @dev Creates a new equipment template that can be used to mint equipment
     */
    function createEquipmentTemplate(
        string memory name,
        EquipmentType equipType,
        Faction allowedFaction,
        Rarity rarity,
        uint8 maxDurability,
        bool upgradable,
        string[] memory statNames,
        uint256[] memory statValues
    ) public onlyRole(TEMPLATE_MANAGER_ROLE) returns (uint256) {
        require(bytes(name).length > 0, "EquipmentNFT: Name cannot be empty");
        require(maxDurability > 0 && maxDurability <= 100, "EquipmentNFT: Invalid durability range");
        require(statNames.length == statValues.length, "EquipmentNFT: Stat names and values length mismatch");

        uint256 templateId = _nextTemplateId++;
        
        _templates[templateId] = EquipmentTemplate({
            name: name,
            equipType: equipType,
            allowedFaction: allowedFaction,
            rarity: rarity,
            maxDurability: maxDurability,
            upgradable: upgradable,
            statNames: statNames,
            statValues: statValues
        });
        
        emit TemplateCreated(templateId, name, equipType);
        
        return templateId;
    }

    /**
     * @dev Mints a new equipment token based on a template
     */
    function mintEquipment(
        address to,
        uint256 templateId,
        uint256 amount,
        bytes memory data
    ) public onlyRole(MINTER_ROLE) returns (uint256) {
        require(_templates[templateId].maxDurability > 0, "EquipmentNFT: Template does not exist");
        
        // Get the next token ID using our tracked counter
        uint256 tokenId = _nextTokenId++;
        
        // Mint the token
        _mint(to, tokenId, amount, data);
        
        // Setup equipment attributes
        EquipmentTemplate storage template = _templates[templateId];
        EquipmentAttributes storage attributes = _equipmentAttributes[tokenId];
        
        attributes.name = template.name;
        attributes.equipType = template.equipType;
        attributes.allowedFaction = template.allowedFaction;
        attributes.rarity = template.rarity;
        attributes.level = 1;
        attributes.durability = template.maxDurability;
        attributes.maxDurability = template.maxDurability;
        attributes.lastRepairBlock = block.number;
        attributes.upgradable = template.upgradable;
        
        // Set stats
        for (uint256 i = 0; i < template.statNames.length; i++) {
            attributes.stats[template.statNames[i]] = template.statValues[i];
        }
        
        // Add to type and faction mappings
        _equipmentIdsByType[template.equipType].push(tokenId);
        _equipmentIdsByFaction[template.allowedFaction].push(tokenId);
        
        emit EquipmentCreated(tokenId, template.name, template.equipType, template.allowedFaction, template.rarity);
        
        return tokenId;
    }

    /**
     * @dev Returns the total supply of unique token types
     */
    function totalSupply() public view override returns (uint256) {
        // Simply return one less than the next token ID
        return _nextTokenId - 1;
    }

    /**
     * @dev Retrieves equipment name, type, and faction for a token
     */
    function getEquipmentBasicInfo(uint256 tokenId) 
        public 
        view 
        tokenExists(tokenId) 
        returns (string memory, EquipmentType, Faction, Rarity, uint8) 
    {
        EquipmentAttributes storage attributes = _equipmentAttributes[tokenId];
        return (
            attributes.name, 
            attributes.equipType, 
            attributes.allowedFaction, 
            attributes.rarity,
            attributes.level
        );
    }

    /**
     * @dev Retrieves durability information for a token
     */
    function getDurabilityInfo(uint256 tokenId) 
        public 
        view 
        tokenExists(tokenId) 
        returns (uint8, uint8, uint256, bool) 
    {
        EquipmentAttributes storage attributes = _equipmentAttributes[tokenId];
        return (
            attributes.durability,
            attributes.maxDurability,
            attributes.lastRepairBlock,
            attributes.upgradable
        );
    }

    /**
     * @dev Gets a specific stat value for a token
     */
    function getStatValue(uint256 tokenId, string memory statName) 
        public 
        view 
        tokenExists(tokenId) 
        returns (uint256) 
    {
        return _equipmentAttributes[tokenId].stats[statName];
    }

    /**
     * @dev Updates a stat value for a token
     */
    function updateStat(uint256 tokenId, string memory statName, uint256 value) 
        public 
        onlyRole(STATS_MANAGER_ROLE)
        tokenExists(tokenId) 
    {
        uint256 oldValue = _equipmentAttributes[tokenId].stats[statName];
        _equipmentAttributes[tokenId].stats[statName] = value;
        
        emit StatUpdated(tokenId, statName, oldValue, value);
    }

    /**
     * @dev Decreases the durability of an equipment
     */
    function decreaseDurability(uint256 tokenId, uint8 amount) 
        public 
        onlyRole(STATS_MANAGER_ROLE)
        tokenExists(tokenId) 
    {
        EquipmentAttributes storage attributes = _equipmentAttributes[tokenId];
        uint8 oldDurability = attributes.durability;
        
        if (amount >= attributes.durability) {
            attributes.durability = 0;
        } else {
            attributes.durability -= amount;
        }
        
        emit DurabilityDecreased(tokenId, oldDurability, attributes.durability);
    }

    /**
     * @dev Repairs an equipment, restoring its durability
     */
    function repairEquipment(uint256 tokenId) 
        public
        onlyRole(EQUIPMENT_UPGRADER_ROLE) 
        tokenExists(tokenId) 
    {
        EquipmentAttributes storage attributes = _equipmentAttributes[tokenId];
        require(attributes.durability < attributes.maxDurability, "EquipmentNFT: Equipment already at full durability");
        
        uint8 oldDurability = attributes.durability;
        attributes.durability = attributes.maxDurability;
        attributes.lastRepairBlock = block.number;
        
        emit EquipmentRepaired(tokenId, oldDurability, attributes.durability);
    }

    /**
     * @dev Upgrades an equipment, increasing its level and stats
     */
    function upgradeEquipment(uint256 tokenId) 
        public 
        onlyRole(EQUIPMENT_UPGRADER_ROLE)
        tokenExists(tokenId) 
    {
        EquipmentAttributes storage attributes = _equipmentAttributes[tokenId];
        require(attributes.upgradable, "EquipmentNFT: Equipment is not upgradable");
        
        uint8 oldLevel = attributes.level;
        attributes.level += 1;
        
        // Increase max durability if not already at max
        if (attributes.maxDurability < 100) {
            attributes.maxDurability += 5; // +5 per upgrade
            if (attributes.maxDurability > 100) {
                attributes.maxDurability = 100;
            }
        }
        
        // Also repair the equipment as part of the upgrade
        uint8 oldDurability = attributes.durability;
        attributes.durability = attributes.maxDurability;
        attributes.lastRepairBlock = block.number;
        
        emit EquipmentUpgraded(tokenId, oldLevel, attributes.level);
        emit EquipmentRepaired(tokenId, oldDurability, attributes.durability);
    }

    /**
     * @dev Returns all equipment token IDs of a specific type
     */
    function getEquipmentIdsByType(EquipmentType equipType) 
        public 
        view 
        returns (uint256[] memory) 
    {
        return _equipmentIdsByType[equipType];
    }

    /**
     * @dev Returns all equipment token IDs for a specific faction
     */
    function getEquipmentIdsByFaction(Faction faction) 
        public 
        view 
        returns (uint256[] memory) 
    {
        return _equipmentIdsByFaction[faction];
    }

    /**
     * @dev Returns the URI for a token ID
     */
    function uri(uint256 tokenId) 
        public 
        view 
        override 
        returns (string memory) 
    {
        if (!exists(tokenId)) {
            return super.uri(tokenId);
        }
        
        // In a real implementation, this would construct a URI with the token metadata
        // For simplicity, we're just returning the base URI with the token ID
        return string(abi.encodePacked(super.uri(tokenId), _toString(tokenId)));
    }

    /**
     * @dev Converts a uint256 to its string representation
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        
        uint256 temp = value;
        uint256 digits;
        
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
}