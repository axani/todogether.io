var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    shortId = require('shortid'),
    fs = require('fs');

/* Main stuff */
server.listen(8080);
var listFolder = 'li'

/* Main Routes */

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
});

/* Dynamic Routes */

app.get('*', function(req, res) {
    
    entered_url = req.params[0];

    // Check if list with this url exists
    var requestedList = __dirname + '/' + listFolder + entered_url;
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

    var listID;
    
    /* For new lists */

    socket.on('generateID', function() {
        listID = '/' + shortId.generate();
        console.log('Generated ID:' + listID);
        socket.emit('showID', listID);
    });

    socket.on('createList', function() {

        fs.writeFile('li' + listID, '{"ID": "' + listID + '", "HTMLcontent": "", "todo": "", "done": ""}', function(err) {
            if(err) {
                console.log(err);
            } else {
                console.log("New list was created: " + listID);
            }
        }); 
    });

    /* For existing lists */

    socket.on('getListData', function(thisListID) {
        fs.readFile('li' + thisListID, 'utf8', function(err, data) {
            if(err) {
                console.log(err);
            } else {
                var listJSON = JSON.parse(data);
                socket.emit('getJSON', listJSON);
                console.log("Successfully read list: " + listJSON.ID);
            }
        }); 
    });

    socket.on('saveList', function(listJSON) {
        fs.writeFile('li' + listJSON.ID, JSON.stringify(listJSON), function(err) {
            if(err) {
                console.log(err);
            } else {
                console.log("List was saved: " + listJSON.ID);
            }
        });
    });

    socket.on('newUser', function(thisListID) {
        console.log('New User connected');
        io.sockets.in(socket.connectedList).emit('updateLog', 'New connection');
        socket.connectedList = thisListID
        socket.join(thisListID)
    });

    socket.on('addItem', function(data) {
        io.sockets.in(socket.connectedList).emit('updateList', data);
    });

    socket.on('coldUpdate', function(listJSON) {
        io.sockets.in(socket.connectedList).emit('updateList', listJSON);
    });

    socket.on('disconnect', function() {
        // Save list
        io.sockets.in(socket.connectedList).emit('saveListTrigger');
        
        io.sockets.in(socket.connectedList).emit('updateLog', 'A user has disconnected');
        socket.leave(socket.connectedList)
    });


});