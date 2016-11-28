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

clue.get_guess = function(name, list, num_tries) {
    var prompt_string = "Enter " + name + ":";
    var full_prompt = prompt_string;
    if (!num_tries) {
	num_tries = 3;
    }
    for (var ii = 0; ii < num_tries; ii++) {
	var val = prompt(full_prompt);
	if (list.includes(val)) {
	    return val;
	}
	if (!val) {
	    console.log("No " + name + " entered, quitting");
	    return;
	}
	full_prompt = "Invalid " + name + " '" + val +
	    "'.  Must be one of " + list + ".  " + prompt_string;
    }
    console.log(num_tries + " failed attempts to enter a " + name + ", quitting");
    return;
};

clue.check_guess = function(guess, answer, hands, player_num) {
    if (guess[0] == answer[0] && guess[1] == answer[1] && guess[2] == answer[2]) {
	return "";
    }
    for (var ii = 1; ii < hands.length; ii++) {
	var hand_num = (ii+player_num) % hands.length;
	var matches = hands[hand_num].filter(
	    function (card) {
		return guess.includes(card);
	    });
	if (matches.length > 0) {
	    return "Player " + hand_num + " has card " +
		matches[clue.randint(0, matches.length)];
	}
    }
    return "No one can prove that guess wrong";
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

    var answer_hands = clue.deal(nplayers, suspects, weapons, rooms);
    var answer = answer_hands[0];
    var hands = answer_hands[1];
    while (true) {
	console.log(clue.hand_string(hands[0], suspects, weapons, rooms));
	console.log("Guess -- ");
	var suspect = clue.get_guess("Suspect", suspects);
	if (!suspect) {
	    console.log("No guessed suspect, quitting");
	    break;
	}
	var weapon = clue.get_guess("Weapon", weapons);
	if (!weapon) {
	    console.log("No guessed weapon, quitting");
	    break;
	}
	var room = clue.get_guess("Room", rooms);
	if (!room) {
	    console.log("No guessed room, quitting");
	    break;
	}
	var reply = clue.check_guess([suspect, weapon, room], answer, hands, 0);
	if (reply) {
	    console.log(reply);
	} else {
	    console.log("You got it!");
	    break;
	}
    }
};


// ---------------------------------------------------------- //
