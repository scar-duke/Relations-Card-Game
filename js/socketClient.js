var socket = io();
var roomToJoin = "";

//gives the socket reference to its own server id
socket.on('idSent', function(id) {
	socketId = id;
});

//============================================ Functions for errors joining a room
//if max players in a room has been reached, throw an error
//********this is a function that shouldn't ever be called due to the way
//the join table works, but it exists just in case I do something dumb with the table
socket.on('maxPlayersReached', function() {
	document.getElementById("sorryText").style.display = "block";
});

//if game has already started in room, show error. Otherwise, show waiting for others
socket.on('gameInProgress', function(isInProgress) {
	if(isInProgress) {
		document.getElementById("sorryProgressText").style.display = "block";
	} else {
		document.getElementById("nameInUseText").style.display = "none";
		document.getElementById("waitText").style.display = "block";
		document.getElementById("nameLabel").style.display = "none";
		document.getElementById("name").style.display = "none";
		document.getElementById("readyButton").style.display = "none";
		document.getElementById("chooseRoom").style.display = "none";
		document.getElementById("roomsTable").style.display = "none";
		socket.emit('requestedCard', numOfCardsInHand, roomToJoin);
	}
});



//==================================================== Functions for start menu use
//print the table of rooms available and not available for joining
socket.on('availableRooms', function(usersInRooms, maxPlayers) {
	var table = document.getElementById("roomsTable");
	var placeInArray = 0;
	var roomNum = 1;
	
	for(var i = 0; i < usersInRooms.length/2; i++) {
		var x = document.createElement("TR");
		x.setAttribute("id", "row"+i);
		table.appendChild(x);
		
		for(var j = 0; j < 2; j++) {
			if(usersInRooms[placeInArray] != undefined) {
				var y = document.createElement("TD");
				y.setAttribute("id", placeInArray);
				var z = document.createTextNode("Room " + roomNum + ": " +
											usersInRooms[placeInArray].length + "/" + maxPlayers);
				y.appendChild(z);
				document.getElementById("row"+i).appendChild(y);
				roomNum++;
				placeInArray++;
			}
		}
	}
	
	//put a click listener on every cell of the table
	var row = document.getElementById('roomsTable').rows;
	for(var i = 0; i < row.length; i++) {
        for(var j = 0; j < row[i].cells.length; j++ ) {
            row[i].cells[j].addEventListener('click', function(){
				for(var i = 0; i < row.length; i++) {
					for(var j = 0; j < row[i].cells.length; j++) {
						row[i].cells[j].style.backgroundColor = "white";
						row[i].cells[j].style.color = "black";
					}
				}
				if(usersInRooms[parseInt(this.id)].length < maxPlayers) {
					document.getElementById("readyButton").style.display = "block";
					this.style.backgroundColor = roomTableSelectColour;
					this.style.color = "white";
					roomToJoin = parseInt(this.id);
				}
            });
        }
    }
});
//update table cells to show when people join rooms
socket.on('updateAvailableRooms', function(usersInRooms, roomNum, maxPlayers) {
	var room = roomNum + 1;
	document.getElementById(roomNum).innerText = "Room " + room + ": " +
										usersInRooms[roomNum].length + "/" + maxPlayers;
});

//after the check for if a name is unique, signal the player is ready or throw an error
socket.on('nameNotUnique', function() {
	document.getElementById("nameInUseText").style.display = "block";
	document.getElementById("nameLabel").style.display = "inline";
	document.getElementById("name").style.display = "inline";
});

//reveal or hide the "Go" button for rooms with >= min number of players
socket.on('revealGoButton', function() {
	document.getElementById("goButton").style.display = "block";
});
socket.on('hideGoButton', function() {
	document.getElementById("goButton").style.display = "none";
});

//==================================================== Functions for game start
//when all players have designated they are ready, make the UI game-ready
socket.on('allPlayersReady', function() {
	document.getElementById("waitText").style.display = "none";
	document.getElementById("goButton").style.display = "none";
	document.getElementById("handHeader").style.display = "block";
	document.getElementById("handCanvas").style.visibility = "visible";
	document.getElementById("handHeader").innerHTML = playerName + "'s Hand";
	updateTable(idsAndScore);
});

socket.on('updateTableUsers', function(idsAndScores) {
	var room = parseInt(roomToJoin) + 1;
	document.getElementById("roomTitle").style.display = "block";
	document.getElementById("roomTitle").innerHTML = "Room " + room;
	
	idsAndScore = idsAndScores;
	updateTableUsers(idsAndScores);
});

//==================================================== Functions for game end
//if too many players disconnect from an in-progress game, give an error to refresh
socket.on('callForRestart', function() {
	document.getElementById("sorryGameInterruptText").style.display = "block";
	document.getElementById("handHeader").style.display = "none";
	document.getElementById("handCanvas").style.visibility = "hidden";
});

