import mongoose from 'mongoose';

// Define the Campaign schema
const donationFormSchema = new mongoose.Schema({
  orderId: {
    type: String,
  },
  amount: {
    type: String,
  },
  email: {
    type: String,
  },
  mobileNumber: {
    type: String,
  },
  type: String,
  name: String,
  panNo: String,
  state:String,
  payment: {
    type: String,
    default: null, // Set default value to null
  },
});

// Create a Campaign model based on the schema
const DonationForm = mongoose.model('DonationForm', donationFormSchema);

export default DonationForm;
