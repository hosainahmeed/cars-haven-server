require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// MongoDB URI with environment variables
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.drohc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// personal middleware
const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).send({ message: "No token provided" });
    }

    jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
      if (err) {
        return res.status(403).send({ message: "Invalid token" });
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    res.status(500).send({ message: "Token verification failed", error });
  }
};

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();

    // Access collection
    const bookingCollection = client.db("carsDb").collection("booking");
    const productCollection = client.db("carsDb").collection("products");
    const reviewsCollection = client.db("carsDb").collection("review");
    const servicesCollection = client.db("carsDb").collection("services");
    const teamCollection = client.db("carsDb").collection("team");

    // Auth route

    app.post("/jwt", async (req, res) => {
      try {
        const user = req.body;
        console.log(user);

        const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {
          expiresIn: "1h",
        });

        const cookieOptions = {
          httpOnly: true,
          secure: false,
        };

        res
          .cookie("token", token, cookieOptions)
          .status(200)
          .send({ success: true, message: "JWT token issued" });
      } catch (error) {
        console.error("Error generating JWT:", error);
        res
          .status(500)
          .send({ success: false, message: "Failed to issue JWT token" });
      }
    });

    // services route
    app.get("/", (req, res) => {
      res.send("Welcome to Cars Haven");
    });
    app.get("/services", async (req, res) => {
      const result = await servicesCollection.find().toArray();
      res.send(result);
    });

    app.get("/services/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const option = {
          projection: { name: 1, image: 1, price: 1, rating: 1 },
        };
        const result = await servicesCollection.findOne(query, option);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error fetching reviews", error });
      }
    });

    app.get("/booking", async (req, res) => {
      try {
        const email = req.query?.email;
        let query = {};

        if (req.query?.email !== email) {
          return res.status(403).send({ message: "forbidden" });
        }

        if (email) {
          query = { email };
        }

        const result = await bookingCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).send({
          success: false,
          message: "Failed to fetch bookings",
          error: error.message,
        });
      }
    });

    app.post("/booking", async (req, res) => {
      const data = req.body;
      try {
        const result = await bookingCollection.insertOne(data);
        res.status(201).send({ success: true, result });
      } catch (error) {
        console.error("Error inserting booking:", error);
        res
          .status(500)
          .send({ success: false, message: "Failed to create booking" });
      }
    });

    app.delete("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
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
