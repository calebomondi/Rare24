// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {NftMarketplace} from "../src/userActivities/NftMarketplace.sol";

contract DeployMarketplace is Script {
    address private _rare24 = address(0xb4EA1DD2c52C64f8F99B016C7DE50C90f97Cb3AD);
    
    function run() external returns(NftMarketplace nftMarket) {
        vm.startBroadcast();
        nftMarket = new NftMarketplace(payable(_rare24));
        vm.stopBroadcast();
    }
}