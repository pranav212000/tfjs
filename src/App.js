import "./App.css";
import * as tf from "@tensorflow/tfjs";
import * as tfd from "@tensorflow/tfjs-data";
import * as Posenet from "@tensorflow-models/posenet";
import React, { useState } from "react";
import { TextField, Button, Box } from "@material-ui/core";

import {
  drawKeypoints,
  drawSkeleton,
  drawBoundingBox,
  tensorToImage,
  isNumeric,
} from "./utils";

function App() {
  const [isDetecting, setDetecting] = useState(true);
  const [isWebCamActive, setWebCamActive] = useState(false);
  const [minPoseConfidence, setMinPoseConfidence] = useState(0.3);
  const [minPartConfidence, setMinPartConfidence] = useState(0.3);
  const [minPartText, setMinPartText] = useState("0.3");
  let [webcam, setWebCam] = useState(0);
  let isPredicting = false;
  let model;

  const videoWidth = 500;
  const videoHeight = 500;

  const webcamConfig = {
    facingMode: "user",
    resizeWidth: 500,
  };

  document.addEventListener("DOMContentLoaded", (event) => {
    tfd.webcam(document.getElementById("webcam"), webcamConfig).then((cam) => {
      setWebCam(cam);
      console.log("WEBCAM LOADED");
      setWebCamActive(true);
      init();
    });
  });

  // const stopCamera = () => {
  //   if (webcam) {
  //     webcam.stop();
  //   } else {
  //     console.log("NO WEBCAM");
  //   }
  // };

  const toggleWebCamActive = () => {
    if (webcam) {
      if (isWebCamActive) {
        webcam.stop();
        setWebCamActive(false);
      } else {
        webcam.start();
        setWebCamActive(true);
      }
    } else {
      console.log("No WEBCAM");
    }
  };

  // const startCamera = () => {
  //   if (webcam) webcam.start();
  //   else console.log("NO WEBCAM");
  // };

  // const getImage = async function () {
  //   const img = await webcam.capture();
  //   const processedImg = tf.tidy(() =>
  //     img.expandDims(0).toFloat().div(127).sub(1)
  //   );
  //   img.dispose();

  //   return processedImg;
  // };

  const toggleDetecting = () => {
    console.log("TOGGLING from : ", isDetecting);
    if (isDetecting) setDetecting(false);
    else setDetecting(true);

    console.log("to : ", isDetecting);
  };

  // const loadPoseNetModel = async function () {
  //   model = await Posenet.load();
  //   return model;
  // };

  // const predict = async function () {
  //   while (isPredicting) {
  //     const image = await getImage();
  //   }
  // };

  const init = async function () {
    try {
      webcam = await tfd.webcam(
        document.getElementById("webcam"),
        webcamConfig
      );
    } catch (e) {
      console.log(e);
      // TODO print on webpage
      console.log("NO WEBCAM");
      // document.getElementById("no-webcam").style.display = "block";
    }

    const net = await Posenet.load({
      architecture: "MobileNetV1",
      outputStride: 16,
      inputResolution: { width: 640, height: 480 },
      multiplier: 0.75,
    });

    // const pose = await net.estimateSinglePose(await webcam.capture());
    // console.log(pose);

    const imageScaleFactor = 0.5;
    const flipHorizontal = false;
    const outputStride = 16;

    // webcam.capture().then((img) => {
    //   detectPose(img, net);
    //   // img.dispose();
    // });

    detectPose(net);
    // screenShot.dispose();
  };

  async function detectPose(net) {
    const canvas = document.getElementById("output");
    const ctx = canvas.getContext("2d");

    const flipPoseHorizontal = true;

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    while (isDetecting) {
      console.log("IS detecting", isDetecting);
      try {
        const img = await webcam.capture();

        // async function poseDetectionFrame() {
        let poses = [];
        // let minPoseConfidence = 0.3;
        // let minPartConfidence = minPoseConfidence;

        const pose = await net.estimateSinglePose(img);

        poses = poses.concat(pose);
        // TODO take input min pose and part confidence
        // minPoseConfidence = +guiState.singlePoseDetection.minPoseConfidence;
        // minPartConfidence = +guiState.singlePoseDetection.minPartConfidence;

        ctx.clearRect(0, 0, videoWidth, videoHeight);

        // if (guiState.output.showVideo) {
        // tf.browser.toPixels(img, canvas);

        // console.log("IMG : ", img);
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-videoWidth, 0);
        // ctx.drawImage(img, 0, 0, videoWidth, videoHeight);
        tensorToImage(img, ctx);
        ctx.restore();
        // }

        poses.forEach(({ score, keypoints }) => {
          // if (score >= minPoseConfidence) {
          // if (guiState.output.showPoints) {
          drawKeypoints(keypoints, minPartConfidence, ctx);
          // }
          // if (guiState.output.showSkeleton) {
          drawSkeleton(keypoints, minPartConfidence, ctx);
          // }
          // if (guiState.output.showBoundingBox) {
          drawBoundingBox(keypoints, ctx);
          // }
          // }
        });
        // tf.browser.toPixels(img, canvas);
        img.dispose();
        await tf.nextFrame();
      } catch (e) {
        console.log(e);
        break;
      }
    }

    // poseDetectionFrame();
  }

  return (
    <div className="App">
      <div>
        {/* <video id="webcam" playsinline style="display: none;"></video> */}
        <video id="webcam" muted width="500" height="500"></video>
        <canvas id="output"></canvas>
      </div>

      {/* <button onClick={stopCamera}>Stop Camera</button>
      <button onClick={startCamera}>Start Camera</button> */}
      <form
        style={{
          margin: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        noValidate
        autoComplete="off"
      >
        <TextField
          id="outlined-basic"
          label="Min Part Confidence"
          variant="outlined"
          value={minPartText}
          onChange={(text) => setMinPartText(text.target.value)}
          error={!isNumeric(minPartText)}
          helperText={
            minPartText === ""
              ? "Please enter a value"
              : !isNumeric(minPartText)
              ? "Please enter valid decimal value"
              : ""
          }
        />
        <Button
          variant="contained"
          style={{ marginLeft: "20px" }}
          color="primary"
          onClick={() => {
            if (isNumeric(minPartText)) {
              setMinPartConfidence(minPartText);
            } else {
              console.log("Not Numeric");
              alert("Not Numeric");
            }
          }}
        >
          Submit
        </Button>
      </form>
      <div>
        <Button
          className="btn btn-primary ptn-sm m-2"
          variant="contained"
          style={{ margin: "20px" }}
          color="secondary"
          onClick={toggleWebCamActive}
        >
          {isWebCamActive ? "Stop" : "Start"} Camera
        </Button>

        <Button
          variant="contained"
          className="btn btn-primary ptn-sm m-2"
          color="secondary"
          onClick={() => toggleDetecting()}
        >
          {isDetecting ? "Stop detecting" : "Start detecting"}
        </Button>
      </div>
    </div>
  );
}

export default App;
