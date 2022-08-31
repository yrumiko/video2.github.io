// 参照
const roomId = document.getElementById("js-room-id");
const remoteVideos = document.getElementById("js-remote-streams");

// ピアの準備
const peer = new Peer({
  key: "591a63b2-beb2-4769-abb5-fed55a3dbf0b",
  debug: 3,
});
// PeerID取得時に呼ばれる
peer.on("open", () => {
  document.getElementById("my-id").textContent = peer.id;
});

// カメラ映像の取得
let localStream;
navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  // 成功時
  .then((stream) => {
    // video要素でカメラ映像を再生
    const videoElm = document.getElementById("my-video");
    videoElm.srcObject = stream;
    videoElm.play();

    // ストリームの保持
    localStream = stream;
  })
  // エラー時
  .catch((error) => {
    console.error("カメラ映像の取得失敗:", error);
    return;
  });

// 接続ボタン押下時に呼ばれる
document.getElementById("js-join-trigger").onclick = () => {
  if (!peer.open) return;

  // ルームへの接続
  const room = peer.joinRoom(roomId.value, {
    mode: "mesh", // mesh or sfu
    stream: localStream,
  });
  // ルーム接続時に呼ばれる
  room.once("open", () => {
    console.log("=== You joined ===");
  });

  // ルーム切断時に呼ばれる
  room.once("close", () => {
    console.log("== You left ===");
    Array.from(remoteVideos.children).forEach((remoteVideo) => {
      remoteVideo.srcObject.getTracks().forEach((track) => track.stop());
      remoteVideo.srcObject = null;
      remoteVideo.remove();
    });
  });

  // ピア接続時に呼ばれる
  room.on("peerJoin", (peerId) => {
    console.log("=== " + peerId + " joined ===");
  });

  // ピアのストリーム取得時に呼ばれる
  room.on("stream", async (stream) => {
    // ピアのvideo要素の追加
    const newVideo = document.createElement("video");
    newVideo.srcObject = stream;
    newVideo.playsInline = true;
    newVideo.setAttribute("data-peer-id", stream.peerId);
    newVideo.setAttribute("width", "400px");
    remoteVideos.append(newVideo);
    await newVideo.play().catch(console.error);
  });

  // ピア切断時に呼ばれる
  room.on("peerLeave", (peerId) => {
    // ピアのvideo要素の削除
    const remoteVideo = remoteVideos.querySelector(
      `[data-peer-id="${peerId}"]`
    );
    remoteVideo.srcObject.getTracks().forEach((track) => track.stop());
    remoteVideo.srcObject = null;
    remoteVideo.remove();
    console.log("=== " + peerId + " left ===");
  });

  // 切断ボタン押下時に呼ばれる
  document.getElementById("js-leave-trigger").onclick = () => {
    room.close();
  };
};
