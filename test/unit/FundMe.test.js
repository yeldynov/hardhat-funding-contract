const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", () => {
          let fundMe, deployer, mockV3Aggregator
          const sendValue = ethers.parseEther("1") // 1 ETH
          beforeEach(async () => {
              // const accounts = await ethers.getSigners()
              // deployer = accounts[0]
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", () => {
              it("sets the aggregator addresses correctly", async () => {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.target)
              })
          })

          describe("fund", () => {
              it("Fails if you don't send enough ETH", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
              })

              it("Updates the amount funded data structure", async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })

              it("Adds funder to array of getFunder", async () => {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer)
              })
          })

          describe("withdraw", () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue })
              })

              it("withdraw ETH from a single founder", async () => {
                  // Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      (
                          startingFundMeBalance + startingDeployerBalance
                      ).toString(),
                      (endingDeployerBalance + gasCost).toString()
                  )
              })

              it("Cheaper withdraw ETH from a single founder", async () => {
                  // Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      (
                          startingFundMeBalance + startingDeployerBalance
                      ).toString(),
                      (endingDeployerBalance + gasCost).toString()
                  )
              })

              // it("Allows us to withdraw with multiple getFunder", async () => {
              //     //    Arrange
              //     const accounts = await ethers.getSigners()
              //     for (let i = 1; i < 6; i++) {
              //         const fundMeConnectedContract = await fundMe.connect(
              //             accounts[i]
              //         )
              //         await fundMeConnectedContract.fund({ value: sendValue })
              //     }
              //     const startingFundMeBalance = await ethers.provider.getBalance(
              //         fundMe.target
              //     )
              //     const startingDeployerBalance = await ethers.provider.getBalance(
              //         deployer
              //     )
              //     // Act
              //     const transactionResponse = await fundMe.withdraw()
              //     const transactionReceipt = await transactionResponse.wait(1)
              //     const { gasUsed, gasPrice } = transactionReceipt
              //     const gasCost = gasUsed * gasPrice
              //     // Assert
              //     const endingFundMeBalance = await ethers.provider.getBalance(
              //         fundMe.target
              //     )
              //     const endingDeployerBalance = await ethers.provider.getBalance(
              //         deployer
              //     )
              //     assert.equal(endingFundMeBalance, 0)
              //     assert.equal(
              //         (startingFundMeBalance + startingDeployerBalance).toString(),
              //         (endingDeployerBalance + gasCost).toString()
              //     )
              //     // Make sure the getFunder reset properly
              //     await expect(fundMe.getFunder[0]).to.be.reverted

              //     for (i = 1; i < 6; i++) {
              //         assert.equal(
              //             await fundMe.getAddressToAmountFunded(accounts[i].target),
              //             0
              //         )
              //     }
              // })

              // it("cheaper withdraw testing...", async () => {
              //     //    Arrange
              //     const accounts = await ethers.getSigners()
              //     for (let i = 1; i < 6; i++) {
              //         const fundMeConnectedContract = await fundMe.connect(
              //             accounts[i]
              //         )
              //         await fundMeConnectedContract.fund({ value: sendValue })
              //     }
              //     const startingFundMeBalance = await ethers.provider.getBalance(
              //         fundMe.target
              //     )
              //     const startingDeployerBalance = await ethers.provider.getBalance(
              //         deployer
              //     )
              //     // Act
              //     const transactionResponse = await fundMe.cheaperWithdraw()
              //     const transactionReceipt = await transactionResponse.wait(1)
              //     const { gasUsed, gasPrice } = transactionReceipt
              //     const gasCost = gasUsed * gasPrice
              //     // Assert
              //     const endingFundMeBalance = await ethers.provider.getBalance(
              //         fundMe.target
              //     )
              //     const endingDeployerBalance = await ethers.provider.getBalance(
              //         deployer
              //     )
              //     assert.equal(endingFundMeBalance, 0)
              //     assert.equal(
              //         (startingFundMeBalance + startingDeployerBalance).toString(),
              //         (endingDeployerBalance + gasCost).toString()
              //     )
              //     // Make sure the getFunder reset properly
              //     await expect(fundMe.getFunder[0]).to.be.reverted

              //     for (i = 1; i < 6; i++) {
              //         assert.equal(
              //             await fundMe.getAddressToAmountFunded(accounts[i].target),
              //             0
              //         )
              //     }
              // })

              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const fundMeConnectedContract = await fundMe.connect(
                      accounts[1]
                  )
                  await expect(fundMeConnectedContract.withdraw()).to.be
                      .reverted
              })
          })
      })
