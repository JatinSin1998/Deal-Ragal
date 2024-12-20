const mongoose = require("mongoose");
const Agent = mongoose.model("agent");
const express = require("express");
const router = express.Router();
const config = require("../../../config");
const commonHelper = require("../../helper/commonHelper");
const mainCtrl = require("../../controller/adminController");
const logger = require("../../../logger");
const { registerUser } = require("../../helper/signups/signupValidation");
const walletActions = require("../../roulette/updateWallet");
const GameUser = mongoose.model("users");
const AgentUser = mongoose.model("agent");
const RouletteUserHistory = mongoose.model("RouletteUserHistory");
/**
 * @api {post} /admin/lobbies
 * @apiName  add-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/AgentList", async (req, res) => {
  try {
    //console.info('requet => ', req);

    const agentList = await Agent.find(
      {},
      {
        name: 1,
        location: 1,
        createdAt: 1,
        lastLoginDate: 1,
        status: 1,
        password: 1,
        chips: 1,
      }
    );

    logger.info("admin/dahboard.js post dahboard  error => ", agentList);

    res.json({ agentList });
  } catch (error) {
    logger.error("admin/dahboard.js post bet-list error => ", error);
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {post} /admin/AgentData
 * @apiName  add-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/AgentData", async (req, res) => {
  try {
    console.info("requet => ", req.query);
    //
    const userInfo = await Agent.findOne(
      { _id: new mongoose.Types.ObjectId(req.query.userId) },
      {
        name: 1,
        password: 1,
        location: 1,
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
router.put("/AgentUpdate", async (req, res) => {
  try {
    const Checkagent = await Agent.find({
      _id: { $ne: new mongoose.Types.ObjectId(req.body.userId) },
      name: req.body.name,
    });
    console.log("Checkagent ", Checkagent);
    if (Checkagent != undefined && Checkagent.length > 0) {
      res.json({
        status: false,
        msg: "This Agent name is already taken. Please choose a different one.",
      });
      return false;
    }

    console.log("req ", req.body);
    //currently send rendom number and generate
    let response = {
      $set: {
        password: req.body.password,
        name: req.body.name,
        status: req.body.status,
        location: req.body.location,
      },
    };

    console.log("response ", response);

    console.log("response ", req.body);

    const userInfo = await Agent.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.body.userId) },
      response,
      { new: true }
    );

    logger.info("admin/dahboard.js post dahboard  error => ", userInfo);

    res.json({ status: "ok" });
  } catch (error) {
    logger.error("admin/dahboard.js post bet-list error => ", error);
    //res.send("error");

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
router.post("/AddAgent", async (req, res) => {
  try {
    //currently send rendom number and generate
    console.log("req ", req.body);
    //currently send rendom number and generate
    if (
      req.body.password != undefined &&
      req.body.password != null &&
      req.body.password != "" &&
      req.body.name != undefined &&
      req.body.name != null &&
      req.body.name != "" &&
      req.body.status != undefined &&
      req.body.status != null &&
      req.body.status != "" &&
      req.body.location != undefined &&
      req.body.location != null &&
      req.body.location != ""
    ) {
      const Checkagent = await Agent.find({ name: req.body.name });
      console.log("Checkagent ", Checkagent);
      if (Checkagent != undefined && Checkagent.length > 0) {
        res.json({
          status: false,
          msg: "This Agent name is already taken. Please choose a different one.",
        });
        return false;
      }

      let response = {
        password: req.body.password,
        name: req.body.name,
        createdAt: new Date(),
        lastLoginDate: new Date(),
        status: req.body.status,
        location: req.body.location,
      };

      console.log("response ", response);
      let insertRes = await Agent.create(response);

      console.log("insertRes ", Object.keys(insertRes).length);

      if (Object.keys(insertRes).length > 0) {
        res.json({ res: true, status: "ok" });
      } else {
        logger.info("\nsaveGameUser Error :: ", insertRes);
        res.json({ status: false });
      }
      logger.info("admin/dahboard.js post dahboard  error => ", insertRes);
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
router.delete("/Deleteagent/:id", async (req, res) => {
  try {
    console.log("req ", req.params.id);

    const RecentUser = await Agent.deleteOne({
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
 * @api {post} /agent/agentAddMoney
 * @apiName  add-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.put("/agentAddMoney", async (req, res) => {
  try {
    console.log("Add Money ", req.body);
    //const RecentUser = //await Users.deleteOne({_id: new mongoose.Types.ObjectId(req.params.id)})

    await walletActions.addagentWalletAdmin(
      req.body.userId,
      Number(req.body.money),
      2,
      "Admin Addeed Chips",
      "roulette",
      req.body.adminname,
      req.body.adminid
    );

    logger.info("admin/dahboard.js post dahboard  error => ");

    res.json({ status: "ok", msg: "Successfully Credited...!!" });
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
 * @apiHeader {String}  x-access-token Agent's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.put("/agentDeductMoney", async (req, res) => {
  try {
    console.log("agentDeductMoney ", req.body);
    //const RecentUser = //await Users.deleteOne({_id: new mongoose.Types.ObjectId(req.params.id)})

    await walletActions.deductagentWallet(
      req.body.userId,
      -Number(req.body.money),
      2,
      "Admin duduct Chips",
      "roulette",
      req.body.adminname,
      req.body.adminid
    );

    logger.info("admin/dahboard.js post dahboard  error => ");

    res.json({ status: "ok", msg: "Successfully Credited...!!" });
  } catch (error) {
    logger.error("admin/dahboard.js post bet-list error => ", error);
    //res.send("error");

    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {post} /admin/agentChangePassword
 * @apiName  add-bet-list
 * @apiGroup  Agent
 * @apiHeader {String}  x-access-token Agent's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.put("/agentChangePassword", async (req, res) => {
  try {
    const { agentId, oldPassword, newPassword } = req.body;
    if (!agentId || !oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ status: false, msg: "Missing required fields." });
    }

    const agent = await Agent.findOne({
      _id: new mongoose.Types.ObjectId(agentId),
    });
    console.log(agent, "agentagent");

    if (!agent) {
      res.json({ status: false, msg: "No Agent !.." });
    }

    // Check if the old password matches the stored password
    if (agent.password !== oldPassword) {
      return res
        .status(401)
        .json({ status: false, msg: "Old password is incorrect." });
    }
    // Update the password with the new password
    await Agent.updateOne(
      { _id: new mongoose.Types.ObjectId(agentId) },
      { $set: { password: newPassword } }
    );

    res
      .status(200)
      .json({ status: true, msg: "Password updated successfully." });
  } catch (error) {
    logger.error("admin/dahboard.js post bet-list error => ", error);
    //res.send("error");
    console.log(error, "error");

    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {post} /admin/addMoneyToUser
 * @apiName  add-bet-list
 * @apiGroup  Agent
 * @apiHeader {String}  x-access-token Agent's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.put("/addMoneyToUser", async (req, res) => {
  try {
    const agentInfo = await AgentUser.findOne(
      { _id: new mongoose.Types.ObjectId(req.body.adminid) },
      { name: 1, chips: 1 }
    );

    if (agentInfo != null && agentInfo.chips < Number(req.body.money)) {
      res.json({
        status: false,
        msg: "not enough chips to adding user wallet",
      });
      return false;
    }

    const userInfo = await GameUser.findOne(
      { _id: new mongoose.Types.ObjectId(req.body.userId) },
      { name: 1, agentId: 1 }
    );
    console.log(userInfo.agentId, "userInfo");

    // Compare ObjectIds in the same type (both should be ObjectIds)
    if (userInfo.agentId.toString() !== req.body.adminid.toString()) {
      res.json({
        status: false,
        msg: "User is not added by this agent",
      });
      return;
    }

    await walletActions.deductagentWallet(
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
      "Agent Addeed Chips",
      "roulette",
      req.body.adminname,
      req.body.adminid
    );
    res.json({ status: "ok", msg: "Successfully Credited...!!" });
  } catch (error) {
    logger.error("admin/dahboard.js post bet-list error => ", error);
    //res.send("error");
    console.log(error, "error");

    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

router.put("/deductMoneyToUser", async (req, res) => {
  try {
    const agentInfo = await AgentUser.findOne(
      { _id: new mongoose.Types.ObjectId(req.body.adminid) },
      { name: 1, chips: 1 }
    );

    const userInfo = await GameUser.findOne(
      { _id: new mongoose.Types.ObjectId(req.body.userId) },
      { name: 1, agentId: 1, chips: 1 }
    );
    console.log(userInfo.agentId, "userInfo");

    // Compare ObjectIds in the same type (both should be ObjectIds)
    if (userInfo.agentId.toString() !== req.body.adminid.toString()) {
      res.json({
        status: false,
        msg: "User is not added by this agent",
      });
      return;
    }
    console.log(userInfo, "agentInfoagentInfo");

    if (userInfo != null && userInfo.chips < Number(req.body.money)) {
      res.json({
        status: false,
        msg: "User does not have enough chips to deduct.",
      });
      return;
    }

    // Proceed with the logic if the condition is not met

    await walletActions.deductWallet(
      req.body.userId,
      -Number(req.body.money),
      2,
      "agents duduct Chips",
      "roulette",
      req.body.adminname,
      req.body.adminid
    );

    await walletActions.addagentWalletAdmin(
      req.body.adminid,
      Number(req.body.money),
      2,
      "Deduct amount Addeed Chips to agent",
      "roulette",
      req.body.adminname,
      req.body.adminid,
      userInfo.name
    );

    res.json({ status: "ok", msg: "Successfully Debited...!!" });
  } catch (error) {
    logger.error("admin/dahboard.js post bet-list error => ", error);
    //res.send("error");
    console.log(error, "error");

    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {get} /agent/RouletteGameHistory
 * @apiGroup  Agent
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/RouletteGameHistory", async (req, res) => {
  try {
    console.log("requet => ", req.query.agentId);
    const agentAddUserData = await GameUser.find({
      agentId: req.query.agentId,
    }).select("_id");
    // Extract the array of IDs
    const userIdArray = agentAddUserData.map((user) => user._id);

    const tabInfo = await RouletteUserHistory.find(
      { userId: { $in: userIdArray } } // Match any userId in the array
    ).sort({ createdAt: -1 });
    // logger.info('admin/dahboard.js post dahboard  error => ', tabInfo[0].betObjectData.length);

    // res.json({ gameHistoryData: tabInfo });
    res.json({ gameHistoryData: tabInfo });
  } catch (error) {
    console.log(error, "errorerror");

    logger.error("admin/dahboard.js post bet-list error => ", error);
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {get} /agent/dashboradData
 * @apiGroup  Agent
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/dashboradData", async (req, res) => {
  try {
    console.log("requet => ", req.query.agentId);
    const userData = await GameUser.find({
      agentId: req.query.agentId,
    }).select("flags");
    console.log(userData, "userData");

    const data = await GameUser.aggregate([
      { $match: { agentId: mongoose.Types.ObjectId(req.query.agentId) } },
      {
        $group: {
          _id: null,
          activeUsers: {
            $sum: { $cond: [{ $eq: ["$flags.isOnline", 1] }, 1, 0] },
          },
          inactiveUsers: {
            $sum: { $cond: [{ $eq: ["$flags.isOnline", 0] }, 1, 0] },
          },
          suspendedUsers: {
            $sum: { $cond: [{ $eq: ["$status", false] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0, // Remove the `_id` field from the final output
          activeUsers: 1,
          inactiveUsers: 1,
          suspendedUsers: 1,
        },
      },
    ]);

    res.json({ data });
  } catch (error) {
    console.log(error, "errorerror");

    logger.error("admin/dahboard.js post bet-list error => ", error);
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {put} /agent/changeUserStatus
 * @apiGroup  Agent
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.put("/changeUserStatus", async (req, res) => {
  try {
    console.log("requet => ", req.query.agentId);
    const user = await GameUser.findOne({
      agentId: req.query.agentId,
      _id: req.query.userId, // Assuming `userId` is passed as a query parameter
    });
    // Check if the user exists
    if (!user) {
      return res
        .status(404)
        .json({ error: "No user found for the provided agentId and userId." });
    }

    // Toggle the status
    user.status = !user.status; // Flip true to false or false to true
    await user.save(); // Save the updated user document

    res
      .status(200)
      .json({ message: "Status updated successfully", updatedUser: user });
  } catch (error) {
    console.log(error, "errorerror");

    logger.error("admin/dahboard.js post bet-list error => ", error);
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
