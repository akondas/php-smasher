var guid = (function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
  return function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
  };
})();

var heros = {};
var monster = {};

// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
document.getElementById("game").appendChild(canvas);

ctx.font="14px Georgia";
ctx.fillStyle = "white";

// Background image
var bgReady = false;
var bgImage = new Image();
bgImage.onload = function () {
	bgReady = true;
};
bgImage.src = "images/background.png";

var spritePaths = {
	hero: 'images/elephpant.png',
	ruby: 'images/ruby.png',
	python: 'images/python.png',
    c: 'images/c.png',
	cplusplus: 'images/cplusplus.png',
	csharp: 'images/csharp.png',
	erlang: 'images/erlang.png',
	go: 'images/go.png',
	java : 'images/java.png',
	javascript : 'images/javascript.png'
};

var sprite = function(name, path) {
	var that = this;
	this._name = name;
	this._path = path;
	this._image = new Image();
	this._ready = false;
	this._image.onload = function(img) {
		that._ready = true;
	};
	this._image.src = path;
};

sprite.prototype = {
	width: function() {
		return this._image.width;
	},
	height: function() {
		return this._image.height;
	},
	image: function() {
		return this._image;
	},
	ready: function() {
		return this._ready;
	}
};


var spriteCollection = {};
for(var i in spritePaths) {
	var oSprite = new sprite(i, spritePaths[i]);
	spriteCollection[i] = oSprite;
}

var hero = function(heroType) {
	this._type = heroType || "hero";
	this._x = this._y = 0;
	this._speed = 256 //in pixels per second
	this._msg = '';
	this._timer = false;
	this._points = 0;
};

hero.prototype = {
	id: function() {
		return this.heroId;
	},
	setId: function(id) {
		this.heroId = id;
	},
	playerName: function() {
		return this._playerName;
	},
	setPlayerName: function(playerName) {
		this._playerName = playerName;
	},
	type: function() {
		return this._type;
	},
	points: function() {
		return this._points;
	},
	addPoint: function() {
		this._points++;
	},
	setPoints: function(points) {
		this._points = points;
	},
	setType: function(heroType) {
		if(spriteCollection[heroType] !== undefined) {
			this._type = heroType;
		}
	},
	y: function() {
		return this._y;
	},
	x: function() {
		return this._x;
	},
	speed: function() {
		return this._speed;
	},
	sprite: function() {
		return spriteCollection[this._type];
	},
	ready: function() {
		return this.sprite().ready();
	},
	reset: function(width, height) {
		var sprite = this.sprite()
		// Throw the monster somewhere on the screen randomly
		this._x = sprite.width() + (Math.random() * (width - (sprite.width()*2)));
		this._y = sprite.height() + (Math.random() * (height - (sprite.height()*2)));
	},
	move: function(x, y) {
		this._x = x;
		this._y = y;
	},
	moveX: function(x) {
		this._x = x;
	},
	moveY: function(y) {
		this._y = y;
	},
	say: function(msg) {
		var that = this;
		if(this._timer !== false) {
			clearTimeout(this._timer);
		}

		setTimeout(function() {
			that._msg = '';
		}, 10 * 1000);
		this._msg = msg;
	},
	said: function() {
		return this._msg;
	},
	serialize: function() {
		return { id: this.heroId, y: this._y, x: this._x, heroType: this._type, playerName: this._playerName };
	}
};

var myHero = new hero();

// Handle keyboard controls
var keysDown = {};

addEventListener("keydown", function (e) {
	keysDown[e.keyCode] = true;
	if(e.keyCode == 13) {
		sendMessage();
	}
}, false);

addEventListener("keyup", function (e) {
	delete keysDown[e.keyCode];
}, false);

addEventListener("touchstart", function (e) {
	if(e.touches.item(0) && e.touches.item(0).target.dataset.hasOwnProperty('key')) {
		keysDown[e.touches.item(0).target.dataset.key] = true;
	}
}, false);

addEventListener("touchend", function (e) {
	keysDown = {};
}, false);

// Update game objects
var update = function (modifier) {
	var x, y = 0;
	var domove = false;
	if (38 in keysDown) { // Player holding up
		y = myHero.y() - myHero.speed() * modifier;
		if(y <= 0) {
			return;
		}

		myHero.moveY(y);
		domove = true;
	}
	if (40 in keysDown) { // Player holding down
		y = myHero.y() + myHero.speed() * modifier;
		if(y+32 >= canvas.height) {
			return;
		}
		myHero.moveY(y);
		domove = true;
	}
	if (37 in keysDown) { // Player holding left
		x = myHero.x() - myHero.speed() * modifier;
		if(x <= 0) {
			return;
		}
		myHero.moveX(x);
		domove = true;
	}
	if (39 in keysDown) { // Player holding right
		x = myHero.x() + myHero.speed() * modifier;
		if(x+32 >= canvas.width ) {
			return;
		}

		myHero.moveX(x);
		domove = true;
	}

	if(domove) {
		conn.publish('char_move', myHero.serialize(), true);
	}
};

