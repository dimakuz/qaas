var DB_URL = "mongodb://qaas2:qum6net@209.132.178.110:27017/qaas2";
var express = require('express');
var bodyparser = require('body-parser');
var mongodb = require('mongodb');
var db;
var queue_col;

app = express();
app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());


app.get('/', function (req, res) {
    db.collection('buya').findOne({name: 'foobar'}, function (err, doc) {
        res.send(JSON.stringify(doc));
    });
});

app.post('/create', function (req, res) {
    console.log('/create');
    res.send('ok');
});

mongodb.MongoClient.connect(DB_URL, function (err, _db) {
    console.log('DB connected');
    db = _db;
    queue_col = db.collection('_queue');
    app.listen(8000);
});
