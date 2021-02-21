document.getElementById("readyButton").addEventListener("click", function() {
	if(document.getElementById("name").value != "") {
		playerName = document.getElementById("name").value;
		socket.emit('playerReady', playerName, roomToJoin);
	}
});

document.getElementById("goButton").addEventListener("click", function() {
	socket.emit('startGame', roomToJoin);
});

document.getElementById("quitButton").addEventListener("click", function() {
	socket.emit('quitTheRoom', roomToJoin);
	document.getElementById("quitButton").style.display = "none";
});

document.getElementById("getCard").addEventListener("click", function(){
	if(canChooseCard) {
		socket.emit('requestedCard', 1, roomToJoin);
	}
});


document.getElementById("handCanvas").addEventListener("click", function(e) {
	xyPair = getMousePos(document.getElementById("handCanvas"), e);
	c = getClickedCard.apply(null, xyPair);
	if(c != undefined & canChooseCard & c != cardSelected) {
		document.getElementById("discardSelected").style.display = "inline";
		//if there is no card currently selected, select this one
		if(cardSelected == null) {
			cardSelected = c;
		//if a card is selected, compare the relationship. If related, add to table
		} else if(c.relation == cardSelected.relation) {
			for(var i = 0; i < cardArray.length; i++) {
				if(cardArray[i] == cardSelected) {
					cardArray[i].colour = handCardColour;
					break;
				}
			}
			// first check if the pair is connected to other cards on the table
			var onTable = false;
			for(var i = 0; i < pointCards.length; i++) {
				if(pointCards[i].relation == cardSelected.relation &
				(pointCards[i].order+1 == cardSelected.order | pointCards[i].order+1 == c.order)) {
					onTable = true;
					
					//reorder here; keep in mind that related cards may be next to each other or may be at opposite ends
					
					
					if(c.order < cardSelected.order) {
						pointCards.splice(i, 0, c);
						pointCards.splice(i+1, 0, cardSelected);
					} else {
						pointCards.splice(i, 0, cardSelected);
						pointCards.splice(i+1, 0, c);
					}
					break;
				}
			}	
			if(!onTable & c.order < cardSelected.order) {
				pointCards.push(c);
				pointCards.push(cardSelected);
			} else if (!onTable) {
				pointCards.push(cardSelected);
				pointCards.push(c);
			}
			cardArray.splice(cardArray.indexOf(c), 1);
			cardArray.splice(cardArray.indexOf(cardSelected), 1);
			cardSelected = null;
			document.getElementById("discardSelected").style.display = "none";
			
			for(var i = 0; i < idsAndScore.length; i++) {
				if(idsAndScore[i][2] == socketId) {
					idsAndScore[i][1] = pointCards.length;
					break;
				}
			}
			socket.emit('updateScore', idsAndScore, roomToJoin);
			checkForWinner(idsAndScore)
			
			drawOnCanvas(cardArray, handCanvas);
			updateTable(idsAndScore);
		//if card clicked is not associated with selected card, deselect the first card
		//and select the new card
		} else {
			for(var i = 0; i < cardArray.length; i++) {
				if(cardArray[i] == cardSelected) {
					cardArray[i].colour = handCardColour;
					drawOnCanvas(cardArray, handCanvas);
					break;
				}
			}
			cardSelected = null;
			cardSelected = c;
		}
		
		//change the colour of the selected card to show that it is selected
		if(cardSelected != null) {
			for(var i = 0; i < cardArray.length; i++) {
				if(cardArray[i] == cardSelected) {
					cardArray[i].colour = cardSelectColour;
					drawOnCanvas(cardArray, handCanvas);
					break;
				}
			}
		}
	} else { //if clicked on something that isn't a card, deselect the card
		for(var i = 0; i < cardArray.length; i++) {
				if(cardArray[i] == cardSelected) {
					cardArray[i].colour = handCardColour;
					drawOnCanvas(cardArray, handCanvas);
					break;
				}
			}
			document.getElementById("discardSelected").style.display = "none";
			cardSelected = null;
	}
});

// cards do not order correctly when clicking on table second and when clicking two paired cards already on the table

document.getElementById("tableCanvas").addEventListener("click", function(e) {
	xyPair = getMousePos(document.getElementById("tableCanvas"), e);
	c = getTableClickedCard.apply(null, xyPair);
	if(c != undefined & canChooseCard  & cardSelected != null) {
		if(c.relation == cardSelected.relation) {
			for(var i = 0; i < cardArray.length; i++) {
				if(cardArray[i] == cardSelected) {
					cardArray[i].colour = handCardColour;
					break;
				}
			}
			
			var cardPlacement = c.order;
			var addToI = 0;
			if(c.order < cardSelected.order) {
				while(cardPlacement != cardSelected.order) {
					cardPlacement++;
					addToI++;
					if(pointCards[pointCards.indexOf(c)+addToI].relation != cardSelected.relation) {
						break;
					}
				}
				pointCards.splice(pointCards.indexOf(c)+addToI, 0, cardSelected);
			} else {
				while(cardPlacement != cardSelected.order+1) {
					cardPlacement--;
					addToI++;
					if(pointCards[pointCards.indexOf(c)-addToI].relation != cardSelected.relation) {
						break;
					}
				}
				pointCards.splice(pointCards.indexOf(c)-addToI, 0, cardSelected);
			}
			
			cardArray.splice(cardArray.indexOf(cardSelected), 1);
			cardSelected = null;
			document.getElementById("discardSelected").style.display = "none";
			drawOnCanvas(cardArray, handCanvas);
			updateTable(idsAndScore);
		} else {
			for(var i = 0; i < cardArray.length; i++) {
				if(cardArray[i] == cardSelected) {
					cardArray[i].colour = handCardColour;
					drawOnCanvas(cardArray, handCanvas);
					break;
				}
			}
			cardSelected = null;
			document.getElementById("discardSelected").style.display = "none";
			drawOnCanvas(cardArray, handCanvas);
			window.alert("Card not associated with this group");
		}
	} else if (isTurn) { // if not clicking on a card, and is still client's turn, 
				//check if the user clicked on a name instead
		var name = getTableClickedName.apply(null, xyPair);
		//if the name is valid, ask the server for their pointCards (sends id to server)
		if(name != null) {
			console.log(name);
			socket.emit('requestPointCards', name[2]);
		}
	}
});
	

document.title = profName + "'s Game of Relations";
document.getElementById("titleHeader").innerHTML = profName + "'s Game of Relations";

document.getElementById("turn").addEventListener("click", function() {
	socket.emit('passTurn', roomToJoin, null);
	document.getElementById("turn").style.display = "none";
	document.getElementById("discardSelected").style.display = "none";
	cardSelected = null;
	isTurn = false;
	canChooseCard = false;
});

document.getElementById("discardSelected").addEventListener("click", function() {
	socket.emit("passTurn", roomToJoin, cardSelected);
	for(var i = 0; i < cardArray.length; i++) {
		if(cardArray[i] == cardSelected) {
			cardArray.splice(i, 1);
			drawOnCanvas(cardArray, handCanvas);
			break;
		}
	}
	document.getElementById("discardSelected").style.display = "none";
	document.getElementById("turn").style.display = "none";
	cardSelected = null;
	isTurn = false;
	canChooseCard = false;
});