const myVideo = document.getElementById('my-video');
const videoGrid = document.getElementById('video-grid');

let localStream;

const iceServers = [
    {
        urls: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
            'stun:stun3.l.google.com:19302',
            'stun:stun4.l.google.com:19302',
        ]
    }
];

const socket = io();
const room = window.location.href.split('/').pop();

init();

socket.emit('join-room', room);

socket.on('new-user', async (id) => {
    console.log(id);

    const myPeerConnection = createPeerConnection({targetId: id});
    localStream = await getLocalStream();

    localStream.getTracks().forEach((track) => {
        myPeerConnection.addTrack(track, localStream);
    });

    socket.on('video-answer', (data) => {
        console.log('answer', data);

        const desc = new RTCSessionDescription(data.sdp);
        myPeerConnection.setRemoteDescription(desc);
    })
});

socket.on('video-offer-receive', async (data) => {
    console.log(data);

    const myPeerConnection = createPeerConnection({targetId: data.sender});
    localStream = await getLocalStream();

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
        sdp: myPeerConnection.localDescription
    });
})

async function init() {
    localStream = await getLocalStream();
    myVideo.srcObject = localStream;
}

async function getLocalStream () {
    if(localStream) return localStream;

    localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
    return localStream;
}

function createPeerConnection(options) {
    const myPeerConnection = new RTCPeerConnection({
      iceServers: iceServers
    });

    addPeerConnectionEventHandlers(myPeerConnection, options);
  
    //myPeerConnection.onicecandidate = handleICECandidateEvent;
    //myPeerConnection.ontrack = handleTrackEvent;
    //myPeerConnection.onnegotiationneeded = handleNegotiationNeededEvent;

    return myPeerConnection;
}

function addPeerConnectionEventHandlers(peerConnection, {targetId}) {
    peerConnection.onnegotiationneeded = async () => {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
    
        socket.emit('video-offer', {
            sender: socket.id,
            target: targetId,
            sdp: peerConnection.localDescription
        });
    }

    peerConnection.onicecandidate = (event) => {
        if(event.candidate) {
            socket.emit('new-ice-candidate', {
                sender: socket.id,
                target: targetId, 
                candidate: event.candidate
            });
        }
    }

    peerConnection.ontrack = (event) => {
        const video = document.getElementById(targetId);

        if(video) {
            video.srcObject = event.streams[0];
        }
        else {
            const newVideo = myVideo.cloneNode();
            newVideo.srcObject = event.streams[0];
            newVideo.id = targetId;
    
            videoGrid.appendChild(newVideo);
        }

        console.log('ontrack', targetId)
        console.log(event)
    }

    socket.on('receive-ice-candidate', (data) => {
        if(data.target === socket.id) {
            const candidate = new RTCIceCandidate(data.candidate);

            peerConnection.addIceCandidate(candidate);
        }
    })
}
