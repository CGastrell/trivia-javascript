(function($) {
	$.widget("cg.trivia",{
		options: {
			preguntas: [],
			hiScore: 0
		},
		_create: function(){
			this.element.html("");
			this.statusBar = $('<div />')
				.css({
					"background": "black",
					color: "white"
				});

			this.hiScoreLabel = $('<span />')
				.text("Record del día: ")
				.css({
					display: "block",
					width: "30%"
				})
				.appendTo(this.statusBar);

			this.hiScoreValue = $('<span />')
				.text(this.options.hiScore)
				.css('color','yellow')
				.appendTo(this.hiScoreLabel);
				
			this.statusBar.appendTo(this.element);
		}
	});
})(jQuery);