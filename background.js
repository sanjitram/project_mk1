// Load Firebase app and other modules from Firebase CDN
// importScripts('firebase/firebase-app.js');
// importScripts('firebase/firebase-database.js');
import { initializeApp } from './firebase/firebase-app';
import { getDatabase } from './firebase/firebase-database';

// Firebase configuration
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
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
// const database = firebase.database();

console.log("Firebase initialized successfully!");

// Global variables
let currentRoomId = null;

// Listener for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Codeforces Room Extension installed!");
});

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
}

// Function to join a virtual room
function joinRoom(roomId, sendResponse) {
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
}

// Function to share a challenge
function shareChallenge(problemLink, sendResponse) {
  if (!currentRoomId) {
    sendResponse({ success: false, error: "No active room" });
    return;
  }

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
}

// Function to sync a countdown timer
function syncCountdownTimer(roomId, timerValue, sendResponse) {
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
}

// Function to notify when a user solves a problem
function notifySolve(roomId, username, sendResponse) {
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
}
