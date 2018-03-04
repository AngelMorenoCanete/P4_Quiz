const {log, biglog, errorlog, colorize} = require("./out");

const model = require('./model');

exports.helpCmd = rl => {
	log("Comandos:");
  	log("	h|help - Muestra esta ayuda.");
  	log("	list - Lista los quizzes existentes.");
  	log("	show <id> - Muestra la pregunta y la respuesta al quiz indicado.");
  	log("	add - Añade un nuevo quiz interactivamente.");
  	log("	delete <id> - Borra el quiz indicado.");
  	log("	edit <id> - Edita el quiz indicado.");
  	log("	test <id> - Prueba el quiz indicado.");
  	log("	p|play - Juega a preguntar aleatoriamente todos los quizzes.");
 	log("	credits - Créditos.");
  	log("	q|quit - Sale del programa.");
  	rl.prompt();
};

exports.quitCmd = rl => {
	rl.close();
	rl.prompt();
};

exports.addCmd = rl => {
	rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
		rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {
			model.add(question, answer);
			log(` ${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
			rl.prompt();
		});
	});
	
};

exports.listCmd = rl => {
	model.getAll().forEach((quiz, id) => {
		log(`  [${colorize(id, 'magenta')}]: ${quiz.question}`);
	});
	rl.prompt();
};

exports.playCmd = rl => {
	let score = 0;
	let toBeResolved = [];
	/*
	model.getAll().forEach((quiz) => {
		toBeResolved.push(quiz);
	});
	*/	
	for(i=0; i < model.count(); i++){
		toBeResolved.push(model.getByIndex(i));
	}	
	playOne(toBeResolved, score, rl);
};

const playOne = (toBeResolved, score, rl) => {
	try{
		if(toBeResolved.length === 0){
			log("No hay nada más que preguntar.");
			log("Fin del examen. Aciertos:");
			biglog(score, 'magenta');
			rl.prompt();
		}else{ //Aún quedan preguntas por contestar
			let id = parseInt(Math.random()*toBeResolved.length);
			//const quiz = model.getByIndex(id);
			const quiz = toBeResolved[id]; 
			rl.question(colorize(quiz.question + '? ', 'red'), answer => {
				if(answer.trim().toLowerCase() === quiz.answer.trim().toLowerCase()){
					toBeResolved.splice(id, 1);
					score++;
					log(`CORRECTO - Lleva ${score} aciertos.`);
					playOne(toBeResolved, score, rl);
				}else{
					log("INCORRECTO.");
					log("Fin del examen. Aciertos:");
					biglog(score, 'magenta');
					rl.prompt();
				}
				
			});
		}
	}catch(error){
		errorlog(error.message);
		rl.prompt();
	}
};

exports.showCmd = (rl, id) => {
	if(typeof id === "undefined"){
		errorlog(`Falta el parámetro id.`);
	}else{
		try{
			const quiz = model.getByIndex(id);
			log(` [${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
		}catch(error){
			errorlog(error.message);
		}
	}
	rl.prompt();
};

exports.testCmd = (rl, id) => {
	if(typeof id === "undefined"){
		errorlog(`Falta el parámetro id.`);
		rl.prompt();
	}else{
		try{
			const quiz = model.getByIndex(id);

			rl.question(colorize(quiz.question + '? ', 'red'), answer => {
				if(answer.trim().toLowerCase() === quiz.answer.trim().toLowerCase()){
					log("Su respuesta es:");
					log("Correcta", "green");
					rl.prompt();
				}else{
					log("Su respuesta es:");
					log("Incorrecta", "red");
					rl.prompt();
				}
			});
		}catch(error){
			errorlog(error.message);
			rl.prompt();
		}
	}
	
};

exports.deleteCmd = (rl, id) => {
	if(typeof id === "undefined"){
		errorlog(`Falta el parámetro id.`);
	}else{
		try{
			model.deleteByIndex(id);
			
		}catch(error){
			errorlog(error.message);
		}
	}
	rl.prompt();
};

exports.editCmd = (rl, id) => {
	if(typeof id === "undefined"){
		errorlog(`Falta el parámetro id.`);
		rl.prompt();
	}else{
		try{
			const quiz = model.getByIndex(id);

			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);

			rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

				process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);

				rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {
					model.update(id, question, answer);
					log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
					rl.prompt();
				});
			});
		}catch(error){
			errorlog(error.message);
			rl.prompt();
		}
	}	
};

exports.creditsCmd = rl => {
	log("Autores de la práctica:");
    log("	Luis Cristóbal López García", "green");
    log("	Ángel Moreno Cañete", "green");
    rl.prompt();
};