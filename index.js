import express from "express";
import fetch from "node-fetch";
import "dotenv/config";
import path from "path";
import cors from "cors";
import mongoose from "mongoose";
import Campaign from "./models/campaign.js";
import Item from "./models/items.js"; // Import the Item model
import DonationForm from "./models/donationForm.js"; // Import the donation
import Blogs from './models/blogs.js';
import CSR from "./models/csr.js"; // Import the
import PaytmChecksum from 'paytmchecksum';
import Razorpay from "razorpay";
import https from 'https';
import axios from 'axios';
import crypto from 'crypto';
import Data from "./models/campaginData.js";

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PORT = 8888 } = process.env;

const base = "https://api.paypal.com";
const app = express();
const corsOptions = {
  origin: '*',
};
app.use(cors(corsOptions));
app.use(express.json());


const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/doon_welfare";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

db.once("open", () => {
  console.log("Connected to MongoDB database");
});

app.get("/status",async(req,res)=>{
  res.send("works");
});



app.post("/api/campaigns", async (req, res) => {
  try {
    // Get campaign data including progress from the request body
    const { title, description, imageUrl, amount, requirement, progress } = req.body;

    // Create a new campaign document with progress
    const newCampaign = new Campaign({
      title,
      description,
      imageUrl,
      amount,
      requirement,
      progress,
      
    });

    // Save the campaign document to the database
    await newCampaign.save();

    console.log("Campaign saved successfully");
    res.status(201).json(newCampaign); // Respond with the saved campaign data
  } catch (error) {
    console.error("Error saving campaign:", error);
    res.status(500).json({ error: "Failed to create campaign." });
  }
});


app.get("/api/campaigns", async (req, res) => {
  try {
    // Fetch all campaigns from the database and sort them by the 'order' field
    const campaigns = await Campaign.find().sort({ order: 1 });

    // Respond with the list of campaigns
    res.status(200).json(campaigns);
  } catch (error) {
    console.error("Failed to fetch campaigns:", error);
    res.status(500).json({ error: "Failed to fetch campaigns." });
  }
});

app.get("/api/campaigns/:campaignId", async (req, res) => {
  try {
    const { campaignId } = req.params;

    // Find the campaign by its ID
    const campaign = await Campaign.findById({_id: campaignId});

    if (!campaign) {
      // If the campaign is not found, respond with a 404 status code
      res.status(404).json({ error: "Campaign not found." });
    } else {
      // If the campaign is found, respond with the campaign data
      res.status(200).json(campaign);
    }
  } catch (error) {
    console.error("Failed to fetch campaign by ID:", error);
    res.status(500).json({ error: "Failed to fetch campaign." });
  }
});


app.delete("/api/campaigns/:campaignId", async (req, res) => {
  try {
    const { campaignId } = req.params;

    // Use deleteOne to remove the campaign by its _id
    const deletedCampaign = await Campaign.deleteOne({ _id: campaignId });

    if (deletedCampaign.deletedCount === 1) {
      console.log("Campaign deleted successfully");
      res.status(204).send(); // Respond with status 204 (No Content) on successful deletion
    } else {
      console.error("Campaign not found");
      res.status(404).json({ error: "Campaign not found." });
    }
  } catch (error) {
    console.error("Error deleting campaign:", error);
    res.status(500).json({ error: "Failed to delete campaign." });
  }
});

app.put("/api/campaigns", async (req, res) => {
  try {
    const { campaignIds } = req.body;

    // Iterate through the campaignIds array and update the order based on the order of IDs
    for (let i = 0; i < campaignIds.length; i++) {
      const campaignId = campaignIds[i];
      await Campaign.findByIdAndUpdate(campaignId, { $set: { order: i } });
    }

    console.log("Campaigns order updated successfully");
    res.status(200).json({ message: "Campaigns order updated successfully" });
  } catch (error) {
    console.error("Error updating campaigns order:", error);
    res.status(500).json({ error: "Failed to update campaigns order." });
  }
});

app.put("/api/campaigns/:campaignId/progress", async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { progress } = req.body;

    // Find the campaign by its ID and update the progress
    await Campaign.findByIdAndUpdate(campaignId, { $set: { progress } });

    console.log("Campaign progress updated successfully");
    res.status(200).json({ message: "Campaign progress updated successfully" });
  } catch (error) {
    console.error("Error updating campaign progress:", error);
    res.status(500).json({ error: "Failed to update campaign progress." });
  }
});