//when a player is done with a game, reset their view to the first screen
socket.on('returnToMenu', function() {
	//clear the canvases
	var ctx = tableCanvas.context;
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx = handCanvas.context;
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	
	//clear local variables and hide stuff
	cardArray = [];
	pointCards = [];
	idsAndScore = [];
	isTurn = false
	canChooseCard = false;
	round = 1;
	roomToJoin = "";
	document.getElementById("roomTitle").style.display = "none";
	document.getElementById("quitButton").style.display = "none";
	
	//show the rooms table
	document.getElementById("chooseRoom").style.display = "block";
	document.getElementById("roomsTable").style.display = "block";
});

// used to call forced-winner scenarios (i.e. if we run out of question cards)
socket.on('chooseWinner', function(idsAndScore) {
	var winner = idsAndScore[0][2]
	var winningScore = idsAndScore[0][1];
	for(var i = 1; i < idsAndScore.length; i++) {
		if(idsAndScore[i][1] > winningScore) {
			winner = idsAndScore[i][2];
			winningScore = idsAndScore[i][1];
		}
	}
	// only call the winning code once from the server
	if(socketId == winner) {
		socket.emit('playerHasWon', winner, roomToJoin);
	}
});


// used to forcefully end the game for a non-player reason (e.g. not enough cards to go around to begin)
socket.on('forceEnd', function() {
	document.getElementById("goButton").style.display = "none";
	document.getElementById("waitText").style.display = "none";
	document.getElementById("forceEndText").style.display = "block";
});


// Misc. / stuff that'll need changed between CAH and other rules

//used to update table users on ui from anywhere (only used for relations right now)
socket.on('refreshUsers', function(idsAScore) {
	idsAndScore = idsAScore
	updateTable(idsAndScore);
});

socket.on('endGame', function(idsAndScore, winner) {
	// disable everything else and display the winner, effectively ending the game
	isTurn = false;
	canChooseCard = false;
	
	document.getElementById("handHeader").style.display = "none";
	document.getElementById("handCanvas").style.visibility = "hidden";
	document.getElementById("turn").style.display = "none";
	document.getElementById("quitButton").style.display = "block";
	drawWinner(idsAndScore, winner);
});

// Takes content recieved from the server and adds it to the card hand array
socket.on('requestedCard', function(contentArray) {
	for(var i = 0; i < contentArray.length; i++) {
		curCard = contentArray[i];
		cardArray.push(new Card(curCard[0], curCard[1], curCard[2]));
	}
	drawOnCanvas(cardArray, handCanvas);
});
socket.on('sentCardSuccess', function() {
	socket.emit('requestedCard', roomToJoin);
});

socket.on('yourTurn', function() {
	console.log("Your Turn");
	isTurn = true;
	canChooseCard = true;
	document.getElementById("turn").style.display = "inline";
	document.getElementById("handHeader").style.display = "block";
	document.getElementById("handCanvas").style.visibility = "visible";
});

socket.on('checkWinner', function(idsAndScore) {
	checkForWinner(idsAndScore);
});

function checkForWinner(idsAndScore) {
	var isWinner = false;
	var tieArr = [];
	if(winByRounds) { // if game is set to win after x rounds
		if(round/idsAndScore.length == numOfRounds) {
			// see who has the highest score
			var winner = idsAndScore[0][2];
			var winningScore = idsAndScore[0][1];
			for(var i = 1; i < idsAndScore.length; i++) {
				if(winner == null | winningScore < idsAndScore[i][1]) {
					winner = idsAndScore[i][2];
					winningScore = idsAndScore[i][1];
					tieArr = [];
				} else if(winningScore == idsAndScore[i][1]) {
					tieArr.push(idsAndScore[i][2]);
				}
			}
			isWinner = true;
			// only call the winning code once from the server
			if(socketId == winner) {
				if(tieArr != null) {
					tieArr.push(winner);
					socket.emit('playerHasWon', tieArr, roomToJoin);
				} else {
					socket.emit('playerHasWon', winner, roomToJoin);
				}
			}
		}
		round++;
	} else { // else, game is set to check scores for a possible winner
		var winner = null;
		var winningScore = null;
		for(var i = 0; i < idsAndScore.length; i++) {
			if(idsAndScore[i][1] >= scoreToWin) {
				if(winner == null | winningScore < idsAndScore[i][1]) {
					winner = idsAndScore[i][2];
					winningScore = idsAndScore[i][1];
					tieArr = [];
				} else if(winningScore == idsAndScore[i][1]) {
					tieArr.push(idsAndScore[i][2]);
				}
			}
		}
		if(winner != null) {
			isWinner = true;
			if(socketId == winner) {
				if(tieArr != []) {
					tieArr.push(winner);
					socket.emit('playerHasWon', tieArr, roomToJoin);
				} else {
					socket.emit('playerHasWon', winner, roomToJoin);
				}
			}
		}
	}
}