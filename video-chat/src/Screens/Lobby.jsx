import React, { useCallback, useEffect, useState } from 'react';
import './lobby.css';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketProvider';
const Lobby = () => {

    const [email, setEmail] = useState("");
    const [room, setRoom] = useState("");
    const socket = useSocket();
    const navigate = useNavigate();

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        socket.emit('room:join', { email, room });
    },
        [email, room, socket]
    );

    const handleJoinRoom = useCallback((data) => {
        const { room } = data;
        navigate(`/room/${room}`);
    }, [])

    useEffect(() => {
        socket.on("room:join", handleJoinRoom);
        return () => {
            socket.off("room:join", handleJoinRoom);
        }
    }, [socket, handleJoinRoom]);


    return (
        <div className="container">
            <div className="text">
                JOIN ROOM
            </div>
            <form onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="input-data">
                        <input
                            type="email"
                            id="email"
                            placeholder='Enter your email'
                            value={email}
                            onChange={(e) => { setEmail(e.target.value) }}
                        />
                        <div className="underline" />
                        <label htmlFor>Email Address</label>
                    </div>
                    <div className="input-data">
                        <input
                            type="text"
                            id="room"
                            value={room}
                            placeholder='enter your room id'
                            onChange={(e) => { setRoom(e.target.value) }}
                        />
                        <div className="underline" />
                        <label htmlFor>Room ID</label>
                    </div>
                </div>
                <div className="main-btn">
                    <button type="submit" className='btn-submit'>Join</button>
                </div>

            </form>
        </div>
    )
}

export default Lobby;