app.post("/api/items", async (req, res) => {
  try {
   const { name, description, imageUrl, amount, campaignId } = req.body;

    // Create a new Item document
    const newItem = new Item({
      name,
      description,
      imageUrl,
      amount,
      campaignId
    });

    // Save the item to the database
    const itemName = await newItem.save();

    // const item = await Item.create({
    //   name,
    //   description,
    //   imageUrl,
    //   amount,
    //   campaignId
    // });

    console.log("Item saved successfully");
    res.status(201).json({
      success:true,
      message:"Item created successfully",
      data:itemName
    }); // Respond with the saved item data
  } catch (error) {
    console.error("Error saving item:", error);
    res.status(500).json({ error: "Failed to create item." });
  }
});

app.get("/api/items", async (req, res) => {
  try {
    // Fetch all items from the database
    const items = await Item.find().populate({
      path: "campaignId",
    });

    // Respond with the list of items
    res.status(200).json(items);
  } catch (error) {
    console.error("Failed to fetch items:", error);
    res.status(500).json({ error: "Failed to fetch items." });
  }
});

app.delete("/api/items/:itemsId", async (req, res) => {
  try {
    const { itemsId } = req.params;

    const deletedItem = await Item.deleteOne({ _id: itemsId });

    if (deletedItem.deletedCount === 1) {
      console.log("Item deletedItem deleted successfully");
      res.status(204).send();
    } else {
      console.error("dItem not found");
      res.status(404).json({ error: "Item not found." });
    }
  } catch (error) {
    console.error("Error deleting Item:", error);
    res.status(500).json({ error: "Failed to delete Item." });
  }
});


// Campagin Images and Description Text
app.post("/api/campaign_data", async (req, res) => {
  try {
   const { imageUrl1,imageUrl2,imageUrl3,youtubeLink, description1, description2, description3, campaignId } = req.body;

   if(!imageUrl1 || !campaignId){
    return res.status(400).json({
      success:false,
      message:"ImageUrl1 and Campign Id are mandatory"
    });
   }

    const item = await Data.create({
      imageUrl1, 
      imageUrl2,
      imageUrl3, 
      youtubeLink,
      description1, 
      description2, 
      description3, 
      campaignId
    });

    console.log("Data saved successfully");
    res.status(201).json({
      success:true,
      message:"Data created successfully",
      data:item
    }); // Respond with the saved item data
  } catch (error) {
    console.error("Error saving Data:", error);
    res.status(500).json({ error: "Failed to create Data." });
  }
});

app.get("/api/campaign_data/:id", async (req, res) => {
  try {
    const {id} = req.params;
   // Fetch all items from the database
    const datas = await Data.findOne({
      campaignId:id
    }).populate({
      path: "campaignId",
    });

    // Respond with the list of items
    console.log("Data fetched successfully");
    res.status(200).json({
      success:true,
      message:"Data fetched successfully",
      data:datas
    }); // Respond with the saved item data
  } catch (error) {
    console.error("Failed to fetch datas:", error);
    res.status(500).json({ error: "Failed to fetch datas." });
  }
});


app.delete("/api/campaign_data/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Delete the data from the database
    await Data.deleteOne({ _id: id });
    // Respond with success message
    console.log("Data deleted successfully");
    res.status(200).json({
      success: true,
      message: "Data deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete data:", error);
    res.status(500).json({ error: "Failed to delete data." });
  }
});

app.get("/api/campaign_data", async (req, res) => {
  try {
    const {id} = req.params;
   // Fetch all items from the database
    const datas = await Data.find({}).populate({
      path: "campaignId",
    });

    // Respond with the list of items
    console.log("All Data fetched successfully");
    res.status(200).json({
      success:true,
      message:"All Data fetched successfully",
      data:datas
    }); // Respond with the saved item data
  } catch (error) {
    console.error("Failed to fetch all datas:", error);
    res.status(500).json({ error: "Failed to fetch all datas." });
  }
});

