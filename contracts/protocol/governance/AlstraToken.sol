// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./BaseGovernanceToken.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";


/**
 * @title AlstraToken
 * @dev Implementation of the Alstra token - the native token for the Police & Thief ecosystem
 * on AlstraNet blockchain. This token extends BaseGovernanceToken with additional features:
 * - Fee burning mechanism (50% of transaction fees)
 * - Hybrid Elastic Proof-of-Stake reward model
 * - Token distribution and vesting schedules
 */
contract AlstraToken is BaseGovernanceToken {
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");
    bytes32 public constant VESTING_MANAGER_ROLE = keccak256("VESTING_MANAGER_ROLE");
    bytes32 public constant STAKING_MANAGER_ROLE = keccak256("STAKING_MANAGER_ROLE");

    // Fee constants
    uint256 public constant FEE_DENOMINATOR = 10000; // For precision in fee calculations
    uint256 public feeRate; // Fee rate in basis points (e.g., 100 = 1%)
    uint256 public burnRate; // Percentage of fees that are burned (e.g., 5000 = 50%)
    
    // Staking variables
    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lockPeriod;
        uint256 lastRewardTime;
        bool active;
    }
    
    // Staking constants
    uint256 public constant MAX_LOCK_PERIOD = 4 * 365 days; // Maximum staking period of 4 years
    uint256 public constant EMERGENCY_WITHDRAWAL_PENALTY_RATE = 2000; // 20% penalty for emergency withdrawals
    
    // Mapping from user address to stake ID to stake info
    mapping(address => mapping(uint256 => StakeInfo)) public stakes;
    // Counter for stake IDs
    mapping(address => uint256) public nextStakeId;
    // Total staked amount
    uint256 public totalStaked;
    
    // Reward model variables
    uint256 public initialRewardRate; // Initial rewards minted per block
    uint256 public decayRate; // Rate at which rewards decay over time
    uint256 public startTime; // Timestamp when rewards started
    
    // Vesting schedules
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 startTime;
        uint256 cliff;
        uint256 duration;
        uint256 initialUnlock; // Percentage of tokens unlocked at start (in basis points)
        uint256 released;
        bool revocable;
        bool revoked;
    }
    
    // Mapping from beneficiary address to vesting schedule ID to schedule
    mapping(address => mapping(uint256 => VestingSchedule)) public vestingSchedules;
    // Counter for vesting schedule IDs
    mapping(address => uint256) public nextVestingScheduleId;
    
    // Allocation categories
    enum AllocationCategory {
        ValidatorRewards,
        EcosystemGrants,
        DevelopmentFund,
        CommunityMarketing,
        TeamAdvisors
    }
    
    // Total allocated per category
    mapping(AllocationCategory => uint256) public totalAllocated;
    
    // Token distribution constants
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens with 18 decimals
    
    // Events
    event FeeRateUpdated(uint256 oldFeeRate, uint256 newFeeRate);
    event BurnRateUpdated(uint256 oldBurnRate, uint256 newBurnRate);
    event TokensStaked(address indexed staker, uint256 indexed stakeId, uint256 amount, uint256 lockPeriod);
    event TokensUnstaked(address indexed staker, uint256 indexed stakeId, uint256 amount);
    event EmergencyWithdrawal(address indexed staker, uint256 indexed stakeId, uint256 amount, uint256 penalty);
    event RewardsClaimed(address indexed staker, uint256 indexed stakeId, uint256 amount);
    event VestingScheduleCreated(address indexed beneficiary, uint256 indexed scheduleId, AllocationCategory category);
    event TokensVested(address indexed beneficiary, uint256 indexed scheduleId, uint256 amount);
    event VestingScheduleRevoked(address indexed beneficiary, uint256 indexed scheduleId);
    event FeesBurned(uint256 amount);
    event FeesCollected(uint256 amount);

    /**
     * @dev Initialize the Alstra token with the specified name, symbol, and roles.
     * Sets up the initial fee rates, reward model, and token allocations.
     * @param defaultAdmin The address to be granted the default admin role
     * @param pauser The address to be granted the pauser role
     * @param minter The address to be granted the minter role
     * @param upgrader The address to be granted the upgrader role
     * @param feeManager The address to be granted the fee manager role
     * @param vestingManager The address to be granted the vesting manager role
     * @param stakingManager The address to be granted the staking manager role
     */
    function initialize(
        address defaultAdmin, 
        address pauser, 
        address minter, 
        address upgrader,
        address feeManager,
        address vestingManager,
        address stakingManager
    ) public initializer {
        // Initialize the base governance token
        __BaseGovernanceToken_init(
            "Alstra", 
            "ALSTRA",
            defaultAdmin,
            pauser,
            minter,
            upgrader
        );

        // Grant additional roles specific to AlstraToken
        _grantRole(FEE_MANAGER_ROLE, feeManager);
        _grantRole(VESTING_MANAGER_ROLE, vestingManager);
        _grantRole(STAKING_MANAGER_ROLE, stakingManager);
        
        // Set initial fee rate to 1% (100 basis points)
        feeRate = 100;
        // Set burn rate to 50% of fees (5000 basis points)
        burnRate = 5000;
        
        // Set reward model parameters
        initialRewardRate = 100 * 10**18; // 100 tokens per block initially
        decayRate = 1; // Will result in approximately 63% reduction per year
        startTime = block.timestamp;
        
        // Mint initial supply to the contract itself
        // Will be distributed according to vesting schedules
        _mint(address(this), TOTAL_SUPPLY);
    }

    /**
     * @dev Updates the fee rate.
     * Can only be called by accounts with the FEE_MANAGER_ROLE.
     * @param newFeeRate The new fee rate in basis points
     */
    function setFeeRate(uint256 newFeeRate) public onlyRole(FEE_MANAGER_ROLE) {
        require(newFeeRate <= FEE_DENOMINATOR, "Fee rate cannot exceed 100%");
        uint256 oldFeeRate = feeRate;
        feeRate = newFeeRate;
        emit FeeRateUpdated(oldFeeRate, newFeeRate);
    }

    /**
     * @dev Updates the burn rate (percentage of fees that are burned).
     * Can only be called by accounts with the FEE_MANAGER_ROLE.
     * @param newBurnRate The new burn rate in basis points (e.g., 5000 = 50%)
     */
    function setBurnRate(uint256 newBurnRate) public onlyRole(FEE_MANAGER_ROLE) {
        require(newBurnRate <= FEE_DENOMINATOR, "Burn rate cannot exceed 100%");
        uint256 oldBurnRate = burnRate;
        burnRate = newBurnRate;
        emit BurnRateUpdated(oldBurnRate, newBurnRate);
    }

    /**
     * @dev Override of ERC20 transfer to implement fee mechanism.
     * 50% of fees are burned, the rest go to staking rewards.
     * @param to The address to transfer tokens to
     * @param value The amount of tokens to transfer
     * @return success True if the transfer was successful
     */
    function transfer(address to, uint256 value) public override(ERC20Upgradeable) returns (bool) {
        uint256 fee = (value * feeRate) / FEE_DENOMINATOR;
        uint256 burnAmount = (fee * burnRate) / FEE_DENOMINATOR;
        uint256 remainingFee = fee - burnAmount;
        
        // Burn the specified portion of the fee
        if (burnAmount > 0) {
            _burn(_msgSender(), burnAmount);
            emit FeesBurned(burnAmount);
        }
        
        // Transfer the remaining fee to a collection address (this contract)
        // This will be used for staking rewards
        if (remainingFee > 0) {
            super.transfer(address(this), remainingFee);
            emit FeesCollected(remainingFee);
        }
        
        // Transfer the value minus the full fee
        return super.transfer(to, value - fee);
    }

    /**
     * @dev Override of ERC20 transferFrom to implement fee mechanism.
     * 50% of fees are burned, the rest go to staking rewards.
     * @param from The address to transfer tokens from
     * @param to The address to transfer tokens to
     * @param value The amount of tokens to transfer
     * @return success True if the transfer was successful
     */
    function transferFrom(address from, address to, uint256 value) public override(ERC20Upgradeable) returns (bool) {
        uint256 fee = (value * feeRate) / FEE_DENOMINATOR;
        uint256 burnAmount = (fee * burnRate) / FEE_DENOMINATOR;
        uint256 remainingFee = fee - burnAmount;
        
        // Spend allowance for the entire amount including fees
        // FIX: Combined allowance spending into a single call
        _spendAllowance(from, _msgSender(), value);
        
        // Burn the specified portion of the fee
        if (burnAmount > 0) {
            _burn(from, burnAmount);
            emit FeesBurned(burnAmount);
        }
        
        // Transfer the remaining fee to a collection address (this contract)
        // This will be used for staking rewards
        if (remainingFee > 0) {
            _transfer(from, address(this), remainingFee);
            emit FeesCollected(remainingFee);
        }
        
        // Transfer the value minus the full fee
        _transfer(from, to, value - fee);
        return true;
    }

    /**
     * @dev Creates a new stake of tokens.
     * @param amount The amount of tokens to stake
     * @param lockPeriod The period (in seconds) for which the tokens will be locked
     * @return stakeId The ID of the created stake
     */
    function createStake(uint256 amount, uint256 lockPeriod) public returns (uint256) {
        require(amount > 0, "Cannot stake 0 tokens");
        require(lockPeriod > 0, "Lock period must be greater than 0");
        // FIX: Added maximum lock period validation
        require(lockPeriod <= MAX_LOCK_PERIOD, "Lock period cannot exceed 4 years");
        require(balanceOf(_msgSender()) >= amount, "Insufficient balance");
        
        uint256 stakeId = nextStakeId[_msgSender()]++;
        
        // Transfer tokens from sender to contract
        _transfer(_msgSender(), address(this), amount);
        
        // Create stake
        stakes[_msgSender()][stakeId] = StakeInfo({
            amount: amount,
            startTime: block.timestamp,
            lockPeriod: lockPeriod,
            lastRewardTime: block.timestamp,
            active: true
        });
        
        totalStaked += amount;
        
        emit TokensStaked(_msgSender(), stakeId, amount, lockPeriod);
        
        return stakeId;
    }

    /**
     * @dev Withdraws staked tokens after lock period has expired.
     * @param stakeId The ID of the stake to withdraw
     */
    function withdrawStake(uint256 stakeId) public {
        StakeInfo storage stake = stakes[_msgSender()][stakeId];
        
        require(stake.active, "Stake is not active");
        require(block.timestamp >= stake.startTime + stake.lockPeriod, "Lock period not yet expired");
        
        // Claim any pending rewards before withdrawal
        _claimRewards(_msgSender(), stakeId);
        
        uint256 amount = stake.amount;
        stake.active = false;
        totalStaked -= amount;
        
        // Transfer tokens back to staker
        _transfer(address(this), _msgSender(), amount);
        
        emit TokensUnstaked(_msgSender(), stakeId, amount);
    }

    /**
     * @dev Allows emergency withdrawal of staked tokens before lock period expires,
     * but with a penalty applied. The penalty is proportional to the remaining lock time.
     * @param stakeId The ID of the stake to withdraw early
     */
    function emergencyWithdrawStake(uint256 stakeId) public {
        StakeInfo storage stake = stakes[_msgSender()][stakeId];
        
        require(stake.active, "Stake is not active");
        
        // Claim any pending rewards before withdrawal
        _claimRewards(_msgSender(), stakeId);
        
        uint256 totalLockPeriod = stake.lockPeriod;
        uint256 timeElapsed = block.timestamp - stake.startTime;
        
        // If lock period is already over, use normal withdrawal
        if (timeElapsed >= totalLockPeriod) {
            withdrawStake(stakeId);
            return;
        }
        
        uint256 amount = stake.amount;
        uint256 remainingTime = totalLockPeriod - timeElapsed;
        
        // Calculate penalty as a percentage of the remaining lock time
        // EMERGENCY_WITHDRAWAL_PENALTY_RATE (20%) of the proportional remaining time
        uint256 penaltyRate = (remainingTime * EMERGENCY_WITHDRAWAL_PENALTY_RATE) / totalLockPeriod;
        
        // Cap penalty at FEE_DENOMINATOR (100%)
        if (penaltyRate > FEE_DENOMINATOR) {
            penaltyRate = FEE_DENOMINATOR;
        }
        
        uint256 penalty = (amount * penaltyRate) / FEE_DENOMINATOR;
        uint256 amountToReturn = amount - penalty;
        
        // Update stake state
        stake.active = false;
        totalStaked -= amount;
        
        // Burn the penalty amount
        _burn(address(this), penalty);
        
        // Transfer remaining tokens back to staker
        _transfer(address(this), _msgSender(), amountToReturn);
        
        emit EmergencyWithdrawal(_msgSender(), stakeId, amountToReturn, penalty);
    }

    /**
     * @dev Claims staking rewards for a specific stake.
     * @param stakeId The ID of the stake to claim rewards for
     * @return reward The amount of rewards claimed
     */
    function claimRewards(uint256 stakeId) public returns (uint256) {
        return _claimRewards(_msgSender(), stakeId);
    }

    /**
     * @dev Internal function to calculate and claim staking rewards.
     * @param staker The address of the staker
     * @param stakeId The ID of the stake
     * @return reward The amount of rewards claimed
     */
    function _claimRewards(address staker, uint256 stakeId) internal returns (uint256) {
        StakeInfo storage stake = stakes[staker][stakeId];
        
        require(stake.active, "Stake is not active");
        
        uint256 reward = calculateRewards(staker, stakeId);
        if (reward > 0) {
            stake.lastRewardTime = block.timestamp;
            
            // Mint rewards directly to staker
            // This uses the Hybrid Elastic PoS model where:
            // R = M + F - B (M=minted, F=fees collected, B=burned)
            // We've already handled F and B in the transfer functions
            if (hasRole(MINTER_ROLE, address(this))) {
                _mint(staker, reward);
            } else {
                // If this contract doesn't have minter role, transfer from contract balance
                // This assumes the contract has been allocated tokens for rewards
                _transfer(address(this), staker, reward);
            }
            
            emit RewardsClaimed(staker, stakeId, reward);
        }
        
        return reward;
    }

    /**
     * @dev Calculates rewards for a specific stake based on the Hybrid Elastic PoS model.
     * @param staker The address of the staker
     * @param stakeId The ID of the stake
     * @return reward The calculated reward amount
     */
    function calculateRewards(address staker, uint256 stakeId) public view returns (uint256) {
        StakeInfo storage stake = stakes[staker][stakeId];
        
        if (!stake.active || totalStaked == 0) {
            return 0;
        }
        
        // Calculate time elapsed since last reward claim
        uint256 timeElapsed = block.timestamp - stake.lastRewardTime;
        if (timeElapsed == 0) {
            return 0;
        }
        
        // Calculate decay factor based on time since start
        uint256 timeSinceStart = block.timestamp - startTime;
        
        // FIX: Calculate exponential decay using more accurate method
        // decay = e^(-decayRate * timeSinceStart / (365 days))
        uint256 decayFactor = calculateExponentialDecay(decayRate, timeSinceStart);
        
        // Calculate current reward rate with decay
        uint256 currentRewardRate = (initialRewardRate * decayFactor) / FEE_DENOMINATOR;
        
        // Calculate reward based on stake proportion and time elapsed
        uint256 reward = currentRewardRate * timeElapsed * stake.amount / (86400 * totalStaked);
        
        // Apply multiplier based on lock period (longer lock = higher rewards)
        // Maximum multiplier is 2x for 4-year lock
        uint256 multiplier = FEE_DENOMINATOR + (stake.lockPeriod * FEE_DENOMINATOR) / (4 * 365 days);
        if (multiplier > 2 * FEE_DENOMINATOR) {
            multiplier = 2 * FEE_DENOMINATOR;
        }
        
        reward = (reward * multiplier) / FEE_DENOMINATOR;
        
        return reward;
    }
    
    /**
     * @dev Calculates exponential decay using a more accurate approximation
     * @param rate The decay rate
     * @param time The time elapsed in seconds
     * @return The decay factor scaled by FEE_DENOMINATOR
     */
    function calculateExponentialDecay(uint256 rate, uint256 time) internal pure returns (uint256) {
        // Calculate x = -rate * time / (365 days)
        int256 x = -int256(rate * time) / int256(365 days);
        
        // If x is too large and negative, return almost zero
        if (x < -41) {
            return 1; // Almost zero, but avoid division by zero
        }
        
        // If x is positive (shouldn't happen with our parameters), return FEE_DENOMINATOR
        if (x >= 0) {
            return FEE_DENOMINATOR;
        }
        
        // Calculate e^x using Taylor series approximation up to 7 terms
        // e^x = 1 + x + x^2/2! + x^3/3! + ... + x^n/n!
        
        int256 result = int256(FEE_DENOMINATOR); // 1.0 scaled by FEE_DENOMINATOR
        int256 term = int256(FEE_DENOMINATOR);   // Start with 1.0 scaled
        
        // First term: x
        term = term * x / int256(FEE_DENOMINATOR);
        result += term;
        
        // Second term: x^2/2!
        term = term * x / int256(FEE_DENOMINATOR) / 2;
        result += term;
        
        // Third term: x^3/3!
        term = term * x / int256(FEE_DENOMINATOR) / 3;
        result += term;
        
        // Fourth term: x^4/4!
        term = term * x / int256(FEE_DENOMINATOR) / 4;
        result += term;
        
        // Fifth term: x^5/5!
        term = term * x / int256(FEE_DENOMINATOR) / 5;
        result += term;
        
        // Sixth term: x^6/6!
        term = term * x / int256(FEE_DENOMINATOR) / 6;
        result += term;
        
        // Seventh term: x^7/7!
        term = term * x / int256(FEE_DENOMINATOR) / 7;
        result += term;
        
        // Ensure result is not negative due to precision errors
        return result <= 0 ? 1 : uint256(result);
    }

    /**
     * @dev Creates a new vesting schedule for a beneficiary.
     * Can only be called by accounts with the VESTING_MANAGER_ROLE.
     * @param beneficiary The address that will receive the vested tokens
     * @param amount The total amount of tokens to be vested
     * @param vestingStartTime The timestamp when vesting begins
     * @param cliff The duration in seconds before any tokens vest
     * @param duration The total duration of the vesting schedule
     * @param initialUnlock The percentage of tokens unlocked at start (in basis points)
     * @param revocable Whether the vesting schedule can be revoked
     * @param category The allocation category this schedule belongs to
     * @return scheduleId The ID of the created vesting schedule
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 amount,
        uint256 vestingStartTime,
        uint256 cliff,
        uint256 duration,
        uint256 initialUnlock,
        bool revocable,
        AllocationCategory category
    ) public onlyRole(VESTING_MANAGER_ROLE) returns (uint256) {
        require(beneficiary != address(0), "Beneficiary cannot be zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        require(vestingStartTime >= block.timestamp, "Start time must be in the future");
        require(initialUnlock <= FEE_DENOMINATOR, "Initial unlock cannot exceed 100%");
        
        // Update total allocated for the category
        totalAllocated[category] += amount;
        
        // Check allocation limits based on token distribution plan
        checkAllocationLimits(category);
        
        uint256 scheduleId = nextVestingScheduleId[beneficiary]++;
        
        // Calculate initial unlock amount
        uint256 initialUnlockAmount = (amount * initialUnlock) / FEE_DENOMINATOR;
        
        // Create vesting schedule
        vestingSchedules[beneficiary][scheduleId] = VestingSchedule({
            totalAmount: amount,
            startTime: vestingStartTime,
            cliff: cliff,
            duration: duration,
            initialUnlock: initialUnlock,
            released: 0,
            revocable: revocable,
            revoked: false
        });
        
        // Transfer initial unlock if any
        if (initialUnlockAmount > 0) {
            _transfer(address(this), beneficiary, initialUnlockAmount);
            vestingSchedules[beneficiary][scheduleId].released = initialUnlockAmount;
        }
        
        emit VestingScheduleCreated(beneficiary, scheduleId, category);
        
        return scheduleId;
    }

    /**
     * @dev Calculates the amount of tokens that have vested for a schedule.
     * @param beneficiary The address of the beneficiary
     * @param scheduleId The ID of the vesting schedule
     * @return The amount of tokens that have vested
     */
    function vestedAmount(address beneficiary, uint256 scheduleId) public view returns (uint256) {
        VestingSchedule storage schedule = vestingSchedules[beneficiary][scheduleId];
        
        if (schedule.revoked) {
            return schedule.released;
        }
        
        if (block.timestamp < schedule.startTime) {
            // Only initial unlock amount is vested
            return (schedule.totalAmount * schedule.initialUnlock) / FEE_DENOMINATOR;
        }
        
        if (block.timestamp < schedule.startTime + schedule.cliff) {
            // Still in cliff period, only initial unlock is vested
            return (schedule.totalAmount * schedule.initialUnlock) / FEE_DENOMINATOR;
        }
        
        if (block.timestamp >= schedule.startTime + schedule.duration) {
            // Vesting completed
            return schedule.totalAmount;
        }
        
        // Partial vesting
        // Initial amount plus linear vesting of remaining
        uint256 initialAmount = (schedule.totalAmount * schedule.initialUnlock) / FEE_DENOMINATOR;
        uint256 remainingAmount = schedule.totalAmount - initialAmount;
        
        uint256 timeVested = block.timestamp - schedule.startTime;
        uint256 vestedRemainder = remainingAmount * timeVested / schedule.duration;
        
        return initialAmount + vestedRemainder;
    }

    /**
     * @dev Allows a beneficiary to claim their vested tokens.
     * @param scheduleId The ID of the vesting schedule
     * @return The amount of tokens claimed
     */
    function claimVestedTokens(uint256 scheduleId) public returns (uint256) {
        VestingSchedule storage schedule = vestingSchedules[_msgSender()][scheduleId];
        
        require(schedule.totalAmount > 0, "No such vesting schedule");
        require(!schedule.revoked, "Vesting schedule has been revoked");
        
        uint256 vested = vestedAmount(_msgSender(), scheduleId);
        uint256 claimable = vested - schedule.released;
        
        require(claimable > 0, "No tokens available to claim");
        
        schedule.released += claimable;
        
        // Transfer tokens to beneficiary
        _transfer(address(this), _msgSender(), claimable);
        
        emit TokensVested(_msgSender(), scheduleId, claimable);
        
        return claimable;
    }

    /**
     * @dev Revokes a vesting schedule.
     * Can only be called by accounts with the VESTING_MANAGER_ROLE.
     * Only revocable schedules can be revoked.
     * @param beneficiary The address of the beneficiary
     * @param scheduleId The ID of the vesting schedule
     */
    function revokeVestingSchedule(address beneficiary, uint256 scheduleId) public onlyRole(VESTING_MANAGER_ROLE) {
        VestingSchedule storage schedule = vestingSchedules[beneficiary][scheduleId];
        
        require(schedule.totalAmount > 0, "No such vesting schedule");
        require(schedule.revocable, "Vesting schedule is not revocable");
        require(!schedule.revoked, "Vesting schedule already revoked");
        
        // Calculate vested amount at revocation time
        uint256 vested = vestedAmount(beneficiary, scheduleId);
        
        // Update released amount if necessary
        if (vested > schedule.released) {
            uint256 toRelease = vested - schedule.released;
            schedule.released = vested;
            
            // Transfer any remaining vested tokens
            _transfer(address(this), beneficiary, toRelease);
            
            emit TokensVested(beneficiary, scheduleId, toRelease);
        }
        
        // Mark as revoked
        schedule.revoked = true;
        
        emit VestingScheduleRevoked(beneficiary, scheduleId);
    }

    /**
     * @dev Checks allocation limits based on token distribution plan.
     * @param category The allocation category to check
     */
    function checkAllocationLimits(AllocationCategory category) internal view {
        uint256 maxAllocation;
        
        if (category == AllocationCategory.ValidatorRewards) {
            maxAllocation = (TOTAL_SUPPLY * 40) / 100; // 40% for Validator Rewards
        } else if (category == AllocationCategory.EcosystemGrants) {
            maxAllocation = (TOTAL_SUPPLY * 20) / 100; // 20% for Ecosystem & Grants
        } else if (category == AllocationCategory.DevelopmentFund) {
            maxAllocation = (TOTAL_SUPPLY * 15) / 100; // 15% for Development Fund
        } else if (category == AllocationCategory.CommunityMarketing) {
            maxAllocation = (TOTAL_SUPPLY * 15) / 100; // 15% for Community & Marketing
        } else if (category == AllocationCategory.TeamAdvisors) {
            maxAllocation = (TOTAL_SUPPLY * 10) / 100; // 10% for Team & Advisors
        }
        
        require(totalAllocated[category] <= maxAllocation, "Allocation limit exceeded");
    }
}