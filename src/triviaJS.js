(function($) {
	$.widget("ign.trivia",{
		width: 0,
		height: 0,
		options: {
			questions: [],
			hiScore: "0000",
			labels: {
				hiScore: "TOP: ",
				title: "GeoTrivia",
				score: "PUNTOS: ",
				questionsUrl: ""
			},
			questionsArrayName: 'questions'
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
			this.element.html("");
			$.when(
				this.loadQuestions(function(data){
					// console.log(arguments);
					if(data[_this.options.questionsArrayName] === undefined) {
						_this._showError('could not find the questions array. questionsArrayName: '+_this.options.questionsArrayName);
						return false;
					}
					_this.options.questions = data[_this.options.questionsArrayName];
				})
			).done(
				this._buildStatusBar(),
				this._buildGameSpace()
			).fail(function(){
				_this._showError('could not load questions')
			});

		},
		loadQuestions: function(callback) {
			// if(this.options.questionsUrl === "")
			var _this = this;
			var d = $.Deferred(function(defer){
				$.getJSON(_this.options.questionsUrl).then(defer.resolve, defer.reject);
			}).promise();
			return d.done(callback);
		},
		_zOrder: function(boxesArray) {
			for(var ii=0; ii < boxesArray.length; ii++) {
				boxesArray[ii].css('z-index',ii + 20);
			}
		},
		_buildGameSpace: function() {

			this.gameSpace = $('<div id="gameSpace" />')
				.css({
					width: '100%',
					position: 'relative',
					height: this.height - this.statusBar.height(),
					background: "red"
				}).appendTo(this.element);

			this.questionBox = $('<div id="questionBox" />')
				.css({
					width: '100%',
					background: 'blue',
					position: 'absolute'
				})
				.hide().appendTo(this.gameSpace);
			this.questionLabel = $('<div id="questionLabel" />')
				.css({
					position: 'absolute',
					background: 'violet'
				})
				.hide().appendTo(this.gameSpace);


			this.optionsContainer = $('<div id="optionsContainer" />')
				.css({
					width: '100%',
					position: 'absolute',
					background: 'green'
				})
				.hide().appendTo(this.gameSpace);

			this.responseSplash = $('<div id="responseSplash" />')
				.css({
					position: 'absolute'
				})
				.hide().appendTo(this.gameSpace);

			this.startSplash = $('<div id="startSplash" />')
				.css({
					position: 'absolute'
				})
				.hide().appendTo(this.element);

			this.endSplash = $('<div id="endSplash" />')
				.css({
					position: 'absolute'
				})
				.hide().appendTo(this.element);

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
				.hide().appendTo(this.element).append($('<h1>ERROR!</h1>'));
			this.errorSplash.message = $('<p />').appendTo(this.errorSplash);

			this._center(this.element,this.errorSplash);
		},
		_showError: function(msg) {
			console.log('error: ' + msg);
			this.errorSplash.message.text(msg)
			this.errorSplash.show();
		},
		_center: function(container, client) {
			client.offset({
				top: (container.innerHeight() - client.outerHeight()) / 2,
				left: (container.innerWidth() - client.outerWidth()) /2
			});
			// console.log(client.offset());
		},
		_buildStatusBar: function() {
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
				.text(this.options.hiScore)
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