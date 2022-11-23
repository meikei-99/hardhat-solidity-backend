const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const {
    storeImages,
    storeTokenUriMetadata,
} = require("../utils/uploadToPinata")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const args = []
    let castleTokenURI
    const imagesFilePath = "./images"
    const metadataTemplate = {
        name: "",
        description: "",
        image: "",
        attributes: [{ trait_type: "Magical", value: "100" }],
    }

    if (process.env.UPLOAD_TO_PINATA == "true") {
        castleTokenURI = await handleToken()
    }

    log("----------------------------------")
    log("Deploying 02-Basic Nft...")
    const BasicNft = await deploy("BasicNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    log("Successfully deployed 02-Basic Nft")
    log(`Contract deployed at ${BasicNft.address}`)

    log("----------------------------------")
    log("...Verifying 02-Basic Nft...")
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(BasicNft.address, args)
    }
    log("Done verified!")

    async function handleToken() {
        log("----------------------------------")
        log("Handle Token...")
        castleTokenURI = []

        const { responses: imageUploadResponses, files } = await storeImages(
            imagesFilePath
        )
        log("----------------------------------")
        log("Uploading Metadata...")
        for (imageUploadResponsesIndex in imageUploadResponses) {
            let tokenUriMetadata = { ...metadataTemplate }
            tokenUriMetadata.name = files[imageUploadResponsesIndex].replace(
                "jpg",
                ""
            )
            tokenUriMetadata.description = `${tokenUriMetadata.name} #1`
            tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponsesIndex].IpfsHash}`
            const metadataUploadResponse = await storeTokenUriMetadata(
                tokenUriMetadata
            )
            castleTokenURI.push(metadataUploadResponse.IpfsHash)
        }
        log("Successfully upload metadata...")
        return castleTokenURI
    }
}

module.exports.tags = ["all", "BasicNft"]
