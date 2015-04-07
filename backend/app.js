var DB_URL = "mongodb://qaas2:qum6net@209.132.178.110:27017/qaas2";
var express = require('express');
var bodyparser = require('body-parser');
var mongodb = require('mongodb');
var db;
var queue_col;
var token_col;
var session = require('express-session');
var cookie = require('cookie-session');

app = express();
app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'qaas'
}));

app.post('/create', function (req, res) {
    console.log('/create');
    queue_col.insert(
        {
            name: req.body.name,
            secret: req.body.secret
        },
        function (err, doc) {
            res.json({status: 'ok', id: doc.ops[0]._id});
        }
    );
});

app.post('/login', function (req, res) {
    queue_col.findOne({_id: req.body.id}, function (err, doc) {
        if (doc.secret == req.body.secret) {
            var token = 1 ; //genuuid();
            console.log('generated token' + token);
            token_col.insert({
                token_id: token,
                queue_id: req.body.id
            });
            res.json({status: 'ok', token_id: token});
        } else {
            res.json({status: 'invalid' });
        }
})});

mongodb.MongoClient.connect(DB_URL, function (err, _db) {
    console.log('DB connected');
    db = _db;
    queue_col = db.collection('_queue');
    app.listen(8000);
});


// (name, secret) -> queue id
function create_queue(name, secret) {
}

// -> status
function destroy_queue(id, secret) {
}

// -> status
function enqueue(queue_id, consumer_id) {
}


// -> status
function start_proccessing(queue_id, consumer_id) {
}

// -> status
function finish_proccessing(queue_id, consumer_id) {
}

// -> (total in queue, total processing, consumer position) 
function get_consumer_status(queue_id, consumer_id) {
}

// -> (list of consumers)
function get_operator_status(queue_id, consumer_id) {
}

// -> status
function cancel_queueing(queue_id, consumer_id) {
}

