let recognizer = null;
let enhancer = null;
let overlay = null;
let context = null;
let dotnetHelper = null;
let videoSelect = null;
let cameraInfo = {};
let videoContainer = null;

function initOverlay(ol) {
    overlay = ol;
    context = overlay.getContext('2d');
}

function updateOverlay(width, height) {
    if (overlay) {
        overlay.width = width;
        overlay.height = height;
        clearOverlay();
    }
}

function clearOverlay() {
    if (context) {
        context.clearRect(0, 0, overlay.width, overlay.height);
        context.strokeStyle = '#ff0000';
        context.lineWidth = 5;
    }
}

function drawOverlay(points, text) {
    if (context) {
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        context.lineTo(points[1].x, points[1].y);
        context.lineTo(points[2].x, points[2].y);
        context.lineTo(points[3].x, points[3].y);
        context.lineTo(points[0].x, points[0].y);
        context.stroke();

        context.font = '18px Verdana';
        context.fillStyle = '#ff0000';
        let x = [points[0].x, points[1].x, points[0].x, points[0].x];
        let y = [points[0].y, points[1].y, points[0].y, points[0].y];
        x.sort(function (a, b) {
            return a - b;
        });
        y.sort(function (a, b) {
            return b - a;
        });
        let left = x[0];
        let top = y[0];

        context.fillText(text, left, top);
    }
}

function showResults(results) {
    try {
        let txts = [];
        for (let result of results) {
            if (result.lineResults.length == 2) {
                let lines = result.lineResults;
                let line1 = lines[0].text;
                let line2 = lines[1].text;
                txts.push(line1);
                txts.push(line2);
                console.log(line1);
                console.log(line2);
                // document.getElementById('result').innerHTML = extractMRZInfo(line1, line2);
                drawOverlay(lines[0].location.points, line1);
                drawOverlay(lines[1].location.points, line2);
            }
            else if (result.lineResults.length == 3) {
                let lines = result.lineResults;
                let line1 = lines[0].text;
                let line2 = lines[1].text;
                let line3 = lines[2].text;
                txts.push(line1);
                txts.push(line2);
                txts.push(line3);
                console.log(line1);
                console.log(line2);
                console.log(line3);
                // document.getElementById('result').innerHTML = extractMRZInfo(line1, line2, line3);
                drawOverlay(lines[0].location.points, line1);
                drawOverlay(lines[1].location.points, line2);
                drawOverlay(lines[2].location.points, line3);
            }
        }

        if (txts.length > 0) {
            if (dotnetHelper) {
                dotnetHelper.invokeMethodAsync('ReturnMrzResultsAsync', txts.join('\n'));
            }
        }

    } catch (e) {
        alert(e);
    }
}

function decodeImage(dotnetRef, url, data) {
    const img = new Image()
    img.onload = () => {
        updateOverlay(img.width, img.height);
        if (recognizer) {
            recognizer.recognize(data).then(function (results) {
                showResults(results);
            });

        }
    }
    img.src = url
}

function updateResolution() {
    if (enhancer) {
        let resolution = enhancer.getResolution();
        updateOverlay(resolution[0], resolution[1]);
    }
}

function listCameras(deviceInfos) {
    for (var i = deviceInfos.length - 1; i >= 0; --i) {
        var deviceInfo = deviceInfos[i];
        var option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        option.text = deviceInfo.label;
        cameraInfo[deviceInfo.deviceId] = deviceInfo;
        videoSelect.appendChild(option);
    }
}

async function openCamera() {
    clearOverlay();
    let deviceId = videoSelect.value;
    if (enhancer) {
        await enhancer.selectCamera(cameraInfo[deviceId]);
    }
}

async function init() {
    recognizer = await Dynamsoft.DLR.LabelRecognizer.createInstance();
    await recognizer.updateRuntimeSettingsFromString("MRZ");
}

window.jsFunctions = {
    setImageUsingStreaming: async function setImageUsingStreaming(dotnetRef, overlayId, imageId, imageStream) {
        const arrayBuffer = await imageStream.arrayBuffer();
        const blob = new Blob([arrayBuffer]);
        const url = URL.createObjectURL(blob);
        document.getElementById(imageId).src = url;
        document.getElementById(imageId).style.display = 'block';
        initOverlay(document.getElementById(overlayId));
        if (recognizer) {
            // recognizer.maxCvsSideLength = 9999
            decodeImage(dotnetRef, url, blob);
        }

    },
    initSDK: async function (licenseKey) {
        let result = true;

        if (recognizer != null) {
            return result;
        }
        
        try {
            Dynamsoft.DLR.LabelRecognizer.initLicense(licenseKey);
            
        } catch (e) {
            console.log(e);
            result = false;
        }
        
        await init();

        return result;
    },
    initReader: async function (dotnetRef) {
        dotnetHelper = dotnetRef;
        if (recognizer != null) {
            recognizer.stopScanning();
        }
        else {
            await init();
        }

        return true;
    },
    initScanner: async function (dotnetRef, videoId, selectId, overlayId) {
        if (recognizer == null) {
            await init();
        }
        let canvas = document.getElementById(overlayId);
        initOverlay(canvas);
        videoContainer = document.getElementById(videoId);
        videoSelect = document.getElementById(selectId);
        videoSelect.onchange = openCamera;
        dotnetHelper = dotnetRef;

        try {
            enhancer = await Dynamsoft.DCE.CameraEnhancer.createInstance();
            await enhancer.setUIElement(document.getElementById(videoId));
            await recognizer.setImageSource(enhancer, { });
            await recognizer.startScanning(true);
            let cameras = await enhancer.getAllCameras();
            listCameras(cameras);
            await openCamera();

            recognizer.onImageRead = results => {
                clearOverlay();
                showResults(results);
            };
            enhancer.on("played", playCallBackInfo => {
                updateResolution();
            });

        } catch (e) {
            console.log(e);
            result = false;
        }
        return true;
    },
    selectFile: async function (dotnetRef, overlayId, imageId) {
        initOverlay(document.getElementById(overlayId));
        if (recognizer) {
            let input = document.createElement("input");
            input.type = "file";
            input.onchange = async function () {
                try {
                    let file = input.files[0];
                    var fr = new FileReader();
                    fr.onload = function () {
                        let image = document.getElementById(imageId);
                        image.src = fr.result;
                        image.style.display = 'block';
                        decodeImage(dotnetRef, fr.result, file);
                    }
                    fr.readAsDataURL(file);

                } catch (ex) {
                    alert(ex.message);
                    throw ex;
                }
            };
            input.click();
        } else {
            alert("The mrz reader is still initializing.");
        }
    },
};

