import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 3000;

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: {
    rejectUnauthorized: false // Adjust based on your SSL requirement
  }
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database', err.stack);
  } else {
    console.log('Database connected successfully');
  }
});

let totalCorrect = 0;
let currentQuestion = {};

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Ensure this directory structure matches your project

// GET home page
app.get('/', async (req, res) => {
  totalCorrect = 0;
  await nextQuestion();
  res.render('index.ejs', { question: currentQuestion });
});

// POST a new answer
app.post('/submit', async (req, res) => {
  let answer = req.body.answer.trim();
  let isCorrect = false;

  if (currentQuestion && currentQuestion.capital && currentQuestion.capital.toLowerCase() === answer.toLowerCase()) {
    totalCorrect++;
    isCorrect = true;
  }

  await nextQuestion();
  res.render('index.ejs', {
    question: currentQuestion,
    wasCorrect: isCorrect,
    totalScore: totalCorrect,
  });
});

async function nextQuestion() {
  try {
    const result = await db.query('SELECT * FROM capitals ORDER BY RANDOM() LIMIT 1');
    if (result.rows.length > 0) {
      currentQuestion = result.rows[0];
    } else {
      currentQuestion = { country: 'No data', capital: 'No data' };
    }
  } catch (err) {
    console.error('Error fetching the next question', err.stack);
    currentQuestion = { country: 'Error', capital: 'Error' };
  }
}

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});



