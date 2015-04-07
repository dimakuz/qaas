var express = require('express');
var bodyparser = require('body-parser');

app = express();
app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());

app.get('/', function (req, res) {
    res.send('hello');
});

app.post('/create', function (req, res) {
    console.log('/create');
    res.send('ok');
});

app.listen(8000);

