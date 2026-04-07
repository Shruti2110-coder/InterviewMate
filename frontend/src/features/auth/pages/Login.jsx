import React from 'react'
import "../auth.form.scss"
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useState } from 'react'


function Login() {

  const {loading, handleLogin} = useAuth()
     const navigate = useNavigate()
     const [errorMessage, setErrorMessage] = useState("")

     const[email, setEmail] = useState("")
     const[password, setPassword] = useState("")

 const handleSubmit = async (e) => {
  e.preventDefault();
  setErrorMessage("");

  try {
    await handleLogin({ email, password });
    navigate("/"); // only after success
  } catch (err) {
    setErrorMessage(err?.response?.data?.message || "Login failed. Please try again.");
  }
};
    if(loading){
        return(<main>
            <h1>Loading..........</h1>
        </main>)
    }
      
  return (
  <main>
    <div className="form-container">
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
            <div className="input-group">
                <label htmlFor="email">Email</label>
                <input
                onChange={(e) =>{ setEmail(e.target.value)}}
                type="email"id='email'name='email' placeholder='enter email address'/>
            </div>
                <div className="input-group">
                <label htmlFor="password">password</label>
                <input
                onChange={(e) => {setPassword(e.target.value)}}
                type="password"id='password'name='password' placeholder='enter password'/>
            </div> 

        <button type="submit" className='button primary-button'>Login</button>
        </form>
        {errorMessage && <p>{errorMessage}</p>}

         <p>Don't have an accoount? <Link to={"/register"}>Register</Link></p>
    </div>
  </main>

  )
}

export default Login