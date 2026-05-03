import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyAF71To2EoFntSSvkCbucrD8k1zl4EkKgc",
  authDomain: "gamedu-platform.firebaseapp.com",
  databaseURL: "https://gamedu-platform-default-rtdb.firebaseio.com",
  projectId: "gamedu-platform",
  storageBucket: "gamedu-platform.firebasestorage.app",
  messagingSenderId: "159557076828",
  appId: "1:159557076828:web:31468c186b0f5d61026399"
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
