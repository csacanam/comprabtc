// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {DCAExecutor, IERC20} from "../src/DCAExecutor.sol";

/// @dev Integration test against Celo mainnet state: real USDT (non-bool
///      returns), real SwapRouter02, real USDT/WBTC 0.3% pool.
///      Run: forge test --match-contract Fork -vv
contract DCAExecutorForkTest is Test {
    address constant USDT = 0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e;
    address constant WBTC = 0x8aC2901Dd8A1F17a1A4768A6bA4C3751e3995B2D; // native bridge, 8 dec
    address constant ROUTER = 0x5615CDAb10dc425a742d643d949a7F474C01abc4; // SwapRouter02

    DCAExecutor executor;
    address keeper = makeAddr("keeper");
    address treasury = makeAddr("treasury");
    address alice = makeAddr("alice");

    function setUp() public {
        vm.createSelectFork(vm.envOr("CELO_RPC", string("https://celo.drpc.org")));
        executor = new DCAExecutor(USDT, ROUTER, keeper, treasury, 100, 5000);

        deal(USDT, alice, 100e6, true); // $100
        vm.prank(alice);
        IERC20(USDT).approve(address(executor), 100e6);
    }

    function test_Fork_ExecuteBuysRealWBTC() public {
        vm.prank(alice);
        executor.createPlan(20e6, 1 hours, WBTC, 3000); // $20/run on the 0.3% pool

        vm.prank(keeper);
        uint256 out = executor.execute(alice, 1); // minOut>0: pool must pay something

        // $20 - 0.5% fee = $19.90 swapped. At any sane BTC price that is
        // between ~5k sats ($400k/BTC) and ~200k sats ($10k/BTC).
        assertEq(IERC20(WBTC).balanceOf(alice), out);
        assertGt(out, 5_000, "output implausibly low - pool broken?");
        assertLt(out, 200_000, "output implausibly high");
        assertEq(IERC20(USDT).balanceOf(treasury), 0.205e6, "1% + $0.005 fee of $20");
        assertEq(IERC20(USDT).balanceOf(alice), 80e6, "one installment charged");
        assertEq(IERC20(USDT).balanceOf(address(executor)), 0, "nothing retained");
    }

    function test_Fork_SecondRunRespectsInterval() public {
        vm.prank(alice);
        executor.createPlan(20e6, 1 hours, WBTC, 3000);

        vm.prank(keeper);
        executor.execute(alice, 1);

        vm.prank(keeper);
        vm.expectRevert(DCAExecutor.IntervalNotElapsed.selector);
        executor.execute(alice, 1);

        vm.warp(block.timestamp + 1 hours);
        vm.prank(keeper);
        executor.execute(alice, 1);
    }
}
