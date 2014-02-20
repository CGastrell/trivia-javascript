(function($) {
	$.widget("ign.trivia",{
		width: 0,
		height: 0,
		roundPoints: 0,
		questionStartTime: 0,
		questionEndTime: 0,
		options: {
			questions: [],
			hiScore: "0000",
			scorePerQuestion: 5000,
			secondsPerQuestion: 10,
			questionsPerGame: 10,
			questionsArrayName: 'questions',
			questionsFileUrl: "",
			labels: {
				hiScore: "TOP: ",
				title: "GeoTrivia",
				playerScore: "PUNTOS: ",
				roundUpLabelHeader: "Puntos",
				roundUpLabelQuestion: "Respuesta correcta:",
				roundUpLabelTimebonus: "Bonus por tiempo:"
			}
		},
		_create: function(){
		},
		_init: function() {
			this.element.css({
				position: 'relative'
			});
			this.width = this.element.innerWidth();
			this.height = this.element.innerHeight();
			var _this = this;
			this._setUpGameSpace();
			this._setupSlideshow();
			$.when(
				this._loadQuestions()
			).then(
				function(data){
					if(data[_this.options.questionsArrayName] === undefined) {
						_this._showError('no se encontro el item "preguntas"');
						return false;
					}
					_this.options.questions = data[_this.options.questionsArrayName].slice();
					_this._showStartSplash();
				},
				function(){
					if( $.isEmptyObject(_this.options.questions) ) {
						_this._showError('no se pudo cargar el archivo de preguntas y no se suministraron preguntas');
					}
				}
			);//.done(function(){console.log('done')});
		},
		_loadQuestions: function(callback) {
			// if(this.options.questionsFileUrl === "")
			var _this = this;
			var d = $.Deferred(function(defer){
				$.getJSON(_this.options.questionsFileUrl).then(defer.resolve, defer.reject);
			}).promise();
			return d.done(callback);
		},
		startGame: function() {
			this.slideShow.pause();
			this.roundQuestions = [];
			this.preguntaActual = null;
			this.roundPoints = 0;
			var _this  = this;
			var q = this.options.questions.slice();
			var r;
			for (var ii = 0; ii < this.options.questionsPerGame; ii++) {
				r = Math.random() * q.length << 0;
				this.roundQuestions.push(q.splice(r,1)[0]);
			}
			TweenMax.to(this.startSplash,0.5,{
				autoAlpha:0,
				scale:0.1,
				ease: Back.easeIn,
				onComplete: $.proxy(this._showQuestion,_this)
			});
		},
		_showEndSplash:function() {
			var _this = this;
			var score = {points: 0};
			var finalScore = $('.finalScore',this.endSplash);
			var tl = new TimelineMax({onComplete:function(){
				_this.endSplash.on('click',function(){
					_this.endSplash.off('click');
					_this._showStartSplash();
				})
			}});
			tl.add(
				TweenMax.to(this.endSplash,0.25,{autoAlpha:1})
			);
			tl.add(
				TweenMax.to(score,3,{
					points: this.roundPoints,
					onUpdate: function() {
						finalScore.text( score.points << 0)
					}
				})
			);
		},
		_showQuestion: function() {
			if(this.roundQuestions.length === 0) {
				this._showEndSplash();
				return;
			}

			var _this = this;
			var rr = Math.random() * this.roundQuestions.length << 0;
			this.preguntaActual = this.roundQuestions.splice(rr, 1)[0];
			
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

			this.questionLabel.text("#" + String(_this.options.questionsPerGame - _this.roundQuestions.length));

			this.questionBox.find('#consigna').first().text(this.preguntaActual.consigna);

			var responder = function() {
				_this._processResponse($(this).find('p').first().text());
			}
			var hookRespuestas = function() {
				_this.respuesta1.on('click', responder);
				_this.respuesta2.on('click', responder);
				_this.respuesta3.on('click', responder);
				_this.questionStartTime = new Date();
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
					0.15
				)
			);
		},
		_processResponse: function(respuesta) {
			this.questionEndTime = new Date();
			this.respuesta1.off('click');
			this.respuesta2.off('click');
			this.respuesta3.off('click');
			var _this = this;
			var correcto = respuesta === this.preguntaActual.respuesta;

			var tiempo = this.questionEndTime - this.questionStartTime;
			var timePoints = this.options.secondsPerQuestion * 1000 - tiempo;
			if(timePoints < 0 || !correcto) {
				timePoints = 0;
			}
			var questionPoints = correcto ? this.options.scorePerQuestion : 0;

			this.roundPoints += timePoints;
			this.roundPoints += questionPoints;

			this.responseSplash.find('p.calificacion').first().text(correcto ? 'CORRECTO!' : 'INCORRECTO!');
			this.responseSplash.find('p.remate').first().text(this.preguntaActual.remate);

			var roundUpLabelQuestion = $('.roundUpLabelQuestion', this.roundUpDiv);
			var roundUpLabelTimebonus = $('.roundUpLabelTimebonus', this.roundUpDiv);
			var roundUpScoreTimebonus = $('.roundUpScoreTimebonus', this.roundUpDiv);
			var roundUpScoreQuestion = $('.roundUpScoreQuestion', this.roundUpDiv);
			var next = $('.cta', this.responseSplash);

			roundUpScoreQuestion.text("0");
			roundUpScoreTimebonus.text("0");

			TweenMax.set(this.responseSplash,{autoAlpha:1,scale:1});
			
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
				TweenMax.from(this.responseSplash,0.5,{y: -1000, autoAlpha:0, ease: Back.easeOut})
			);
			tl.add(TweenMax.set(this.roundUpDiv,{autoAlpha:1}));
			tl.add(TweenMax.staggerFrom([
				roundUpLabelQuestion,
				roundUpLabelTimebonus,
				roundUpScoreTimebonus,
				roundUpScoreQuestion
				],0.25,{autoAlpha:0, x: "+=100"},0.25),"+=1.5");
			if(questionPoints > 0) {
				var score = {points: 0};
				tl.add(
					TweenMax.to(score,3,{
						points: questionPoints,
						onUpdate: function() {
							roundUpScoreQuestion.text( score.points << 0)
						}
					})
				);
			}
			if(timePoints > 0) {
				var score2 = {bonusPoints: 0};
				tl.add(
					TweenMax.to(score2,3,{
						bonusPoints: timePoints,
						onUpdate: function() {
							roundUpScoreTimebonus.text( score2.bonusPoints << 0)
						}
					})
				);
			}
			tl.add(TweenMax.from(next,0.25,{autoAlpha:0}),"+=0.25");
		},
		_mezclarArray: function(o){ 
			for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x){}
			return o;
		},
		_showStartSplash: function() {
			this.slideShow.resume();
			TweenMax.staggerTo(
				[
					this.endSplash,
					this.respuesta1,
					this.respuesta2,
					this.respuesta3,
					this.responseSplash,
				],0.5,{autoAlpha:0}
			);
			TweenMax.set(this.startSplash,{scale:1,autoAlpha:0});
			TweenMax.to(this.startSplash,0.5,{autoAlpha:1});
		},
		_zOrder: function(boxesArray) {
			for(var ii=0; ii < boxesArray.length; ii++) {
				boxesArray[ii].css('z-index',ii + 20);
			}
		},
		_setupSlideshow: function() {
			var _this = this;
			this.slideShow = new TweenMax.to({id:0,v:0},5,{
				v:1,
				onRepeatParams: [this.background],
				onStart: function() {
					this.randong = ((Math.random() * 50) << 0) + 1;
					$('<img />').attr('src','images/fondos/'+this.randong+'.jpg');
				},
				onRepeat:function(img){
					var rr = this.randong;
					TweenMax.to(img,0.5,{alpha:0,yoyo: true, repeat:1, onRepeat:function(){
						img.attr('src','images/fondos/'+rr+'.jpg');
					}});
					this.randong = ((Math.random() * 50) << 0) + 1;
					$('<img />').attr('src','images/fondos/'+this.randong+'.jpg');
				},
				repeat: -1
			});
		},
		_setUpGameSpace: function() {
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
				_this.startGame();
				return false;
			});

			this.roundUpDiv = $('.roundUp',this.responseSplash);
			$('.roundUpLabelQuestion', this.roundUpDiv).text(this.roundUpLabelQuestion);
			$('.roundUpLabelTimebonus', this.roundUpDiv).text(this.roundUpLabelTimebonus);
			$('.roundUpLabelHeader', this.roundUpDiv).text(this.roundUpLabelHeader);
			this.questionBox.outerWidth(this.width);

			this._center(this.errorSplash, this.element);
			this._center(this.questionLabel, null, true);
			// this._center(this.responseSplash, null);

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
					_this.startGame();
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
		_showError: function(msg) {
			console.log('error: ' + msg);
			this.errorSplash.message.text(msg);
			TweenMax.set(this.errorSplash, {autoAlpha:1});
		},
		_center: function(client, container, horizontalOnly) {
			if(container === null || container === undefined) {
				container = client.parent();
			}
			var n = {
				top: horizontalOnly ? client.offset().top : (container.innerHeight() - client.outerHeight()) / 2,
				left: (container.innerWidth() - client.outerWidth()) /2
			}
			client.offset(n);
		},
		_crearBarraInfo: function() {
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
				.text(this.options.hiScore)
				.css("color","yellow")
				.appendTo(this.hiScoreLabel);

			this.gameTitle = $('<div class="title" />')
				.text(this.options.labels.title)
				.css({
					width: '36%',
					'text-align': 'center'
				}).appendTo(this.statusBar);

			this.scoreLabel = $('<div class="label" />')
				.text(this.options.labels.playerScore)
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