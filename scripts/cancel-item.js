const { ethers, network } = require("hardhat")

async function cancelItem() {
    const tokenId = 0
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("BasicNft")
    const nftAddress = basicNft.address
    console.log(nftMarketplace.address)
    console.log(basicNft.address)
    console.log("Cancelling item...")
    const cancelItemTx = await nftMarketplace.cancelItem(nftAddress, tokenId)
    const cancelItemResponse = cancelItemTx.wait(1)

    console.log("NFT was cancelled!")
    //move block?? 1:02:30
}

cancelItem()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
