# Nextjs-Firebase-AdWatch-Starter

A minimal Next.js (Pages) starter configured to work with Firebase Auth + Firestore. This is a **zip-ready** project: copy the file tree below into a folder (e.g. `my-ad-site`), run `npm install`, add your Firebase config to `.env.local`, then `npm run dev`.

---

## File tree

```
my-ad-site/
├─ package.json
├─ README.md
├─ .env.example
├─ next.config.js
├─ firebase.js
├─ pages/
│  ├─ _app.js
│  ├─ index.js
│  ├─ signup.js
│  ├─ login.js
│  ├─ dashboard.js
│  ├─ watch.js
│  └─ api/
│     └─ addPoints.js
├─ components/
│  └─ Nav.js
└─ styles/
   └─ globals.css
```

---

## package.json

```json
{
  "name": "my-ad-site",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "firebase": "^9.22.0",
    "next": "13.5.4",
    "react": "18.2.0",
    "react-dom": "18.2.0"
  }
}
```

---

## .env.example

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Rename to `.env.local` and fill values from your Firebase Console -> Project Settings -> SDK config.

---

## firebase.js

```js
// firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

export const auth = getAuth();
export const db = getFirestore();
```

---

## pages/_app.js

```js
import '../styles/globals.css'
import Nav from '../components/Nav'

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Nav />
      <main style={{padding: '20px'}}>
        <Component {...pageProps} />
      </main>
    </>
  )
}
```

---

## components/Nav.js

```js
import Link from 'next/link'

export default function Nav(){
  return (
    <nav style={{padding:'12px', borderBottom:'1px solid #ddd'}}>
      <Link href="/">Home</Link> | {' '}
      <Link href="/signup">Sign Up</Link> | {' '}
      <Link href="/login">Login</Link> | {' '}
      <Link href="/dashboard">Dashboard</Link> | {' '}
      <Link href="/watch">Watch</Link>
    </nav>
  )
}
```

---

## pages/index.js

```js
export default function Home(){
  return (
    <div>
      <h1>Welcome to Ad-Watch Starter</h1>
      <p>This is a minimal starter. Signup, login, watch a demo video to earn points.</p>
    </div>
  )
}
```

---

## pages/signup.js

```js
import { useState } from 'react'
import { auth, db } from '../firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useRouter } from 'next/router'

export default function Signup(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try{
      const userCred = await createUserWithEmailAndPassword(auth, email, password)
      const uid = userCred.user.uid
      await setDoc(doc(db, 'users', uid), {
        email,
        points: 0,
        createdAt: serverTimestamp()
      })
      router.push('/dashboard')
    }catch(err){
      setError(err.message)
    }
  }

  return (
    <div style={{maxWidth:400}}>
      <h2>Sign Up</h2>
      {error && <p style={{color:'red'}}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required />
        <br />
        <label>Password</label>
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required />
        <br />
        <button type="submit">Create Account</button>
      </form>
    </div>
  )
}
```

---

## pages/login.js

```js
import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { useRouter } from 'next/router'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState(null)
  const router = useRouter()

  const handle = async (e)=>{
    e.preventDefault()
    setErr(null)
    try{
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/dashboard')
    }catch(e){ setErr(e.message) }
  }

  return (
    <div style={{maxWidth:400}}>
      <h2>Login</h2>
      {err && <p style={{color:'red'}}>{err}</p>}
      <form onSubmit={handle}>
        <label>Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required />
        <br/>
        <label>Password</label>
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required />
        <br/>
        <button type="submit">Login</button>
      </form>
    </div>
  )
}
```

---

## pages/dashboard.js

