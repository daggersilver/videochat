const myVideo = document.getElementById('my-video');
const videoGrid = document.getElementById('video-grid');

let localStream;

const socket = io();
const room = window.location.href.split('/').pop();

init();

let connections = [];

socket.emit('join-room', room);

socket.on('new-user', async (id) => {
    const myPeerConnection = createPeerConnection({targetId: id, id: socket.id});
    connections.push(myPeerConnection);

    localStream.getTracks().forEach((track) => {
        myPeerConnection.addTrack(track, localStream);
    });

});

socket.on('user-left', (id) => {
    document.getElementById(id).remove();

    const connectionToRemove = connections.find((conn) => conn.peerId == id);
    connectionToRemove.connection.close();

    connections = connections.filter((conn) => conn.peerId != id);
})

socket.on('video-answer', async (data) => {
    const peerConnection = connections.find((pc) => pc.peerId === data.sender);

    const desc = new RTCSessionDescription(data.sdp);
    await peerConnection.setRemoteDescription(desc);
})

socket.on('video-offer-receive', async (data) => {
    const myPeerConnection = createPeerConnection({targetId: data.sender, id: socket.id});
    connections.push(myPeerConnection);
    localStream = await getLocalStream({audio: true, video: true});

    localStream.getTracks().forEach((track) => {
        myPeerConnection.addTrack(track, localStream);
    });

    const desc = new RTCSessionDescription(data.sdp);
    await myPeerConnection.setRemoteDescription(desc);

    
    const answer = await myPeerConnection.createAnswer();
    await myPeerConnection.setLocalDescription(answer);

    socket.emit('video-answer', {
        sender: socket.id,
        target: data.sender,
        sdp: myPeerConnection.getLocalDescription() //localDescription
    });
})

async function init() {
    localStream = await getLocalStream();
    myVideo.srcObject = localStream;
}

function createPeerConnection({id, targetId}) {
    return new PeerConnection(id, targetId);
}

async function updateCamStatus(enable) {
    const videoTrack = localStream.getTracks().find(track => track.kind === 'video');

    videoTrack.enabled = enable;
    myVideo.srcObject = localStream;
}

async function updateMicStatus(enable) {
    const audioTracks = localStream.getTracks();
    const audioTrack = audioTracks.find(track => track.kind === 'audio');

    audioTrack.enabled = enable;
}
