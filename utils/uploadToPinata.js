const pinataSDK = require("@pinata/sdk")
const path = require("path")
const fs = require("fs")
require("dotenv").config()

const pinataAPIKey = process.env.PINATA_API_KEY
const pinataAPISecret = process.env.PINATA_API_SECRET

const pinata = pinataSDK(pinataAPIKey, pinataAPISecret)

async function storeImages(imagesFilePath) {
    const fullImagesPath = path.resolve(imagesFilePath)
    const files = fs.readdirSync(fullImagesPath)
    let responses = []
    console.log("------------------------------")
    console.log("Uploading to Pinata IPFS......")
    for (fileIndex in files) {
        const readableStreamForFile = fs.createReadStream(
            `${fullImagesPath}/${files[fileIndex]}`
        )
        try {
            const response = await pinata.pinFileToIPFS(readableStreamForFile) //upload to pinata
            responses.push(response)
        } catch (error) {
            console.log(error)
        }
    }
    // console.log(`Files:${files}`)
    // console.log(`Responses after stringfify: ${JSON.stringify(responses)}`)
    console.log("-----Done uploading to Pinata IPFS-----")
    return { responses, files }
}

async function storeTokenUriMetadata(metadata) {
    try {
        const response = await pinata.pinJSONToIPFS(metadata)
        return response
    } catch (error) {
        console.log(error)
    }
    return null
}

module.exports = { storeImages, storeTokenUriMetadata }
