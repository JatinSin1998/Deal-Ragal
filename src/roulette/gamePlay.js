const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;
const _ = require("underscore")
const GameUser = mongoose.model("users");

const CONST = require("../../constant");
const logger = require("../../logger");
const commandAcions = require("../helper/socketFunctions");
const RouletteTables = mongoose.model('RouletteTables');

const walletActions = require("./updateWallet");
const RouletteUserHistory = mongoose.model('RouletteUserHistory');
const adminwinloss = mongoose.model('adminwinloss');


/*
    bet : 10,
    object:{
        bet:10,
         betaction : 
            {
                "number" : [ 1 ],
                "type":"number",
                "bet":0,
                coin:[10]

            }

    }
   
   
   {
    "eventName":"ACTIONROULETTE",
    "data":{
        "tableId":"665ec3ccf5b4113810f5cdb2",
        "playerId":"663ca51fe1b43a5bd45c7b89",
        "betData":"[{"number":"[21]","type":"number","bet":5,"betIndex":21,"coin":"[5]"},{"number":"[20]","type":"number","bet":5,"betIndex":20,"coin":"[5]"},{"number":"[24]","type":"number","bet":5,"betIndex":24,"coin":"[5]"},{"number":"[13,14,15,16,17,18,19,20,21,22,23,24]","type":"2nd12","bet":10,"betIndex":41,"coin":"[10]"},{"number":"[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]","type":"red","bet":10,"betIndex":47,"coin":"[10]"},{"number":"[6]","type":"number","bet":50,"betIndex":6,"coin":"[50]"},{"number":"[1,2,3,4,5,6,7,8,9,10,11,12]","type":"1st12","bet":50,"betIndex":40,"coin":"[50]"}]""
    }
}
    

*/
module.exports.actionSpin = async (requestData, client, callback) => {
    try {
        logger.info("action requestData : ", requestData);
        if (typeof client.tbid == "undefined"
            || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined"
            || typeof requestData.tableId == "undefined"
            || typeof requestData.playerId == "undefined"
            || typeof requestData.betData == "undefined"
        ) {
            commandAcions.sendDirectEvent(client.sck, CONST.ACTIONROULETTE, requestData, false, "User session not set, please restart game!");

            if (typeof callback == "function") {
                return callback("error")
            }

            return false;
        }

        if (typeof requestData.betData != "undefined" && requestData.betData.length == 0) {
            
            return false
        }

        if (typeof client.action != "undefined" && client.action) {
            if (typeof callback == "function") {
                return callback("error")
            }
            return false
        }

        console.log("typeof requestData.betData.betData ", requestData.betData)
        //requestData.betData = (typeof requestData.betData == "string") ? JSON.parse(requestData.betData) : requestData.betData

        console.log("requestData.betData. ", requestData.betData)

        client.action = true;

        const wh = {
            _id: MongoID(client.tbid.toString()),
            //status:"RouletteGameStartTimer"
        }
        const project = {

        }
        const tabInfo = await RouletteTables.findOne(wh, project).lean();
        logger.info("action tabInfo : ", tabInfo);

        if (tabInfo == null) {
            logger.info("action user not turn ::", tabInfo);
            delete client.action;
            if (typeof callback == "function") {
                return callback("error")
            }
            return false
        }

        let currentBet = requestData.betData.reduce((accumulator, currentValue) => {
            return accumulator + currentValue.bet
        }, 0);

        logger.info("action currentBet ::", currentBet);

        let gwh = {
            _id: MongoID(client.uid)
        }
        let UserInfo = await GameUser.findOne(gwh, {}).lean();
        logger.info("action UserInfo : ", gwh, JSON.stringify(UserInfo));

        let updateData = {
            $set: {

            },
            $inc: {

            }
        }
        let chalvalue = currentBet;
        updateData.$set["playerInfo.$.playStatus"] = "action"

        let totalWallet = Number(UserInfo.chips)//+ Number(UserInfo.winningChips)
        logger.info("totalWallet", totalWallet);

        if (Number(chalvalue) > Number(totalWallet)) {
            logger.info("action client.su ::", client.seatIndex);
            delete client.action;

            if (typeof callback == "function") {
                return callback("error")
            }
            commandAcions.sendDirectEvent(client.sck, CONST.ACTIONROULETTE, requestData, false, "Please add wallet!!");
            return false;
        }
        chalvalue = Number(Number(chalvalue).toFixed(2))

        let totalRemaningAmount = await walletActions.deductWallet(client.uid, -chalvalue, 2, "roulette Bet", "roulette");

        // //updateData.$inc["playerInfo.$.selectObj." + requestData.item] = chalvalue;
        // let indextoinc = -1
        // for (let i = 0; i < betObjectData.length; i++) {
        //     if (parseInt(betObjectData[i].betIndex) === parseInt(requestData.betaction.betIndex)) {
        //         indextoinc = i;
        //         break;
        //     }
        // }

        // updateData.$inc["playerInfo.$.totalbet"] = chalvalue;
        // if (indextoinc != -1) {
        //     updateData.$inc["playerInfo.$.betObject." + indextoinc + ".bet"] = chalvalue;
        //     updateData.$set["playerInfo.$.betObject." + indextoinc + ".coin"] = betObjectData[indextoinc].coin.concat(requestData.betaction.coin);

        // } else {

        updateData["$set"]["playerInfo.$.betObject"] = requestData.betData
        //}
        updateData.$inc["playerInfo.$.totalbet"] = chalvalue;
        updateData.$inc["totalbet"] = chalvalue;
        updateData.$inc["playerInfo.$.coins"] = -chalvalue;
        updateData.$set["turnDone"] = true;

        commandAcions.clearJob(tabInfo.job_id);

        const upWh = {
            _id: MongoID(client.tbid.toString()),
            "playerInfo.seatIndex": Number(client.seatIndex)
        }
        logger.info("action upWh updateData :: ", upWh, updateData);

        const tb = await RouletteTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("action tb : ", tb);

        this.AdminWinLossData(chalvalue, "win")


        let insertobj = {
            userId: tb.playerInfo[Number(client.seatIndex)]._id.toString(),
            username: tb.playerInfo[Number(client.seatIndex)].name,
            ballposition: -1,
            beforeplaypoint: totalWallet,//tb.playerInfo[Number(client.seatIndex)].coins + chalvalue,
            play: tb.playerInfo[Number(client.seatIndex)].totalbet,
            won: 0,
            afterplaypoint: totalRemaningAmount,//tb.playerInfo[Number(client.seatIndex)].coins,
            uuid: tb.playerInfo[Number(client.seatIndex)].uuid,
            betObjectData: requestData.betData,
            createdAt:new Date()
        };
        console.log("RouletteUserHistory ", insertobj)
        await RouletteUserHistory.create(insertobj);


        let response = {
            bet: chalvalue,
            betaction: requestData.betData,
            isOutSideBet: requestData.isOutSideBet
        }

        commandAcions.sendEvent(client, CONST.ACTIONROULETTE, response, false, "");


        delete client.action;

        // let activePlayerInRound = await roundStartActions.getPlayingUserInRound(tb.playerInfo);
        // logger.info("action activePlayerInRound :", activePlayerInRound, activePlayerInRound.length);
        // if (activePlayerInRound.length == 1) {
        //     await gameFinishActions.lastUserWinnerDeclareCall(tb);
        // } else {
        //     await roundStartActions.nextUserTurnstart(tb);
        // }
        if (typeof callback == "function") {
            return callback("error")
        }
        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}


// /*
//     bet : 10,
//     object:{
//         bet:10,
//          betaction : 
//             {
//                 "number" : [ 1 ],
//                 "type":"number",
//                 "bet":0,
//                 coin:[10]

//             }

//     }



// */
// module.exports.actionSpin = async (requestData, client, callback) => {
//     try {
//         logger.info("action requestData : ", requestData);
//         if (typeof client.tbid == "undefined"
//             || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined"
//             || typeof requestData.bet == "undefined"
//             || typeof requestData.betaction == "undefined"
//             || typeof requestData.betaction.number == "undefined"
//         ) {
//             commandAcions.sendDirectEvent(client.sck, CONST.ACTIONROULETTE, requestData, false, "User session not set, please restart game!");

//             if (typeof callback == "function") {
//                 return callback("error")
//             }

//             return false;
//         }
//         if (typeof client.action != "undefined" && client.action) {
//             if (typeof callback == "function") {
//                 return callback("error")
//             }
//             return false
//         }

//         console.log("typeof requestData.betaction.number ", typeof requestData.betaction.number)
//         requestData.betaction.number = (typeof requestData.betaction.number == "string") ? JSON.parse(requestData.betaction.number) : requestData.betaction.number
//         requestData.betaction.coin = (typeof requestData.betaction.coin == "string") ? JSON.parse(requestData.betaction.coin) : requestData.betaction.coin



//         console.log("requestData.betaction. ", requestData.betaction)

//         client.action = true;

//         const wh = {
//             _id: MongoID(client.tbid.toString()),
//             //status:"RouletteGameStartTimer"
//         }
//         const project = {

//         }
//         const tabInfo = await RouletteTables.findOne(wh, project).lean();
//         logger.info("action tabInfo : ", tabInfo);

//         if (tabInfo == null) {
//             logger.info("action user not turn ::", tabInfo);
//             delete client.action;
//             if (typeof callback == "function") {
//                 return callback("error")
//             }
//             return false
//         }


//         let betObjectData = tabInfo.playerInfo[client.seatIndex].betObject;
//         let currentBet = Number(requestData.betaction.bet);

//         logger.info("action currentBet ::", currentBet);

//         let gwh = {
//             _id: MongoID(client.uid)
//         }
//         let UserInfo = await GameUser.findOne(gwh, {}).lean();
//         logger.info("action UserInfo : ", gwh, JSON.stringify(UserInfo));

//         let updateData = {
//             $set: {

//             },
//             $inc: {

//             }
//         }
//         let chalvalue = currentBet;
//         updateData.$set["playerInfo.$.playStatus"] = "action"

//         let totalWallet = Number(UserInfo.chips)//+ Number(UserInfo.winningChips)
//         logger.info("totalWallet", totalWallet);

//         if (Number(chalvalue) > Number(totalWallet)) {
//             logger.info("action client.su ::", client.seatIndex);
//             delete client.action;

//             if (typeof callback == "function") {
//                 return callback("error")
//             }
//             commandAcions.sendDirectEvent(client.sck, CONST.ACTIONROULETTE, requestData, false, "Please add wallet!!");
//             return false;
//         }
//         chalvalue = Number(Number(chalvalue).toFixed(2))

//         await walletActions.deductWallet(client.uid, -chalvalue, 2, "roulette Bet", "roulette");

//         //updateData.$inc["playerInfo.$.selectObj." + requestData.item] = chalvalue;
//         let indextoinc = -1
//         for (let i = 0; i < betObjectData.length; i++) {
//             if (parseInt(betObjectData[i].betIndex) === parseInt(requestData.betaction.betIndex)) {
//                 indextoinc = i;
//                 break;
//             }
//         }

//         updateData.$inc["playerInfo.$.totalbet"] = chalvalue;
//         if (indextoinc != -1) {
//             updateData.$inc["playerInfo.$.betObject." + indextoinc + ".bet"] = chalvalue;
//             updateData.$set["playerInfo.$.betObject." + indextoinc + ".coin"] = betObjectData[indextoinc].coin.concat(requestData.betaction.coin);

//         } else {
//             updateData["$push"] = {}
//             updateData["$push"]["playerInfo.$.betObject"] = requestData.betaction
//         }

//         updateData.$inc["totalbet"] = chalvalue;
//         updateData.$inc["playerInfo.$.coins"] = -chalvalue;
//         updateData.$set["turnDone"] = true;

//         commandAcions.clearJob(tabInfo.job_id);

//         const upWh = {
//             _id: MongoID(client.tbid.toString()),
//             "playerInfo.seatIndex": Number(client.seatIndex)
//         }
//         logger.info("action upWh updateData :: ", upWh, updateData);

//         const tb = await RouletteTables.findOneAndUpdate(upWh, updateData, { new: true });
//         logger.info("action tb : ", tb);

//         this.AdminWinLossData(chalvalue, "win")


//         let response = {
//             bet: chalvalue,
//             betaction: requestData.betaction,
//             isOutSideBet: requestData.isOutSideBet
//         }

//         commandAcions.sendEvent(client, CONST.ACTIONROULETTE, response, false, "");


//         delete client.action;

//         // let activePlayerInRound = await roundStartActions.getPlayingUserInRound(tb.playerInfo);
//         // logger.info("action activePlayerInRound :", activePlayerInRound, activePlayerInRound.length);
//         // if (activePlayerInRound.length == 1) {
//         //     await gameFinishActions.lastUserWinnerDeclareCall(tb);
//         // } else {
//         //     await roundStartActions.nextUserTurnstart(tb);
//         // }
//         if (typeof callback == "function") {
//             return callback("error")
//         }
//         return true;
//     } catch (e) {
//         logger.info("Exception action : ", e);
//     }
// }


/*
    bet : 10,
    object:{
        bet:10,
         betaction : 
            {
                "number" : [ 1 ],
                "type":"number",
                "bet":0,

            }

    }
[2024-05-21T12:44:02.846] [INFO] development - REMOVEBETROULETTE requestData :  {
  tableId: '664c4945b8df2259782d164c',
  playerId: '663ca51fe1b43a5bd45c7b89',
  bet: 2,
  betaction: { number: '[16]', type: 'number', bet: 2, betIndex: '16' }
}
*/
module.exports.REMOVEBETROULETTE = async (requestData, client) => {
    try {
        logger.info("REMOVEBETROULETTE requestData : ", requestData);
        if (typeof client.tbid == "undefined"
            || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined"
            || typeof requestData.bet == "undefined"
            || typeof requestData.betaction == "undefined"
            || typeof requestData.betaction.number == "undefined"
        ) {
            commandAcions.sendDirectEvent(client.sck, CONST.REMOVEBETROULETTE, requestData, false, "User session not set, please restart game!");
            return false;
        }
        if (typeof client.REMOVEBETROULETTE != "undefined" && client.REMOVEBETROULETTE) return false;


        requestData.betaction.number = JSON.parse(requestData.betaction.number)

        console.log("requestData.betaction. ", requestData.betaction)

        client.REMOVEBETROULETTE = true;

        const wh = {
            _id: MongoID(client.tbid.toString()),
            //status:"RouletteGameStartTimer"
        }
        const project = {

        }
        const tabInfo = await RouletteTables.findOne(wh, project).lean();
        logger.info("action tabInfo : ", tabInfo);

        if (tabInfo == null) {
            logger.info("action user not turn ::", tabInfo);
            delete client.REMOVEBETROULETTE;
            return false
        }


        let betObjectData = tabInfo.playerInfo[client.seatIndex].betObject;
        let currentBet = Number(requestData.betaction.bet);

        logger.info("action currentBet ::", currentBet);

        let gwh = {
            _id: MongoID(client.uid)
        }
        let UserInfo = await GameUser.findOne(gwh, {}).lean();
        logger.info("action UserInfo : ", gwh, JSON.stringify(UserInfo));

        let updateData = {
            $set: {

            },
            $inc: {

            }
        }


        //updateData.$inc["playerInfo.$.selectObj." + requestData.item] = chalvalue;
        let indextoinc = -1
        let leftBetObject = []
        let userbet = []
        for (let i = 0; i < betObjectData.length; i++) {
            if (parseInt(betObjectData[i].betIndex) === parseInt(requestData.betaction.betIndex)) {
                indextoinc = i;
                userbet = betObjectData[i]
            } else {
                leftBetObject.push(betObjectData[i])
            }
        }

        let chalvalue = userbet.bet;
        updateData.$set["playerInfo.$.playStatus"] = "action"

        chalvalue = Number(Number(chalvalue).toFixed(2))

        logger.info("action  : userbet ", userbet);


        if (indextoinc == -1) {
            logger.info("action remove bet UserInfo : ", indextoinc);
            delete client.REMOVEBETROULETTE;
            commandAcions.sendDirectEvent(client.sck, CONST.REMOVEBETROULETTE, requestData, false, "User session not set, please restart game!");
            return false
        }

        await walletActions.addWalletAdmin(client.uid, Number(chalvalue), 4, "roulette Clear Bet", "roulette");


        updateData.$inc["playerInfo.$.totalbet"] = -chalvalue;
        if (indextoinc != -1) {
            //updateData.$inc["playerInfo.$.betObject." + indextoinc + ".bet"] = chalvalue;
            //betObjectData = betObjectData.slice()

            updateData.$set["playerInfo.$.betObject"] = leftBetObject
        }

        updateData.$inc["totalbet"] = -chalvalue;
        updateData.$inc["playerInfo.$.coins"] = chalvalue;
        commandAcions.clearJob(tabInfo.job_id);

        const upWh = {
            _id: MongoID(client.tbid.toString()),
            "playerInfo.seatIndex": Number(client.seatIndex)
        }
        logger.info("action upWh updateData :: ", upWh, updateData);

        const tb = await RouletteTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("action tb : ", tb);

        this.AdminWinLossData(chalvalue, "loss")

        let response = {
            betObjectData: tb.playerInfo[client.seatIndex].betObject,
            requestData: requestData
        }

        commandAcions.sendEvent(client, CONST.REMOVEBETROULETTE, response, false, "");


        delete client.REMOVEBETROULETTE;

        // let activePlayerInRound = await roundStartActions.getPlayingUserInRound(tb.playerInfo);
        // logger.info("action activePlayerInRound :", activePlayerInRound, activePlayerInRound.length);
        // if (activePlayerInRound.length == 1) {
        //     await gameFinishActions.lastUserWinnerDeclareCall(tb);
        // } else {
        //     await roundStartActions.nextUserTurnstart(tb);
        // }

        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}


/*
    bet : 10,
    object:{
        item:0, 
        bet:10,
    }

*/
module.exports.ClearBet = async (requestData, client) => {
    try {
        logger.info("action requestData : ", requestData);
        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.ClearBet, requestData, false, "User session not set, please restart game!");
            return false;
        }

        const wh = {
            _id: MongoID(client.tbid.toString())
        }
        const project = {

        }
        const tabInfo = await RouletteTables.findOne(wh, project).lean();
        logger.info("ClearBet tabInfo : ", tabInfo);

        if (tabInfo == null) {
            logger.info("ClearBet user not turn ::", tabInfo);

            return false
        }


        let playerInfo = tabInfo.playerInfo[client.seatIndex];

        let gwh = {
            _id: MongoID(client.uid)
        }
        let UserInfo = await GameUser.findOne(gwh, {}).lean();
        logger.info("ClearBet UserInfo : ", gwh, JSON.stringify(UserInfo));

        let updateData = {
            $set: {
                "playerInfo.$.selectObj": [
                    0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0,
                    0, 0,
                    0, 0, 0,
                    0, 0, 0, 0,
                    0, 0
                ],
                "playerInfo.$.betObject": [],
                "playerInfo.$.totalbet": 0,

            },
            $inc: {
                "totalbet": -Number(playerInfo.totalbet),
                "playerInfo.$.coins": Number(playerInfo.totalbet)
            }
        }


        await walletActions.addWalletAdmin(client.uid, Number(playerInfo.totalbet), 4, "roulette Clear Bet", "roulette");


        const upWh = {
            _id: MongoID(client.tbid.toString()),
            "playerInfo.seatIndex": Number(client.seatIndex)
        }
        logger.info("action upWh updateData :: ", upWh, updateData);

        const tb = await RouletteTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("action tb : ", tb);

        this.AdminWinLossData(playerInfo.totalbet, "loss")

        let response = {
            flags: true
        }

        commandAcions.sendEvent(client, CONST.ClearBet, response, false, "");

        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}

/*
    bet : 10,
    object:{
        item:0, 
        bet:10,
    }

*/
module.exports.DoubleBet = async (requestData, client) => {
    try {
        logger.info("action requestData : ", requestData);
        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.DoubleBet, requestData, false, "User session not set, please restart game!");
            return false;
        }

        const wh = {
            _id: MongoID(client.tbid.toString())
        }
        const project = {

        }
        const tabInfo = await RouletteTables.findOne(wh, project).lean();
        logger.info("DoubleBet tabInfo : ", tabInfo);

        if (tabInfo == null) {
            logger.info("DoubleBet user not turn ::", tabInfo);

            return false
        }


        let playerInfo = tabInfo.playerInfo[client.seatIndex];

        let gwh = {
            _id: MongoID(client.uid)
        }
        let UserInfo = await GameUser.findOne(gwh, {}).lean();
        logger.info("DoubleBet UserInfo : ", gwh, JSON.stringify(UserInfo));

        var chalvalue = playerInfo.betObject.reduce((accumulator, currentValue) => {
            return accumulator.bet + currentValue.bet
        }, 0);

        console.log("chalvalue ", chalvalue)

        let totalWallet = Number(UserInfo.chips) //+ Number(UserInfo.winningChips)

        if (Number(chalvalue) > Number(totalWallet)) {
            logger.info("DoubleBet client.su ::", client.seatIndex);
            commandAcions.sendDirectEvent(client.sck, CONST.DoubleBet, requestData, false, "Please add wallet!!");
            return false;
        }


        chalvalue = Number(Number(chalvalue).toFixed(2))

        await walletActions.deductWallet(client.uid, -chalvalue, 2, "roulette Bet", "roulette");

        let updateData = {
            $set: {

            },
            $inc: {

            }
        }

        // for (let i = 0; i < playerInfo.selectObj.length; i++) {
        //     if (playerInfo.selectObj[i] != 0) {
        //         updateData.$inc["playerInfo.$.selectObj." + i] = playerInfo.selectObj[i];
        //     }
        // }

        for (let i = 0; i < playerInfo.betObject.length; i++) {
            if (playerInfo.betObject[i].bet != undefined) {
                updateData.$inc["playerInfo.$.betObject." + i + ".bet"] = playerInfo.betObject[i].bet;
            }
        }




        updateData.$inc["playerInfo.$.totalbet"] = chalvalue;


        updateData.$inc["totalbet"] = chalvalue;
        updateData.$inc["playerInfo.$.coins"] = -chalvalue;
        updateData.$set["turnDone"] = true;
        commandAcions.clearJob(tabInfo.job_id);

        const upWh = {
            _id: MongoID(client.tbid.toString()),
            "playerInfo.seatIndex": Number(client.seatIndex)
        }
        logger.info("action upWh updateData :: ", upWh, updateData);

        const tb = await RouletteTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("action tb : ", tb);

        this.AdminWinLossData(chalvalue, "loss")

        let response = {
            selectObj: tb.playerInfo[client.seatIndex].selectObj,
            totalbet: tb.playerInfo[client.seatIndex].totalbet,
            betObject: tb.playerInfo[client.seatIndex].betObject

        }

        commandAcions.sendEvent(client, CONST.DoubleBet, response, false, "");

        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}

