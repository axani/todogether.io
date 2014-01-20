var todogetherSocket = angular.module('todogetherSocket', []);
var todogetherControllers = angular.module('todogetherControllers', []);



todogetherSocket.factory('socket', [ '$rootScope', function ($rootScope) {
  'use strict';
  var socket = io.connect();

  return {
    emit: function (event, data, callback) {
      socket.emit(event, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
      });
    });
    },
    on: function (event, callback) {
      socket.on(event, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    off: function (event, callback) {
      socket.removeListener(event, callback);
    }
  };
}]);

todogetherControllers.controller('newListCtrl', function (socket, $scope, $http) {

        socket.on('connect', function () {
            
            /* Maintenance */
            socket.emit('getState', { initial: true });

            socket.on('gotState', function (state) {
                $scope.state = state;
            });

            socket.on('printToConsole', function (data) {
                console.log(data);
            });

            $scope.$on('$destroy', function () {
                socket.off('gotState', updateState);
            });
        });



        function generateID() {
            var newID = "";
            var possible = "abcdefghijklmnopqrstuvwxyz0123456789_-";

            for( var i=0; i < 9; i++ ) {
                newID += possible.charAt(Math.floor(Math.random() * possible.length));
            }

            console.log('Generated ID:' + newID);

            return '/' + newID + '1';
        }

        $scope.randomID = generateID();

        // $scope.sendMeToList = function() {
        //     // if ()
        // }

        $(function() {
            $('.sendmetolist').attr('href', $scope.randomID).click(function() {
                socket.emit('createList', $scope.randomID)
                return false
            });
        });
});

todogetherControllers.controller('listCtrl', function (socket, $scope, $http) {
    /* Functions */
    var thisList = {}
    thisList.ID = window.location.pathname;

    console.log(thisList);

    socket.on('connect', function () {
        
        /* Maintenance */
        socket.emit('getState', { initial: true });

        socket.on('gotState', function (state) {
            $scope.state = state;
        });

        $scope.$on('$destroy', function () {
            socket.off('gotState', updateState);
        });
    });

    $http.get('li' + thisList.ID).success(function(data){
        console.log('hi');
        console.log(data);
        $scope.list = data;
        $scope.itemCount = {}
        $scope.filter = ''

        $scope.filterBy = function(user) {
            console.log('hello ' + user);
            $scope.filter = user
        }

        $scope.countItems = function() {
            
            var items = $scope.list.items;
            
            $scope.itemCount['all'] = _.size(items.todo) + _.size(items.done) + _.size(items.deleted);
            _.each(items, function(item, itemState) {
                $scope.itemCount[itemState] =  _.size(items[itemState]);
            });
        }

        $scope.userNames = []
        $scope.findDelegations = function(itemText) {
            var myText = itemText
            var myRegExp = /@\w+/g;
            if(myRegExp.test(myText) == true) {
                var matches = myText.match(myRegExp);
                _.each(matches, function(userMatch) {
                    if($scope.userNames.indexOf(userMatch) == -1) {
                        $scope.userNames.push(userMatch);
                    };
                    myText = myText.replace(userMatch, '<strong>' + userMatch + '</strong>')
                });
                return myText;
            } else {
                return itemText;  
            };
        };


        $scope.countItems()

        $scope.inputText = ''
        $scope.addToList = function() {
            var thisID = $scope.itemCount['all'] + 1 + ''
            var item = {"id": thisID, "text": $scope.inputText};
            $scope.list.items.todo.unshift(item)
            $scope.inputText = '';

            console.log($scope.list);
        }

        $('.list-name').keypress(function() {
            $scope.list.meta.customName = $(this).text()
        })

        /* List Behaviour */

        $scope.moveItem = function(item, from, to) {
            var fromThisList = $scope.list.items[from]
            var toThisList = $scope.list.items[to]
            var indexOfItem = fromThisList.indexOf(item);
            fromThisList.splice([indexOfItem], 1)
            toThisList.unshift(item)
        }

        $scope.deleteItem = function(subListName, item) {
            var subList = $scope.list.items[subListName]
            var indexOfItem = subList.indexOf(item);
            subList.splice([indexOfItem], 1)

            if (subListName != 'deleted') {
                $scope.list.items.deleted.unshift(item)
            } else {
                // Reanimate item
                $scope.list.items.todo.unshift(item)
            }
        }


        // ! -- Diese Funktionalität muss ich noch mal genauer nachbearbeiten, 
        // sobald ich wieder mit sockets arbeite
        $('.sub-lists')
            .on('click', '.list-item', function() {
                var itemContentBackup = $(this).html();
                $(this).addClass('active');
                $(this).keydown( function(e) {
                    // saveList();
                    if (e.which == 13) {
                        // updateEntireList();
                        $(this).blur();

                    }
                });

                $(this).keyup( function(e) {
                    if (e.which == 27) {
                        // updateEntireList();
                        $(this).html(itemContentBackup);
                        $(this).blur();
                    }
                });
                
            })
            .on('blur', '.list-item', function() {
                $(this).removeClass('active');
                var itemID = $(this).attr('itemID');
                var newText = $(this).text();
                _.each($scope.list.items.todo, function(thisItem) {
                    if(thisItem['id'] === itemID) {
                        thisItem['text'] = newText;
                    }
                });
                console.log($scope.list);
            })
            .on('keyup', '.list-item', function() {
                //function updateItem(thisElement) {
                //    var itemContent = thisElement.html();
                //    var itemID = thisElement.attr('itemID');
                //    socket.emit('updateItem', itemID, itemContent)
                //}
                //updateItem($(this));

            });
    })


});