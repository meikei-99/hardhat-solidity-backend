const { ethers } = require("hardhat")
const fs = require("fs")

const frontEndContractFile =
    "../nextjs-frontend-moralis/constants/networkMapping.json"
const frontEndAbiFileNftMarketplace =
    "../nextjs-frontend-moralis/constants/MarketplaceAbi.json"
const frontEndAbiFileBasicNft =
    "../nextjs-frontend-moralis/constants/BasicNftAbi.json"

module.exports = async () => {
    if (process.env.UPDATE_FRONT_END) {
        console.log("--------------------------------------")
        console.log("Deploying 99-deploy front-end...")
        console.log("Writing address to front end...")
        await updateContractAddress()
        console.log("Writing abi to front end...")
        await updateAbi()
        console.log("Done writing to front end...")
        console.log("--------------------------------------")
    }
}

async function updateAbi() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    fs.writeFileSync(
        frontEndAbiFileNftMarketplace,
        nftMarketplace.interface.format(ethers.utils.FormatTypes.json)
    )
    const basicNft = await ethers.getContract("BasicNft")
    fs.writeFileSync(
        frontEndAbiFileBasicNft,
        basicNft.interface.format(ethers.utils.FormatTypes.json)
    )
}

async function updateContractAddress() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const chainId = network.config.chainId.toString()
    const contractAddress = JSON.parse(
        fs.readFileSync(frontEndContractFile, "utf8")
    )

    if (chainId in contractAddress) {
        if (
            !contractAddress[chainId]["NftMarketplace"].includes(
                nftMarketplace.address
            )
        ) {
            contractAddress[chainId]["NftMarketplace"].push(
                nftMarketplace.address
            )
        }
    } else {
        contractAddress[chainId] = { NftMarketplace: [nftMarketplace.address] }
        // contractAddress[chainId]["NftMarketplace"] = nftMarketplace.address
    }
    fs.writeFileSync(frontEndContractFile, JSON.stringify(contractAddress))
}

module.exports.tags = ["all", "front-end"]
