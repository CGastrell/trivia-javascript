(function($) {
	$.widget("cg.trivia",{
		widgetEventPrefix: "trivia:",
		width: 0,
		height: 0,
		roundPoints: 0,
		questionStartTime: 0,
		questionEndTime: 0,
		tweenRoot: null,
		options: {
			useTemplate: true,
			useStore: true,
			questions: [],
			hiScore: "000000",
			scorePerQuestion: 5000,
			secondsPerQuestion: 10,
			timeBonus: true,
			questionsPerGame: 10,
			questionsArrayName: 'questions',
			questionsFileUrl: "",
			mindTheHiScore: true,
			startingPoints: "0",
			labels: {
				hiScore: "Hi Score: ",
				title: "Trivia JS",
				playerScore: "Round Up: ",
				roundUpHeader: "Score",
				roundUpQuestion: "Knowledge:",
				roundUpTimebonus: "Time bonus:",
				roundUpSum: 'Total:',
				responseOkText: "RIGHT ON!",
				responseFailText: "FAIL!",
				nextQuestion: 'Next',
				chooseOption: 'Choose wisely...',
				startGame: 'Start',
				newRecord: 'New Hi Score!',
				finalScore: 'Final Score: ',
				gameEnded: "Restart"
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
			var _this = this;
			
			$.when(
				this._loadQuestions()
			).then(
				function(data){
					if(data[_this.options.questionsArrayName] === undefined) {
						_this._triggerError('Item "'+_this.options.questionsArrayName+'" not found in provided questions file');
						return false;
					}
					_this.options.questions = data[_this.options.questionsArrayName].slice();
					_this._showStartSplash();
				},
				function(){
					if( $.isEmptyObject(_this.options.questions) ) {
						_this._triggerError('Could not load a questions file and no questions were supplied in options:questions');
					}else{
						_this._showStartSplash();
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
			this.roundQuestions = [];
			this.currentQuestion = null;
			this.roundPoints = 0;
			var _this  = this;
			var q = this.options.questions.slice();
			var r;
			for (var ii = 0; ii < this.options.questionsPerGame; ii++) {
				r = Math.random() * q.length << 0;
				this.roundQuestions.push(q.splice(r,1)[0]);
			}
			this._trigger('gameStarted',null,{questions:this.roundQuestions,instance:this});
			this.tweenRoot = TweenMax.to(this.startSplash,0.5,{
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
					_this._trigger('gameRestart',null,{score:_this.roundPoints});
					_this._showStartSplash();
				})
			}});
			this._trigger('gameEnded',null,{score:this.roundPoints,instance:this});
			tl.add(
				TweenMax.to(this.endSplash,0.25,{autoAlpha:1})
			);
			if(this.roundPoints > this.options.hiScore && this.options.mindTheHiScore) {
				//new record!
				this.options.hiScore = this.roundPoints
				if(this.options.useStore) {
					store.set('hiScore',this.roundPoints);
				}
				TweenMax.set(this.newRecordBadge,{autoAlpha:1});
				tl.add(
					TweenMax.to(score,2,{
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
					TweenMax.to(score,2,{
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
			this.currentQuestion = this.roundQuestions.splice(rr, 1)[0];
			
			TweenMax.set([
				this.questionBadge,
				this.option1,
				this.option2,
				this.option3
			], {autoAlpha: 1, scale: 1});

			var respuestas = this._shuffleArray(this.currentQuestion.options);

			this.option1.find('p').first().html(respuestas[0]);
			this.option2.find('p').first().html(respuestas[1]);
			this.option3.find('p').first().html(respuestas[2]);

			this.questionBadge.html("#" + String(_this.options.questionsPerGame - _this.roundQuestions.length));

			this.questionBox.find('#question').first().html(this.currentQuestion.question);
			//all set, trigger!
			this._trigger('beforeShowQuestion',null,{question:this.currentQuestion,instance:this});
			var handleAnswer = function() {
				_this._processResponse($(this).find('p').first().html());
			}
			var hookRespuestas = function() {
				_this.option1.on('click', handleAnswer);
				_this.option2.on('click', handleAnswer);
				_this.option3.on('click', handleAnswer);
				_this.questionStartTime = new Date();
				_this._trigger('afterShowQuestion',null,{question:this.currentQuestion,instance:_this});
			}

			var tl = new TimelineMax({onComplete:hookRespuestas});
			tl.add(TweenMax.from(this.questionBadge, 1, {delay: 0.25, autoAlpha: 0, scale:3, ease: Power4.easeIn}));
			tl.add(TweenMax.to(this.questionBox,0.75,{delay: 0, autoAlpha:1}));
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
			this.tweenRoot = tl;
		},
		_showRoundUpSplash: function(questionPoints, timePoints, customCaption) {
			var _this = this;
			var caption = questionPoints > 0 ? this.options.labels.responseOkText : this.options.labels.responseFailText;
			var startingPoints = this.options.startingPoints;
			caption = customCaption || caption;
			this.responseSplash.find('p.result').first().html(caption);
			this.responseSplash.find('p.resultTip').first().html(this.currentQuestion.answerTip);

			var roundUpLabelHeader = $('.roundUpLabelHeader', this.roundUpDiv);
			var roundUpLabelQuestion = $('.roundUpLabelQuestion', this.roundUpDiv);
			var roundUpScoreQuestion = $('.roundUpScoreQuestion', this.roundUpDiv).html(startingPoints);
			if(this.options.timeBonus) {
				var roundUpLabelTimebonus = $('.roundUpLabelTimebonus', this.roundUpDiv);
				var roundUpScoreTimebonus = $('.roundUpScoreTimebonus', this.roundUpDiv).html(startingPoints);
				var roundUpLabelSum = $('.roundUpLabelSum', this.roundUpDiv);
				var roundUpScoreSum = $('.roundUpScoreSum', this.roundUpDiv).html(startingPoints);
			}
			var next = $('.nextContainer', this.responseSplash);

			TweenMax.set(this.responseSplash,{autoAlpha:1,scale:1});
			this._trigger('beforeShowRoundSplash',null,{instance:this});
			var hookNextQuestion = function() {
				_this.responseSplash.on('click',function(){
					_this.responseSplash.off('click');
					_this._trigger('afterShowRoundSplash',null,{instance:this});
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
			if(this.options.timeBonus) {
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
			}
			tl.add(TweenMax.from(next,0.5,{autoAlpha:0}),"+=0.25");
			this.tweenRoot = tl;
		},
		respond: function(answer, forceWrong, caption) {
			this._processResponse(answer, forceWrong, caption);
		},
		_processResponse: function(answer, forceWrong, caption) {
			this.questionEndTime = new Date();
			this.option1.off('click');
			this.option2.off('click');
			this.option3.off('click');
			var correcto = forceWrong ? false : answer === this.currentQuestion.correctAnswer;

			var tiempo = this.questionEndTime - this.questionStartTime;
			var timePoints = this.options.secondsPerQuestion * 1000 - tiempo;
			if(timePoints < 0 || !correcto || !this.options.timeBonus) {
				timePoints = 0;
			}
			var questionPoints = correcto ? this.options.scorePerQuestion : 0;

			this.roundPoints += timePoints;
			this.roundPoints += questionPoints;
			this._trigger('answered',null,{
				correct:correcto,
				answer:answer,
				question:this.currentQuestion,
				score:{
					question: questionPoints,
					timebonus: timePoints,
					subtotal: this.roundPoints
				}
			});
			this._showRoundUpSplash(questionPoints,timePoints, caption);
		},
		_shuffleArray: function(o){ 
			for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x){}
			return o;
		},
		_showStartSplash: function() {
			var _this = this;
			var tl = new TimelineMax({onComplete: function(){
				_this._trigger('gameReady',null,{instance:_this});
			}});

			tl.staggerTo(
				[
					this.endSplash,
					this.option1,
					this.option2,
					this.option3,
					this.responseSplash,
					this.newRecordBadge
				],0.5,
				{
					autoAlpha:0
				},0.25);
			tl.set(_this.startSplash,{scale:1,autoAlpha:0});
			tl.to(_this.startSplash,0.5,{autoAlpha:1});
			this.tweenRoot = tl;
		},
		_setUpGameSpace: function() {
			if(!this.options.useTemplate) {
				this._buildGameSpace();
			}
			var _this = this;
			this.gameSpace = $('#gameSpace', this.element);
			$('span.hiScoreLabel', "#hiScoreBox").html(this.options.labels.hiScore);
			$('#hiScore', "#hiScoreBox").text(this.options.hiScore);

			this.background = $('#background', this.gameSpace);
			this.questionBox = $('#questionBox', this.gameSpace);
			$('p.chooseOptionLabel', this.questionBox).html(this.options.labels.chooseOption);

			this.questionBadge = $('#questionBadge', this.gameSpace);
			this.option1 = $('#option1', this.gameSpace);
			this.option2 = $('#option2', this.gameSpace);
			this.option3 = $('#option3', this.gameSpace);

			this.responseSplash = $('#responseSplash', this.gameSpace);

			this.startSplash = $('#startSplash', this.gameSpace);
			$('p.startLabel', this.startSplash).html(this.options.labels.startGame);
			$('.title', this.startSplash).html(this.options.labels.title);

			this.endSplash = $('#endSplash', this.gameSpace);
			this.newRecordBadge = $('#newHiScoreBadge', this.endSplash);
			$('.finalScoreLabel', this.endSplash).html(this.options.labels.finalScore);
			$('p.newHiScoreLabel',this.newRecordBadge).html(this.options.labels.newRecord);
			$('p.endGameLabel', this.endSplash).html(this.options.labels.gameEnded);

			this.roundUpDiv = $('.roundUp',this.responseSplash);
			$('.roundUpLabelHeader', this.roundUpDiv).html(this.options.labels.roundUpHeader);
			$('.roundUpLabelQuestion', this.roundUpDiv).html(this.options.labels.roundUpQuestion);
			if(this.options.timeBonus) {
				$('.roundUpLabelTimebonus', this.roundUpDiv).html(this.options.labels.roundUpTimebonus);
				$('.roundUpLabelSum', this.roundUpDiv).html(this.options.labels.roundUpSum);
			}
			$('p.nextLabel', this.responseSplash).html(this.options.labels.nextQuestion);

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

			this._trigger('gamespaceReady', null, {instance:this});

			this.startSplash.click(function(){
				_this.startGame();
				return false;
			});
		},
		_buildGameSpace: function() {
			var _this = this;
			this.element.html("");
			this.gameSpace = $('<div id="gameSpace" />')
				.appendTo(this.element);

			this.gameSpace.append(
				$('<div id="hiScoreBox" />')
					.append('<span class="hiScoreLabel" />')
					.append('<span id="hiScore" />')
			);

			this.questionBox = $('<div id="questionBox" />')
				.append('<p id="question" />')
				.append('<p class="chooseOptionLabel" />')
				.appendTo(this.gameSpace);

			this.questionBadge = $('<div id="questionBadge" />')
				.appendTo(this.gameSpace);

			// this.optionsContainer = $('<div id="optionsContainer" />')
				// .appendTo(this.gameSpace);
			this.option1 = $('<div id="option1" />')
				.append('<p />')
				.appendTo(this.gameSpace);
			this.option2 = $('<div id="option2" />')
				.append('<p />')
				.appendTo(this.gameSpace);
			this.option3 = $('<div id="option3" />')
				.append('<p />')
				.appendTo(this.gameSpace);

			var roundUp = $('<div class="roundUp" />');
			roundUp.append('<p class="roundUpLabelHeader" />');
			roundUp.append('<span class="roundUpLabelQuestion" />');
			roundUp.append('<span class="roundUpScoreQuestion" />');
			if(this.options.timeBonus) {
				roundUp.append('<span class="roundUpLabelTimebonus" />');
				roundUp.append('<span class="roundUpScoreTimebonus" />');
				roundUp.append('<span class="roundUpLabelSum" />');
				roundUp.append('<span class="roundUpScoreSum" />');
			}

			this.responseSplash = $('<div id="responseSplash" />')
				.append('<p class="result" />')
				.append('<p class="resultTip" />')
				.append(roundUp)
				.append('<div class="nextContainer"><p class="nextLabel" /></div>')
				.appendTo(this.gameSpace);

			this.startSplash = $('<div id="startSplash" />')
				.append('<div class="title" />')
				.append('<p class="startLabel" />')
				.appendTo(this.gameSpace);

			this.endSplash = $('<div id="endSplash" />')
				.append('<div class="finalScoreLabel" />')
				.append('<div class="finalScore" />')
				.append($('<div id="newHiScoreBadge" />').append('<p class="newHiScoreLabel" />'))
				.append($('<div id="endButton" />').append('<p class="endGameLabel" />'))
				.appendTo(this.gameSpace);

			this._trigger('gamespaceBuilt', null, this);
		},
		_triggerError: function(msg) {
			var err = {
				message: msg
			}
			this._trigger('error',err);
			console.log('error: ' + msg);
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