```js
import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/router'

export default function Dashboard(){
  const [user, setUser] = useState(null)
  const [points, setPoints] = useState(0)
  const router = useRouter()

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (u)=>{
      if(!u) { router.push('/login'); return }
      setUser(u)
      const snap = await getDoc(doc(db, 'users', u.uid))
      if(snap.exists()) setPoints(snap.data().points || 0)
    })
    return ()=>unsub()
  },[])

  const logout = async ()=>{
    await signOut(auth)
    router.push('/')
  }

  return (
    <div>
      <h2>Dashboard</h2>
      {user && (
        <div>
          <p>Email: {user.email}</p>
          <p>Points: {points}</p>
          <button onClick={()=>router.push('/watch')}>Go Watch Ads</button>
          <button onClick={logout} style={{marginLeft:10}}>Logout</button>
        </div>
      )}
    </div>
  )
}
```

---

## pages/watch.js

```js
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'
import { useRouter } from 'next/router'

export default function Watch(){
  const [user, setUser] = useState(null)
  const [watching, setWatching] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, (u)=>{
      if(!u) router.push('/login')
      else setUser(u)
    })
    return ()=>unsub()
  }, [])

  // Demo: we simulate watching a video for 10 seconds, then call server to credit points
  const startWatch = async ()=>{
    if(!user) return
    setWatching(true)
    setMessage('Watching...')
    // 10 second timer to simulate ad
    setTimeout(async ()=>{
      // call api to add points
      const res = await fetch('/api/addPoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, points: 10 })
      })
      const data = await res.json()
      if(data.success) setMessage('You earned 10 points!')
      else setMessage('Error: ' + (data.error || 'unknown'))
      setWatching(false)
    }, 10000)
  }

  return (
    <div>
      <h2>Watch Demo Ad</h2>
      <p>This demo simulates a 10s ad. In production use real ad tokens/verification.</p>
      <button onClick={startWatch} disabled={watching}>Start Watching (10s)</button>
      <p>{message}</p>
    </div>
  )
}
```

---

## pages/api/addPoints.js

```js
import { db } from '../../firebase'
import { doc, updateDoc, increment } from 'firebase/firestore'

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).end()
  try{
    const { uid, points } = req.body
    if(!uid || !points) return res.status(400).json({ error: 'Missing uid or points' })
    // NOTE: This is a minimal demo. In production, verify a token / use a trusted server function.
    const userRef = doc(db, 'users', uid)
    await updateDoc(userRef, { points: increment(points) })
    res.status(200).json({ success: true })
  }catch(e){
    res.status(500).json({ error: e.message })
  }
}
```

---

## styles/globals.css

```css
html,body{font-family: Arial, sans-serif}
input{display:block;padding:8px;margin:8px 0;width:100%}
button{padding:8px 12px;margin-top:8px}
```

---

## README.md (quick instructions)

```md
# Ad-Watch Starter (Next.js + Firebase)

## Setup
1. Install Node.js (LTS) if not already.
2. Copy this folder into `my-ad-site` on your computer.
3. Run `npm install`.
4. Create a Firebase project (https://console.firebase.google.com/) and enable Authentication (Email/Password) and Firestore database.
5. In Firebase Project Settings > SDK config, copy the values into a `.env.local` file using the provided `.env.example` keys.
6. Run `npm run dev` and open http://localhost:3000

## How it works (demo)
- Sign up with email/password. A `users/{uid}` doc is created with `points: 0`.
- Go to Watch page, click Start Watching. After 10s the demo server API `/api/addPoints` increments `points` by 10.

## Important (Production notes)
- This starter uses a **client-triggered** API to add points. That is insecure for production: bots/clients can call the endpoint. To secure:
  - Use server-side verification (ad provider tokens, playback verification).
  - Protect server endpoints with Firebase Callable Functions and verify ID tokens.
  - Rate-limit and add fraud detection.

## Deploying
- Push to GitHub. Connect your repo to Vercel and deploy. Set environment variables in Vercel dashboard (use same keys as `.env.local`).
```

---


# End of project


*Instructions for you:* Copy the full file tree into a folder named `my-ad-site`, create a `.env.local` from `.env.example`, run `npm install`, then `npm run dev`. When ready, push to GitHub and deploy with Vercel. The README in this doc contains the exact steps.


