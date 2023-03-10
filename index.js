const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { query } = require('express');
require('dotenv').config();

const stripe = require("stripe")(process.env.STRIPE_SK);

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
        const paymentsCollection = client.db('resaleShop').collection('payments');
        const wishlistsCollection = client.db('resaleShop').collection('wishlists');
        const reporteditemsCollection = client.db('resaleShop').collection('reporteditems');

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

        // payment-intent
        app.post('/create-payment-intent', async (req, res) => {
            const bookedLaptop = req.body;
            // console.log(bookedLaptop);

            const price = bookedLaptop.price;

            const amount = price * 100; //in cents

            const paymentIntent = await stripe.paymentIntents.create({
                currency: "usd",
                amount: amount,
                "payment_method_types": [
                    "card"
                ],
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });

        });

        // API for save payment info
        app.post('/payments', async (req, res) => {
            const payment = req.body;
            // console.log(payment);

            const result = await paymentsCollection.insertOne(payment);

            // *For booking update*
            const bookingId = payment.bookingId;
            const filter = { _id: new ObjectId(bookingId) };
            const updatedBookingDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedBookingResult = await bookingsCollection.updateOne(filter, updatedBookingDoc);

            // *For product/laptop update*
            const productId = payment.productId;
            const query = { _id: new ObjectId(productId) };
            const updatedProductDoc = {
                $set: {
                    status: 'Sold'
                }
            }
            const updatedProductResult = await laptopsCollection.updateOne(query, updatedProductDoc);


            res.send(result);

        });

        //API for getting user role
        app.get('/users/role/:email', async (req, res) => {
            const email = req.params.email;

            const query = { email };

            const user = await usersCollection.findOne(query);

            res.send(user);
        });

        // API for getting users according their role
        app.get('/users', async (req, res) => {
            const role = req.query.role;
            // console.log(role);

            const query = { role: role };

            const result = await usersCollection.find(query).toArray();

            res.send(result);
        })

        // API for save user info
        app.post('/users', async (req, res) => {
            const user = req.body;
            // console.log(user);

            const result = await usersCollection.insertOne(user);

            res.send(result);
        });

        // API for user(seller) verification update
        app.patch('/users/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);

            const query = {
                _id: new ObjectId(id)
            };

            const options = { upsert: true };

            // *User / seller update*
            const updatedDoc = {
                $set: {
                    verified: true
                }
            };

            const result = await usersCollection.updateOne(query, updatedDoc, options);

            // *seller verification update in laptops/products*
            const email = req.body.email;
            // console.log(email);

            const filter = {
                sellerEmail: email
            };

            const updatedLaptopDoc = {
                $set: {
                    verified: true
                }
            };

            const updatedLaptop = await laptopsCollection.updateOne(filter, updatedLaptopDoc, options);

            res.send(result);

        });

        // API for user delete
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);

            const query = {
                _id: new ObjectId(id)
            };

            const result = await usersCollection.deleteOne(query);

            res.send(result);

        });

        // API for getting booking info
        app.get('/bookings', async (req, res) => {
            const email = req.query.email;
            // console.log(email);

            const query = { email: email };

            const bookings = await bookingsCollection.find(query).toArray();

            res.send(bookings);
        });

        // API for specific booking
        app.get('/bookings/:id', async (req, res) => {
            const bookingId = req.params.id;
            // console.log(bookingId);

            const query = { _id: new ObjectId(bookingId) };

            const result = await bookingsCollection.findOne(query);

            res.send(result);
        })

        // API for getting seller based buyer detail from booking
        app.get('/buyers', async (req, res) => {
            const email = req.query.email;
            // console.log(email);

            const query = {
                sellerEmail: email
            };

            const result = await bookingsCollection.find(query).toArray();

            res.send(result);

        })

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

        // API for advertised product
        app.get('/laptops/advertised', async (req, res) => {

            const query = {
                advertisement: true,
                status: 'Available'
            }

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

        // API for updated laptop/product advertisement
        app.patch('/laptops/:id', async (req, res) => {
            const productId = req.params.id;

            const query = { _id: new ObjectId(productId) };

            const options = { upsert: true };

            const updatedDoc = {
                $set: {
                    advertisement: true
                }
            };

            const result = await laptopsCollection.updateOne(query, updatedDoc, options);

            res.send(result);
        });

        // API for product/laptop delete
        app.delete('/laptops/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);

            const query = {
                _id: new ObjectId(id)
            };

            const result = await laptopsCollection.deleteOne(query);

            res.send(result);

        });

        // API for getting wishlist product based on user
        app.get('/wishlists', async (req, res) => {
            const email = req.query.email;
            // console.log(email);

            const query = {
                email: email
            };

            const result = await wishlistsCollection.find(query).toArray();

            res.send(result);

        });

        // API for save wishlist product
        app.post('/wishlists', async (req, res) => {
            const laptopDetail = req.body;
            // console.log(laptopDetail);

            const result = await wishlistsCollection.insertOne(laptopDetail);

            res.send(result);
        });

        // API for getting reported product
        app.get('/reporteditems', async (req, res) => {

            const query = {};

            const result = await reporteditemsCollection.find(query).toArray();

            res.send(result);

        });

        // API for save reported product
        app.post('/reporteditems', async (req, res) => {
            const reportedItem = req.body;
            // console.log(laptopDetail);

            const result = await reporteditemsCollection.insertOne(reportedItem);

            res.send(result);
        });

        // API for reported product delete
        app.delete('/reporteditems/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);

            const query = {
                _id: new ObjectId(id)
            };

            const result = await reporteditemsCollection.deleteOne(query);

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
