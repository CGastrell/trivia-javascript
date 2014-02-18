(function($) {
	$.widget("ign.trivia",{
		width: 0,
		height: 0,
		options: {
			questions: [],
			record: "0000",
			preguntasPorRonda: 10,
			labels: {
				hiScore: "TOP: ",
				title: "GeoTrivia",
				score: "PUNTOS: ",
				preguntasUrl: ""
			}
		},
		_create: function(){
		},
		_init: function() {
			this.element.css({
				position: 'relative'
			});
			this.ancho = this.element.innerWidth();
			this.alto = this.element.innerHeight();
			var _this = this;
			this.element.html("");
			$.when(
				this.cargarPreguntas(function(data){
					console.log(data);
					if(data["preguntas"] === undefined) {
						_this._mostrarError('no se encontro el item "preguntas"');
						return true;
					}
					_this.options.preguntas = data["preguntas"].slice();
				})
			).done(
				this._crearBarraInfo(),
				this._crearEspacioDeJuego(),
				this._mostrarSplashInicial()
			).fail(function(){
				if($.isEmptyObject(_this.options.preguntas)) {
					_this._mostrarError('no se pudo cargar el archivo de preguntas');
					return false;
				}
				if(_this.options.preguntas["preguntas"] === undefined) {
					_this._mostrarError('no hay preguntas disponibles');
				}
			});

		},
		cargarPreguntas: function(callback) {
			// if(this.options.preguntasUrl === "")
			var _this = this;
			var d = $.Deferred(function(defer){
				$.getJSON(_this.options.preguntasUrl).then(defer.resolve, defer.reject);
			}).promise();
			return d.done(callback);
		},
		comenzarJuego: function() {
			this.setDePreguntas = [];
			this.preguntaActual = null;
			var _this  = this;
			var q = this.options.preguntas.slice();
			var r;
			for (var ii = 0; ii < this.options.preguntasPorRonda; ii++) {
				r = Math.random() * q.length << 0;
				this.setDePreguntas.push(q.splice(r,1)[0]);
			}
			TweenMax.to(this.startSplash,0.5,{
				autoAlpha:0,
				scale:0.1,
				ease: Back.easeIn,
				onComplete: $.proxy(this._showQuestion,_this)
			})
		},
		_showQuestion: function() {
			var _this = this;
			var rr = Math.random() * this.setDePreguntas.length << 0;
			this.preguntaActual = this.setDePreguntas.splice(rr, 1)[0];
			// this._center(null, this.questionLabel, true);
			TweenMax.set(this.questionLabel, {autoAlpha: 1});
			this.questionLabel.text("#" + String(_this.options.preguntasPorRonda - _this.setDePreguntas.length));
			this.questionBox.text(this.preguntaActual.consigna);
			var tl = new TimelineMax({onComplete:function(){console.log('question shown');}});
			tl.add(TweenMax.from(this.questionLabel,0.5,{delay: 0.25, autoAlpha: 0, scale:3, ease: Back.easeOut}));
			tl.add(TweenMax.to(this.questionBox,0.5,{autoAlpha:1}));
			tl.add(
				TweenMax.staggerTo(
					[
						this.respuesta1,
						this.respuesta2,
						this.respuesta3
					],
					{autoAlpha: 1},
					0.2,
					function() {console.log('respuestas mostradas')}
				)
			);
			
		},
		_mostrarSplashInicial: function() {
			TweenMax.staggerTo([
				this.endSplash,
				this.respuesta1,
				this.respuesta2,
				this.respuesta3,
				this.responseSplash,
			],0.5,{autoAlpha:0})
			TweenMax.to(this.startSplash,0.5,{autoAlpha:1});
		},
		_zOrder: function(boxesArray) {
			for(var ii=0; ii < boxesArray.length; ii++) {
				boxesArray[ii].css('z-index',ii + 20);
			}
		},
		_crearEspacioDeJuego: function() {
			var _this = this;
			this.gameSpace = $('<div id="gameSpace" />')
				.css('height', this.alto - this.statusBar.height())
				.appendTo(this.element);

			this.questionBox = $('<div id="questionBox" />')
				.appendTo(this.gameSpace);

			this.questionLabel = $('<div id="questionLabel" />')
				.appendTo(this.gameSpace);

			// this.optionsContainer = $('<div id="optionsContainer" />')
				// .appendTo(this.gameSpace);
			this.respuesta1 = $('<div class="respuesta opcion1" data-index="0" />')
				.text(".").appendTo(this.gameSpace);
			this.respuesta2 = $('<div class="respuesta opcion2" data-index="1" />')
				.text(".").appendTo(this.gameSpace);
			this.respuesta3 = $('<div class="respuesta opcion3" data-index="2" />')
				.text(".").appendTo(this.gameSpace);

			this.responseSplash = $('<div id="responseSplash" />')
				.appendTo(this.gameSpace);

			this.startSplash = $('<div id="startSplash" />')
				.html("<h1>Trivia IGN</h1>")
				.appendTo(this.element);
			this.startButton = $('<a href="#">Comenzar</a>')
				.click(function(e){
					_this.comenzarJuego();
					return false;
				}).appendTo(this.startSplash);

			this.endSplash = $('<div id="endSplash" />').appendTo(this.element);

			this.errorSplash = $('<div id="errorSplash" />')
				.css({
					border: '2px solid yellow',
					position: 'absolute',
					background: 'red',
					width: '50%',
					height: '50%',
					'text-align': 'center',
					'font-size': '20px',
					color: 'white'
				})
				.appendTo(this.element).append($('<h1>ERROR!</h1>'));
			this.errorSplash.message = $('<p />').appendTo(this.errorSplash);

			this._center(this.element,this.errorSplash);
			this._center(null, this.questionLabel, true);

			TweenMax.set([
				this.endSplash,
				this.startSplash,
				this.questionLabel,
				this.questionBox,
				this.respuesta1,
				this.respuesta2,
				this.respuesta3,
				this.responseSplash,
				this.errorSplash
			],{autoAlpha:0});
		},
		_mostrarError: function(msg) {
			console.log('error: ' + msg);
			this.errorSplash.message.text(msg);
			TweenMax.set(this.errorSplash, {autoAlpha:1});
		},
		_center: function(container, client, horizontalOnly) {
			if(container === null || container === undefined) container = client.parent();
			var n = {
				top: horizontalOnly ? client.offset().top : (container.innerHeight() - client.outerHeight()) / 2,
				left: (container.innerWidth() - client.outerWidth()) /2
			}
			client.offset(n);
		},
		center: this._center,
		_crearBarraInfo: function() {
			// console.log(this.options);
			this.statusBar = $('<div id="statusBar" />')
				.css({
					"background": "black",
					color: "white",
					"font-family": "Courier New, sans"
				});

			this.hiScoreLabel = $('<span class="label" />')
				.text(this.options.labels.hiScore)
				.css({
					display: "inline-block",
					width: "30%",
					'margin-left': '2%'
				})
				.appendTo(this.statusBar);
			this.hiScoreValue = $('<span class="hiScore" />')
				.text(this.options.record)
				.css("color","yellow")
				.appendTo(this.hiScoreLabel);

			this.gameTitle = $('<span class="title" />')
				.text(this.options.labels.title)
				.css({
					display: 'inline-block',
					width: '36%',
					'text-align': 'center'
				}).appendTo(this.statusBar);

			this.scoreLabel = $('<span class="label" />')
				.text(this.options.labels.score)
				.css({
					display: 'inline-block',
					width: '30%',
					'text-align': 'right',
					'margin-right': '2%'
				}).appendTo(this.statusBar);
			this.scoreValue = $('<span class="playerScore" />')
				.text("0000")
				.css({
					color: 'yellow'
				}).appendTo(this.scoreLabel);
				
			this.statusBar.appendTo(this.element);
		}
	});
})(jQuery);