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
    required: false,
  },
  requirement: {
    type: String,
    required: false,
  },
  progress: {
    type: Number,
    required: false,
    default: 0, // default progress value is 0
  },
  order: { type: Number, default: 0 }, // New field to store the order
});

// Create a Campaign model based on the schema
const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;
