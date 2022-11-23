const { ethers } = require("hardhat")

async function main() {
    const alchemy = new ethers.providers.JsonRpcProvider(
        process.env.GOERLI_RPC_URL
    )
    const gasPrice = await alchemy.getGasPrice()
    console.log("Gas Price:", ethers.utils.formatEther(gasPrice), "eth")
    const PRICE = ethers.utils.parseEther("0.1")
    const BasicNft = await ethers.getContract("BasicNft") //
    // const BasicNft = BasicNftContract.connect(deployer)
    const NftMarketplace = await ethers.getContract("NftMarketplace") //
    console.log(`basicnft address: ${BasicNft.address}`)
    console.log(`nftmarketplace address: ${NftMarketplace.address}`)
    // const NftMarketplace = NftMarketplaceContract.connect(deployer)
    console.log("Minting Nft...")
    const mintNftTx = await BasicNft.mintNFT() //
    console.log(`mintNftTx:${JSON.stringify(mintNftTx)}`)
    console.log("Minted but getting transaction receipt...")
    const mintNftReceipt = await mintNftTx.wait(1) //
    const tokenId = mintNftReceipt.events[0].args.tokenId.toString()
    console.log(`Nft was minted with tokenId of ${tokenId}`)
    console.log("Approving NftMarketplace to operate the token...")
    const approveTx = await BasicNft.approve(NftMarketplace.address, tokenId)
    await approveTx.wait(1)
    console.log("NftMarketplace was approved!")
    console.log("Listing Nft on the marketplace...")
    const listNftTx = await NftMarketplace.listItem(
        BasicNft.address,
        tokenId,
        PRICE
    )
    await listNftTx.wait(1)
    console.log("Nft was listed!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
