import { useContext, useState } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import Logo from '../Logo';

function RegisterAndLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginOrReg, setLoginOrReg] = useState('register');
  const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);

  async function handleSubmit(e) {
    e.preventDefault();
    const url = loginOrReg === 'register' ? 'register' : 'login';
    try {
      if (username !== '' && password !== '') {
        const { data } = await axios.post(url, { username, password });
        setLoggedInUsername(username);
        setId(data.id);
        window.location.reload();
      }
    } catch (error) {
      console.log(`Error occured when ${url}`, error);
    }
    
  }

  return (
    <div className="bg-gradient-radial h-screen flex items-center">
      <form className="w-96 h-72 rounded-lg shadow-black shadow-md flex flex-col items-center justify-center bg-[#212226] mx-auto mb-12" onSubmit={handleSubmit}>
        <Logo />
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          type="text"
          placeholder="username"
          required
          className="block text-white bg-none bg-[#1B1B1F] caret-blue-500 w-64 outline-none focus:outline-blue-500 focus:outline-2 rounded-md p-2 mb-2 border-none"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="password"
          required
          className="block text-white bg-none bg-[#1B1B1F] caret-blue-500 w-64 outline-none focus:outline-blue-500 focus:outline-2 rounded-md p-2 mb-2 border-none"
        />
        <button className="bg-blue-500 hover:bg-blue-600 font-bold active:bg-blue-400 text-white block w-64 rounded-sm p-2">
          {loginOrReg === 'register' ? 'Register' : 'Login'}
        </button>
        <div className="text-center text-gray-300 mt-2">
          {loginOrReg === 'register' ? (
            <div>
              Already a member?
              <button
                className='ml-1 text-blue-300 font-semibold hover:underline'
                onClick={() => setLoginOrReg('login')}>
                Login
              </button>
            </div>
          ) : (
            <div>
              Dont have an account?
              <button
                className='ml-1 text-blue-300 font-semibold hover:underline'
                onClick={() => setLoginOrReg('register')}>
                Register
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

export default RegisterAndLogin;
