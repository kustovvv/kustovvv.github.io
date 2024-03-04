var tg;

document.addEventListener('DOMContentLoaded', function() {
    tg = window.Telegram.WebApp;
    chatId = tg.initDataUnsafe.user.id;
    var inputChatIdTest = document.getElementById('test-tg-chat-id');
    inputChatIdTest.value = chatId;
    get_existing_unavailable_time();
});


function get_existing_unavailable_time() {
    fetch('http://localhost:5000/get_existing_unavailable_time', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: tg.initDataUnsafe.user.id
        })
    })
    .then(response => response.json())
    .catch(error => console.error("Error:", error));
}
