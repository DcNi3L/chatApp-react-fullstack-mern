import { useState } from 'react';
import { useCookies } from'react-cookie';
import axios from 'axios';

function ProfileForm({ onClose, id, username, setModalIsOpen, setUsername }) {
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [cookies, setCookie] = useCookies(['token']);


  async function updateProfile(e) {
    e.preventDefault()
    try {
      if (newName !== '' || newPassword !== '') {
        const response = await axios.put('/profile/update', {
          uId: id,
          name: newName || username,
          password: newPassword,
        });
  
        if (response.status === 200) {
          const updatedName = newName || username;
          setUsername(updatedName);

          const updatedToken = { ...cookies.token, username: updatedName };
          setCookie('token', updatedToken, { path: '/' });
          
          setModalIsOpen(false);
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  }

  async function deleteUser() {
    try {
      const response = await axios.delete('/user/delete', {
        data: { uId: id },
      });

      if (response.status === 200) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }

  return (
    <div className="profile-form relative bg-[#212226] rounded-xl h-96 w-full py-4 px-6 text-white">
      <h2 className="text-center text-2xl mt-4 font-semibold">
        Edit your profile:
      </h2>
      <form className="flex flex-col h-48 mt-2">
        <label className="font-semibold" htmlFor="name">
          New Name:{' '}
          <span className="text-gray-400">"current - {username}"</span>
        </label>
        <input
          className="my-2 h-8 py-5 px-2 text-black rounded-md"
          type="text"
          id="name"
          name="name"
          value={newName}
          required
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Your name..."
        />
        <label className="font-semibold" htmlFor="pass">
          New Password:{' '}
        </label>
        <input
          className="mt-2 h-8 py-5 px-2 text-black rounded-md"
          type="text"
          id="pass"
          name="pass"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Your password..."
        />
        <button
          className="w-full mt-10 uppercase p-2 font-bold bg-blue-500 rounded-sm hover:bg-blue-700"
          type="submit"
          onClick={(e) => updateProfile(e)}>
          Update
        </button>
        <button
          className="w-full mt-3 uppercase p-2 font-bold bg-red-500 rounded-sm hover:bg-red-700"
          type="button"
          onClick={deleteUser}>
          Delete user
        </button>
      </form>
      <button className="closeBtn absolute" onClick={onClose}>
        &#x2715;
      </button>
    </div>
  );
}

export default ProfileForm;
