// server.js — Fixed for CST3144 Resit
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

// 2. CORS (Crucial for Render/Local communication)
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
        console.log('✅ Connected to MongoDB: Webstore');
    })
    .catch(err => console.error('❌ Mongo connection error:', err));

// 3. GET All Lessons (Required for initial load)
app.get('/lessons', async (req, res) => {
    try {
        const results = await db.collection('lessons').find({}).toArray();
        res.json(results);
    } catch (e) { res.status(500).send(e); }
});

// 4. Search Lessons (Full Stack Search)
app.get('/search', async (req, res) => {
    const q = (req.query.q || '').trim();
    try {
        const filter = q ? { 
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { location: { $regex: q, $options: 'i' } }
            ] 
        } : {};
        const results = await db.collection('lessons').find(filter).toArray();
        res.json(results);
    } catch (e) { res.status(500).send(e); }
});

// 5. POST Order
app.post('/order', async (req, res) => {
    try {
        const result = await db.collection('orders').insertOne(req.body);
        res.status(201).json({ msg: 'Order saved', id: result.insertedId });
    } catch (e) { res.status(500).send(e); }
});

// 6. PUT Update Inventory
app.put('/lessons/:id', async (req, res) => {
    try {
        const id = new ObjectId(req.params.id);
        const result = await db.collection('lessons').updateOne(
            { _id: id },
            { $inc: { availableInventory: -req.body.spaces } }
        );
        res.json({ msg: 'Inventory updated' });
    } catch (e) { res.status(500).send(e); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));