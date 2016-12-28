// TODO:
//    [ ] show the user their hand
//    [ ] add drop down menus or radio buttons for the user to make a guess
//    [ ] add suggest + accuse buttons
//    [ ] add a place where users can record what they've seen
//        - a list of all the cards
//          for each card, either a dropdown with the list of player names
//          or just an empty text field where you can put anything
//          maybe both
//    [ ] add a scrolling text box that shows a record of all the activity
//    [ ] model the room that the user is in, and moving between rooms
//        players can only suggest about the room they are in
//    [ ] users should be able to choose which card to show when
//        they dispute a suggestion
//    [ ] smarter computer player that
//        - sometimes guesses cards it has
//        - can deduce things from other players' guesses
// ---------------------------------------------------------- //
if (typeof wd == "undefined") {
    var clue = {
        DEFAULT_NPLAYERS: 4,
        DEFAULT_SUSPECTS: [
            "Miss Scarlett",
            "Professor Plum",
            "Mrs. Peacock",
            "Mr. Green",
            "Colonel Mustard",
            "Mrs. White"],
        DEFAULT_WEAPONS: [
            "Candlestick",
            "Knife",
            "Lead Pipe",
            "Revolver",
            "Rope",
            "Wrench"],
        DEFAULT_ROOMS: [
            "Kitchen",
            "Ballroom",
            "Conservatory",
            "Dining Room",
            "Billiard Room",
            "Library",
            "Lounge",
            "Hall",
            "Study"],
    };
}

// ---------------------------------------------------------- //

addEventListener = function(el, type, fn) { 
    if (el.addEventListener) { 
        el.addEventListener(type, fn, false); 
        return true; 
    } else if (el.attachEvent) { 
        var r = el.attachEvent("on" + type, fn); 
        return r; 
    } else { 
        return false; 
    } 
};

