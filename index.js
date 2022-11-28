const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.db_user}:${process.env.db_password}@cluster0.ykgjeea.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}



async function run() {
    try {
        const categoriesCollection = client.db('tv_house').collection('categories');
        const productsCollection = client.db('tv_house').collection('products');
        const usersCollection = client.db('tv_house').collection('users');
        const bookingsCollection = client.db('tv_house').collection('bookings');
        const paymentsCollection = client.db('doctorsPortal').collection('payments');



        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }

        app.get('/categories', async (req, res) => {
            const query = {};
            const categories = await categoriesCollection.find(query).toArray();
            res.send(categories);
        })
        app.get('/products', async (req, res) => {
            console.log(req.params)
            const query = {};
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        });


        app.get('/products/:category_name', async (req, res) => {
            const category_name = req.params.category_name;
            const query = { category_name };
            const category = await productsCollection.find(query).toArray();
            res.send(category);
        });


        app.get('/products/user/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const product = await productsCollection.find(query).toArray();
            res.send(product);
        });

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });

        app.get('/bookings', async (req, res) => {

            const query = {}
            const booking = await bookingsCollection.find(query).toArray();
            res.send(booking);
        });
      

        app.get('/bookings/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }


            const booking = await bookingsCollection.find(query).toArray();
            res.send(booking);
        });

        app.get('/bookings/id/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const booking = await bookingsCollection.findOne(query);
            res.send(booking);
            
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;

            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });









        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'Admin' });
        });

        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'Seller' });
        });

        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isBuyer: user?.role === 'Buyer' });
        });

        app.delete('/users/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })


    }

    finally {

    }

}
run().catch(console.log);




app.get('/', async (req, res) => {
    res.send('Tv House server is running');
})

app.listen(port, () => console.log(`Tv House running on ${port}`))