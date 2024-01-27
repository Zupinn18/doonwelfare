import mongoose from 'mongoose';

// Define the Campaign schema
const CsrSchema = new mongoose.Schema({
  amount: {
    type: String
  },
  email:{
    type: String,
  },
  mobileNumber:{
    type: String,
  },
  message:{
    type: String,
  }
});

// Create a Campaign model based on the schema
const CSR = mongoose.model('CSR', CsrSchema);

export default CSR;