clue.main = function() {
    clue.current_game = clue.Game.create();
	var suggest = document.getElementById("suggest");
	addEventListener(suggest, "click", function() {
		clue.play_round(clue.current_game);
	});
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
        suspects = clue.DEFAULT_SUSPECTS;
    }
    if (!weapons) {
        weapons = clue.DEFAULT_WEAPONS;
    }
    if (!rooms) {
        rooms = clue.DEFAULT_ROOMS;
    }
    suspects = suspects.slice();
    weapons = weapons.slice();
    rooms = rooms.slice();

    if (!nplayers) {
        nplayers = clue.DEFAULT_NPLAYERS;
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

clue.get_user_guess = function(name, list, num_tries) {
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

clue.object_equals = function(obj1, obj2) {
    for (var key in obj1) {
        if (!(key in obj2)) {
            return false;
        }
        if (obj1[key] != obj2[key]) {
            return false;
        }
    }
    for (var key in obj2) {
        if (!(key in obj1)) {
            return false;
        }
    }
    return true;
};

clue.Game = {
    create: function(nplayers, suspects, weapons, rooms) {
        var self = Object.create(this);
        if (!suspects) {
            suspects = clue.DEFAULT_SUSPECTS;
        }
        if (!weapons) {
            weapons = clue.DEFAULT_WEAPONS;
        }
        if (!rooms) {
            rooms = clue.DEFAULT_ROOMS;
        }
        if (!nplayers) {
            nplayers = clue.DEFAULT_NPLAYERS;
        }

        self.suspects = suspects;
        self.weapons = weapons;
        self.rooms = rooms;
        self.nplayers = nplayers;
        var answer_hands = clue.deal(nplayers, suspects, weapons, rooms);
        self.answer = answer_hands[0];
        self.hands = answer_hands[1];
        self.set_players();
        return self;
    },
    set_players: function() {
        var self = this;
        var ii = 0;
        self.players = self.hands.map(function(hand) {
            return clue.ComputerPlayer2.create(self, hand, "Player " + (++ii));
        });
        self.players[0] = clue.HtmlPlayer.create(self, self.hands[0], "User");
    },
    hand_string: function(hand) {
        var elts = [["Suspects", this.suspects], ["Weapons", this.weapons], ["Rooms", this.rooms]];
        var output = "";
        for (var ii = 0; ii < elts.length; ii++) {
            output += elts[ii][0] + ": " + hand.filter(
                    function(elt) {
                        return elts[ii][1].includes(elt);
                    }).join(", ") + "\n";
        }
        return output;
    },
    print_all: function() {
        self = this;
        console.log(this.answer);
        this.players.map(function(player) {
            console.log(player.name);
            console.log(self.hand_string(player.hand));
        });
    },
 };

Object.prototype.extend = function (extension) {
    var hasOwnProperty = Object.hasOwnProperty;
    var object = Object.create(this);

    for (var property in extension)
        if (hasOwnProperty.call(extension, property) ||
            typeof object[property] === "undefined")
                object[property] = extension[property];

    return object;
};

clue.Player = {
    create: function(game, hand, name) {
        var self = Object.create(this);
        self.game = game;
        self.hand = hand;
        self.name = name;
        self.record = {};
        return self;
    },
    check_guess: function(guess) {
        var matches = this.hand.filter(
                function (card) {
                    return Object.keys(guess).map(function(k) {return guess[k];}).includes(card);
                });
        if (matches.length > 0) {
            return {
                player: this,
                card: matches[clue.randint(0, matches.length)],
            };
        }
        return;
    },
    get_guess: function() {},
    record_evidence: function(suggester, guess, disputer, card) {
        if (card && this != disputer) {
            this.record[card] = disputer;
        }
    },
}


clue.ComputerPlayer1 = clue.Player.extend({
    get_guess: function() { return {suspect: "Mrs. White", weapon: "Rope", room: "Ballroom"}},
});

clue.ComputerPlayer2 = clue.Player.extend({
    // This player just guesses cards that it hasn't seen yet
    get_guess: function() {
        return {
            suspect : clue.choose(this.filter_seen(this.game.suspects)),
            weapon : clue.choose(this.filter_seen(this.game.weapons)),
            room : clue.choose(this.filter_seen(this.game.rooms)),
        };
    },
    filter_seen: function(arr) {
        var self = this;
        return arr.filter(function(card) {
            if (self.hand.filter(function(hand_card) {return hand_card == card;}).length > 0) {
                return false;
            }
            if (card in self.record) {
                return false;
            }
            return true;
        });
    },
});

clue.ConsolePlayer = clue.Player.extend({
    get_guess: function () {
        console.log(this.game.hand_string(this.hand));
        console.log("Guess -- ");
        var suspect = clue.get_user_guess("Suspect", this.game.suspects);
        if (!suspect) {
            console.log("No guessed suspect, quitting");
            return;
        }
        var weapon = clue.get_user_guess("Weapon", this.game.weapons);
        if (!weapon) {
            console.log("No guessed weapon, quitting");
            return;
        }
        var room = clue.get_user_guess("Room", this.game.rooms);
        if (!room) {
            console.log("No guessed room, quitting");
            return;
        }
        return {suspect: suspect, weapon: weapon, room: room};
    },
    display_output: function(msg) {
        return console.log(msg);
    },
    record_evidence: function(suggester, guess, disputer, card) {
        clue.Player.record_evidence.call(this, suggester, guess, disputer, card);
        this.display_output(suggester.name + " guessed: " + Object.keys(guess).map(function(k) {return guess[k];}));
        if (!disputer) {
            this.display_output("No one could dispute that guess");
        } else if (!card) {
            this.display_output(disputer.name + " disputed the guess");
        } else {
            this.display_output(disputer.name + " has " + card);
        }
    },
});

clue.HtmlPlayer = clue.ConsolePlayer.extend({
    create: function(game, hand, name) {
        var self = clue.Player.create.call(this, game, hand, name);
        clue.html.setup(game);
        clue.html.display_hand(hand, game);
        return self;
    },
    get_guess: function() {
        return {
            suspect: clue.html.get_select_value("suspects"),
            weapon: clue.html.get_select_value("weapons"),
            room: clue.html.get_select_value("rooms"),
        };
    },
    display_output: function(msg) {
        clue.html.log_output(msg + "\n");
    },
});

clue.html = {
    setup: function(game) {
        var suspects  = document.getElementById("suspects");
        for (var ii = 0; ii < game.suspects.length; ii++) {
            suspects.add(new Option(game.suspects[ii]));
        }
        var weapons  = document.getElementById("weapons");
        for (var ii = 0; ii < game.weapons.length; ii++) {
            weapons.add(new Option(game.weapons[ii]));
        }
        var rooms  = document.getElementById("rooms");
        for (var ii = 0; ii < game.rooms.length; ii++) {
            rooms.add(new Option(game.rooms[ii]));
        }
        var hand = document.getElementById("hand");
        hand.style.height = "50";
        hand.style.width = "100%";
        var log = document.getElementById("log");
        log.style.height = "200";
        log.style.width = "100%";
    },
    get_select_value: function(id) {
        var select = document.getElementById(id);
        return select.options[select.selectedIndex].value;
    },
    add_value: function(id, text) {
        var elt = document.getElementById(id);
        elt.innerHTML += text;
    },
    set_value: function(id, text) {
        var elt = document.getElementById(id);
        elt.innerHTML = text;
    },
    display_hand: function(hand, game) {
        this.set_value("hand", game.hand_string(hand)); 
    },
    log_output: function(msg) {
        this.add_value("log", msg);
        var log = document.getElementById("log");
        log.scrollTop = log.scrollHeight;
    },
};

clue.play_round = function(game, start_num) {
    if (!start_num) {
        start_num = 0;
    }
    for (var ii = 0; ii < game.nplayers; ii++) {
        var player_num = (start_num + ii) % game.nplayers;
        var player = game.players[player_num];
        var guess = player.get_guess();
        if (!guess) {
            return;
        }
        var found = false;
        for (var jj = 1; jj < game.nplayers; jj++) {
            var other_player_num = (ii + jj) % game.nplayers;
            var other_player = game.players[other_player_num];
            var evidence = other_player.check_guess(guess);
            if (evidence) {
                found = true;
                player.record_evidence(player, guess, other_player, evidence.card);
                for (var kk = 1; kk < game.nplayers; kk++) {
                    var third_player_num = (player_num + kk) % game.nplayers;
                    var third_player = game.players[third_player_num];
                    if (third_player_num == other_player_num) {
                        third_player.record_evidence(player, guess, other_player, evidence.card);
                    } else {
                        third_player.record_evidence(player, guess, other_player);
                    }
                }
                break;
            }
        }
        if (!found) {
            player.record_evidence(player, guess);
        }
    }
    return true;
};

clue.accuse = function(game, guess) {
    if (clue.object_equal(game.answer, guess)) {
        console.log("You got it!");
    }
    else {
        console.log("No, that's not right");
    }
};

clue.make_game = function(debug, nplayers, suspects, weapons, rooms) {
    var game = clue.Game.create(nplayers, suspects, weapons, rooms);
    if (debug) {
        game.print_all();
    }
    return game;
};

clue.play_game = function(debug, nplayers, suspects, weapons, rooms) {
    var game = clue.Game.create(nplayers, suspects, weapons, rooms);
    if (debug) {
        game.print_all();
    }
    for (var ii = 0; ii < 10; ii++) {
    // while (true) {
        if (!clue.play_round(game, 0)) {
            break;
        }
    }
};

clue.main();

// ---------------------------------------------------------- //
