var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    shortId = require('shortid'),
    fs = require('fs'),
    path = require('path');

/* Main stuff */
server.listen(8080);
var listFolder = 'li'

/* Main Routes */


app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
});


/* Dynamic Routes */

app.get('*', function(req, res) {
    
    entered_url = req.params[0];

    // Check if list with this url exists
    var requestedList = __dirname + '/public/' + listFolder + entered_url;
    fs.exists(requestedList, function(exists) {
        if (exists) {
            // Send user to his list
            res.sendfile(__dirname + '/list.html');
        } else {
            // Show Error page
            res.sendfile(__dirname + '/404.html');
        }
    });
})


io.sockets.on('connection', function(socket) {
    
    socket.on('createList', function(listID) {
        var JSONcontent = require(__dirname + '/public/static/_template.json');
        socket.emit('printToConsole', JSONcontent);

        fs.writeFile('public/' + listFolder + listID, JSONcontent, function(err) {
            if(err) {
                console.log(err);
            } else {
                console.log("New list was created: " + listID);
            }
        }); 
    });
});
