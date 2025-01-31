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
const Shop = mongoose.model("shop");
const RouletteUserHistory = mongoose.model("RouletteUserHistory");
const PlayingTablesModel = mongoose.model("RouletteTables");
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
    const userInfo = await GameUser.findOne(
      { _id: new mongoose.Types.ObjectId(req.body.userId) },
      { name: 1, agentId: 1, chips: 1 }
    );

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
    const {
      subAgentId,
      username = "",
      startDate = "",
      endDate = "",
    } = req.query;
    const page = Number(req.query.page) || 1; // Ensure it's a number
    const limit = Number(req.query.limit) || 10; // Ensure it's a number
    const skip = (page - 1) * limit;

    // Construct the query object
    const query = {
      play: { $ne: 0 }, // Ensure afterPlayPoint is not zero
    };

    // Add username filter if provided
    if (username) {
      query.username = new RegExp(`^${username}`, "i"); // Matches usernames starting with the provided string
    }

    // Add date range filter if both startDate and endDate are provided
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (req.query.agentId) {
      const pipeline = [
        {
          $match: {
            agentId: new mongoose.Types.ObjectId(req.query.agentId), // Convert to ObjectId.
          },
        },
        {
          $project: {
            _id: 0, // Include the `_id` field.
            agentId: "$_id", // Rename `_id` to `subAgentId`.
          },
        },
      ];
      // all sub agent where agent is added sub agent
      const result = await Shop.aggregate(pipeline);
      const subAgentsIds = result.map((doc) => doc.agentId);
      const agentId = new mongoose.Types.ObjectId(req.query.agentId);
      const userPipeline = [
        {
          $match: {
            agentId: { $in: [...subAgentsIds, agentId] }, // Match agentId for both sub-agents and the main agent.
          },
        },
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
                  ...query, // Apply filters dynamically
                },
              },
              // Sort by date (assuming there is a 'date' field in your RouletteUserHistory documents)
              {
                $sort: { createdAt: -1 }, // Sort in descending order to get the latest first
              },
            ],
            as: "historyData", // Output field name for history data
          },
        },
        {
          $unwind: {
            path: "$historyData",
          },
        },
        {
          $addFields: {
            "historyData.history": "$historyData.filteredHistory",
          },
        },
        {
          $unset: "historyData.filteredHistory",
        },
        {
          $replaceRoot: { newRoot: "$historyData" }, // Flatten the structure to return only historyData
        },
        {
          $facet: {
            metadata: [{ $count: "total" }], // Count total history records
            data: [{ $skip: skip }, { $limit: limit }], // Apply pagination
          },
        },
        {
          $project: {
            total: { $arrayElemAt: ["$metadata.total", 0] }, // Extract total count
            data: 1,
          },
        },
      ];

      const allData = await GameUser.aggregate(userPipeline);
      res.json({
        historyData: allData[0].data || [],
        totalRecords: allData[0].total || 0,
        currentPage: page,
        totalPages: Math.ceil((allData[0].total || 0) / limit),
      });
    }
    const userPipeline = [
      {
        $match: {
          agentId: new mongoose.Types.ObjectId(subAgentId), // Match agentId for both sub-agents and the main agent.
        },
      },
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
                ...query, // Apply filters dynamically
              },
            },
            // Sort by date (assuming there is a 'date' field in your RouletteUserHistory documents)
            {
              $sort: { createdAt: -1 }, // Sort in descending order to get the latest first
            },
          ],
          as: "historyData", // Output field name for history data
        },
      },
      {
        $unwind: {
          path: "$historyData",
        },
      },
      {
        $addFields: {
          "historyData.history": "$historyData.filteredHistory",
        },
      },
      {
        $unset: "historyData.filteredHistory",
      },
      {
        $replaceRoot: { newRoot: "$historyData" }, // Flatten the structure to return only historyData
      },
      {
        $facet: {
          metadata: [{ $count: "total" }], // Count total history records
          data: [{ $skip: skip }, { $limit: limit }], // Apply pagination
        },
      },
      {
        $project: {
          total: { $arrayElemAt: ["$metadata.total", 0] }, // Extract total count
          data: 1,
        },
      },
    ];

    const result = await GameUser.aggregate(userPipeline);

    res.json({
      historyData: result[0].data || [],
      totalRecords: result[0].total || 0,
      currentPage: page,
      totalPages: Math.ceil((result[0].total || 0) / limit),
    });
  } catch (error) {
    console.log(error, "errorerror");
    logger.error("admin/dahboard.js post bet-list error => ", error);
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {get} /agent/turnover
 * @apiGroup  Agent
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/turnover", async (req, res) => {
  try {
    const subAgentId = req.query.subAgentId; // Extract subAgentId
    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    const query = {};

    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate }; // Date range filter
    }

    if (req.query.agentId) {
      const pipeline = [
        {
          $match: {
            agentId: new mongoose.Types.ObjectId(req.query.agentId),
          }, // Match sub-agents
        },
        {
          $lookup: {
            from: "users", // Collection name
            localField: "_id",
            foreignField: "agentId",
            as: "subAgentUsers", // Attach users created by sub-agent
          },
        },
        {
          $unwind: {
            path: "$subAgentUsers",
            preserveNullAndEmptyArrays: true, // Keep sub-agents even if they have no users
          },
        },
        {
          $lookup: {
            from: "RouletteUserHistory", // Collection name of RouletteUserHistory
            let: { userId: { $toString: "$subAgentUsers._id" } }, // Convert `_id` to string
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$userId", "$$userId"] }, // Match userId from history
                  ...query, // Apply date filter (query should be a valid object)
                },
              },
              {
                $group: {
                  _id: null,
                  totalPlay: { $sum: "$play" }, // Sum of play points
                  totalWon: { $sum: "$won" }, // Sum of won points
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
        {
          $unwind: {
            path: "$historyData",
            preserveNullAndEmptyArrays: true, // Keep users even if they have no history
          },
        },
        {
          $group: {
            _id: "$_id",
            subAgentName: { $first: "$name" }, // Assuming `name` stores the sub-agent name
            totalPlayPoints: { $sum: "$historyData.totalPlay" }, // Sum of totalPlayPoints for all users
            totalWonPoints: { $sum: "$historyData.totalWon" }, // Sum of totalWonPoints for all users
            totalEndPoints: { $sum: "$historyData.endPoints" }, // Sum of endPoints for all users
            totalMargin: { $sum: "$historyData.margin" }, // Sum of margin for all users
          },
        },
        {
          $project: {
            _id: 0,
            subAgentId: "$_id",
            subAgentName: 1,
            totalPlayPoints: 1,
            totalWonPoints: 1,
            totalEndPoints: 1,
            totalMargin: 1,
          },
        },
        // Additional summing for the entire result set (total across all sub-agents)
        {
          $group: {
            _id: null, // Combine all records into a single one
            totalPlayPoints: { $sum: "$totalPlayPoints" },
            totalWonPoints: { $sum: "$totalWonPoints" },
            totalEndPoints: { $sum: "$totalEndPoints" },
            totalMargin: { $sum: "$totalMargin" },
            subAgentData: { $push: "$$ROOT" }, // Push the sub-agent level data into an array
          },
        },
        {
          $project: {
            _id: 0,
            totalPlayPoints: 1,
            totalWonPoints: 1,
            totalEndPoints: 1,
            totalMargin: 1,
            subAgentData: 1, // Include the sub-agent data
          },
        },
      ];

      const result = await Shop.aggregate(pipeline);

      // console.log(result,"resultresultresultresult");

      // const subAgentsIds = result.map((doc) => doc.agentId);
      // const agentId = new mongoose.Types.ObjectId(req.query.agentId);
      // console.log(subAgentsIds,"subAgentsIdssubAgentsIds");

      // const userPipeline = [
      //   {
      //     $match: {
      //       agentId: { $in: [...subAgentsIds, agentId] }, // Match agentId for both sub-agents and the main agent.
      //     },
      //   }, // ✅ Removed the extra comma here
      //   {
      //     $lookup: {
      //       from: "RouletteUserHistory", // Collection name of RouletteUserHistory
      //       let: { userId: { $toString: "$_id" } }, // Convert `_id` to string
      //       pipeline: [
      //         {
      //           $match: {
      //             $expr: {
      //               $eq: ["$userId", "$$userId"], // Match userId from history
      //             },
      //             ...query, // Apply date filter
      //           },
      //         },
      //         {
      //           $group: {
      //             _id: null,
      //             totalPlay: { $sum: "$play" }, // Sum of play points
      //             totalWon: { $sum: "$won" }, // Sum of won points
      //             lastPlayedDate: { $max: "$createdAt" }, // Get the latest played date
      //             history: { $push: "$$ROOT" }, // Preserve all history records
      //           },
      //         },
      //         {
      //           $addFields: {
      //             endPoints: { $subtract: ["$totalPlay", "$totalWon"] }, // End points calculation
      //             margin: { $multiply: ["$totalPlay", 0.025] }, // Margin calculation
      //             filteredHistory: {
      //               $filter: {
      //                 input: "$history", // Input is the `history` array
      //                 as: "item", // Variable for each item in the array
      //                 cond: { $ne: ["$$item.play", 0] }, // Exclude records where play is 0
      //               },
      //             },
      //           },
      //         },
      //       ],
      //       as: "historyData", // Output field name for history data
      //     },
      //   },
      //   {
      //     $unwind: {
      //       path: "$historyData",
      //       preserveNullAndEmptyArrays: true, // Keep users with no history
      //     },
      //   },
      //   {
      //     $project: {
      //       name: 1, // Include username
      //       totalPlayPoints: "$historyData.totalPlay", // Total play points
      //       totalWonPoints: "$historyData.totalWon", // Total won points
      //       endPoints: "$historyData.endPoints", // End points
      //       margin: "$historyData.margin", // Margin
      //       lastPlayedDate: "$historyData.lastPlayedDate", // Last played date
      //     },
      //   },
      // ];
      // const allData = await GameUser.aggregate(userPipeline);
      res.json({ turnOverData: result });
    }
    const userPipeline = [
      {
        $match: {
          agentId: new mongoose.Types.ObjectId(subAgentId), // Ensure subAgentId is an ObjectId
          ...(req.query.username ? { name: req.query.username } : {}), // Filter by username if provided
        },
      },
      {
        $lookup: {
          from: "RouletteUserHistory", // Collection name of RouletteUserHistory
          let: { userId: { $toString: "$_id" } }, // Convert `_id` to string
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$userId", "$$userId"], // Match userId from history
                },
                ...query, // Apply date filter
              },
            },
            {
              $group: {
                _id: null,
                totalPlay: { $sum: "$play" }, // Sum of play points
                totalWon: { $sum: "$won" }, // Sum of won points
                lastPlayedDate: { $max: "$createdAt" }, // Get the latest played date
                history: { $push: "$$ROOT" }, // Preserve all history records
              },
            },
            {
              $addFields: {
                endPoints: { $subtract: ["$totalPlay", "$totalWon"] }, // End points calculation
                margin: { $multiply: ["$totalPlay", 0.025] }, // Margin calculation
                filteredHistory: {
                  $filter: {
                    input: "$history", // Input is the `history` array
                    as: "item", // Variable for each item in the array
                    cond: { $ne: ["$$item.play", 0] }, // Exclude records where play is 0
                  },
                },
              },
            },
          ],
          as: "historyData", // Output field name for history data
        },
      },
      {
        $unwind: {
          path: "$historyData",
          preserveNullAndEmptyArrays: true, // Keep users with no history
        },
      },
      {
        $project: {
          name: 1, // Include username
          totalPlayPoints: "$historyData.totalPlay", // Total play points
          totalWonPoints: "$historyData.totalWon", // Total won points
          endPoints: "$historyData.endPoints", // End points
          margin: "$historyData.margin", // Margin
          lastPlayedDate: "$historyData.lastPlayedDate", // Last played date
        },
      },
    ];
    const allData = await GameUser.aggregate(userPipeline);
    res.json({ turnOverData: allData });
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
    if (req.query.agentId) {
      const datapipeline = [
        {
          $match: {
            agentId: new mongoose.Types.ObjectId(req.query.agentId), // Convert to ObjectId.
          },
        },
        {
          $project: {
            _id: 0, // Include the `_id` field.
            agentId: "$_id", // Rename `_id` to `subAgentId`.
          },
        },
      ];
      // all sub agent where agent is added sub agent
      const result = await Shop.aggregate(datapipeline);
      const subAgentsIds = result.map((doc) => doc.agentId);
      const agentId = new mongoose.Types.ObjectId(req.query.agentId);
      const pipeline = [
        {
          $match: {
            agentId: { $in: [...subAgentsIds, agentId] }, // Match agentId for both sub-agents and the main agent.
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            chips: 1,
          },
        },
      ];
      const allData = await GameUser.aggregate(pipeline);
      const suspendedPipeline = [
        {
          $match: {
            agentId: { $in: [...subAgentsIds, agentId] }, // Matches agentId for sub-agents and the main agent.
            status: false, // Include only suspended users.
          },
        },
        {
          $group: {
            _id: null, // Combine all documents into one group for the count.
            suspendedUsersCount: { $sum: 1 }, // Count all suspended users.
            suspendedPlayerDetails: {
              $push: { _id: "$_id", name: "$name", chips: "$chips" },
            }, // Push the details of each suspended user.
          },
        },
        {
          $project: {
            _id: 0, // Exclude `_id` in the result.
            suspendedUsersCount: 1, // Include the count of suspended users.
            suspendedPlayerDetails: 1, // Include the details array.
          },
        },
      ];

      // all the suspended user if any
      const suspendedUsers = await GameUser.aggregate(suspendedPipeline);
      // Extract the array of IDs
      const userIdArray = allData.map((user) => user._id);
      // Step 1: Use Aggregation to count active players
      const playingTablesModelPipeline = [
        {
          $project: {
            activePlayers: {
              $filter: {
                input: "$playerInfo", // Filter through playerInfo array.
                as: "player",
                cond: {
                  $in: [
                    "$$player.playerId", // Current playerId in `playerInfo`.
                    userIdArray, // The array of user IDs to check for active players.
                  ],
                },
              },
            },
            totalPlayers: { $size: "$playerInfo" }, // Total players in the document.
          },
        },
        {
          $addFields: {
            activeCount: { $size: "$activePlayers" }, // Count active players.
          },
        },
        {
          $group: {
            _id: null, // Group all documents together.
            totalActiveCount: { $sum: "$activeCount" }, // Sum active players across all documents.
            activePlayersDetails: { $push: "$activePlayers" }, // Collect details of active players.
          },
        },
        {
          $project: {
            _id: 0, // Exclude `_id` from the final result.
            totalActiveCount: 1, // Include the total active count.
            activePlayersDetails: {
              $reduce: {
                input: "$activePlayersDetails",
                initialValue: [],
                in: { $concatArrays: ["$$value", "$$this"] }, // Flatten nested arrays.
              },
            },
          },
        },
        {
          $project: {
            totalActiveCount: 1, // Keep the total active count.
            activePlayersDetails: {
              $map: {
                input: "$activePlayersDetails", // Map through the active players.
                as: "player",
                in: {
                  playerId: "$$player.playerId",
                  name: "$$player.name",
                  coins: "$$player.coins",
                },
              },
            },
          },
        },
      ];

      const results = await PlayingTablesModel.aggregate(
        playingTablesModelPipeline
      );

      // Extract active player IDs
      const activePlayerIds = results[0].activePlayersDetails.map(
        (player) => player.playerId
      );

      return res.json({
        activeUsers: results[0],
        inactiveUsers: {
          totalInactiveCount: userIdArray.length - results[0].totalActiveCount,
          inActivePlayersDetails: allData.filter(
            (player) =>
              !activePlayerIds.includes(new mongoose.Types.ObjectId(player._id))
          ),
        },
        suspendedUsers: suspendedUsers[0],
      });
    }
    const pipeline = [
      {
        $match: {
          agentId: new mongoose.Types.ObjectId(req.query.subAgentId),
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          chips: 1,
        },
      },
    ];
    const allData = await GameUser.aggregate(pipeline);
    const suspendedPipeline = [
      {
        $match: {
          agentId: new mongoose.Types.ObjectId(req.query.subAgentId),
        },
      },
      {
        $group: {
          _id: null, // Combine all documents into one group for the count.
          suspendedUsersCount: { $sum: 1 }, // Count all suspended users.
          suspendedPlayerDetails: {
            $push: { _id: "$_id", name: "$name", chips: "$chips" },
          }, // Push the details of each suspended user.
        },
      },
      {
        $project: {
          _id: 0, // Exclude `_id` in the result.
          suspendedUsersCount: 1, // Include the count of suspended users.
          suspendedPlayerDetails: 1, // Include the details array.
        },
      },
    ];
    // all the suspended user if any
    const suspendedUsers = await GameUser.aggregate(suspendedPipeline);
    // Extract the array of IDs
    const userIdArray = allData.map((user) => user._id);
    // Step 1: Use Aggregation to count active players
    const playingTablesModelPipeline = [
      {
        $project: {
          activePlayers: {
            $filter: {
              input: "$playerInfo", // Filter through playerInfo array.
              as: "player",
              cond: {
                $in: [
                  "$$player.playerId", // Current playerId in `playerInfo`.
                  userIdArray, // The array of user IDs to check for active players.
                ],
              },
            },
          },
          totalPlayers: { $size: "$playerInfo" }, // Total players in the document.
        },
      },
      {
        $addFields: {
          activeCount: { $size: "$activePlayers" }, // Count active players.
        },
      },
      {
        $group: {
          _id: null, // Group all documents together.
          totalActiveCount: { $sum: "$activeCount" }, // Sum active players across all documents.
          activePlayersDetails: { $push: "$activePlayers" }, // Collect details of active players.
        },
      },
      {
        $project: {
          _id: 0, // Exclude `_id` from the final result.
          totalActiveCount: 1, // Include the total active count.
          activePlayersDetails: {
            $reduce: {
              input: "$activePlayersDetails",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] }, // Flatten nested arrays.
            },
          },
        },
      },
      {
        $project: {
          totalActiveCount: 1, // Keep the total active count.
          activePlayersDetails: {
            $map: {
              input: "$activePlayersDetails", // Map through the active players.
              as: "player",
              in: {
                playerId: "$$player.playerId",
                name: "$$player.name",
                coins: "$$player.coins",
              },
            },
          },
        },
      },
    ];
    const results = await PlayingTablesModel.aggregate(
      playingTablesModelPipeline
    );

    // Extract active player IDs
    const activePlayerIds = results[0].activePlayersDetails.map(
      (player) => player.playerId
    );

    res.json({
      activeUsers: results[0],
      inactiveUsers: {
        totalInactiveCount: userIdArray.length - results[0].totalActiveCount,
        inActivePlayersDetails: allData.filter(
          (player) =>
            !activePlayerIds.includes(new mongoose.Types.ObjectId(player._id))
        ),
      },
      suspendedUsers: suspendedUsers[0],
    });
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

/**
 * @api {put} /agent/agentBalance
 * @apiGroup  Agent
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/agentBalance", async (req, res) => {
  try {
    const agent = await AgentUser.findOne({
      _id: req.query.agentId, // Assuming `userId` is passed as a query parameter
    }).select("chips");
    // Check if the user exists
    if (!agent) {
      return res.status(404).json({ error: "No agent found." });
    }
    res.status(200).json({ agent });
  } catch (error) {
    console.log(error, "errorerror");

    logger.error("admin/dahboard.js post bet-list error => ", error);
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {post} /admin/agent/check-username
 * @apiName  add-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post("/check-username", async (req, res) => {
  try {
    const { name } = req.body;

    // Validate input
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "name is required." });
    }

    // Check if the username exists
    const user = await AgentUser.findOne({ name });

    if (user) {
      return res.status(200).json({
        success: true,
        exists: true,
        message: "name already exists.",
      });
    } else {
      return res.status(200).json({
        success: true,
        exists: false,
        message: "name is available.",
      });
    }
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
