const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;
const RouletteTables = mongoose.model('RouletteTables');

const UserWalletTracks = mongoose.model("userWalletTracks");
const AgentWalletTracks = mongoose.model("agentWalletTracks");
const ShopWalletTracks = mongoose.model("shopWalletTracks");
const AdminWalletTracks = mongoose.model("adminWalletTracks");




const GameUser = mongoose.model("users");
const AgentUser = mongoose.model("agent");
const Shop = mongoose.model('shop');

const commandAcions = require("../helper/socketFunctions");
const CONST = require("../../constant");
const logger = require("../../logger");

module.exports.deductWallet = async (id, deductChips, tType, t, game, adminname, adminid) => {
    try {
        logger.info('\ndedudctWallet : call.-->>>', id, deductChips, t);
        const wh = (typeof id == 'string') ? { _id: MongoID(id) } : { _id: id };

        if (typeof wh == 'undefined' || typeof wh._id == 'undefined' || wh._id == null || typeof tType == 'undefined') {
            return 0;
        }

        deductChips = Number(deductChips.toFixed(2));
        let projection = {
            id: 1,
            username: 1,
            uniqueId: 1,
            chips: 1,
            //winningChips: 1,
            sckId: 1,
            flags: 1
        }

        const userInfo = await GameUser.findOne(wh, projection);
        logger.info("dedudctWallet userInfo : ", userInfo);

        if (userInfo == null) {
            return false;
        }
        logger.info("dedudctWallet userInfo :: ", userInfo);

        userInfo.chips = (typeof userInfo.chips == 'undefined' || isNaN(userInfo.chips)) ? 0 : Number(userInfo.chips);

        let opChips = userInfo.chips;


        logger.info("userInfo.chips =>", userInfo.chips)

        let setInfo = {
            $inc: {}
        };
        let totalDeductChips = deductChips;

        if (userInfo.chips > 0 && deductChips < 0) {

            setInfo['$inc']['chips'] = (userInfo.chips + deductChips) >= 0 ? Number(deductChips) : Number(-userInfo.chips);
            setInfo['$inc']['chips'] = Number(setInfo['$inc']['chips'].toFixed(2))

            let chips = userInfo.chips;

            userInfo.chips = (userInfo.chips + deductChips) >= 0 ? (Number(userInfo.chips) + Number(deductChips)) : 0;
            userInfo.chips = Number(Number(userInfo.chips).toFixed(2));

            deductChips = (deductChips + userInfo.chips) >= 0 ? 0 : (Number(deductChips) + Number(chips));
            deductChips = Number(Number(deductChips).toFixed(2));
        }

        logger.info("\ndedudctWallet setInfo :: --->", setInfo);
        let tranferAmount = totalDeductChips;
        logger.info("dedudctWallet userInfo :: ==>", userInfo);

        if (Object.keys(setInfo["$inc"]).length > 0) {
            for (let key in setInfo["$inc"]) {
                setInfo["$inc"][key] = parseFloat(setInfo["$inc"][key].toString());
            }
        }
        if (Object.keys(setInfo["$inc"]).length == 0) {
            delete setInfo["$inc"];
        }

        logger.info("\ndedudctWallet wh :: ", wh, setInfo);
        let upReps = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
        logger.info("\ndedudctWallet upReps :: ", upReps);

        upReps.chips = (typeof upReps.chips == 'undefined' || isNaN(upReps.chips)) ? 0 : Number(upReps.chips);
        //upReps.winningChips = (typeof upReps.winningChips == 'undefined' || isNaN(upReps.winningChips)) ? 0 : Number(upReps.winningChips);
        let totalRemaningAmount = upReps.chips //+ upReps.winningChips;

        if (typeof tType != 'undefined') {

            let walletTrack = {
                id: userInfo.id,
                uniqueId: userInfo.unique_id,
                userId: wh._id.toString(),
                trnxType: tType,
                trnxTypeTxt: t,
                trnxAmount: tranferAmount,
                oppChips: opChips,
                //oppWinningChips: upReps.winningChips,
                chips: upReps.chips,
                //winningChips: upReps.winningChips,
                totalBucket: totalRemaningAmount,
                gameType: game,
                adminname: adminname != undefined ? adminname : "",
                adminid: adminid != undefined ? adminid : "",
            }
            await this.trackUserWallet(walletTrack);
        }

        if ((typeof upReps.chips.toString().split(".")[1] != "undefined" && upReps.chips.toString().split(".")[1].length > 2)) {

            let updateData = {
                $set: {}
            }
            updateData["$set"]["chips"] = parseFloat(upReps.chips.toFixed(2))
            if (Object.keys(updateData.$set).length > 0) {
                let upRepss = await GameUser.findOneAndUpdate(wh, updateData, { new: true });
                logger.info("\ndedudctWallet upRepss  :: ", upRepss);
            }
        }

        logger.info(" userInfo.sckId.toString() => ", userInfo.sckId)
        logger.info(" upReps userInfo.sckId => ", upReps.sckId)

        commandAcions.sendDirectEvent(userInfo.sckId, CONST.WALLET_UPDATE, {
            //winningChips: upReps.winningChips,
            chips: upReps.chips,
            totalWallet: totalRemaningAmount,
            msg: t
        });

        return totalRemaningAmount;
    } catch (e) {
        logger.info("deductWallet : 1 : Exception : 1", e)
        return 0
    }
}


