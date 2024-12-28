// Elements from popup.html
const createRoomBtn = document.getElementById("create-room");
const joinRoomBtn = document.getElementById("join-room");
const roomIdInput = document.getElementById("room-id");
const currentRoomDiv = document.getElementById("current-room");
const currentChallengeDiv = document.getElementById("current-challenge");
const leaveRoomBtn = document.getElementById("leave-room");

// Helper function to update the UI
function updateUI(roomId) {
  if (roomId) {
    currentRoomDiv.textContent = `Current Room ID: ${roomId}`;
    currentChallengeDiv.textContent = "Loading current challenge...";
    chrome.storage.local.set({ roomId: roomId }, () => {
      console.log("Room ID saved:", roomId);
    });

    // Fetch current challenge
    chrome.runtime.sendMessage({ type: "GET_CURRENT_CHALLENGE", roomId }, (response) => {
      if (response.success && response.challenge) {
        currentChallengeDiv.textContent = `Current Challenge: ${response.challenge.problemLink}`;
      } else {
        currentChallengeDiv.textContent = "No active challenge.";
      }
    });
  } else {
    currentRoomDiv.textContent = "Not in a room";
    currentChallengeDiv.textContent = "";
    chrome.storage.local.remove("roomId");
  }
}

// Event listener: Create Room
createRoomBtn.addEventListener("click", () => {
  const roomName = prompt("Enter a name for the room:");
  if (roomName) {
    chrome.runtime.sendMessage({ type: "CREATE_ROOM", roomName }, (response) => {
      if (response.success) {
        alert(`Room created! Room ID: ${response.roomId}`);
        updateUI(response.roomId);
      } else {
        alert(`Failed to create room: ${response.error}`);
      }
    });
  }
});

// Event listener: Join Room
joinRoomBtn.addEventListener("click", () => {
  const roomId = roomIdInput.value.trim();
  if (roomId) {
    chrome.runtime.sendMessage({ type: "JOIN_ROOM", roomId }, (response) => {
      if (response.success) {
        alert(`Joined room: ${roomId}`);
        updateUI(roomId);
      } else {
        alert(`Failed to join room: ${response.error}`);
      }
    });
  } else {
    alert("Please enter a valid Room ID.");
  }
});

// Event listener: Leave Room
leaveRoomBtn.addEventListener("click", () => {
  chrome.storage.local.get("roomId", (result) => {
    if (result.roomId) {
      chrome.runtime.sendMessage({ type: "LEAVE_ROOM", roomId: result.roomId }, (response) => {
        if (response.success) {
          alert("Left the room.");
          updateUI(null);
        } else {
          alert(`Failed to leave room: ${response.error}`);
        }
      });
    } else {
      alert("You are not in any room.");
    }
  });
});

// Initialize the popup UI on load
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get("roomId", (result) => {
    updateUI(result.roomId || null);
  });
});
