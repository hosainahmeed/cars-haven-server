require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI with environment variables
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.drohc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();

    // Access collection
    const reviewsCollection = client.db("carsDb").collection("review");
    const teamCollection = client.db("carsDb").collection("team");
    const productCollection = client.db("carsDb").collection("products");

    // Base route
    app.get("/", (req, res) => {
      res.send("Welcome to Cars Haven");
    });

    // Fetch reviews
    app.get("/review", async (req, res) => {
      try {
        const result = await reviewsCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error fetching reviews", error });
      }
    });

    app.get("/product/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const option = {
          projection: { name: 1, image: 1, price: 1, rating: 1 },
        };
        const result = await productCollection.findOne(query, option);
        console.log(result);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error fetching reviews", error });
      }
    });

    app.get("/product", async (req, res) => {
      try {
        const result = await productCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error fetching reviews", error });
      }
    });
    app.get("/team", async (req, res) => {
      try {
        const result = await teamCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error fetching reviews", error });
      }
    });

    // Ping to confirm MongoDB connection
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  } finally {
    // Uncomment if you want to close the client after each run
    // await client.close();
  }
}

// Run the async function
run().catch(console.dir);

// Start the server
app.listen(port, () => console.log(`App listening on port ${port}!`));
