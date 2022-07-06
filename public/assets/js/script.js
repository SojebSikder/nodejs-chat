const charts = document.querySelectorAll(".chart");

charts.forEach(function (chart) {
  var ctx = chart.getContext("2d");
  var myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
      datasets: [
        {
          label: "# of Votes",
          data: [12, 19, 3, 5, 2, 3],
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(255, 206, 86, 0.2)",
            "rgba(75, 192, 192, 0.2)",
            "rgba(153, 102, 255, 0.2)",
            "rgba(255, 159, 64, 0.2)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
});

$(document).ready(function () {
  $(".data-table").each(function (_, table) {
    $(table).DataTable();
  });
});

/**
 * chat system, socket.io
 */

const form = document.querySelector("#chat-form");
const messageContainer = document.querySelector("#chat-message-list");
const chatTitleContainer = document.querySelector("#conversation-partner");
const loggedinUserId = "<%= loggedInUser.userid %>";
const loggedinUserName = "<%= loggedInUser.username %>";
let participant = null; // selected conversation participant object
let current_conversation_id; // selected conversation id
// socket initialization
const socket = io("<%= process.env.APP_URL %>");
// handle new/live incoming message from socket
socket.on("new_message", (data) => {
  // only respond if current conversation is open in any client
  if (data.message.conversation_id == current_conversation_id) {
    // message class
    const messageClass =
      data.message.sender.id === loggedinUserId
        ? "you-message"
        : "other-message";

    const senderAvatar = data.message.sender.avatar
      ? `<img src="./uploads/avatars/${data.message.sender.avatar}" alt="${data.message.sender.name}" />`
      : `<img src="./images/nophoto.png" alt="${data.message.sender.name}" />`;

    // message attachments
    let attachments = '<div class="attachments">';

    if (data.message.attachment && data.message.attachment.length > 0) {
      data.message.attachment.forEach((attachment) => {
        attachments += `<img src="./uploads/attachments/${attachment}" /> `;
      });
    }

    attachments += "</div>";

    let messageHTML;

    // do not show avatar for loggedin user
    if (data.message.sender.id == loggedinUserId) {
      messageHTML = `<div class="message-row ${messageClass}"><div class="message-content">
              <div class="message-text">${data.message.message}</div>
              ${attachments}
              <div class="message-time">${moment(
                data.message.date_time
              ).fromNow()}</div>
            </div></div>`;
    } else {
      messageHTML = `<div class="message-row ${messageClass}"><div class="message-content">
              ${senderAvatar}
              <div class="message-text">${data.message.message}</div>
              ${attachments}
              <div class="message-time">${moment(
                data.message.date_time
              ).fromNow()}</div>
            </div></div>`;
    }

    // append the inoming message to message area as last item
    document
      .querySelector("#chat-message-list > .message-row:first-child")
      .insertAdjacentHTML("beforeBegin", messageHTML);
  }
});

// get messages of a conversation
async function getMessages(conversation_id, current_conversation_name) {
  // messages failure toast
  const messagesFailureToast = new Toastify({
    text: "Error loading messages!",
    duration: 1000,
  });

  let response = await fetch(`/inbox/${conversation_id}`);
  const result = await response.json();

  if (!result.errors && result.data) {
    form.style.visibility = "visible";

    const { data, user, conversation_id } = result;

    console.log(data);

    participant = data.participant;
    current_conversation_id = conversation_id;

    if (data.messages) {
      let allMessages = "";

      if (data.messages.length > 0) {
        data.messages.forEach((message) => {
          let senderAvatar = message.sender.avatar
            ? `./uploads/avatars/${message.sender.avatar}`
            : "./images/nophoto.png";
          const messageClass =
            message.sender.id === loggedinUserId
              ? "you-message"
              : "other-message";
          const showAvatar =
            message.sender.id === loggedinUserId
              ? ""
              : `<img src="${senderAvatar}" alt="${message.sender.username}" />`;

          // message attachments
          let attachments = '<div class="attachments">';

          if (message.attachment && message.attachment.length > 0) {
            message.attachment.forEach((attachment) => {
              attachments += `<img src="./uploads/attachments/${attachment}" /> `;
            });
          }

          attachments += "</div>";

          // final message html
          let messageHTML = `<div class="message-row ${messageClass}"><div class="message-content">
                      ${showAvatar}
                      <div class="message-text">${message.text}</div>
                      ${attachments}
                      <div class="message-time">${moment(
                        message.date_time
                      ).fromNow()}</div>
                    </div></div>`;

          allMessages += messageHTML;
          messageContainer.innerHTML = allMessages;
        });
      } else if (data.messages.length === 0) {
        messageContainer.innerHTML = '<div class="message-row"></div>';
      }

      chatTitleContainer.textContent = current_conversation_name;
    }
  } else {
    messagesFailureToast.showToast();
  }
}

/**
 * test toastify
 */
class Toastify {
  constructor({ text, duration }) {
    this.text = text;
    this.duration = duration;
  }
  showToast() {
    const toast = document.getElementById("toast");
    toast.classList.add("toast");
    toast.classList.add("show");
    toast.innerHTML = this.text;
    setTimeout(() => {
      toast.remove();
    }, this.duration);
  }
}

// message sending
form.onsubmit = async function (event) {
  event.preventDefault();

  const sendMessageFailureToast = new Toastify({
    text: "Error sending message",
    duration: 1000,
  });

  // prepare the form data
  const formData = new FormData(form);
  formData.append("receiverId", participant.participant.id);
  formData.append("receiverName", participant.participant.username);
  // formData.append("avatar", participant.avatar || "");
  // formData.append("conversationId", current_conversation_id);
  formData.append("conversationId", participant.id);

  // send the request to server
  let response = await fetch("/inbox/send", {
    method: "POST",
    body: formData,
  });

  // get response
  let result = await response.json();

  if (!result.errors) {
    form.reset(); // reset the form
  } else {
    sendMessageFailureToast.showToast();
  }
};
