<script>
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
  let timerInterval;
  let unlocked = false;
  let currentClass = null;

  // Aktuelle Klasse und Liste besuchter Klassen beobachten
  db.ref().on('value', snap => {
    const data = snap.val();
    const konf = data.konferenz || {};
    const visited = data.besuchteKlassen || [];

    clearInterval(timerInterval);
    document.querySelectorAll('button').forEach(btn => {
      btn.classList.remove('active');
      if (visited.includes(btn.textContent)) {
        btn.classList.add('visited');
      } else {
        btn.classList.remove('visited');
      }
    });

    if (konf.klasse && konf.startzeit) {
      const start = new Date(konf.startzeit);
      currentClass = konf.klasse;

      const activeBtn = [...document.querySelectorAll('button')].find(
        btn => btn.textContent === currentClass
      );
      if (activeBtn) activeBtn.classList.add('active');

      timerInterval = setInterval(() => {
        const diff = Math.floor((Date.now() - start) / 1000);
        const min = Math.floor(diff / 60), sec = diff % 60;
        statusEl.textContent =
          `Aktuell in der Konferenz: ${currentClass} (${min} Min ${sec} Sek)`;
      }, 1000);
    } else {
      statusEl.textContent = "Die Konferenzen haben noch nicht begonnen.";
      currentClass = null;
    }
  });

  function selectClass(className) {
    if (!unlocked) return;
    if (className === currentClass) return;

    // Neue Klasse als aktiv setzen
    db.ref('konferenz').set({
      klasse: className,
      startzeit: new Date().toISOString()
    });

    // Alte Liste abrufen, neue Klasse hinzufügen, doppelte vermeiden
    db.ref('besuchteKlassen').once('value').then(snap => {
      const visited = snap.val() || [];
      if (!visited.includes(className)) {
        visited.push(className);
        db.ref('besuchteKlassen').set(visited);
      }
    });

    toggleLock(false);
  }

  function toggleLock(force = null) {
    const icon = document.getElementById('lockIcon');
    if (force !== null) {
      unlocked = force;
    } else {
      unlocked = !unlocked;
    }
    icon.classList.toggle('unlocked', unlocked);
  }

  titleEl.ondblclick = () => {
    if (!unlocked) return;
    db.ref('konferenz').remove();
    toggleLock(false);
  };
</script>