module.exports.addWalletAdmin = async (id, added_chips, tType, t, game, adminname, adminid) => {
    try {
        logger.info('\ndedudctWallet : call.-->>>', id, added_chips, t);
        const wh = (typeof id == 'string') ? { _id: MongoID(id) } : { _id: id };
        if (typeof wh == 'undefined' || typeof wh._id == 'undefined' || wh._id == null || typeof tType == 'undefined') {
            return false;
        }
        added_chips = Number(added_chips.toFixed(2));
        let projection = {
            id: 1,
            user_name: 1,
            unique_id: 1,
            chips: 1,
            //winningChips: 1,
            sckId: 1,
            flags: 1
        }

        const userInfo = await GameUser.findOne(wh, projection);
        logger.info("dedudctWallet userInfo : ", userInfo);
        if (userInfo == null) {
            return false;
        }
        logger.info("dedudctWallet userInfo :: ", userInfo);

        userInfo.chips = (typeof userInfo.chips == 'undefined' || isNaN(userInfo.chips)) ? 0 : Number(userInfo.chips);
        //userInfo.winningChips = (typeof userInfo.winningChips == 'undefined' || isNaN(userInfo.winningChips)) ? 0 : Number(userInfo.winningChips);

        //let opGameWinning = userInfo.winningChips;
        let opChips = userInfo.chips;


        let setInfo = {
            $inc: {}
        };
        let totalDeductChips = added_chips;

        setInfo['$inc']['chips'] = Number(Number(added_chips).toFixed(2));

        userInfo.chips = Number(userInfo.chips) + Number(added_chips);
        userInfo.chips = Number(userInfo.chips.toFixed(2))


        logger.info("\ndedudctWallet setInfo :: ", setInfo);
        let tranferAmount = totalDeductChips;
        logger.info("dedudctWallet userInfo :: ", userInfo);

        if (Object.keys(setInfo["$inc"]).length > 0) {
            for (let key in setInfo["$inc"]) {
                setInfo["$inc"][key] = parseFloat(setInfo["$inc"][key].toString());
            }
        }
        if (Object.keys(setInfo["$inc"]).length == 0) {
            delete setInfo["$inc"];
        }

        logger.info("\ndedudctWallet wh :: ", wh, setInfo);
        let upReps = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
        logger.info("\ndedudctWallet upReps :: ", upReps);

        upReps.chips = (typeof upReps.chips == 'undefined' || isNaN(upReps.chips)) ? 0 : Number(upReps.chips);
       // upReps.winningChips = (typeof upReps.winningChips == 'undefined' || isNaN(upReps.winningChips)) ? 0 : Number(upReps.winningChips);
        let totalRemaningAmount = upReps.chips //+ upReps.winningChips;

        if (typeof tType != 'undefined') {

            let walletTrack = {
                id: userInfo.id,
                uniqueId: userInfo.unique_id,
                userId: wh._id.toString(),
                trnxType: tType,
                trnxTypeTxt: t,
                trnxAmount: tranferAmount,
                oppChips: opChips,
                //oppWinningChips: opGameWinning,
                chips: upReps.chips,
                //winningChips: upReps.winningChips,
                totalBucket: totalRemaningAmount,
                gameType: game,
                adminname: adminname != undefined ? adminname : "",
                adminid: adminid != undefined ? adminid : "",

            }
            await this.trackUserWallet(walletTrack);
        }

        if ((typeof upReps.chips.toString().split(".")[1] != "undefined" && upReps.chips.toString().split(".")[1].length > 2) || (typeof upReps.winningChips.toString().split(".")[1] != "undefined" && upReps.winningChips.toString().split(".")[1].length > 2)) {

            let updateData = {
                $set: {}
            }
            updateData["$set"]["chips"] = parseFloat(upReps.chips.toFixed(2))

            //updateData["$set"]["winningChips"] = parseFloat(upReps.winningChips.toFixed(2))

            if (Object.keys(updateData.$set).length > 0) {
                let upRepss = await GameUser.findOneAndUpdate(wh, updateData, { new: true });
                logger.info("\ndedudctWallet upRepss  :: ", upRepss);
            }
        }
        commandAcions.sendDirectEvent(userInfo.sckId, CONST.WALLET_UPDATE, {
           // winningChips: upReps.winningChips,
            chips: upReps.chips,
            totalWallet: totalRemaningAmount,
            msg: t
        });

        return totalRemaningAmount;
    } catch (e) {
        logger.info("deductWallet : 1 : Exception : 1", e)
        return 0
    }
}