// Draw everything
var render = function () {
	if (bgReady) {
		ctx.drawImage(bgImage, 0, 0);
	}

	for(var i in heros) {
		if (heros[i].ready()) {
			if(heros[i] === myHero) {
				continue;
			}
			renderHero(heros[i]);
		}
	}
	// little hack to make sure we stay on top of everyone else
	renderHero(myHero);

	if (monster.hasOwnProperty('type')) {
        ctx.drawImage(spriteCollection[monster.type].image(), monster.x, monster.y, 32, 32);
	}
};

function renderHero(hero) {
	ctx.drawImage(hero.sprite().image(), hero.x(), hero.y(), 50, 50);
	ctx.fillText(hero.playerName(), hero.x(), hero.y() + 55);
	if(hero.said() != '') {
		ctx.fillText(hero.said(), hero.x() + (50 / 2), hero.y() - 10);
	}
};

var renderPoints = function(){
	var points = document.getElementById("points");
	var sorted = Object.entries(heros).sort(function (a, b) {
		if(a[1].points()==b[1].points()) {
			return 0;
		}

		return a[1].points() > b[1].points() ? -1 : 1;
	});

	points.innerHTML = "";
	for(var i in sorted) {
		if (sorted[i][1].ready()) {
			if(sorted[i][1].id() == myHero.id()) {
				points.innerHTML += "<strong>" + sorted[i][1].playerName() + ": " + sorted[i][1].points() + "</strong><br />";
			} else {
				points.innerHTML += sorted[i][1].playerName() + ": " + sorted[i][1].points() + "<br />";
			}
		}
	}
};

// The main game loop
var main = function () {
	var now = Date.now();
	var delta = now - then;

	update(delta / 1000);
	render();

	then = now;

	// Request to do this again ASAP
	requestAnimationFrame(main);
};

// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

// Let's play this game!
var then = Date.now();
var conn;

window.onbeforeunload = function(){
	if(conn) {
		conn.publish('char_remove', myHero.serialize(), true);
	}
};

function sendMessage() {
	var message = document.getElementById("message").value;
	if(conn && message) {

		conn.publish('char_msg', { id: myHero.id(), msg: message });

		myHero.setType(message.substring(1));
		if(message[0] != "/") {
			myHero.say(message);
		}
		document.getElementById("message").value = '';
	}
}

function startTheGame() {
	var playerName = document.getElementById("playerName").value;
	if(playerName.length<1) {
		alert('Provide player name!');
		return;
	}
	myHero.setPlayerName(playerName);

	document.getElementById("start").style.display = 'none';
	document.getElementById("game-wrapper").style.display = 'block';
	conn = new ab.Session('ws://' + window.location.hostname + ':8181',
		function() {
			conn.subscribe('char_move', function(topic, data){
				if(heros[data.id] !== undefined) {
					heros[data.id].moveX(parseFloat(data.x));
					heros[data.id].moveY(parseFloat(data.y));
				}
			});

			conn.subscribe('char_msg', function(topic, data){
				if(heros[data.id] !== undefined) {
					heros[data.id].say(data.msg);
					if(data['heroType'] !== undefined) {
						heros[data.id].setType(data['heroType']);
					}
				}
			});

			conn.subscribe('char_add', function(topic, data){
				var newHero = new hero();
				newHero.moveX(parseFloat(data.x));
				newHero.moveY(parseFloat(data.y));
				newHero.setId(data.id);
				newHero.setPlayerName(data.playerName);
				heros[data.id] = newHero;
			});

			conn.subscribe('char_remove', function(topic, data){
				if(heros[data.id] !== undefined) {
					delete heros[data.id];
				}
			});

			conn.subscribe('monster_add', function (topic, data) {
				monster = data;
			});

			conn.subscribe('add_point', function(topic, data) {
				if(heros[data.id] !== undefined) {
					heros[data.id].addPoint();
				}
				renderPoints();
			});

			myHero.reset(canvas.width, canvas.height);
			myHero.setId(guid());
			heros[myHero.id()] = myHero;

			main();

			conn.publish('char_add', myHero.serialize(), true);
			conn.call('synchronize').then(function(data) {
				var players = data.players;
				for(var i in players) {
					var current = players[i].lastMove;
					if(current == null || current.id === myHero.id()) {
						continue;
					}

					var newHero = new hero();
					newHero.moveX(parseFloat(current.x));
					newHero.moveY(parseFloat(current.y));
					newHero.setId(current.id);
					newHero.setType(current.heroType);
					newHero.setPoints(players[i].points);
					newHero.setPlayerName(current.playerName);
					heros[current.id] = newHero;
				}

				monster = data.monster;
				renderPoints();
			});
		},
		function() {
			console.warn('WebSocket connection closed');
		},
		{'skipSubprotocolCheck': true}
	);


}
