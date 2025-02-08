// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DataMarketplace {
    uint256 public listingCount;

    struct DataListing {
        address payable owner;
        string title;
        uint256 price;
        string description;
        string dataHash;
        bool active;
    }

    struct Purchase {
        address buyer;
        uint256 amount;
        bool deliveryConfirmed;
    }

    struct Review {
        address reviewer;
        uint8 rating;
        string comment;
    }

    // Core mappings
    mapping(uint256 => DataListing) public listings;
    mapping(uint256 => mapping(address => Purchase)) public purchases;
    mapping(uint256 => mapping(address => bool)) public purchaseExists;
    mapping(uint256 => Review[]) public reviews;

    // Purchase tracking additions
    mapping(address => uint256[]) private userPurchases;
    mapping(uint256 => uint256) public purchaseCounts;

    // Events
    event ListingCreated(
        uint256 indexed listingId, address owner, string title, uint256 price, string description, string dataHash
    );
    event ListingDeactivated(uint256 indexed listingId);
    event PurchaseMade(uint256 indexed listingId, address buyer, uint256 amount);
    event DeliveryConfirmed(uint256 indexed listingId, address buyer);
    event ReviewSubmitted(uint256 indexed listingId, address reviewer, uint8 rating);

    // Create new listing
    function createListing(string memory _title, uint256 _price, string memory _description, string memory _dataHash)
        external
    {
        listingCount++;
        listings[listingCount] = DataListing({
            owner: payable(msg.sender),
            title: _title,
            price: _price,
            description: _description,
            dataHash: _dataHash,
            active: true
        });

        emit ListingCreated(listingCount, msg.sender, _title, _price, _description, _dataHash);
    }

    // Deactivate listing
    function deactivateListing(uint256 _listingId) external {
        require(listings[_listingId].owner == msg.sender, "Not listing owner");

        listings[_listingId].active = false;
        emit ListingDeactivated(_listingId);
    }

    // Purchase data with ETH
    function purchaseData(uint256 _listingId) external payable {
        require(listings[_listingId].active, "Listing is not active");
        require(!purchaseExists[_listingId][msg.sender], "Purchase already exists");

        DataListing storage listing = listings[_listingId];
        require(msg.value == listing.price, "Incorrect ETH amount");

        purchases[_listingId][msg.sender] = Purchase({buyer: msg.sender, amount: msg.value, deliveryConfirmed: false});

        // Update tracking systems
        purchaseExists[_listingId][msg.sender] = true;
        userPurchases[msg.sender].push(_listingId);
        purchaseCounts[_listingId]++;

        emit PurchaseMade(_listingId, msg.sender, msg.value);
    }

    // Confirm delivery and release funds
    function confirmDelivery(uint256 _listingId) external {
        require(purchaseExists[_listingId][msg.sender], "Purchase does not exist");
        Purchase storage purchase = purchases[_listingId][msg.sender];
        require(!purchase.deliveryConfirmed, "Delivery already confirmed");

        purchase.deliveryConfirmed = true;
        listings[_listingId].owner.transfer(purchase.amount);

        emit DeliveryConfirmed(_listingId, msg.sender);
    }

    // Submit review
    function submitReview(uint256 _listingId, uint8 _rating, string memory _comment) external {
        require(purchaseExists[_listingId][msg.sender], "No purchase exists");
        require(purchases[_listingId][msg.sender].deliveryConfirmed, "Delivery not confirmed");
        require(_rating > 0 && _rating <= 5, "Invalid rating");

        reviews[_listingId].push(Review({reviewer: msg.sender, rating: _rating, comment: _comment}));

        emit ReviewSubmitted(_listingId, msg.sender, _rating);
    }

    // View functions
    function getListingDetails(uint256 _listingId)
        external
        view
        returns (
            address owner,
            string memory title,
            uint256 price,
            string memory description,
            string memory dataHash,
            bool active
        )
    {
        DataListing storage listing = listings[_listingId];
        return (listing.owner, listing.title, listing.price, listing.description, listing.dataHash, listing.active);
    }

    function getReviews(uint256 _listingId) external view returns (Review[] memory) {
        return reviews[_listingId];
    }

    function getPurchasedListingIds(address user) external view returns (uint256[] memory) {
        return userPurchases[user];
    }

    function getUserPurchases(address user)
        external
        view
        returns (uint256[] memory listingIds, Purchase[] memory purchaseData, DataListing[] memory listingsData)
    {
        uint256[] memory ids = userPurchases[user];
        uint256 length = ids.length;

        listingIds = new uint256[](length);
        purchaseData = new Purchase[](length);
        listingsData = new DataListing[](length);

        for (uint256 i = 0; i < length; i++) {
            uint256 listingId = ids[i];
            listingIds[i] = listingId;
            purchaseData[i] = purchases[listingId][user];
            listingsData[i] = listings[listingId];
        }
    }

    // Helper function
    function hasPurchased(address user, uint256 listingId) external view returns (bool) {
        return purchaseExists[listingId][user];
    }
}
