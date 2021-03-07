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
			var insertIndex;
			for(var i = 0; i < pointCards.length; i++) {
				if(pointCards[i].relation == cardSelected.relation) {
					onTable = true;
					insertIndex = i;
					break;
				}
			}	
			if(onTable) {
				arr = [c, cardSelected];
				//for each card selected in the handCanvas, place it
				for(var i = 0; i < arr.length; i++) {
					selectedOrder = arr[i].order;
					selectedRel = arr[i].relation;
					if(selectedOrder < pointCards[insertIndex].order) {
						while(selectedOrder < pointCards[insertIndex].order) {
							insertIndex--;
							if(pointCards[insertIndex] == undefined) {
								insertIndex++;
								break;
							} else if(selectedOrder > pointCards[insertIndex].order) {
								insertIndex++;
								break;
							} else if (pointCards[insertIndex].relation != selectedRel) {
								insertIndex++;
								break;
							}
						}
					} else if(selectedOrder > pointCards[insertIndex].order) {
						while(selectedOrder > pointCards[insertIndex].order) {
							insertIndex++;
							if(pointCards[insertIndex] == undefined) {
								break;
							} else if(selectedOrder < pointCards[insertIndex].order) {
								break;
							} else if (pointCards[insertIndex].relation != selectedRel) {
								break;
							}
						}
					}
					pointCards.splice(insertIndex, 0, arr[i]);
				}
			} else if(!onTable & c.order < cardSelected.order) {
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
					idsAndScore[i][3] = pointCards.slice(0);
					break;
				}
			}
			socket.emit('updateScore', idsAndScore, roomToJoin);
			
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

document.getElementById("tableCanvas").addEventListener("click", function(e) {
	xyPair = getMousePos(document.getElementById("tableCanvas"), e);
	if(!lookingAtOppCards) {
		c = getTableClickedCard.apply(null, xyPair);
		if(c != undefined & canChooseCard  & cardSelected != null) {
			if(c.relation == cardSelected.relation) {
				for(var i = 0; i < cardArray.length; i++) {
					if(cardArray[i] == cardSelected) {
						cardArray[i].colour = handCardColour;
						break;
					}
				}
				
				insertIndex = 0;
				for(var i = 0; i < pointCards.length; i++) {
					if(pointCards[i] == c) {
						insertIndex = i;
						break;
					}
				}
				
				selectedOrder = cardSelected.order;
				selectedRel = cardSelected.relation;
				if(selectedOrder < pointCards[insertIndex].order) {
					while(selectedOrder < pointCards[insertIndex].order) {
						insertIndex--;
						if(pointCards[insertIndex] == undefined) {
							insertIndex++;
							break;
						} else if(selectedOrder > pointCards[insertIndex].order) {
							insertIndex++;
							break;
						} else if (pointCards[insertIndex].relation != selectedRel) {
							insertIndex++;
							break;
						}
					}
				} else if(selectedOrder > pointCards[insertIndex].order) {
					while(selectedOrder > pointCards[insertIndex].order) {
						insertIndex++;
						if(pointCards[insertIndex] == undefined) {
							break;
						} else if(selectedOrder < pointCards[insertIndex].order) {
							break;
						} else if (pointCards[insertIndex].relation != selectedRel) {
							break;
						}
					}
				}
				
				pointCards.splice(insertIndex, 0, cardSelected);
				cardArray.splice(cardArray.indexOf(cardSelected), 1);
				cardSelected = null;
				document.getElementById("discardSelected").style.display = "none";
				
				for(var i = 0; i < idsAndScore.length; i++) {
					if(idsAndScore[i][2] == socketId) {
						idsAndScore[i][1] = pointCards.length;
						idsAndScore[i][3] = pointCards.slice(0);
						break;
					}
				}
				socket.emit('updateScore', idsAndScore, roomToJoin);
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
			if(name != null & name[0] != playerName) {
				drawOppCards(idsAndScore, name);
			}
		}
		//if you were looking at an opponent's cards, check if clicked on another opponent's cards
	} else {
		var opp = getTableClickedName.apply(null, xyPair);
		console.log(opp);
		//if the name is valid and not yours, draw the opponent cards
		if(opp != undefined) {
			if(opp[0] != playerName) {
				drawOppCards(idsAndScore, opp);
			}
		} else { //if name is not valid (clicked on something that wasn't a name or was your name),
				//show your cards again
			updateTable(idsAndScore);
			lookingAtOppCards = false;
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