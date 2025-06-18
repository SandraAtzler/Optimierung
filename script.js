const firebaseConfig = {
  apiKey: "AIzaSyCIOeOJnqY3yHjbl6Ho14PYO6lpcOZtjfA",
  authDomain: "notenkonferenzen.firebaseapp.com",
  projectId: "notenkonferenzen",
  storageBucket: "notenkonferenzen.appspot.com",
  messagingSenderId: "471386308742",
  appId: "1:471386308742:web:73c3409b42e1db2d599107",
  databaseURL: "https://notenkonferenzen-default-rtdb.europe-west1.firebasedatabase.app/"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const statusEl = document.querySelector('.status');
const titleEl = document.getElementById('pageTitle');
const visitedRef = db.ref('visited');
let timerInterval;
let unlocked = false;
let currentClass = null;

// Lade und markiere besuchte Buttons
visitedRef.on('value', snapshot => {
  const visited = snapshot.val() || {};
  document.querySelectorAll('button').forEach(btn => {
    if (visited[btn.textContent]) {
      btn.classList.add('visited');
    }
  });
});

db.ref('konferenz').on('value', snap => {
  const data = snap.val();
  clearInterval(timerInterval);
  document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));

  if (data && data.klasse && data.startzeit) {
    const start = new Date(data.startzeit);
    currentClass = data.klasse;

    const activeBtn = [...document.querySelectorAll('button')].find(
      btn => btn.textContent === currentClass
    );
    if (activeBtn) activeBtn.classList.add('active');

    timerInterval = setInterval(() => {
      const diff = Math.floor((Date.now() - start) / 1000);
      const min = Math.floor(diff / 60), sec = diff % 60;
      statusEl.textContent = `Aktuell in der Konferenz: ${currentClass} (${min} Min ${sec} Sek)`;
    }, 1000);
  } else {
    statusEl.textContent = "Die Konferenzen haben noch nicht begonnen.";
    currentClass = null;
  }
});

function selectClass(className) {
  if (!unlocked || className === currentClass) return;

  db.ref('konferenz').set({
    klasse: className,
    startzeit: new Date().toISOString()
  });

  visitedRef.update({ [className]: true });

  toggleLock(false);
}

function toggleLock(force = null) {
  const icon = document.getElementById('lockIcon');
  unlocked = force !== null ? force : !unlocked;
  icon.classList.toggle('unlocked', unlocked);
}

titleEl.ondblclick = () => {
  if (!unlocked) return;
  db.ref('konferenz').remove();
  toggleLock(false);
};
