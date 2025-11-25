const express = require('express');

const app = express();
app.use(express.json())
// app.set('port', 3000);
app.use((req,res,next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Acess-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    next();
});

const MongoClient = require('mongodb').MongoClient;

let db;
MongoClient.connect('mongodb+srv://tobi1:Tmgolf159@cluster0.k6z8gsk.mongodb.net', (err, client) => {
db = client.db('Webstore')});
// display a message for root path to show that API is working
app.get('/', (req, res) => {
    res.send('Select a collection, e.g., /collection/messages');
});
