// Add a "Challenge" button to the problem page
function addChallengeButton() {
  const problemPage = document.querySelector('.problem-statement');
  if (!problemPage) return;

  const buttonContainer = document.createElement('div');
  buttonContainer.style.marginTop = '20px';

  const challengeButton = document.createElement('button');
  challengeButton.textContent = "Challenge This Problem";
  challengeButton.style.padding = '10px 20px';
  challengeButton.style.fontSize = '16px';
  challengeButton.style.cursor = 'pointer';
  challengeButton.style.backgroundColor = '#1f8dd6';
  challengeButton.style.color = '#fff';
  challengeButton.style.border = 'none';
  challengeButton.style.borderRadius = '5px';

  challengeButton.addEventListener('click', () => {
    const problemLink = window.location.href;
    chrome.runtime.sendMessage(
      {
        type: "CHALLENGE",
        problemLink: problemLink
      },
      (response) => {
        if (response.success) {
          alert("Challenge shared with your room!");
        } else {
          alert("Failed to share challenge: " + response.error);
        }
      }
    );
  });

  buttonContainer.appendChild(challengeButton);
  problemPage.insertBefore(buttonContainer, problemPage.firstChild);
}

// Display a countdown timer at the top of the page
function addCountdownTimer(roomId) {
  const timerContainer = document.createElement('div');
  timerContainer.id = 'countdown-timer';
  timerContainer.style.position = 'fixed';
  timerContainer.style.top = '10px';
  timerContainer.style.right = '10px';
  timerContainer.style.padding = '10px';
  timerContainer.style.backgroundColor = '#f8f9fa';
  timerContainer.style.border = '1px solid #ddd';
  timerContainer.style.borderRadius = '5px';
  timerContainer.style.zIndex = '1000';
  timerContainer.style.fontSize = '16px';
  timerContainer.style.fontWeight = 'bold';

  document.body.appendChild(timerContainer);

  let timerValue = 60; // Example: 1-minute countdown
  const updateTimer = () => {
    if (timerValue <= 0) {
      timerContainer.textContent = "Time's up!";
      clearInterval(timerInterval);
    } else {
      timerContainer.textContent = `Time Remaining: ${timerValue--}s`;
    }
  };

  const timerInterval = setInterval(updateTimer, 1000);

  chrome.runtime.sendMessage(
    {
      type: "SYNC_TIMER",
      roomId: roomId,
      timerValue: timerValue
    },
    (response) => {
      if (!response.success) {
        console.error("Failed to sync timer:", response.error);
      }
    }
  );

  updateTimer();
}

// Monitor problem submissions
function monitorSubmissions(roomId) {
  const submissionCheckInterval = setInterval(() => {
    const verdictElements = document.querySelectorAll('.submission-verdict');
    verdictElements.forEach((verdictElement) => {
      if (verdictElement.textContent.includes('Accepted')) {
        const username = document.querySelector('.caption a').textContent.trim();
        chrome.runtime.sendMessage(
          {
            type: "NOTIFY_SOLVE",
            roomId: roomId,
            username: username
          },
          (response) => {
            if (response.success) {
              console.log("Notification sent for", username);
              clearInterval(submissionCheckInterval); // Stop monitoring after success
            } else {
              console.error("Failed to notify:", response.error);
            }
          }
        );
      }
    });
  }, 3000); // Check every 3 seconds
}

// Inject features into the Codeforces page
function injectFeatures() {
  chrome.storage.local.get("roomId", (result) => {
    const roomId = result.roomId;
    if (!roomId) {
      console.log("No room active.");
      return;
    }

    addChallengeButton();
    addCountdownTimer(roomId);
    monitorSubmissions(roomId);
  });
}

// Run the script when the page is loaded
document.addEventListener('DOMContentLoaded', () => {
  injectFeatures();
});
