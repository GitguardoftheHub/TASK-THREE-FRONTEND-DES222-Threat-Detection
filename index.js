// hard-code the backend server
let backendURL = 'https://task-three-backend-des-222-threat-d.vercel.app/'

//-----  Code for accessing the camera -----//
let width = 320;    // We will scale the photo width to this
let height = 0;     // This will be computed based on the input stream
let streaming = false;
let videoAspectRatio = 1.6;
let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let output = document.getElementById('photoFrame');
let photo = document.getElementById('photo');
let requestButton = document.getElementById('requestButton');
let takePhotoButton = document.getElementById('takePhotoButton');
let imageDescription = document.getElementById('imageDescription');
let homeNav = document.getElementById('homeNav');
let homeButton = document.getElementById('homeButton');
let description = document.getElementById('descriptionPanel');
let cameraPanel = document.getElementById('cameraPanel');
let photoPanel = document.getElementById('photoPanel');


function clearphoto() {
    const context = canvas.getContext("2d");
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const dataURL = canvas.toDataURL("image/png");
    photo.setAttribute("src", dataURL);
}

async function takepicture() {
    const context = canvas.getContext("2d");
    if (width && height) {
        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);

        const dataURL = canvas.toDataURL("image/png");
        photo.setAttribute("src", dataURL);

        // request AI analysis
        try {
            const response = await fetch(backendURL, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ imageURL: dataURL })
              });

            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            const json = await response.json();
            console.log(json);
            imageDescription.textContent = json['description'];
            showPhotoView();

        } catch (error) {
            console.error(error.message);
        }

    } else {
        clearphoto();
    }
}


async function setupCameraExample() {
    // Request camera stream and wait until the video can play before resolving.
    let stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = stream;
    video.play();

    // Wait for the video to be ready (canplay) so width/height are available.
    await new Promise((resolve) => {
        const onCanPlay = () => {
            if (!streaming) {
                width = video.videoWidth || width;
                height = video.videoHeight || height;
                if (video.videoWidth && video.videoHeight) {
                    videoAspectRatio = video.videoWidth / video.videoHeight;
                }
                resizeCameraExample();
                streaming = true;
            }
            video.removeEventListener('canplay', onCanPlay);
            resolve();
        };

        video.addEventListener('canplay', onCanPlay, false);

        // Fallback: resolve after a short timeout in case 'canplay' doesn't fire quickly.
        setTimeout(() => {
            video.removeEventListener('canplay', onCanPlay);
            resolve();
        }, 1500);
    });

    clearphoto();
    window.addEventListener('resize', resizeCameraExample);

}


function showLiveCameraView() {
    cameraPanel.setAttribute('style', 'display: flex');
    photoPanel.setAttribute('style', 'display: none');   
    homeNav.setAttribute('style', 'display: none');
}

function showPhotoView() {
    cameraPanel.setAttribute('style', 'display: none');
    photoPanel.setAttribute('style', 'display: flex');
    homeNav.setAttribute('style', 'display: flex');
}


function resizeCameraExample() {
    // Find the usable width and height
    let w = document.documentElement.clientWidth;
    let h = document.documentElement.clientHeight;   

    let fitsHorizontally = (0.95 * h * videoAspectRatio < w);

    if (fitsHorizontally) {
        video.setAttribute("height", 0.95 * h);
        video.setAttribute("width", 0.95 * h * videoAspectRatio);
        canvas.setAttribute("height", 0.95 * h);
        canvas.setAttribute("width", 0.95 * h * videoAspectRatio);
    
        photo.setAttribute('style', `width: ${0.95 * h * videoAspectRatio}px; height: ${0.95 * h}px;`);
        description.setAttribute('style', `width: ${0.95 * h * videoAspectRatio}px; height: ${0.95 * h}px;`);

    } else {
    
        video.setAttribute("width", 0.95 * w);
        video.setAttribute("height", 0.95 * w / videoAspectRatio);
        canvas.setAttribute("width", 0.95 * w);
        canvas.setAttribute("height", 0.95 * w / videoAspectRatio);
        photo.setAttribute('style', `width: ${0.95 * w}px; height: ${0.95 * w / videoAspectRatio}px;`);
        description.setAttribute('style', `width: ${0.95 * w}px; height: ${0.95 * w / videoAspectRatio}px;`);

    }
}

  
takePhotoButton.addEventListener(
    "click",
    (ev) => {
        takepicture();
        ev.preventDefault();
    },
    false,
);


requestButton.addEventListener(
    "click",
    async (ev) => {
        ev.preventDefault();
        // Start camera and auto-capture once ready.
        await setupCameraExample();
        requestButton.setAttribute('style', 'display: none;');
        cameraPanel.setAttribute('style', 'display: flex;');

        // Small delay to ensure a video frame is painted, then capture automatically.
        setTimeout(() => {
            takepicture();
        }, 250);
    }
);


homeButton.addEventListener('click', async (event) => {
    showLiveCameraView();

    // If camera not already streaming, set it up; otherwise just capture.
    if (!streaming) {
        try {
            await setupCameraExample();
        } catch (err) {
            console.error('Failed to restart camera', err.message || err);
            return;
        }
    }

    // Small delay to ensure a video frame is painted, then capture automatically.
    setTimeout(() => {
        takepicture();
    }, 250);
});