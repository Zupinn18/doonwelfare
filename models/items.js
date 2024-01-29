import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: String,
  amount: {
    type: Number,
    required: true,
  },
  // Reference to the Campaign schema
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign', // This should match the model name for Campaign
    required: true,
  },
});

const Item = mongoose.model('Item', itemSchema);
export default Item;