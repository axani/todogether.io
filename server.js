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

    saveList = function(thisListID, JSONdata) {
        fs.writeFile('public/' + listFolder + thisListID, JSON.stringify(JSONdata, null, 4), function(err) {
            if(err) {
                console.log(err);
            } else {
                console.log("List was saved: " + thisListID);
            }
        }); 
    }
    
    socket.on('createList', function(listMeta) {
        var JSONcontent = require(__dirname + '/public/static/_template.json');
        var listID = listMeta.randomID
        var currentTime = listMeta.currentTime

        JSONcontent.meta['id'] = listID
        JSONcontent.meta['created'] = currentTime
        JSONcontent.meta['lastEdit'] = currentTime

        saveList(listID, JSONcontent)
    });

    socket.on('liveUpdate', function(data) {
        io.sockets.in(data.meta['id']).emit('updateItem', data)
    });

    socket.on('updateItem', function(data) {

        var itemID = data['id']
        var itemContent = data['content']
        // io.sockets.in(socket.connectedList).emit('showItemUpdate', itemID, itemContent);
        socket.broadcast.to(socket.connectedList).emit('showItemUpdate', {'id': itemID, 'content': itemContent});
        console.log('updating item: ', itemID);
    });

    socket.on('updateList', function(allData) {
        // io.sockets.emit('getList', allData);
        console.log('+++++++ ' + allData.meta['id']);
        io.sockets.in(socket.connectedList).emit('getList', allData)
    });

    socket.on('saveList', function(data) {
        saveList(data.meta['id'], data)
    })

    socket.on('newUser', function(thisListID) {
        console.log('A new User connected');
        socket.connectedList = thisListID
        socket.join(thisListID)

        function countUsers() {
            var currentUsers = 0;
            io.sockets.clients(socket.connectedList).forEach(function() {
                currentUsers++
            });
            console.log('Current Users:' + currentUsers);
            return currentUsers;
        }

        io.sockets.in(socket.connectedList).emit('updateUsers', countUsers());

    });
});
