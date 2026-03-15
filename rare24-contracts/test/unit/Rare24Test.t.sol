// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {Rare24} from "../../src/Rare24.sol";
import {StructLibrary} from "../../src/libraries/StructLibrary.sol";
import {ErrorsLibrary} from "../../src/libraries/ErrorsLibrary.sol";

contract Rare24Test is Test {
    Rare24 private rare24;

    // Users
    address owner = makeAddr("owner");
    address creator1 = makeAddr("creator1");
    address creator2 = makeAddr("creator2");
    address creator3 = makeAddr("creator3");
    address buyer1 = makeAddr("buyer1");
    address buyer2 = makeAddr("buyer2");
    address buyer3 = makeAddr("buyer3");
    address treasury = makeAddr("treasury");
    string creator_1 = "creator_1";
    string creator_2 = "creator_2";
    string creator_3 = "creator_3";
    string buyer_1 = "buyer_1";
    string buyer_2 = "buyer_2";
    string buyer_3 = "buyer_3";

    // Constants
    uint256 private constant STARTING_BALANCE = 10 ether;
    uint256 private constant MINT_PRICE = 0.1 ether;
    string private constant SAMPLE_URI =
        "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";

    function setUp() public {
        vm.prank(owner);
        rare24 = new Rare24(treasury, "");

        // Fund users
        vm.deal(creator1, STARTING_BALANCE);
        vm.deal(creator2, STARTING_BALANCE);
        vm.deal(buyer1, STARTING_BALANCE);
        vm.deal(buyer2, STARTING_BALANCE);
        vm.deal(buyer3, STARTING_BALANCE);
    }

    /**
     * Test that initial variables are set correctly
     */

    function testOwnerIsSetCorrectly() public view {
        assertEq(rare24.owner(), owner);
    }

    function testTreasuryWalletIsSetCorrectly() public view {
        assertEq(rare24.getTreasuryWallet(), treasury);
    }

    /* URI Uplaods */

    modifier uploadURI_c1() {
        vm.startPrank(creator1);
        address[] memory collaborators = new address[](2);
        collaborators[0] = creator2;
        collaborators[1] = creator3;
        rare24.uploadNft(SAMPLE_URI, MINT_PRICE, 20, creator_1, "", collaborators);
        _;
        vm.stopPrank();
    }

    modifier uploadURI_c2() {
        vm.startPrank(creator2);
        address[] memory collaborators = new address[](1);
        collaborators[0] = creator3;
        rare24.uploadNft(SAMPLE_URI, MINT_PRICE, 20, creator_2, "", collaborators);
        _;
        vm.stopPrank();
    }

    /* Upload URI */

    function testRevertUploadIfStillInCooldown() public uploadURI_c1 {
        vm.startPrank(creator1);
        vm.expectRevert(ErrorsLibrary.Main__CoolDownStillActive.selector);
        rare24.uploadNft(SAMPLE_URI, MINT_PRICE, 20, creator_1, "", new address[](0));
        vm.stopPrank();
    }

    function testCanUploadUriAfterCooldown() public uploadURI_c1 {
        vm.warp(block.timestamp + 25 hours); // Advance time by 25 hours
        vm.startPrank(creator1);
        rare24.uploadNft(SAMPLE_URI, MINT_PRICE, 20, creator_1, "", new address[](0));
        vm.stopPrank();

        uint expectedNumberOfTokenIds = 2;
        uint actualNumberOfTokenIds = rare24
            .getCreatorTokenIds(creator_1)
            .length;
        assertEq(expectedNumberOfTokenIds, actualNumberOfTokenIds);
    }

    function testRevertIfMoreThanMaxCollaborators() public {
        vm.startPrank(creator1);
        address[] memory collaborators = new address[](5); // 5 collaborators + sender = 6 total
        collaborators[0] = creator2;
        collaborators[1] = creator3;
        collaborators[2] = makeAddr("collab4");
        collaborators[3] = makeAddr("collab5");
        collaborators[4] = makeAddr("collab6");

        vm.expectRevert(ErrorsLibrary.Main__TooManyCollaborators.selector);
        rare24.uploadNft(SAMPLE_URI, MINT_PRICE, 20, creator_1, "", collaborators);
        vm.stopPrank();
    }

    function testRevertWhenZeroPrice() public {
        vm.startPrank(creator1);
        vm.expectRevert();
        rare24.uploadNft(SAMPLE_URI, 0, 20, creator_1, "", new address[](0));
        vm.stopPrank();
    }

    function testRevertWhenZeroMaxSupply() public {
        vm.startPrank(address(3));
        vm.warp(block.timestamp + 25 hours);
        vm.expectRevert(ErrorsLibrary.Main__InvalidMaxSupply.selector);
        rare24.uploadNft(SAMPLE_URI, MINT_PRICE, 0, creator_1, "", new address[](0));
        vm.stopPrank();
    }

    function testSuccessfulUpload() public uploadURI_c2 {
        // get creator tokenIDs
        uint256[] memory creator2TokenIds = rare24.getCreatorTokenIds(creator_2);
        assertEq(creator2TokenIds.length, 1);

        // check if values are set correctly
        StructLibrary.Photo memory photo = rare24.getPhotoDetails(
            creator2TokenIds[0]
        );
        assertEq(photo.metadataURI, SAMPLE_URI);
        assertEq(photo.price, MINT_PRICE);
        assertEq(photo.maxSupply, 20);
        assertEq(photo.creators.length, 2);
        assertEq(photo.creator, creator_2);

        // check tokenId URI
        string memory actualUri = rare24.uri(creator2TokenIds[0]);
        assertEq(actualUri, SAMPLE_URI);

        // check that user is added as last creator
        uint numberOfCreators = photo.creators.length;
        assertEq(photo.creators[numberOfCreators - 1], creator2);

        // check that tokenId counter was updated
        uint expectedId = 1;
        uint actualId = rare24.getTokenIdCounter();
        assertEq(expectedId, actualId);

        // check that user cannot upload again
        uint nextPost = rare24.getCreatorNextPost(creator_2);
        uint currentTime = block.timestamp;
        assert(currentTime < nextPost);
    }

    /* Set Values */

    function testSetPlatformFee() public {
        uint8 intialFee = 30;
        uint actualFee = rare24.getPlatformFee();
        assertEq(intialFee, actualFee);

        vm.startPrank(owner);
        // test reverts
        vm.expectRevert(ErrorsLibrary.Main__FeeTooLow.selector);
        rare24.setPlatformFee(6);

        vm.expectRevert(ErrorsLibrary.Main__FeeTooHigh.selector);
        rare24.setPlatformFee(51);

        // validate value doesn't change
        rare24.setPlatformFee(30);
        assertEq(30, rare24.getPlatformFee());

        // change value
        rare24.setPlatformFee(40);
        assertEq(40, rare24.getPlatformFee());

        vm.stopPrank();
    }

    function testSetTreasuryWallet() public {
        vm.startPrank(owner);

        // test revert
        vm.expectRevert(ErrorsLibrary.Main__InvalidPlatformWallet.selector);
        rare24.setTreasurytWallet(address(0));

        // change
        rare24.setTreasurytWallet(buyer2);
        address expectedWallet = buyer2;
        address actualWallet = rare24.getTreasuryWallet();
        assertEq(expectedWallet, actualWallet);

        vm.stopPrank();
    }

    /* User Mints Single */

    function testRevertMintIfMaxSupplyReached() public {
        // upload z
        vm.prank(creator1);
        rare24.uploadNft(SAMPLE_URI, MINT_PRICE, 2, creator_1, "", new address[](0));

        // buyer1 mints
        vm.prank(buyer1);
        rare24.mintPhoto{value: MINT_PRICE}(1, buyer_1);

        // buyer1 trys minting again
        vm.startPrank(buyer1);
        vm.expectRevert(ErrorsLibrary.Main__AlreadyMintedPhoto.selector);
        rare24.mintPhoto{value: MINT_PRICE}(1, buyer_1);
        vm.stopPrank();

        // buyer2 mints last
        vm.prank(buyer2);
        rare24.mintPhoto{value: MINT_PRICE}(1, buyer_2);

        // buyer3 tries minting
        vm.startPrank(buyer3);
        vm.expectRevert(ErrorsLibrary.Main__MaxSupplyReached.selector);
        rare24.mintPhoto{value: MINT_PRICE}(1, buyer_3);
        vm.stopPrank();
    }

    function testRevertMintIfNftIsDeactivated() public {
        // upload
        vm.prank(creator1);
        rare24.uploadNft(SAMPLE_URI, MINT_PRICE, 2, creator_1, "", new address[](0));

        // try deactivating photo as not the creator
        vm.startPrank(creator2);
        vm.expectRevert(ErrorsLibrary.Main__NotPhotoCreator.selector);
        rare24.deactivatePhoto(1);
        vm.stopPrank();

        // deactivate photo
        vm.prank(creator1);
        rare24.deactivatePhoto(1);

        // try minting
        vm.startPrank(buyer2);
        vm.expectRevert(ErrorsLibrary.Main__PhotoInactive.selector);
        rare24.mintPhoto{value: MINT_PRICE}(1, buyer_1);
        vm.stopPrank();
    }

    function testRevertMintIfPeriodExpired() public {
        // upload
        vm.prank(creator1);
        rare24.uploadNft(SAMPLE_URI, MINT_PRICE, 2, creator_1, "", new address[](0));
        // forward time
        vm.warp(block.timestamp + 25 hours);

        // try minting
        vm.startPrank(buyer2);
        vm.expectRevert(ErrorsLibrary.Main__MintDurationExpired.selector);
        rare24.mintPhoto{value: MINT_PRICE}(1, buyer_1);
        vm.stopPrank();
    }

    function testRevertWhenLessEthIsSent() public {
        // upload
        vm.prank(creator1);
        rare24.uploadNft(SAMPLE_URI, MINT_PRICE, 2, creator_1, "", new address[](0));

        // try minting
        uint lessEth = 0.01 ether;
        uint excessEth = 1 ether;

        vm.startPrank(buyer2);
        // less Eth
        vm.expectRevert(ErrorsLibrary.Main__InsufficientFunds.selector);
        rare24.mintPhoto{value: lessEth}(1, buyer_2);
        // excess ETH
        vm.expectRevert(ErrorsLibrary.Main__ExcessiveFunds.selector);
        rare24.mintPhoto{value: excessEth}(1, buyer_2);
        vm.stopPrank();
    }

    function testSuccessfulMint() public uploadURI_c1 {
        // mint
        vm.startPrank(buyer1);
        rare24.mintPhoto{value: MINT_PRICE}(1, buyer_1);
        vm.stopPrank();

        // total mints
        uint256 actualTotalMints = rare24.getCreatorTotalMints(creator_1);
        uint256 expectedTotalMints = 1;
        assertEq(actualTotalMints, expectedTotalMints);

        // tokenId added to user
        uint256[] memory actualArray = rare24.getUserMintedTokenIds(buyer_1);
        uint expectedTokenId = 1;
        uint actualTokenId = actualArray[0];
        assertEq(expectedTokenId, actualTokenId);

        // number of minted token
        StructLibrary.Photo memory photo = rare24.getPhotoDetails(1);
        uint expctedMints = 1;
        uint actualMints = photo.totalMinted;
        assertEq(expctedMints, actualMints);

        // user balance
        uint256 expectedBal = 1;
        uint256 actualBalance = rare24.balanceOf(buyer1, 1);
        assertEq(expectedBal, actualBalance);
    }

    function testSuccessfulFundDistribution() public uploadURI_c1 {
        StructLibrary.Photo memory photo = rare24.getPhotoDetails(1);

        // creators starting balance
        uint256[] memory startingBalances = new uint256[](3);
        for (uint i = 0; i < photo.creators.length; i++) {
            startingBalances[i] = photo.creators[i].balance;
        }
        uint256 contractStartingBalance = address(rare24).balance;
        // expcted gains
        uint256 expectedCreatorGains = 0.07 ether / photo.creators.length;
        uint256 expectedPlaformGains = 0.03 ether;

        // mint
        vm.startPrank(buyer1);
        rare24.mintPhoto{value: MINT_PRICE}(1, buyer_1);
        vm.stopPrank();

        // creators current balance
        for (uint i = 0; i < photo.creators.length; i++) {
            uint256 userStartingBalance = startingBalances[i];
            uint256 currentUserBalance = photo.creators[i].balance;
            if(i == (photo.creators.length - 1) && photo.creators.length == 3) {
                assertEq(userStartingBalance + expectedCreatorGains + uint256(1), currentUserBalance);
                assertEq(expectedCreatorGains + uint256(1), rare24.getCreatorAccruedFunds(photo.creators[i]));
            } else {
                assertEq(userStartingBalance + expectedCreatorGains, currentUserBalance);
                assertEq(expectedCreatorGains, rare24.getCreatorAccruedFunds(photo.creators[i]));
            }
        }

        uint256 currentContractBalance = address(rare24).balance;
        console.log("contractStartingBalance: ", contractStartingBalance);
        console.log("currentContractBalance: ", currentContractBalance);
        assert(
            currentContractBalance >=
                (contractStartingBalance + expectedPlaformGains)
        );

        // platform revenue
        assertEq(expectedPlaformGains, rare24.getPlatformRevenue());
    }

    /* Withdraw Funds */

    function testSuccessfulWithdrawal() public uploadURI_c1 {
        // mint
        vm.startPrank(buyer1);
        rare24.mintPhoto{value: MINT_PRICE}(1, buyer_1);
        vm.stopPrank();

        // withdraw
        uint256 contractStartingBalance = address(rare24).balance;
        uint256 withdrawal = 0.01 ether;
        uint256 startingTreasuryBalance = address(treasury).balance;

        vm.prank(owner);
        rare24.withdrawPlatformRevenue(withdrawal);

        uint256 currentContractBalance = address(rare24).balance;
        uint256 currentTreasuryBalance = address(treasury).balance;

        assertEq(contractStartingBalance, currentContractBalance + withdrawal);
        assertEq(currentTreasuryBalance, startingTreasuryBalance + withdrawal);
    }

    function testRevertWithdrawalIfNotOwner() public uploadURI_c1 {
        // mint
        vm.startPrank(buyer1);
        rare24.mintPhoto{value: MINT_PRICE}(1, buyer_1);
        vm.stopPrank();

        // try withdrawing
        vm.startPrank(buyer2);
        vm.expectRevert();
        rare24.withdrawPlatformRevenue(0.01 ether);
        vm.stopPrank();
    }

    function testRevertWithdrawalWhenContractBalanceIsZero() public {
        // try withdrawing
        vm.startPrank(owner);
        vm.expectRevert(ErrorsLibrary.Main__CannotWithdrawZeroFunds.selector);
        rare24.withdrawPlatformRevenue(0.01 ether);
        vm.stopPrank();
    }

    function testRevertWithdrawalWhenAmountIsZero() public uploadURI_c1 {
        // mint
        vm.startPrank(buyer1);
        rare24.mintPhoto{value: MINT_PRICE}(1, buyer_1);
        vm.stopPrank();

        vm.startPrank(owner);
        vm.expectRevert(ErrorsLibrary.Main__CannotWithdrawZeroFunds.selector);
        rare24.withdrawPlatformRevenue(0);
        vm.stopPrank();
    }

    function testSetWithdrawalAmountAsContractBalance() public uploadURI_c1 {
        // mint
        vm.startPrank(buyer1);
        rare24.mintPhoto{value: MINT_PRICE}(1, buyer_1);
        vm.stopPrank();

        uint256 startingTreasuryBalance = address(treasury).balance;
        uint256 expectedTreasuryBalance = 30_000_000_000_000_000;
        uint256 contractStartingBalance = address(rare24).balance;

        vm.prank(owner);
        rare24.withdrawPlatformRevenue(0.1 ether);

        uint256 currentTreasuryBalance = address(treasury).balance;
        uint256 expectedFinalTreasuryBalance = 0;
        uint256 currentContractBalance = address(rare24).balance;

        assertEq(contractStartingBalance, expectedTreasuryBalance);
        assertEq(currentContractBalance, expectedFinalTreasuryBalance);

        assertEq(
            currentTreasuryBalance,
            startingTreasuryBalance + expectedTreasuryBalance
        );
    }

    /* Batch Mint */

    function testRevertIfMaxBatchIsExceeded() public {
        // token Ids
        uint256 excessTokenIds = 6;
        uint256[] memory tokenIds = new uint256[](excessTokenIds);
        for (uint256 i = 0; i < excessTokenIds; i++) {
            tokenIds[i] = i + 1;
        }

        // try batch minting
        vm.startPrank(buyer1);
        vm.expectRevert(ErrorsLibrary.Main__BatchLimitExceeded.selector);
        rare24.batchMintPhotos{value: MINT_PRICE}(tokenIds, buyer_1);
        vm.stopPrank();
    }

    function testRevertIfFundsAreInsufficientOrExcess()
        public
        uploadURI_c1
        uploadURI_c2
    {
        // token Ids
        uint256 excessTokenIds = 2;
        uint256[] memory tokenIds = new uint256[](excessTokenIds);
        for (uint256 i = 0; i < excessTokenIds; i++) {
            tokenIds[i] = i + 1;
        }

        vm.startPrank(buyer1);
        // less
        uint256 lessEth = 0.1 ether;
        vm.expectRevert(
            ErrorsLibrary.Main__InsufficientFundsForBatchMint.selector
        );
        rare24.batchMintPhotos{value: lessEth}(tokenIds, buyer_1);

        // excess
        uint256 excessEth = 0.3 ether;
        vm.expectRevert(ErrorsLibrary.Main__ExcessFundsForBatchMint.selector);
        rare24.batchMintPhotos{value: excessEth}(tokenIds, buyer_1);

        vm.stopPrank();
    }

    function testSuccessFulBatchMint() public uploadURI_c1 uploadURI_c2 {
        // token Ids
        uint256 excessTokenIds = 2;
        uint256[] memory tokenIds = new uint256[](excessTokenIds);
        for (uint256 i = 0; i < excessTokenIds; i++) {
            tokenIds[i] = i + 1;
        }

        // mint
        vm.startPrank(buyer1);
        uint256 amount = 0.2 ether;
        rare24.batchMintPhotos{value: amount}(tokenIds, buyer_1);
        vm.stopPrank();

        // user balances
        for (uint256 i = 0; i < excessTokenIds; i++) {
            uint256 actualTokenBalance = rare24.balanceOf(buyer1, i + 1);
            uint256 expectedTokenBalance = 1;
            assertEq(actualTokenBalance, expectedTokenBalance);
        }
    }

    function testCorrectFundsDistributionOnSuccessfulBatchMint()
        public
        uploadURI_c1
        uploadURI_c2
    {
        // states
        uint256 expectedC1Gain = 0.07 ether / uint256(3);
        uint256 expectedC2Gain = 0.07 ether / uint256(2);

        uint256 startingC1Balance = creator1.balance;
        uint256 startingC2Balance = creator2.balance;
        uint256 startingC3Balance = creator3.balance;
        uint256 startingContractBalance = address(rare24).balance;

        // token Ids
        uint256 excessTokenIds = 2;
        uint256[] memory tokenIds = new uint256[](excessTokenIds);
        for (uint256 i = 0; i < excessTokenIds; i++) {
            tokenIds[i] = i + 1;
        }

        // mint
        vm.startPrank(buyer1);
        uint256 amount = 0.2 ether;
        rare24.batchMintPhotos{value: amount}(tokenIds, buyer_1);
        vm.stopPrank();

        //
        uint256 finalC1Balance = creator1.balance;
        uint256 finalC2Balance = creator2.balance;
        uint256 finalC3Balance = creator3.balance;
        uint256 finalContractBalance = address(rare24).balance;

        assertEq(
            finalC1Balance, 
            startingC1Balance + expectedC1Gain + uint256(1)
        );
        assertEq(
            finalC2Balance,
            startingC2Balance + expectedC1Gain + expectedC2Gain
        );
        assertEq(
            finalC3Balance,
            startingC3Balance + expectedC1Gain + expectedC2Gain
        );
        assertEq(
            finalContractBalance,
            startingContractBalance + (30_000_000_000_000_000 * 2)
        );
    }
}