app.put("/api/campaign_data/:id", async(req,res)=>{
  try{
    const {id} = req.params;
    const { imageUrl1,imageUrl2,imageUrl3,youtubeLink, description1, description2, description3, campaignId } = req.body;
    const updateData = await Data.findByIdAndUpdate(
      {_id:id}, 
      { $set: 
        { imageUrl1: imageUrl1,
        imageUrl2:imageUrl2,
        imageUrl3:imageUrl3,
        youtubeLink:youtubeLink,
        description1:description1,
        description2:description2,
        description3:description3,
        campaignId:campaignId 
      } },
    {new: true},
  );

    return res.status(200).json({
      success:true,
      message:'Campagin Data updated Successfully',
      data:updateData
    });

  }catch(error){
    console.error("Error saving Data:", error);
    res.status(500).json({
      success:false,
      message:`Can't Update campaign Data due to ${error.message}`
    });
  }
})

app.delete("/api/campaign_data/:id", async (req, res) => {
  try {
    const {id} = req.params;
   // Fetch all items from the database
    const datas = await Data.deleteOne({
      campaignId:id
    });

    // Respond with the list of items
    console.log("Campaign Data Deleted successfully");
    res.status(200).json({
      success:true,
      message:" Campaign Data deleted successfully",
      data:datas
    }); // Respond with the saved item data
  } catch (error) {
    console.error("Failed to delete datas:", error);
    res.status(500).json({ error: "Failed to delete datas." });
  }
});


const generateAccessToken = async () => {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("MISSING_API_CREDENTIALS");
    }

    const auth = Buffer.from(
      PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET
    ).toString("base64");

    const response = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const data = await response.json();

    return data.access_token;
  } catch (error) {
    console.error("Failed to generate Access Token:", error);
  }
};

const createOrder = async (cart) => {
  // use the cart information passed from the front-end to calculate the purchase unit details
  console.log(cart);
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders`;
  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: cart.amount,
        },
      },
    ],
  };

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
      // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
      // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
    },
    method: "POST",
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

const captureOrder = async (orderID) => {
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders/${orderID}/capture`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
      // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
      // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
    },
  });

  return handleResponse(response);
};

async function handleResponse(response) {
  try {
    const jsonResponse = await response.json();
    return {
      jsonResponse,
      httpStatusCode: response.status,
    };
  } catch (err) {
    const errorMessage = await response.text();
    throw new Error(errorMessage);
  }
}
app.post("/api/orders", async (req, res) => {
  try {
    // use the cart information passed from the front-end to calculate the order amount detals
    const { cart } = req.body;

    const { jsonResponse, httpStatusCode } = await createOrder(cart);
    console.log(jsonResponse);
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
});

app.post("/api/orders/:orderID/capture", async (req, res) => {
  try {
    const { orderID } = req.params;
    const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.log("2");
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
});

// serve index.html
// app.get("/", (req, res) => {
//   res.sendFile(path.resolve("./client/checkout.html"));
// });





app.use(express.urlencoded({extended: false}));
const razorpayInstance = new Razorpay({
  key_id: 'rzp_live_4RuB24CIThT3o6',
  key_secret: 'cYqnCtpbIXcwnE98ZHa1dVI4',
});

// Route for creating a Razorpay order
app.post('/api/razorpay_order', async (req, res) => {
  try {
      // Extract required fields from the request body
      const { amount, currency, receipt, notes } = req.body;
      const parsedAmount = parseFloat(amount);

      // Create Razorpay order asynchronously
      const order = await razorpayInstance.orders.create({ amount: parsedAmount, currency, receipt, notes });

      // Adjust the response structure to match the frontend expectations
      res.status(200).json({
          amount: order.amount,
          currency: order.currency,
          id: order.id,
          prefill: {
              name: '', // Add the default name if available, or retrieve it from the user session
              email: '', // Add the default email if available, or retrieve it from the user session
              contact: '', // Add the default contact if available, or retrieve it from the user session
          },
          paymentStatus: "pending" // Default payment status
      });
  } catch (error) {
      // Handle errors gracefully
      console.error('Error creating Razorpay order:', error);
      res.status(500).send('Internal Server Error');
  }
});

// Route for fetching all payments
app.get('/api/razorpay_payments', async (req, res) => {
  try {
    // Fetch all payments from Razorpay API
    const payments = await razorpayInstance.payments.all();

    // Send the payments data as the response
    res.status(200).json(payments);
  } catch (error) {
    // Handle errors gracefully
    console.error('Error fetching payments:', error);
    res.status(500).send('Internal Server Error');
  }
});

// verify
app.post('/api/verify', async(req,res)=>{
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET).update(sign.toString()).digest("hex");

    if(razorpay_signature === expectedSign ){
      return res.status(200).json({
        success:"true",
        message:"Payment verified Successfully",
      });
    }else{
      return res.status(400).json({
        success:"false",
        message:"Invalid signature sent !",
      });
    }
    
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success:"false",
      message:`Can't verify payment due to ${error.message}`
    });
  }
})




