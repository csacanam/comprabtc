// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {DCAExecutor} from "../src/DCAExecutor.sol";

/// @dev Deploy to Celo mainnet:
///   export KEEPER_ADDRESS=0x...      # EOA que ejecutará los planes
///   export TREASURY_ADDRESS=0x...    # destino del fee de protocolo
///   export CELOSCAN_API_KEY=...      # para verificación
///   forge script script/Deploy.s.sol --rpc-url celo --broadcast --verify \
///     --interactives 1               # pega la private key del deployer al prompt
contract Deploy is Script {
    address constant USDT = 0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e;
    address constant ROUTER = 0x5615CDAb10dc425a742d643d949a7F474C01abc4; // SwapRouter02
    uint16 constant FEE_BPS = 100; // 1%
    uint128 constant FEE_FLAT = 5000; // $0.005 por ejecución

    function run() external {
        address keeper = vm.envAddress("KEEPER_ADDRESS");
        address treasury = vm.envAddress("TREASURY_ADDRESS");

        vm.startBroadcast();
        DCAExecutor executor = new DCAExecutor(USDT, ROUTER, keeper, treasury, FEE_BPS, FEE_FLAT);
        vm.stopBroadcast();

        console.log("DCAExecutor:", address(executor));
        console.log("  keeper:  ", keeper);
        console.log("  treasury:", treasury);
        console.log("  feeBps:  ", FEE_BPS);
        console.log("  feeFlat: ", FEE_FLAT);
    }
}
