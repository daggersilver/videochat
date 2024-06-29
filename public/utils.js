async function getLocalStream () {
    const localStream = await navigator.mediaDevices.getUserMedia({video:true, audio: true});
    return localStream;
}

function resetVideoSize() {
    // add dynamic video size based on number of participants
}