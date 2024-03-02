const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const fsPromises = require('fs').promises
const path = require('path')
require('dotenv').config()
const greetings = require('./chat/greetings')
const captions = require('./chat/captions').default


// create .env file and set bot_token with the Telegram token you receive from @BotFather
const token = process.env.bot_token
// figure out your telegram user id, add it to env vars too
const userId = process.env.user_id

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

const sleep = ms => new Promise(r => setTimeout(r, ms));

const picsFolder = path.join(__dirname, 'data', 'imgs')

const readPics = async () => {
  return await fsPromises.readdir(picsFolder)
}

function getNumberBetweenZeroAnd(max) {
  return getRandomNumber(0, max)
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const getNewSleepTime = () => {
  return getRandomNumber(twoMinutes, tenMinutes)
}

const getNewPictureFileStream = (files) => {
  if (!files) {
    throw new Error('Files not passed in')
  }
  
  let randomNumber = getNumberBetweenZeroAnd(files.length - 1).toString()
  let randomFileName = files[randomNumber]
  console.log("random file: ", randomFileName)

  // console.log("before filter", files)
  files = files.filter(el => el != randomFileName)
  // console.log("after filter", files)
  
  return {
    stream: fs.createReadStream(path.join(picsFolder, randomFileName)),
    files
  }
}

const halfSecond = 1000 / 2
const twoSecond = 1000 * 2
const oneMinute = 1000 * 60
const twoMinutes = 1000 * 60 * 2
const tenMinutes = 1000 * 60 * 10

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  console.log(msg)

  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, 'Received your message');
});

const startProgram = async () => {
  let pics = await readPics()
  
  bot.sendMessage(userId, greetings[0])
  while(true) {
    await sleep(twoSecond)
    let result = getNewPictureFileStream(pics)
    pics = result.files
    let newFile = result.stream
    const response = await bot.sendPhoto(userId, newFile)
    
    const newSleepTime = getNewSleepTime()
    console.log(`sleeping for ${newSleepTime / 1000} seconds`)
    await sleep(newSleepTime)
  }
}

const startVid = async () => {
  const videoStream = fs.createReadStream(path.join(__dirname, 'data', 'vids', 'vid1.mp4'))
  bot.sendVideo(userId, videoStream, {caption: captions[0]})
}
 
startProgram()
// startVid()