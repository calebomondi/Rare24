// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {Rare24} from "../src/Rare24.sol";
import {NftMarketplace} from "../src/userActivities/NftMarketplace.sol";

contract DeployRare24 is Script {
    string private BASE_URI = "";
    address private PLATFORM_WALLET = vm.envAddress("PLATFORM_WALLET");
    
    function run() external returns(Rare24 rare24, NftMarketplace nftMarket) {
        vm.startBroadcast();
        rare24 = new Rare24(PLATFORM_WALLET, BASE_URI);
        nftMarket = new NftMarketplace(payable(address(rare24)));
        vm.stopBroadcast();
    }
}