// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error NftMarketplace__PriceMustBeAboveZero();
error NftMarketplace__NotApprovedForMarketPlace();
error NftMarketplace__NftAlreadyBeListed(address nftAddress, uint256 tokenId);
error NftMarketplace__NotTheOwner();
error NftMarketplace__NotEnoughPayment(
    address nftAddress,
    uint256 tokenId,
    uint256 nftPrice
);
error NftMarketplace__NftWasNotListed(address nftAddress, uint256 tokenId);
error NftMarketplace__NoProceedToWithdraw();
error NftMarketplace__FailToWithdrawProceed();

contract NftMarketplace is ReentrancyGuard {
    //Type variable
    struct Listing {
        uint256 price;
        address seller;
    }

    event ItemListed(
        address indexed owner,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event SoldItemDelisted(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokeId,
        uint256 price
    );

    event CancelListing(
        address indexed owner,
        address indexed nftAddress,
        uint256 indexed tokenId
    );
    event PriceUpdated(
        address indexed owner,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    //State variable
    mapping(address => mapping(uint256 => Listing)) private s_listing;
    mapping(address => uint256) private s_proceed;

    modifier notListed(
        address nftAddress,
        uint256 tokenId,
        address owner
    ) {
        Listing memory listing = s_listing[nftAddress][tokenId];
        if (listing.price > 0) {
            revert NftMarketplace__NftAlreadyBeListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (owner != spender) {
            revert NftMarketplace__NotTheOwner();
        }
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listing[nftAddress][tokenId];
        if (listing.price <= 0) {
            revert NftMarketplace__NftWasNotListed(nftAddress, tokenId);
        }
        _;
    }

    /*
     *@notice Method for listing NFT on the marketplace
     *@param nftAddress: Address of the NFT
     *@param tokenId: The token id of the NFT
     *@param price: The price of the NFT to be sold on the marketplace
     *@dev By this way, the NFT owner can still hold the NFT and at the same time, allows the contract to operate the token
     */

    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        notListed(nftAddress, tokenId, msg.sender)
        isOwner(nftAddress, tokenId, msg.sender)
    {
        //make sure only owner can list item
        if (price <= 0) {
            revert NftMarketplace__PriceMustBeAboveZero();
        }
        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) {
            revert NftMarketplace__NotApprovedForMarketPlace();
        }
        s_listing[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    function buyItem(
        address nftAddress,
        uint256 tokenId
    ) external payable isListed(nftAddress, tokenId) nonReentrant {
        Listing memory listedItem = s_listing[nftAddress][tokenId];
        if (msg.value < listedItem.price) {
            revert NftMarketplace__NotEnoughPayment(
                nftAddress,
                tokenId,
                listedItem.price
            );
        }
        s_proceed[listedItem.seller] += msg.value;
        delete (s_listing[nftAddress][tokenId]);
        IERC721 nft = IERC721(nftAddress);
        nft.safeTransferFrom(listedItem.seller, msg.sender, tokenId);

        emit SoldItemDelisted(
            msg.sender,
            nftAddress,
            tokenId,
            listedItem.price
        );
    }

    function cancelItem(
        address nftAddress,
        uint256 tokenId
    )
        external
        isListed(nftAddress, tokenId)
        isOwner(nftAddress, tokenId, msg.sender)
    {
        delete (s_listing[nftAddress][tokenId]);
        emit CancelListing(msg.sender, nftAddress, tokenId);
    }

    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    )
        external
        nonReentrant
        isListed(nftAddress, tokenId)
        isOwner(nftAddress, tokenId, msg.sender)
    {
        if (newPrice <= 0) {
            revert NftMarketplace__PriceMustBeAboveZero();
        }
        s_listing[nftAddress][tokenId].price = newPrice;
        emit PriceUpdated(msg.sender, nftAddress, tokenId, newPrice);
    }

    function withdrawProceed() external {
        uint256 proceed = s_proceed[msg.sender];
        if (proceed <= 0) {
            revert NftMarketplace__NoProceedToWithdraw();
        }
        proceed = 0;
        (bool success, ) = payable(msg.sender).call{value: proceed}("");
        if (!success) {
            revert NftMarketplace__FailToWithdrawProceed();
        }
    }

    ///////////////////
    //getter function//
    ///////////////////

    function getListing(
        address nftAddress,
        uint256 tokenId
    ) external view returns (Listing memory) {
        return s_listing[nftAddress][tokenId];
    }

    function getProceed(address seller) external view returns (uint256) {
        return s_proceed[seller];
    }
}
