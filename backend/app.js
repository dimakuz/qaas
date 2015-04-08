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
var subscriber_col;
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

// Authtoken to user
app.use(function (request, response, next) {
    var authtoken = request.header('X-AUTH-TOKEN');

    delete request.headers['_USER_ID']
    if (authtoken) {
        if (authtoken_to_user(authtoken)) {
            request['_USER_ID'] = authtoken_to_user(authtoken);
        }
    }
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
function auth_token_create(user_id) {
    var token = uuid.v1();
    auth_tokens[token] = user_id;
    return token;
}
function authtoken_to_user(authtoken) {
    return auth_tokens[authtoken];
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
        authtoken: user.authtoken,
    };

}
function format_authtoken_info(authtoken) {
    return {
        name: authtoken.name,
        _id: authtoken._id,
        user: authtoken.user,
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
                return_error(res, 400, err);
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

app.get('/queues/:id/subscribers', function (req, res) {
    var id = req.params.id;
     if (!id) {
        return return_error(res, 400, 'Missing values (id)');
    }
    //wip
});

app.post('/subscribers', function (req, res) {
    var queue_id = req.body.subscriber.queue;
    var user_id = req.body.subscriber.user;
    if (!queue_id || !user_id) {
        return return_error(res, 400, 'Missing values (id)');
    }

    if (!req.body.subscriber || !req.body.subscriber.user) {
        return return_error(res, 400, 'Missing values (subscriber, user)');
    }

    var user_id = req.body.subscriber.user._id;
    if (!user_id) {
        return return_error(res, 400, 'Missing values (user_id)');
    }

    if (user_id != req['_USER_ID']) {
        return return_error(res, 403, 'Not authorized');
    }

    queue_col.findOne({_id: _ID(id)}, function (err, queue) {
        if (err) {
            return_error(res, 400, err);
        } else if (!queue) {
            return_error(res, 404, 'Queue not found');
        } else {
            var ordinal = queue.last_ordinal + 1;
            var subscriber = {
                order: ordinal,
                status: 'waiting',
                user: {
                    _id: user_id,
                },
                queue: {
                    _id: queue_id,
                },
            };
            subscriber_col.insert(subscriber);
            queue_col.update(
                {_id: queue._id},
                {
                    $inc: {last_ordinal: 1},
                    $push: {
                        subscribers: subscriber._id,
                    },
                },
                function (err, count, result) {
                    res.json({subscriber: subscriber});
                }
            );
        }
    });
});

app.delete('/subscribers/:sub_id', function (req, res) {
    var sub_id = req.params.sub_id;
    if (!sub_id) {
        return return_error(res, 400, 'Missing values (id)');
    }

    subscriber_col.findOne({_id: _ID(sub_id)}, function (err, sub) {
        if (err) {
            return_error(res, 400, err);
        } else if (!queue) {
            return_error(res, 404, 'Subscriber not found');
        } else {
            queue_col.update(
                {_id: sub.queue._id},
                {
                    $pull: {
                        subscribers: sub._id,
                    },
                },
                function (err, count, result) {
                    if (err) {
                        return_error(res, 400, err);
                    } else {
                        subscriber_col.remove({_id: sub._id});
                        res.sendStatus(200);
                    }
                }
            );
        }
    });
});


app.delete('/queues/:id/subscribers/:sub_id', function (req, res) {
    var id = req.params.id;
    var sub_id = req.params.sub_id;
    if (!id || !sub_id) {
        return return_error(res, 400, 'Missing values (id, sub_id)');
    }

    queue_col.findOne(
        {  _id: _ID(id)},
        function (err, q) {
            if (err) {
                return_error(res, 400, err);
            } else if (!q) {
                return_error(res, 404, "Queue not found");
            } else {
                subs = q.subscribers;
                victims = subs.filter(function (s) {
                    return subscriber_col.find({_id: s._id})
                });
                if (victims.length == 1) {
                    if (victims[0].user._id == req['_USER_ID']) {
                        new_subs = subs.filter(function (s) { return s._id != sub_id });
                        q.subscribers = new_subs;
                        queue_col.update({_id: q._id}, q);
                        res.sendStatus(200);
                    } else {
                        return_error(res, 401, "Unauthorized");
                    }
                } else {
                    return_error(res, 404, 'Subscription not found');
                }
            }
        }
    );
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
                user['authtoken'] = auth_token_create(user._id);
                res.location(
                    '/users/' + user._id
                ).json({
                    user: format_user_info(user),
                    authtokens: [{
                        _id: user.authtoken,
                        name: name,
                    }],
                });
            }
        }
    );
});


app.post('/authtokens', function (req, res) {
    if (!req.body.authtoken) {
        return return_error(res, 400, 'Missing values (authtoken)')
    }
    var name = req.body.authtoken.name;
    var password = req.body.authtoken.password;

    if (!name || !password) {
        return return_error(res, 400, 'Missing values (name, password)');
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
                    user: result._id,
                };
                res.location(
                    '/authtokens/' + auth_tokens.id
                ).json({
                    authtoken: format_authtoken_info(authtoken),
                    users: [{
                        name: name,
                        _id: result._id,
                    }]
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
    subscriber_col = db.collection('_subscriber');
    app.listen(8000);
});
