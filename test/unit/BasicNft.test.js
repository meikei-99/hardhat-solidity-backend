const { assert, expect } = require("chai")
const { ethers, deployments, network, getNamedAccounts } = require("hardhat")
const {
    networkConfig,
    developmentChains,
} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("BasicNFT Unit Tests", function () {
          let deployer, BasicNft
          beforeEach(async () => {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["all"])
              const BasicNftContract = await ethers.getContract("BasicNft")
              BasicNft = BasicNftContract.connect(deployer)
          })

          describe("Constructor", () => {
              it("Token ID was initialized correctly", async () => {
                  const tokenCounter = await BasicNft.getTokenCounter()
                  assert(tokenCounter, "0")
              })
          })

          describe("Mint NFT", () => {
              it("Mint the NFT", async () => {
                  await BasicNft.mintNFT()
                  const tokenCounter = await BasicNft.getTokenCounter()
                  assert(tokenCounter, "1")
              })
          })

          describe("Token URI", () => {
              it("Token URI must exist, or else it will revert", async () => {
                  const tokenId = 1
                  await BasicNft.mintNFT()
                  await expect(BasicNft.tokenURI(tokenId)).to.be.revertedWith(
                      "ERC721Metadata: URI query for nonexistent token"
                  )
              })
              it("Return the correct URI", async () => {
                  await BasicNft.mintNFT()
                  const tokenURI = await BasicNft.tokenURI(0)
                  assert.equal(
                      tokenURI,
                      "ipfs://QmQs1RxKwFcfJuACXcobZnqRqZEQt1aKCDSHEzBUUdcDmN"
                  )
              })
          })
      })
