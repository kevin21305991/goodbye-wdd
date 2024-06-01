import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, update, push, child, onValue, get } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { gsap } from 'gsap';

const accountInput = document.querySelector('input[name="account"]');
const passwordInput = document.querySelector('input[name="password"]');
const rememberCheckbox = document.querySelector('.remember input[type="checkbox"]');
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

/**
 * firebase 登入
 * @param {string} email 信箱
 * @param {string} password 密碼
 * @returns
 */
async function firebaseLogin(email, password) {
  const auth = getAuth();
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * 產生內容
 * @param {object} data 資料物件
 */
function generateContent(data) {
  const dom = `
    <div class="start">Dear <span class="name">${data.name}</span></div>
    <div class="content">
      <div class="scroll-area">
        <div class="inner">${data.content}</div>
      </div>
    </div>
    <div class="end">By <span class="name">Kevin</span></div>
  `;
  letterInner.innerHTML = dom;
}

/**
 * 讀取 firebase 上的資料
 * @param {string} email 信箱
 */
function loadData(email) {
  const db = getDatabase();
  const dbRef = ref(db, '/users/');
  onValue(dbRef, snapshot => {
    if (!snapshot.exists()) return;
    const AllData = Object.values(snapshot.val()).map(item => item);
    const data = AllData.find(item => item.account === email);
    generateContent(data);
    const allAnimate = gsap.timeline();
    allAnimate.add(loginAnimate()).add(envelopeAnimate());
  });
}

/**
 * 獲取信封尺寸
 * @returns
 */
function getEnvelopeSize() {
  const w = envelope.clientWidth;
  const h = envelope.clientHeight;
  return {
    w,
    h,
  };
}

/**
 * 監聽信封尺寸變化
 */
function observeEnvelopeSize() {
  // Reset envelope size
  const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      const flap = entry.target.querySelector('.front.flap');
      const pocket = entry.target.querySelector('.front.pocket');
      const newWidth = getEnvelopeSize().w / 2;
      const flapNewHeight = Math.round(newWidth * 0.71667);
      const pocketNewHeight = Math.round(newWidth * 0.58333);
      entry.target.style.height = pocketNewHeight * 2 + 'px';
      flap.style.setProperty('--w', newWidth + 'px');
      flap.style.setProperty('--h', flapNewHeight + 'px');
      pocket.style.setProperty('--w', newWidth + 'px');
      pocket.style.setProperty('--h', pocketNewHeight + 'px');
    }
  });

  resizeObserver.observe(envelope);
}

/**
 * 登入動畫
 * @returns
 */
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

/**
 * 信封打開動畫
 * @returns
 */
function envelopeAnimate() {
  const tl = gsap.timeline();
  const viewH = window.innerHeight;
  const envelopeFlapH = envelopeFlap.offsetHeight;
  const envelopeH = getEnvelopeSize().h + envelopeFlapH;
  const letterInnerH = letterInner.clientHeight >= 0.84 * viewH ? 0.84 * viewH : letterInner.clientHeight;
  tl.to('.envelope', {
    duration: 0.5,
    opacity: 1,
    zIndex: 2,
  });
  tl.to('.envelope', {
    duration: 0.5,
    top: envelopeFlapH + 0.5 * viewH,
    transform: `translate(-50%,${-0.5 * envelopeH}px)`,
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
    transform: `translate(-50%, ${-letterInnerH - 15}px)`,
    height: letterInnerH,
    onComplete: () => {
      letter.style.zIndex = 1;
    },
  });
  tl.to('.envelope .letter', {
    duration: 0.6,
    ease: 'power1.out',
    top: (viewH - letterInnerH) / 2,
    transform: `translate(-50%, ${-(viewH - envelopeH) / 2 - envelopeFlapH}px)`,
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

const localStorageHandler = {
  get() {
    return localStorage.getItem('login');
  },
  set() {
    const account = btoa(accountInput.value.trim());
    const password = btoa(passwordInput.value.trim());
    const isRemember = rememberCheckbox.checked;
    const info = {
      account: isRemember ? account : '',
      password: isRemember ? password : '',
      isRemember,
    };
    localStorage.setItem('login', JSON.stringify(info));
  },
};

/**
 * 登入
 * @returns
 */
function loginHandler() {
  const account = accountInput.value.trim();
  const password = passwordInput.value.trim();
  errorText.style.display = 'none';
  if (account === '' || password === '') {
    errorText.textContent = '請輸入帳號密碼';
    errorText.style.display = 'block';
    return;
  }
  loginBtn.classList.add('logging');
  firebaseLogin(account, password)
    .then(userCredential => {
      loginBtn.classList.remove('logging');
      loginBtn.classList.add('logged');
      localStorageHandler.set();
      loadData(userCredential.user.email);
    })
    .catch(error => {
      loginBtn.classList.remove('logging');
      errorText.textContent = '帳密有誤！還想偷看別人的阿';
      errorText.style.display = 'block';
    });
}

(function () {
  // 連線 firebase
  firebaseConnect();

  gsap.to('.login-box', {
    duration: 0.5,
    delay: 0.3,
    opacity: 1,
    transform: 'translate3d(-50%, -50%, 0)',
  });

  observeEnvelopeSize();

  if (localStorageHandler.get()) {
    const { account, password, isRemember } = JSON.parse(localStorageHandler.get());
    accountInput.value = atob(account);
    passwordInput.value = atob(password);
    rememberCheckbox.checked = isRemember;
  }

  // EventListener
  loginBtn.addEventListener('click', loginHandler);
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      loginHandler();
    }
  });
  window.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      loginBtn.classList.add('active');
    }
  });
  window.addEventListener('keyup', function (e) {
    if (e.key === 'Enter') {
      loginBtn.classList.remove('active');
    }
  });
})();
