var todogetherFactory = angular.module('todogetherFactory', []);
var todogetherControllers = angular.module('todogetherControllers', []);

todogetherFactory.factory('getJsonFactory',function($http){
    return{
    getData : function() {
        return $http.get('AS_DMjsb.json');
    }
 }
});

todogetherControllers.controller('listCtrl', function ($scope, getJsonFactory) {
    getJsonFactory.getData().success(function(data){
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

        var testString = 'this should @philipp @do';
        _.each(testString, function(character) {
            if( character === '@') {
                console.log(testString.indexOf(character));
            }
        });

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

    });
});