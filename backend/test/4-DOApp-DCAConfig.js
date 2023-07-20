const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers')
const { expect } = require('chai')
const { BigNumber } = require('ethers')
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');
const Constant = require("./lib/Constants.js")
const Fixture = require("./lib/Fixtures.js")


// DOApp contract Tests
describe('DOApp Contract - DCA configuration tests', function () {

  //Token Deposit tests
  describe('Create DCA Configuration ', function () {

    describe ('addDCAConfig() tests', function () {
      it('Should Revert when trying to create a DCA configuration to an unknow token pair (pairId)', async function () {
        const {dataStorage, account1} 
          = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
        await expect(dataStorage.connect(account1).addDCAConfig(
          Constant.BAD_PAIR_ID,
          Constant.DCA_CONFIG_1_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
          Constant.DCA_CONFIG_1_MIN,
          Constant.DCA_CONFIG_1_MAX,
          Constant.DCA_CONFIG_1_AMOUNT,
          Constant.DCA_CONFIG_1_SCALING_FACTOR,
          Constant.DCA_CONFIG_1_DELAY
          ))
          .to.be.revertedWith('Token Pair not Found')
      })

      it('Should Revert when trying to create a DCA configuration with min >= max', async function () {
        const {dataStorage, pairId, account1} 
          = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
        await expect(dataStorage.connect(account1).addDCAConfig(
          pairId,
          Constant.DCA_CONFIG_1_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
          Constant.DCA_CONFIG_1_MIN,
          Constant.DCA_CONFIG_1_MIN,
          Constant.DCA_CONFIG_1_AMOUNT,
          Constant.DCA_CONFIG_1_SCALING_FACTOR,
          Constant.DCA_CONFIG_1_DELAY
          ))
          .to.be.revertedWithCustomError(dataStorage,'DCAConfigError')
      })
      it('Should Revert when trying to create a DCA configuration with amount <=0 ', async function () {
        const {dataStorage,pairId, account1} 
          = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
        await expect(dataStorage.connect(account1).addDCAConfig(
          pairId,
          Constant.DCA_CONFIG_1_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
          Constant.DCA_CONFIG_1_MIN,
          Constant.DCA_CONFIG_1_MAX,
          BigNumber.from(0),
          Constant.DCA_CONFIG_1_SCALING_FACTOR,
          Constant.DCA_CONFIG_1_DELAY
          ))
          .to.be.revertedWithCustomError(dataStorage,'DCAConfigError')
      })
      it('Should Revert when trying to create a DCA configuration with scaling factor <= 0 ', async function () {
        const {dataStorage,pairId, account1} 
          = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
        await expect(dataStorage.connect(account1).addDCAConfig(
          pairId,
          Constant.DCA_CONFIG_1_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
          Constant.DCA_CONFIG_1_MIN,
          Constant.DCA_CONFIG_1_MAX,
          Constant.DCA_CONFIG_1_AMOUNT,
          BigNumber.from(0),
          Constant.DCA_CONFIG_1_DELAY
          ))
          .to.be.revertedWithCustomError(dataStorage,'DCAConfigError')
      })
      it('Should Revert when trying to create a DCA configuration with too many segments', async function () {
        const {dataStorage,pairId, account1} 
          = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
        await expect(dataStorage.connect(account1).addDCAConfig(
          pairId,
          Constant.DCA_CONFIG_1_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
          BigNumber.from(0),
          BigNumber.from(1000000),
          Constant.DCA_CONFIG_1_AMOUNT,
          Constant.DCA_CONFIG_1_SCALING_FACTOR,
          Constant.DCA_CONFIG_1_DELAY
          ))
          .to.be.revertedWithCustomError(dataStorage,'DCAConfigError')
      })
      
      it('Should emit a DCAConfigCreation event on success', async function () {
        const {dataStorage, account1, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
        await expect(dataStorage.connect(account1).addDCAConfig(
          pairId,
          Constant.DCA_CONFIG_1_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
          Constant.DCA_CONFIG_1_MIN,
          Constant.DCA_CONFIG_1_MAX,
          Constant.DCA_CONFIG_1_AMOUNT,
          Constant.DCA_CONFIG_1_SCALING_FACTOR,
          Constant.DCA_CONFIG_1_DELAY
          ))
          .to.emit(dataStorage, 'DCAConfigCreation').withArgs(account1.address, pairId, anyValue);
      })

      it('Should add a valid segment entry for each segment interval on success (swap Token A for Token B)', async function () {
        const {dataStorage, account1, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
        await dataStorage.connect(account1).addDCAConfig(
          pairId,
          Constant.DCA_CONFIG_1_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
          Constant.DCA_CONFIG_1_MIN,
          Constant.DCA_CONFIG_1_MAX,
          Constant.DCA_CONFIG_1_AMOUNT,
          1,
          Constant.DCA_CONFIG_1_DELAY
          )

          for (let i = Constant.DCA_CONFIG_1_MIN; i<Constant.DCA_CONFIG_1_MAX ; i = i.add(Constant.TOKEN_PAIR_SEGMENT_SIZE)) {
            //console.log("segment : ", i)
            const [owner,amount, dcaConfigHash] = ((await dataStorage.connect(account1)
              .getDCASegmentEntries(
                pairId, 
                BigNumber.from(i),
                Constant.DCA_CONFIG_1_DELAY,
                BigNumber.from(0))
              )[0])
            //console.log(owner, amount, dcaConfigHash)
            expect(owner).to.be.equal(account1.address)
            expect(amount).to.be.equal(Constant.DCA_CONFIG_1_AMOUNT)
            
          }
      })

      it('Should add a valid segment entry for each segment interval on success (swap Token B for Token A)', async function () {
        const {dataStorage, account1, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
        await dataStorage.connect(account1).addDCAConfig(
          pairId,
          Constant.DCA_CONFIG_2_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
          Constant.DCA_CONFIG_2_MIN,
          Constant.DCA_CONFIG_2_MAX,
          Constant.DCA_CONFIG_2_AMOUNT,
          1,
          Constant.DCA_CONFIG_2_DELAY
          )

          for (let i = Constant.DCA_CONFIG_2_MIN; i<Constant.DCA_CONFIG_2_MAX ; i = i.add(Constant.TOKEN_PAIR_SEGMENT_SIZE)) {
            //console.log("segment : ", i)
            struct = await dataStorage.connect(account1)
            .getDCASegmentEntries(
              pairId, 
              BigNumber.from(i),
              Constant.DCA_CONFIG_2_DELAY,
              BigNumber.from(1)
            )
            //console.log("DCA Entries : ", struct);
            const [owner,amount, dcaConfigHash] = (struct[0])

            //console.log(owner, amount, dcaConfigHash)
            expect(owner).to.be.equal(account1.address)
            expect(amount).to.be.equal(Constant.DCA_CONFIG_2_AMOUNT)
            
          }
      })

      it('Should add a valid segment entry with scaling factor for each segment interval on success (swap Token A for Token B)', async function () {
        const {dataStorage, account1, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
        await dataStorage.connect(account1).addDCAConfig(
          pairId,
          Constant.DCA_CONFIG_1_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
          Constant.DCA_CONFIG_1_MIN,
          Constant.DCA_CONFIG_1_MAX,
          Constant.DCA_CONFIG_1_AMOUNT,
          Constant.DCA_CONFIG_1_SCALING_FACTOR,
          Constant.DCA_CONFIG_1_DELAY
          )

          for (let i = Constant.DCA_CONFIG_1_MIN; i<Constant.DCA_CONFIG_1_MAX ; i = i.add(Constant.TOKEN_PAIR_SEGMENT_SIZE)) {
            //console.log("segment : ", i);
            struct = await dataStorage.connect(account1)
            .getDCASegmentEntries(
              pairId, 
              BigNumber.from(i),
              Constant.DCA_CONFIG_1_DELAY,
              BigNumber.from(0)
            )
            //console.log("DCA Entries : ", struct);
            const [owner,amount, dcaConfigHash] = (struct[0])
                

            rapport = (((Constant.DCA_CONFIG_1_MAX.sub(i)).mul(Constant.MULT_FACTOR))
              .div(Constant.DCA_CONFIG_1_MAX.sub(Constant.DCA_CONFIG_1_MIN)))

            //console.log ("rapport : ",rapport )

            localComputedAmount =  
              (Constant.DCA_CONFIG_1_AMOUNT.mul( 
                Constant.MULT_FACTOR.add(
                  (Constant.DCA_CONFIG_1_SCALING_FACTOR.sub(BigNumber.from(1)))
                    .mul( rapport)
                  )
                )
              ).div(Constant.MULT_FACTOR)
            //console.log(owner, amount, dcaConfigHash, localComputedAmount)
            expect(owner).to.be.equal(account1.address)
            expect(amount).to.be.equal(localComputedAmount)
            
          }
      })

      it('Should add a valid segment entry with scaling factor for each segment interval on success (swap Token B for Token A)', async function () {
        const {dataStorage, account1, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
        await dataStorage.connect(account1).addDCAConfig(
          pairId,
          Constant.DCA_CONFIG_2_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
          Constant.DCA_CONFIG_2_MIN,
          Constant.DCA_CONFIG_2_MAX,
          Constant.DCA_CONFIG_2_AMOUNT,
          Constant.DCA_CONFIG_2_SCALING_FACTOR,
          Constant.DCA_CONFIG_2_DELAY
          )

          for (let i = Constant.DCA_CONFIG_2_MIN; i<Constant.DCA_CONFIG_2_MAX ; i = i.add(Constant.TOKEN_PAIR_SEGMENT_SIZE)) {
            //console.log("segment : ", i)
            struct = await dataStorage.connect(account1)
            .getDCASegmentEntries(
              pairId, 
              BigNumber.from(i),
              Constant.DCA_CONFIG_2_DELAY,
              BigNumber.from(1)
            )
            //console.log("DCA Entries : ", struct);
            const [owner,amount, dcaConfigHash] = (struct[0])

            rapport = (((i.sub(Constant.DCA_CONFIG_2_MIN)).mul(Constant.MULT_FACTOR))
            .div(Constant.DCA_CONFIG_2_MAX.sub(Constant.DCA_CONFIG_2_MIN)))

            localComputedAmount =  
            (Constant.DCA_CONFIG_2_AMOUNT.mul( 
              Constant.MULT_FACTOR.add(
                (Constant.DCA_CONFIG_2_SCALING_FACTOR.sub(BigNumber.from(1)))
                  .mul(rapport)
                )
              )
            ).div(Constant.MULT_FACTOR)

            //console.log(owner, amount, dcaConfigHash, localComputedAmount)
            expect(owner).to.be.equal(account1.address)
            expect(amount).to.be.equal(localComputedAmount)
            
          }
      })

      it('Should add 2 dca config and get segment entries for each segment interval on success (swap Token A for Token B)', async function () {
        const {dataStorage, account1, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
        await dataStorage.connect(account1).addDCAConfig(
          pairId,
          Constant.DCA_CONFIG_1_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
          Constant.DCA_CONFIG_1_MIN,
          Constant.DCA_CONFIG_1_MAX,
          Constant.DCA_CONFIG_1_AMOUNT,
          Constant.DCA_CONFIG_1_SCALING_FACTOR,
          Constant.DCA_CONFIG_1_DELAY
          )

        await dataStorage.connect(account1).addDCAConfig(
          pairId,
          Constant.DCA_CONFIG_3_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
          Constant.DCA_CONFIG_3_MIN,
          Constant.DCA_CONFIG_3_MAX,
          Constant.DCA_CONFIG_3_AMOUNT,
          Constant.DCA_CONFIG_3_SCALING_FACTOR,
          Constant.DCA_CONFIG_3_DELAY
          )
  

          for (let i = Constant.DCA_CONFIG_1_MIN; i<Constant.DCA_CONFIG_1_MAX ; i = i.add(Constant.TOKEN_PAIR_SEGMENT_SIZE)) {
            //console.log("segment : ", i)
            struct = await dataStorage.connect(account1)
            .getDCASegmentEntries(
              pairId, 
              BigNumber.from(i),
              Constant.DCA_CONFIG_3_DELAY,
              BigNumber.from(0)
            )
            //console.log("DCA Entries : ", struct);
            const [owner,amount, dcaConfigHash] = (struct[0])


            rapport = (((Constant.DCA_CONFIG_1_MAX.sub(i)).mul(Constant.MULT_FACTOR))
              .div(Constant.DCA_CONFIG_1_MAX.sub(Constant.DCA_CONFIG_1_MIN)))

            //console.log ("rapport : ",rapport )

            localComputedAmount =  
              (Constant.DCA_CONFIG_1_AMOUNT.mul( 
                Constant.MULT_FACTOR.add(
                  (Constant.DCA_CONFIG_1_SCALING_FACTOR.sub(BigNumber.from(1)))
                    .mul( rapport)
                  )
                )
              ).div(Constant.MULT_FACTOR)
            //console.log(owner, amount, dcaConfigHash, localComputedAmount)
            expect(owner).to.be.equal(account1.address)
            expect(amount).to.be.equal(localComputedAmount)
            
          }

          for (let i = Constant.DCA_CONFIG_3_MIN; i<Constant.DCA_CONFIG_3_MAX ; i = i.add(Constant.TOKEN_PAIR_SEGMENT_SIZE)) {
            //console.log("segment : ", i)
            if (i < Constant.DCA_CONFIG_1_MAX) {
                // we have 2 segment entries (config 1 and config 3)
                index = 1;
            }
            else {
                // we have only 1 segment entry (config 3)
                index = 0;
            }

            struct = await dataStorage.connect(account1)
            .getDCASegmentEntries(
              pairId, 
              BigNumber.from(i),
              Constant.DCA_CONFIG_3_DELAY,
              BigNumber.from(0)
            )
            //console.log("DCA Entries : ", struct);
            const [owner,amount, dcaConfigHash] = (struct[index])

            rapport = (((Constant.DCA_CONFIG_3_MAX.sub(i)).mul(Constant.MULT_FACTOR))
              .div(Constant.DCA_CONFIG_3_MAX.sub(Constant.DCA_CONFIG_3_MIN)))

            //console.log ("rapport : ",rapport )

            localComputedAmount =  
              (Constant.DCA_CONFIG_3_AMOUNT.mul( 
                Constant.MULT_FACTOR.add(
                  (Constant.DCA_CONFIG_3_SCALING_FACTOR.sub(BigNumber.from(1)))
                    .mul( rapport)
                  )
                )
              ).div(Constant.MULT_FACTOR)
            //console.log(owner, amount, dcaConfigHash, localComputedAmount)
            expect(owner).to.be.equal(account1.address)
            expect(amount).to.be.equal(localComputedAmount)
            
          }
      })

      it('Should add 2 dca config and get segment entries for each segment interval on success  (swap Token B for Token A)', async function () {
        const {dataStorage, account1, pairId} = await loadFixture(Fixture.deploy_Prepare_4_DCA_Config_Fixture);
        await dataStorage.connect(account1).addDCAConfig(
          pairId,
          Constant.DCA_CONFIG_2_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
          Constant.DCA_CONFIG_2_MIN,
          Constant.DCA_CONFIG_2_MAX,
          Constant.DCA_CONFIG_2_AMOUNT,
          Constant.DCA_CONFIG_2_SCALING_FACTOR,
          Constant.DCA_CONFIG_2_DELAY
          )

        await dataStorage.connect(account1).addDCAConfig(
          pairId,
          Constant.DCA_CONFIG_4_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
          Constant.DCA_CONFIG_4_MIN,
          Constant.DCA_CONFIG_4_MAX,
          Constant.DCA_CONFIG_4_AMOUNT,
          Constant.DCA_CONFIG_4_SCALING_FACTOR,
          Constant.DCA_CONFIG_4_DELAY
          )

          for (let i = Constant.DCA_CONFIG_4_MIN; i<Constant.DCA_CONFIG_4_MAX ; i = i.add(Constant.TOKEN_PAIR_SEGMENT_SIZE)) {
            //console.log("segment : ", i)
            if (i < Constant.DCA_CONFIG_2_MIN) {
              // we have 1 segment entries (config 4)
              index = 0;
            }
            else if (i<Constant.DCA_CONFIG_2_MAX) {
              // we have 2 segment entries (config 2 and config 4)
              index = 1;
            }
            else  {
                // we have only 1 segment entry (config 4)
                index = 0;
            }
            struct = await dataStorage.connect(account1)
            .getDCASegmentEntries(
              pairId, 
              BigNumber.from(i),
              Constant.DCA_CONFIG_4_DELAY,
              BigNumber.from(1)
            )
            //console.log("DCA Entries : ", struct);
            const [owner,amount, dcaConfigHash] = (struct[index])

            rapport = (((i.sub(Constant.DCA_CONFIG_4_MIN)).mul(Constant.MULT_FACTOR))
            .div(Constant.DCA_CONFIG_4_MAX.sub(Constant.DCA_CONFIG_4_MIN)))

            localComputedAmount =  
            (Constant.DCA_CONFIG_4_AMOUNT.mul( 
              Constant.MULT_FACTOR.add(
                (Constant.DCA_CONFIG_4_SCALING_FACTOR.sub(BigNumber.from(1)))
                  .mul(rapport)
                )
              )
            ).div(Constant.MULT_FACTOR)

            //console.log(owner, amount, dcaConfigHash, localComputedAmount)
            //console.log(i, amount, localComputedAmount)
            expect(owner).to.be.equal(account1.address)
            expect(amount).to.be.equal(localComputedAmount)
            
          }
        })
    })
  })
})
