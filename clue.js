// TODO:
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
        DEFAULT_PLAYERS: ["User", "Player 1", "Player 2", "Player 3"],
        DEFAULT_CATEGORIES: ["suspect", "weapon", "room"],
        DEFAULT_CARDS: {
            "suspect" : [
                "Miss Scarlett",
                "Professor Plum",
                "Mrs. Peacock",
                "Mr. Green",
                "Colonel Mustard",
                "Mrs. White",
            ],
            "weapon": [
                "Candlestick",
                "Knife",
                "Lead Pipe",
                "Revolver",
                "Rope",
                "Wrench",
            ],
            "room": [
                "Kitchen",
                "Ballroom",
                "Conservatory",
                "Dining Room",
                "Billiard Room",
                "Library",
                "Lounge",
                "Hall",
                "Study",
            ],
        },
    };
}

// ---------------------------------------------------------- //

clue.addEventListener = function(el, type, fn) { 
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

clue.set_toggle_display = function(button_id, div_id) {
    var button = document.getElementById(button_id);
	clue.addEventListener(button, "click", function() {
        var div_elt = document.getElementById(div_id);
        var display = div_elt.style.display;
        if (display == "none") {
            div_elt.style.display = "inline";
        } else {
            div_elt.style.display = "none";
        }
	});
};

clue.set_tristate_checkbox = function(checkbox) {
    clue.addEventListener(checkbox, "click", function() {
        // console.log(checkbox.indeterminate + " " + checkbox.checked);
        if (checkbox.style.class == "indeterminate" || checkbox.indeterminate) {
            // console.log("here1");
            checkbox.style.class = "";
            checkbox.indeterminate = false;
            checkbox.checked = false;
        } else if (checkbox.checked) {
            // console.log("here2");
        } else {
            // console.log("here3");
            checkbox.indeterminate = true;
            checkbox.style.class = "indeterminate";
        }
        // console.log(checkbox.indeterminate + " " + checkbox.checked);
        return checkbox;
    });
    return checkbox;
};

clue.main = function() {
    clue.current_game = clue.Game.create();
	var suggest = document.getElementById("suggest");
	clue.addEventListener(suggest, "click", function() {
		clue.play_round(clue.current_game);
	});
	var accuse = document.getElementById("accuse");
	clue.addEventListener(accuse, "click", function() {
		clue.allow_accusation(clue.current_game.players[0], clue.current_game.players[0].get_guess());
	});
    var new_game = document.getElementById("new_game");
	clue.addEventListener(new_game, "click", function() {
        clue.current_game = clue.Game.create();
	});
    clue.set_toggle_display("show_notes", "notes");
    clue.set_toggle_display("show_auto_notes", "auto_notes");
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

// If should_remove is true, this modifies the given array
clue.choose = function(array, should_remove) {
    var choice_idx = clue.randint(0, array.length);
    var choice = array[choice_idx];
    if (should_remove) {
        array.splice(choice_idx, 1);
    }
    return choice;
};

clue.hash_values = function(hash) {
    return Object.keys(hash).map(function(k) { return hash[k]; });
};

clue.expect_one = function(matches, errmsg) {
    if (matches.length > 0) {
        if (matches.length > 1) {
            console.log(errmsg + ": " + matches);
        }
        return matches[0];
    } else {
        return null;
    }
};

// Does not modify the given arrays
clue.deal = function(game) {
    var all_cards = [];
    var answer = {};
    Object.keys(game.cards).forEach(function(category) {
        var cat_cards = game.cards[category].slice();
        answer[category] = clue.choose(cat_cards, true);
        all_cards = all_cards.concat(cat_cards);
    });
    var deck = clue.shuffle(all_cards);
    var hands = [];
    for (var ii = 0; ii < game.nplayers; ii++) {
        hands[ii] = [];
    }
    for (var ii = 0; ii < deck.length; ii++) {
        hands[ii % game.nplayers].push(deck[ii]);
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

clue.getarg = function(args, argname, def) {
    if (args && argname in args) {
        return args[argname];
    } else {
        return def;
    }
};

clue.Game = {
    create: function(args) {
        var self = Object.create(this);
        self.player_names = clue.getarg(args, "players", clue.DEFAULT_PLAYERS);
        self.nplayers = self.player_names.length;
        self.categories = clue.getarg(args, "categories", clue.DEFAULT_CATEGORIES);
        self.cards = {};
        self.categories.forEach(function(category) {
            var def = [];
            if (category in clue.DEFAULT_CARDS) {
                def = clue.DEFAULT_CARDS[category];
            }
            self.cards[category] = clue.getarg(args, category, def);
        });
        var answer_hands = clue.deal(self);
        self.answer = answer_hands[0];
        self.hands = answer_hands[1];
        self.set_players();
        self.round = 0;
        return self;
    },
    set_players: function() {
        var self = this;
        self.players = [];
        for (var ii = 0; ii < self.hands.length; ii++) {
            var constructor = clue.ComputerPlayer2;
            if (ii == 0) {
                constructor = clue.HtmlPlayer;
            } else if (clue.randint(1, 2) == 1) {
                constructor = clue.ComputerPlayer3;
            }
            self.players[ii] = constructor.create(self, ii, self.hands[ii], self.player_names[ii]);
        }
    },
    hand_string: function(hand) {
        var self = this;
        return self.categories.map(function(category) {
            return category + ": " + hand.filter(
                function(card) {
                    return self.cards[category].includes(card);
                }).join(", ");
        }).join("\n") + "\n";
    },
    print_all: function() {
        var self = this;
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

clue.Record = {
    ANSWER_PLAYER: -1,
    create: function(player) {
        var self = Object.create(this);
        self.data = {};
        self.all_guesses = [];
        self.player = player;
        self.game = player.game;
        self.player_nums = [self.ANSWER_PLAYER];
        for (var ii = 0; ii < self.game.nplayers; ii++) {
            self.player_nums.push(ii);
        }
        self.game.categories.forEach(function(category) {
            self.game.cards[category].forEach(function(card) {
                self.data[card] = {}; 
                // initialize all card for all players to "unknown"
                self.player_nums.forEach(function(this_player) {
                    self.data[card][this_player] = null;
                });
                // then set all cards for our player to false
                self.data[card][self.player.num] = false;
            });
        });
        self.player.hand.forEach(function(card) {
            // then set cards in our player's hand to false for all players
            self.player_nums.forEach(function(this_player) {
                self.data[card][this_player] = false;
            });
            // finally, set card in our player's hand to true for our player
            self.data[card][self.player.num] = true;
        });
        return self;
    },
    // set_card
    // 
    // This sets the record for a given card and player to the given status.
    // If the status is true, that means that the player has that card.
    // If the status is false, that means that the player does not have that card.
    // If the status is null, that means that it is unknown if the player has that card.
    // If the status is undefined, it's as if the status is true, it means that
    // the player has that card.
    //
    // If, when setting the status for a given card-player, the card-player's status
    // is already set to something different, we print a warning to the console.
    //
    // player_num should be a number from 0 to the number of players - 1, or it should
    // be -1 to indicate the answer.
    //
    // When the status is true (or undefined), we not only set the status for that player,
    // we set the status to false for all other players for that card.
    //
    // If player and status are both unknown, that resets the status for that card to
    // unknown for all players.
    set_card: function(card, player_num, stat, skip_deduction) {
        var self = this;
        if (player_num === undefined) {
            throw "Internal Error: undefined player_num";
            self.player_nums.forEach(function(player_num) {
                //self.data[card][player_num] = null;
            });
            return;
        }
        if (stat === undefined) {
            stat = true;
        }
        var old_stat = self.data[card][player_num];
        if (old_stat !== null && old_stat != stat) {
            console.log("Changing card " + card + " player " + player_num +
                    " from " + old_stat + " to " + stat); 
        }
        self.data[card][player_num] = stat;
        if (!skip_deduction) {
            if (stat && !old_stat) {
                self.set_other_players_false(card, player_num);
                if (player_num == self.ANSWER_PLAYER) {
                    self.set_rest_of_category_false(card);
                }
            } else if (!stat) {
                self.check_one_player_left(card);
                if (player_num == self.ANSWER_PLAYER) {
                    self.check_one_card_left_in_category(card);
                }
            }
        }
        return self;
    },
    // once we know that player_num has the card, we know that none
    // of the other players have the card
    set_other_players_false: function(card, player_num) {
        var self = this;
        // console.log("set other players false: " + card + ", " + player_num);
        this.player_nums.forEach(function(this_player_num) {
            if (this_player_num != player_num) {
                // use set_card because this might have told
                // us that the ANSWER_PLAYER doesn't have this
                // card, and that might be enough for us to
                // know which card the ANSWER_PLAYER does have
                // for this category
                self.set_card(card, this_player_num, false);
            }
        });
        return self;
    },
    // get the category for a card
    get_card_category: function(card) {
        var self = this;
        return clue.expect_one(self.game.categories.filter(function(category) {
            return self.game.cards[category].includes(card);
        }), "Internal Error: Too many categories for card " + card);
    },
    // if we know that this card is the answer, then we know
    // none of the other cards in this category is the answer
    set_rest_of_category_false: function(card) {
        var self = this;
        // console.log("set rest of category false " + card);
        var category = self.get_card_category(card);
        self.game.cards[category].forEach(function(this_card) {
            if (card != this_card) {
                // call set_card because there might be only
                // one other player who has this card
                self.set_card(this_card, self.ANSWER_PLAYER, false);
            }
        });
    },
    // for a given card, return which players we know have it
    // which we know don't have it, and which we don't know the
    // status of.
    count_types: function(card) {
        var self = this;
        var unknowns = [];
        var trues = [];
        var falses = [];
        self.player_nums.forEach(function(player_num) {
            if (self.data[card][player_num] === null) {
                unknowns.push(player_num);
            } else if (self.data[card][player_num]) {
                trues.push(player_num);
            } else {
                falses.push(player_num);
            }
        });
        return [trues, falses, unknowns];
    },
    // if we know that the card is not held by n-1 players,
    // then it must be held by the nth player.
    check_one_player_left: function(card) {
        var self = this;
        var types = self.count_types(card);
        if (types[2].length == 1 && types[0].length == 0) {
            // use set_card because if we are setting the ANSWER_PLAYER
            // to true, then we have to set the rest of the category
            // to false for the ANSWER_PLAYER.
            self.set_card(card, types[2][0], true);
        }
        return self;
    },
    // if we know for all but one card in this category
    // that it's not the answer, then the last card in the
    // category must be the answer.
    check_one_card_left_in_category: function(card) {
        var self = this;
        var category = self.get_card_category(card);
        var unknowns = [];
        var trues = [];
        var falses = [];
        self.game.cards[category].forEach(function(card) {
            if (self.data[card][self.ANSWER_PLAYER] === null) {
                unknowns.push(card);
            } else if (self.data[card][self.ANSWER_PLAYER]) { 
                trues.push(card);
            } else {
                falses.push(card);
            }
        });
        if (unknowns.length == 1 && trues.length == 0) {
            self.set_card(unknowns[0], self.ANSWER_PLAYER, true);
        }
        return self;
    },
    // get_card
    //
    // The player_num argument is optional.  If it is provided,
    // then we'll either return true if that player is known to
    // have this card or false if that player is known to not
    // have this card or null if it is unknown whether this
    // player has the card.  If the player_num provided is -1,
    // then our return value will indicate whether it is known
    // whether the card is part of the answer.
    //
    // If player_num is not provided then we'll return
    // the id of the player that has the card, or -1 if the
    // card is known to be part of the answer.  if no player
    // is known to have the card, we'll return null.  if the
    // card is known to be 
    get_card: function(card, player_num) {
        var self = this;
        if (player_num === undefined) {
            return clue.expect_one(self.player_nums.filter(function(this_player_num) {
                return self.data[card][this_player_num];
            }), "Internal error: Too many players have card " + card);
        } else {
            return self.data[card][player_num];
        }
    },
    is_answer: function(card) {
        return this.get_card(card, this.ANSWER_PLAYER);
    },
    // get_answer
    //
    // If no category is given, return a hash from category to
    // the answer for that category, if the answer is known.
    // If the answer for any category is not known, it will not
    // be in the hash.
    //
    // If a category is given, we'll return the answer for that
    // category, if it is known, otherwise we'll return null.
    get_answer: function(category) {
        var self = this;
        if (!category) {
            var results = {};
            self.game.categories.forEach(function(category) {
                var answer = self.get_answer(category);
                if (answer) {
                    results[category] = answer;
                }
            });
            return results;
        } else {
            return clue.expect_one(self.game.cards[category].filter(function(card) {
                return self.data[card][self.ANSWER_PLAYER];
            }), "Internal error: Too many answers for category " + category); 
        }
    },
    // make_deductions
    // 
    // This function draws conclusions from the evidence seen.
    //
    // 1. If, for a given card, all players but one (including
    // the answer) are marked as not having the card, then we
    // know that the last remaining player must have the card.
    //
    // 2. If, for a given category, all the cards in that category
    // are known to be with non-answer players, then the last
    // card in the category must be the answer.
    //
    // 3. If a card is known to be in the hand of a given player,
    // then we know it's not in the hand of any other players
    // (including the answer).
    //
    // 4. If a card is known to be the answer, none of the other
    // cards in that category may be the answer.
    make_deductions: function() {
        var self = this;
        return self;
    },
    filter_seen: function(arr) {
        var self = this;
        return arr.filter(function(card) {
            if (card in self.data) {
                if (self.get_card(card) != self.ANSWER_PLAYER) {
                    return false;
                }
            }
            return true;
        });
    },
    record_evidence: function(suggester, guess, disputer, card) {
        // console.log(this.name + " -- " + suggester.name + " guessed: " + clue.hash_values(guess));
        var self = this;
        self.all_guesses.push([suggester, guess, disputer, card]);
        // all players between the suggester and disputer do not have
        // the cards that were guessed
        for (var ii = 1; ii < self.game.nplayers; ii++) {
           var num = (suggester.num + ii) % self.game.nplayers; 
           if (disputer && num == disputer.num) {
               break;
           }
           clue.hash_values(guess).forEach(function(card) {
               self.set_card(card, num, false);
           });
        }
        // if we saw the card, then we now know who has that
        // card, so mark it down.
        if (card && self.player.num != disputer.num) {
            self.set_card(card, disputer.num, true);
        }
        // if we were the suggester, and there was no disputer,
        // then any card that we don't have in our hand must be
        // part of the answer
        if (suggester == self.player && !disputer) {
            self.game.categories.forEach(function(category) {
                var card = guess[category];
                if (!self.get_card(card, self.player.num)) {
                    self.set_card(card, self.ANSWER_PLAYER, true);
                }
            });
        }
        // The following logic implements the reasoning that if you see
        // a guess go by, and you see someone dispute it, if you happen
        // to know that two of the cards in the guess are not held by
        // the disputer, you can then deduce that the third card of the
        // guess must be held by the disputer
        //
        // This logic can be run on any of the guesses that you've seen
        // so far at any time.
        var any_changes = true;
        // this loop should really just be "while (any_changes)" but
        // to be paranoid, we cap it at 100 iterations to guard against
        // a possible logic error that would otherwise result in an
        // infinite loop.
        for (var jj = 0; any_changes && jj < 100; jj++) {
            any_changes = false;
            for (var ii = 0; ii < this.all_guesses.length; ii++) {
                if (this.all_guesses[ii][3]) {
                    // skip any guesses where we saw the card
                    continue;
                }
                var disputer = this.all_guesses[ii][2];
                if (!disputer) {
                    // skip any guesses that were not disputed
                    continue;
                }
                var guess = this.all_guesses[ii][1];
                var known = [];
                var unknown = [];
                clue.hash_values(guess).forEach(function(card) {
                    if (self.get_card(card, disputer) === false) {
                        known.push(card);
                    } else {
                        unknown.push(card);
                    }
                });
                if (unknown.length == 1) {
                    if (!self.get_card(unknown[0], disputer)) {
                        self.set_card(unknown[0], disputer, true);
                        any_changes = true;
                    }
                }
            }
        }
    },
};

clue.Player = {
    create: function(game, num, hand, name) {
        var self = Object.create(this);
        self.game = game;
        self.num = num;
        self.hand = hand;
        self.name = name;
        self.record = clue.Record.create(self);
        self.detail = {};
        return self;
    },
    // check if we have any cards in the guess
    // if so, randomly return one of the cards we have
    // TODO: there may be a better strategy to which card
    // we reveal
    check_guess: function(guess) {
        var matches = this.hand.filter(
                function (card) {
                    return clue.hash_values(guess).includes(card);
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
    make_accusation: function() {
        var accusation = this.record.get_answer();
        var missing = this.game.categories.filter(function(category) {
            return !(category in accusation);
        });
        if (missing.length == 0) {
            return accusation;
        }
    },
    record_accusation: function(accuser, accusation, result) {
    },
    filter_seen: function(arr) {
        return this.record.filter_seen(arr);
    },
    record_evidence: function(suggester, guess, disputer, card) {
        this.record.record_evidence(suggester, guess, disputer, card);
    }
}

clue.ComputerPlayer1 = clue.Player.extend({
    // this player always guesses the same thing
    get_guess: function() { 
        var self = this;
        var guess = {};
        self.game.categories.forEach(function(category) {
            guess[category] = self.game.cards[category][0];
        });
        return guess;
    },
});

clue.ComputerPlayer2 = clue.Player.extend({
    // This player just guesses cards that it hasn't seen yet
    get_guess: function() {
        var self = this;
        var guess = {};
        self.game.categories.forEach(function(category) {
            guess[category] = this.choose_or_sub(this.filter_seen(this.game.cards[category]), this.game.cards[category])
        });
        return guess;
    },
    choose_or_sub: function(results, fallback) {
        var self = this;
        // if there is a card we haven't seen, use it
        if (results.length > 0) {
            return clue.choose(results);
        }
        // we know where all the cards for this category are.
        // So now which do we return?
        // first, return a random card in our hand
        var inhand = this.hand.filter(function(card) { return fallback.includes(card); });
        if (inhand.length > 0) {
            return clue.choose(inhand);
        }
        // we don't have any of the cards in our hand.
        // if we know which one is the answer, return that
        // that way, the rest of our guess won't get stopped
        // by whoever has the card in this category (which
        // we already know the answer to).
        var accused = fallback.filter(function(card) {
            return self.record.is_answer(card);
        });
        if (accused.length > 0) {
            return accused[0];
        }
        // Otherwise, just return an arbitrary card.  Note that we
        // should never get here -- if we've seen all the cards,
        // we should know what the answer is and should have chosen
        // that one
        return fallback[0];
    },
});

clue.ComputerPlayer3 = clue.ComputerPlayer2.extend({
    // this player always guesses something random
    get_guess: function() { 
        var self = this;
        var guess = {};
        self.game.categories.forEach(function(category) {
            guess[category] = clue.choose(self.game.cards[category]);
        });
        return guess;
    },
});

clue.ConsolePlayer = clue.Player.extend({
    get_guess: function () {
        console.log(this.game.hand_string(this.hand));
        console.log("Guess -- ");
        var self = this;
        var guess = {};
        self.game.categories.forEach(function(category) {
            var value = clue.get_user_guess(category, this.game.cards[category]);
            if (!value) {
                console.log("No guessed " + category + ", quitting");
            }
        });
        return guess;
    },
    record_accusation: function(accuser, accusation, result) {
        this.display_output(accuser.name + " accused: " + clue.hash_values(accusation));
        if (result) {
            this.display_output("That's right!");
            return true;
        } else {
            this.display_output("Sorry, that's not right.");
            return false;
        }
    },
    make_accusation: function() {},
    display_output: function(msg) {
        return console.log(msg);
    },
    record_evidence: function(suggester, guess, disputer, card) {
        clue.Player.record_evidence.call(this, suggester, guess, disputer, card);
        var round = this.game.round;
        if (suggester == this) {
            this.display_output("-------------------");
        }
        this.display_output("Round " + round + ": " +
                suggester.name + " guessed: " +
                clue.hash_values(guess));
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
    create: function(game, num, hand, name) {
        var self = clue.Player.create.call(this, game, num, hand, name);
        clue.html.setup(game);
        clue.html.display_hand(hand, game);
        return self;
    },
    get_guess: function() { 
        var self = this;
        var guess = {};
        self.game.categories.forEach(function(category) {
            guess[category] = clue.html.get_select_value(category);
        });
        return guess;
    },
    record_evidence: function(suggester, guess, disputer, card) {
        clue.ConsolePlayer.record_evidence.call(this, suggester, guess, disputer, card);
        clue.html.update_auto_notes(this.game, this.record);
    },
    display_output: function(msg) {
        clue.html.log_output(msg + "\n");
    },
});

clue.html = {
    make_notes: function(game, parent_element, id, read_only, record) {
        var table = document.createElement("TABLE");
        parent_element.appendChild(table);
        table.setAttribute("id", id);
        for (var ii = 0;
             game.categories.filter(function(category) { return game.cards[category].length > ii }).length > 0;
             ii++) {
            var row = document.createElement("TR");
            table.appendChild(row);
            function add_elt(text) {
                var td = document.createElement("TD");
                row.appendChild(td);
                var label = document.createElement("INPUT");
                td.appendChild(label);
                label.setAttribute("value", text);
                label.setAttribute("readOnly", true);
                if (text) {
                    /*
                     * this is if you want text box notes where you can put anything
                    var input = document.createElement("INPUT");
                    td.appendChild(input);
                    input.setAttribute("type", "text");
                    input.style.width = 50;
                    */
                    // These notes give you a checkbox for each player + 1
                    // but leaves them unlabeled -- you can choose how to use them
                    for (var num = 0; num <= game.nplayers; num++) {
                        var checkbox = document.createElement("INPUT");
                        //td.appendChild(document.createTextNode(num));
                        td.appendChild(checkbox);
                        if (read_only) {
                            checkbox.setAttribute("disabled", "true");
                        }
                        checkbox.setAttribute("type", "checkbox");
                        clue.set_tristate_checkbox(checkbox);
                        if (record) {
                            var value = record.get_card(text, num - 1);
                            if (value === null) {
                                checkbox.indeterminate = false;
                                checkbox.checked = false;
                            } else if (value) {
                                checkbox.indeterminate = false;
                                checkbox.checked = true;
                            } else {
                                checkbox.indeterminate = true;
                                checkbox.checked = false;
                            }
                        }
                    }
                }
            }
            game.categories.forEach(function(category) {
                var value = "";
                if (ii < game.cards[category].length) {
                    value = game.cards[category][ii];
                }
                add_elt(value);
            });
        }
    },
	// setup is called for every new game, so it must be idempotent
    setup: function(game) {
        // add cards to the drop down menus
        function remove_children(node) {
			while (node.firstChild) {
    			node.removeChild(node.firstChild);
			}
        }
		function set_options(id, list) {
			var element  = document.getElementById(id);
			remove_children(element);
			for (var ii = 0; ii < list.length; ii++) {
				element.add(new Option(list[ii]));
			}
		}
        game.categories.forEach(function(category) {
            set_options(category, game.cards[category]);
        });
        var notes = document.getElementById("notes");
        var existing = document.getElementById("note-table");
        if (existing) {
            notes.removeChild(existing);
        }
        // populate the record keeping tables
        clue.html.make_notes(game, notes, "note-table");
        clue.html.update_auto_notes(game);
        // resize the output windows
        var hand = document.getElementById("hand");
        hand.style.height = "50";
        hand.style.width = "100%";
        var log = document.getElementById("log");
        log.style.height = "200";
        log.style.width = "100%";
        this.set_value("log", "");
    },
    update_auto_notes: function(game, record) {
        var auto_notes = document.getElementById("auto_notes");
        var existing = document.getElementById("auto_notes-table");
        if (existing) {
            auto_notes.removeChild(existing);
        }
        clue.html.make_notes(game, auto_notes, "auto_notes-table", true, record);
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
    game.round += 1;
    for (var ii = 0; ii < game.nplayers; ii++) {
        var player_num = (start_num + ii) % game.nplayers;
        var player = game.players[player_num];
        // console.log("starting player " + player.name);
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
                for (var kk = 0; kk < game.nplayers; kk++) {
                    var third_player = game.players[kk];
                    if (kk == other_player_num || kk == player_num) {
                        third_player.record_evidence(player, guess, other_player, evidence.card);
                    } else {
                        third_player.record_evidence(player, guess, other_player);
                    }
                }
                break;
            }
        }
        if (!found) {
            for (var jj = 0; jj < game.nplayers; jj++) {
                game.players[jj].record_evidence(player, guess);
            }
        }
        var accusation = player.make_accusation();
        clue.allow_accusation(player, accusation);
        // console.log("finished player " + player.name + " guess " + guess + " found " + found + " accusation " + accusation);
    }
    return true;
};

clue.allow_accusation = function(player, accusation) {
    var game = player.game;
    if (accusation) {
        var result = clue.object_equals(game.answer, accusation);
        for (var jj = 0; jj < game.nplayers; jj++) {
            game.players[jj].record_accusation(player, accusation, result);
        }
    }
};

clue.make_game = function(debug, nplayers, suspects, weapons, rooms) {
    var game = clue.Game.create({nplayers: nplayers, suspects: suspects, weapons: weapons, rooms: rooms});
    if (debug) {
        game.print_all();
    }
    return game;
};

clue.play_game = function(debug, nplayers, suspects, weapons, rooms) {
    var game = clue.Game.create({nplayers: nplayers, suspects: suspects, weapons: weapons, rooms: rooms});
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
