import React, { useCallback, useEffect, useState } from 'react';
import './room.css';
import { useSocket } from '../context/SocketProvider';
import ReactPlayer from 'react-player';
import peer from "../service/peer";


const Room = () => {
    const socket = useSocket();
    const [remoteSocketId, setremoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState();
    const [remoteStream, setRemoteStream] = useState();

    const handleUserJoined = useCallback(({ email, id }) => {
        console.log(`Email ${email} joined room`);
        setremoteSocketId(id);

    }, []);

    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        const offer = await peer.getOffer();
        socket.emit("user:call", { to: remoteSocketId, offer });
        setMyStream(stream);

    }, [remoteSocketId, socket])

    const handleIncommingCall = useCallback(async ({ from, offer }) => {
        setremoteSocketId(from);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setMyStream(stream);
        console.log(`Incomming Call `, from, offer);
        const ans = await peer.getAnswer(offer);
        socket.emit("call:accepted", { to: from, ans });

    }, [socket]);

    const sendStreams = useCallback(() => {
        for (const track of myStream.getTracks()) {
            peer.peer.addTrack(track, myStream);
        }
    }, [myStream]);

    const handleCallAccepted = useCallback(async ({ from, ans }) => {
        peer.setLocalDescription(ans);
        console.log("Call Accepted!");
        sendStreams();

    }, [sendStreams]);

    const hanldeNegoNeeded = useCallback(async () => {
        const offer = await peer.getOffer();
        socket.emit("peer:nego:needed", { offer, to: remoteSocketId })
    }, [remoteSocketId, socket]);

    useEffect(() => {
        peer.peer.addEventListener('negotiationneeded', hanldeNegoNeeded);

        return () => {
            peer.peer.removeEventListener('negotiationneeded', hanldeNegoNeeded);
        }
    }, [hanldeNegoNeeded]);

    const handleNegoNeededIncomming = useCallback(async ({ from, offer }) => {
        const ans = await peer.getAnswer(offer);
        socket.emit("peer:nego:done", { to: from, ans });
    }, [socket]);



    const hanldeFinalNego = useCallback(async ({ ans }) => {
        await peer.setLocalDescription(ans);
    }, []);

    useEffect(() => {
        peer.peer.addEventListener("track", async (ev) => {
            const remoteStream = ev.streams;
            console.log("GOT TRACKS!!");
            setRemoteStream(remoteStream[0]);
        });
    }, []);


    useEffect(() => {
        socket.on("user:joined", handleUserJoined);
        socket.on("incomming:call", handleIncommingCall);
        socket.on("call:accepted", handleCallAccepted);
        socket.on("peer:nego:needed", handleNegoNeededIncomming);
        socket.on("peer:nego:final", hanldeFinalNego);

        return () => {
            socket.off("user:joined", handleUserJoined);
            socket.off("incomming:call", handleIncommingCall);
            socket.off("call:accepted", handleCallAccepted);
            socket.off("peer:nego:needed", handleNegoNeededIncomming);
            socket.off("peer:nego:final", hanldeFinalNego);
        }
    }, [socket, handleUserJoined, handleIncommingCall, handleCallAccepted, handleNegoNeededIncomming, hanldeFinalNego]);

    return (
        <div className='room-main'>
            <div className="room-top">
                <h1>Room</h1>
                <h4>{remoteSocketId ? 'Connected' : 'No one in room'}</h4>
                <div className="buttons">
                    {myStream && <button className='btn' onClick={sendStreams}>Send Stream</button>}
                    {
                        remoteSocketId && <button className='btn' onClick={handleCallUser}>CALL</button>
                    }
                </div>
            </div>

            <div className="screen">
                <div className="room1">
                    {
                        myStream && (
                            <>
                                <h1>My Stream</h1>
                                <ReactPlayer playing muted height="300px" width="500px" url={myStream} />
                            </>

                        )
                    }
                </div>

                <div className="room2">
                    {
                        remoteStream && (
                            <>
                                <h1>Remote Stream</h1>
                                <ReactPlayer playing muted height="300px" width="500px" url={remoteStream} />
                            </>
                        )
                    }
                </div>
            </div>
        </div>
    )
}

export default Room;