// Generate a random whole number between a specified range (min and max)
module.exports.getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/*
    bet : 10,
    object:{
        item:0, 
        bet:10,
    }

    neighbor  BET 

*/
module.exports.NEIGHBORBET = async (requestData, client) => {
    try {
        logger.info("action requestData : ", requestData);
        if (typeof client.tbid == "undefined"
            || typeof client.uid == "undefined"
            || typeof client.seatIndex == "undefined"
        ) {
            commandAcions.sendDirectEvent(client.sck, CONST.NEIGHBORBET, requestData, false, "User session not set, please restart game!");
            return false;
        }


        const tabInfo = await RouletteTables.findOne({}, {}).lean();
        logger.info("NEIGHBORBET tabInfo : ", tabInfo);

        if (tabInfo == null) {
            logger.info("NEIGHBORBET user not turn ::", tabInfo);
            return false
        }
        let neighborBet = []
        logger.info("Neighbout Bet Info : ", tabInfo.playerInfo);
        // for (let i = 0; i < tabInfo.playerInfo - 1; i++) {

        //     if (tabInfo.playerInfo[i].si != undefined && parseInt(tabInfo.playerInfo[i].si) != parseInt(client.seatIndex) &&
        //         tabInfo.playerInfo[i].betObject.length > 0) {
        //         neighborBet.push(tabInfo.playerInfo[i].betObject)
        //     }
        // }

        if (parseInt(client.seatIndex) == 0) {
            if (tabInfo.activePlayer > 1) {
                neighborBet = tabInfo.playerInfo[1].betObject
            }
        }
        else if (parseInt(client.seatIndex) == tabInfo.activePlayer - 1) {
            if (tabInfo.activePlayer > 1) {
                neighborBet = tabInfo.playerInfo[0].betObject
            }
        }
        else {
            neighborBet = tabInfo.playerInfo[parseInt(client.seatIndex) - 1].betObject
        }

        logger.info("Neighbout Bet Info : neighborBet ", neighborBet);



        let response = {
            //neighborBet: neighborBet.length > 0 ? neighborBet[this.getRandomInt(0,getRandomInt,length-1)] : []
            neighborBet: neighborBet
        }

        neighborBet = tabInfo.playerInfo[this.getRandomInt(0, tabInfo.activePlayer)].betObject

        commandAcions.sendEvent(client, CONST.NEIGHBORBET, response, false, "");

        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}


/*
module.exports.PASTBET = async (requestData, client) => {
  Past Bet 

*/
module.exports.PASTBET = async (requestData, client) => {
    try {
        logger.info("action requestData : ", requestData);
        if (typeof requestData.playerId == "undefined"
        ) {
            commandAcions.sendDirectEvent(client.sck, CONST.PASTBET, requestData, false, "User session not set, please restart game!");
            return false;
        }


        const userInfo = await GameUser.findOne({_id:MongoID(requestData.playerId)}, {}).lean();
        logger.info("PASTBET userInfo : ", userInfo);

        if (userInfo == null) {
            logger.info("PASTBET user not turn ::", userInfo);
            return false
        }

        // this.BETACTIONCALL(userInfo.playerInfo[client.seatIndex].pastbetObject, client)

        let response = {
            greentablebet: userInfo.greentablebet,
            bluetablebet: userInfo.bluetablebet,
        }

        commandAcions.sendEvent(client, CONST.PASTBET, response, false, "");

        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}


/*
  Past Bet SAVE
    betObjectData 
    type : "blueTable" || "greenTable"
*/
module.exports.PASTBETSAVE = async (requestData, client) => {
    try {
        logger.info("PASTBETSAVE requestData : ", requestData);
        if (typeof client.tbid == "undefined"
            || typeof client.uid == "undefined"
            || typeof client.seatIndex == "undefined"
            || typeof requestData.betObjectData == "undefined"
            || typeof requestData.type == "undefined"

        ) {
            commandAcions.sendDirectEvent(client.sck, CONST.PASTBETSAVE, requestData, false, "User session not set, please restart game!");
            return false;
        }


        const upWh = {
            _id: MongoID(client.uid)
        }
        let updateData = {}

        if (requestData.type == "greenTable") {
            updateData = {
                $set: {
                    "greentablebet": requestData.betObjectData
                }
            };
        } else {
            updateData = {
                $set: {
                    "bluetablebet": requestData.betObjectData
                }
            };
        }
        logger.info("PASTBETSAVE upWh updateData :: ", upWh, updateData);

        let userInfo = await GameUser.findOneAndUpdate(upWh, updateData, { new: true });

        if (userInfo == null) {
            logger.info("PASTBETSAVE user not turn ::", userInfo);
            return false
        }


        let response = {
            greentablebet: userInfo.greentablebet,
            bluetablebet: userInfo.bluetablebet,
        }

        commandAcions.sendEvent(client, CONST.PASTBETSAVE, response, false, "");

        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}

// payload :::::::::::::::: {
//     eventName: 'ACTIONROULETTE',
//     data: {
//       tableId: '66507cc8d77e055964e42305',
//       playerId: '664c7085201e9907f3d31a8b',
//       bet: 1000,
//       betaction: {
//         number: '[1,2,3,4,5,6]',
//         type: '6_number',
//         bet: 1000,
//         betIndex: '145'
//       }
//     }
//   }

module.exports.BETACTIONCALL = async (pastbetObject, client) => {

    try {

        if (pastbetObject.length == 0)
            return false;

        let userBet = pastbetObject.splice(0, 1)
        console.log("userBet ", userBet)
        console.log("pastbetObject ", pastbetObject)

        this.actionSpin({
            tableId: client.tbid,
            playerId: client.uid,
            bet: userBet[0].bet,
            betaction: userBet[0]
        }, client, (d) => {

            this.BETACTIONCALL(pastbetObject, client)

        })

    } catch (e) {
        logger.info("Exception HISTORY : ", e);
    }
}


module.exports.HISTORY = async (requestData, client) => {

    try {

        const tableHistory = await RouletteUserHistory.find({ userId: requestData.playerId, ballposition: {$ne:-1} }).sort({ createdAt: -1 }).limit(20);

        commandAcions.sendEvent(client, CONST.HISTORY, { tableHistory: tableHistory }, false, "");


    } catch (e) {
        logger.info("Exception HISTORY : ", e);
    }
}

module.exports.AdminWinLossData = async (gold, type) => {
    try {


        var olddate = this.CreateDate(new Date());
        if (type == "win") {
            await adminwinloss.updateOne(
                {

                    date: olddate
                }, {
                $inc: { win: gold },
                $set: { createdAt: new Date() }
            }, { upsert: true })
        } else {

            await adminwinloss.updateOne(
                {

                    date: olddate
                }, {
                $inc: { loss: gold },
                $set: { createdAt: new Date() }
            }, { upsert: true }, () => {

            })
        }



    } catch (e) {
        logger.info("AdminWinLossData", e);
    }
}


module.exports.CreateDate = (date) => {
    date = new Date(date);
    year = date.getFullYear();
    month = date.getMonth() + 1;
    dt = date.getDate();

    if (dt < 10) {
        dt = '0' + dt;
    }
    if (month < 10) {
        month = '0' + month;
    }

    return dt + '-' + month + '-' + year;
}


module.exports.getPlayerData = async (requestData, client) => {
    try {
        logger.info("player get  requestData : ", requestData);
        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.GETPLAYERDATA, requestData, false, "User session not set, please restart game!");
            return false;
        }
        
        let gwh = {
            _id: MongoID(client.uid)
        }
        let UserInfo = await GameUser.findOne(gwh, {}).lean();
        logger.info("Get player Data UserInfo : ", gwh, JSON.stringify(UserInfo));
        
        commandAcions.sendDirectEvent(client.sck, CONST.GETPLAYERDATA, UserInfo, false, "Player Data Recevied");
        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}
