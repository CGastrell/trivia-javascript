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
			// this.element.html("");
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
				// this._crearBarraInfo(),
				// this._crearEspacioDeJuego(),
				this._asignarEspacioDeJuego(),
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
			console.log('preparando pregunta');
			var _this = this;
			var rr = Math.random() * this.setDePreguntas.length << 0;
			this.preguntaActual = this.setDePreguntas.splice(rr, 1)[0];
			
			TweenMax.set([
				this.questionLabel,
				this.respuesta1,
				this.respuesta2,
				this.respuesta3
			], {autoAlpha: 1, scale: 1});

			var respuestas = this._mezclarArray(this.preguntaActual.opciones);

			this.respuesta1.find('p').first().text(respuestas[0]);
			this.respuesta2.find('p').first().text(respuestas[1]);
			this.respuesta3.find('p').first().text(respuestas[2]);

			this.questionLabel.text("#" + String(_this.options.preguntasPorRonda - _this.setDePreguntas.length));

			this.questionBox.find('#consigna').first().text(this.preguntaActual.consigna);

			var responder = function() {
				_this._responder($(this).find('p').first().text());
			}
			var hookRespuestas = function() {
				console.log('hola');
				_this.respuesta1.on('click', responder);
				_this.respuesta2.on('click', responder);
				_this.respuesta3.on('click', responder);
			}

			var tl = new TimelineMax({onComplete:hookRespuestas});
			tl.add(TweenMax.from(this.questionLabel, 1.5, {delay: 0.25, autoAlpha: 0, scale:3, ease: Power4.easeIn}));
			tl.add(TweenMax.to(this.background,0.5,{
				yoyo:true,
				repeat:1,
				autoAlpha:0,
				onRepeat: function(){
					_this.background.attr('src', 'images/fondos/'+_this.preguntaActual.id + '.jpg')
				}
			}));
			tl.add(TweenMax.to(this.questionBox,0.75,{delay: 0.25, autoAlpha:1}));
			tl.add(
				TweenMax.staggerFrom(
					[
						this.respuesta1,
						this.respuesta2,
						this.respuesta3
					],
					0.25,
					{autoAlpha: 0,scale:0.2,ease: Back.easeOut, delay:1},
					0.15,
					function() {console.log('respuestas mostradas')}
				)
			);
		},
		_responder: function(respuesta) {
			this.respuesta1.off('click');
			this.respuesta2.off('click');
			this.respuesta3.off('click');
			var correcto = respuesta === this.preguntaActual.respuesta;
			this.responseSplash.find('p.calificacion').first().text(correcto ? 'CORRECTO!' : 'INCORRECTO!');
			this.responseSplash.find('p.remate').first().text(this.preguntaActual.remate);
			TweenMax.set(this.responseSplash,{autoAlpha:1,scale:1});
			var _this = this;
			var hookProximaPregunta = function() {
				_this.responseSplash.on('click',function(){
					_this.responseSplash.off('click');
					TweenMax.to(_this.responseSplash,0.5,{
						autoAlpha:0,
						scale:0.1,
						ease: Back.easeIn,
						onComplete: $.proxy(_this._showQuestion,_this)
					});
				})
			}
			var tl = new TimelineMax({onComplete:hookProximaPregunta});
			tl.add(
				TweenMax.staggerTo(
					[
						this.questionBox,
						this.questionLabel,
						this.respuesta1,
						this.respuesta2,
						this.respuesta3
					],
					0.2,
					{autoAlpha:0},
					0.1
				)
			);
			tl.add(
				TweenMax.from(this.responseSplash,0.5,{y: -1000, autoAlpha:0, scale:0.2, ease: Back.easeOut})
			);
		},
		_mezclarArray: function(o){ 
			for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
			return o;
		},
		_mostrarSplashInicial: function() {
			TweenMax.staggerTo(
				[
					this.endSplash,
					this.respuesta1,
					this.respuesta2,
					this.respuesta3,
					this.responseSplash,
				],0.5,{autoAlpha:0}
			);
			TweenMax.to(this.startSplash,0.5,{autoAlpha:1});
		},
		_zOrder: function(boxesArray) {
			for(var ii=0; ii < boxesArray.length; ii++) {
				boxesArray[ii].css('z-index',ii + 20);
			}
		},
		_asignarEspacioDeJuego: function() {
			var _this = this;
			this.gameSpace = $('#gameSpace', this.element);
			this.background = $('#background', this.gameSpace);
			this.questionBox = $('#questionBox', this.gameSpace);
			this.questionLabel = $('#questionLabel > #numeroPregunta', this.gameSpace);
			this.respuesta1 = $('#opcion1', this.gameSpace);
			this.respuesta2 = $('#opcion2', this.gameSpace);
			this.respuesta3 = $('#opcion3', this.gameSpace);
			this.responseSplash = $('#responseSplash', this.gameSpace);
			this.startSplash = $('#startSplash', this.gameSpace);
			this.endSplash = $('#endSplash', this.gameSpace);
			this.errorSplash = $('#errorSplash', this.gameSpace);
			this.errorSplash.message = $('p', this.errorSplash);

			this.startSplash.click(function(e){
				_this.comenzarJuego();
				return false;
			});

			this.questionBox.outerWidth(this.ancho);

			this._centrar(this.element,this.errorSplash);
			this._centrar(null, this.questionLabel, true);
			this._centrar(null, this.responseSplash);

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
		_crearEspacioDeJuego: function() {
			var _this = this;
			this.gameSpace = $('<div id="gameSpace" />')
				.appendTo(this.element);

			this.questionBox = $('<div id="questionBox" />')
				.appendTo(this.gameSpace);

			this.questionLabel = $('<div id="questionLabel" />')
				.appendTo(this.gameSpace);

			// this.optionsContainer = $('<div id="optionsContainer" />')
				// .appendTo(this.gameSpace);
			this.respuesta1 = $('<div class="respuesta opcion1" data-index="0" />')
				.appendTo(this.gameSpace);
			this.respuesta2 = $('<div class="respuesta opcion2" data-index="1" />')
				.appendTo(this.gameSpace);
			this.respuesta3 = $('<div class="respuesta opcion3" data-index="2" />')
				.appendTo(this.gameSpace);

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
		_centrar: function(container, client, horizontalOnly) {
			if(container === null || container === undefined) container = client.parent();
			var n = {
				top: horizontalOnly ? client.offset().top : (container.innerHeight() - client.outerHeight()) / 2,
				left: (container.innerWidth() - client.outerWidth()) /2
			}
			client.offset(n);
		},
		_crearBarraInfo: function() {
			// console.log(this.options);
			this.statusBar = $('<div id="statusBar" />')
				.css({
					"background": "black",
					color: "white",
					"font-family": "Courier New, sans"
				});

			this.hiScoreLabel = $('<div class="label" />')
				.text(this.options.labels.hiScore)
				.css({
					width: "30%",
					'margin-left': '2%'
				})
				.appendTo(this.statusBar);
			this.hiScoreValue = $('<span class="hiScore" />')
				.text(this.options.record)
				.css("color","yellow")
				.appendTo(this.hiScoreLabel);

			this.gameTitle = $('<div class="title" />')
				.text(this.options.labels.title)
				.css({
					width: '36%',
					'text-align': 'center'
				}).appendTo(this.statusBar);

			this.scoreLabel = $('<div class="label" />')
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