// Agent =========================


module.exports.deductagentWallet = async (id, deductChips, tType, t, game, adminname, adminid,shopid,shopname) => {
    try {
        logger.info('\ndedudctWallet : call.-->>>', id, deductChips, t);
        const wh = (typeof id == 'string') ? { _id: MongoID(id) } : { _id: id };

        if (typeof wh == 'undefined' || typeof wh._id == 'undefined' || wh._id == null || typeof tType == 'undefined') {
            return 0;
        }

        deductChips = Number(deductChips.toFixed(2));
        let projection = {
            name: 1,
            chips: 1
        }

        const AgentInfo = await AgentUser.findOne(wh, projection);
        logger.info("dedudctWallet AgentInfo : ", AgentInfo);

        if (AgentInfo == null) {
            return false;
        }
        logger.info("dedudctWallet AgentInfo :: ", AgentInfo);

        AgentInfo.chips = (typeof AgentInfo.chips == 'undefined' || isNaN(AgentInfo.chips)) ? 0 : Number(AgentInfo.chips);

        let opChips = AgentInfo.chips;


        logger.info("AgentInfo.chips =>", AgentInfo.chips)

        let setInfo = {
            $inc: {}
        };
        let totalDeductChips = deductChips;

        if (AgentInfo.chips > 0 && deductChips < 0) {

            setInfo['$inc']['chips'] = (AgentInfo.chips + deductChips) >= 0 ? Number(deductChips) : Number(-AgentInfo.chips);
            setInfo['$inc']['chips'] = Number(setInfo['$inc']['chips'].toFixed(2))

            let chips = AgentInfo.chips;

            AgentInfo.chips = (AgentInfo.chips + deductChips) >= 0 ? (Number(AgentInfo.chips) + Number(deductChips)) : 0;
            AgentInfo.chips = Number(Number(AgentInfo.chips).toFixed(2));

            deductChips = (deductChips + AgentInfo.chips) >= 0 ? 0 : (Number(deductChips) + Number(chips));
            deductChips = Number(Number(deductChips).toFixed(2));
        }

        logger.info("\ndedudctWallet setInfo :: --->", setInfo);
        let tranferAmount = totalDeductChips;
        logger.info("dedudctWallet AgentInfo :: ==>", AgentInfo);

        if (Object.keys(setInfo["$inc"]).length > 0) {
            for (let key in setInfo["$inc"]) {
                setInfo["$inc"][key] = parseFloat(setInfo["$inc"][key].toString());
            }
        }
        if (Object.keys(setInfo["$inc"]).length == 0) {
            delete setInfo["$inc"];
        }

        logger.info("\ndedudctWallet wh :: ", wh, setInfo);
        let upReps = await AgentUser.findOneAndUpdate(wh, setInfo, { new: true });
        logger.info("\ndedudctWallet upReps :: ", upReps);

        upReps.chips = (typeof upReps.chips == 'undefined' || isNaN(upReps.chips)) ? 0 : Number(upReps.chips);
        //upReps.winningChips = (typeof upReps.winningChips == 'undefined' || isNaN(upReps.winningChips)) ? 0 : Number(upReps.winningChips);
        let totalRemaningAmount = upReps.chips //+ upReps.winningChips;

        if (typeof tType != 'undefined') {

            let walletTrack = {
                name: AgentInfo.name,
                agentId: wh._id.toString(),
                trnxType: tType,
                trnxTypeTxt: t,
                trnxAmount: tranferAmount,
                oppChips: opChips,
                chips: upReps.chips,
                totalBucket: totalRemaningAmount,
                gameType: game,
                adminname: adminname != undefined ? adminname : "",
                adminid: adminid != undefined ? adminid : "",
                shopid:shopid != undefined ? shopid : "",
                shopname: shopname != undefined ? shopname : "",
            }
            await this.trackAgentWallet(walletTrack);

            if (shopid == undefined || shopid == "" ) {
                let walletTrack1 = {
                    trnxType: tType,
                    trnxTypeTxt: t,
                    trnxAmount: tranferAmount,
                    gameType: game,
                    adminname: adminname != undefined ? adminname : "",
                    adminid: adminid != undefined ? adminid : "",
                    agentid: wh._id.toString(),
                    agentname: AgentInfo.name,
                }
                await this.trackAdminWallet(walletTrack1);
            }

        }

        // if ((typeof upReps.chips.toString().split(".")[1] != "undefined" && upReps.chips.toString().split(".")[1].length > 2)) {

        //     let updateData = {
        //         $set: {}
        //     }
        //     updateData["$set"]["chips"] = parseFloat(upReps.chips.toFixed(2))
        //     if (Object.keys(updateData.$set).length > 0) {
        //         let upRepss = await AgentUser.findOneAndUpdate(wh, updateData, { new: true });
        //         logger.info("\ndedudctWallet upRepss  :: ", upRepss);
        //     }
        // }


        // commandAcions.sendDirectEvent(userInfo.sckId, CONST.WALLET_UPDATE, {
        //     //winningChips: upReps.winningChips,
        //     chips: upReps.chips,
        //     totalWallet: totalRemaningAmount,
        //     msg: t
        // });

        return totalRemaningAmount;
    } catch (e) {
        logger.info("deductWallet : 1 : Exception : 1", e)
        return 0
    }
}


