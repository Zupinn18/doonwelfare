import mongoose from 'mongoose';

const campaignData = new mongoose.Schema({
  imageUrl1: {
    type:String,
    required:true,
  },
  imageUrl2:  {
    type:String,
    required:true,
  },
  imageUrl3:  {
    type:String,
    required:true,
  },
  description1: {
    type: String,
    required: true,
  },
  description2: {
    type: String,
    required: true,
  },
  description3: {
    type: String,
    required: true,
  },
  // Reference to the Campaign schema
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign', // This should match the model name for Campaign
    required: true,
  },
});

const Item = mongoose.model('Data', campaignData);
export default Item;