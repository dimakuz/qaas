//var DB_URL = "mongodb://qaas2:qum6net@209.132.178.110:27017/qaas2";
var DB_URL = "mongodb://localhost:27017/_queues";
var express = require('express');
var bodyparser = require('body-parser');
var mongodb = require('mongodb');
var _ID = function (s) { return new mongodb.ObjectID(s); }
var db;
var queue_col;
var token_col;
var session = require('express-session');
var uuid = require('node-uuid');

app = express();
//
// Add CORS headers
app.use(function (request, response, next) {
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    response.header("Access-Control-Allow-Resource", "*");
    response.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    next();
});

app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());

function token_create(queue) {
    var token = uuid.v1();
    token_col.insert({token: token, queue: queue});
    return token;
}

function token_validate(queue, token, cb) {
    token_col.findOne({queue: queue, token: token}, function(err, result) {
        cb(result != null);
    });

}

function format_queue_info(queue) {
    return {
        name: queue.name,
        _id: queue._id};
}

app.get('/queues', function (req, res) {
    // find currently does no filtering
    // This queue returns all queues info
    queue_col.find({}).toArray(function(err, docs) {
       res.json({queues: docs.map(format_queue_info)});
    });

});

app.post('/queues', function (req, res) {
    var name = req.body.queue.name;
    var secret = req.body.queue.secret;

    if (!name || !secret) {
        res.json({error: 'Missing values'});
        return;
    }
    queue_col.insert(
        {
            name: name,
            secret: secret,
        },
        function (err, result) {
            if (err) {
                res.status(400).json(err);
            } else {
                var queue = result.ops[0];
                var id = queue._id;
                res.location(
                    '/queues/' + id + '?token=' + token_create(id)
                ).json(format_queue_info(queue));
            }
        }
    );
});

app.post('/queues/:id/login', function (req, res) {
    var secret = req.body.secret;
    var id = req.params.id;

    if (!secret || !id) {
        res.status(400).json({error: 'Missing values'});
    }
    queue_col.findOne({_id: _ID(id)},  function (err, queue) {
        if (err) {
            res.status(400).json(err);
        } if (!queue) {
            res.status(404).json({error: "Queue not found"});
        } else {
            if (secret == queue.secret) {
                res.send('/queues/' + id + '?token=' + token_create(id));
            } else {
                res.status(401).json({error: "Invalid password"});
            }
        }
    });
});


app.get('/queues/:id', function (req, res) {
    var id = req.params.id;
    if (!id) {
        res.json({error: 'Missing values'});
    }
    queue_col.findOne({_id: _ID(id)}, function (err, q) {
        if (err) {
            res.status(400).json(err);
        } else if(!q) {
            res.status(404).json({error: "Queue not found"});
        } else {
            res.json({queue: format_queue_info(q)});
        }
    });
});


app.delete('/queues/:id', function (req, res) {
    var id = req.params.id;
    var token = req.body.token;
    if (!id) {
        res.status(400).json(err);
    } else if (!token) {
        res.status(400).json({error: 'Missing values'});
    }
    token_validate(id, token, function(valid) {
        if (!valid) {
            res.status(401).json({error: 'Invalid token for delete operation'});
        } else {
            queue_col.remove({_id: _ID(id)}, function(err) {
                if (err) {
                    res.status(400).json(err);
                } else {
                    res.sendStatus(200);
                }
            });
        }
    });
});

// For debug - remove all queues
app.delete('/queues', function (req, res) {
    queue_col.remove({}, function(err){
        if (err) {
            res.status(400).json(err);
        } else {
            res.sendStatus(200);
        }
    });
});

mongodb.MongoClient.connect(DB_URL, function (err, _db) {
    console.log('DB connected');
    db = _db;
    queue_col = db.collection('_queue');
    token_col = db.collection('_token');
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
