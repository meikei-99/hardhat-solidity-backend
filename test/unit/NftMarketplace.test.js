const { assert, expect } = require("chai")
const { ethers, deployments, network, getNamedAccounts } = require("hardhat")
const {
    networkConfig,
    developmentChains,
} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("NftMarketplace.sol Unit Test", function () {
          let deployer,
              NftMarketplaceContract,
              BasicNft,
              player,
              NftMarketplaceDeployer,
              NftMarketplacePlayer,
              PRICE
          PRICE = ethers.utils.parseEther("0.1")
          const TOKEN_ID = 0
          beforeEach(async () => {
              //   deployer = (await getNamedAccounts()).deployer
              //   player = (await getNamedAccounts()).player
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              player = accounts[1]
              await deployments.fixture(["all"])
              NftMarketplaceContract = await ethers.getContract(
                  "NftMarketplace"
              )
              NftMarketplaceDeployer = NftMarketplaceContract.connect(deployer)
              NftMarketplacePlayer = NftMarketplaceContract.connect(player)
              BasicNftContract = await ethers.getContract("BasicNft")
              BasicNft = BasicNftContract.connect(deployer)
              await BasicNft.mintNFT() //deployer minting
              await BasicNft.approve(NftMarketplaceContract.address, TOKEN_ID) // approve the deployer of the nft contract to list item bla bla bla
          })

          describe("mint NFT", () => {
              it("Item can be listed and bought", async () => {
                  await NftMarketplaceDeployer.listItem(
                      BasicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  await NftMarketplacePlayer.buyItem(
                      BasicNft.address,
                      TOKEN_ID,
                      { value: PRICE }
                  )
                  const nftOwner = await BasicNft.ownerOf(TOKEN_ID)
                  assert.equal(nftOwner, player.address)
                  const proceed = await NftMarketplaceDeployer.getProceed(
                      deployer.address
                  )
                  assert.equal(proceed.toString(), PRICE)
              })
          })

          describe("listItem", () => {
              it("Only owner can list the item", async () => {
                  await BasicNft.approve(player.address, TOKEN_ID)
                  await expect(
                      NftMarketplacePlayer.listItem(
                          BasicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
                  ).to.be.revertedWithCustomError(
                      NftMarketplaceContract,
                      "NftMarketplace__NotTheOwner"
                  )
              })

              it("NFT was not listed", async () => {
                  const listItem = await NftMarketplaceDeployer.listItem(
                      BasicNft.address,
                      TOKEN_ID,
                      PRICE
                  )

                  await expect(
                      NftMarketplaceDeployer.listItem(
                          BasicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
                  )
                      .to.be.revertedWithCustomError(
                          NftMarketplaceContract,
                          "NftMarketplace__NftAlreadyBeListed"
                      )
                      .withArgs(BasicNft.address, TOKEN_ID)
              })
              it("Listed price must >=0", async () => {
                  PRICE = 0
                  await expect(
                      NftMarketplaceDeployer.listItem(
                          BasicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
                  ).to.be.revertedWithCustomError(
                      NftMarketplaceContract,
                      "NftMarketplace__PriceMustBeAboveZero"
                  )
              })
              it("NFT token was not approved by marketplace", async () => {
                  PRICE = ethers.utils.parseEther("0.1")
                  const BasicNftPlayer = BasicNft.connect(player)
                  await BasicNftPlayer.mintNFT()
                  await expect(
                      NftMarketplacePlayer.listItem(
                          BasicNftPlayer.address,
                          1,
                          PRICE
                      )
                  ).to.be.revertedWithCustomError(
                      NftMarketplaceContract,
                      "NftMarketplace__NotApprovedForMarketPlace"
                  )
              })
              it("Is the NFT in the listing?", async () => {
                  await NftMarketplaceDeployer.listItem(
                      BasicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  const getListingResponse =
                      await NftMarketplaceDeployer.getListing(
                          BasicNft.address,
                          TOKEN_ID
                      )
                  assert.equal(getListingResponse.price.toString(), PRICE)
                  assert.equal(getListingResponse.seller, deployer.address)
              })
              it("Emits an event once NFT was listed", async () => {
                  await expect(
                      NftMarketplaceDeployer.listItem(
                          BasicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
                  )
                      .to.emit(NftMarketplaceContract, "ItemListed")
                      .withArgs(
                          deployer.address,
                          BasicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
              })
          })

          describe("Buy item", async () => {
              it("Revert if the item isn't listed", async () => {
                  await expect(
                      NftMarketplacePlayer.buyItem(BasicNft.address, TOKEN_ID)
                  )
                      .to.be.revertedWithCustomError(
                          NftMarketplaceContract,
                          "NftMarketplace__NftWasNotListed"
                      )
                      .withArgs(BasicNft.address, 0)
              })

              it("Revert if buyer not paying enough ETH", async () => {
                  await NftMarketplaceDeployer.listItem(
                      BasicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  const listing = await NftMarketplaceDeployer.getListing(
                      BasicNft.address,
                      TOKEN_ID
                  )
                  const listedPrice = listing.price.toString()
                  await expect(
                      NftMarketplacePlayer.buyItem(BasicNft.address, TOKEN_ID, {
                          value: ethers.utils.parseEther("0.01"),
                      })
                  )
                      .to.be.revertedWithCustomError(
                          NftMarketplaceContract,
                          "NftMarketplace__NotEnoughPayment"
                      )
                      .withArgs(BasicNft.address, TOKEN_ID, listedPrice)
              })

              it("Check the proceed of the seller", async () => {
                  await NftMarketplaceDeployer.listItem(
                      BasicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  await NftMarketplacePlayer.buyItem(
                      BasicNft.address,
                      TOKEN_ID,
                      { value: PRICE }
                  )
                  const proceed = await NftMarketplaceDeployer.getProceed(
                      deployer.address
                  )
                  assert.equal(proceed.toString(), PRICE)
              })

              it("The bought NFT was delisted", async () => {
                  await NftMarketplaceDeployer.listItem(
                      BasicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  await NftMarketplacePlayer.buyItem(
                      BasicNft.address,
                      TOKEN_ID,
                      { value: PRICE }
                  )
                  await expect(
                      NftMarketplacePlayer.buyItem(BasicNft.address, TOKEN_ID, {
                          value: PRICE,
                      })
                  )
                      .to.be.revertedWithCustomError(
                          NftMarketplaceContract,
                          "NftMarketplace__NftWasNotListed"
                      )
                      .withArgs(BasicNft.address, TOKEN_ID)
              })

              it("The new owner of NFT was updated", async () => {
                  await NftMarketplaceDeployer.listItem(
                      BasicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  await NftMarketplacePlayer.buyItem(
                      BasicNft.address,
                      TOKEN_ID,
                      { value: PRICE }
                  )
                  const newOwner = await BasicNft.ownerOf(TOKEN_ID)
                  assert.equal(newOwner, player.address)
              })

              it("Emits event when the item was bought", async () => {
                  await NftMarketplaceDeployer.listItem(
                      BasicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  await expect(
                      NftMarketplacePlayer.buyItem(BasicNft.address, TOKEN_ID, {
                          value: PRICE,
                      })
                  )
                      .to.emit(NftMarketplaceContract, "SoldItemDelisted")
                      .withArgs(
                          player.address,
                          BasicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
              })
          })

          describe("Cancel item", () => {
              it("Revert if the item isn't listed", async () => {
                  await expect(
                      NftMarketplacePlayer.cancelItem(
                          BasicNft.address,
                          TOKEN_ID
                      )
                  )
                      .to.be.revertedWithCustomError(
                          NftMarketplaceContract,
                          "NftMarketplace__NftWasNotListed"
                      )
                      .withArgs(BasicNft.address, 0)
              })
              it("Revert if you are not the owner", async () => {
                  await NftMarketplaceDeployer.listItem(
                      BasicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  await expect(
                      NftMarketplacePlayer.cancelItem(
                          BasicNft.address,
                          TOKEN_ID
                      )
                  ).to.be.revertedWithCustomError(
                      NftMarketplaceContract,
                      "NftMarketplace__NotTheOwner"
                  )
              })
              it("Item was delisted", async () => {
                  await NftMarketplaceDeployer.listItem(
                      BasicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  await NftMarketplaceDeployer.cancelItem(
                      BasicNft.address,
                      TOKEN_ID
                  )
                  const listing = await NftMarketplaceDeployer.getListing(
                      BasicNft.address,
                      TOKEN_ID
                  )
                  const listedPrice = listing.price.toString()
                  assert(listedPrice, 0)
              })
              it("Emits an event once item was cancelled", async () => {
                  await NftMarketplaceDeployer.listItem(
                      BasicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  await expect(
                      NftMarketplaceDeployer.cancelItem(
                          BasicNft.address,
                          TOKEN_ID
                      )
                  )
                      .to.emit(NftMarketplaceContract, "CancelListing")
                      .withArgs(deployer.address, BasicNft.address, TOKEN_ID)
              })
          })
          describe("Update listing", () => {
              it("Must be owner and listed", async () => {
                  await expect(
                      NftMarketplacePlayer.updateListing(
                          BasicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
                  )
                      .to.be.revertedWithCustomError(
                          NftMarketplaceContract,
                          "NftMarketplace__NftWasNotListed"
                      )
                      .withArgs(BasicNft.address, 0)

                  await NftMarketplaceDeployer.listItem(
                      BasicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  await expect(
                      NftMarketplacePlayer.updateListing(
                          BasicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
                  ).to.be.revertedWithCustomError(
                      NftMarketplaceContract,
                      "NftMarketplace__NotTheOwner"
                  )
              })

              it("Revert if the updated price <=0", async () => {
                  const newPrice = ethers.utils.parseEther("0")
                  await expect(
                      NftMarketplaceDeployer.listItem(
                          BasicNft.address,
                          TOKEN_ID,
                          newPrice
                      )
                  ).to.be.revertedWithCustomError(
                      NftMarketplaceContract,
                      "NftMarketplace__PriceMustBeAboveZero"
                  )
              })

              it("Update the price of the item", async () => {
                  const newPrice = ethers.utils.parseEther("0.02")
                  await NftMarketplaceDeployer.listItem(
                      BasicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  await expect(
                      NftMarketplaceDeployer.updateListing(
                          BasicNft.address,
                          TOKEN_ID,
                          newPrice
                      )
                  )
                      .to.emit(NftMarketplaceContract, "PriceUpdated")
                      .withArgs(
                          deployer.address,
                          BasicNft.address,
                          TOKEN_ID,
                          newPrice
                      )
                  const listing = await NftMarketplaceDeployer.getListing(
                      BasicNft.address,
                      TOKEN_ID
                  )
                  const listedPrice = listing.price.toString()
                  assert.equal(listedPrice, newPrice)
              })
          })
          describe("Withdraw proceed", () => {
              it("Revert if proceed <=0", async () => {
                  await expect(
                      NftMarketplaceDeployer.withdrawProceed()
                  ).to.be.revertedWithCustomError(
                      NftMarketplaceContract,
                      "NftMarketplace__NoProceedToWithdraw"
                  )
              })
              it("Withdraw proceed out", async () => {
                  await NftMarketplaceDeployer.listItem(
                      BasicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  await NftMarketplacePlayer.buyItem(
                      BasicNft.address,
                      TOKEN_ID,
                      { value: PRICE }
                  )
                  const proceed = await NftMarketplaceDeployer.getProceed(
                      deployer.address
                  )
                  assert(proceed.toString(), PRICE)
                  const tx = await NftMarketplaceDeployer.withdrawProceed()
                  assert(proceed.toString(), "0")
              })
          })
      })
