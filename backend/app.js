//var DB_URL = "mongodb://qaas2:qum6net@209.132.178.110:27017/qaas2";
var DB_URL = "mongodb://localhost:27017/_queues";
var express = require('express');
var bodyparser = require('body-parser');
var mongodb = require('mongodb');
var _ID = function (s) { return new mongodb.ObjectID(s); }
var db;
var queue_col;
var queue_token_col = {};
var auth_col;
var session = require('express-session');
var uuid = require('node-uuid');

var user_tokens = {};

app = express();
//
// Add CORS headers
app.use(function (request, response, next) {
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-AUTH-TOKEN");
    response.header("Access-Control-Allow-Resource", "*");
    response.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    next();
});

app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());

function queue_token_create(queue_id) {
    var token = uuid.v1();
    queue_token_col[token] = queue_id;
    return token;
}

function queue_token_validate(queue_id, token, cb) {
    cb(queue_token_col[token] == queue_id);
}

var auth_tokens = {};
function auth_token_create(auth_id) {
    var token = uuid.v1();
    auth_tokens[token] = auth_id;
    return token;
}
function auth_token_validate(auth_id, token_id) {
    return auth_tokens[token_id] == auth_id;
}

function format_queue_info(queue) {
    return {
        name: queue.name,
        _id: queue._id};
}

function format_authtoken_info(authtoken) {
    return {
        name: authtoken.name,
        _id: authtoken.token_id,
    };

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
                    '/queues/' + id + '?token=' + queue_token_create(id)
                ).json({queue: format_queue_info(queue)});
            }
        }
    );
});

app.post('/queues/:id/get_token', function (req, res) {
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
                res.send('/queues/' + id + '?token=' + queue_token_create(id));
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
    queue_token_validate(id, token, function(valid) {
        if (!valid) {
            res.status(401).json({error: 'Invalid qeueu token for delete operation'});
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

app.post('/authtokens', function (req, res) {
    var name = req.body.authtoken.name;
    var password = req.body.authtoken.password;

    if (!name || !password) {
        res.status(400).json({'error': 'Missing values'});
        return;
    }

    auth_col.insert(
        {
            name: name,
            password: password,
        },
        function (err, result) {
            if (err) {
                res.status(400).json(err);
            } else {
                var authtoken = result.ops[0];
                authtoken["token_id"] = auth_token_create(auth_token_create(authtoken._id));
                res.location(
                    '/authtokens/' + auth_tokens['token_id']
                ).json({authtoken: format_authtoken_info(authtoken)});
            }
        }
    );
});


mongodb.MongoClient.connect(DB_URL, function (err, _db) {
    console.log('DB connected');
    db = _db;
    queue_col = db.collection('_queue');
    auth_col = db.collection('_user');
    app.listen(8000);
});
