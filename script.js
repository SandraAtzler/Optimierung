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
const lockIcon = document.getElementById('lockIcon');
let unlocked = false;
let currentClass = null;
let visitedClasses = new Set();
let timerInterval;

db.ref('konferenz').on('value', snap => {
  const data = snap.val();
  clearInterval(timerInterval);
  currentClass = null;

  // Reset all buttons
  document.querySelectorAll('button').forEach(btn => {
    btn.classList.remove('active');
    btn.classList.remove('visited');
    if (visitedClasses.has(btn.textContent)) {
      btn.classList.add('visited');
    }
  });

  if (data && data.klasse && data.startzeit) {
    currentClass = data.klasse;
    visitedClasses.add(currentClass);

    const activeBtn = [...document.querySelectorAll('button')].find(
      btn => btn.textContent === currentClass
    );
    if (activeBtn) {
      activeBtn.classList.add('active');
      activeBtn.classList.remove('visited');
    }

    timerInterval = setInterval(() => {
      const diff = Math.floor((Date.now() - new Date(data.startzeit)) / 1000);
      const min = Math.floor(diff / 60), sec = diff % 60;
      statusEl.textContent = `Aktuell in der Konferenz: ${currentClass} (${min} Min ${sec} Sek)`;
    }, 1000);
  } else {
    statusEl.textContent = "Die Konferenzen haben noch nicht begonnen.";
  }

  // Update visited list in UI
  visitedClasses.forEach(cls => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent === cls);
    if (btn && cls !== currentClass) btn.classList.add('visited');
  });
});

db.ref('visited').on('value', snap => {
  const data = snap.val();
  visitedClasses = new Set(data || []);
});

function selectClass(className) {
  if (!unlocked) return;
  if (className === currentClass) return;

  visitedClasses.add(className);
  db.ref('visited').set([...visitedClasses]);
  db.ref('konferenz').set({
    klasse: className,
    startzeit: new Date().toISOString()
  });
  toggleLock(false);
}

function toggleLock(force = null) {
  if (force !== null) {
    unlocked = force;
  } else {
    unlocked = !unlocked;
  }
  lockIcon.classList.toggle('unlocked', unlocked);
}

lockIcon.ondblclick = toggleLock;

titleEl.ondblclick = () => {
  if (!unlocked) return;
  db.ref('konferenz').remove();
  db.ref('visited').remove();
  toggleLock(false);
};