app.post('/api/csr', async (req, res) => {
  try {
    const { amount, email, mobileNumber, message } = req.body;

    // Create a new CSR document
    const csrEntry = new CSR({
      amount,
      email,
      mobileNumber,
      message,
    });

    // Save the CSR entry to the database
    const savedCSR = await csrEntry.save();

    res.status(201).json(savedCSR);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/api/data', async (req, res) => {
  try {
    const donationForms = await DonationForm.find();
    const csrData = await CSR.find();

    res.json({ donationForms, csrData });
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.get('/api/blogs', async (req, res) => {
  try {
    const blogs = await Blogs.find();

    res.json(blogs);
  } catch (error) {
    console.error('Error retrieving blogs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post('/api/blogs', async (req, res) => {

  try {
    const { title, content, imageUrl } = req.body;

    const blog = new Blogs({
      title,
      content,
      imageUrl,
    });

    const savedBlog = await blog.save();

    res.status(201).json(savedBlog);
  } catch (error) {
    console.error('Error saving blog:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }

});
app.get('/api/blogs/:blogid', async (req, res) => {
  try {
    const blogid = await req.params.blogid;
    
    const blog = await Blogs.findById({_id: blogid});

    res.json(blog);
  } catch (error) {
    console.error('Error retrieving blogs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.patch('/api/blogs/:id', async (req, res) => {
  const id = await req.params.id;

  try {
    // Validate if the provided ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: 'Invalid blog ID format' });
    }

    // Convert string to ObjectId
    const objectId = new mongoose.Types.ObjectId(id);

    // Find the blog by id and update it
    const blog = await Blogs.findByIdAndUpdate(objectId, req.body, { new: true });

    if (!blog) {
      return res.status(404).send({ error: 'Blog not found' });
    }

    res.send(blog);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: 'Internal Server Error' });
  }
});



app.delete('/api/blogs/:blogId', async (req, res) => {
  const { blogId } = await req.params;
 
  try {
   

    const deletedBlog = await Blogs.deleteOne({ _id:blogId });

    if (deletedBlog.deletedCount === 1) {
      return res.status(204).send(); // Blog deleted successfully
    } else {
      return res.status(404).json({ error: 'Blog not found' });
    }
  } catch (error) {
    console.error('Error deleting blog:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// // whatsapp api => code at frontend
// app.post('/api/place-order', async (req, res) => {
//   try {
//     // Assuming order details are sent in the request body
//     const { phoneNumber } = req.body;
    
//     // Send WhatsApp notification
//     await sendWhatsAppNotification(phoneNumber, 'Your order has been placed successfully!');

//     res.status(200).json({
//       success:true,
//       message:'Order placed successfully',
//     });
//   } catch (error) {
//     console.error('Error placing order:', error);
//     res.status(500).json({
//       success:false,
//       message:error.message
//     });
//   }
// });

// // Function to send WhatsApp notification using Interkart API
// async function sendWhatsAppNotification(phoneNumber, message) {
//   try {

//     // Make a POST request to Interkart API to send WhatsApp message
//     const response = await axios.post('https://api.interakt.ai/v1/public/message/', {
//       "countryCode": "+91",
//       "phoneNumber": phoneNumber,
//       "fullPhoneNumber": "", // Optional, Either fullPhoneNumber or phoneNumber + CountryCode is required
//       "callbackData": "Congratulations for placing your order",
//       "type": "Template",
//       "template": {
//           "name": "orderplaced",
//           "languageCode": "en",
//           "bodyValues": [
//               "hello",
//               "21"
//           ]
//       }
//   }, {
//       headers: {
//         'Authorization': 'Basic Mzc5YnZSc2M2VHVNSzBLbHRnclZjNTZCSXlhejdQdGwyeFNJM1dUUnZCNDo=',
//         'Content-Type': 'application/json'
//       }
//     });

//     console.log('WhatsApp notification sent successfully:', response);
//   } catch (error) {
//     console.error('Error sending WhatsApp notification:', error.message);
//   }
// }




app.listen(PORT, () => {
  console.log(`Node server listening at http://localhost:${PORT}/`);
});
