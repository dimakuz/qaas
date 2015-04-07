var DB_URL = "mongodb://qaas2:qum6net@209.132.178.110:27017/qaas2";
var DB_URL = "mongodb://localhost:27017/_queues";
var express = require('express');
var bodyparser = require('body-parser');
var mongodb = require('mongodb');
var _ID = function (s) { return new mongodb.ObjectID(s); }
var db;
var queue_col;
var queue_token_col = {};
var user_col;
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

function return_error(res, code, msg) {
    res.status(code).json({error: {message: msg}});
}

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
        last_ordinal: queue.last_ordinal,
        subscribers: queue.subscribers,
        _id: queue._id
    };
}

function format_user_info(user) {
    return {
        name: user.name,
        _id: user._id,
    };

}
function format_authtoken_info(authtoken) {
    return {
        name: authtoken.name,
        _id: authtoken._id,
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
        return_error(res, 400, 'Missing values (name, secret)');
        return;
    }
    queue_col.insert(
        {
            name: name,
            secret: secret,
            last_ordinal: 0,
            subscribers: [],
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
        return_error(res, 400, 'Missing values (id, secret)');
        return;
    }
    queue_col.findOne({_id: _ID(id)},  function (err, queue) {
        if (err) {
            return_error(res, 400, err);
        } if (!queue) {
            return_error(res, 404, 'Queue not found');
        } else {
            if (secret == queue.secret) {
                res.send('/queues/' + id + '?token=' + queue_token_create(id));
            } else {
                return_error(res, 401, 'Invalid password');
            }
        }
    });
});


app.get('/queues/:id', function (req, res) {
    var id = req.params.id;
    if (!id) {
        return_error(res, 400, 'Missing values (id)');
        return;
    }
    queue_col.findOne({_id: _ID(id)}, function (err, q) {
        if (err) {
            return_error(res, 400, err);
        } else if(!q) {
            return_error(res, 404, 'Queue not found');
        } else {
            res.json({queue: format_queue_info(q)});
        }
    });
});

app.post('/queues/:id/subscribers', function (req, res) {
    var id = req.params.id;
    var user_id = "fucked if i know";
    if (!id) {
        res.status(400).json({error: 'Missing values'});
        return;
    }

    queue_col.findOne({_id: _ID(id)}, function (err, queue) {
        if (err) {
            return_error(res, 400, err);
        } else if (!queue) {
            return_error(res, 404, 'Queue not found');
        } else {
            var ordinal = queue.last_ordinal + 1;
            var subscriber = {
                _id: ordinal,
                user_id: user_id,
            };
            queue_col.update(
                {_id: queue._id},
                {
                    $inc: {last_ordinal: 1},
                    $push: {
                        subscribers: subscriber,
                    },
                },
                function (err, count, result) {
                    res.json({subscriber: subscriber});
                }
            );
        }
    });
});


app.delete('/queues/:id', function (req, res) {
    var id = req.params.id;
    var token = req.body.token;
    if (!id || !token) {
        return_error(res, 400, 'Missing values (token, id)')
        return;
    }
    queue_token_validate(id, token, function(valid) {
        if (!valid) {
            return_error(res, 401, 'Invalid queue token for delete operation');
        } else {
            queue_col.remove({_id: _ID(id)}, function(err) {
                if (err) {
                    return_error(res, 400, err);
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
            return_error(res, 400, err);
        } else {
            res.sendStatus(200);
        }
    });
});

app.post('/users', function (req, res) {
    if (!req.body.user) {
        return_error(res, 400, 'Missing values (user)');
        return;
    }

    var name = req.body.user.name;
    var password = req.body.user.password;

    if (!name || !password) {
        return_error(res, 400, 'Missing values (name, password)');
        return;
    }

    user_col.insert(
        {
            name: name,
            password: password,
        },
        function (err, result) {
            if (err) {
                return_error(res, 400, err);
            } else {
                var user = result.ops[0];
                res.location(
                    '/users/' + user._id
                ).json({
                    user: format_user_info(user),
                    authtoken: {
                        _id: auth_token_create(auth_token_create(user._id)),
                        name: name,
                    },
                });
            }
        }
    );
});


app.post('/authtokens', function (req, res) {
    if (!req.body.authtoken) {
        return_error(res, 400, 'Missing values (authtoken)')
        return;
    }
    var name = req.body.authtoken.name;
    var password = req.body.authtoken.password;

    if (!name || !password) {
        return_error(res, 400, 'Missing values (name, password)');
        return;
    }

    user_col.findOne(
        {
            name: name,
            password: password,
        },
        function (err, result) {
            if (err) {
                return_error(res, 400, err);
            } else if (!result) {
                return_error(res, 404, 'Invalid credentials');
            } else {
                authtoken = {
                    _id: auth_token_create(result._id),
                    name: name,
                };
                res.location(
                    '/authtokens/' + auth_tokens.id
                ).json({
                    authtoken: format_authtoken_info(authtoken),
                });
            }
        }
    );
});


mongodb.MongoClient.connect(DB_URL, function (err, _db) {
    console.log('DB connected');
    db = _db;
    queue_col = db.collection('_queue');
    user_col = db.collection('_user');
    app.listen(8000);
});
