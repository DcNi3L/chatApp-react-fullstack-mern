import { useContext, useEffect, useRef, useState } from 'react';
import { set, uniqBy } from 'lodash';
import axios from 'axios';
import Picker from 'emoji-picker-react';
import Modal from 'react-modal';

// imports from components
import Logo from '../Logo';
import Contact from '../Contact';
import ProfileForm from '../ProfileForm';
import { UserContext } from '../context/UserContext';
import { FaSmile, FaArrowDown } from 'react-icons/fa';
import { IoAttach, IoClose } from 'react-icons/io5';
import { IoIosArrowDown, IoMdSettings } from 'react-icons/io';

Modal.setAppElement('#root');

function Chat() {
  const [ws, setWs] = useState(null);
  const [online, setOnline] = useState({});
  const [offline, setOffline] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [showScrollbar, setShowScrollbar] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const { username, id, setId, setUsername } = useContext(UserContext);
  const divUnderMsg = useRef(null);

  // connecting to websocket server to receive messages
  useEffect(() => {
    connectToWS();
    console.log('WebSocket working!');
  }, []);

  // connecting to websocket server to receive messages function
  function connectToWS() {
    const ws = new WebSocket('ws://localhost:3001');
    setWs(ws);
    ws.addEventListener('message', handleMessage);
    ws.addEventListener('close', () => {
      console.log('Reconnecting...');
      setTimeout(() => {
        connectToWS();
      }, 1000);
    });
    console.log('Connected');
  }

  // logout from chat window
  function logout() {
    axios.post('/logout').then(() => {
      setWs(null);
      setId(null);
      setUsername(null);
    });
  }

  // showing online users in chat window
  function showOnline(usersArray) {
    const users = {};
    usersArray.forEach(({ userId, username }) => {
      users[userId] = username;
    });
    setOnline(users);
  }

  // messages received from server in chat window are stored here
  function handleMessage(e) {
    const messageData = JSON.parse(e.data);
    if ('online' in messageData) {
      showOnline(messageData.online);
    } else if ('text' in messageData) {
      const isMessageForSelectedUser =
        messageData.sender === selectedUser ||
        messageData.recipient === selectedUser;

      if (isMessageForSelectedUser) {
        setTimeout(() => {
          setMessages((prev) => [...prev, { ...messageData }]);
        }, 100)
      }
    }
  } 

  // sending message to server when enter is pressed
  function sendMessage(e, file = null) {
    if (e) e.preventDefault();
    ws.send(
      JSON.stringify({
        recipient: selectedUser,
        text: newMessageText,
        file,
      })
    );
  
    if (file) {
      setTimeout(() => {
        axios.get('/messages/' + selectedUser).then((res) => {
          setMessages(res.data);
        });
      }, 500);
    } else {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            text: newMessageText,
            sender: id,
            recipient: selectedUser,
            _id: Date.now(),
          },
        ]);
        setNewMessageText('');
      }, 100);
    }
  }  

  // file sending function
  function sendFile(e) {
    const reader = new FileReader();
    reader.readAsDataURL(e.target.files[0]);
    reader.onload = () => {
      sendMessage(null, {
        name: e.target.files[0].name,
        data: reader.result,
      });
    };
  }

  async function deleteMessage(messageId) {
    try {
      await axios.delete(`/messages/${messageId}`);
      setTimeout(async () => {
        const response = await axios.get(`/messages/${selectedUser}`);
        setMessages(response.data);
      }, 100);
      
      setTimeout(() => {
        axios.get('/messages/' + id).then((res) => {
          setMessages(res.data);
        });
      }, 100);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }
  
  async function deleteAllMessages() {
    try {
      await axios.delete(`/messages/${id}/${selectedUser}`);
      setMessages([]);
      setTimeout(() => {
        axios.get('/messages/' + id).then((res) => {
          setMessages(res.data);
        });
      }, 100);
    } catch (error) {
      console.error('Error deleting all messages:', error);
    }
  }   
  

  function isImage(fileName) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
    const ext = fileName.split('.').pop().toLowerCase();
    return imageExtensions.includes('.' + ext);
  }

  function isVideo(fileName) {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.mkv'];
    const ext = fileName.split('.').pop().toLowerCase();
    return videoExtensions.includes('.' + ext);
  }

  function isAudio(fileName) {
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.aac'];
    const ext = fileName.split('.').pop().toLowerCase();
    return audioExtensions.includes('.' + ext);
  }


  // user status online or offline
  useEffect(() => {
    axios.get('/users').then((res) => {
      const offlineUsersArr = res.data
        .filter((p) => p._id !== id)
        .filter((p) => !Object.keys(online).includes(p._id));
      const offline = {};
      offlineUsersArr.forEach((p) => {
        offline[p._id] = p;
      });
      setOffline(offline);
    });
  }, [id, online]);

  // messages fetching from db
  useEffect(() => {
    if (selectedUser) {
      axios.get('/messages/' + selectedUser).then((res) => {
        setMessages(res.data);
      });
    }
  }, [selectedUser, messages]);

  // setting online users in chat window
  const onlineUser = { ...online };
  delete onlineUser[id];

  // duplicate messages are removed
  const noDupMsg = uniqBy(messages, '_id');

  // scroll to bottom of chat when new message received
  useEffect(() => {
    const div = divUnderMsg.current;
    if (div) {
      div.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);


  const toggleEmojiPicker = () => {
    setShowPicker(!showPicker);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage(e, null);
    }
  };

  const handleMouseEnter = () => {
    setShowPicker(true);
  };

  const handleMouseLeave = () => {
    setShowPicker(false);
  };

  useEffect(() => {
    let timer;
    const handleActivity = () => {
      setShowScrollbar(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setShowScrollbar(false);
      }, 15000);
    };

    document.addEventListener('mousemove', handleActivity);

    return () => {
      document.removeEventListener('mousemove', handleActivity);
    };
  }, [showScrollbar]);

  return (
    <div className="flex relative h-screen">
      <div className="bg-[#212226] w-1/3 flex flex-col">
        <div className="flex-grow">
          <Logo />
          {Object.keys(onlineUser) ? (
            <h3 className="mx-6 text-green-400 font-semibold letter">
              Online:
            </h3>
          ) : (
            <h3> </h3>
          )}
          {Object.keys(onlineUser).map((userId) => (
            <Contact
              key={userId}
              id={userId}
              online={true}
              username={onlineUser[userId]}
              onClick={() => setSelectedUser(userId)}
              selected={userId === selectedUser}
            />
          ))}

          {Object.keys(offline) ? (
            <h3 className="mx-6 text-red-500 font-semibold letter">Offline:</h3>
          ) : (
            <h3>''</h3>
          )}
          {Object.keys(offline).map((userId) => (
            <Contact
              key={userId}
              id={userId}
              online={false}
              username={offline[userId].username}
              onClick={() => setSelectedUser(userId)}
              selected={userId === selectedUser}
            />
          ))}
        </div>

        <div className="p-2 text-center flex items-center justify-center border-t-2 border-t-blue-600">
          <button
            onClick={() => setModalIsOpen(true)}
            className="mx-2 pr-2 cursor-pointer text-lg text-white hover:text-blue-500 transition delay-75 ease-in-out flex items-center border-r-2 border-r-blue-500">
            <IoMdSettings className="mr-1" />
            {username}
          </button>

          <Modal
            isOpen={modalIsOpen}
            onRequestClose={() => setModalIsOpen(false)}
            className="modal-content flex items-center justify-center absolute top-56 left-[28%] w-[40vw] h-[40%]"
            overlayClassName="modal-overlay">
            <ProfileForm onClose={() => setModalIsOpen(false)} id={id} username={username} setModalIsOpen={setModalIsOpen} setUsername={setUsername} />
          </Modal>

          <button
            onClick={logout}
            className="text-md bg-[#333] py-1 px-2  rounded-md text-red-500 hover:bg-red-500 hover:text-white transition-all delay-75 ease-in-out">
            Logout
          </button>
        </div>
      </div>
      <div className="flex flex-col bg-gradient-radial w-2/3 p-2 relative">
        <div className="flex-grow">
          {!selectedUser && (
            <div className="flex h-full flex-grow items-center justify-center">
              <div className="text-gray-400">
                &larr;Select user to start conversation
              </div>
            </div>
          )}

          {!!selectedUser && (
            <div className="relative h-full">
              <div
                style={{ overflowY: showScrollbar ? 'scroll' : 'hidden' }}
                className="scroll-bar chat-window overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
                {noDupMsg.map((message) => (
                  <>
                    {message && (
                      <button
                        className="z-[9999] fixed w-[3.5rem] top-0 right-60 hover:text-red-600 hover:rounded-s-md transition-all delay-75 linear text-white p-2 rounded-lg trash"
                        onClick={deleteAllMessages}>
                        <span>
                          <IoIosArrowDown className="text-red-500 font-bold text-xl" />
                        </span>
                      </button>
                    )}

                    <div
                      key={message._id}
                      className={
                        message.sender === id
                          ? 'text-right pr-8'
                          : 'text-left pl-6'
                      }>
                      <div
                        className={
                          'inline-block text-left relative p-3 my-2 rounded-xl text-md text-pretty break-all shadow-md shadow-black ' +
                          (JSON.stringify(message.text).length > 60
                            ? 'w-[70%] '
                            : 'w-fit ') +
                          (message.sender === id
                            ? 'bg-gradient-to-r from-gray-800 to-gray-600  text-white'
                            : 'bg-gradient-to-l from-blue-800 to-sky-600 text-white')
                        }>
                        {message.text}
                        {message.file && (
                          <div className="file">
                            {isImage(message.file) ? (
                              <a
                                href={
                                  axios.defaults.baseURL +
                                  '/uploads/' +
                                  message.file
                                }
                                target="_blank">
                                <img
                                  src={
                                    axios.defaults.baseURL +
                                    '/uploads/' +
                                    message.file
                                  }
                                  alt={message.file}
                                  title={message.file}
                                  className="-m-3 rounded-lg max-w-md max-h object-contain cursor-pointer"
                                />
                              </a>
                            ) : isVideo(message.file) ? (
                              <video
                                controls
                                className="-m-3 rounded-lg max-w-md max-h object-contain cursor-pointer">
                                <source
                                  src={
                                    axios.defaults.baseURL +
                                    '/uploads/' +
                                    message.file
                                  }
                                  title={message.file}
                                  type="video/mp4"
                                />
                                Your browser does not support the video tag.
                              </video>
                            ) : isAudio(message.file) ? (
                              <audio
                                controls
                                className="max-w-md cursor-pointer "
                                title={message.file}
                                src={
                                  axios.defaults.baseURL +
                                  '/uploads/' +
                                  message.file
                                }></audio>
                            ) : (
                              <a
                                download
                                target="_blank"
                                title={message.file}
                                className="flex items-center gap-1 border-b"
                                href={
                                  axios.defaults.baseURL +
                                  '/uploads/' +
                                  message.file
                                }>
                                <IoAttach className="text-2xl rotate-45" />
                                {message.file}
                              </a>
                            )}
                          </div>
                        )}
                        <button
                          className={
                            message.sender === id
                              ? 'text-red-500 text-lg absolute flex items-center justify-center font-bold hover:bg-red-600 hover:text-white top-4 -right-7 rounded-xl w-5 h-5 text-center'
                              : 'hidden'
                          }
                          onClick={() => deleteMessage(message._id)}>
                          <IoClose />
                        </button>
                      </div>
                    </div>
                  </>
                ))}
                <div ref={divUnderMsg}></div>
              </div>
            </div>
          )}
        </div>

        {!!selectedUser && (
          <>
            <button
              onClick={() => {
                const div = divUnderMsg.current;
                if (div) {
                  div.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }
              }}
              className="fixed hidden bottom-16 right-6 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none">
              <FaArrowDown />
            </button>
            <form
              className="flex gap-2 justify-center items-center relative"
              onSubmit={sendMessage}>
              <input
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                type="text"
                onKeyDown={handleKeyDown}
                placeholder="Type here..."
                className="bg-[#212226] overflow-y-scroll middle scroll-text text-balance box flex-grow h-12 border text-white text-md caret-blue-500 hover:outline-blue-500 hover:outline-1 border-[#212226] px-2 py-1 placeholder:text-gray-500 placeholder:text-lg rounded-md outline-none focus:outline-blue-500 focus:outline-1"
              />

              <button
                type="button"
                onMouseEnter={handleMouseEnter}
                onClick={toggleEmojiPicker}
                className="bg-[#212226] cursor-pointer border border-gray-600 text-white text-2xl rounded-xl -ml-1 p-2 h-12 w-12 flex items-center justify-center hover:bg-gray-700 active:bg-gray-400">
                <FaSmile />
              </button>
              <div
                onMouseLeave={handleMouseLeave}
                className="picker-container absolute bottom-16 right-4">
                {showPicker && (
                  <Picker
                    width="25rem"
                    height="28rem"
                    theme="auto"
                    emojiStyle="native"
                    autoFocusSearch={true}
                    allowExpandReactions={true}
                    onEmojiClick={(emoji) =>
                      setNewMessageText((prev) => prev + emoji.emoji)
                    }
                    reactionsDefaultOpen={false}
                  />
                )}
              </div>

              <label className="bg-[#212226] cursor-pointer border border-gray-600 text-white text-3xl rounded-xl -mx-1 p-2 h-12 w-12 flex items-center justify-center hover:bg-gray-700 active:bg-gray-400">
                <input type="file" className="hidden" onChange={sendFile} />
                <IoAttach className="rotate-45" />
              </label>

              <button
                type="submit"
                className="bg-blue-500 h-12 w-12 flex items-center justify-center p-2 text-white rounded-lg hover:bg-blue-600 active:bg-blue-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                  />
                </svg>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default Chat;
