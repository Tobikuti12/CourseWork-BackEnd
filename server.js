const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const app = express();
app.use(express.json());

// 1. Logger Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// 2. Permissive CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

const MONGO_URI = "mongodb+srv://tobi1:Tmgolf159@cluster0.k6z8gsk.mongodb.net/Webstore?retryWrites=true&w=majority";
let db;

MongoClient.connect(MONGO_URI, { useUnifiedTopology: true })
    .then(client => {
        db = client.db('Webstore');
        console.log('✅ Mongo connected successfully');
    })
    .catch(err => console.error('❌ Mongo connection error:', err));

// 3. GET ALL LESSONS
app.get('/lessons', async (req, res) => {
    try {
        // We check 'lessons' first, then 'products' as a fallback
        let results = await db.collection('lessons').find({}).toArray();
        if (results.length === 0) {
            results = await db.collection('products').find({}).toArray();
        }
        res.json(results);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. FULL STACK SEARCH
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

// 5. POST ORDER
app.post('/order', async (req, res) => {
    try {
        const result = await db.collection('orders').insertOne(req.body);
        res.status(201).json({ msg: 'Order saved', id: result.insertedId });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 6. PUT UPDATE SPACES
app.put('/lessons/:id', async (req, res) => {
    try {
        const id = new ObjectId(req.params.id);
        await db.collection('lessons').updateOne(
            { _id: id },
            { $inc: { availableInventory: -req.body.spaces } }
        );
        res.json({ msg: 'Inventory updated' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server live on port ${PORT}`));
