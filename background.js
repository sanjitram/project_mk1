// background.js

let currentRoomId = null;

chrome.runtime.onInstalled.addListener(() => {
  console.log("Codeforces Room Extension installed!");
  
  // Get the active tab to inject scripts into it
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      const tab = tabs[0];
      console.log("Active tab URL:", tab.url);
      // Ensure tab.url exists
      if (tab.url && !tab.url.startsWith("chrome://")) {
        console.log("Injecting scripts into:", tab.url);
        chrome.scripting.executeScript({
          target: { tabId: tab.id }, // Use the active tab's ID
          func: loadFirebaseScripts
        });
      } else {
        console.log("Skipping chrome:// URL or tab with no URL");
      }
    } else {
      console.error("No valid tabs found");
    }
  });
});

// Function to load Firebase scripts dynamically in the background page
function loadFirebaseScripts() {
  const scripts = [
    "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js",
    "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js"
  ];

  scripts.forEach((src) => {
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  });

  script.onload = function () {
    // Initialize Firebase after scripts are loaded
    const firebaseConfig = {
      apiKey: "AIzaSyDAsczsVrRNdzJSCJtEMW8TGZBBvAQSO7E",
      authDomain: "coderclan-woc.firebaseapp.com",
      databaseURL: "https://coderclan-woc-default-rtdb.firebaseio.com",
      projectId: "coderclan-woc",
      storageBucket: "coderclan-woc.firebasestorage.app",
      messagingSenderId: "442267464037",
      appId: "1:442267464037:web:474487deb8979c48acb18c",
      measurementId: "G-LX1Y07G7VE"
    };

    // Initialize Firebase
    const app = firebase.initializeApp(firebaseConfig);
    const database = firebase.database(app);
    console.log("Firebase initialized successfully!");

    chrome.storage.local.set({ database: database }, () => {
      if (chrome.runtime.lastError) {
        console.error("Failed to store database in storage:", chrome.runtime.lastError);
      } else {
        console.log("Firebase database stored in local storage.");
      }
    });
  };
}



// Handle communication from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "CREATE_ROOM":
      createRoom(message.roomName, sendResponse);
      break;

    case "JOIN_ROOM":
      joinRoom(message.roomId, sendResponse);
      break;

    case "CHALLENGE":
      shareChallenge(message.problemLink, sendResponse);
      break;

    case "SYNC_TIMER":
      syncCountdownTimer(message.roomId, message.timerValue, sendResponse);
      break;

    case "NOTIFY_SOLVE":
      notifySolve(message.roomId, message.username, sendResponse);
      break;

    default:
      console.warn("Unknown message type:", message.type);
  }
  return true; // Indicate asynchronous response
});

// Function to create a virtual room
function createRoom(roomName, sendResponse) {
  // Retrieve the Firebase database object
  chrome.storage.local.get("database", (result) => {
    const database = result.database;
    if (!database) {
      console.error("Firebase database not initialized.");
      sendResponse({ success: false, error: "Firebase not initialized" });
      return;
    }
    console.log("Database object retrieved:", database); // Check if database is retrieved properly
    const roomsRef = database.ref("rooms/");
    const newRoomRef = roomsRef.push();

    newRoomRef
      .set({
        name: roomName,
        createdAt: Date.now(),
        participants: []
      })
      .then(() => {
        currentRoomId = newRoomRef.key;
        console.log("Room created:", currentRoomId);
        sendResponse({ success: true, roomId: currentRoomId });
      })
      .catch((error) => {
        console.error("Failed to create room:", error);
        sendResponse({ success: false, error });
      });
  });
}

// Function to join a virtual room
function joinRoom(roomId, sendResponse) {
  // Retrieve the Firebase database object
  chrome.storage.local.get("database", (result) => {
    const database = result.database;
    if (!database) {
      console.error("Firebase database not initialized.");
      sendResponse({ success: false, error: "Firebase not initialized" });
      return;
    }
    console.log("Database object retrieved:", database); // Check if database is retrieved properly
    const roomRef = database.ref(`rooms/${roomId}/participants`);
    const userId = `user_${Date.now()}`; // Generate a unique user ID

    roomRef
      .push({
        userId,
        joinedAt: Date.now()
      })
      .then(() => {
        currentRoomId = roomId;
        console.log("Joined room:", roomId);
        sendResponse({ success: true, userId });
      })
      .catch((error) => {
        console.error("Failed to join room:", error);
        sendResponse({ success: false, error });
      });
  });
}

// Function to share a challenge
function shareChallenge(problemLink, sendResponse) {
  if (!currentRoomId) {
    sendResponse({ success: false, error: "No active room" });
    return;
  }

  // Retrieve the Firebase database object
  chrome.storage.local.get("database", (result) => {
    const database = result.database;
    if (!database) {
      console.error("Firebase database not initialized.");
      sendResponse({ success: false, error: "Firebase not initialized" });
      return;
    }
    console.log("Database object retrieved:", database); // Check if database is retrieved properly
    const roomRef = database.ref(`rooms/${currentRoomId}/currentChallenge`);
    roomRef
      .set({
        problemLink,
        sharedAt: Date.now()
      })
      .then(() => {
        console.log("Challenge shared:", problemLink);
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("Failed to share challenge:", error);
        sendResponse({ success: false, error });
      });
  });
}

// Function to sync a countdown timer
function syncCountdownTimer(roomId, timerValue, sendResponse) {
  // Retrieve the Firebase database object
  chrome.storage.local.get("database", (result) => {
    const database = result.database;
    if (!database) {
      console.error("Firebase database not initialized.");
      sendResponse({ success: false, error: "Firebase not initialized" });
      return;
    }

    const timerRef = database.ref(`rooms/${roomId}/countdown`);
    timerRef
      .set({
        timerValue,
        syncedAt: Date.now()
      })
      .then(() => {
        console.log("Countdown timer synced:", timerValue);
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("Failed to sync timer:", error);
        sendResponse({ success: false, error });
      });
  });
}

// Function to notify when a user solves a problem
function notifySolve(roomId, username, sendResponse) {
  // Retrieve the Firebase database object
  chrome.storage.local.get("database", (result) => {
    const database = result.database;
    if (!database) {
      console.error("Firebase database not initialized.");
      sendResponse({ success: false, error: "Firebase not initialized" });
      return;
    }
    console.log("Database object retrieved:", database); // Check if database is retrieved properly
    const notificationsRef = database.ref(`rooms/${roomId}/notifications`);
    notificationsRef
      .push({
        username,
        solvedAt: Date.now()
      })
      .then(() => {
        console.log("Solve notification sent:", username);
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("Failed to notify solve:", error);
        sendResponse({ success: false, error });
      });
  });
}
