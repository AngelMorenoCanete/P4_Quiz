/*
*	Array con todos los quizzes existentes.
*/
exports.quizzes = [
	{
		question: "Capital de Italia",
		answer: "Roma"
	},
	{
		question: "Capital de Francia",
		answer: "París"
	},
	{
		question: "Capital de España",
		answer: "Madrid"
	},
	{
		question: "Capital de Portugal",
		answer: "Lisboa"
	}
];

const fs = require("fs");

//Nombre del fichero donde se guardan las preguntas.
//Es un fichero de texto con el JSON de quizzes.
const DB_FILENAME = "quizzes.json";

/*
*	Carga las preguntas guardadas en el fichero.
*
*	Este método carga el contenido del fichero DB_FILENAME en la variable
*	quizzes. El contenido de ese fichero está en formato JSON.
*	La primera vez que se ejecute este método, el fichero DB_FILENAME no
*	existe, y se producirá el error ENOENT. En este caso se salva el
*	contenido inicial almacenado en quizzes.
*	Si se produce otro tipo de error, se lanza una excepción que abortará 
*	la ejecución del programa.
*/
const load = () => {
	fs.readFile(DB_FILENAME, (err, data) => {
		if(err){
			//La primera vez no existe el fichero
			if(err.code === "ENOENT"){
				save(); //valores iniciales
				return;
			}
			throw err;
		}
		let json = JSON.parse(data);
		if(json){
			quizzes = json;
		}
	});
};

/*
*	Guarda las preguntas en el fichero.
*
*	Guarda en formato JSON el valor de quizzes en el fichero DB_FILENAME.
*	Si se produce algún tipo de error, se lanza una excepción que abortará
*	la ejecución del programa.
*/
const save = () => {
	fs.writeFile(DB_FILENAME,
		JSON.stringify(quizzes),
		err => {
			if(err) throw err;
		}
	);
};

/*
*	Devuelve el número total de quizzes existentes.
*/
exports.count = () => quizzes.length;


/*
*	Añade un nuevo quizz.
*/
exports.add = (question, answer) => {
	quizzes.push({
		question: (question || "").trim(),
		answer: (answer || "").trim()
	});
	save();
};

/*
*	Actualiza el quiz situada en la posición index.
*/
exports.update = (id, question, answer) => {
	const quiz = quizzes[id];
	if (typeof quiz === "undefined"){
		throw new Error('El valor del parámetro id no es válido.');
	}
	quizzes.splice(id, 1, {
		question: (question || "").trim(),
		answer: (answer || "").trim()
	});
	save();
};

/*
*	Devuelve todos los quizzes existentes.
*/
exports.getAll = () => JSON.parse(JSON.stringify(quizzes));

/*
*	Devuelve un clon del quizz almacenado en la posición dada.
*/
exports.getByIndex = id => {
	const quiz = quizzes[id];
	if(typeof quiz === "undefined"){
		throw new Error('El valor del parámetro id no es válido.');
	}
	return JSON.parse(JSON.stringify(quiz));
};

/*
*	Elimina el quiz situado en la posición dada.
*/
exports.deleteByIndex = id => {
	const quiz = quizzes[id];
	if(typeof quiz === "undefined"){
		throw new Error('El valor del parámetro id no es válido.');
	}
	quizzes.splice(id, 1);
	save();
};

//Carga los quizzes almacenados en el fichero.
load();