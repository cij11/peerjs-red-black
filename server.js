var express = require('express');
var app = express();
var path = require('path');
var peer = require('peer');

app.use(express.static('public'));

app.listen(process.env.PORT, function() {
	console.log('Listening on '+process.env.PORT)
})

// app.listen(3000, function() {
//     console.log('Listening on '+ 3000)
// })
    
