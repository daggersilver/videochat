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

class PeerConnection {
    constructor(id, peerId) {
        this.id = id;
        this.peerId = peerId;

        this.connection = new RTCPeerConnection({
            iceServers: iceServers
        });

        this.connection.onnegotiationneeded = this.handleNegotiation.bind(this);
        this.connection.onicecandidate = this.handleIceCanditate.bind(this);
        this.connection.ontrack = this.handleNewTrack.bind(this);

        socket.on('receive-ice-candidate', async (data) => {
                const candidate = new RTCIceCandidate(data.candidate);
    
                if(this.connection.remoteDescription)
                    await this.connection.addIceCandidate(candidate);
        })
    }

    addTrack(track, stream) {
        this.connection.addTrack(track, stream);
    }

    async setRemoteDescription(description) {
        await this.connection.setRemoteDescription(description);
    }

    async setLocalDescription(description) {
        await this.connection.setLocalDescription(description);
    }

    getLocalDescription() {
        return this.connection.localDescription;
    }

    async createAnswer() {
        return await this.connection.createAnswer();
    }

    async handleNegotiation() {
        const offer = await this.connection.createOffer();
        await this.connection.setLocalDescription(offer);

        socket.emit('video-offer', {
            sender: this.id,
            target: this.peerId,
            sdp: this.connection.localDescription
        });
    }

    handleIceCanditate(event)  {
        setTimeout(() => {
            if(event.candidate) {
                socket.emit('new-ice-candidate', {
                    sender: this.id,
                    target: this.peerId, 
                    candidate: event.candidate
                });
            }
        }, 1000);
    }

    handleNewTrack(event) {
        const video = document.getElementById(this.peerId);

        if(video) {
            video.srcObject = event.streams[0];
        }
        else {
            const newVideo = myVideo.cloneNode();
            newVideo.srcObject = event.streams[0];
            newVideo.id = this.peerId;
    
            document.getElementById('video-grid').appendChild(newVideo);
            resetVideoSize();
        }

    }
}