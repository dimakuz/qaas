var DB_URL = "mongodb://qaas2:qum6net@209.132.178.110:27017/qaas2";
// var DB_URL = "mongodb://localhost:27017/_queues";
var express = require('express');
var bodyparser = require('body-parser');
var mongodb = require('mongodb');
var db;
var queue_col;
var token_col;
var session = require('express-session');
var router = express.Router();

app = express();
app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'qaas'
}));


app.post('/queues', function (req, res) {
    console.log('/create');
    queue_col.insert(
        {
            name: req.body.name,
            secret: req.body.secret
        },
        function (err, doc) {
            res.send('/queues/' + req.body.name);
        }
    );
});

app.get('/queues/:queue_id', function (req, res) {
    var q_id = req.params.queue_id
    queue_col.findOne({name: q_id}, function (err, q) {
        res.json(q);
    });
});

mongodb.MongoClient.connect(DB_URL, function (err, _db) {
    console.log('DB connected');
    db = _db;
    queue_col = db.collection('_queue');
    app.listen(8000);
});

/*
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


// (name, secret) -> queue id
function create_queue(name, secret, cb) {
    queue_col.insert(
        {
            name: req.body.name,
            secret: req.body.secret
        },
        function (err, doc)
        {
            cb(err);
        }
};

// -> status
function destroy_queue(id, cb) {
    queue_col.remove(
        {
            name: req.body.name
        },
    function (err, doc)
        {
            cb(err);
        }
}

// -> status
function enqueue(queue_id, consumer_id) {
    var queue = queue_col.find({id : queue_id});
    queue['consumers'].insert(
            {
                consumer_id: consumer_id,
                state: "waiting",
            }
        );
    queue_col.update({id: queue_id}, queue);
}

// -> status
// state -> waiting, processing, done.
function change_state(queue_id, consumer_id, state) {
    var queue = queue_col.find(
            {
                id : queue_id
            }
        );
    consumer = queue.consumers.get(
            {
                consumer_id=consumer_id
            }
        );
    consumer['state'] = state
    queue['consumers'].update(
            {
                consumer_id: consumer_id
            }, consumer);
    queue_col.update(
            {
                id: queue_id
            }, queue);
}

// -> (total in queue, total processing, consumer position)
function get_consumer_status(queue_id, consumer_id) {
    return queue_col.find({id : queue_id})['consumers'].get({consumer_id=consumer_id});
}

// -> (list of consumers)
function get_operator_status(queue_id, consumer_id) {
    return queue_col.find({id : queue_id})['consumers']
}

// -> status
function cancel_queueing(queue_id, consumer_id) {
    var queue = queue_col.find({id : queue_id});
    queue['consumers'].del({consumer_id=consumer_id});
    queue_col.update({id: queue_id}, queue);
}

*/
