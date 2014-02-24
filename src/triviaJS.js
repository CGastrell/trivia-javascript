(function($) {
	$.widget("cg.trivia",{
		widgetEventPrefix: "trivia:",
		width: 0,
		height: 0,
		roundPoints: 0,
		questionStartTime: 0,
		questionEndTime: 0,
		options: {
			useTemplate: true,
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
				hiScore: "Record del día: ",
				title: "Geo Trivia IGN",
				playerScore: "PUNTOS: ",
				roundUpHeader: "Puntos",
				roundUpQuestion: "Respuesta correcta:",
				roundUpTimebonus: "Bonus por tiempo:",
				roundUpSum: 'Total:',
				responseOkText: "CORRECTO!",
				responseFailText: "INCORRECTO!",
				nextQuestion: 'Continuar',
				chooseOption: 'Elegí tu respuesta...',
				startGame: 'Comenzar',
				newRecord: 'Record del Día!',
				finalScore: 'Tu puntaje final es: '
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
						_this._triggerError('no se encontro el item "preguntas"');
						return false;
					}
					_this.options.questions = data[_this.options.questionsArrayName].slice();
					_this._showStartSplash();
				},
				function(){
					if( $.isEmptyObject(_this.options.questions) ) {
						_this._triggerError('no se pudo cargar el archivo de preguntas y no se suministraron preguntas');
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
				if(this.options.useStore) {
					store.set('hiScore',this.roundPoints);
				}
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
				this.questionBadge,
				this.option1,
				this.option2,
				this.option3
			], {autoAlpha: 1, scale: 1});

			var respuestas = this._shuffleArray(this.preguntaActual.opciones);

			this.option1.find('p').first().text(respuestas[0]);
			this.option2.find('p').first().text(respuestas[1]);
			this.option3.find('p').first().text(respuestas[2]);

			this.questionBadge.text("#" + String(_this.options.questionsPerGame - _this.roundQuestions.length));

			this.questionBox.find('#question').first().text(this.preguntaActual.consigna);

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
			tl.add(TweenMax.from(this.questionBadge, 1.5, {delay: 0.25, autoAlpha: 0, scale:3, ease: Power4.easeIn}));
			tl.add(TweenMax.to(this.background,0.5,{
				yoyo:true,
				repeat:1,
				autoAlpha:0,
				onStart: function(){
					$('<img />').attr('src','images/fondos/'+_this.preguntaActual.id + '.jpg');
				},
				onRepeat: function(){
					_this.background.attr('src', 'images/fondos/'+_this.preguntaActual.id + '.jpg');
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
						this.questionBadge,
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
		_setupSlideshow: function() {
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
			if(!this.options.useTemplate) {
				this._buildGameSpace();
			}
			var _this = this;
			this.gameSpace = $('#gameSpace', this.element);
			$('span.hiScoreLabel', "#hiScoreBox").text(this.options.labels.hiScore);
			$('#hiScore', "#hiScoreBox").text(this.options.hiScore);

			this.background = $('#background', this.gameSpace);
			this.questionBox = $('#questionBox', this.gameSpace);
			$('p.chooseOptionLabel', this.questionBox).text(this.options.labels.chooseOption);

			this.questionBadge = $('#questionBadge', this.gameSpace);
			this.option1 = $('#option1', this.gameSpace);
			this.option2 = $('#option2', this.gameSpace);
			this.option3 = $('#option3', this.gameSpace);

			this.responseSplash = $('#responseSplash', this.gameSpace);

			this.startSplash = $('#startSplash', this.gameSpace);
			$('p.startLabel', this.startSplash).text(this.options.labels.startGame);
			$('.title', this.startSplash).text(this.options.labels.title);

			this.endSplash = $('#endSplash', this.gameSpace);
			this.newRecordBadge = $('#newHiScoreBadge', this.endSplash);
			$('.finalScoreLabel', this.endSplash).text(this.options.labels.finalScore);
			$('p.newHiScoreLabel',this.newRecordBadge).text(this.options.labels.newRecord);

			this.roundUpDiv = $('.roundUp',this.responseSplash);
			$('.roundUpLabelQuestion', this.roundUpDiv).text(this.options.labels.roundUpQuestion);
			$('.roundUpLabelTimebonus', this.roundUpDiv).text(this.options.labels.roundUpTimebonus);
			$('.roundUpLabelHeader', this.roundUpDiv).text(this.options.labels.roundUpHeader);
			$('.roundUpLabelSum', this.roundUpDiv).text(this.options.labels.roundUpSum);
			$('p.nextLabel', this.responseSplash).text(this.options.labels.nextQuestion);

			TweenMax.set([
				this.endSplash,
				this.newRecordBadge,
				this.startSplash,
				this.questionBadge,
				this.questionBox,
				this.option1,
				this.option2,
				this.option3,
				this.responseSplash
			],{autoAlpha:0});

			this._trigger('gameSpaceReady', null, this);

			this.startSplash.click(function(){
				_this.startGame();
				return false;
			});
		},
		_buildGameSpace: function() {
			var _this = this;
			this.html("");
			this.gameSpace = $('<div id="gameSpace" />')
				.appendTo(this.element);

			this.gameSpace.append(
				$('<div id="hiScoreBox" />')
					.append('<span class="hiScoreLabel" />')
					.append('<span id="hiScore" />')
			);

			this.questionBox = $('<div id="questionBox" />')
				.append('<p class="chooseOptionLabel" />')
				.appendTo(this.gameSpace);

			this.questionBadge = $('<div id="questionBadge" />')
				.appendTo(this.gameSpace);

			// this.optionsContainer = $('<div id="optionsContainer" />')
				// .appendTo(this.gameSpace);
			this.option1 = $('<div id="option1" />')
				.appendTo(this.gameSpace);
			this.option2 = $('<div id="option2" />')
				.appendTo(this.gameSpace);
			this.option3 = $('<div id="option3" />')
				.appendTo(this.gameSpace);

			var roundUp = ('<div class="roundUp" />');
			roundUp.append('<p class="roundUpLabelHeader" />');
			roundUp.append('<span class="roundUpLabelQuestion" />');
			roundUp.append('<span class="roundUpScoreQuestion" />');
			roundUp.append('<span class="roundUpLabelTimebonus" />');
			roundUp.append('<span class="roundUpScoreTimebonus" />');
			roundUp.append('<span class="roundUpLabelSum" />');
			roundUp.append('<span class="roundUpScoreSum" />');

			this.responseSplash = $('<div id="responseSplash" />')
				.append('<p class="result" />')
				.append('<p class="resultTip" />')
				.append(roundUp)
				.append('<p class="nextLabel" />')
				.appendTo(this.gameSpace);

			this.startSplash = $('<div id="startSplash" />')
				.append('<div class="title" />')
				.append('<p class="startLabel" />')
				.appendTo(this.element);
				
			this.endSplash = $('<div id="endSplash" />').appendTo(this.element);

			this._trigger('gamespace_built', null, this);
		},
		_triggerError: function(msg) {
			var err = {
				message: msg
			}
			this._trigger('error',err);
			// console.log('error: ' + msg);
			// this.errorSplash.message.text(msg);
			// TweenMax.set(this.errorSplash, {autoAlpha:1});
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
		}
	});
})(jQuery);