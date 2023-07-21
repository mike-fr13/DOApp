const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers')
const { expect } = require('chai')
const { BigNumber } = require('ethers')
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');
const Constant = require("./lib/Constants.js")
const Fixture = require("./lib/Fixtures.js")
const {getDCAConfigs} = require("../scripts/lib/DOApp_lib.js");



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
          BigNumber.from("1000000000000000000"),
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

      it('Should add a valid segment entry for each segment interval (swap Token A for Token B)', async function () {
        isDebugEnable = false
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

          let i = new BigNumber.from(0)
          for (i = Constant.DCA_CONFIG_1_MIN; i.lt(Constant.DCA_CONFIG_1_MAX) ; i=i.add(Constant.TOKEN_PAIR_SEGMENT_SIZE)) {
            isDebugEnable ? console.log("segment : ", i) : {}
            const [segOwner,amount, dcaConfigHash] = ((await dataStorage.connect(account1)
              .getDCASegmentEntries(
                pairId, 
                BigNumber.from(i),
                Constant.DCA_CONFIG_1_DELAY,
                BigNumber.from(0))
              )[0])
            //console.log(owner, amount, dcaConfigHash)
            expect(segOwner).to.be.equal(account1.address)
            expect(amount).to.be.equal(Constant.DCA_CONFIG_1_AMOUNT)
            
          }
      })

      it('Should add a valid segment entry for each segment interval (swap Token B for Token A)', async function () {
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
            const [segOwner,amount, dcaConfigHash] = (struct[0])

            //console.log(owner, amount, dcaConfigHash)
            expect(segOwner).to.be.equal(account1.address)
            expect(amount).to.be.equal(Constant.DCA_CONFIG_2_AMOUNT)
            
          }
      })

      it('Should add a valid segment entry with scaling factor for each segment interval on success (swap Token A for Token B)', async function () {
        isDebugEnable = false
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
            isDebugEnable ?  console.log("segment : ", i) : {}
            struct = await dataStorage.connect(account1)
            .getDCASegmentEntries(
              pairId, 
              BigNumber.from(i),
              Constant.DCA_CONFIG_1_DELAY,
              BigNumber.from(0)
            )
            isDebugEnable ? console.log("DCA Entries : ", struct) : {}
            const [segOwner,amount, dcaConfigHash] = (struct[0])
                

            rapport = (((Constant.DCA_CONFIG_1_MAX.sub(i)).mul(Constant.MULT_FACTOR))
              .div(Constant.DCA_CONFIG_1_MAX.sub(Constant.DCA_CONFIG_1_MIN)))

            isDebugEnable ? console.log ("rapport : ",rapport ) : {}

            localComputedAmount =  
              (Constant.DCA_CONFIG_1_AMOUNT.mul( 
                Constant.MULT_FACTOR.add(
                  (Constant.DCA_CONFIG_1_SCALING_FACTOR.sub(BigNumber.from(1)))
                    .mul( rapport)
                  )
                )
              ).div(Constant.MULT_FACTOR)
              isDebugEnable ? console.log(segOwner, amount, dcaConfigHash, localComputedAmount) : {}
            expect(segOwner).to.be.equal(account1.address)
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
            const [segOwner,amount, dcaConfigHash] = (struct[0])

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
            expect(segOwner).to.be.equal(account1.address)
            expect(amount).to.be.equal(localComputedAmount)
            
          }
      })

      it('Should add 2 dca config and get segment entries for each segment interval on success (swap Token A for Token B)', async function () {
        const {dataStorage, account1, account2, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
        await dataStorage.connect(account1).addDCAConfig(
          pairId,
          Constant.DCA_CONFIG_1_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
          Constant.DCA_CONFIG_1_MIN,
          Constant.DCA_CONFIG_1_MAX,
          Constant.DCA_CONFIG_1_AMOUNT,
          Constant.DCA_CONFIG_1_SCALING_FACTOR,
          Constant.DCA_CONFIG_1_DELAY
          )

        await dataStorage.connect(account2).addDCAConfig(
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
              Constant.DCA_CONFIG_1_DELAY,
              BigNumber.from(0)
            )
            // console.log("DCA Entries : ", struct);
            const [segOwner,amount, dcaConfigHash] = (struct[0])


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
            expect(segOwner).to.be.equal(account1.address)
            expect(amount).to.be.equal(localComputedAmount)
            
          }

          for (let i = Constant.DCA_CONFIG_3_MIN; i<Constant.DCA_CONFIG_3_MAX ; i = i.add(Constant.TOKEN_PAIR_SEGMENT_SIZE)) {
            //console.log("segment : ", i.toString())
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
            // console.log("DCA Entries : ", struct);
            const [segOwner,amount, dcaConfigHash] = (struct[index])

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
            expect(segOwner).to.be.equal(account2.address)
            expect(amount).to.be.equal(localComputedAmount)
            
          }
      })

      it('Should add 2 dca config and get segment entries for each segment interval on success  (swap Token B for Token A)', async function () {
        const {dataStorage, account1, account2, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
        await dataStorage.connect(account1).addDCAConfig(
          pairId,
          Constant.DCA_CONFIG_2_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
          Constant.DCA_CONFIG_2_MIN,
          Constant.DCA_CONFIG_2_MAX,
          Constant.DCA_CONFIG_2_AMOUNT,
          Constant.DCA_CONFIG_2_SCALING_FACTOR,
          Constant.DCA_CONFIG_2_DELAY
          )

        await dataStorage.connect(account2).addDCAConfig(
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
            const [segOwner,amount, dcaConfigHash] = (struct[index])

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
            expect(segOwner).to.be.equal(account2.address)
            expect(amount).to.be.equal(localComputedAmount)
            
          }
        })
    })

    describe("deleteDCAConfig() tests", function () {

      it('Should Revert when trying to delete a DCA configuration with ana unknow id ', async function () {
        const {dataStorage, account1} 
          = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
        await expect(dataStorage.connect(account1).deleteDCAConfig(Constant.BAD_CONFIG_ID))
          .to.be.revertedWith("No DCA config found with given id")
      })

      it('Should Revert when trying to delete a DCA configuration with someone else thant contract owner or DCA config creator', async function () {
        const {dataStorage, pairId, account1,account2} 
          = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
          
          await dataStorage.connect(account1).addDCAConfig(
            pairId,
            Constant.DCA_CONFIG_1_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
            Constant.DCA_CONFIG_1_MIN,
            Constant.DCA_CONFIG_1_MAX,
            Constant.DCA_CONFIG_1_AMOUNT,
            Constant.DCA_CONFIG_1_SCALING_FACTOR,
            Constant.DCA_CONFIG_1_DELAY
            );

          dcaConfigs = await (getDCAConfigs(dataStorage));
          console.log ("dcaConfigs - ", dcaConfigs);
          dcaconfigId = dcaConfigs[0];

          await expect(dataStorage.connect(account2).deleteDCAConfig(dcaconfigId))
          .to.be.revertedWith("Only contract owner or DCA config creator can delete a DCA configuration")
      })

      it('Should Delete a DCA configuration when called by contract owner', async function () {
        const {dataStorage, pairId, owner, account1,account2} 
          = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
          
          await dataStorage.connect(account1).addDCAConfig(
            pairId,
            Constant.DCA_CONFIG_1_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
            Constant.DCA_CONFIG_1_MIN,
            Constant.DCA_CONFIG_1_MAX,
            Constant.DCA_CONFIG_1_AMOUNT,
            Constant.DCA_CONFIG_1_SCALING_FACTOR,
            Constant.DCA_CONFIG_1_DELAY
            );

            dcaConfigs = await (getDCAConfigs(dataStorage));
            console.log ("dcaConfigs - ", dcaConfigs);
            dcaconfigId = dcaConfigs[0];
  
            console.log ("dcaconfigId - ", dcaconfigId);
            console.log ("pairId - ", pairId);

          await expect(dataStorage.connect(owner).deleteDCAConfig(dcaconfigId))
          .to.emit(dataStorage, 'DCAConfigDeletion').withArgs(owner.address, pairId, dcaconfigId, false);
      })

      it('Should Delete a Buy DCA configuration when called by dca config creator', async function () {
        const {dataStorage, pairId, owner, account1,account2} 
          = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
          
          await dataStorage.connect(account1).addDCAConfig(
            pairId,
            Constant.DCA_CONFIG_1_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
            Constant.DCA_CONFIG_1_MIN,
            Constant.DCA_CONFIG_1_MAX,
            Constant.DCA_CONFIG_1_AMOUNT,
            Constant.DCA_CONFIG_1_SCALING_FACTOR,
            Constant.DCA_CONFIG_1_DELAY
            );

          dcaConfigs = await (getDCAConfigs(dataStorage));
          console.log ("dcaConfigs - ", dcaConfigs);
          dcaconfigId = dcaConfigs[0];

          console.log ("dcaconfigId - ", dcaconfigId);
          console.log ("pairId - ", pairId);
          await expect(dataStorage.connect(account1).deleteDCAConfig(dcaconfigId))
          .to.emit(dataStorage, 'DCAConfigDeletion').withArgs(account1.address, pairId, dcaconfigId, true);
      })

      it('Should Delete a Sell DCA configuration when called by dca config creator', async function () {
        const {dataStorage, pairId, owner, account1,account2} 
          = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
          
          await dataStorage.connect(account1).addDCAConfig(
            pairId,
            Constant.DCA_CONFIG_2_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
            Constant.DCA_CONFIG_2_MIN,
            Constant.DCA_CONFIG_2_MAX,
            Constant.DCA_CONFIG_2_AMOUNT,
            Constant.DCA_CONFIG_2_SCALING_FACTOR,
            Constant.DCA_CONFIG_2_DELAY
            );

          dcaConfigs = await (getDCAConfigs(dataStorage));
          console.log ("dcaConfigs - ", dcaConfigs);
          dcaconfigId = dcaConfigs[0];

          console.log ("dcaconfigId - ", dcaconfigId);
          console.log ("pairId - ", pairId);
          await expect(dataStorage.connect(account1).deleteDCAConfig(dcaconfigId))
          .to.emit(dataStorage, 'DCAConfigDeletion').withArgs(account1.address, pairId, dcaconfigId, true);
      })
      
      

      it('Should remove all segment entries for each segment interval (swap Token A for Token B)', async function () {
        isDebugEnable = false
        const {dataStorage, owner, account1, pairId} = await loadFixture(Fixture.deploy_AddATokenPair_MinToken_Fixture);
        await dataStorage.connect(account1).addDCAConfig(
          pairId,
          Constant.DCA_CONFIG_1_IS_SWAP_TOKEN_A_FOR_TOKEN_B,
          Constant.DCA_CONFIG_1_MIN,
          Constant.DCA_CONFIG_1_MAX,
          Constant.DCA_CONFIG_1_AMOUNT,
          1,
          Constant.DCA_CONFIG_1_DELAY
          )

          let i = new BigNumber.from(0)
          for (i = Constant.DCA_CONFIG_1_MIN; i.lt(Constant.DCA_CONFIG_1_MAX) ; i=i.add(Constant.TOKEN_PAIR_SEGMENT_SIZE)) {
            isDebugEnable ? console.log("segment : ", i) : {}
            const [segOwner,amount, dcaConfigHash] = ((await dataStorage.connect(account1)
              .getDCASegmentEntries(
                pairId, 
                BigNumber.from(i),
                Constant.DCA_CONFIG_1_DELAY,
                BigNumber.from(0))
              )[0])
            console.log("DCA Config creation : ",segOwner, amount, dcaConfigHash)
            expect(segOwner).to.be.equal(account1.address)
            expect(amount).to.be.equal(Constant.DCA_CONFIG_1_AMOUNT)
          }

          //delete config
          dcaConfigs = await (getDCAConfigs(dataStorage));
          console.log ("dcaConfigs - ", dcaConfigs);
          dcaconfigId = dcaConfigs[0];
          dataStorage.connect(owner).deleteDCAConfig(dcaconfigId)


          for (i = Constant.DCA_CONFIG_1_MIN; i.lt(Constant.DCA_CONFIG_1_MAX) ; i=i.add(Constant.TOKEN_PAIR_SEGMENT_SIZE)) {
            isDebugEnable ? console.log("segment : ", i) : {}
            segmentArray = (
              await dataStorage.connect(account1).getDCASegmentEntries(
              pairId, 
              BigNumber.from(i),
              Constant.DCA_CONFIG_1_DELAY,
              BigNumber.from(0))
            )
            console.log ('segmentArray : ',segmentArray);
            expect(segmentArray.length == 0);
          }
      })

      it('Should remove all segment entries fro all DCA config ', async function () {
        isDebugEnable = false
        const {dataStorage, owner, account1, pairId} = await loadFixture(Fixture.deploy_Prepare_Multi_DCA_Config_Fixture);

        segmentArray = (
          await dataStorage.connect(account1).getDCASegmentEntries(
          pairId, 
          Constant.DCA_CONFIG_1_MAX.sub(10),
          Constant.DCA_CONFIG_1_DELAY,
          BigNumber.from(0))
        )
        console.log ('segmentArray : ',segmentArray);
        expect(segmentArray.length == 3);

        segmentArray = (
          await dataStorage.connect(account1).getDCASegmentEntries(
          pairId, 
          Constant.DCA_CONFIG_8_MIN.add(10),
          Constant.DCA_CONFIG_8_DELAY,
          BigNumber.from(0))
        )
        console.log ('segmentArray : ',segmentArray);
        expect(segmentArray.length == 2);

        segmentArray = (
          await dataStorage.connect(account1).getDCASegmentEntries(
          pairId, 
          Constant.DCA_CONFIG_8_MAX.sub(10),
          Constant.DCA_CONFIG_8_DELAY,
          BigNumber.from(0))
        )
        console.log ('segmentArray : ',segmentArray);
        expect(segmentArray.length == 3);



          //delete config
          dcaConfigs = await (getDCAConfigs(dataStorage));
          console.log ("dcaConfigs - ", dcaConfigs);

          for ( i=0; i< dcaConfigs.length; i++) {
            dataStorage.connect(owner).deleteDCAConfig(dcaConfigs[i])
          }

          segmentArray = (
            await dataStorage.connect(account1).getDCASegmentEntries(
            pairId, 
            Constant.DCA_CONFIG_1_MAX.sub(10),
            Constant.DCA_CONFIG_1_DELAY,
            BigNumber.from(0))
          )
          console.log ('segmentArray : ',segmentArray);
          expect(segmentArray.length == 0);

          segmentArray = (
            await dataStorage.connect(account1).getDCASegmentEntries(
            pairId, 
            Constant.DCA_CONFIG_8_MIN.add(10),
            Constant.DCA_CONFIG_8_DELAY,
            BigNumber.from(0))
          )
          console.log ('segmentArray : ',segmentArray);
          expect(segmentArray.length == 0);

          segmentArray = (
            await dataStorage.connect(account1).getDCASegmentEntries(
            pairId, 
            Constant.DCA_CONFIG_8_MAX.sub(10),
            Constant.DCA_CONFIG_8_DELAY,
            BigNumber.from(0))
          )
          console.log ('segmentArray : ',segmentArray);
          expect(segmentArray.length == 0);



      })
 

    })
  })
})
