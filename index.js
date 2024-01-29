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
import https from 'https';


const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PORT = 8888 } = process.env;
const base = "https://api.paypal.com";
const app = express();
const corsOptions = {
  origin: '*',
};

app.use(cors(corsOptions));
app.use(express.json());

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/your-database-name";

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
    // Get campaign data from the request body
    const { title, description, imageUrl, amount } = req.body;

    // Create a new campaign document
    const newCampaign = new Campaign({
      title,
      description,
      imageUrl,
      amount,
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
    // Fetch all campaigns from the database
    const campaigns = await Campaign.find();

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

app.post("/api/items", async (req, res) => {
  try {
    const { name, description, imageUrl, amount, campaignId } = req.body;

    // Create a new Item document
    const newItem = new Item({
      name,
      description,
      imageUrl,
      amount,
      campaignId,
    });

    // Save the item to the database
    await newItem.save();

    console.log("Item saved successfully");
    res.status(201).json(newItem); // Respond with the saved item data
  } catch (error) {
    console.error("Error saving item:", error);
    res.status(500).json({ error: "Failed to create item." });
  }
});

app.get("/api/items", async (req, res) => {
  try {
    // Fetch all items from the database
    const items = await Item.find();

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
      console.log("ItedeletedItem deleted successfully");
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
app.get("/", (req, res) => {
  res.sendFile(path.resolve("./client/checkout.html"));
});

app.post("/api/paytm/initiateTransaction", async (req, res) => {
  try {
    console.log(req.body); 

    const donationFormData = new DonationForm(req.body);
    await donationFormData.save();

    const paytmParams = {
      body: {
        requestType: "Payment",
        mid: "DOONAN17084437757649",
        websiteName: "DoonAnimalWelfareFoundation",
        orderId: req.body.orderId,
        callbackUrl: "http://doonanimalwelfarefoundation.com",
        txnAmount: {
          value: req.body.amount,
          currency: "INR",
        },
        userInfo: {
          custId: "CUST_001",
        },
      },
    };

    // Generate Paytm checksum
    const checksum = await PaytmChecksum.generateSignature(
      JSON.stringify(paytmParams.body),
      "crO0cGe3MTCE11rt"
    );

    paytmParams.head = {
      signature: checksum,
    };

    // Prepare the request data
    const post_data = JSON.stringify(paytmParams);

    const options = {
      hostname: 'securegw.paytm.in', // Staging URL
      port: 443,
      path: `/theia/api/v1/initiateTransaction?mid=DOONAN17084437757649&orderId=${req.body.orderId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': post_data.length,
      },
    };

    // Send the request to Paytm
    let response = '';
    const post_req = https.request(options, function (post_res) {
      post_res.on('data', function (chunk) {
        response += chunk;
      });

      post_res.on('end', function () {
        console.log('Response: ', response);
        res.status(200).json({ response }); // Respond with the Paytm response
      });
    });

    post_req.write(post_data);
    post_req.end();
  } catch (error) {
    console.error('Failed to initiate Paytm transaction:', error);
    res.status(500).json({ error: 'Failed to initiate Paytm transaction.' });
  }
});

app.post("/api/paytm/success", async (req, res) => {
  try {
    const orderId = req.body.orderId;

    // Update the document with the provided orderId
    const updatedDonationForm = await DonationForm.findOneAndUpdate(
      { orderId: orderId },
      { payment: "success" },
      { new: true } // To return the updated document
    );

    if (updatedDonationForm) {
      console.log('DonationForm updated successfully:', updatedDonationForm);
      res.status(200).json({ success: true });
    } else {
      console.error('DonationForm not found for orderId:', orderId);
      res.status(404).json({ error: 'DonationForm not found' });
    }
  } catch (error) {
    console.error('Error updating DonationForm:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
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
app.listen(PORT, () => {
  console.log(`Node server listening at http://localhost:${PORT}/`);
});
