// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Test} from "forge-std/Test.sol";
import {DecentralizedStableCoin} from "../../src/DecentralizedStableCoin.sol";

contract DecentralizedStablecoinTest is Test {
    DecentralizedStableCoin dsc;

    address public USER = makeAddr("user");
    uint256 public constant MINT_AMOUNT = 100 ether;

    function setUp() public {
        dsc = new DecentralizedStableCoin();
    }

    function testMustMintMoreThanZero() public {
        vm.prank(dsc.owner());
        vm.expectRevert(DecentralizedStableCoin.DecentralizedStableCoin__MustBeAboveZero.selector);
        dsc.mint(USER, 0);
    }

    function testMustBurnMoreThanZero() public {
        vm.startPrank(dsc.owner());
        dsc.mint(dsc.owner(), MINT_AMOUNT);
        vm.expectRevert(DecentralizedStableCoin.DecentralizedStableCoin__MustBeAboveZero.selector);
        dsc.burn(0);
        vm.stopPrank();
    }

    function testCantBurnMoreThanYouHave() public {
        vm.startPrank(dsc.owner());
        dsc.mint(dsc.owner(), 100);
        vm.expectRevert("ERC20: burn amount exceeds balance");
        dsc.burn(101);
        vm.stopPrank();
    }

    function testCantMintToZeroAddress() public {
        vm.prank(dsc.owner());
        vm.expectRevert(DecentralizedStableCoin.DecentralizedStableCoin__NotZeroAddress.selector);
        dsc.mint(address(0), 100);
    }

    function testOnlyOwnerCanMint() public {
        vm.prank(USER);
        vm.expectRevert("Ownable: caller is not the owner");
        dsc.mint(USER, MINT_AMOUNT);
    }

    function testCanMintAndBurnAsOwner() public {
        vm.startPrank(dsc.owner());
        dsc.mint(dsc.owner(), MINT_AMOUNT);
        dsc.burn(MINT_AMOUNT);
        vm.stopPrank();
        assertEq(dsc.balanceOf(dsc.owner()), 0);
        assertEq(dsc.totalSupply(), 0);
    }

    function testBurnFromMustBeMoreThanZero() public {
        vm.prank(dsc.owner());
        vm.expectRevert(DecentralizedStableCoin.DecentralizedStableCoin__MustBeAboveZero.selector);
        dsc.burnFrom(USER, 0);
    }

    function testBurnFromWorksWithAllowance() public {
        dsc.mint(USER, MINT_AMOUNT);

        vm.prank(USER);
        dsc.approve(address(this), MINT_AMOUNT);

        dsc.burnFrom(USER, MINT_AMOUNT);

        assertEq(dsc.balanceOf(USER), 0);
    }
}
