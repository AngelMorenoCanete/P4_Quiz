const {log, biglog, errorlog, colorize} = require("./out");

const Sequelize = require('sequelize');

const {models} = require('./model');

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

/**
* Esta funcion convierte la llamada rl.question, que esta basada en callbacks, en una
* basada en promesas.
*
* Esta función devuelve una promesa que cuando se cumple, proporciona el texto introducido
* Entonces la llamada a then que hay que hacer la promesa devuelta sera:
*		.then(answer => {...})
*
* Tambien colorea en rojo el texto de la pregunta, elimina espacios de principio a fin
*
* @param rl Objeto readline usado para implementar el CLI
* @param text Pregunta que hay que hacerle al usuario
*/
const makeQuestion = (rl, text) => {
	return new Sequelize.Promise((resolve, reject) => {
		rl.question(colorize(text, 'red'), answer => {
			resolve(answer.trim());
		});
	});
};

exports.addCmd = rl => {
	makeQuestion(rl, ' Introduzca una pregunta: ')
	.then(q => {
		return makeQuestion(rl, ' Introduzca la respuesta: ')
		.then(a => {
			return {question: q, answer: a};
		});
	})
	.then((quiz) => {
		return models.quiz.create(quiz);
	})
	.then((quiz) => {
		log(`[${colorize('Se ha añadido', 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erróneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
	
};

exports.listCmd = rl => {
	models.quiz.findAll()
	.each(quiz => {
			log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

exports.playCmd = rl => {
	let score = 0;
	let toBeResolved = [];

	models.quiz.findAll()
	.each(quiz => {
		toBeResolved.push(quiz);	
	})
	.then(() => {
		playOne(toBeResolved, score, rl);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erroneo.');
		error.errors.forEach(({message})=> errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	}); 
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
			const quiz = toBeResolved[id];
			return makeQuestion(rl, `${quiz.question}? `)
			.then(answer => {
				if (answer.trim().toLowerCase() === quiz.answer.trim().toLowerCase()){
					score++;
					toBeResolved.splice(id, 1);
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

/**
* Esta función devuelve una promesa que:
* -Valida que se ha introducido un valor para el parámetro
* -convierte el parámetro en un número entero
* si todo va bien, la promesa se satisface y devuelve el valor id a usuario
*
* @param id Parámetro con el índice a valirdar.
*/

const validateId = id => {
	return new Sequelize.Promise((resolve, reject) => {
		if(typeof id === "undefined") {
			reject(new Error(`Falta el parámetro <id>,`));
		} else {
			id = parseInt(id);
			if(Number.isNaN(id)) {
				reject(new Error(`El valor del parámetro <id> no es un número.`));
			} else {
				resolve(id);
			}
		}
	});
};

exports.showCmd = (rl, id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if(!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

exports.testCmd = (rl, id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if(!quiz){
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		return makeQuestion(rl, `${quiz.question}? `)
		.then(answer => {
			if (answer.trim().toLowerCase() === quiz.answer.trim().toLowerCase()){
				log("Su respuesta es:");
				log("Correcta", "green");
				rl.prompt();
			} else {
				log("Su respuesta es:");
				log("Incorrecta", "red");
				rl.prompt();
			}
		});
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erroneo.');
		error.errors.forEach(({message})=> errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	}); 
	
};

exports.deleteCmd = (rl, id) => {
	validateId(id)
	.then(id => models.quiz.destroy({where: {id}}))
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

exports.editCmd = (rl, id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz){
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		process.stdout.isTTY && setTimeout(()=> {rl.write(quiz.question)}, 0);
		return makeQuestion(rl, 'Introduzca la pregunta: ')
		.then(q => {
			process.stdout.isTTY && setTimeout(()=> {rl.write(quiz.answer)}, 0);
			return makeQuestion(rl, 'Introduzca la respuesta: ')
			.then(a => {
				quiz.question = q;
				quiz.answer = a;
				return quiz;
			});
		});
	})
	.then(quiz => {
		return quiz.save();
	})
	.then(quiz => {
		log(`Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

exports.creditsCmd = rl => {
	log("Autores de la práctica:");
    log("	Luis Cristóbal López García", "green");
    log("	Angel Moreno Cañete", "green");
    rl.prompt();
};