module.exports.addagentWalletAdmin = async (id, added_chips, tType, t, game, adminname, adminid,shopid,shopname) => {
    try {
        logger.info('\addagentWalletAdmin : call.-->>>', id, added_chips, t);
        const wh = (typeof id == 'string') ? { _id: MongoID(id) } : { _id: id };
        if (typeof wh == 'undefined' || typeof wh._id == 'undefined' || wh._id == null || typeof tType == 'undefined') {
            return false;
        }
        added_chips = Number(added_chips.toFixed(2));
        let projection = {
            name: 1,
            chips: 1
        }

        const agentInfo = await AgentUser.findOne(wh, projection);
        logger.info("addagentWalletAdmin agentInfo : ", agentInfo);
        if (agentInfo == null) {
            return false;
        }
        logger.info("addagentWalletAdmin agentInfo :: ", agentInfo);

        agentInfo.chips = (typeof agentInfo.chips == 'undefined' || isNaN(agentInfo.chips)) ? 0 : Number(agentInfo.chips);
        //agentInfo.winningChips = (typeof agentInfo.winningChips == 'undefined' || isNaN(agentInfo.winningChips)) ? 0 : Number(agentInfo.winningChips);

        //let opGameWinning = agentInfo.winningChips;
        let opChips = agentInfo.chips;


        let setInfo = {
            $inc: {}
        };
        let totalDeductChips = added_chips;

        setInfo['$inc']['chips'] = Number(Number(added_chips).toFixed(2));

        agentInfo.chips = Number(agentInfo.chips) + Number(added_chips);
        agentInfo.chips = Number(agentInfo.chips.toFixed(2))


        logger.info("\addagentWalletAdmin setInfo :: ", setInfo);
        let tranferAmount = totalDeductChips;
        logger.info("addagentWalletAdmin agentInfo :: ", agentInfo);

        if (Object.keys(setInfo["$inc"]).length > 0) {
            for (let key in setInfo["$inc"]) {
                setInfo["$inc"][key] = parseFloat(setInfo["$inc"][key].toString());
            }
        }
        if (Object.keys(setInfo["$inc"]).length == 0) {
            delete setInfo["$inc"];
        }

        logger.info("\addagentWalletAdmin wh :: ", wh, setInfo);
        let upReps = await AgentUser.findOneAndUpdate(wh, setInfo, { new: true });
        logger.info("\addagentWalletAdmin upReps :: ", upReps);

        upReps.chips = (typeof upReps.chips == 'undefined' || isNaN(upReps.chips)) ? 0 : Number(upReps.chips);
        let totalRemaningAmount = upReps.chips

        if (typeof tType != 'undefined') {

            let walletTrack = {
                name: agentInfo.name,
                agentId: wh._id.toString(),
                trnxType: tType,
                trnxTypeTxt: t,
                trnxAmount: tranferAmount,
                oppChips: opChips,
                chips: upReps.chips,
                totalBucket: totalRemaningAmount,
                gameType: game,
                adminname: adminname != undefined ? adminname : "",
                adminid: adminid != undefined ? adminid : "",
                shopid:shopid != undefined ? shopid : "",
                shopname: shopname != undefined ? shopname : "",
            }
            await this.trackAgentWallet(walletTrack);


            if (shopid == undefined || shopid == "") {
                let walletTrack1 = {
                    trnxType: tType,
                    trnxTypeTxt: t,
                    trnxAmount: tranferAmount,
                    gameType: game,
                    adminname: adminname != undefined ? adminname : "",
                    adminid: adminid != undefined ? adminid : "",
                    agentid: wh._id.toString(),
                    agentname: agentInfo.name,
                }
                await this.trackAdminWallet(walletTrack1);
            }

        }

        // if ((typeof upReps.chips.toString().split(".")[1] != "undefined" && upReps.chips.toString().split(".")[1].length > 2)
        //     || (typeof upReps.winningChips.toString().split(".")[1] != "undefined" && upReps.winningChips.toString().split(".")[1].length > 2)) {

        //     let updateData = {
        //         $set: {}
        //     }
        //     updateData["$set"]["chips"] = parseFloat(upReps.chips.toFixed(2))

          
        //     if (Object.keys(updateData.$set).length > 0) {
        //         let upRepss = await AgentUser.findOneAndUpdate(wh, updateData, { new: true });
        //         logger.info("\addagentWalletAdmin upRepss  :: ", upRepss);
        //     }
        // }
        
        return totalRemaningAmount;
    } catch (e) {   
        logger.info("addagentWalletAdmin : 1 : Exception : 1", e)
        return 0
    }
}


