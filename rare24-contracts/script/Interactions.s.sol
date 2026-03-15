// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {DevOpsTools} from "lib/foundry-devops/src/DevOpsTools.sol";
import {Rare24} from "../src/Rare24.sol";

contract MintBasicNft is Script {
    string public constant PUG_URI = "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";

    function run() external {
        address mostRecentlyDeployed = DevOpsTools.get_most_recent_deployment(
            "Rare24",
            block.chainid
        );
        mintNftOnContract(payable(mostRecentlyDeployed));
    }

    function mintNftOnContract(address payable contractAddress) public {
        uint mintPrice = 0.01 ether;
        string memory creator = "creator";
        string memory buyer_1 = "buyer_1";

        vm.startBroadcast();
        // uploadNft
        Rare24(contractAddress).uploadNft(
            PUG_URI,
            mintPrice,
            10,
            creator,
            "",
            new address[](0)
        );
        // mintNft
        Rare24(contractAddress).mintPhoto{value: mintPrice}(1, buyer_1);
        vm.stopBroadcast();
    }
}
