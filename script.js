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

const statusEl = document.getElementById('statusText');
const startBox = document.getElementById('startBox');
const titleEl = document.getElementById('pageTitle');
const lockIcon = document.getElementById('lockIcon');

let timerInterval;
let unlocked = false;
let currentClass = null;

db.ref().on('value', snap => {
  const data = snap.val() || {};
  const konferenz = data.konferenz || {};
  const clicked = data.bereitsGeklickt || [];

  clearInterval(timerInterval);
  document.querySelectorAll('button').forEach(btn => {
    const name = btn.textContent;
    btn.classList.remove('active', 'used');
    if (clicked.includes(name)) {
      btn.classList.add('used');
    }
  });

  if (konferenz.klasse && konferenz.startzeit) {
    currentClass = konferenz.klasse;
    const start = new Date(konferenz.startzeit);
    const now = Date.now();
    const diffSeconds = Math.floor((now - start.getTime()) / 1000);

    const activeBtn = [...document.querySelectorAll('button')].find(
      b => b.textContent === currentClass
    );
    if (activeBtn) {
      activeBtn.classList.add('active');
      activeBtn.classList.remove('used');
    }

    if (diffSeconds < 10) {
      startBox.textContent = `Die Konferenz der ${currentClass} startet jetzt!`;
      startBox.style.display = "block";
      statusEl.textContent = "";
      setTimeout(() => {
        startBox.style.display = "none";
        startTimer(start);
      }, (10 - diffSeconds) * 1000);
    } else {
      startBox.style.display = "none";
      startTimer(start);
    }
  } else {
    startBox.style.display = "none";
    statusEl.textContent = "Die Konferenzen haben noch nicht begonnen.";
    currentClass = null;
  }
});

function startTimer(start) {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const diff = Math.floor((Date.now() - start.getTime()) / 1000);
    const min = Math.floor(diff / 60),
          sec = diff % 60;
    statusEl.textContent = `Aktuell in der Konferenz: ${currentClass} (${min} Min ${sec} Sek)`;
  }, 1000);
}

function selectClass(className) {
  if (!unlocked || className === currentClass) return;

  db.ref().once('value').then(snap => {
    const data = snap.val() || {};
    const clicked = data.bereitsGeklickt || [];
    if (!clicked.includes(className)) {
      clicked.push(className);
    }
    db.ref().update({
      konferenz: {
        klasse: className,
        startzeit: new Date().toISOString()
      },
      bereitsGeklickt: clicked
    });
    toggleLock(false);
  });
}

function toggleLock(force = null) {
  if (force !== null) {
    unlocked = force;
  } else {
    unlocked = !unlocked;
  }
  lockIcon.classList.toggle('unlocked', unlocked);
}

titleEl.ondblclick = () => {
  if (!unlocked) return;
  db.ref().set({});
  toggleLock(false);
};
