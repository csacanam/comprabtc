// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @notice Minimal interface for Uniswap V3 SwapRouter02 (no deadline field).
interface ISwapRouter02 {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

/// @notice Safe wrappers for tokens (like USDT) that don't return bool.
library SafeTransfer {
    error TransferFailed();

    function safeTransfer(IERC20 token, address to, uint256 amount) internal {
        (bool ok, bytes memory data) =
            address(token).call(abi.encodeCall(IERC20.transfer, (to, amount)));
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }

    function safeTransferFrom(IERC20 token, address from, address to, uint256 amount) internal {
        (bool ok, bytes memory data) =
            address(token).call(abi.encodeCall(IERC20.transferFrom, (from, to, amount)));
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }

    function safeApprove(IERC20 token, address spender, uint256 amount) internal {
        (bool ok, bytes memory data) =
            address(token).call(abi.encodeCall(IERC20.approve, (spender, amount)));
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }
}

/// @title DCAExecutor — non-custodial DCA into BTC on Celo
/// @notice Users approve USDT to this contract and create a plan with on-chain
///         limits (amount per run, minimum interval). A keeper triggers each
///         installment: USDT is pulled from the user's wallet, swapped on
///         Uniswap V3, and the purchased token is sent straight back to the
///         user. The contract never holds user funds between executions.
contract DCAExecutor {
    using SafeTransfer for IERC20;

    // ---------------------------------------------------------------- errors
    error NotOwner();
    error NotKeeper();
    error ZeroAddress();
    error InvalidPlan();
    error PlanNotActive();
    error IntervalNotElapsed();
    error FeeTooHigh();

    // ---------------------------------------------------------------- events
    event PlanCreated(
        address indexed user, uint128 amountPerRun, uint64 minInterval, address tokenOut, uint24 poolFee
    );
    event PlanCancelled(address indexed user);
    event Executed(address indexed user, uint256 amountIn, uint256 feeAmount, uint256 amountOut);
    event KeeperChanged(address indexed keeper);
    event TreasuryChanged(address indexed treasury);
    event FeeChanged(uint16 feeBps);
    event FeeFlatChanged(uint128 feeFlat);

    // ---------------------------------------------------------------- types
    struct Plan {
        uint128 amountPerRun; // USDT per installment (6 decimals)
        uint64 minInterval;   // seconds; keeper cannot execute earlier
        uint64 lastRun;
        bool active;
        address tokenOut;     // MVP: WBTC (native bridge)
        uint24 poolFee;       // MVP: 3000 (USDT/WBTC 0.3% pool)
    }

    // ---------------------------------------------------------------- state
    uint16 public constant MAX_FEE_BPS = 100; // 1% hard cap
    uint128 public constant MAX_FEE_FLAT = 50_000; // 0.05 USDT hard cap
    uint64 public constant MIN_INTERVAL_FLOOR = 60;

    IERC20 public immutable usdt;
    ISwapRouter02 public immutable router;

    address public owner;
    address public keeper;
    address public treasury;
    uint16 public feeBps;
    uint128 public feeFlat; // USDT units (6 dec) charged per execution

    mapping(address => Plan) public plans;

    uint256 private locked = 1;

    modifier nonReentrant() {
        require(locked == 1, "reentrancy");
        locked = 2;
        _;
        locked = 1;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(
        address _usdt,
        address _router,
        address _keeper,
        address _treasury,
        uint16 _feeBps,
        uint128 _feeFlat
    ) {
        if (_usdt == address(0) || _router == address(0) || _keeper == address(0) || _treasury == address(0)) {
            revert ZeroAddress();
        }
        if (_feeBps > MAX_FEE_BPS || _feeFlat > MAX_FEE_FLAT) revert FeeTooHigh();
        usdt = IERC20(_usdt);
        router = ISwapRouter02(_router);
        owner = msg.sender;
        keeper = _keeper;
        treasury = _treasury;
        feeBps = _feeBps;
        feeFlat = _feeFlat;
    }

    // ---------------------------------------------------------------- user
    /// @notice Create (or replace) the caller's DCA plan. Pair with a USDT
    ///         approve covering the plan's total budget. First installment is
    ///         executable immediately.
    function createPlan(uint128 amountPerRun, uint64 minInterval, address tokenOut, uint24 poolFee) external {
        if (amountPerRun == 0 || tokenOut == address(0) || minInterval < MIN_INTERVAL_FLOOR) revert InvalidPlan();
        plans[msg.sender] = Plan({
            amountPerRun: amountPerRun,
            minInterval: minInterval,
            lastRun: 0,
            active: true,
            tokenOut: tokenOut,
            poolFee: poolFee
        });
        emit PlanCreated(msg.sender, amountPerRun, minInterval, tokenOut, poolFee);
    }

    function cancelPlan() external {
        if (!plans[msg.sender].active) revert PlanNotActive();
        plans[msg.sender].active = false;
        emit PlanCancelled(msg.sender);
    }

    // ---------------------------------------------------------------- keeper
    /// @notice Execute one installment of `user`'s plan. The purchased token
    ///         goes straight to the user's wallet.
    /// @param minAmountOut Slippage floor computed off-chain by the keeper.
    function execute(address user, uint256 minAmountOut) external nonReentrant returns (uint256 amountOut) {
        if (msg.sender != keeper) revert NotKeeper();
        Plan storage plan = plans[user];
        if (!plan.active) revert PlanNotActive();
        if (plan.lastRun != 0 && block.timestamp < plan.lastRun + plan.minInterval) revert IntervalNotElapsed();

        plan.lastRun = uint64(block.timestamp);

        uint256 amountIn = plan.amountPerRun;
        usdt.safeTransferFrom(user, address(this), amountIn);

        uint256 feeAmount = (amountIn * feeBps) / 10_000 + feeFlat;
        if (feeAmount >= amountIn) revert FeeTooHigh(); // la cuota debe superar el fee
        if (feeAmount != 0) usdt.safeTransfer(treasury, feeAmount);
        uint256 swapIn = amountIn - feeAmount;

        usdt.safeApprove(address(router), swapIn);
        amountOut = router.exactInputSingle(
            ISwapRouter02.ExactInputSingleParams({
                tokenIn: address(usdt),
                tokenOut: plan.tokenOut,
                fee: plan.poolFee,
                recipient: user,
                amountIn: swapIn,
                amountOutMinimum: minAmountOut,
                sqrtPriceLimitX96: 0
            })
        );

        emit Executed(user, amountIn, feeAmount, amountOut);
    }

    // ---------------------------------------------------------------- admin
    function setKeeper(address _keeper) external onlyOwner {
        if (_keeper == address(0)) revert ZeroAddress();
        keeper = _keeper;
        emit KeeperChanged(_keeper);
    }

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
        emit TreasuryChanged(_treasury);
    }

    function setFeeBps(uint16 _feeBps) external onlyOwner {
        if (_feeBps > MAX_FEE_BPS) revert FeeTooHigh();
        feeBps = _feeBps;
        emit FeeChanged(_feeBps);
    }

    function setFeeFlat(uint128 _feeFlat) external onlyOwner {
        if (_feeFlat > MAX_FEE_FLAT) revert FeeTooHigh();
        feeFlat = _feeFlat;
        emit FeeFlatChanged(_feeFlat);
    }

    function setOwner(address _owner) external onlyOwner {
        if (_owner == address(0)) revert ZeroAddress();
        owner = _owner;
    }
}
