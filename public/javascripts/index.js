function Player() {
	this.ac  = null;
	this.bufferSource = null;
	this.gainNode = null;
	this.analyser = null;
	this.count = 0;
	this.size = 128;
	this.buffer = [];
	this.box = $('#box')[0];
	this.width = 0;
	this.height = 0;
	this.canvas = null;
	this.ctx = null;
	this.Dots = [];
	this.drawType = "column";
	this.line = null;
};

Player.prototype.init = function(id) {
	this.ac = new (window.AudioContext||window.webkitAudioContext)();
	this.gainNode = this.ac[this.ac.createGain?"createGain":"createGainNode"]();
	this.gainNode.connect(this.ac.destination);
	this.analyser = this.ac.createAnalyser();
	this.analyser.fftSize = this.size*2;
	this.analyser.connect(this.gainNode);
	this.box = $('#'+id)[0];
	this.canvas = document.createElement('canvas');
	this.box.appendChild(this.canvas);
	this.ctx = this.canvas.getContext("2d");
	this.height = this.box.clientHeight;
	this.width = this.box.clientWidth;
	this.canvas.width = this.width;
	this.canvas.height = this.height;
	this.canvas.style.position = "absolute";
	this.canvas.style.top = "0px";
	this.canvas.style.zIndex = -10;
	this.canvas.style.marginLeft = "-50px";
	this.line = this.ctx.createLinearGradient(0,0,0,this.height);
	this.line.addColorStop(0,"#26a69a");
	this.line.addColorStop(0.5,"#26a69a");
	this.line.addColorStop(1,"#fff");
	this.visualizer();
}
Player.prototype.initBuffer = function(bufferd) {
	var bufferSource = this.ac.createBufferSource();
	bufferSource.buffer = bufferd;
	bufferSource.connect(this.analyser);
	bufferSource[bufferSource.start?"start":"noteOn"](0);
	this.bufferSource = bufferSource;
}
Player.prototype.changeVolume = function(percent) {
	this.gainNode.gain.value = percent*percent;
}
Player.prototype.visualizer = function(render) {
	var arr = new Uint8Array(this.analyser.frequencyBinCount);
	requestAnimationFrame = window.requestAnimationFrame || window.webKitRequestAnimationFrame || window.mozRequestAnimationFrame;
	var that = this;
	function v() {
		that.analyser.getByteFrequencyData(arr);
		that.draw(arr);
		requestAnimationFrame(v);
	}
	requestAnimationFrame(v);
}

Player.prototype.draw = function(arr) {
	this.clear();
	var w= this.width/this.size;
	for(var i=0;i<this.size;i++) {
		if(this.drawType=='column') {
			this.ctx.fillStyle = this.line;
			var h = arr[i]/(this.size*2)*this.height;
			this.ctx.fillRect(w*i,this.height-h,w*0.6,h);
		}else {
			this.ctx.beginPath();
			var o = this.Dots[i];
			var r = arr[i]/256*80;
			this.ctx.arc(o.x,o.y,r,0,Math.PI*2,true);
			var g = this.ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,r);
			g.addColorStop(0,'#26a69a');	
			g.addColorStop(1,o.color);	
			this.ctx.fillStyle = g;
			this.ctx.fill();
		}
	}
}

Player.prototype.clear = function() {
	this.ctx.clearRect(0,0,this.width,this.height);
}

Player.prototype.getDots = function() {
	this.Dots = [];
	for(var i=0;i<this.size;i++) {
		var x = this.random(0,this.width);
		var y = this.random(0,this.height);
		var color = "rgb("+this.random(0,255)+","+this.random(0,255)+","+this.random(0,255)+")";
		this.Dots.push({
			x: x,
			y: y,
			color: color
		});
	}
}

Player.prototype.random = function(m,n) {
	return Math.round(Math.random()*(n-m)+m);
}

var resize = function() {
	console.log('resizing')
	player.height = player.box.clientHeight;
	player.width = player.box.clientWidth;
	player.canvas.width = player.width;
	player.canvas.height = player.height;
	player.getDots();
}


var xhr = new XMLHttpRequest();
var player;
$(function() {
	$('.toolbar').mouseenter(function() {
		$(this).css('opacity',"1");
	});
	$('.toolbar').mouseleave(function() {
		$(this).css('opacity',"0.01");		
	});
	player = new Player();
	player.init('box');
	window.onresize = resize;
	resize();
	$('#volume').change(function() {
		player.changeVolume(this.value/this.max);
	});
	
	$('.drawtype').click(function() {
		player.drawType = this.value;
	});
	
	$('#volume').change();
	var list = $("#music-list a");
	list.each(function(index,el) {
		el.onclick = function() {
			list.removeClass('active');
			$(this).addClass('active');
			load("/audio/lol/"+el.title,player);
		}
	});
	resize();
});



function load(url,player) {
	player.clear();
	var n = ++player.count;
	player.bufferSource && player.bufferSource[player.bufferSource.stop?"stop":"nodeOff"]();
	if(player.buffer[url]) {
		if(n!=player.count)return;
		player.initBuffer(player.buffer[url]);
	}else {
		xhr.abort();
		xhr.open("GET",url);
		xhr.responseType = "arraybuffer";
		xhr.onload = function() {
			if(n!=player.count)return;
			player.ac.decodeAudioData(xhr.response,function(buffer) {
					if(n!=player.count)return;
					player.initBuffer(buffer);
					player.buffer[url] = buffer;
			},function(err) {
				console.log(err);
			});
		}
		xhr.send();
	}
	
	
	
	
}
