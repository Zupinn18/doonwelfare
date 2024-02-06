import mongoose from 'mongoose';

// Define the Campaign schema
const campaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  requirement: {
    type: String,
    required: true,
  },
  progress: {
    type: Number,
    required: true,
    default: 0, // default progress value is 0
  },
});

// Create a Campaign model based on the schema
const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;