// Shop ================================

module.exports.deductshopWallet = async (id, deductChips, tType, t, game, adminname, adminid,userid,username) => {
    try {
        logger.info('\ndedudctWallet : call.-->>>', id, deductChips, t);
        const wh = (typeof id == 'string') ? { _id: MongoID(id) } : { _id: id };

        if (typeof wh == 'undefined' || typeof wh._id == 'undefined' || wh._id == null || typeof tType == 'undefined') {
            return 0;
        }

        deductChips = Number(deductChips.toFixed(2));
        let projection = {
            name: 1,
            chips: 1
        }

        const ShopInfo = await Shop.findOne(wh, projection);
        logger.info("dedudctWallet ShopInfo : ", ShopInfo);

        if (ShopInfo == null) {
            return false;
        }
        logger.info("dedudctWallet ShopInfo :: ", ShopInfo);

        ShopInfo.chips = (typeof ShopInfo.chips == 'undefined' || isNaN(ShopInfo.chips)) ? 0 : Number(ShopInfo.chips);

        let opChips = ShopInfo.chips;


        logger.info("ShopInfo.chips =>", ShopInfo.chips)

        let setInfo = {
            $inc: {}
        };
        let totalDeductChips = deductChips;

        if (ShopInfo.chips > 0 && deductChips < 0) {

            setInfo['$inc']['chips'] = (ShopInfo.chips + deductChips) >= 0 ? Number(deductChips) : Number(-ShopInfo.chips);
            setInfo['$inc']['chips'] = Number(setInfo['$inc']['chips'].toFixed(2))

            let chips = ShopInfo.chips;

            ShopInfo.chips = (ShopInfo.chips + deductChips) >= 0 ? (Number(ShopInfo.chips) + Number(deductChips)) : 0;
            ShopInfo.chips = Number(Number(ShopInfo.chips).toFixed(2));

            deductChips = (deductChips + ShopInfo.chips) >= 0 ? 0 : (Number(deductChips) + Number(chips));
            deductChips = Number(Number(deductChips).toFixed(2));
        }

        logger.info("\ndedudctWallet setInfo :: --->", setInfo);
        let tranferAmount = totalDeductChips;
        logger.info("dedudctWallet ShopInfo :: ==>", ShopInfo);

        if (Object.keys(setInfo["$inc"]).length > 0) {
            for (let key in setInfo["$inc"]) {
                setInfo["$inc"][key] = parseFloat(setInfo["$inc"][key].toString());
            }
        }
        if (Object.keys(setInfo["$inc"]).length == 0) {
            delete setInfo["$inc"];
        }

        logger.info("\ndedudctWallet wh :: ", wh, setInfo);
        let upReps = await Shop.findOneAndUpdate(wh, setInfo, { new: true });
        logger.info("\ndedudctWallet upReps :: ", upReps);

        upReps.chips = (typeof upReps.chips == 'undefined' || isNaN(upReps.chips)) ? 0 : Number(upReps.chips);
        //upReps.winningChips = (typeof upReps.winningChips == 'undefined' || isNaN(upReps.winningChips)) ? 0 : Number(upReps.winningChips);
        let totalRemaningAmount = upReps.chips //+ upReps.winningChips;

        if (typeof tType != 'undefined') {

            let walletTrack = {
                name: ShopInfo.name,
                shopId: wh._id.toString(),
                userid:userid,
                username:username,
                trnxType: tType,
                trnxTypeTxt: t,
                trnxAmount: tranferAmount,
                oppChips: opChips,
                chips: upReps.chips,
                totalBucket: totalRemaningAmount,
                gameType: game,
                adminname: adminname != undefined ? adminname : "",
                adminid: adminid != undefined ? adminid : "",
                userid: userid != undefined ? userid : "",
                username: username != undefined ? username : ""
            }
            await this.trackShopWallet(walletTrack);
        }

    

        return totalRemaningAmount;
    } catch (e) {
        logger.info("deductWallet : 1 : Exception : 1", e)
        return 0
    }
}


