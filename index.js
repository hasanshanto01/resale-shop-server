const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();


const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());


// mongodb connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1d18zed.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// CRUD operations
async function run() {
    try {

        const laptopCategoryCollection = client.db('resaleShop').collection('laptopCategories');
        const laptopsCollection = client.db('resaleShop').collection('laptops');
        const usersCollection = client.db('resaleShop').collection('users');
        const bookingsCollection = client.db('resaleShop').collection('bookings');

        // API for laptop category/brand
        app.get('/category', async (req, res) => {
            const query = {};
            const categories = await laptopCategoryCollection.find(query).toArray();

            res.send(categories);
        });

        // API for category/brand wise laptops
        app.get('/category/:brand', async (req, res) => {
            const brand = req.params.brand;
            // console.log(brand);

            const query = { brand: brand }
            const laptops = await laptopsCollection.find(query).toArray();

            res.send(laptops);
        });

        //API for getting user according to their role
        app.get('/users/role/:email', async (req, res) => {
            const email = req.params.email;

            const query = { email };

            const user = await usersCollection.findOne(query);

            res.send(user);
        });

        // API for save user info
        app.post('/users', async (req, res) => {
            const user = req.body;
            // console.log(user);

            const result = await usersCollection.insertOne(user);

            res.send(result);
        });

        // API for save booking info
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            // console.log(booking);

            const result = await bookingsCollection.insertOne(booking);

            res.send(result);
        });

        // API for getting laptops based on seller
        app.get('/laptops', async (req, res) => {
            const email = req.query.email;
            // console.log(email);

            const query = { sellerEmail: email }

            const result = await laptopsCollection.find(query).toArray();

            res.send(result);
        });

        // API for save product/laptop info
        app.post('/laptops', async (req, res) => {
            const product = req.body;
            // console.log(product);

            const result = await laptopsCollection.insertOne(product);

            res.send(result);
        });

    }
    finally {

    }
}
run().catch(console.log);


app.get('/', (req, res) => {
    res.send('Resale-Shop server is running.....');
});

app.listen(port, () => {
    console.log(`Resale-Shop server is running on port: ${port}`);
});
