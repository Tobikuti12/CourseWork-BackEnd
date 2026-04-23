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

// 2. CORS (Permissive for testing and Render)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// 3. MongoDB Connection
const MONGO_URI = "mongodb+srv://tobi1:Tmgolf159@cluster0.k6z8gsk.mongodb.net/Webstore?retryWrites=true&w=majority";
let db;

MongoClient.connect(MONGO_URI, { useUnifiedTopology: true })
    .then(client => {
        db = client.db('Webstore');
        console.log('✅ Connected to MongoDB: Webstore');
    })
    .catch(err => console.error('❌ Connection error:', err));

// 4. GET ALL LESSONS
app.get('/lessons', async (req, res) => {
    try {
        let results = await db.collection('lessons').find({}).toArray();
        if (results.length === 0) results = await db.collection('products').find({}).toArray();
        res.json(results);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. SEARCH LESSONS
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
        if (results.length === 0) results = await db.collection('products').find(filter).toArray();
        res.json(results);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 6. POST ORDER
app.post('/order', async (req, res) => {
    try {
        const result = await db.collection('orders').insertOne(req.body);
        res.status(201).json({ msg: 'Order saved', id: result.insertedId });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 7. PUT UPDATE INVENTORY
app.put('/lessons/:id', async (req, res) => {
    try {
        const id = new ObjectId(req.params.id);
        const spacesToReduce = req.body.spaces || 1;
        
        // We try to update 'lessons', then 'products' if lessons doesn't exist
        let result = await db.collection('lessons').updateOne(
            { _id: id },
            { $inc: { availableInventory: -spacesToReduce } }
        );
        
        if (result.matchedCount === 0) {
            result = await db.collection('products').updateOne(
                { _id: id },
                { $inc: { availableInventory: -spacesToReduce } }
            );
        }
        res.json({ msg: 'Inventory updated' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server live on port ${PORT}`));
