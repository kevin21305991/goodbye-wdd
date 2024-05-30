import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, update, push, child, onValue, get } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { gsap } from 'gsap';

const loginBtn = document.querySelector('.login-btn');
const errorText = document.querySelector('.error-text');
const envelope = document.querySelector('.envelope');
const envelopeFlap = document.querySelector('.envelope .front.flap');
const letter = document.querySelector('.letter');
const letterInner = document.querySelector('.letter .inner');

/**
 * firebase 連線
 */
function firebaseConnect() {
  const firebaseConfig = {
    apiKey: 'AIzaSyBw3MvzPqwpPDyqtbm0d5yqMuLNuiHxi_0',
    authDomain: 'goodbye-wdd.firebaseapp.com',
    projectId: 'goodbye-wdd',
    storageBucket: 'goodbye-wdd.appspot.com',
    messagingSenderId: '846191453720',
    appId: '1:846191453720:web:bb4db38b456b54e045456d',
    measurementId: 'G-NYND571XR9',
  };

  const app = initializeApp(firebaseConfig);
}

async function login(email, password) {
  const auth = getAuth();
  return signInWithEmailAndPassword(auth, email, password);
}

function setDOM(data) {
  const dom = `
    <div class="start">To <span class="name">${data.name}</span></div>
    <div class="content">
      <svg class="border-blur" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="blur" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <mask id="fuzzy-border-mask">
            <rect fill="black" filter="url(#blur)" />
          </mask>
        </defs>
      </svg>
      <div class="scroll-area">
        <div class="inner">${data.content}</div>
      </div>
    </div>
    <div class="end">By <span class="name">Kevin</span></div>
  `;
  letterInner.innerHTML = dom;
}

function loadData(email) {
  const db = getDatabase();
  const dbRef = ref(db, '/users/');
  onValue(dbRef, snapshot => {
    if (!snapshot.exists()) return;
    const AllData = Object.values(snapshot.val()).map(item => item);
    const data = AllData.find(item => item.account === email);
    setDOM(data);
    const allAnimate = gsap.timeline();
    allAnimate.add(loginAnimate()).add(envelopeAnimate());
  });
}

function getEnvelopeSize() {
  const w = envelope.clientWidth;
  const h = envelope.clientHeight;
  return {
    w,
    h,
  };
}

function loginAnimate() {
  const tl = gsap.timeline();
  tl.to('.login-box form', {
    duration: 0.3,
    opacity: 0,
  });
  tl.to('.login-box', {
    duration: 0.8,
    maxWidth: getEnvelopeSize().w,
    height: getEnvelopeSize().h,
  });
  tl.to('.login-box', {
    duration: 0.5,
    opacity: 0,
    zIndex: 1,
  });

  return tl;
}

function envelopeAnimate() {
  const tl = gsap.timeline();
  const viewH = window.innerHeight;
  const envelopeFlapH = envelopeFlap.offsetHeight;
  const envelopeH = getEnvelopeSize().h + envelopeFlapH;
  const letterInnerH = letterInner.clientHeight;
  tl.to('.envelope', {
    duration: 0.5,
    opacity: 1,
    zIndex: 2,
  });
  tl.to('.envelope', {
    duration: 0.5,
    top: envelopeH,
  });
  tl.to('.envelope .front.flap', {
    duration: 0.8,
    delay: -0.5,
    filter: 'drop-shadow(1px 1px 6px rgba(0, 0, 0, 0.1))',
    rotateX: 180,
    zIndex: 0,
  });
  tl.to('.envelope .letter', {
    duration: 0.8,
    ease: 'power1.out',
    y: -letterInnerH - 15,
    height: letterInnerH,
    onComplete: () => {
      letter.style.zIndex = 1;
    },
  });
  tl.to('.envelope .letter', {
    duration: 0.6,
    ease: 'power1.out',
    top: -(viewH - envelopeH) / 2 - envelopeFlapH + 0.5 * viewH,
    y: '-50%',
  });
  tl.to('.envelope .letter .content p', {
    duration: 0.5,
    ease: 'power1.out',
    '--w': 0,
    stagger: 0.3,
  });
  tl.to('.envelope .letter .end', {
    duration: 0.3,
    ease: 'power1.out',
    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)',
  });
  return tl;
}

function loginHandler() {
  const account = document.querySelector('input[name="account"]').value;
  const password = document.querySelector('input[name="password"]').value;
  errorText.style.display = 'none';
  if (account === '' || password === '') {
    errorText.textContent = '請輸入帳號密碼';
    errorText.style.display = 'block';
    return;
  }
  gsap.to('.loading', {
    duration: 0.3,
    opacity: 1,
  });
  login(account, password)
    .then(userCredential => {
      gsap.to('.loading', {
        duration: 0.3,
        opacity: 0,
      });
      loadData(userCredential.user.email);
    })
    .catch(error => {
      const errorCode = error.code;
      const errorMessage = error.message;
      gsap.to('.loading', {
        duration: 0.3,
        opacity: 0,
        onComplete: () => {
          errorText.textContent = '帳密有誤！還想偷看別人的阿';
          errorText.style.display = 'block';
        },
      });
    });
}

firebaseConnect();
loginBtn.addEventListener('click', loginHandler);
window.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    loginHandler();
  }
});
