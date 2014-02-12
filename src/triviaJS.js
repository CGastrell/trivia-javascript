;triviaJS = function(options){
	this.options = {
		preguntasPorRonda: 10,
		preguntas: [],
		triviafile: "",
		hiScore: 0
	}

	this.options = $.extend(this.options,options);
	var _this = this;

	this.cargarPreguntas().then(function() {
		console.log('preguntas loaded');
		return _this;
	}).fail(function(){
		console.log('fail');
	});
}
triviaJS.prototype.cargarPreguntas = function() {
	console.log('cargando... '+this.options.triviafile);
	return $.getJSON(this.options.triviafile, function(data,txt,xhr){
		console.log(data);
	});
}