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
        var ii = 0;
        self.players = self.hands.map(function(hand) {
            return clue.Player.create(self, hand, ii, "Player " + (++ii));
        });
        self.players[0] = clue.UserPlayer.create(self, self.hands[0], 0, "User");
        // XXX
        self.print_all();
        return self;
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
    create: function(game, hand, num, name) {
        var self = Object.create(this);
        self.game = game;
        self.hand = hand;
        self.name = name;
        self.num = num;
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
    get_guess: function() { return {suspect: "Mrs. White", weapon: "Rope", room: "Ballroom"}},
    record_evidence: function(suggester, disputer, card) {
        if (card) {
            this.record[card] = disputer;
        }
    },
    suggest: function() {
        var guess = this.get_guess();
        if (!guess) {
            return;
        }
        var found = false;
        for (var ii = 1; ii < this.game.hands.length; ii++) {
            var other_player_num = (this.num + ii) % this.game.nplayers;
            var other_player = this.game.players[other_player_num];
            var evidence = other_player.check_guess(guess);
            if (evidence) {
                this.record_evidence(this, other_player, evidence.card);
                for (var jj = 1; jj < this.game.hands.length; jj++) {
                    var third_player_num = (this.num + jj) % this.game.nplayers;
                    if (third_player_num == other_player_num) {
                        continue;
                    }
                    var third_player = this.game.players[third_player_num];
                    third_player.record_evidence(this, other_player);
                }
                return evidence;
            }
        }
        return;
    },
}

clue.UserPlayer = clue.Player.extend({
    get_guess: function () {
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
        return {'suspect': suspect, 'weapon': weapon, 'room': room};
    },
});

clue.play_round = function(game, player_num) {
    for (var ii = 0; ii < game.hands.length; ii++) {
        var player = game.players[(player_num + ii) % game.nplayers];
        var evidence = player.suggest();
        if (evidence) {
            console.log(evidence.player.name + " has " + evidence.card);
        } else {
            console.log("No one can dispute that guess");
            return false;
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

clue.play_game = function(nplayers, suspects, weapons, rooms) {
    var game = clue.Game.create(nplayers, suspects, weapons, rooms);
    for (var ii = 0; ii < 10; ii++) {
    // while (true) {
        console.log(game.hand_string(game.players[0].hand));
        console.log("Guess -- ");
        if (!clue.play_round(game, 0)) {
            break;
        }
    }
};


// ---------------------------------------------------------- //
