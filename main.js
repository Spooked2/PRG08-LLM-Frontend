//Wait for the window to load before doing anything
window.addEventListener('load', init);

//Variables
const apiUrl = 'http://localhost:8008/';
const decoder = new TextDecoder('utf-8');

let chatContainer;
let jokeContainer;
let messageForm;
let messageInputElement;
let chatHistory = [];

//Functions
function init() {

    //Get all the DOM elements we need
    chatContainer = document.getElementById('chatContainer');
    jokeContainer = document.getElementById('jokeContainer');
    messageForm = document.getElementById('messageForm');
    messageInputElement = document.getElementById('message');

    //Add an event to the message form so it can do stuff
    messageForm.addEventListener('submit', submitHandler);

    //Add an event listener to the joke button
    document.getElementById('jokeButton').addEventListener('click', generateJoke);

}

async function submitHandler(e) {

    //Make sure the form doesn't actually get posted
    e.preventDefault();

    const formData = new FormData(messageForm);
    const prompt = formData.get('message');

    messageInputElement.value = '';

    const messageElement = createMessageElement('human');
    messageElement.innerText = `${prompt}`;

    const body = {
        prompt,
        history: chatHistory
    }

    const reply = await genericFetch('POST', body);

    chatHistory.push(['human', prompt]);
    chatHistory.push(['ai', reply]);

}

async function generateJoke(e) {

    //Stop it from doing normal button things just in case
    e.preventDefault();

    const res = await genericFetch('GET');

    jokeContainer.innerText = res.funnyJoke ?? 'No jokes yet...';

}

async function genericFetch(method, body = null) {

    const fetchOptions = {
        method: method,
        mode: "cors",
        headers: {
            "Content-Type": 'application/json'
        }
    };

    if (body) {
        fetchOptions.body = JSON.stringify(body);
    }

    try {

        const res = await fetch(apiUrl, fetchOptions);

        if (method === 'POST') {

            return await handleStream(res);

        }

        return await res.json();

    } catch (error) {

        console.error(`Something went wrong: ${error.message}`);

        return false;

    }

}

async function handleStream(res) {

    const messageElement = createMessageElement('ai');

    const reader = res.body.getReader();

    for await (const chunk of readChunks(reader)) {
        messageElement.innerText += chunk;
    }

    return messageElement.innerText;

}

async function* readChunks(reader) {

    let result = await reader.read();

    while (!result.done) {
        yield decoder.decode(result.value, {stream: true});
        result = await reader.read();
    }

}

function createMessageElement(sender) {

    const messageElement = document.createElement("p");

    messageElement.classList.add(`${sender}Reply`);

    chatContainer.appendChild(messageElement);

    return messageElement;

}