module.exports.addshopWalletAdmin = async (id, added_chips, tType, t, game, adminname, adminid,userid,username) => {
    try {
        logger.info('\addagentWalletAdmin : call.-->>>', id, added_chips, t);
        const wh = (typeof id == 'string') ? { _id: MongoID(id) } : { _id: id };
        if (typeof wh == 'undefined' || typeof wh._id == 'undefined' || wh._id == null || typeof tType == 'undefined') {
            return false;
        }
        added_chips = Number(added_chips.toFixed(2));
        let projection = {
            name: 1,
            email: 1,
            chips: 1
        }

        const ShopInfo = await Shop.findOne(wh, projection);
        logger.info("addagentWalletAdmin ShopInfo : ", ShopInfo);
        if (ShopInfo == null) {
            return false;
        }
        logger.info("addagentWalletAdmin ShopInfo :: ", ShopInfo);

        ShopInfo.chips = (typeof ShopInfo.chips == 'undefined' || isNaN(ShopInfo.chips)) ? 0 : Number(ShopInfo.chips);
        //ShopInfo.winningChips = (typeof ShopInfo.winningChips == 'undefined' || isNaN(ShopInfo.winningChips)) ? 0 : Number(ShopInfo.winningChips);

        //let opGameWinning = ShopInfo.winningChips;
        let opChips = ShopInfo.chips;


        let setInfo = {
            $inc: {}
        };
        let totalDeductChips = added_chips;

        setInfo['$inc']['chips'] = Number(Number(added_chips).toFixed(2));

        ShopInfo.chips = Number(ShopInfo.chips) + Number(added_chips);
        ShopInfo.chips = Number(ShopInfo.chips.toFixed(2))


        logger.info("\addagentWalletAdmin setInfo :: ", setInfo);
        let tranferAmount = totalDeductChips;
        logger.info("addagentWalletAdmin ShopInfo :: ", ShopInfo);

        if (Object.keys(setInfo["$inc"]).length > 0) {
            for (let key in setInfo["$inc"]) {
                setInfo["$inc"][key] = parseFloat(setInfo["$inc"][key].toString());
            }
        }
        if (Object.keys(setInfo["$inc"]).length == 0) {
            delete setInfo["$inc"];
        }

        logger.info("\addagentWalletAdmin wh :: ", wh, setInfo);
        let upReps = await Shop.findOneAndUpdate(wh, setInfo, { new: true });
        logger.info("\addagentWalletAdmin upReps :: ", upReps);

        upReps.chips = (typeof upReps.chips == 'undefined' || isNaN(upReps.chips)) ? 0 : Number(upReps.chips);
        let totalRemaningAmount = upReps.chips

        if (typeof tType != 'undefined') {

            let walletTrack = {
                name: ShopInfo.name,
                shopId: wh._id.toString(),
                trnxType: tType,
                trnxTypeTxt: t,
                trnxAmount: tranferAmount,
                oppChips: opChips,
                chips: upReps.chips,
                totalBucket: totalRemaningAmount,
                gameType: game,
                adminname: adminname != undefined ? adminname : "",
                adminid: adminid != undefined ? adminid : "",
                userid: userid != undefined ? userid : "",
                username: username != undefined ? username : ""
            }
            await this.trackShopWallet(walletTrack);
        }

        
        return totalRemaningAmount;
    } catch (e) {
        logger.info("addagentWalletAdmin : 1 : Exception : 1", e)
        return 0
    }
}

