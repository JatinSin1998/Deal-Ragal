const mongoose = require("mongoose");
const MongoID = mongoose.Types.ObjectId;

const Users = mongoose.model("users");
const Agent = mongoose.model("agent");
const UserWalletTracks = mongoose.model("userWalletTracks");
const Shop = mongoose.model("shop");
const express = require("express");
const router = express.Router();
const config = require("../../../config");
const commonHelper = require("../../helper/commonHelper");
const mainCtrl = require("../../controller/adminController");
const logger = require("../../../logger");
const { registerUser } = require("../../helper/signups/signupValidation");
const {
  getUserDefaultFields,
  saveGameUser,
} = require("../../helper/signups/appStart");
const walletActions = require("../../roulette/updateWallet");

const RouletteTables = mongoose.model("RouletteTables");
const leaveTableActions = require("../../roulette/leaveTable");
const commandAcions = require("../../helper/socketFunctions");
const CONST = require("../../../constant");

/**
 * @api {post} /admin/lobbies
 * @apiName  add-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/UserList", async (req, res) => {
  try {
    console.log("requet => ", req.query.Id);
    console.log("requet => type ", req.query.type);

    let userList = [];
    if (req.query.type == "Admin") {
      const pipeline = [
        // 1. Match users (Optional: Filter specific users)
        {
          $match: {}, // Add filter criteria here if needed, e.g., { isActive: true }
        },
        // 2. Lookup to join RouletteUserHistory
        {
          $lookup: {
            from: "RouletteUserHistory", // Collection name of RouletteUserHistory
            let: { userId: { $toString: "$_id" } }, // Convert _id to string
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$userId", "$$userId"], // Match userId from RouletteUserHistory
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalPlay: { $sum: "$play" }, // Sum of play points
                  totalWon: { $sum: "$won" }, // Sum of won points
                  history: { $push: "$$ROOT" }, // Preserve all history records
                },
              },
              {
                $addFields: {
                  endPoints: { $subtract: ["$totalPlay", "$totalWon"] }, // End points calculation
                  margin: { $multiply: ["$totalPlay", 0.025] }, // Margin calculation
                },
              },
            ],
            as: "historyData", // Output field name for history data
          },
        },
        // 3. Unwind history data to access computed values
        {
          $unwind: {
            path: "$historyData",
            preserveNullAndEmptyArrays: true, // Optional: Keep users with no history
          },
        },
        // 4. Project final output with all user fields and aggregated history data
        {
          $project: {
            username: 1,
            name: 1,
            id: 1,
            mobileNumber: 1,
            "counters.totalMatch": 1,
            profileUrl: 1,
            email: 1,
            uniqueId: 1,
            isVIP: 1,
            chips: 1,
            referralCode: 1,
            createdAt: 1,
            lastLoginDate: 1,
            status: 1,
            // history: "$historyData.history", // Preserve all history records
            totalPlayPoints: "$historyData.totalPlay", // Total play points
            totalWonPoints: "$historyData.totalWon", // Total won points
            endPoints: "$historyData.endPoints", // End points
            margin: "$historyData.margin", // Margin
          },
        },
      ];

      // Run the pipeline
      userList = await Users.aggregate(pipeline);
    } else if (req.query.type == "Agent") {
      let totalsubagent = await Shop.find(
        { agentId: MongoID(req.query.Id) },
        { _id: 1 }
      );

      console.log("totalsubagent ", totalsubagent);
      let totalid = [];
      for (let i = 0; i <= totalsubagent.length - 1; i++) {
        totalid.push(MongoID(totalsubagent[i]._id));
      }

      userList = await Users.find(
        { agentId: { $in: totalid } },
        {
          username: 1,
          name: 1,
          id: 1,
          mobileNumber: 1,
          "counters.totalMatch": 1,
          profileUrl: 1,
          email: 1,
          uniqueId: 1,
          isVIP: 1,
          chips: 1,
          referralCode: 1,
          createdAt: 1,
          lastLoginDate: 1,
          status: 1,
        }
      );
    } else if (req.query.type == "Shop") {
      userList = await Users.find(
        { agentId: MongoID(req.query.Id) },
        {
          username: 1,
          name: 1,
          id: 1,
          mobileNumber: 1,
          "counters.totalMatch": 1,
          profileUrl: 1,
          email: 1,
          uniqueId: 1,
          isVIP: 1,
          chips: 1,
          referralCode: 1,
          createdAt: 1,
          lastLoginDate: 1,
          status: 1,
        }
      );
    }
    logger.info("admin/dahboard.js post dahboard  error => ", userList);

    res.json({ userList });
  } catch (error) {
    logger.error("admin/dahboard.js post bet-list error => ", error);
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {get} /admin/lobbies
 * @apiName  add-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/agent/UserList", async (req, res) => {
  try {
    console.log("requet => ", req.query.Id);
    console.log("requet => type ", req.query.type);
    let userList = [];
    if (req.query.type == "Agent") {
      const agentId = req.query.Id || null; // Replace with actual agentId or dynamically provide it

      const pipeline = [
        // 1. Match users (Optional: Filter specific users or agentId)
        {
          $match: agentId ? { agentId: MongoID(agentId) } : {}, // Filter by agentId if provided
        },
        // 2. Lookup to join RouletteUserHistory
        {
          $lookup: {
            from: "RouletteUserHistory", // Collection name of RouletteUserHistory
            let: { userId: { $toString: "$_id" } }, // Convert _id to string
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$userId", "$$userId"], // Match userId from RouletteUserHistory
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalPlay: { $sum: "$play" }, // Sum of play points
                  totalWon: { $sum: "$won" }, // Sum of won points
                  history: { $push: "$$ROOT" }, // Preserve all history records
                },
              },
              {
                $addFields: {
                  endPoints: { $subtract: ["$totalPlay", "$totalWon"] }, // End points calculation
                  margin: { $multiply: ["$totalPlay", 0.025] }, // Margin calculation
                },
              },
            ],
            as: "historyData", // Output field name for history data
          },
        },
        // 3. Unwind history data to access computed values
        {
          $unwind: {
            path: "$historyData",
            preserveNullAndEmptyArrays: true, // Optional: Keep users with no history
          },
        },
        // 4. Project final output with all user fields and aggregated history data
        {
          $project: {
            username: 1,
            name: 1,
            id: 1,
            mobileNumber: 1,
            "counters.totalMatch": 1,
            profileUrl: 1,
            email: 1,
            uniqueId: 1,
            isVIP: 1,
            chips: 1,
            referralCode: 1,
            createdAt: 1,
            lastLoginDate: 1,
            status: 1,
            totalPlayPoints: "$historyData.totalPlay", // Total play points
            totalWonPoints: "$historyData.totalWon", // Total won points
            endPoints: "$historyData.endPoints", // End points
            margin: "$historyData.margin", // Margin
          },
        },
      ];

      // Run the pipeline
      userList = await Users.aggregate(pipeline);
    }
    res.json({ userList });
  } catch (error) {
    logger.error("admin/dahboard.js post bet-list error => ", error);
    console.log(error, "error");

    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {post} /admin/UserData
 * @apiName  add-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/UserData", async (req, res) => {
  try {
    console.info("requet => ", req.query);
    //
    const userInfo = await Users.findOne(
      { _id: new mongoose.Types.ObjectId(req.query.userId) },
      {
        username: 1,
        id: 1,
        loginType: 1,
        profileUrl: 1,
        mobileNumber: 1,
        email: 1,
        uniqueId: 1,
        "counters.totalMatch": 1,
        deviceType: 1,
        chips: 1,
        referralCode: 1,
        createdAt: 1,
        lastLoginDate: 1,
        status: 1,
      }
    );

    logger.info("admin/dahboard.js post dahboard  error => ", userInfo);

    res.json({ userInfo });
  } catch (error) {
    logger.error("admin/dahboard.js post bet-list error => ", error);
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {post} /admin/AddUser
 * @apiName  add-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post("/AddUser", async (req, res) => {
  try {
    console.log("req ", req.body);

    let response = {
      mobileNumber: req.body.mobileNumber,
      username: req.body.name,
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      isVIP: 1,
      country: req.body.country,
      agentId: req.body.agentId,
      profileUrl: "upload/avatar/1.jpg",
    };

    console.log("response  :::::::::::: response ", response);

    logger.info("Register User Request Body =>", response);
    //const { mobileNumber } = response;

    let query = { name: req.body.name };
    let result = await Users.findOne(query, {});
    console.log("result ", result);

    if (!result) {
      let defaultData = await getUserDefaultFields(response);
      logger.info("registerUser defaultData : ", defaultData);

      let userInsertInfo = await saveGameUser(defaultData);
      logger.info("registerUser userInsertInfo : ", userInsertInfo);

      if (userInsertInfo) {
        res.json({ status: true });
      } else {
        res.json({ status: false });
      }
    } else {
      res.json({ status: false });
    }
  } catch (error) {
    logger.error("admin/dahboard.js post bet-list error => ", error);
    //res.send("error");

    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {post} /admin/lobbies
 * @apiName  add-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.delete("/DeleteUser/:id", async (req, res) => {
  try {
    console.log("req ", req.params.id);

    const RecentUser = await Users.deleteOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
    });

    logger.info("admin/dahboard.js post dahboard  error => ", RecentUser);

    res.json({ status: "ok" });
  } catch (error) {
    logger.error("admin/dahboard.js post bet-list error => ", error);
    //res.send("error");

    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {post} /admin/lobbies
 * @apiName  add-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.put("/addMoney", async (req, res) => {
  try {
    console.log("Add Money ", req.body);
    //const RecentUser = //await Users.deleteOne({_id: new mongoose.Types.ObjectId(req.params.id)})
    if (req.body.adminname != "Super Admin") {
      const agentInfo = await Shop.findOne(
        { _id: new mongoose.Types.ObjectId(req.body.adminid) },
        { name: 1, chips: 1 }
      );

      console.log("agentInfo ", agentInfo);

      if (agentInfo != null && agentInfo.chips < Number(req.body.money)) {
        res.json({
          status: false,
          msg: "not enough chips to adding user wallet",
        });
        return false;
      }

      const userInfo = await Users.findOne(
        { _id: new mongoose.Types.ObjectId(req.body.userId) },
        { name: 1 }
      );

      await walletActions.deductshopWallet(
        req.body.adminid,
        -Number(req.body.money),
        2,
        "Add Chips to User",
        "roulette",
        agentInfo.name,
        req.body.adminid,
        req.body.userId,
        userInfo.name
      );

      await walletActions.addWalletAdmin(
        req.body.userId,
        Number(req.body.money),
        2,
        "Sub Agent Addeed Chips",
        "roulette",
        agentInfo.name,
        req.body.adminid
      );

      logger.info("admin/dahboard.js post dahboard  error => ");

      res.json({ status: "ok", msg: "Successfully Credited...!!" });
    } else {
      await walletActions.addWalletAdmin(
        req.body.userId,
        Number(req.body.money),
        2,
        "Agent Addeed Chips",
        "roulette",
        req.body.adminname,
        req.body.adminid
      );

      logger.info("admin/dahboard.js post dahboard  error => ");

      res.json({ status: "ok", msg: "Successfully Credited...!!" });
    }
  } catch (error) {
    logger.error("admin/dahboard.js post bet-list error => ", error);
    //res.send("error");
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {post} /admin/UpdatePassword
 * @apiName  add-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.put("/UpdatePassword", async (req, res) => {
  try {
    console.log("UpdatePassword", req.body);
    await Users.updateOne(
      { _id: new mongoose.Types.ObjectId(req.body.userId) },
      {
        $set: {
          password: req.body.password,
        },
      }
    );

    //await walletActions.addWalletAdmin(req.body.userId, Number(req.body.money),2, "Agent Addeed Chips","roulette",req.body.adminname,req.body.adminid);

    logger.info("admin/dahboard.js post dahboard  error => ");

    res.json({ status: "ok" });
  } catch (error) {
    logger.error("admin/dahboard.js post bet-list error => ", error);
    //res.send("error");

    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {post} /admin/deductMoney
 * @apiName  add-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.put("/deductMoney", async (req, res) => {
  try {
    console.log("deductMoney ", req.body);

    const userInfo = await Users.findOne(
      { _id: new mongoose.Types.ObjectId(req.body.userId) },
      { name: 1, chips: 1 }
    );

    console.log("userInfo ", userInfo);

    if (userInfo != null && userInfo.chips < Number(req.body.money)) {
      res.json({
        status: false,
        msg: "not enough chips to deduct user wallet",
      });
      return false;
    }

    await walletActions.deductWallet(
      req.body.userId,
      -Number(req.body.money),
      2,
      "Sub Agent duduct Chips",
      "roulette",
      req.body.adminname,
      req.body.adminid
    );

    if (req.body.adminname != "Super Admin") {
      await walletActions.addshopWalletAdmin(
        req.body.adminid,
        Number(req.body.money),
        2,
        "User Deduct Chips Added",
        "roulette",
        req.body.adminname,
        req.body.adminid,
        req.body.userId,
        userInfo.name
      );
    }

    logger.info("admin/dahboard.js post dahboard  error => ");

    res.json({ status: "ok", msg: "Successfully Debited...!!" });
  } catch (error) {
    logger.error("admin/dahboard.js post bet-list error => ", error);
    //res.send("error");

    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {post} /admin/K
 * @apiName  add-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.put("/kycInfo", async (req, res) => {
  try {
    console.log("kycInfo ", req.body);
    //const RecentUser = //await Users.deleteOne({_id: new mongoose.Types.ObjectId(req.params.id)})

    logger.info("admin/dahboard.js post dahboard  error => ");

    res.json({ status: "ok" });
  } catch (error) {
    logger.error("admin/dahboard.js post bet-list error => ", error);
    //res.send("error");

    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {post} /admin/UserData
 * @apiName  add-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/UserInfoPrint", async (req, res) => {
  try {
    console.info("requet => ", req.query);
    //
    //const userInfo = await Users.findOne({ _id: new mongoose.Types.ObjectId(req.query.userId) }, { agentId:1,username: 1 })

    //logger.info('admin/dahboard.js post dahboard  error => ', userInfo);
    //const AgentInfo = await Agent.findOne({ _id: new mongoose.Types.ObjectId(userInfo.agentId) }, { name: 1 })

    const TotalBetCount = await UserWalletTracks.find({
      userId: new mongoose.Types.ObjectId(req.query.userId),
      trnxType: "2",
    }).count();
    const TotalWinCount = await UserWalletTracks.find({
      userId: new mongoose.Types.ObjectId(req.query.userId),
      trnxType: "4",
    }).count();

    res.json({
      agentName: "AgentInfo.name",
      date: new Date(),
      TotalBetCount: TotalBetCount,
      TotalWinCount: TotalWinCount,
    });
  } catch (error) {
    logger.error("admin/dahboard.js post bet-list error => ", error);
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {post} /admin/deductMoney
 * @apiName  add-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.put("/blockandunblock", async (req, res) => {
  try {
    console.log("blockandunblock ", req.body);
    //const RecentUser = //await Users.deleteOne({_id: new mongoose.Types.ObjectId(req.params.id)})

    if (req.body.userId != undefined && req.body.isblock != undefined) {
      await Users.updateOne(
        { _id: new mongoose.Types.ObjectId(req.body.userId) },
        { $set: { status: req.body.isblock } }
      );

      let userinfo = await Users.findOne({
        _id: new mongoose.Types.ObjectId(req.body.userId),
      });

      let gwh1 = {
        "playerInfo._id": MongoID(req.body.userId),
      };
      let tableInfo = await RouletteTables.findOne(gwh1, {
        "playerInfo.$": 1,
      }).lean();
      logger.info("JoinTable tableInfo : ", JSON.stringify(tableInfo));

      if (tableInfo != null) {
        // sendEvent(client, CONST.ROULETTE_GAME_JOIN_TABLE, requestData, false, "Already In playing table!!");
        // delete client.JT

        await leaveTableActions.leaveTable(
          {
            reason: "autoLeave",
          },
          {
            uid: tableInfo.playerInfo[0]._id.toString(),
            tbid: tableInfo._id.toString(),
            seatIndex: tableInfo.playerInfo[0].seatIndex,
            sck: tableInfo.playerInfo[0].sck,
          }
        );
      }
      if (userinfo != null && userinfo.sckId != undefined) {
        commandAcions.sendDirectEvent(userinfo.sckId, CONST.BLOCKPLAYER, {
          msg: "Check YourOops! It looks like there's an issue with your internet connection. Please check your connection and try again.",
        });
      }

      res.json({ status: "ok" });
    } else {
      console.log("false");
      res.json({ status: false });
    }

    logger.info("admin/dahboard.js post dahboard  error => ");
  } catch (error) {
    logger.error("admin/dahboard.js post bet-list error => ", error);
    //res.send("error");

    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

async function createPhoneNumber() {
  const countryCode = "91";

  // Generate a random 9-digit mobile number
  const randomMobileNumber =
    Math.floor(Math.random() * 9000000000) + 1000000000;

  // Concatenate the country code and the random mobile number
  const indianMobileNumber = countryCode + randomMobileNumber;

  return indianMobileNumber;
}

module.exports = router;
