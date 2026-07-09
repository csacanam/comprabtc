// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {DCAExecutor, ISwapRouter02, IERC20} from "../src/DCAExecutor.sol";

/// @dev Mimics USDT: 6 decimals and no bool return on transfer/approve.
contract MockUSDT {
    string public constant symbol = "USDT";
    uint8 public constant decimals = 6;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function transfer(address to, uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
    }

    function transferFrom(address from, address to, uint256 amount) external {
        require(balanceOf[from] >= amount, "balance");
        require(allowance[from][msg.sender] >= amount, "allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external {
        allowance[msg.sender][spender] = amount;
    }
}

contract MockWBTC {
    string public constant symbol = "WBTC";
    uint8 public constant decimals = 8;
    mapping(address => uint256) public balanceOf;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

/// @dev Pays out WBTC at a fixed rate and respects amountOutMinimum.
contract MockRouter is ISwapRouter02 {
    MockUSDT public usdt;
    MockWBTC public wbtc;
    // sats per USDT unit: 1 USDT (1e6) -> `rate` sats. 1000 sats/USDT ~ $100k BTC.
    uint256 public rate = 1000;

    constructor(MockUSDT _usdt, MockWBTC _wbtc) {
        usdt = _usdt;
        wbtc = _wbtc;
    }

    function setRate(uint256 _rate) external {
        rate = _rate;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut)
    {
        require(params.tokenIn == address(usdt), "tokenIn");
        require(params.tokenOut == address(wbtc), "tokenOut");
        usdt.transferFrom(msg.sender, address(this), params.amountIn);
        amountOut = (params.amountIn * rate) / 1e6;
        require(amountOut >= params.amountOutMinimum, "Too little received");
        wbtc.mint(params.recipient, amountOut);
    }
}

contract DCAExecutorTest is Test {
    DCAExecutor executor;
    MockUSDT usdt;
    MockWBTC wbtc;
    MockRouter router;

    address keeper = makeAddr("keeper");
    address treasury = makeAddr("treasury");
    address alice = makeAddr("alice");

    uint16 constant FEE_BPS = 100; // 1%
    uint128 constant FEE_FLAT = 5000; // $0.005
    uint128 constant AMOUNT = 20e6; // $20 per run
    uint64 constant INTERVAL = 1 hours;

    function setUp() public {
        usdt = new MockUSDT();
        wbtc = new MockWBTC();
        router = new MockRouter(usdt, wbtc);
        executor = new DCAExecutor(address(usdt), address(router), keeper, treasury, FEE_BPS, FEE_FLAT);

        usdt.mint(alice, 200e6); // $200 budget
        vm.prank(alice);
        usdt.approve(address(executor), 200e6);
    }

    function _createPlan() internal {
        vm.prank(alice);
        executor.createPlan(AMOUNT, INTERVAL, address(wbtc), 3000);
    }

    // ---------------------------------------------------------- happy path
    function test_ExecuteHappyPath() public {
        _createPlan();

        vm.prank(keeper);
        uint256 out = executor.execute(alice, 0);

        uint256 fee = (uint256(AMOUNT) * FEE_BPS) / 10_000 + FEE_FLAT; // 1% + $0.005
        assertEq(usdt.balanceOf(treasury), fee, "treasury fee");
        assertEq(usdt.balanceOf(alice), 200e6 - AMOUNT, "alice charged one installment");
        assertEq(wbtc.balanceOf(alice), out, "wbtc goes straight to alice");
        assertEq(out, ((AMOUNT - fee) * 1000) / 1e6, "swap output at mock rate");
        assertEq(usdt.balanceOf(address(executor)), 0, "contract holds nothing");
    }

    function test_FirstRunExecutableImmediately() public {
        _createPlan();
        vm.prank(keeper);
        executor.execute(alice, 0); // no revert right after createPlan
    }

    function test_ExecuteAfterIntervalElapsed() public {
        _createPlan();
        vm.prank(keeper);
        executor.execute(alice, 0);

        vm.warp(block.timestamp + INTERVAL);
        vm.prank(keeper);
        executor.execute(alice, 0);

        assertEq(usdt.balanceOf(alice), 200e6 - 2 * uint256(AMOUNT));
    }

    // ---------------------------------------------------------- on-chain limits
    function test_RevertWhen_IntervalNotElapsed() public {
        _createPlan();
        vm.prank(keeper);
        executor.execute(alice, 0);

        vm.warp(block.timestamp + INTERVAL - 1);
        vm.prank(keeper);
        vm.expectRevert(DCAExecutor.IntervalNotElapsed.selector);
        executor.execute(alice, 0);
    }

    function test_RevertWhen_NotKeeper() public {
        _createPlan();
        vm.prank(alice);
        vm.expectRevert(DCAExecutor.NotKeeper.selector);
        executor.execute(alice, 0);
    }

    function test_RevertWhen_PlanNotActive() public {
        vm.prank(keeper);
        vm.expectRevert(DCAExecutor.PlanNotActive.selector);
        executor.execute(alice, 0);
    }

    function test_KeeperCannotChargeMoreThanPlanAmount() public {
        // The keeper has no parameter to change the amount — it is fixed on-chain.
        _createPlan();
        vm.prank(keeper);
        executor.execute(alice, 0);
        assertEq(usdt.balanceOf(alice), 200e6 - AMOUNT);
    }

    // ---------------------------------------------------------- funds edge cases
    function test_RevertWhen_InsufficientBalance() public {
        _createPlan();
        vm.prank(alice);
        usdt.transfer(address(0xdead), 195e6); // alice spends her USDT elsewhere

        vm.prank(keeper);
        vm.expectRevert(); // keeper catches this off-chain and marks no_funds
        executor.execute(alice, 0);
    }

    function test_RevertWhen_AllowanceRevoked() public {
        _createPlan();
        vm.prank(alice);
        usdt.approve(address(executor), 0); // user cancels via approve(0)

        vm.prank(keeper);
        vm.expectRevert();
        executor.execute(alice, 0);
    }

    function test_RevertWhen_SlippageTooHigh() public {
        _createPlan();
        vm.prank(keeper);
        vm.expectRevert("Too little received");
        executor.execute(alice, type(uint256).max);
    }

    // ---------------------------------------------------------- plan lifecycle
    function test_CancelPlan() public {
        _createPlan();
        vm.prank(alice);
        executor.cancelPlan();

        vm.prank(keeper);
        vm.expectRevert(DCAExecutor.PlanNotActive.selector);
        executor.execute(alice, 0);
    }

    function test_RevertWhen_CancelWithoutPlan() public {
        vm.prank(alice);
        vm.expectRevert(DCAExecutor.PlanNotActive.selector);
        executor.cancelPlan();
    }

    function test_RecreatePlanReplacesOld() public {
        _createPlan();
        vm.prank(alice);
        executor.createPlan(50e6, 2 hours, address(wbtc), 3000);

        (uint128 amountPerRun, uint64 minInterval,,,,) = executor.plans(alice);
        assertEq(amountPerRun, 50e6);
        assertEq(minInterval, 2 hours);
    }

    function test_RevertWhen_InvalidPlanParams() public {
        vm.startPrank(alice);
        vm.expectRevert(DCAExecutor.InvalidPlan.selector);
        executor.createPlan(0, INTERVAL, address(wbtc), 3000);
        vm.expectRevert(DCAExecutor.InvalidPlan.selector);
        executor.createPlan(AMOUNT, 59, address(wbtc), 3000);
        vm.expectRevert(DCAExecutor.InvalidPlan.selector);
        executor.createPlan(AMOUNT, INTERVAL, address(0), 3000);
        vm.stopPrank();
    }

    // ---------------------------------------------------------- fees & admin
    function test_ZeroFee() public {
        executor.setFeeBps(0);
        executor.setFeeFlat(0);
        _createPlan();

        vm.prank(keeper);
        executor.execute(alice, 0);
        assertEq(usdt.balanceOf(treasury), 0);
    }

    function test_FlatFeeAlwaysCharged() public {
        executor.setFeeBps(0); // solo fee fijo
        _createPlan();

        vm.prank(keeper);
        executor.execute(alice, 0);
        assertEq(usdt.balanceOf(treasury), FEE_FLAT, "flat fee to treasury");
    }

    function test_RevertWhen_FeeExceedsInstallment() public {
        // cuota de $0.005 == fee fijo → el fee se comería toda la cuota
        vm.prank(alice);
        executor.createPlan(uint128(FEE_FLAT), INTERVAL, address(wbtc), 3000);

        vm.prank(keeper);
        vm.expectRevert(DCAExecutor.FeeTooHigh.selector);
        executor.execute(alice, 0);
    }

    function test_RevertWhen_FeeAboveCap() public {
        vm.expectRevert(DCAExecutor.FeeTooHigh.selector);
        executor.setFeeBps(101);

        vm.expectRevert(DCAExecutor.FeeTooHigh.selector);
        executor.setFeeFlat(50_001);

        vm.expectRevert(DCAExecutor.FeeTooHigh.selector);
        new DCAExecutor(address(usdt), address(router), keeper, treasury, 101, 0);

        vm.expectRevert(DCAExecutor.FeeTooHigh.selector);
        new DCAExecutor(address(usdt), address(router), keeper, treasury, 100, 50_001);
    }

    function test_OnlyOwnerAdmin() public {
        vm.startPrank(alice);
        vm.expectRevert(DCAExecutor.NotOwner.selector);
        executor.setKeeper(alice);
        vm.expectRevert(DCAExecutor.NotOwner.selector);
        executor.setFeeBps(10);
        vm.expectRevert(DCAExecutor.NotOwner.selector);
        executor.setFeeFlat(10);
        vm.expectRevert(DCAExecutor.NotOwner.selector);
        executor.setTreasury(alice);
        vm.stopPrank();
    }

    function test_SetKeeper() public {
        address newKeeper = makeAddr("newKeeper");
        executor.setKeeper(newKeeper);
        _createPlan();

        vm.prank(keeper);
        vm.expectRevert(DCAExecutor.NotKeeper.selector);
        executor.execute(alice, 0);

        vm.prank(newKeeper);
        executor.execute(alice, 0);
    }

    // ---------------------------------------------------------- attribution tag
    function test_ExecuteWithTrailingCalldataTag() public {
        // ERC-8021 attribution tags are appended after the calldata; the EVM
        // must ignore them and execution must succeed unchanged.
        _createPlan();
        bytes memory call = abi.encodeCall(DCAExecutor.execute, (alice, 0));
        bytes memory tagged = abi.encodePacked(call, hex"636f6d707261627463_80218021802180218021802180218021");

        vm.prank(keeper);
        (bool ok,) = address(executor).call(tagged);
        assertTrue(ok, "tagged call succeeds");
        assertGt(wbtc.balanceOf(alice), 0);
    }
}