//================================


// module.exports.addWallet = async (id, added_chips, tType, t, game, adminname, adminid) => {
//     try {
//         logger.info('\ndedudctWallet : call.-->>>', id, added_chips, t);
//         const wh = (typeof id == 'string') ? { _id: MongoID(id) } : { _id: id };
//         if (typeof wh == 'undefined' || typeof wh._id == 'undefined' || wh._id == null || typeof tType == 'undefined') {
//             return false;
//         }
//         added_chips = Number(added_chips.toFixed(2));
//         let projection = {
//             id: 1,
//             user_name: 1,
//             unique_id: 1,
//             chips: 1,
//             winningChips: 1,
//             sckId: 1,
//             flags: 1
//         }

//         const userInfo = await GameUser.findOne(wh, projection);
//         logger.info("dedudctWallet userInfo : ", userInfo);
//         if (userInfo == null) {
//             return false;
//         }
//         logger.info("dedudctWallet userInfo :: ", userInfo);

//         userInfo.chips = (typeof userInfo.chips == 'undefined' || isNaN(userInfo.chips)) ? 0 : Number(userInfo.chips);
//         userInfo.winningChips = (typeof userInfo.winningChips == 'undefined' || isNaN(userInfo.winningChips)) ? 0 : Number(userInfo.winningChips);

//         let opGameWinning = userInfo.winningChips;
//         let opChips = userInfo.chips;


