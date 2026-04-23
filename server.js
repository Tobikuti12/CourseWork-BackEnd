const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();
app.use(express.json());

// CORS settings to allow your local index.html to talk to Render
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

const MONGO_URI = "mongodb+srv://tobi1:Tmgolf159@cluster0.k6z8gsk.mongodb.net/Webstore?retryWrites=true&w=majority";
let db;

MongoClient.connect(MONGO_URI)
    .then(client => {
        db = client.db('Webstore');
        console.log('✅ Connected to MongoDB');
    })
    .catch(err => console.error('❌ Connection error:', err));

// Route to get all lessons
app.get('/lessons', async (req, res) => {
    try {
        // This checks your 'lessons' collection. If it's empty, it checks 'products'
        let results = await db.collection('lessons').find({}).toArray();
        if (results.length === 0) {
            results = await db.collection('products').find({}).toArray();
        }
        res.json(results);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Full Stack Search Route
app.get('/search', async (req, res) => {
    const q = req.query.q || '';
    const filter = {
        $or: [
            { title: { $regex: q, $options: 'i' } },
            { location: { $regex: q, $options: 'i' } }
        ]
    };
    try {
        let results = await db.collection('lessons').find(filter).toArray();
        if (results.length === 0) {
            results = await db.collection('products').find(filter).toArray();
        }
        res.json(results);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(process.env.PORT || 3000, () => console.log('Backend Live'));