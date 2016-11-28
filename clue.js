// ---------------------------------------------------------- //
if (typeof wd == "undefined") {
  var clue = {
      "SUSPECTS": [
	  "Miss Scarlett",
	  "Professor Plum",
	  "Mrs. Peacock",
	  "Mr. Green",
	  "Colonel Mustard",
	  "Mrs. White"],
      "WEAPONS": [
	  "Candlestick",
	  "Knife",
	  "Lead Pipe",
	  "Revolver",
	  "Rope",
	  "Wrench"],
      "ROOMS": [
	  "Kitchen",
	  "Ballroom",
	  "Conservatory",
	  "Dining Room",
	  "Billiard Room",
	  "Library",
	  "Lounge",
	  "Hall",
	  "Study"]
  };
}

// ---------------------------------------------------------- //

clue.main = function() {
    
};

// ---------------------------------------------------------- //

// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
clue.randint = function(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
};


// Modifies the given array
clue.shuffle = function(array) {
    for (var ii = 0; ii < array.length; ii++) {
	var switchwith = clue.randint(0, array.length);
	var temp = array[ii];
	array[ii] = array[switchwith];
	array[switchwith] = temp;
    }
    return array;
};

// Modifies the given array
clue.choose = function(array) {
    var choice_idx = clue.randint(0, array.length);
    var choice = array.splice(choice_idx, 1);
    return choice[0];
};

// Does not modify the given arrays
clue.deal = function(nplayers, suspects, weapons, rooms) {
    if (!suspects) {
	suspects = clue.SUSPECTS;
    }
    if (!weapons) {
	weapons = clue.WEAPONS;
    }
    if (!rooms) {
	rooms = clue.ROOMS;
    }
    suspects = suspects.slice();
    weapons = weapons.slice();
    rooms = rooms.slice();

    if (!nplayers) {
	nplayers = 4;
    }
    var suspect = clue.choose(suspects);
    var weapon = clue.choose(weapons);
    var room = clue.choose(rooms);
    var answer = [suspect, weapon, room];
    var deck = clue.shuffle(suspects.concat(weapons).concat(rooms));
    var hands = [];
    for (var ii = 0; ii < nplayers; ii++) {
	hands[ii] = [];
    }
    for (var ii = 0; ii < deck.length; ii++) {
	hands[ii % nplayers].push(deck[ii]);
    }
    return [answer, hands];
};

clue.get_guess = function(name, list) {
    

};

clue.check_guess = function(suspect, weapon, room, answer, hands) {
    

};

clue.hand_string = function(hand, suspects, weapons, rooms) {
    if (!suspects) {
	suspects = clue.SUSPECTS;
    }
    if (!weapons) {
	weapons = clue.WEAPONS;
    }
    if (!rooms) {
	rooms = clue.ROOMS;
    }
    var elts = [["Suspects", suspects], ["Weapons", weapons], ["Rooms", rooms]];
    var output = "";
    console.log(elts);
    console.log(elts.length);
    for (var ii = 0; ii < elts.length; ii++) {
	output += elts[ii][0] + ": " + hand.filter(
	    function(elt) {
		return elts[ii][1].includes(elt);
	    }).join(", ") + "\n";
    }
    return output;
};

clue.play_game = function(nplayers, suspects, weapons, rooms) {
    if (!suspects) {
	suspects = clue.SUSPECTS;
    }
    if (!weapons) {
	weapons = clue.WEAPONS;
    }
    if (!rooms) {
	rooms = clue.ROOMS;
    }
    if (!nplayers) {
	nplayers = 4;
    }
};


// ---------------------------------------------------------- //