//         let setInfo = {
//             $inc: {}
//         };
//         let totalDeductChips = added_chips;

//         setInfo['$inc']['winningChips'] = Number(Number(added_chips).toFixed(2));

//         userInfo.winningChips = Number(userInfo.winningChips) + Number(added_chips);
//         userInfo.winningChips = Number(userInfo.winningChips.toFixed(2))


//         logger.info("\ndedudctWallet setInfo :: ", setInfo);
//         let tranferAmount = totalDeductChips;
//         logger.info("dedudctWallet userInfo :: ", userInfo);

//         if (Object.keys(setInfo["$inc"]).length > 0) {
//             for (let key in setInfo["$inc"]) {
//                 setInfo["$inc"][key] = parseFloat(setInfo["$inc"][key].toString());
//             }
//         }
//         if (Object.keys(setInfo["$inc"]).length == 0) {
//             delete setInfo["$inc"];
//         }

//         logger.info("\ndedudctWallet wh :: ", wh, setInfo);
//         let upReps = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
//         logger.info("\ndedudctWallet upReps :: ", upReps);

//         upReps.chips = (typeof upReps.chips == 'undefined' || isNaN(upReps.chips)) ? 0 : Number(upReps.chips);
//         upReps.winningChips = (typeof upReps.winningChips == 'undefined' || isNaN(upReps.winningChips)) ? 0 : Number(upReps.winningChips);
//         let totalRemaningAmount = upReps.chips + upReps.winningChips;

//         if (typeof tType != 'undefined') {

//             let walletTrack = {
//                 id: userInfo.id,
//                 uniqueId: userInfo.unique_id,
//                 userId: wh._id.toString(),
//                 trnxType: tType,
//                 trnxTypeTxt: t,
//                 trnxAmount: tranferAmount,
//                 oppChips: opChips,
//                 oppWinningChips: opGameWinning,
//                 chips: upReps.chips,
//                 winningChips: upReps.winningChips,
//                 totalBucket: totalRemaningAmount,
//                 gameType: game,
//                 adminname: adminname != undefined ? adminname : "",
//                 adminid: adminid != undefined ? adminid : "",

//             }
//             await this.trackUserWallet(walletTrack);
//         }

//         if ((typeof upReps.chips.toString().split(".")[1] != "undefined" && upReps.chips.toString().split(".")[1].length > 2) || (typeof upReps.winningChips.toString().split(".")[1] != "undefined" && upReps.winningChips.toString().split(".")[1].length > 2)) {

//             let updateData = {
//                 $set: {}
//             }
//             updateData["$set"]["chips"] = parseFloat(upReps.chips.toFixed(2))

//             updateData["$set"]["winningChips"] = parseFloat(upReps.winningChips.toFixed(2))

//             if (Object.keys(updateData.$set).length > 0) {
//                 let upRepss = await GameUser.findOneAndUpdate(wh, updateData, { new: true });
//                 logger.info("\ndedudctWallet upRepss  :: ", upRepss);
//             }
//         }
//         commandAcions.sendDirectEvent(userInfo.sckId, CONST.WALLET_UPDATE, {
//             winningChips: upReps.winningChips,
//             chips: upReps.chips,
//             totalWallet: totalRemaningAmount,
//             msg: t
//         });

//         return totalRemaningAmount;
//     } catch (e) {
//         logger.info("deductWallet : 1 : Exception : 1", e)
//         return 0
//     }
// }
module.exports.trackUserWallet = async (obj) => {
    logger.info("\ntrackUserWallet obj ::", obj);

    await UserWalletTracks.create(obj)
    return true;
}


module.exports.trackAgentWallet = async (obj) => {
    logger.info("\nAgentWalletTracks obj ::", obj);

    await AgentWalletTracks.create(obj)
    return true;
}

module.exports.trackShopWallet = async (obj) => {
    logger.info("\n trackShopWallet obj ::", obj);

    await ShopWalletTracks.create(obj)
    return true;
}


module.exports.trackAdminWallet = async (obj) => {
    logger.info("\n trackAdminWallet obj ::", obj);

    await AdminWalletTracks.create(obj)
    return true;
}