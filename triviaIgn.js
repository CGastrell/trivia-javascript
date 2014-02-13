(function($) {
	$.widget("cg.trivia",{
		options: {
			preguntas: [],
			hiScore: 0
		},
		_create: function(){
			this.element.html("");
			this.buildStatusBar();
		},
		buildStatusBar: function() {
			this.statusBar = $('<div id="statusBar" />')
				.css({
					"background": "black",
					color: "white"
				});

			this.hiScoreLabel = $('<span />')
				.text("Record del día: ")
				.css({
					display: "inline-block",
					width: "30%",
					'margin-left': '2%'
				})
				.appendTo(this.statusBar);
			this.hiScoreValue = $('<span />')
				.text(this.options.hiScore)
				.appendTo(this.hiScoreLabel);

			this.gameTitle = $('<span />')
				.text("Geo Trivia")
				.css({
					display: 'inline-block',
					width: '36%',
					'text-align': 'center'
				}).appendTo(this.statusBar);

			this.scoreLabel = $('<span />')
				.text('Puntaje: ')
				.css({
					display: 'inline-block',
					width: '30%',
					'text-align': 'right',
					'margin-right': '2%'
				}).appendTo(this.statusBar);
			this.scoreValue = $('<span />')
				.text("0")
				.css({
					color: 'yellow'
				}).appendTo(this.scoreLabel);
				
			this.statusBar.appendTo(this.element);
		}
	});
})(jQuery);