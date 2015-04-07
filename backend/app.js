var DB_URL = "mongodb://qaas2:qum6net@209.132.178.110:27017/qaas2";
var express = require('express');
var bodyparser = require('body-parser');
var mongodb = require('mongodb');
var db;
var queue_col;
var token_col;
var session = require('express-session');
var cookie = require('cookie-session');
var router = express.Router();

app = express();
app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'qaas'
}));
/*
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
*/

app.post(
    '/queue/:queue_id/service-begin-by-id/:consumer_id',
    function (req, res) {
        var queue_id = req.params.queue_id;
        var consumer_id = req.params.consumer_id;
    }
)

app.post(
    '/queue/:queue_id/service-begin-next',
    function (req, res) {
        var queue_id = req.params.queue_id;
        console.log(queue_id);
    }
)

app.post(
    '/queue/:queue_id/service-finish/:consumer_id',
    function (req, res) {
        var queue_id = req.params.queue_id;
    }
)

app.post(
    '/queue/:queue_id/service-status',
    function (req, res) {
        var queue_id = req.params.queue_id;
        console.log(queue_id);
    }
)

app.post(
    '/queue/:queue_id/enqueue',
    function (req, res) {
        var queue_id = req.params.queue_id;
        console.log(queue_id);
    }
)

app.post(
    '/queue/:queue_id/status',
    function (req, res) {
        var queue_id = req.params.queue_id;
        console.log(queue_id);
    }
)

app.post(
    '/query/by-name/:queue_name',
    function (req, res) {
        var queue_name = req.params.queue_name;
        console.log(queue_id);
    }
)

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

