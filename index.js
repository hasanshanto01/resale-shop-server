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
