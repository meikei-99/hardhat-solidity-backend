const { ethers, network } = require("hardhat")

async function buyItem() {
    const tokenId = 0
    const accounts = await ethers.getSigners()
    const buyer = accounts[1]
    const nftMarketplaceContract = await ethers.getContract("NftMarketplace")
    const nftMarketplaceBuyer = await nftMarketplaceContract.connect(buyer)
    const basicNft = await ethers.getContract("BasicNft")
    const nftAddress = basicNft.address
    console.log("Buying item...")
    const buyItemTx = await nftMarketplace.buyItem(nftAddress, tokenId,value:{})
    const buyItemResponse = buyItemTx.wait(1)
    console.log(`NFT was bought by ${buyer}!`)
    //move block?? 1:02:30
}

b  uyItem()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
