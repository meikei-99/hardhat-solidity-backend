const { ethers } = require("hardhat")

const networkConfig = {
    5: {
        name: "goerli",
        // callbackGasLimit: "500000",
        // interval: "30",
        // mintFee: "10000000000000000000",
        // subcriptionId: "5101",
        // gasLane:
        //     "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        // vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
        // priceFeedAddress: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
    },
    31337: {
        name: "localhost",
        // callbackGasLimit: "500000",
        // interval: "30",
        // mintFee: "10000000000000000000",
        // gasLane:
        //     "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    developmentChains,
    networkConfig,
}
