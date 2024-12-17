const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'shop';
const AgentList = mongoose.model('agent');

////////////////////// Sub Agent /////////////////

const ShopSchema = new Schema(
  {
    
    password:{type: String},
    name: { type: String },
    createdAt: { type: Date, default: Date.now },
    lastLoginDate: { type: Date, default: Date.now },
    agentId:{ type: mongoose.Schema.Types.ObjectId, ref: AgentList },
    status:{ type: String },
    location:{ type: String },
    chips:{ type: Number,default:0 }
  },
  { versionKey: false }
);

module.exports = mongoose.model(collectionName, ShopSchema, collectionName);
