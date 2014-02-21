(function($) {
	$.widget("ign.trivia",{
		width: 0,
		height: 0,
		roundPoints: 0,
		questionStartTime: 0,
		questionEndTime: 0,
		options: {
			useStore: true,
			questions: [],
			hiScore: "000000",
			scorePerQuestion: 5000,
			secondsPerQuestion: 10,
			questionsPerGame: 10,
			questionsArrayName: 'questions',
			questionsFileUrl: "",
			slideShowInterval: 5,
			labels: {
				hiScoreLabel: "Record del día: ",
				title: "Geo Trivia IGN",
				playerScore: "PUNTOS: ",
				roundUpLabelHeader: "Puntos",
				roundUpLabelQuestion: "Respuesta correcta:",
				roundUpLabelTimebonus: "Bonus por tiempo:",
				responseOkText: "CORRECTO!",
				responseFailText: "INCORRECTO!",
				nextQuestion: 'Continuar',
				roundUpLabelSum: 'Total:',
				chooseOptionLabel: 'Elegí tu respuesta...',
				startGameLabel: 'Comenzar',
				newRecordLabel: 'NUEVO RECORD'
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
			if(this.options.useStore) {
				this.options.hiScore = store.get('hiScore') ? store.get('hiScore') : this.options.hiScore;
			}
			this._setUpGameSpace();
			this._setupSlideshow();
			var _this = this;
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
			var recordScore = $('#hiScore',this.hiScoreBox);
			var tl = new TimelineMax({onComplete:function(){
				_this.endSplash.on('click',function(){
					_this.endSplash.off('click');
					_this._showStartSplash();
				})
			}});
			tl.add(
				TweenMax.to(this.endSplash,0.25,{autoAlpha:1})
			);
			if(this.roundPoints > this.options.hiScore) {
				//new record!
				store.set('hiScore',this.roundPoints);
				TweenMax.set(this.newRecordBadge,{autoAlpha:1});
				tl.add(
					TweenMax.to(score,3,{
						points: this.roundPoints,
						onUpdate: function() {
							finalScore.text( score.points << 0);
							recordScore.text( score.points << 0);
						}
					}),"+=1"
				);
				tl.add(
					TweenMax.from(this.newRecordBadge,1,{
						autoAlpha: 0,
						scale: 0.2,
						ease: Elastic.easeOut
					}),"-=2"
				);
			}else{
				tl.add(
					TweenMax.to(score,3,{
						points: this.roundPoints,
						onUpdate: function() {
							finalScore.text( score.points << 0);
						}
					})
				);
			}
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
				this.option1,
				this.option2,
				this.option3
			], {autoAlpha: 1, scale: 1});

			var respuestas = this._shuffleArray(this.preguntaActual.opciones);

			this.option1.find('p').first().text(respuestas[0]);
			this.option2.find('p').first().text(respuestas[1]);
			this.option3.find('p').first().text(respuestas[2]);

			this.questionLabel.text("#" + String(_this.options.questionsPerGame - _this.roundQuestions.length));

			this.questionBox.find('#consigna').first().text(this.preguntaActual.consigna);

			var responder = function() {
				_this._processResponse($(this).find('p').first().text());
			}
			var hookRespuestas = function() {
				_this.option1.on('click', responder);
				_this.option2.on('click', responder);
				_this.option3.on('click', responder);
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
						this.option1,
						this.option2,
						this.option3
					],
					0.25,
					{autoAlpha: 0,scale:0.2,ease: Back.easeOut, delay:1},
					0.15
				)
			);
		},
		_showRoundUpSplash: function(questionPoints, timePoints) {
			var _this = this;
			this.responseSplash.find('p.result').first().text(questionPoints > 0 ? this.options.labels.responseOkText : this.options.labels.responseFailText);
			this.responseSplash.find('p.resultTip').first().text(this.preguntaActual.remate);

			var roundUpLabelQuestion = $('.roundUpLabelQuestion', this.roundUpDiv);
			var roundUpLabelTimebonus = $('.roundUpLabelTimebonus', this.roundUpDiv);
			var roundUpScoreTimebonus = $('.roundUpScoreTimebonus', this.roundUpDiv);
			var roundUpScoreQuestion = $('.roundUpScoreQuestion', this.roundUpDiv);
			var roundUpLabelHeader = $('.roundUpLabelHeader', this.roundUpDiv);
			var roundUpLabelSum = $('.roundUpLabelSum', this.roundUpDiv);
			var roundUpScoreSum = $('.roundUpScoreSum', this.roundUpDiv);
			var next = $('.next', this.responseSplash);

			roundUpScoreQuestion.text("0");
			roundUpScoreTimebonus.text("0");
			roundUpScoreSum.text("0");

			TweenMax.set(this.responseSplash,{autoAlpha:1,scale:1});
			
			var hookNextQuestion = function() {
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
			var tl = new TimelineMax({onComplete:hookNextQuestion});
			tl.add(
				TweenMax.staggerTo(
					[
						this.questionBox,
						this.questionLabel,
						this.option1,
						this.option2,
						this.option3
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
			tl.add(TweenMax.from(roundUpLabelHeader,0.25,{autoAlpha:0}));
			tl.add(TweenMax.from(roundUpLabelQuestion,0.25,{autoAlpha:0, x: "+=100"}));
			tl.add(TweenMax.from(roundUpScoreQuestion,0.25,{autoAlpha:0}));
			if(questionPoints > 0) {
				var score = {points: 0};
				tl.add(
					TweenMax.to(score,1,{
						points: questionPoints,
						onUpdate: function() {
							roundUpScoreQuestion.text( score.points << 0)
						}
					})
				);
			}
			tl.add(TweenMax.from(roundUpLabelTimebonus,0.25,{autoAlpha:0, x: "+=100"}));
			tl.add(TweenMax.from(roundUpScoreTimebonus,0.25,{autoAlpha:0}));
			if(timePoints > 0) {
				var score2 = {bonusPoints: 0};
				tl.add(
					TweenMax.to(score2,1,{
						bonusPoints: timePoints,
						onUpdate: function() {
							roundUpScoreTimebonus.text( score2.bonusPoints << 0)
						}
					})
				);
			}
			tl.add(TweenMax.from(roundUpLabelSum,0.25,{autoAlpha:0, x: "+=100"}));
			tl.add(TweenMax.from(roundUpScoreSum,0.25,{autoAlpha:0}));
			if(timePoints + questionPoints > 0) {
				var score3 = {totalPoints: 0};
				tl.add(
					TweenMax.to(score3,1,{
						totalPoints: timePoints + questionPoints,
						onUpdate: function() {
							roundUpScoreSum.text( score3.totalPoints << 0)
						}
					})
				);
			}
			tl.add(TweenMax.from(next,0.5,{autoAlpha:0}),"+=0.25");
		},
		_processResponse: function(respuesta) {
			this.questionEndTime = new Date();
			this.option1.off('click');
			this.option2.off('click');
			this.option3.off('click');
			var correcto = respuesta === this.preguntaActual.respuesta;

			var tiempo = this.questionEndTime - this.questionStartTime;
			var timePoints = this.options.secondsPerQuestion * 1000 - tiempo;
			if(timePoints < 0 || !correcto) {
				timePoints = 0;
			}
			var questionPoints = correcto ? this.options.scorePerQuestion : 0;

			this.roundPoints += timePoints;
			this.roundPoints += questionPoints;

			this._showRoundUpSplash(questionPoints,timePoints);
		},
		_shuffleArray: function(o){ 
			for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x){}
			return o;
		},
		_showStartSplash: function() {
			this.slideShow.resume();
			TweenMax.staggerTo(
				[
					this.endSplash,
					this.option1,
					this.option2,
					this.option3,
					this.responseSplash,
					this.newRecordBadge
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
			if(this.options.slideShowInterval < 1) {
				this.slideShow = {
					resume: function(){},
					pause: function(){}
				}
				return;
			}
			this.slideShow = new TweenMax.to({id:0,v:0},this.options.slideShowInterval,{
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
			$('span.label', "#hiScoreBox").text(this.options.labels.hiScoreLabel);
			$('#hiScore', this.gameSpace).text(this.options.hiScore);
			this.background = $('#background', this.gameSpace);
			this.questionBox = $('#questionBox', this.gameSpace);
			$('p.label', this.questionBox).text(this.options.labels.chooseOptionLabel);
			this.questionLabel = $('#questionLabel > #questionBadge', this.gameSpace);
			this.option1 = $('#opcion1', this.gameSpace);
			this.option2 = $('#opcion2', this.gameSpace);
			this.option3 = $('#opcion3', this.gameSpace);
			this.responseSplash = $('#responseSplash', this.gameSpace);
			this.startSplash = $('#startSplash', this.gameSpace);
			$('p.label', this.startSplash).text(this.options.labels.startGameLabel);
			$('div.title', this.startSplash).text(this.options.labels.title);
			this.endSplash = $('#endSplash', this.gameSpace);
			this.newRecordBadge = $('#newHiScoreBadge', this.endSplash);
			this.newRecordBadge.text(this.options.labels.newRecordLabel);
			this.errorSplash = $('#errorSplash', this.gameSpace);
			this.errorSplash.message = $('p', this.errorSplash);


			this.roundUpDiv = $('.roundUp',this.responseSplash);
			$('.roundUpLabelQuestion', this.roundUpDiv).text(this.options.labels.roundUpLabelQuestion);
			$('.roundUpLabelTimebonus', this.roundUpDiv).text(this.options.labels.roundUpLabelTimebonus);
			$('.roundUpLabelHeader', this.roundUpDiv).text(this.options.labels.roundUpLabelHeader);
			$('.roundUpLabelSum', this.roundUpDiv).text(this.options.labels.roundUpLabelSum);
			$('p.label', this.responseSplash).text(this.options.labels.nextQuestion);
			this.questionBox.outerWidth(this.width);

			this._center(this.errorSplash, this.element);
			this._center(this.questionLabel, null, true);

			TweenMax.set([
				this.endSplash,
				this.newRecordBadge,
				this.startSplash,
				this.questionLabel,
				this.questionBox,
				this.option1,
				this.option2,
				this.option3,
				this.responseSplash,
				this.errorSplash
			],{autoAlpha:0});

			this.startSplash.click(function(e){
				_this.startGame();
				return false;
			});
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
			this.option1 = $('<div class="respuesta opcion1" data-index="0" />')
				.appendTo(this.gameSpace);
			this.option2 = $('<div class="respuesta opcion2" data-index="1" />')
				.appendTo(this.gameSpace);
			this.option3 = $('<div class="respuesta opcion3" data-index="2" />')
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
				this.option1,
				this.option2,
				this.option3,
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
	});
})(jQuery);